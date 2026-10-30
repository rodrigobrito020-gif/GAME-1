CREATE TABLE "Character" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "data" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");
CREATE TABLE "Session" ("tokenHash" TEXT NOT NULL PRIMARY KEY, "characterId" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, CONSTRAINT "Session_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE);
