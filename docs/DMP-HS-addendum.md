# DMP-HS-addendum — Posicionamiento competitivo para pilot HS Argentina

> **Estado**: addendum activo. Este documento **sobrescribe parcialmente** secciones de `docs/DMP.md` para el alcance del pilot HS Argentina definido en ADR-003. Cuando `docs/DMP.md` y este addendum entren en conflicto, **este addendum gana** dentro del scope HS pilot.
>
> Lo que el DMP original sigue cubriendo intacto: marco general del moat de Angela como tutor agentic bilingüe, principios anti-copia, jerarquía de evitar el patrón "CMS escolar".
>
> Lo que este addendum reemplaza para HS pilot:
> - DMP §2.1 (Miacademy como competidor principal) — Miacademy queda como competidor *secundario* para HS argentino; los principales son Wited + MiaPrep.
> - DMP §2.2 (Wited como competidor regional) — Wited es ahora el competidor #1 con análisis profundo del anti-patrón "paquete cerrado por grado".
> - DMP §2.3 (Time4Learning) — sigue como referencia US-only; menor relevancia para argentino.

---

## 1. Re-mapeo del landscape competitivo para HS argentino

### 1.1 Tier 1 — Competidores directos (HS argentino y región)

| Competidor | Modelo | Precio aprox | Cobertura | Fortalezas | Debilidades centrales |
|---|---|---|---|---|---|
| **Wited** | Plataforma LATAM con currículo escolar tradicional | $20-35 USD/mes equivalente local | K-12 paquete cerrado por grado | Brand awareness en LATAM, contenido sólido en STEM | **Paquete cerrado: el padre paga el grado y no puede sustituir cursos, ni quitar materias, ni elegir.** Sin AI tutor real. Gamificación mínima. UI estilo plataforma escolar. |
| **MiaPrep (Miacademy)** | HS acreditado online | $394 USD/mes (~ARS 400.000 al cambio) | 9°-12° US standards | Acreditado WASC, transcript válido para universidad US, contenido maduro | Precio prohibitivo para argentino medio (10-15× más caro). Solo inglés. Currículo no se adapta a sistema argentino. Sin AI tutor. |
| **Florida Virtual School (FLVS)** | HS gratuito acreditado, residentes FL | Gratis solo FL / $400+ out-of-state | 6°-12° US standards | Gratis para FL residents, acreditado | Solo en inglés, currículo Florida-specific, restrictivo para no-residentes, sin AI, sin gamificación. |
| **K12.com / Connections Academy** | HS online estilo charter | $300+/mes private path | K-12 US standards | Estructura escolar tradicional, soporte humano | Inglés only, currículo no argentino, sin diferenciador AI, modelo rígido. |

### 1.2 Tier 2 — Competidores indirectos

| Competidor | Modelo | Por qué es indirecto |
|---|---|---|
| **Penn Foster High School** | HS online acreditado, self-paced | Self-paced amplio pero sin tutor AI ni gamificación; modelo "lo armás solo". |
| **Outschool** | Marketplace de clases live | Clases live para suplementar homeschooling pero no es curriculum completo. |
| **Khan Academy + AP Classroom** | Gratis, contenido de calidad | Sin curriculum estructurado, sin tracking parental, sin gamificación profunda. |
| **Aprendamos.ar / Apps SEP Argentina** | Plataformas estatales argentinas | Complemento al sistema oficial, no homeschooling completo. |
| **YouTube + worksheets** | DIY libre | Calidad inconsistente, sin estructura ni accountability. |

### 1.3 Tier 3 — Competidores tradicionales (no online)

| Competidor | Modelo | Precio promedio Argentina | Por qué incluirlo |
|---|---|---|---|
| **Colegio bilingüe privado tier 1** | Presencial, bilingüe | $400-1000 USD/mes | Lo que el ICP de Midsea está reemplazando o complementando. |
| **Colegio privado estándar** | Presencial, español | $150-400 USD/mes | Alternativa para padres que dudan del homeschooling pero buscan calidad. |
| **Tutor privado 1:1** | Presencial o Zoom | $15-30 USD/hora | Add-on típico del homeschooling argentino; Midsea reemplaza horas con Angela. |

---

## 2. Wited como anti-patrón principal — análisis profundo

### 2.1 Lo que Wited hace bien

- **Cobertura curricular amplia.** Cubre primaria y secundaria con currículo razonablemente alineado a estándares LATAM.
- **Brand awareness regional.** Padres homeschoolers de LATAM lo conocen, lo investigan, lo comparan.
- **Precio razonable.** Su tier de entrada compite con Midsea ($29 USD/mes Core).
- **Estructura escolar familiar.** Padres conservadores que vienen del sistema tradicional lo encuentran "predecible".

### 2.2 Lo que Wited hace mal — y Midsea explota

**A. Paquete cerrado por grado (el moat #1 anti-Wited)**

En Wited:
- El padre paga "Grado 10°" como SKU único.
- El catálogo de lo que viene dentro del grado NO es visible pre-pago, o es difícil de auditar.
- Una vez pagado, las materias del grado son las que son. No se sustituyen.
- Si el hijo está adelantado en Math pero atrasado en Historia, mala suerte: hace lo del grado o nada.
- Si la familia quiere agregar Inglés ESL que no está en el grado, no se puede.

En Midsea:
- **Catálogo completo visible públicamente** en `/[locale]/catalog` pre-signup.
- **Activación por curso por hijo**, sin restricciones del grado nominal.
- **Múltiples cursos activables sin costo adicional** dentro del plan Core $29.
- **El padre construye el plan exacto** que cada hijo necesita.

Pitch directo en marketing: **"Wited te vende el grado completo. Midsea te deja construir el plan exacto de cada hijo."**

**B. Sin AI tutor real**

Wited tiene asistencia humana asíncrona ("Profe Express") con respuesta en horas/días. No es agentic, no tiene memoria entre sesiones, no adapta el contenido al estudiante.

Midsea tiene Angela: tutor AI con memoria persistente, contexto curricular en tiempo real, capaz de explicar paso-a-paso, detectar frustración (en Epic 02.5+).

Pitch: **"Tu hijo no escribe un mail al profesor y espera 2 días. Le habla a Angela y ella le responde ahora, sabiendo en qué lección está."**

**C. Gamificación inexistente o cosmética**

Wited tiene tracking de progreso básico. Sin economía interna, sin tienda, sin moneda que el estudiante "gane" y "gaste".

Midsea tiene Coin como moneda económica real (ADR-004): se gana por mastery ≥80%, se gasta desbloqueando cursos premium en la tienda.

Pitch: **"En Wited estudias para terminar. En Midsea estudiar te abre más oportunidades."**

**D. UI estilo plataforma escolar (no producto consumer)**

Wited se ve como una intranet escolar de 2018. Densidad de información, navegación por menús anidados, sin atención a UX moderno.

Midsea se ve y se siente como un producto consumer 2026: mobile-first, animaciones cuidadas, navegación por intención (no por jerarquía), command palette.

Pitch visual (no copy): demos lado a lado del dashboard de Wited vs el de Midsea.

### 2.3 Lo que NO debemos copiar de Wited (regla anti-copia para el equipo)

- **No copiar "grado como SKU"**. Repetimos: cursos como unidades activables independientes.
- **No copiar UI densa estilo intranet**. Cards limpias, espacios generosos, foco visual claro.
- **No copiar "asistencia humana asíncrona en horas/días"**. Angela es síncrona, AI, memoria persistente.
- **No copiar reportes parentales como dump de gradebook**. Parent Copilot es "5 minutos / día director ejecutivo", no admin operativo.
- **No copiar el ICP "padres que reproducen el colegio en casa"**. El ICP de Midsea es "padres que eligen explícitamente algo distinto del colegio tradicional".

---

## 3. MiaPrep — análisis del segmento premium

### 3.1 Lo que MiaPrep hace bien

- **Acreditación WASC**. Transcript válido para universidades US, incluyendo Ivy League.
- **Teachers humanos reales** (no AI, no chatbots): clases en vivo, oficinas de horarios para preguntas.
- **Diploma path real**: 4 años, créditos formales, college admissions support.

### 3.2 Por qué Midsea no compite directamente con MiaPrep en pilot

- MiaPrep cobra $394/mes. El segmento que paga eso ya tiene presupuesto Ivy League. Midsea pilot busca $29-45/mes — segmento totalmente distinto.
- Acreditación WASC para Midsea es v3+ (PRD §1.4) — no realista en 10 semanas.
- En pilot, Midsea explícitamente NO promete diploma acreditado; promete "portfolio + transcript transferible" + experiencia educativa moderna a precio asequible.

### 3.3 Plan post-pilot (v2+) vs MiaPrep

- **v1.5**: Midsea agrega capa de "preparación universitaria" como cursos premium de tienda Coin (preparación CBC universitario argentino, SAT, AP-equivalentes). Sigue siendo $29-45/mes + Coin packs opcionales.
- **v2**: Midsea explora partnership con institución acreditadora (Cognia, WASC, o equivalente argentino) para emitir transcripts oficiales. Esto puede ser un tier nuevo ($79-99/mes "Diploma") que compite con MiaPrep al 25% del precio.
- **v3**: Midsea ofrece diploma acreditado completo. Compete frontalmente con MiaPrep.

Pitch transicional (de pilot a v2): **"Hoy Midsea es la mejor experiencia educativa en español por $29/mes. En 18 meses, también te damos el diploma."**

---

## 4. Miacademy en el contexto HS argentino

DMP §2.1 trataba a Miacademy como competidor principal. En el contexto HS argentino, Miacademy:

- Solo cubre K-8 (HS está en MiaPrep, separado).
- Solo en inglés (frustrante para hijo hispanohablante).
- Gamificación cosmética (gold para avatar), no económica.

**Conclusión**: Miacademy NO es competidor relevante para Midsea HS Argentina. Su contenido HS es MiaPrep (cubierto arriba). Su K-8 cubierto en inglés es relevante solo para US Hispanic K-8 — que es v1.1 de Midsea, no pilot.

---

## 5. Time4Learning — relevancia residual

Time4Learning sirve K-12 en EE.UU. con currículo flexible-ish (más que Wited, menos que Midsea). Precio $30-40/mes. Solo inglés. Sin AI tutor. Sin gamificación profunda.

**Conclusión**: relevante como referencia de UX y de pricing benchmark en US Hispanic, no como competidor directo en pilot Argentina.

---

## 6. Resumen: los cuatro moats de Midsea HS para el pilot

Recopilados de los 4 ADRs:

1. **Catálogo a la carta (ADR-005)** — Wited vende paquete cerrado, Midsea deja construir el plan exacto.
2. **Coin como moneda económica (ADR-004)** — Nadie en HS hispano lo hace; convierte gamificación en moat real.
3. **Angela AI tutor agentic** — Sin competidor real en HS español; closest competitor (MiaPrep) usa humanos asíncronos caros.
4. **Bilingüe nativo es/en con contenido curado** — Wited monolingüe; MiaPrep solo inglés; Miacademy K-8 solo inglés.

Pitch unificado de 1 línea (para landing + ads): **"Midsea: cada hijo, su propio plan. Angela como coach 24/7. El esfuerzo se vuelve más oportunidades. En español, desde $29 al mes."**

---

## 7. Lo que el founder debe saber del segmento argentino

### 7.1 Regulación de homeschooling en Argentina (actualizado mayo 2026)

- **Argentina no tiene ley nacional explícita** que regule homeschooling. La situación es jurisprudencial y depende de jurisdicción provincial.
- **Buenos Aires + CABA**: homeschooling no está formalmente reconocido pero existen casos de "escuela en casa" tolerados, especialmente cuando hay (a) padre profesional, (b) niño con NEE, (c) familia itinerante (deportistas, artistas), (d) padres extranjeros con currículo distinto.
- **Provincias del interior**: tolerancia variable. Mendoza, Córdoba, Salta tienen padres homeschoolers activos.
- **Validación de transcripts**: para volver al sistema o ir a universidad, el padre debe coordinar con el Ministerio de Educación provincial para "exámenes libres" o equivalencia de saberes. Midsea facilita esto generando portfolio + reportes en v1.1 (no v1 pilot).

**Disclaimer obligatorio en signup**: "Midsea es una plataforma educativa complementaria. La validación legal de la educación de tu hijo es responsabilidad del padre/tutor según la jurisdicción aplicable. Te recomendamos consultar con el Ministerio de Educación provincial sobre exámenes libres y equivalencias."

### 7.2 Pricing en pesos argentinos

- Stripe puede cobrar en USD desde tarjeta argentina (con percepción AFIP). Padre paga $29 USD, su tarjeta debita ~ARS 35.000 al cambio del día + impuesto país 30% = ~ARS 45.500 (mayo 2026).
- **No es trivial**. Es ~50% del salario mínimo argentino. Compite contra colegio privado argentino estándar ($150-400 USD/mes equivalente), pero no es ganga.
- **Sweet spot del ICP argentino**: padre con ingreso medio-alto en USD o vinculado al exterior (freelance, exportadores, expats). O padre que ya está pagando $300+/mes de colegio privado y busca alternativa drásticamente más barata.

### 7.3 Diáspora argentina como mercado paralelo

- Argentinos en España (~250K), US (~290K), México (~30K), Brasil (~40K), Chile (~70K).
- Razones para homeschooling en diáspora: preservar identidad cultural argentina, currículo familiar, hijos que viajan, regreso eventual a Argentina.
- **"Historia de Argentina" como materia es un diferenciador único** para este segmento. Ninguna plataforma US/europea lo ofrece.
- Pitch para diáspora: **"Mantén la educación argentina de tus hijos desde donde estés. Plataforma moderna, en español rioplatense, con Historia de Argentina por las maestras del país, no por Google Translate."**

---

## 8. Anti-patrones específicos a evitar

Lista canónica para que el equipo (founder + Claude Code) no caiga en patrones identificados:

1. **No copiar el paquete-por-grado de Wited.** Cursos como unidades activables.
2. **No subir el precio para acercarse a MiaPrep.** El segmento $29-45 es deliberado.
3. **No prometer acreditación en pilot.** Honestidad sobre el estado regulatorio + path a v2.
4. **No reproducir UI escolar tradicional.** Producto consumer moderno.
5. **No hacer onboarding largo estilo enterprise.** Signup → activar 1 curso → primera lección en <5 min.
6. **No esconder el catálogo detrás del paywall.** Visible público pre-signup.
7. **No usar voseo forzado en EN.** El bilingüe es real; "che" no traduce a "hey, dude".
8. **No copiar gamificación cosmética de Miacademy.** Coin con poder pedagógico, no decoración.
9. **No asumir niño K-6 como ICP.** El ICP en pilot es padre de adolescente argentino, 13-17 años.
10. **No olvidar la diáspora.** Cuando el messaging diga "argentino", debe incluir argentinos fuera de Argentina.

---

*Última actualización: 2026-05-21. Reemplazar/extender cuando: (a) el pilot arroje feedback sobre messaging, (b) entremos a otros países hispanohablantes, (c) v2 incluya acreditación, (d) Wited pivote su modelo.*
