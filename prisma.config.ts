import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
export default defineConfig({
  schema: "prisma/schema.prisma",
  experimental: { adapter: true },
  engine: "js",
  adapter: async () =>
    new PrismaLibSQL({
      url:
        process.env.DATABASE_URL?.replace("file:./", "file:./prisma/") ??
        "file:./prisma/dev.db",
    }),
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
});
