// Module augmentation para que Session.user y JWT lleven el contexto de Midsea.
// Source: nuestra autoridad de identidad es Prisma.Parent (ver authOptions.signIn).

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      parentId?: string;
      familyId?: string;
      googleSub?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    parentId?: string;
    familyId?: string;
    googleSub?: string;
  }
}
