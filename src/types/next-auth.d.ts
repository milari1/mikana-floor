import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/roles';

declare module 'next-auth' {
  interface User {
    role: Role;
    siteId?: string | null;
  }

  interface Session {
    user: {
      role: Role;
      siteId?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    siteId?: string | null;
  }
}
