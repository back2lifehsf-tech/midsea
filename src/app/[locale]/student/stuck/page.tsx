import { requireStudent } from '@/lib/auth/session';
import { StuckChat } from '@/components/tutoring/angela/Chat';

/**
 * /[locale]/student/stuck — Epic 02 §5.
 *
 * Hosts el chat de Angela a pantalla completa.
 *
 * Modelo mental — separación memoria vs UI:
 *   - La MEMORIA de Angela vive en el backend. El endpoint
 *     /api/tutor/chat carga los últimos 20 turnos del estudiante (via
 *     StudentContextEngine) y los manda como contexto a OpenAI cada
 *     vez. Angela reconoce nombre, grado y conversaciones previas.
 *   - La UI del chat empieza LIMPIA en cada visita a /stuck. El
 *     estudiante NO ve el muro de mensajes pasados; cada entrada se
 *     siente como "nueva pregunta". Si quiere refrescar memoria,
 *     puede preguntarle a Angela ("¿recuerdas lo que hablamos ayer?")
 *     y Angela referenciará porque tiene esos turnos en su contexto.
 *
 * Epic 03+: cognitive profile + emotion detection + retrieval por
 * relevancia (RAG sobre conversation history) en vez de últimos N.
 */
export default async function StuckPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const student = await requireStudent(locale);

  return (
    <StuckChat initialMessages={[]} studentName={student.displayName} />
  );
}
