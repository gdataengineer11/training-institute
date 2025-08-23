// node scripts/peek-users.js
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

function redact(url) {
  try {
    const u = new URL(url);
    const host = `${u.hostname}:${u.port || (u.protocol === 'postgres:' ? 5432 : '')}`;
    return `${u.protocol}//${u.username ? u.username + ':***@' : ''}${host}${u.pathname}${u.search}`;
  } catch {
    return '(invalid DATABASE_URL)';
  }
}

const prisma = new PrismaClient();
(async () => {
  console.log('DATABASE_URL =>', redact(process.env.DATABASE_URL || 'MISSING'));
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, passwordHash: true } });
  console.log('Users:', users.map(u => ({ id: u.id, username: u.username, role: u.role, hashPrefix: u.passwordHash.slice(0,7) })));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
