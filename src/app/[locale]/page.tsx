import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustBar } from '@/components/landing/TrustBar';
import { WhyMidseaSection } from '@/components/landing/WhyMidseaSection';
import { CurriculumSection } from '@/components/landing/CurriculumSection';
import { LearnersSection } from '@/components/landing/LearnersSection';
import { ParentToolsSection } from '@/components/landing/ParentToolsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

// Landing publica de marketing. Si el visitante ya esta autenticado como
// padre, le saltamos la landing y lo mandamos directo a su dashboard.
export default async function LandingPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const session = await getSession();
  if (session?.user?.parentId) {
    redirect(`/${locale}/parent`);
  }

  return (
    <>
      <LandingNav />
      <main>
        <HeroSection locale={locale} />
        <TrustBar locale={locale} />
        <WhyMidseaSection locale={locale} />
        <CurriculumSection locale={locale} />
        <LearnersSection locale={locale} />
        <ParentToolsSection locale={locale} />
        <TestimonialsSection locale={locale} />
        <PricingSection locale={locale} />
        <FinalCtaSection locale={locale} />
      </main>
      <LandingFooter locale={locale} />
    </>
  );
}
