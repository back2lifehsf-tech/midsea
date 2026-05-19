// Module augmentation para que Session.user y JWT lleven el contexto de Midsea.
// Source: nuestra autoridad de identidad es Prisma.Parent + Prisma.Student.
// Epic 01 §4: el JWT carga role + parentId/studentId para enforcement por rol.

import 'next-auth';
import 'next-auth/jwt';

export type MidseaRole = 'PARENT' | 'STUDENT';

declare module 'next-auth' {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      parentId?: string;
      familyId?: string;
      studentId?: string;
      googleSub?: string;
      role?: MidseaRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    parentId?: string;
    familyId?: string;
    studentId?: string;
    googleSub?: string;
    role?: MidseaRole;
  }
}
