import * as React from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'className' | 'children'>;

const styles: Record<Variant, string> = {
  primary:
    'bg-midsea-deep text-white hover:bg-midsea-ocean active:scale-[.98] focus-visible:ring-2 focus-visible:ring-midsea-lagoon',
  ghost:
    'bg-white text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam focus-visible:ring-2 focus-visible:ring-midsea-ocean',
  danger:
    'bg-midsea-coral text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-midsea-coral'
};

export function Button<E extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  className = '',
  children,
  ...rest
}: PolymorphicProps<E>) {
  const Component = (as ?? 'button') as React.ElementType;
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-wave transition outline-none focus-visible:ring-offset-2 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
