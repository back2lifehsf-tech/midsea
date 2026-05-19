import { requireParent } from '@/lib/auth/session';
import { StudentCreateForm } from '@/components/auth/StudentCreateForm';

export default async function NewStudentPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  // Guard idéntico al resto del espacio del padre — solo PARENT entra.
  await requireParent(locale);
  return <StudentCreateForm />;
}
