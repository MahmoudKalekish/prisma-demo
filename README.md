### Prisma Demo

This project is for trying out the [Prisma ORM](https://www.prisma.io/) with a PostgreSQL database.

Please note this was created on a windows PC, while running on WSL2. Keep that in mind if you run into any issues.

#### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) - for running a local PostgreSQL database
- [NodeJS](https://nodejs.org/en/download)
  - This repo was built using NodeJS v24+ (specifically v24.11.1)
  - Either install NodeJS if you don't have it already or switch to any v24+ version using any tool version management utility like `nvm`, `mise`, `asdf`...
- **Optional:** A DB GUI tool like pgAdmin or DBeaver, as it will help browse your database visually - or you can also use the Prisma Studio

#### Getting up and running

First, start a local PostgreSQL database using Docker:

```bash
docker run --name prisma-demo-postgres \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_PASSWORD=postgres \
 -e POSTGRES_DB=appdb \
 -p 5432:5432 \
 -d postgres:18
```

Next, copy the `.env.example` file to `.env`:

```bash
cp .env.sample .env
```

Then, install the dependencies:

```bash
npm install
```

Now, you can generate your Prisma types:

```bash
npx prisma generate
```

Finally, run the attached `seed.ts` script to make sure everything is working fine:

```bash
npx tsx seed.ts
```

#### Commands you might find useful

Create a migration and update the database schema:

```bash
npx prisma migrate dev --name your_migration_name
```

Open the Prisma Studio to visually browse and manage your database:

```bash
npx prisma studio --config ./prisma.config.ts
```

Made a mistake in one of your migrations? No problem, delete the migration folder and reset the database with:

```bash
npx prisma migrate reset
```

#### What you need to do

1. Add a Publisher model, a many-to-one relationship between Publisher and Book.
2. Add a Genre model, a many-to-many relationship between Genre and Book.
3. Add timestamps (createdAt, updatedAt) to all models.

**Bonus Points:** Create a review system where users can leave reviews for books, including a rating and comment.

**Extra Bonus Points** Create a DB `VIEW` for popular books books with an average rating above 4. _Hint:_ you can make use of `npx prisma migrate dev --create-only`
