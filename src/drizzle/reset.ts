import { db } from "./database.ts"
import { categories, courses, users } from "./schema.ts"

async function resetDb(){
    await db.delete(users);
    await db.delete(courses);
    await db.delete(categories);
}

await resetDb();