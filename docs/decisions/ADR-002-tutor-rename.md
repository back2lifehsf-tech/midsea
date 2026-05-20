# ADR-002 — Nombre canónico del tutor AI: Angela (no Sylvie)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado (retroactivo) |
| **Fecha de decisión** | Pre-Epic 02, aplicado durante Epic 02 |
| **Fecha de registro** | 2026-05-20 |
| **Decisores** | Founder / Product Lead (Omar) |
| **Supersede** | N/A |
| **Relacionado con** | Epic 02 (Angela MVP), CLAUDE.md §10 (Glosario), AI_TUTOR_SPEC.md §2 |

## Contexto

Durante la planificación inicial de Midsea, el tutor AI fue denominado provisionalmente "Sylvie". Antes de la ejecución del Epic 02 (Tutor MVP), el equipo decidió renombrar el agente a **Angela**, por razones de resonancia cultural con la audiencia hispanohablante y voz de marca alineada con un tutor cercano y accesible. La decisión no se documentó como ADR al momento de tomarla; este documento es retroactivo para trazabilidad.

## Decisión

El nombre canónico del tutor AI de Midsea es **Angela** en todos los contextos visibles al usuario y al código.

- **UI:** "Angela", siempre.
- **Código:** identificadores en inglés sin diacríticos (`AngelaAvatar`, `AngelaChat`, `AngelaWidget`, `useAngela`, `angela-es.ts`).
- **Branding interno:** "Angela, tu tutora AI" en copy. Nunca "Sylvie".
- **Prompts del LLM:** la identidad declarada en el system prompt es "Angela".
- **Variantes regionales:** el nombre no se localiza (en `en` también es "Angela", no "Angie" ni "Sylvie").

## Estado de implementación (verificado 2026-05-20)

**Migrado completamente.** Grep en el repo arroja:
- 37 archivos con referencias a `Angela`/`angela` (código, prompts, docs, diccionarios i18n).
- 5 menciones residuales de "sylvie", todas en `docs/prompts/epic-02-angela-mvp.md` y todas **intencionales**:
  1. Notas históricas explicando la migración (e.g., "feature/sylvie-v1 → renombrado a Angela").
  2. Referencia al nombre del branch `feature/epic-02-sylvie-mvp`, **NO renombrado** por compatibilidad con webhooks de Vercel y PR refs ya creados.

Estas 5 menciones **no se renombran** y se consideran archivo histórico aceptable.

## Acciones residuales

Ninguna. La migración está completa.

**Opcional (no bloqueante):**
- Renombrar el branch `feature/epic-02-sylvie-mvp` a `feature/epic-02-angela-mvp` cuando se haga merge a `develop`. Costo: rotar webhooks de Vercel + actualizar PR refs. Beneficio: limpieza cosmética. **Recomendación: no hacer.** El branch ya está fusionado o por fusionar; el nombre histórico no impacta el código en `develop`.

## Consecuencias

**Positivas.**
- Voz de marca consistente: "Angela" tiene resonancia maternal-cercana en español, alineada con el ICP (madre homeschooler).
- Pronunciación trivial en es/en/pt — escala a portugués (v3+) sin fricción.
- Sin colisión con marcas EdTech existentes en LATAM/España (verificación informal de búsquedas).

**Negativas.**
- El branch histórico `feature/epic-02-sylvie-mvp` queda como artefacto Git con nombre obsoleto. Mitigación: aceptado.
- Documentación pre-rebrand (PRD §1, AI_TUTOR_SPEC §1 — versiones antiguas, si existieran en historial Git) puede tener "Sylvie". Se ignora; la versión actual del repo es la fuente de verdad.

## Alternativas consideradas y descartadas

| Alternativa | Razón del descarte |
|---|---|
| Mantener "Sylvie" | No tiene resonancia cultural hispana; suena europeo-norteamericano. |
| "Sofía" como nombre del tutor | Confusión con nombre de estudiante demo en seed (`Sofía`). |
| "Maya" / "Luna" / "Aura" | Connotaciones astrológicas o new-age no alineadas con la voz educativa. |
| Nombre genérico ("Tu Tutora") | Pierde el personaje. El moat de Midsea vs Wited es que Angela **es alguien**, no un chatbot. |

## Referencias cruzadas

- `CLAUDE.md §10` (Glosario) — define a Angela.
- `docs/AI_TUTOR_SPEC.md §2` — describe la identidad y estados de Angela.
- `docs/DMP.md §2.2` — contrasta a Angela contra Max AI de Wited (chatbot sin memoria, sin identidad).
- `docs/prompts/epic-02-angela-mvp.md` — implementación del MVP de Angela.

---

*Este ADR es retroactivo y se considera cerrado al momento de su escritura.*
