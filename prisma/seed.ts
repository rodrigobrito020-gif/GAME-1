import "dotenv/config";
import { createDatabase } from "../apps/server/src/db";
const db = createDatabase();
// No shared/default passwords or developer characters in the production database.
console.log(
  "Banco pronto. Crie personagens pela tela inicial. Dados de teste são gerados somente pelo painel DEV autenticado.",
);
await db.$connect();
await db.$disconnect();
