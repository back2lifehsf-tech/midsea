import { Card } from './Card';

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <h1 className="font-display text-2xl font-bold text-midsea-deep">{title}</h1>
      <p className="mt-2 text-sm text-midsea-ink/70">{body}</p>
    </Card>
  );
}
