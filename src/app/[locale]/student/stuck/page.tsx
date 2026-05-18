import { getTranslations } from 'next-intl/server';
import { requireStudentSpaceAccess } from '@/lib/auth/session';
import { IntentPagePlaceholder } from '@/components/student/IntentPagePlaceholder';

export default async function StuckPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  await requireStudentSpaceAccess(locale);
  const t = await getTranslations({ locale, namespace: 'student.intents' });

  return (
    <IntentPagePlaceholder
      locale={locale}
      intentKey="stuck"
      title={t('stuck.title')}
      body={t('stuck.body')}
      pageBody={t('stuck.pageBody')}
      comingSoonLabel={t('stuck.comingSoon')}
      backLabel={t('backToDashboard')}
    />
  );
}
