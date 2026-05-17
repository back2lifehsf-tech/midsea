import * as React from 'react';

export function Card({
  className = '',
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={`midsea-card ${className}`}>{children}</section>;
}
