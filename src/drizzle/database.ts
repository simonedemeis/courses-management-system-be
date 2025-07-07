import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from './schema.ts';

const client = createClient({
    url: process.env.DATABASE_URL as string
})

export const db = drizzle(client, {schema: schema});