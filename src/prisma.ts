// src/prisma.ts
import pkg from '@prisma/client';

// Exportamos la clase y creamos una instancia
const { PrismaClient, Prisma } = pkg;
export const prisma = new PrismaClient();
export const { Decimal, PrismaClientKnownRequestError } = Prisma;

// Token para inyección de dependencias
export const PRISMA_TOKEN = 'PRISMA_CLIENT';
export type PrismaType = typeof prisma;
export type DecimalType = typeof Decimal;
