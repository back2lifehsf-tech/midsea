import { getTranslations } from 'next-intl/server';
import { requireStudentSpaceAccess } from '@/lib/auth/session';
import { IntentPagePlaceholder } from '@/components/student/IntentPagePlaceholder';

export default async function PrepPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  await requireStudentSpaceAccess(locale);
  const t = await getTranslations({ locale, namespace: 'student.intents' });

  return (
    <IntentPagePlaceholder
      locale={locale}
      intentKey="prep"
      title={t('prep.title')}
      body={t('prep.body')}
      pageBody={t('prep.pageBody')}
      comingSoonLabel={t('prep.comingSoon')}
      backLabel={t('backToDashboard')}
    />
  );
}
