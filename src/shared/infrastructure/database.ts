import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Prisma 7: datasource url is no longer read from schema.prisma.
    // Pass the connection string directly so the client always has it,
    // regardless of the schema file contents.
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Manejo de cierre graceful
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
