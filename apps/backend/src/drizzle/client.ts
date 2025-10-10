import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/chatdb';

const queryClient = postgres(DATABASE_URL, { max: 10 });
export const db = drizzle(queryClient);

export async function initDatabase() {
  await queryClient`CREATE EXTENSION IF NOT EXISTS vector;`;
}
