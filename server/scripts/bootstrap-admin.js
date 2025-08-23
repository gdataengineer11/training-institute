// node scripts/bootstrap-admin.js <username> <password> [Full Name] [Role]
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

(async () => {
  const [, , rawUser, rawPass, fullName = 'Admin User', role = 'ADMIN'] = process.argv;
  if (!rawUser || !rawPass) {
    console.error('Usage: node scripts/bootstrap-admin.js <username> <password> [Full Name] [Role]');
    process.exit(1);
  }
  const username = rawUser.trim().toLowerCase();     // <- normalize at write
  const passwordHash = await bcrypt.hash(rawPass, 12);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, fullName, role },
    create: { username, passwordHash, fullName, role }
  });
  console.log(`✔️ Admin upserted: ${user.username} (role=${user.role})`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
