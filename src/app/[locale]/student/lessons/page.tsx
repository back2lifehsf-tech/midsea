import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default async function StudentLessonsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const [tNav, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'student.nav' }),
    getTranslations({ locale, namespace: 'common' })
  ]);
  return <ComingSoon title={tNav('lessons')} body={tCommon('comingSoonBody')} />;
}
