import 'dotenv/config';
import { connectDatabase, getDb, saveDatabase, recordAuditLog } from '../db/store.ts';
import { hashPassword } from '../utils/security.ts';
import { validatePasswordStrength } from '../../src/utils/platformLogic.ts';

async function seedInitialAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || 'Keerthi Admin';

  if (!email || !password) {
    console.error(
      'Error: INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD environment variables are required to run seed:admin.'
    );
    process.exit(1);
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    console.error(`Error: INITIAL_ADMIN_PASSWORD does not meet security policy: ${strength.message}`);
    process.exit(1);
  }

  await connectDatabase();
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const existing = db.users.find((u) => u.email.toLowerCase() === email);

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = 'Admin';
    existing.status = 'Active';
    existing.updatedAt = new Date().toISOString();
    console.log(`[Seed] Updated existing Admin account for ${email}`);
  } else {
    db.users.unshift({
      id: `usr-admin-${Date.now()}`,
      name,
      email,
      passwordHash,
      role: 'Admin',
      status: 'Active',
      avatarUrl: '/assets/media/keerthi-avatar.png',
      bio: 'Platform Administrator',
      emailVerified: true,
      notificationPreferences: {
        featuredBlogs: true,
        newPrompts: true,
        communityAnnouncements: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Seed] Created initial Admin account for ${email}`);
  }

  recordAuditLog({
    actorId: 'cli-seed-admin',
    actorEmail: email,
    action: 'ADMIN_SEED_COMMAND_EXECUTED',
    targetType: 'User',
    targetId: email,
    details: 'Seeded initial admin account from environment variables.',
  });

  saveDatabase();
  process.exit(0);
}

seedInitialAdmin().catch((err) => {
  console.error('[Seed] Failed to seed admin:', err);
  process.exit(1);
});
