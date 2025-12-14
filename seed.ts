import { faker } from "@faker-js/faker";

import { prisma } from "./lib/prisma";

function sampleUnique<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  faker.helpers.shuffle(copy);
  return copy.slice(0, Math.min(count, copy.length));
}

async function main() {
  // 1) Clean existing data (order matters due to FK constraints)
  // this to delete child ... parent: Review → Book → Genre → Publisher → Author → User because of the foreign key
  await prisma.review.deleteMany();
  // Implicit many-to-many join rows are deleted automatically when books are deleted.
  await prisma.book.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();

  // 2) Create Publishers:
  // This creates an array like:
  //   [
  //   { name: "Hyatt Group" },
  //   { name: "Schmidt LLC" },
  //   { name: "Kertzmann and Sons" },
  //   ...
  // ]
  const publisherData = Array.from({ length: 5 }).map(() => ({
    name: faker.company.name(),
  }));

  await prisma.publisher.createMany({ data: publisherData });
  const publishers = await prisma.publisher.findMany();

  // 3) Create Genres
  // Use skipDuplicates because genre names are unique
  const genreData = Array.from({ length: 10 }).map(() => ({
    name: faker.book.genre(),
  }));

  await prisma.genre.createMany({ data: genreData, skipDuplicates: true });
  const genres = await prisma.genre.findMany();

  // 4) Create Authors
  const authorData = Array.from({ length: 8 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));

  await prisma.author.createMany({ data: authorData, skipDuplicates: true });
  const authors = await prisma.author.findMany();

  // 5) Create Books with Publishers + Genres
  // We'll create ~3 books per author
  const createdBooks = [];

  for (const author of authors) {
    for (let i = 0; i < 3; i++) {
      const publisher = faker.helpers.arrayElement(publishers);

      // pick 1..3 genres
      const pickedGenres = sampleUnique(genres, faker.number.int({ min: 1, max: 3 }));

      const book = await prisma.book.create({
        data: {
          title: faker.book.title(),
          authorId: author.id,
          publisherId: publisher.id,
          genres: {
            connect: pickedGenres.map((g) => ({ id: g.id })),
          },
        },
      });

      createdBooks.push(book);
    }
  }

  // 6) Create Users
  // Creates 15 users who can leave reviews.
  const userData = Array.from({ length: 15 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));

  await prisma.user.createMany({ data: userData, skipDuplicates: true });
  const users = await prisma.user.findMany();

  // 7) Create Reviews
  // We want SOME books to end up with avg > 4 so the view returns rows.
  // Strategy: For ~1/3 of books, bias ratings high.
  for (let idx = 0; idx < createdBooks.length; idx++) {
    const book = createdBooks[idx];
    const highChanceBook = idx % 3 === 0;

    // choose 3..8 distinct users to review this book
    const reviewerCount = faker.number.int({ min: 3, max: 8 });
    const reviewers = sampleUnique(users, reviewerCount);

    for (const user of reviewers) {
      const rating = highChanceBook
        ? faker.helpers.weightedArrayElement([
            { weight: 70, value: 5 },
            { weight: 25, value: 4 },
            { weight: 5, value: 3 },
          ])
        : faker.number.int({ min: 1, max: 5 });

      await prisma.review.create({
        data: {
          bookId: book.id,
          userId: user.id,
          rating,
          comment: faker.lorem.sentences({ min: 1, max: 2 }),
        },
      });
    }
  }

  // 8) Log a quick summary
  const authorCount = await prisma.author.count();
  const bookCount = await prisma.book.count();
  const publisherCount = await prisma.publisher.count();
  const genreCount = await prisma.genre.count();
  const userCount = await prisma.user.count();
  const reviewCount = await prisma.review.count();

  console.log({
    authorCount,
    bookCount,
    publisherCount,
    genreCount,
    userCount,
    reviewCount,
  });

  // 9) Query the VIEW (Extra bonus)
  // Prisma doesn't always "know" about views unless you map them.
  // So we use raw SQL:
  const popular = await prisma.$queryRaw<
    Array<{
      bookId: string;
      title: string;
      authorName: string;
      publisherName: string;
      avgRating: number;
      reviewCount: number;
    }>
  >`SELECT * FROM "PopularBook" ORDER BY "avgRating" DESC, "reviewCount" DESC LIMIT 10;`;

  console.log("Popular books (avgRating > 4):");
  console.table(popular);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });