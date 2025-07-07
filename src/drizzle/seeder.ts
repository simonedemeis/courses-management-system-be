import { logger } from "../services/loggerService.ts";
import { db } from "./database.ts";
import { categories, courses, users } from "./schema.ts";
// import * as argon2 from "argon2";
import { hashPassword } from "../lib/utils.ts";

async function seedUsers() {
  const usersList = await db.query.users.findMany();

  if (usersList.length > 0) {
    return logger.warn("Cannot seed users: database already initialized");
  }

  const passwordHash = await hashPassword("@B7lpxQ9!kW2zm");

  await db.insert(users).values({
    id: 1,
    first_name: "Mario",
    last_name: "Rossi",
    email: "mario.rossi@email.com",
    password: passwordHash,
    role: "admin",
  });

  await db.insert(users).values({
    id: 2,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@email.com",
    password: passwordHash,
    role: "user",
  });

  logger.info("Users seeding completed")
}

async function seedCategories() {
  const categoriesList = await db.query.categories.findMany();

  if (categoriesList.length > 0) {
    return logger.warn("Cannot seed categories: database already initialized");
  }

  await db.insert(categories).values({
    id: 1,
    name: "Java"
  })

  await db.insert(categories).values({
    id: 2,
    name: "JavaScript"
  });

  await db.insert(categories).values({
    id: 3,
    name: "Python"
  });

  logger.info("Categories seeding completed")
}

async function seedCourses() {
  const coursesList = await db.query.courses.findMany();

  if (coursesList.length > 0) {
    return logger.warn("Cannot seed courses: database already initialized");
  }

  await db.insert(courses).values({
    category_id: 1,
    description: "Java advanced course",
    duration: 40,
    title: "Java Advanced",
    id: 1
  });

  await db.insert(courses).values({
    category_id: 2,
    description: "JavaScript advanced course",
    duration: 24,
    title: "JavaScript Advanced",
    id: 2
  });

  await db.insert(courses).values({
    category_id: 3,
    description: "Python advanced course",
    duration: 40,
    title: "Python Advanced",
    id: 3
  });

  logger.info("Courses seeding completed")

}

await seedUsers();
await seedCategories();
await seedCourses();