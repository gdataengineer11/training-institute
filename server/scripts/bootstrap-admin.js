// node scripts/bootstrap-admin.js <username> <password> [Full Name] [Role]
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function run() {
  const [, , username, password, fullName = 'Admin User', role = 'ADMIN'] = process.argv;
  if (!username || !password) {
    console.error('Usage: node scripts/bootstrap-admin.js <username> <password> [Full Name] [Role]');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, fullName, role },
    create: { username, passwordHash, fullName, role }
  });
  console.log(`✔️ Admin upserted: ${user.username} (role=${user.role})`);
}
run().catch((e)=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
