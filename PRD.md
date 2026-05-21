
# 🎓 PLATAFORMA DE HOMESCHOOLING CON AI AGENTIC Y GAMIFICACIÓN
## Midsea — Documento Maestro de Producto, Arquitectura y Estrategia
### Versión 2.0 | Español Nativo + Escalado Inglés | Análisis Competitivo: Miacademy

---

# 1. EXECUTIVE PRODUCT DEFINITION

## 1.1 The Product, Restated Precisely

**Nombre de código:** Midsea

Midsea es una plataforma de homeschooling integral, **bilingüe por diseño** (español nativo, inglés escalado), que combina:
- **Currículo académico completo** PreK-12 alineado a estándares internacionales (Common Core adaptado, estándares latinoamericanos SEP/LOMLOE, IB PYP/MYP opcional)
- **AI Agentic Tutors** (tutores autónomos inteligentes) que personalizan el aprendizaje en tiempo real en **ambos idiomas**
- **Gamificación profunda** con economía virtual "Coin", avatares, logros y mundos colaborativos
- **Herramientas parentales completas** para planificación, seguimiento y reportes regulatorios en español e inglés
- **Comunidad segura** de estudiantes homeschoolers con moderación AI + humana

**La promesa de valor:** *"El primer sistema educativo donde cada niño tiene un tutor AI personalizado 24/7 en su idioma, un currículo que se adapta a su ritmo único, y una experiencia de juego que hace del aprendizaje una aventura adictiva — mientras los padres mantienen control total con 5 minutos al día."*

## 1.2 The Primary Problem

**Para padres homeschoolers en LATAM, España y comunidades hispanas en EE.UU.:**

1. **Fragmentación extrema:** Usan 5-10 herramientas diferentes (Khan Academy + worksheets + libros + Zoom + Excel para tracking). No existe una plataforma integral en español de calidad comparable a Time4Learning o Miacademy en inglés.

2. **Falta de personalización real:** Los currículos existentes son rígidos o "self-paced" pasivo. No se adaptan al estilo de aprendizaje (visual, kinestésico, auditivo) ni detectan brechas de conocimiento en tiempo real.

3. **Agotamiento parental:** Los padres pasan 2-3 horas diarias planificando, corrigiendo y buscando recursos. Necesitan un "copiloto educativo", no solo contenido.

4. **Desmotivación del estudiante:** El homeschooling online tradicional es aburrido. Los niños abandonan después de 20-30 minutos. Falta la dopamina del progreso visible y la competencia/colaboración sana.

5. **Incertidumbre regulatoria:** Los padres no saben si su currículo cumple requisitos legales para equivalencia, transcript o reingreso a sistema tradicional.

6. **Barrera del idioma:** Las plataformas líderes (Miacademy, Time4Learning) son exclusivamente en inglés. Los niños hispanohablantes pierden 30-40% de comprensión por la barrera lingüística.

## 1.3 The First Ideal Customer (ICP)

> **Actualización 2026-05-21**: el ICP fue refinado por ADR-007 (Midsea como plataforma cristiana explícita). La versión original (genérica/secular) se conserva abajo como referencia histórica.

**ICP v1 (pilot HS Argentina) — "Familia Cristiana Homeschooler Argentina":**

- **Demográfico:** Padres 35-50 años, clase media o media-alta, urbanos o suburbanos. Profesionales o emprendedores. Bilingües es/en o con interés activo en bilingüismo. Hijos en HS (13-17 años).
- **Identidad religiosa:** **Cristianos activos** (asistencia regular a iglesia, lectura familiar de la Biblia, oración familiar). Denominación variada: católicos, evangélicos, protestantes históricos, ortodoxos. Denominacionalmente inclusivo.
- **Geografía pilot:** Argentina + diáspora argentina (España, US, México, Brasil, Chile) + LATAM hispanohablante cristiano + US Hispanic cristiano.
- **Situación:** Decidieron homeschoolear por: (a) valores cristianos no compatibles con currículo escolar oficial argentino/LATAM (educación sexual, ideología de género, enseñanza neutral o anti-religiosa); (b) búsqueda de educación con propósito; (c) control parental sobre influencias culturales; (d) flexibilidad para integración familiar de fe-vida-aprendizaje; (e) razones secundarias: neurodivergencia, flexibilidad geográfica, insatisfacción con calidad académica local.
- **Dolor actual:** Usan Abeka / BJU Press / Sonlight (solo inglés, $300-800/año, sin AI, sin gamificación), o homeschooling cristiano autogestionado caótico (worksheets + Khan Academy + iglesia, sin estructura), o colegio cristiano privado argentino ($150-400 USD/mes equivalente — caro y rígido).
- **Willingness to pay:** $29-45 USD/mes por estudiante. Punto de comparación favorable contra colegio privado y contra Abeka.
- **Tech savvy:** WhatsApp, Facebook, Instagram. Notion, Google Workspace. SaaS-comfortable.
- **Decisor:** La madre (90% de casos). El padre co-decisor activo en familias evangélicas.

**ICP v2 (post-pilot):** ampliar a familias cristianas K-6 + 7°-8° (v1.1) y microescuelas / pods educativos cristianos hispanohablantes (5-15 estudiantes) que necesitan plataforma white-label con múltiples maestros.

---

**ICP original (pre-ADR-007, conservado como referencia):** "La Madre/Padre Homeschooler Estratégico" (genérico, sin filtro religioso). Padres 30-45 años, urbano LATAM/España/US Hispanic. Sigue siendo válido conceptualmente para v2+ si se decide ampliar el mercado más allá del segmento cristiano explícito.

## 1.4 v1 / v2 / Later

### v1 — "El Pilot HS Argentina" (Meses 1-3, lanzamiento ~10-11 semanas desde mayo 2026)

> **Actualización 2026-05-21**: el alcance original K-6 LATAM se difiere a v1.1. v1 pivoteó a HS Argentina por: (a) contenido propio en proceso de terminar para HS en 6 materias, (b) moat anti-Wited más claro en HS, (c) mercado argentino con menor fricción regulatoria. Ver `docs/decisions/ADR-003-pivot-to-hs-multi-course-catalog.md`.

**Objetivo:** Validar producto-market fit con homeschooling HS argentino, pilot beta cerrada de 10-30 familias.

**Features locked:**
- **Catálogo HS a la carta**: 9 cursos en 6 materias (Matemáticas Ciclo Básico + Orientado, Lengua/Literatura Ciclo Básico + Orientado, Inglés ESL Intermedio + Avanzado, Sociales = Historia Universal + Historia de Argentina, Ciencias HS, Música como electiva). Padre activa cursos por hijo sin límite numérico (ADR-005).
- **Catálogo visible públicamente pre-signup** en `/[locale]/catalog` (anti-Wited paquete-cerrado).
- **Angela AI Tutor (Epic 02 ya implementado, Epic 02.5 en plan)**: chat con memoria persistente, streaming SSE, integración con `/stuck`. Epic 02.5 agrega hero variant + tono académico HS + chain-of-thought visible.
- **Coin como moneda interna con poder pedagógico (ADR-004)**: gana 100 Coin por lección con mastery ≥80%. Gasta en productos premium de tienda (cursos especializados, masterclasses, electivos). Padre puede regalar Coin packs comprables vía Stripe ($9/$25/$50).
- **Tienda Coin con 8-12 productos premium iniciales**: preparación CBC universitario argentino, AP-equivalentes, masterclasses de método de estudio, módulos electivos.
- **Parent Copilot básico**: gestión de cursos activos por hijo, aprobación de compras en tienda Coin, dashboard de 5 minutos. Reportes regulatorios formales se difieren a v1.1.
- **Pipeline de generación de contenido (ADR-006)**: outline humano (founder) → GPT-4o → review humano → ingesta. ~400-500 lecciones para los 9 cursos.
- **Stripe billing (Epic 03 ya implementado)**: $29 Core, $45 Pro, $69 Family, todo USD.
- **Mobile-first**: tablet + smartphone son los dispositivos del estudiante adolescente argentino.

**Idioma:** español rioplatense (es-AR) como default + inglés (en) para Inglés ESL e UI universal. Voseo argentino natural en español.

**Mercado del pilot:** Argentina + diáspora argentina (España, US, México, Brasil, Chile). 10-30 familias beta reclutadas por boca-a-boca + comunidad homeschooler argentina.

**Disclaimer obligatorio en signup:** "Pilot académico de Midsea — contenido revisado por el equipo fundador, no acreditado todavía. Validación legal de la educación es responsabilidad del padre/tutor según jurisdicción."

### v1 ORIGINAL — "El Cimiento" K-6 (DIFERIDO a v1.1)

> **Estado**: postponed. Esta era la definición original de v1 antes del pivot 2026-05-21. Se conserva como referencia histórica y como spec base para v1.1, cuando el pipeline de generación HS esté validado y se expanda a K-6 + 7°-8°.

**Features (referencia para v1.1):**
- Core subjects: Matemáticas, Language Arts (español), Ciencias, Estudios Sociales (con módulos por país latino 1°-6°: Argentina, Rep. Dominicana, México, Costa Rica, Colombia)
- AI Tutor con tono adaptado a niño K-6
- Gamificación con Coin (mismo modelo económico que v1 HS, ADR-004)
- Parent Dashboard con planificador semanal AI
- Offline mode: descarga de PDFs y videos para zonas sin internet
- Voice-first interface para pre-lectores K-2

**Idioma:** 100% Español (es-ES/es-MX/es-AR variantes de contenido donde aplique)

### v2 — "La Escalada" (Meses 5-10)
**Objetivo:** Expandir a 7-12, lanzar versión en inglés, agregar comunidad y agentes avanzados.

**Features:**
- High School curriculum con transcript oficial y pathways a universidad
- AI Agentic avanzado: "Angela-like" agents que planifican semanas completas, generan worksheets personalizados, conectan inventario físico de libros/juguetes educativos
- **Gamificación v2: Economía virtual "Coin"** (100 por lección como Miacademy), tiendas digitales, trading entre estudiantes, clanes/guilds para proyectos colaborativos, "Minecraft-style" mundos de aprendizaje
- Comunidad moderada: Newspaper escrito por estudiantes, Clubs temáticos, comentarios predefinidos (no chat libre, como Miacademy)
- Electivas: Programación, arte digital, idiomas (inglés como segunda lengua), life skills
- White-label para microescuelas
- **Toggle de idioma:** Familia puede cambiar todo el contenido a inglés

**Idioma:** Español + Inglés (toggle por familia, no por lección)

### v3+ — "El Ecosistema" (Meses 11-18)
- Diploma acreditado (partnership con institución acreditadora WASC/Cognia)
- AI agents multi-agent: Curriculum planner + Content creator + Progress analyst + Parent coach
- Marketplace de tutores humanos on-demand (integración con AI tutor)
- VR/AR labs para ciencias (low-cost, cardboard-based)
- API pública para publishers de contenido educativo
- Expansión a Portugal (portugués) y expansion US Hispanic market

## 1.5 Risky Assumptions You're Making (And My Pushback)

| # | Assumption | Pushback / Mitigation |
|---|-----------|----------------------|
| 1 | Los padres hispanos pagarán $30-45/mes por homeschooling digital | **Riesgo alto.** En LATAM, $30/mes es significativo. Mitigación: tier de $12/mes con 2 subjects + anuncios. Annual discount 40%. Lifetime plan opcional. |
| 2 | Los niños se quedarán enganchados con gamificación educativa | **Riesgo medio.** Gamificación mal hecha = distracción. Mitigación: "learning-first" design. Los puntos solo se ganan con mastery (80%+), no con tiempo. |
| 3 | AI puede reemplazar la intervención humana en K-6 | **Riesgo alto.** Los niños pequeños necesitan conexión humana. Mitigación: AI es "tutor", no "maestro". Siempre hay parent in the loop. Voice-first para niños. |
| 4 | Podemos crear contenido de calidad comparable a Miacademy en 90 días | **Riesgo extremo.** Miacademy tiene años de contenido. Mitigación: v1 usa contenido generado por AI + revisado por educadores, no grabado en estudio. Micro-lecciones de 3-5 min. |
| 5 | El modelo "español primero" funciona para escalado a inglés | **Riesgo medio.** El español es más verboso, afecta UI. Mitigación: diseño con i18n desde día 1. Content separado de UI. RTL ready para árabe futuro. |
| 6 | Los padres confiarán en AI para planificar la educación de sus hijos | **Riesgo alto.** Mitigación: transparencia total. El padre aprueba cada plan semanal. AI explica por qué sugiere X. Human-in-the-loop obligatorio. |
| 7 | Podemos competir con Miacademy ($45/mes) en precio | **Riesgo medio.** Miacademy tiene brand recognition. Mitigación: precio de entrada más bajo ($29/mes), valor diferenciado (AI tutor + bilingüe). |

---

# 2. PRODUCT STRATEGY & MARKET FIT

## 2.1 Painkiller or Vitamin?

**Painkiller con efectos de vitamina.**

- **Painkiller:** Elimina el caos de planificación, la incertidumbre de "¿está aprendiendo lo suficiente?", y la batalla diaria de "siéntate a hacer tareas". Reduce carga parental de 3 horas a 20 minutos/día.
- **Vitamina:** El AI tutor mejora resultados académicos. La gamificación desarrolla resilience y growth mindset. La comunidad reduce aislamiento social del homeschooler.

**Test de painkiller:** Si cerramos mañana, los padres volverían al caos de múltiples tabs, Excel y lágrimas. Sí, dolería mucho.

## 2.2 The Competitive Landscape, Honestly

### Directos (en inglés, referencia de calidad)
| Plataforma | Fortaleza | Debilidad | Nuestro ángulo |
|-----------|-----------|-----------|---------------|
| **Time4Learning** | 20 años de contenido PreK-12, multimedia rico, reporting robusto | Solo inglés, UI anticuada, repetitivo, sin comunidad | Español nativo + AI adaptativo + gamificación moderna |
| **Miacademy** | Gamificación excelente (gold, tiendas, avatares), comunidad segura, acreditado, offline mode, newspaper, clubs | K-8 solo (MiaPrep es separado), contenido desigual en ciencias/sociales, solo inglés, $45/mes | K-12 integrado, AI tutor personalizado, currículo latinoamericano, bilingüe, precio más bajo |
| **MiaPrep** | High school acreditado, opción diploma | Caro ($394/mes MOHS), estructura rígida, separado de Miacademy | Flexible + affordable + AI-powered + K-12 en una plataforma |
| **Khan Academy** | Gratis, excelente en matemáticas | No es homeschool completo, sin gamificación profunda, sin parent tools | Todo-en-uno con gamificación y AI tutor |

### Directos (en español, mercado objetivo)
| Plataforma | Fortaleza | Debilidad |
|-----------|-----------|-----------|
| **Santillana / SM digital** | Contenido reconocido, alineado a ministerios | No es homeschooling, es complemento. Sin AI, sin gamificación, UI 2015 |
| **Plataformas MOOC locales** | Variedad de cursos | No currículo estructurado, no PreK-12, no tracking parental |
| **Homeschool manual (padres)** | Personalización extrema | Agotamiento total, calidad inconsistente |

### Análisis detallado: Miacademy (Competidor Principal)

**Basado en análisis de cuenta real de padre e hijo:**

| Aspecto | Cómo funciona en Miacademy | Nuestra ventaja Midsea |
|---------|---------------------------|------------------------|
| **Precio** | $45/mes flat (hasta 4 hijos) | $29/mes Core, $45/mes Pro, $69/mes Family (4 hijos) |
| **Mundo visual** | Isla 3D con paths de lecciones | Mundos temáticos por materia (Ciudad STEM, Bosque Literario) |
| **Economía** | 100 gold por lección, tienda de ropa/avatar/house items | 100 Coin por lección, tienda + marketplace estudiante-estudiante |
| **Tienda parental** | Padre puede ver/controlar compras del niño | Parent Copilot: aprobación de compras, límites configurables |
| **Comunidad** | Newspaper, Clubs, comentarios predefinidos (NO chat libre) | Newspaper, Clanes, comentarios predefinidos + moderación AI |
| **Offline** | Descarga de lecciones para sin internet | Offline mode con descarga progresiva + worksheets PDF |
| **High School** | MiaPrep separado ($394/mes) | K-12 integrado en una plataforma, diploma track v3 |
| **Idioma** | Solo inglés | Español nativo + inglés toggle |
| **AI Tutor** | No tiene | Angela: tutor personal 24/7 en ambos idiomas |
| **Parent Dashboard** | Progreso básico, asignación manual | AI Copilot: planificación automática, alertas proactivas, reportes regulatorios |

### Indirectos
- Tutoring 1:1 online (Preply, etc.): $15-30/hora. Nosotros: $1/día ilimitado.
- Colegios online privados: $300-1000/mes. Nosotros: $30-45/mes.
- YouTube Kids + worksheets: Gratis pero sin estructura ni tracking.

## 2.3 The Three Real Differentiators You Must Win On

1. **AI Agentic Tutor con "Mente de Maestro" (Bilingüe)**
   No es un chatbot que responde preguntas. Es un agente autónomo que:
   - Diagnostica brechas con assessments adaptativos (IRT - Item Response Theory)
   - Genera explicaciones personalizadas (visual para el visual, analogías para el concreto) en **español o inglés según preferencia**
   - Interviene proactivamente cuando detecta frustración (velocidad de respuesta, errores repetidos)
   - Planifica la semana completa considerando: ritmo del niño, calendario familiar, inventario físico de materiales
   - Se comunica con el padre: "Hoy Juan tardó 40% más en fracciones. Sugiero actividad offline con pizza real mañana. ¿Aprobado?"
   - **Code-switching natural:** Si el estudiante mezcla español e inglés, el tutor sigue el lead

2. **Gamificación con Propósito Pedagógico ("Learn-to-Earn" real) — ACTUALIZADO ADR-004**
   - **Coin como moneda interna con poder pedagógico real, NO cosmético**: 100 Coin por lección completada con mastery ≥80%. Lo que en Miacademy compra ropa de avatar, en Midsea desbloquea cursos especializados, masterclasses y electivos en la tienda Coin.
   - **Tienda Coin con productos premium**: cursos especializados (preparación CBC universitario, AP-equivalentes, programación), masterclasses (método de estudio, técnicas de ensayo), electivos (Música avanzada, Historia del Arte argentino). Solo se compran con Coin, nunca con cash directo.
   - **Coin packs comprables vía Stripe** (single use, no subscription): $9 = 1000 Coin, $25 = 3000 Coin, $50 = 7000 Coin. El padre los regala al hijo. Preserva la narrativa de mérito sin frustrar al padre que quiere apoyar.
   - **Parent-controlled store con approval flow**: toda compra del hijo en tienda Coin requiere aprobación del padre por default. Auto-approve hasta cap configurable (v1.1+).
   - **Clanes de Aprendizaje** (Study Pods) y **Worlds temáticos**: postponed a v2+ post-PMF. El pilot v1 se enfoca en el loop económico individual + Angela coach + catálogo a la carta.
   - **Sistema de Logros de Transferencia** (recompensas por aplicar conocimiento al mundo real con evidencia foto/video): v1.1+. En pilot, las "actividades hands-on" están sugeridas en cada lección pero sin tracking formal.

3. **Parent Copilot: De Gestor a Director Ejecutivo (Bilingüe)**
   - Dashboard de 5 minutos: "Hoy aprendió fracciones equivalentes. Dominó 85%. Mañana: fracciones impropias. Tiempo total: 42 min. Estado emocional: 😊"
   - Auto-generación de reportes regulatorios según país/estado (Florida, Texas, México, España) en **español e inglés**
   - Sugerencias de actividades offline conectadas a lecciones online ("Usa los bloques LEGO que ya tienes para demostrar multiplicación")
   - "Panic button": Cuando el niño está atascado 10+ minutos, notificación al padre con contexto y sugerencias de intervención
   - Control de economía: Aprobación de compras en tienda, límites de gasto, "allowance" semanal configurable

## 2.4 Where This Can Fail Commercially

1. **CAC demasiado alto en LATAM:** El homeschooling digital requiere educación de mercado. No es "Google Meet para escuelas". Necesitamos content marketing masivo (blogs, YouTube, comunidad Facebook) que tarde 6-12 meses en rendir.
2. **Churn por expectativas irreales:** Los padres esperan que el niño esté 6 horas autónomo. La realidad: K-2 necesita 30-45 min de plataforma + 2 horas parent-led. Si no comunicamos esto, churn en mes 2.
3. **Seasonality extrema:** Homeschooling tiene picos en agosto (inicio año escolar) y caídas en diciembre. Cash flow irregular.
4. **Competencia de gigantes:** Google, Microsoft o BYJU's podrían lanzar versión española rápidamente. Nuestra defensa: comunidad + personalización extrema + datos de aprendizaje hispanohablante.
5. **Regulación:** Algunos países latinoamericanos restringen homeschooling o requieren supervisión estatal. Necesitamos compliance legal por país.
6. **Precio vs. valor percibido:** Miacademy cobra $45/mes y tiene años de contenido. Nosotros empezamos de cero. Necesitamos demostrar valor diferenciador (AI tutor) desde el día 1.

## 2.5 The Sharpest First Wedge

**Wedge v1: "El Planificador AI de Homeschooling que realmente funciona en español"**

No vendemos "plataforma completa" el día 1. Vendemos:
1. **Lead magnet gratuito:** "Assessment AI de 10 minutos que te dice exactamente en qué grado está tu hijo en cada materia" → Captura email
2. **Free tier:** Planificador semanal AI + 5 lecciones demo por materia + tracking básico → Engagement
3. **Paid conversion ($29/mes):** Acceso ilimitado + AI tutor + gamificación + parent reports

**Por qué este wedge funciona:**
- El planificador resuelve el dolor #1 inmediatamente (agotamiento parental)
- Requiere poco contenido propio inicial (usamos AI para generar plan semanal con recursos externos)
- Demuestra valor del AI antes de pedir pago
- Crea hábito semanal (reenvío del plan cada domingo)

---

# 3. BILINGUAL STRATEGY (Español + Inglés)

## 3.1 Filosofía Bilingüe

**"Español como lengua del corazón, Inglés como puerta al mundo"**

- El español es el idioma **default** para todo: UI, contenido core, AI tutor, reportes parentales
- El inglés se introduce progresivamente: primero como subject (Foreign Language), luego como toggle completo
- **No traducción literal:** El contenido se adapta culturalmente (ej: "Thanksgiving" en inglés se explica como tradición estadounidense; "Día de Muertos" en español se explica culturalmente en inglés)
- **Code-switching natural:** El AI tutor puede responder en el idioma que el niño use, mezclando cuando sea natural

## 3.2 Fases de Implementación

### Fase 1: Español Nativo (Meses 1-6)
- Todo UI y contenido core en español neutro (es-419 para LATAM, es-ES para España)
- Variantes regionales mínimas: "computadora" vs "ordenador"
- Inglés como "Foreign Language" subject (opcional en v1, core en v2)
- AI tutor responde 100% español

### Fase 2: Escalado a Inglés (Meses 7-12)
- Toggle a nivel de familia: "Nuestra familia estudia en inglés"
- No traducción automática de UI. Content traducido por educadores bilingües + AI assist
- Cultural adaptation: Cada lección tiene "context notes" explicando referencias culturales
- AI tutor bilingüe: Detecta el idioma de la lección y responde en ese idioma

### Fase 3: True Bilingual (v3+)
- Estudiante puede alternar por lección: "Esta lección de ciencias la quiero en inglés para practicar"
- AI tutor bilingüe: Responde en el idioma de la lección, pero puede code-switch si estudiante lo hace
- Parent reports disponibles en ambos idiomas
- Comunidad bilingüe: Estudiantes de diferentes países interactuando

## 3.3 Technical Implementation

```
Content Structure:
├── lessons/
│   ├── es/           # Contenido en español (source of truth)
│   │   ├── math/
│   │   ├── language/
│   │   └── science/
│   └── en/           # Contenido en inglés (adaptación cultural)
│       ├── math/
│       ├── language/
│       └── science/
├── ui-strings/
│   ├── es.json       # UI en español
│   └── en.json       # UI en inglés
└── ai-prompts/
    ├── angela-es.txt # Tutor en español
    └── angela-en.txt # Tutor en inglés
```

**i18n Framework:** next-intl con locale detection por IP y override manual.

---

[El documento continúa con las secciones 4-16 del documento original, actualizadas con referencias a Miacademy donde aplique...]

## APPENDIX D: ANÁLISIS DETALLADO DE MIACADEMY (Basado en cuenta real)

### D.1 Flujo del Padre

**Dashboard Principal:**
- Vista de todos los hijos con progreso porcentual
- Acceso a "Offline Mode" para descargar lecciones
- Control de asignación de lecciones (manual o automático)
- Acceso a tienda del niño (control parental)

**Features observadas:**
- Progreso visual por hijo
- Tiempo de uso tracking
- Reportes básicos de completitud
- Configuración de límites de tiempo

### D.2 Flujo del Hijo

**Mundo/Mapa:**
- Isla 3D con paths de lecciones
- Lecciones bloqueadas/desbloqueadas visualmente
- Diferentes "materias" representadas como áreas del mapa

**Durante la lección:**
- Video introductorio
- Actividades interactivas (arrastrar, seleccionar, escribir)
- Quiz al final
- Feedback inmediato

**Al completar:**
- Celebración visual
- +100 gold (moneda virtual)
- Posible badge/logro
- Desbloqueo de siguiente lección

**Economía/Tienda:**
- Balance de gold visible
- Tienda con categorías: ropa, avatar, house items
- Padre puede ver/controlar compras
- No hay trading entre estudiantes

**Comunidad:**
- Newspaper: Artículos escritos por estudiantes
- Clubs: Grupos temáticos (arte, ciencia, etc.)
- Comentarios predefinidos (NO chat libre)
- Perfiles públicos limitados

### D.3 Modelo de Precios Miacademy

| Plan | Precio | Incluye |
|------|--------|---------|
| Standard | $?/mes | Básico |
| Premium | $45/mes | Todo ilimitado, hasta 4 hijos |
| MiaPrep | $394/mes | High school acreditado (separado) |

**Observación:** El modelo de precios de Miacademy es flat por familia, no por estudiante. Midsea usará modelo por estudiante con descuento familiar.

### D.4 Features que Miacademy NO tiene (oportunidades para Midsea)

1. **AI Tutor personalizado** — Miacademy no tiene tutor AI
2. **Bilingüe** — Solo inglés
3. **K-12 integrado** — MiaPrep es producto separado caro
4. **Planificación AI automática** — Padre asigna manualmente
5. **Reportes regulatorios** — No genera reportes para compliance estatal
6. **Actividades offline conectadas** — No bridge a mundo físico
7. **Marketplace estudiante-estudiante** — Tienda es solo consumo
8. **Voice-first interface** — No hay modo voz para pre-lectores

---

*Documento preparado para: Equipo fundador de Midsea*
*Fecha: Mayo 2026*
*Versión: 2.0*
*Análisis competitivo basado en cuenta real de Miacademy (padre e hijo)*
