import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
export const rootDir = fileURLToPath(new URL("../../../", import.meta.url));
config({ path: path.join(rootDir, ".env"), quiet: true });
export function createDatabase() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:"))
    throw Error(
      "Esta versão usa SQLite local. PostgreSQL exige trocar o adapter e a migration, não apenas a URL.",
    );
  const filename = url.slice(5),
    absolute = path.isAbsolute(filename)
      ? filename
      : path.resolve(rootDir, "prisma", filename);
  return new PrismaClient({
    adapter: new PrismaLibSQL({ url: pathToFileURL(absolute).href }),
  });
}
