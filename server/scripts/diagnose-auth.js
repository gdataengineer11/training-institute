// node scripts/diagnose-auth.js <username> <password>
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function run() {
  const [, , username, password] = process.argv;
  if (!username || !password) {
    console.error('Usage: node scripts/diagnose-auth.js <username> <password>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.log('User not found:', username);
    process.exit(2);
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log({ username: user.username, role: user.role, hashPrefix: user.passwordHash.slice(0,7), passwordMatches: ok });
}
run().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
