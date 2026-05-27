# Estado del Proyecto Midsea

> **Fecha de corte:** 2026-05-25
> **Alcance:** Pilot HS LATAM cristiano (8 cursos cubriendo 9°-10°).
> **Método:** evaluación contra el código del repo (`develop` @ HEAD) y el deploy de preview en Vercel. No es una estimación de memoria — cada ítem tiene evidencia verificable.

**Leyenda:** ✅ Completada · 🟡 Parcial / en curso · ❌ Pendiente · ❓ Fuera de repo (admin/infra)

---

## 1. Tareas del cliente

### Desarrollo Web Escuela

| Tarea | Estado | Evidencia / nota |
|---|---|---|
| Página Web escuela | ✅ | Landing completa: Hero + Fidelis, secciones Why/Learners/Curriculum/ParentTools, Pricing, Testimonios, Footer (`src/components/landing/*`) |
| Automatización record-keeping | ❌ | `parent/reports` es placeholder (`ComingSoon`); sin código de boletines/expedientes. Planificado v1.1+ |
| Automatización transcripts | ❌ | No existe código de transcripts/certificados todavía |
| Dominio Web | ❌ | Vercel solo expone subdominios `.vercel.app` (`midsea-pearl…`); falta configurar dominio propio |
| Correo corporativo | ❓ | Tarea de administración (Google Workspace / Zoho), fuera del repo. Asumido no configurado |

### Desarrollo Curriculum

| Tarea | Estado | Evidencia / nota |
|---|---|---|
| Front page Curriculum | ✅ | Landing + catálogo público pre-signup `/catalog` (8 cursos visibles sin login, anti-Wited) |
| Revisión front page Curriculum | ✅ | Iterada: pivot de framing + fix de Pricing (Core/Pro/Family + toggle anual 30%) |
| Login curriculum | ✅ | Auth multi-rol: padre (email+password / Google OAuth) + estudiante (PIN + avatar) |
| Revisión Flujo portal Curriculum | 🟡 | Flujo padre → activar curso → hijo → lección → quiz funciona end-to-end (verificado). Pendientes: `parent/planner`, `parent/settings`, `student/rewards` son placeholders |
| Desarrollo Curriculum High School | ✅ | 8 cursos HS · 280 lecciones generadas, curadas, aprobadas (reviewedBy: Omar) e ingestadas en DB · 280 competencias · 840 preguntas de quiz |
| Revisión Curricular High School | 🟡 | Bulk-approve completado + sitio HTML estático para revisor externo (`scripts/export-review-html.mjs`). Falta revisión pedagógica final/externa |
| Dominio web Midsea | ❌ | Mismo punto que "Dominio Web": sin dominio propio aún |
| Hosting Midsea | ✅ | Vercel (producción `midsea-pearl` + preview `develop`) + base de datos Neon (Postgres) + pipeline de deploy por git |

---

## 2. Completadas — no listadas por el cliente

Trabajo entregado que conviene visibilizar:

- **Tutor AI "Angela"** — chat con streaming SSE, memoria persistente, coach HS, cosmovisión cristiana (es-419 neutro).
- **Lesson Player** — render markdown + fórmulas KaTeX, 4 tipos de actividad (opción múltiple, completar, respuesta corta, ordenar pasos), quiz con scoring autoritativo.
- **Economía Coin** — mastery ≥80% otorga Coin (recompensa idempotente), ledger de transacciones.
- **Billing con Stripe** — suscripciones Core / Pro / Family con checkout inline.
- **Activación de cursos por hijo** — catálogo "a la carta" (anti-patrón de paquete cerrado por grado).
- **Pipeline de generación de contenido** — outline humano → AI → review → ingesta; reutilizable para los cursos de v1.1.
- **i18n es/en** + identidad cristiana embebida (momento de reflexión por lección).

---

## 3. Pendientes clave (no listados explícitamente)

- **Tienda Coin (Epic 05)** — especificación escrita y schema listo; falta UI de tienda, flujo de compra y Coin packs en Stripe.
- **Reportes regulatorios** — cubre las automatizaciones de record-keeping + transcripts.
- **Release a producción** — promover `develop` → `main` siguiendo `docs/runbooks/midsea-release-runbook.md`; producción aún está en código pre-catálogo.
- **14 cursos HS restantes** (v1.1): Mat 11-12, Lengua 11-12, Inglés ESL 11-12, Ciencias adicionales, Historia Mundial I+II, Música 10-12.
- **Dominio propio + correo corporativo + autorizar Google OAuth** en el dominio del deploy.

---

*Documento de estado generado para compartir con el cliente. Actualizar en cada hito relevante. Fuente de verdad del roadmap: `PRD.md`, `docs/decisions/ADR-*.md`, `docs/prompts/epic-*.md`.*
