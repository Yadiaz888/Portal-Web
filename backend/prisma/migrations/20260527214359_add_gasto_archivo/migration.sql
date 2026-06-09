-- CreateTable
CREATE TABLE "GastoArchivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gastoId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GastoArchivo_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
