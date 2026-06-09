-- CreateTable
CREATE TABLE "Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "description" TEXT,
    "tipo" TEXT NOT NULL,
    "legalizacionId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Gasto_legalizacionId_fkey" FOREIGN KEY ("legalizacionId") REFERENCES "Legalizacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
