import { faker } from "@faker-js/faker";

import { prisma } from "./lib/prisma";

async function main() {
  // Create a new author with a book
  const author = await prisma.author.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      books: {
        create: {
          title: faker.book.title(),
        },
      },
    },
    include: {
      books: true,
    },
  });

  console.log("Created author:", author);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
