/*
  Warnings:

  - Added the required column `createdById` to the `Gasto` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "description" TEXT,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREADO',
    "legalizacionId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Gasto_legalizacionId_fkey" FOREIGN KEY ("legalizacionId") REFERENCES "Legalizacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Gasto_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Gasto" ("amount", "createdAt", "currency", "deletedAt", "description", "id", "legalizacionId", "tipo", "updatedAt", "status", "createdById") SELECT "amount", "createdAt", "currency", "deletedAt", "description", "id", "legalizacionId", "tipo", "updatedAt", 'CREADO', 1 FROM "Gasto";

DROP TABLE "Gasto";
ALTER TABLE "new_Gasto" RENAME TO "Gasto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
