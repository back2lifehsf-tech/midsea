# ADR-007 — Midsea como plataforma cristiana explícita

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-05-21 |
| **Decisores** | Founder / Product Lead (Omar) |
| **Supersede** | PRD §1.3 (ICP "Madre Homeschooler Estratégica" — versión secular implícita) |
| **Relacionado con** | ADR-003 (pivot HS), DMP-HS-addendum (anti-patrones competidores seculares) |
| **Bloquea** | Epic 02.5-HS (tono de Angela), todo el messaging del landing, Epic 06 (assessment regulatorio) |

## Contexto

El audit del contenido curricular del founder (sesión 2026-05-21) reveló un componente cristiano explícito que no estaba documentado en ningún ADR, PRD ni CLAUDE.md. El outline de Inglés ESL Grado 1 declara: *"Metodología: ESL comunicativo, lúdico y cristiano"*, con un "Día 4 = Producción guiada + enfoque cristiano" en la rutina semanal estándar.

Esto no es accidental ni decorativo: es una **decisión pedagógica deliberada del founder** que define el ICP, el tono del tutor AI, el messaging del landing, la dimensión competitiva, y cómo Midsea se diferencia de Wited / Miacademy / MiaPrep / Khan Academy / Time4Learning, todas plataformas seculares.

La decisión confirmada (sesión 2026-05-21): **Midsea es una plataforma cristiana explícita**, no una plataforma secular con módulo cristiano opcional. El componente cristiano vive en el ADN del producto, no es un toggle.

## Decisión

### 1. Midsea es una plataforma de homeschooling **cristiana explícita**

Esto significa:
- **Default cristiano**: el contenido, el tono de Angela, los ejemplos pedagógicos, los marcos de valores, los hands-on de cierre semanal, los textos motivacionales, todo está informado por una cosmovisión cristiana.
- **Sin toggle "modo secular"**: no hay opt-out del componente cristiano. Una familia secular que se inscribe entiende desde el signup que la plataforma es cristiana y elige conscientemente.
- **No es proselitismo**: el contenido cristiano respeta autonomía del estudiante adolescente y no presiona conversión. Es un marco de valores y referencias culturales, no catequesis.
- **Denominacionalmente abierto**: el contenido no es exclusivo de una denominación específica (católico, evangélico, ortodoxo, etc.). Usa referencias cristianas amplias compartidas por la mayoría de tradiciones: Biblia (AT y NT), figuras universales (Jesús, apóstoles), valores cristianos comunes (compasión, integridad, servicio, perdón, gratitud). Familias de cualquier denominación cristiana se sienten en casa.

### 2. ICP refinado para pilot HS LATAM

El ICP del pilot es: **familias cristianas hispanohablantes con hijo en HS (13-17 años), de cualquier país de Latinoamérica + diáspora hispana**.

El lanzamiento inicial se focaliza en Argentina + diáspora argentina por la disponibilidad del contenido base (ver ADR-003 §2), pero el ICP es deliberadamente más amplio: familias cristianas de México, Colombia, Chile, Costa Rica, Perú, República Dominicana, Venezuela, Ecuador, Bolivia, Paraguay, Uruguay, US Hispanic son target válido desde día 1.

Características del ICP:
- **Demográfico**: padres 35-50 años, clase media o media-alta, urbanos o suburbanos, profesionales o emprendedores. Suelen ser bilingües es/en o tienen interés activo en bilingüismo.
- **Identidad religiosa**: cristianos activos (asistencia regular a iglesia, lectura familiar de la Biblia, oración familiar). Denominación variada: católicos, evangélicos, protestantes históricos, ortodoxos. **Denominacionalmente inclusivo a lo largo de LATAM**: católicos romanos predominan en México/Colombia/Argentina/etc., evangélicos crecen en Brasil/Centroamérica/US Hispanic, ortodoxos en comunidades específicas. Midsea sirve a todos.
- **Razones de homeschooling** (común a cristianos LATAM): valores cristianos no compatibles con currículo escolar oficial nacional (educación sexual, ideología de género, enseñanza neutral o anti-religiosa, contenido secular agresivo); búsqueda de educación con propósito; control parental sobre influencias culturales; flexibilidad para integración familiar de fe-vida-aprendizaje; protección de identidad religiosa familiar.
- **Willingness to pay**: $29-45 USD/mes es razonable en LATAM clase media-alta. Comparan favorablemente con colegio cristiano privado local ($150-500 USD/mes equivalente según país) o con homeschooling autogestionado caótico.
- **Decisor**: madre (90% de los casos), padre aprueba. En familias evangélicas a veces el padre es co-decisor activo.
- **Tech savvy**: usan WhatsApp (esencial en LATAM), Facebook, Instagram. Notion, Google Workspace. No son developers. Acostumbrados a SaaS.
- **Idioma**: español LATAM neutro como default. Familias bilingües es/en usan el toggle inglés cuando el hijo lo necesita.

### 3. Cómo se ve el componente cristiano en producto

**En Angela (tono y contenido)**:
- Angela es respetuosa de la fe del estudiante y conoce el marco cristiano. No es pastora ni catequista; es **tutora académica con cosmovisión cristiana coherente**.
- En conversaciones puede referenciar valores cristianos naturalmente cuando son relevantes ("la honestidad es una virtud importante que aparece tanto en Proverbios como en cualquier código ético"). No predica ni proselitiza.
- Si el estudiante pregunta algo de fe directamente, Angela responde con cuidado, refiriendo a sus padres o pastor para profundizar.
- Angela no impone tradiciones específicas (no asume católico ni evangélico). Usa referencias bíblicas compartidas.
- En contenido conflictivo (origen del universo, evolución, ética sexual), Angela presenta perspectivas cristianas mainstream con respeto sin demonizar otras posiciones científicas/seculares — pero deja claro qué es la perspectiva cristiana.

**En el contenido curricular**:
- Lecciones de Lengua incluyen lectura de textos cristianos clásicos cuando apropiado (Salmos como poesía, parábolas como narrativa, C.S. Lewis, Manzoni, Dostoyevski).
- Lecciones de Historia incluyen el rol del cristianismo en la formación de Occidente, Argentina, Latinoamérica.
- Lecciones de Ciencias presentan ciencia rigurosa con marco cristiano respetuoso (perspectivas creación + evolución, ética de investigación con perspectiva cristiana).
- Lecciones de Inglés ESL pueden usar contextos cristianos (versos bíblicos cortos como vocabulary, himnos como listening, cultura cristiana anglosajona como referencia cultural).
- Música incluye repertorio sagrado clásico (gregoriano, Bach, gospel) además del secular.
- Cada lección puede tener un "momento de reflexión" opcional al cierre — un versículo o pregunta que conecte el aprendizaje con valores cristianos sin forzar.

**En el messaging del landing**:
- Headline cristiano explícito sin ser estridente. Ejemplos posibles:
  - *"Educación cristiana de excelencia, en español, donde tu hijo aprende con propósito"*
  - *"Homeschool cristiano bilingüe. Currículo riguroso. Angela como tutora 24/7."*
- Visual: imagery familiar cristiana sutil (no necesariamente cruces explícitas, pero familias, tradición, valores).
- Testimonios: padres y estudiantes cristianos del pilot.
- FAQ aborda: denominación (¿es católico/evangélico?), respuesta: cristiano amplio, todas las tradiciones bienvenidas.

**En el signup**:
- El padre ve durante signup: *"Midsea es una plataforma educativa cristiana. Nuestro contenido refleja valores y cosmovisión cristianos. Si tu familia no comparte estos valores, esta plataforma puede no ser la indicada."* Honestidad por delante.
- No hay toggle "modo secular".

### 4. Mercado y moat competitivo

**El mercado homeschool cristiano hispano es enorme y mal servido**:

- **Argentina**: minoría pero creciente. Comunidades evangélicas (Iglesia Cristiana Bíblica, IURD, ICR) y católicas tradicionalistas activas. Estimado: 8-12% de homeschoolers argentinos son explícitamente cristianos.
- **US Hispanic**: ~25% de hispanos en US son evangélicos según Pew Research; católicos hispanos representan 19% de homeschoolers US. Mercado total estimado: 50-80K familias hispanohablantes cristianas que homeschoolan en US (TX, FL, CA, NY).
- **México**: secularismo público fuerte pero familias cristianas privadas (católicas y evangélicas) buscan alternativas. ~10-15K homeschoolers cristianos hispanos.
- **Colombia + Brasil + Chile + España**: comunidades cristianas hispanas con resistencia creciente al currículo público.

**Competidores en este nicho**:
- **Abeka, BJU Press, Sonlight, Veritas Press**: gigantes US del homeschool cristiano. Solo inglés. $300-800/año por estudiante. Sin AI. Sin gamificación. Estilo "homeschool tradicional con libros físicos + worksheets".
- **My Father's World, Christian Light**: similar a Abeka, más conservador.
- **Logos Press / Memoria Press**: clásico cristiano, Latin, lógica. Solo inglés. Filosofía de Trivium.
- **Plataformas cristianas hispanas online**: prácticamente inexistentes a este nivel de calidad técnica. Algunas iglesias tienen catequesis online, pero no homeschool completo K-12 con AI tutor.

**Moat de Midsea contra Abeka et al.**: bilingüe es/en + AI tutor + gamificación moderna + tienda Coin + a la carta. Tan diferenciado que efectivamente no son competidores directos, son **complementarios o reemplazables**.

**Moat de Midsea contra Wited / Miacademy / MiaPrep / Khan**: cosmovisión cristiana explícita que ninguno de ellos puede ofrecer ni promover (son seculares por estrategia). Familias cristianas que actualmente usan Khan + worksheets cristianos por separado pueden consolidarse en Midsea.

### 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Excluimos familias seculares argentinas** | Aceptado. El nicho cristiano es lo suficientemente grande para PMF. Familias seculares no son nuestro ICP. |
| **Familias cristianas no-mainstream se sienten excluidas** (testigos de Jehová, mormones, adventistas) | El messaging es "cristiano denominacionalmente abierto" pero tradiciones muy distintivas pueden no encajar. Aceptado. |
| **Adolescentes ateos en familias cristianas se sienten incómodos con Angela** | Angela respeta autonomía. Su tono cristiano es contextual, no constante. Adolescentes que están explorando se sienten respetados, no presionados. |
| **Contenido cristiano genera fricción regulatoria** | Argentina permite educación religiosa privada sin restricción. US, México, Colombia idem. España y Francia tienen tensión pero no afectan a hispanohablantes del pilot. |
| **Padres no cristianos contratan por confusión** | Disclaimer explícito en signup elimina ambigüedad. Si igual contratan, refund policy estándar aplica. |
| **Angela "predica" demasiado en respuestas** | System prompt de Angela calibra: cosmovisión cristiana coherente, pero NO catequesis. Review en pilot ajusta tono. |
| **Familias católicas vs evangélicas tienen diferencias doctrinales** | Contenido se queda en lo compartido (Biblia, valores, figuras universales). Doctrinas específicas se delegan al padre/pastor. |

### 6. Decisiones técnicas concretas

- **System prompt de Angela** (`angela-hs-es.ts` y `angela-hs-en.ts`): se actualiza con el bloque "Cosmovisión cristiana" que define el marco. Ver Epic 02.5-HS actualizado.
- **Pipeline de generación (ADR-006)**: el prompt de generación de lecciones incluye "Cosmovisión cristiana mainstream, denominacionalmente abierta, no proselitista" como instrucción de tono.
- **Tabla `Lesson` en Prisma**: agregar campo opcional `reflectionEs` y `reflectionEn` (Text) para el "momento de reflexión" al cierre de cada lección. Nullable; no toda lección lo lleva.
- **Landing page**: rediseño post-Epic 02b para reflejar identidad cristiana (Epic 02c o sprint dedicado).
- **Signup flow**: nuevo step "Aceptás que Midsea es una plataforma cristiana" (checkbox) antes de Stripe.
- **Documentos legales**: Terms & Conditions actualizados con declaración de carácter cristiano.

### 7. Lo que NO cambia con esta decisión

- Stack técnico (ADR-001).
- Modelo Stripe + per-student subscription (ADR-001).
- Catálogo a la carta (ADR-005).
- Coin como moneda interna (ADR-004).
- Pipeline de generación (ADR-006, solo se ajusta el prompt).
- Pivot HS-first (ADR-003).
- Mercado Argentina como pilot inicial.

## Consecuencias

**Positivas.**
- Moat narrativo único, defendible, y emocionalmente resonante con un mercado claramente identificable.
- Diferenciación radical contra Wited / Miacademy / MiaPrep / Khan / Time4Learning.
- Mercado de referencia: 100K+ familias cristianas hispanas homeschoolers desatendidas globalmente.
- Loyalty alta esperada del segmento cristiano: una vez que confían en la plataforma, retention >90% típico en este nicho.
- Coherente con el contenido propio del founder, que ya tiene tono cristiano embedded.
- Permite alianzas con iglesias, ministerios de educación cristiana, organizaciones homeschool cristianas hispanas — distribución orgánica vía boca-a-boca eclesial.

**Negativas.**
- Excluye familias seculares y de otras religiones (mormones, judíos, musulmanes, hindúes, ateos). No es Midsea para ellos.
- Riesgo reputacional si el componente cristiano se vuelve sectario o si la AI hace declaraciones doctrinales mal calibradas. Mitigación: review estricto + prompt cuidadoso + escalación a padres en preguntas sensibles.
- Marketing en redes seculares puede tener restricciones (ej. Facebook Ads tiene políticas específicas para contenido religioso).
- Inversores no-cristianos pueden tener dudas. Mitigación: el segment cristiano es comprobable como mercado de $XX millones; no es ideología, es vertical de mercado bien definido.

## Alternativas descartadas

| Alternativa | Razón |
|---|---|
| Secular con módulo cristiano opt-in | Pierde el moat narrativo. El componente cristiano se siente como add-on, no como ADN. |
| Agnóstico (sin matiz cristiano) | Subutiliza el contenido propio del founder. Sin diferenciación contra competidores seculares. |
| Cristiano implícito sin messaging | Confunde a familias seculares que se inscriben pensando que es Khan-style. Compromiso fallido. |
| Católico-only o Evangélico-only | Reduce el mercado a 1 denominación. Cristiano amplio es mayor mercado. |
| Multi-religioso (módulos por religión) | Imposible de escalar; requiere expertise en c/u; diluye el producto. |

## Referencias cruzadas

- `PRD.md` §1.3 (ICP refinado), §1.4 (v1 alcance + identidad cristiana), §2.5 (mercado + competencia).
- `CLAUDE.md` §2 (Project Identity con identidad cristiana), §7.6 (UX cristiano), §10 (glosario actualizado).
- `docs/DMP-HS-addendum.md` §8 (anti-patrones — agregar "no copiar patrón secular agresivo").
- `ADR-003-pivot-to-hs-multi-course-catalog.md` (no cambia con esta decisión).
- `ADR-006-content-generation-pipeline.md` (prompt v1 incluye instrucción cristiana).
- Epic 02.5-HS — Angela coach (actualizar para incluir cosmovisión cristiana).
- `docs/curriculum/temas-grado-materia.md` (estructura del outline preserva componente cristiano).

---

*Revisar este ADR cuando: (a) el pilot arroje datos sobre fricción del messaging cristiano, (b) consideremos expandir a mercados no-hispanohablantes con dinámicas religiosas distintas, (c) Angela cometa errores doctrinales serios que requieran ajuste del prompt.*
