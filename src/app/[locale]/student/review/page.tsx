import { getTranslations } from 'next-intl/server';
import { requireStudentSpaceAccess } from '@/lib/auth/session';
import { IntentPagePlaceholder } from '@/components/student/IntentPagePlaceholder';

export default async function ReviewPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  await requireStudentSpaceAccess(locale);
  const t = await getTranslations({ locale, namespace: 'student.intents' });

  return (
    <IntentPagePlaceholder
      locale={locale}
      intentKey="review"
      title={t('review.title')}
      body={t('review.body')}
      pageBody={t('review.pageBody')}
      comingSoonLabel={t('review.comingSoon')}
      backLabel={t('backToDashboard')}
    />
  );
}
