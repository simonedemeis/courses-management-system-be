import { categories } from "../drizzle/schema.ts";
import { db } from "../drizzle/database.ts";
import { type Category } from "../lib/types.ts";

export async function getCategories(): Promise<boolean | Category[]> {

  const allCategories: Category[] = await db.select().from(categories);

  if (allCategories.length === 0) {
    return false;
  }

  return allCategories;
}
