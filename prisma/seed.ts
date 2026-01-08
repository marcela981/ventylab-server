import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Aquí puedes agregar datos iniciales para desarrollo
  // Ejemplo:
  
  // const adminUser = await prisma.user.upsert({
  //   where: { email: 'admin@ventylab.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@ventylab.com',
  //     name: 'Admin User',
  //     password: 'hashed_password_here', // Debe estar hasheado
  //     role: 'ADMIN',
  //   },
  // });

  console.log('Seed ejecutado correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

