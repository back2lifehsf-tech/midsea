import { getTranslations } from 'next-intl/server';
import { requireStudentSpaceAccess } from '@/lib/auth/session';
import { IntentPagePlaceholder } from '@/components/student/IntentPagePlaceholder';

export default async function ExplorePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  await requireStudentSpaceAccess(locale);
  const t = await getTranslations({ locale, namespace: 'student.intents' });

  return (
    <IntentPagePlaceholder
      locale={locale}
      intentKey="explore"
      title={t('explore.title')}
      body={t('explore.body')}
      pageBody={t('explore.pageBody')}
      comingSoonLabel={t('explore.comingSoon')}
      backLabel={t('backToDashboard')}
    />
  );
}
