-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matricula" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DELIVERY'
);

-- CreateTable
CREATE TABLE "ItemMapa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mapa" TEXT NOT NULL,
    "motorista" TEXT NOT NULL,
    "codigoItem" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "unidade" TEXT NOT NULL,
    "paleteCompleto" TEXT NOT NULL,
    "baia" TEXT NOT NULL,
    "conferido" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Matinal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomName" TEXT NOT NULL,
    "fixedStartTime" TEXT NOT NULL,
    "actualEndTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");
