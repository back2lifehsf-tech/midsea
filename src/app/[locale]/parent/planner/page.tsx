import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default async function ParentPlannerPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const [tNav, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'parent.nav' }),
    getTranslations({ locale, namespace: 'common' })
  ]);
  return <ComingSoon title={tNav('planner')} body={tCommon('comingSoonBody')} />;
}
