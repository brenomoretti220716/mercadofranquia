import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { generateRandomCharacters } from '../src/utils';

const prisma = new PrismaClient();

async function main() {
  const pass = generateRandomCharacters(16);

  console.log(pass);

  const hashedPassword = await bcrypt.hash(pass, 10);

  // Create Admin User
  await prisma.user.upsert({
    where: { email: 'admin@franchise.com' },
    update: {},
    create: {
      email: 'admin@franchise.com',
      name: 'System Administrator',
      phone: '1234567890',
      cpf: '1234567890',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
