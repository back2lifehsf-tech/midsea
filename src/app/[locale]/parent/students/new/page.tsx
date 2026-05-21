import { redirect } from 'next/navigation';

/**
 * /[locale]/parent/students/new — Epic 03 deprecation.
 *
 * El flujo Epic 01 (formulario standalone con PIN + avatar para crear
 * estudiantes sin cobro) fue reemplazado por `NewStudentDialog` lanzado
 * desde `/parent`. Esta ruta queda como redirect para preservar links
 * viejos (dashboard pre-Epic 03, marcadores, emails).
 *
 * Mantenemos los `searchParams` (plan, cycle) intactos para que el botón
 * "+ Agregar estudiante" en `/parent` pueda preseleccionar plan + ciclo.
 */
export default function LegacyNewStudentRedirect({
  params: { locale },
  searchParams
}: {
  params: { locale: string };
  searchParams: { plan?: string; cycle?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.plan) qs.set('plan', searchParams.plan);
  if (searchParams.cycle) qs.set('cycle', searchParams.cycle);
  const tail = qs.size > 0 ? `?${qs.toString()}` : '';
  redirect(`/${locale}/parent${tail}`);
}
