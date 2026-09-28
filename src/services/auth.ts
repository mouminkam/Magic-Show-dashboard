/**
 * Mock session. There is no real authentication here and there never should be:
 * the console is a demo, so any password of the right length signs you in as
 * the matching seeded admin (or as the owner account if the email is unknown).
 */

import { getDb, nowIso } from '@/mocks/db';
import { avatarImage } from '@/mocks/imagery';
import { respond } from './core';
import { ApiError } from '@/types/api';
import type { UserRole } from '@/types/domain';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export const DEMO_CREDENTIALS = {
  email: 'amira.chalhoub@magicshow.test',
  password: 'magicshow',
} as const;

export const authService = {
  login(email: string, password: string): Promise<SessionUser> {
    if (password.length < 6) {
      throw new ApiError('That password is too short for this account', 401);
    }
    const db = getDb();
    const match =
      db.adminUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ??
      db.adminUsers[0]!;

    if (!match.is_active) {
      throw new ApiError('This account has been deactivated. Contact a super admin.', 403);
    }

    match.last_login_at = nowIso();

    return respond(
      {
        id: match.id,
        name: match.name,
        email: match.email,
        role: match.role,
        avatar: avatarImage(match.name),
      },
      650,
    );
  },

  logout(): Promise<void> {
    return respond(undefined, 200);
  },
};
