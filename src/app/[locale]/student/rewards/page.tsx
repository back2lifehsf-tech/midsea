import { redirect } from 'next/navigation';

// Mejora 9 (Tienda Coin): /student/rewards quedó reemplazada por la tienda
// real. Redirigimos para no romper enlaces/bookmarks viejos.
export default function StudentRewardsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/student/store`);
}
