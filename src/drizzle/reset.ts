import { db } from "./database.ts"
import { categories, courses, users } from "./schema.ts"
import { logger } from "../services/loggerService.ts";

async function resetDb(){
    await db.delete(users);
    await db.delete(courses);
    await db.delete(categories);
    logger.info("Database cleared")
}

await resetDb();