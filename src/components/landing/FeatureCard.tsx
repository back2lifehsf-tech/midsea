import { Card } from '@/components/ui/Card';

export function FeatureCard({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-midsea-foam text-midsea-ocean">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-midsea-deep">{title}</h3>
      <p className="mt-2 text-sm text-midsea-ink/70">{body}</p>
    </Card>
  );
}
