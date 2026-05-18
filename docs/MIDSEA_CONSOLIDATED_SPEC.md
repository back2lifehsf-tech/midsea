# MIDSEA_CONSOLIDATED_SPEC.md
# Análisis Consolidado: Wited + Miacademy → Midsea
# Basado en videos reales de ambas plataformas

> **Documento de referencia para el equipo Midsea.**
> **Análisis de:** Video Wited (app.wited.com) + Video Miacademy (parents.miacademy.co + miacademy.co)
> **Fecha:** 2026-05-17

---

## PARTE 1: ANÁLISIS DETALLADO DE WITED (Video analizado frame por frame)

### 1.1 Estructura general

Wited es una plataforma chilena de apoyo escolar para "Segundo Medio" (equivalente a 10° grado).

**Sidebar (navegación jerárquica):**
- Inicio
- Aprender
- Preguntar (Max AI / Profe Express)
- Clases (Grupales / Particulares)
- Herramientas (Calificaciones / Estadísticas / Desafíos)
- Tienda
- Perfil

**Problema:** El estudiante debe recordar "esto va en Biología, Unidad 3". No responde a intención.

### 1.2 Pantalla de Inicio (00:00)

- Header: "Hola Hamest! ¿Qué quieres aprender hoy?" + avatar Max + 1685 monedas + 00 diamantes
- Card Max AI: "Soy Max, te ayudo con tareas, pruebas y a aprender mejor"
  - Input: "Pídele ayuda a Max AI"
  - Botones: "Hacer una tarea" | "Estudiar y aprender"
- Card Profe Express: foto de profesora, "Online", horario Sáb-Jue 17:00-20:00
- Grid de materias (Segundo Medio):
  - Química 0% | Biología 100% | Física 7%
  - Matemática 100% | Lenguaje 94% "En racha" | Historia y Geografía 0%
  - Inglés 24%

**Problema:** El progreso por materia es abrumador. "Lenguaje 94%" no dice qué competencias faltan.

### 1.3 Max AI (00:08)

- Chat flotante que se abre al hacer click en el input
- Conversación:
  - Estudiante: "fracciones"
  - Max: "Claro! Las fracciones son una forma genial de representar partes de un todo..."
  - Explica con analogía de pizza
  - Pregunta si quiere ver cómo sumar/restar
  - Estudiante: "si"
  - Max explica suma de fracciones con mismo denominador

**Problemas críticos:**
1. Max NO sabe que el estudiante está en la lección de "suma de fracciones"
2. NO sabe que falló 2 veces en el mismo ejercicio
3. NO adapta el formato (visual/textual) al perfil del estudiante
4. Es un chatbot genérico con avatar estático
5. NO interviene proactivamente

### 1.4 Learning Path — Biología (00:42)

- URL: /learning-path/segundo-medio?code=41
- Header: "Biología" + barra de progreso 100%
- Diagnóstico: "Completado" + botón "Resultado"
  - Al hacer click: modal con trofeo, "Nivelado", stats (20 preguntas, 18 correctas, 2/2 nivelación)
  - Botones: "SALIR" | "CONTENIDOS A NIVELAR" (gris/deshabilitado)
- Unidades:
  - Unidad 1: Coordinación y regulación — 14/14, Calificación 100, Aprobado
  - Unidad 2: Genética — 13/13, Calificación 91, Aprobado
  - Unidad 3: Manipulación genética
- Al entrar en Unidad 1: lista lineal de temas con checkmarks verdes
  - Recepción de estímulos, Arco Reflejo, Sistema nervioso, etc.
  - Cada tema: "Aprobado" + "Puntaje: 90/100"
  - Quiz final: "Calificación: 100 | Aprobado" + botón "Resultado"
  - Navegación: "Anterior" | "Siguiente"

**Problema:** Secuencia rígida. Si fallas un tema, no hay adaptación. Solo "repite".

### 1.5 Preguntar — Profe Express (01:13)

- Sidebar expande: Preguntar → Max AI | Profe Express
- Profe Express:
  - "Haz tu pregunta al profesor"
  - "Preguntas disponibles: 5" (badge rosa)
  - Input grande con avatar Max
  - Botones: "Adjuntar" | "Solicitar ayuda"
  - "Preguntas anteriores" — vacío
  - "Atención disponible de sábado a jueves de 17:00 a 20:00 horas"

**Problema:** Latencia de horas. El estudiante espera en vez de aprender. No escalable.

### 1.6 Clases (01:30)

- Clases grupales: calendario semanal (Mayo, Lunes-Viernes), slots de hora
- Clases particulares: agenda vacía, "Cupos disponibles: 0", "Comprar clases particulares"
- Psicopedagogía: misma estructura

**Problema:** UI vacía, poco útil sin clases agendadas.

### 1.7 Tienda — Cursos y Talleres (01:44)

- Cards de cursos: Estadística I, Álgebra I, Fracciones
- Cada curso: imagen, título, descripción, precio en MaxPoints (40 MP), botón "CANJEAR"
- Detalle de curso: descripción larga, duración, dirigido para, área, experiencia previa, contenidos, botón "CANJEAR"

**Problema:** Los cursos son genéricos. No conectan con el progreso actual del estudiante.

### 1.8 Herramientas — Calificaciones (02:08)

- "Mis Calificaciones" — "Resultados de pruebas finales por curso"
- Selector: "Segundo Medio"
- Tabla: Asignaturas × N°1-N°5 + Promedio Final
  - Matemática: 91, 87, 31, 91, -, 75.0
  - Lenguaje: 77, 96, P, P, 100, 43.3
  - Historia y Geografía: P, P, P, -, -, 0.0
  - Física: P, P, P, P, P, 0.0
  - Química: P, P, P, P, P, 0.0
  - Inglés: P, P, P, P, -, 0.0
  - Biología: P, 100, 91, 100, 100, 78.2
- Promedio general: 28.1 (en rojo grande)
- Botón: "Descargar Certificado"
- Al hacer click: modal "Por favor espera un momento" → genera PDF

**Problema:** Datos crudos sin insights. El padre debe interpretar qué significa "P" o "31".

### 1.9 Herramientas — Estadísticas (02:46)

- "Avances del curso": barras de progreso por materia
  - General: 46%
  - Química: 0% | Biología: 100% | Física: 7%
  - Matemática: 100% | Lenguaje: 94% | Historia: 0%
- "Actividades totales":
  - 0 clases en vivo | 131 temas aprobados | 0 preguntas al profesor
  - 0 clases particulares

**Problema:** Métricas de actividad, no de aprendizaje. "131 temas aprobados" no dice si domina fracciones.

### 1.10 Herramientas — Desafíos (02:54)

- "Razonamiento lógico" — puzzles tipo:
  - "Valor de X": rueda numérica con números, encontrar patrón
  - "¿Cuál es la respuesta?": ecuaciones con iconos (molinos + estrellas = 14)
  - "Número de estacionamiento": 16, 06, 68, 88, ?, 98
- Cada puzzle: "¡No pierdas la oportunidad! Contesta correctamente y gana 10 MaxPoints"
- Botón: "Responder"
- Al responder mal: "¡Fallaste! 😢 Perdiste 5 MaxPoints"
- Al cerrar modal: card muestra "incorrecto" en gris

**Problema:** Gamificación tóxica. Pérdida de puntos por error desmotiva. Puzzles no conectan con currículo.

### 1.11 Perfil (03:16)

- "Datos de perfil" — "Información del estudiante"
- Avatar Max con badge "2"
- Nombre: Hamest Mikaelian — Estudiante
- Formulario: Nombre, Apellido, Usuario, Correo, Curso (Segundo medio), Fecha de cumpleaños, Zona horaria (UTC-4)
- "Modifica estos datos desde el perfil de tu tutor"

**Problema:** Cero personalización del perfil de aprendizaje. No hay estilo visual, ritmo, preferencias.

---

## PARTE 2: ANÁLISIS DETALLADO DE MIACADEMY (Video analizado frame por frame)

### 2.1 LOGIN / SELECCIÓN DE ROL (00:00)

- Pantalla: "Welcome back! Who's signing in today?"
- Dos botones grandes: "Student sign in" (teal) y "Parent sign in" (purple)
- Robot mascot (Mia) en el centro con badge "HELLO MY NAME IS Mia"
- "New to Miacademy? Learn more!"

**Fortaleza:** Separación clara de roles desde el inicio.
**Midsea:** Mantener, pero con branding Midsea propio y avatares personalizados.

### 2.2 PARENT LOGIN (00:12)

- "Welcome Back!"
- Formulario: Email, Password, Remember me, Forgot password
- Social login: Facebook
- "Create New Account"

**Midsea:** Agregar Google/Apple login. Mejorar diseño visual.

### 2.3 PARENT DASHBOARD — My Students (00:20)

- Tabs: My Students | Curriculum | Attendance | Reports | Gradebook | Settings
- Sidebar izquierda: "My Children" con avatares (Emely T., Renata A.)
- "Add New Student" button
- Panel principal: "Reward Your Student With Gold"
  - Gold Coins remaining for today: 1000 Gold (badge naranja)
  - Predefined Activity dropdown: Doing homework, Doing chores, Feeding the pet, Exercising, Practicing an instrument, Cleaning room, Helping a family member, Helping a friend, Being a great child
  - New Custom Activity input
  - Gold Amount input
  - "Reward" button

**Fortaleza:** El sistema de recompensas parentales es GENIAL. El padre puede incentivar comportamientos positivos.
**Midsea:** Mantener y mejorar:
- Sylvie sugiere recompensas basadas en esfuerzo detectado
- "Nexos remaining today" → limitar por día para control parental
- Agregar recompensas por "Logros de Transferencia" (aplicar al mundo real)

### 2.4 SETTINGS DEL ESTUDIANTE (00:52)

- Access permissions: Review Assessment results, View Gradebook, Enable Videos Page
- Email Preferences: Weekly updates, Notify when attempts assessment >3 times, Daily progress tracker, Activity weekly updates
- Audio Learning: Enable read-aloud
- Membership Fee Payments (historial completo)
- Change username/password

**Fortaleza:** Granularidad de permisos. Control parental detallado.
**Midsea:** Agregar:
- Control de economía: aprobación de compras, límites de gasto
- "Sylvie permissions": cuándo puede intervenir, qué datos ve
- "Panic button" settings: notificar cuando frustración detectada
- Control de Study Pods: aprobar grupos, ver conversaciones

### 2.5 CURRICULUM (01:21)

- "Renata's Courses"
- Toggle: Assigned / Calendar
- Daily Vocabulary Practice toggle + selector de grado + Download
- Lista de cursos por materia:
  - Language Arts: Reading Comprehension Level G, Language Arts Level G
  - Math: Level F (Revised 2025)
  - Science
  - Social Studies: Ancient World History, Art Around The World
  - World Languages: Beginning American Sign Language
- Cada curso: fechas (Sep 27 - Jul 10), días de la semana, iconos (libro, PDF, más opciones)
- "Add or Remove Courses"
- "Edit Breaks" para calendar

**Fortaleza:** Flexibilidad para agregar/quitar cursos. Calendario visible.
**Midsea:** Mejorar:
- Vista de "Ruta de Competencias" en vez de lista de cursos
- Progreso visual por competencia, no solo por curso
- Sylvie sugiere qué cursos agregar basado en intereses del niño
- "Mundos temáticos" desbloqueables por progreso

### 2.6 ATTENDANCE (02:33)

- "Renata's Attendance Report"
- Select time period
- Total Days: 162 days
- Total Time: 180 hrs 35 mins
- Lista detallada por día con timestamps de cada actividad
- "Add custom activity" | "Filters" | "Print Report"

**Fortaleza:** Tracking detallado de tiempo.
**Midsea:** Mejorar:
- "Índice de Confianza" en vez de solo tiempo
- Detección de patrones: "María aprende mejor por las mañanas"
- Alertas cuando tiempo insuficiente para objetivos
- "Calidad del estudio" (tiempo / competencia desbloqueada)

### 2.7 REPORTS (02:57)

- "Create a Report Card"
- Name, time period, Include Study Time toggle
- Subjects filter (chips: Language Arts, Math, Science, Social Studies)
- Courses dropdown
- Lista de actividades completadas con fechas y notas
- "View Answers" para cada assessment
- "Download" | "Change dates"

**Fortaleza:** Reportes completos y descargables.
**Midsea:** Mejorar:
- Reportes regulatorios automáticos por país/estado
- Insights de IA: "María domina X pero necesita reforzar Y"
- Sugerencias de actividades offline conectadas
- Predicciones: "basado en este ritmo, María tendrá 89% final"

### 2.8 GRADEBOOK (03:39)

- Lista de cursos con barras de progreso y notas
- Math: 76% (C), Astronomy: 86% (B), Ancient World History: 91% (A-), etc.
- Fechas de inicio/fin
- "Print"

**Fortaleza:** Notas claras con letras (A, B, C).
**Midsea:** Mejorar:
- MasteryMap visual (constelación de competencias)
- Predicciones de nota final
- Comparativa con estándares del país
- "Mapa de Riesgo": competencias con alta probabilidad de dificultad

### 2.9 STUDENT LOGIN (04:02)

- "Welcome back to your learning journey!"
- Imágenes de niños diversos en hexágonos
- "Student Sign In": First Name, Last Name, Password, Remember me
- "Or continue with Parent Account"

**Fortaleza:** Diseño amigable y diverso.
**Midsea:** Mantener, agregar avatar del niño previo.

### 2.10 STUDENT DASHBOARD — Learning Path (04:15)

- Header: Logo Mia + 122,362 Gold + Avatar Renata + Parents | Log Out
- Top nav: Learning Path | All Lessons | Gradebook | My World | My Friends | Videos | Community
- Banner: "39 Day Streak" (Grand Canyon) — "Streak is Due"
- Streak Pending: Complete a task to continue your streak (calendario Th Fr Sa)
- My Rank: Renata "Renata" — 26941 — 39 Day Streak
- Longest Learning Streaks leaderboard (Emmett 1631, Zakk 1614, Mason 1591...)
- Today's Progress: 0/113 (circular progress)
- "On your Learning Path" — mini cards de tipos de actividad
- "Tell me more" / "Click here to work ahead"

**Fortaleza:** Streaks y leaderboards son MUY motivadores.
**Midsea:** Mantener y mejorar:
- "0/113" es abrumador → cambiar a "3/5 tareas de hoy" (Sylvie decide cuántas)
- Sylvie sugiere qué hacer next basado en energía/hora del día
- Agregar "racha de mastery" (no solo de actividad)
- Leaderboard por competencia, no solo por tiempo

### 2.11 LEARNING PATH — Assignments (04:22)

- Cards grandes por materia con ilustraciones:
  - Reading Comprehension: "Finding the Central Idea and Venice: The City on Water" — Student PDF — +100 Gold
  - Language Arts: Level G — 0/0 tasks — "No more assignments for today!" ✓
  - Math: Level F — "Operations With Whole Numbers Wrap-Up" — +100 Gold
  - Astronomy — 0/0 — "No more assignments for today!" ✓
- Cada card: título, descripción, recompensa de gold, icono de tipo

**Fortaleza:** Cards visuales atractivas. Recompensa clara.
**Midsea:** Mejorar:
- "+100 Gold" por cualquier actividad → "+100 Nexos por mastery (80%+)"
- Dificultad adaptativa visible
- Tiempo estimado por actividad
- Sylvie explica por qué esta actividad ahora

### 2.12 DENTRO DE UNA LECCIÓN (04:25)

- "Finding the Central Idea and Venice: The City on Water"
- Slide 1: "In this lesson, you will read a short nonfiction passage..."
- Slide 2: Educator Information and Directions (PDF)
- Slide 3: Student Reading Guide — Before Reading checklist
- Slide 4: Taking Notes and Annotating — strategies
- Slide 5: Central Idea — "what the text is all about" (con círculo rojo)
- Slide 6: Supporting details — facts, quotes, anecdotes, examples, dates
- Slide 7: Text structure — cause and effect, descriptive, compare and contrast, chronological order, problem and solution
- Navigation: Download | Print | Next →
- Left sidebar: PDF | Video | Practice | Assessment (iconos verticales)

**Fortaleza:** Formato slide-by-slide claro. Múltiples formatos (PDF, video, práctica).
**Midsea:** Mejorar:
- Sylvie explicando cada slide con voz si el niño lo necesita
- Interactividad (arrastrar, seleccionar, escribir) en vez de solo lectura
- Checkpoints de comprensión entre slides
- "Modo focus": Sylvie guía paso a paso si el niño está atascado

### 2.13 QUIZ / ASSESSMENT (05:37)

- "Operations With Whole Numbers Wrap-Up"
- Paginación: 1 2 3 4 5 6 7 8 9 10 11 12 >
- Pregunta: "Evaluate the expression: 6 × 12 ÷ 9 × 3"
- Opciones: 12, 13, 8, 24 (radio buttons)
- Icono de audio (text-to-speech) en cada opción
- Left sidebar: PDF | Video | Practice | Assessment

**Fortaleza:** Audio por opción es excelente para accesibilidad.
**Midsea:** Mejorar:
- Sylvie detecta si el niño está atascado y ofrece pista proactiva
- IRT adaptativo: si falla, pregunta más fácil; si acierta, más difícil
- Explicación inmediata del error, no solo "incorrecto"
- "Modo tutor": Sylvie explica el concepto antes de continuar

### 2.14 ALL LESSONS (05:54)

- Grid de materias con ilustraciones grandes:
  - Language Arts (máquina de escribir)
  - Math (símbolos matemáticos)
  - Science (cohete)
  - Social Studies (castillo)
  - Biblical Studies (cruz)
  - Health (corazón)
  - Life Skills (libro)
- Search bar

**Fortaleza:** Grid visual atractivo.
**Midsea:** Mejorar:
- "Mundos Temáticos" (Ciudad STEM, Bosque Literario, etc.)
- Mundos desbloqueables por progreso
- Recomendaciones de Sylvie basadas en intereses

### 2.15 MY WORLD (06:12)

- Mundo 3D isométrico con avatar del estudiante caminando
- Edificios: My Shop, Design Studio, Pets, Dragon Egg, Upgrade Castle, Furniture, Clothing, Art
- El avatar se mueve por el mundo haciendo click

**Fortaleza:** EL diferenciador visual más fuerte de Miacademy. El mundo reduce ansiedad y da sensación de aventura.
**Midsea:** MANTENER y mejorar:
- Hacerlo más interactivo (Sylvie aparece en el mundo)
- Mundos temáticos por materia (Laboratorio Químico, Bosque Literario)
- Study Pods como "casas" en el mundo donde se encuentran amigos
- "Portales" a desafíos y competencias

### 2.16 MY SHOP (06:19)

- "MY SHOP" header
- Tabs: My Business | Design Studio
- "What do you think of this shop?" — comentarios con moderación
- "No items designed yet"

**Fortaleza:** Emprendimiento estudiantil. Creatividad.
**Midsea:** Mantener y mejorar:
- Marketplace estudiante-estudiante con moderación AI
- Productos educativos (worksheets, guías) que el estudiante crea
- "Tienda de conocimiento": vender explicaciones a otros estudiantes

### 2.17 PET WORLD (06:33)

- "Pet World" — Hatch eggs and raise pets
- Mascotas: dragon, panda, perro, tortuga, gato, conejo, etc.
- Tabs: Home | bunny the hopper | Eggs | Shop | Play | Petsitting | Help
- Stats por mascota: Strength, Food, Fun (0/10)
- Shop items: Cuddle (0 Gold), Bath (5 Gold), Play (10 Gold), Go for a Walk (15 Gold), Exercise (20 Gold)
- Accessories: Honey, Tie, Brush, Doll, Petsit for 30 days (50 Gold)

**Fortaleza:** Las mascotas virtuales son MUY motivadoras para niños.
**Midsea:** Mantener y mejorar:
- Conectar mascotas con el aprendizaje: "Tu mascota crece cuando completas lecciones con mastery"
- Mascotas que representan competencias dominadas ("Tu dragón de fracciones evolucionó!")
- Cuidado de mascota como "break" entre lecciones
- Mascotas compartidas en Study Pods

### 2.18 MY FRIENDS (06:58)

- Tabs: Friends | My Friends | Invite a Friend | End Friendship | Block List
- "Send a Present to a Friend!"
- "You have 1 friends"
- Search by name/nickname/code | Search by interest
- Mail: Inbox, Group Inbox, Starred, Sent
- Mia "LoveToHelp" — robot amigable

**Fortaleza:** Amistades controladas. Seguridad.
**Midsea:** Mantener y mejorar:
- Study Pods emparejados por debilidades complementarias (no solo por interés)
- Comentarios predefinidos + moderación AI
- "Clanes de Aprendizaje" para proyectos colaborativos
- "Mentores": estudiantes avanzados ayudan a novatos

### 2.19 VIDEOS (07:12)

- "Trending Videos" / "New Videos" / "Top Videos"
- Videos subidos por estudiantes (UGC)
- Títulos: "The life of a creeper part 1", "Exciting Middle School Spanish Course!", "Reenacting book/movie quotes part 2"
- "Upload New Video"

**Fortaleza:** UGC es excelente para engagement.
**Midsea:** Mantener y mejorar:
- Moderación AI antes de publicar
- Desafíos de video temáticos ("Explica fracciones en 60 segundos")
- Recompensas por contenido educativo de calidad
- "Video respuestas" a preguntas de otros estudiantes

### 2.20 COMMUNITY (07:31)

- Newspaper section
- "What's Been Happening... (moderated)"
- Posts con emojis predefinidos (no chat libre)
- "Create Your Own Shop!" — "Your Customers: 0"
- "Top 50 Shops" leaderboard
- Gold Competition: "You have earned 3,494 Gold this month" — "Your Rank: 57425"
- Site Rules | About Your Community | Rules
- "Last Month's Winners" — "Won most Gold"

**Fortaleza:** Comunidad moderada es esencial para seguridad. Newspaper escrito por estudiantes es genial.
**Midsea:** Mantener y mejorar:
- Competencias de "Logros de Transferencia" (aplicar al mundo real)
- Ranking por "mastery" no solo por "gold earned"
- "Periodista Junior": estudiantes escriben sobre temas del currículo
- "Debate Club": argumentación estructurada sobre temas de estudio

### 2.21 GOLD / ECONOMÍA (07:53)

- Recent Transactions:
  - 100 for solving a challenge
  - 100 for solving a challenge
  - Earned 45 in Sports Wrap-Up
  - Earned 36 in Operations With Whole Numbers Wrap-Up
  - Earned 36 in Vocabulary - 7th Grade
- Leaderboard global de gold (Zoelle 126,582, Savannah 55,334, etc.)
- Gold Competition mensual

**Fortaleza:** Transparencia de transacciones. Leaderboard motivador.
**Midsea:** Mejorar:
- "Gold por completar" → "Nexos por mastery (80%+)"
- "Sinks" de economía: la moneda debe tener valor (no solo acumularse)
- Trading entre estudiantes con moderación
- "Impuestos": donar Nexos a proyectos comunitarios
- "Inversión": invertir Nexos en "mejorar tu mundo"

---

## PARTE 3: TABLA COMPARATIVA CONSOLIDADA

| Dimensión | Wited | Miacademy | Midsea (mejor de ambos + diferenciadores) |
|-----------|-------|-----------|------------------------------------------|
| **LOGIN** | Simple, un rol | Padre/Estudiante separado | Padre/Estudiante/Tutor con avatares personalizados |
| **NAV PADRE** | Tabs básicas (Calificaciones, Estadísticas) | Tabs completas + recompensas + control | Parent Copilot AI: dashboard predictivo de 5 min con acciones sugeridas |
| **NAV ESTUDIANTE** | Sidebar jerárquica (Inicio→Aprender→Materia) | Top nav + mundo 3D + learning path | Navegación por intención (/stuck, /prep, /explore, /review) + mundo 3D |
| **MUNDO VISUAL** | Ninguno (grid de materias) | Isla 3D con edificios interactivos | Mundos temáticos por materia + canvas de competencias + Sylvie en el mundo |
| **PROGRESO** | % por materia (0%, 100%, 94%) | Streaks + leaderboard + 0/113 tasks | MasteryMap (constelación de competencias) + streaks de mastery |
| **GAMIFICACIÓN** | MaxPoints por puzzles aislados (pérdida por error) | Gold + tienda + mascotas + shop + clanes | Nexos por mastery + Portafolio de Habilidades + mascotas conectadas al aprendizaje |
| **ECONOMÍA** | Puntos por puzzles (tóxico) | Gold por lección + competencias + sinks limitados | Nexos por mastery + marketplace estudiante + sinks reales + trading |
| **MASCOTAS** | Ninguna (solo avatar estático Max) | Pet World virtual con stats y cuidado | Mascotas que crecen con mastery + representan competencias + breaks |
| **TIENDA** | MaxPoints shop (cursos genéricos) | My Shop + Design Studio + marketplace | Marketplace con productos educativos creados por estudiantes + moderación AI |
| **COMUNIDAD** | No tiene | Newspaper + comentarios predefinidos + clubs | Newspaper + Study Pods + Clanes + Debate Club + moderación AI |
| **VIDEOS** | No tiene | UGC estudiantil (trending/new/top) | UGC + desafíos temáticos + video-respuestas + moderación AI |
| **AMIGOS** | No tiene | My Friends controlado + mail + regalos | Study Pods emparejados por debilidades complementarias + mentores |
| **AI TUTOR** | Max AI (chatbot reactivo, sin contexto, avatar estático) | **NO TIENE** | Sylvie: proactiva, memoria persistente, perfil cognitivo, 7 estados de avatar, multimodal |
| **PERSONALIZACIÓN** | Ninguna (perfil básico: nombre, curso) | Self-paced pasivo (elige qué hacer) | AI adaptativo: formato, ritmo, dificultad según perfil cognitivo |
| **OFFLINE** | No tiene | Descarga de lecciones + worksheets | Offline mode + worksheets PDF generados por IA personalizados |
| **ASSESSMENTS** | Quiz tradicional (checkmarks lineales) | Quiz con audio por opción + paginación | IRT adaptativo + explicación inmediata del error + Sylvie interviene |
| **CELEBRACIONES** | Trofeo estático + mensaje genérico | Animaciones + gold + desbloqueo visual | Celebraciones contextuales con Sylvie + desbloqueos de mundo + mascotas |
| **REPORTES PADRE** | Tabla Excel con notas N°1-N°5 (datos crudos) | Report card detallado + attendance + gradebook | Reportes regulatorios automáticos + insights predictivos + Mapa de Riesgo |
| **CONTROL PARENTAL** | Ninguno (solo ver notas) | Recompensas gold + permisos + límites de tiempo | Parent Copilot: aprobación de compras + Sylvie permissions + panic button |
| **BILINGÜE** | Español (Chile) | Solo inglés | Español nativo + inglés toggle + code-switching natural |
| **CURRÍCULO** | Segundo medio (Chile, materias tradicionales) | K-8 (MiaPrep separado $394/mes) | K-12 integrado + latinoamericano + IB PYP/MYP opcional |
| **PRECIO** | No visible | $45/mes flat (hasta 4 hijos) | $29 Core / $45 Pro / $69 Family (4 hijos) |
| **STREAKS** | "En racha" badge simple | 39 Day Streak + leaderboard global | Streaks de mastery + racha por competencia + leaderboard por habilidad |
| **LEADERBOARD** | No tiene | Longest Learning Streaks + Gold Competition | Leaderboard por competencia + Clanes + ranking por "aplicación al mundo real" |
| **SOCIAL** | No tiene | Friends + Shops + Newspaper + Clubs | Study Pods + Clanes + Mentores + Debate Club + moderación AI |
| **ACCESIBILIDAD** | Ninguna | Audio por opción (text-to-speech) | Audio + voice input + Sylvie explica en formato preferido + contraste AA |

---

## PARTE 4: DIFERENCIADORES EXCLUSIVOS DE MIDSEA

Estos son elementos que NI Wited NI Miacademy tienen:

### 4.1. Sylvie — Tutor AI Proactivo
- **NO** es un chatbot que espera a que preguntes (como Max AI)
- **NO** es ausente (como Miacademy)
- Es un **agente autónomo** que:
  - Detecta cuando estás atascado y ofrece ayuda antes de que pidas
  - Conoce tu historial de errores y anticipa dónde vas a tropezar
  - Adapta el formato de explicación a tu perfil cognitivo (visual, kinestésico, auditivo)
  - Genera diagramas interactivos, ejercicios personalizados, worksheets
  - Te guía por descubrimiento, nunca te da la respuesta directa
  - Celebra tu esfuerzo, no solo tu resultado

### 4.2. Navegación por Intención
- En vez de "Inicio → Aprender → Matemática → Grado 5 → Unidad 3 → Tema 2"
- El estudiante dice: "Estoy atascado", "Practicar para prueba", "Aprender algo nuevo", "Revisar lo que sé"
- Sylvie maneja el resto

### 4.3. MasteryMap — Constelación de Competencias
- En vez de "Matemática 75%" (qué significa eso?)
- El estudiante ve un mapa visual de habilidades:
  - Nodos brillantes: competencias dominadas
  - Nodos pulsantes: en progreso
  - Nodos grises: bloqueados (necesitas prerequisitos)
  - Líneas conectando conceptos relacionados
- Cada nodo es una habilidad real: "Resuelve ecuaciones lineales", "Identifica estructura textual"

### 4.4. Study Pods — Aprendizaje Social Inteligente
- No son "amigos" al azar (como Miacademy)
- Son grupos de 3-4 estudiantes **emparejados por debilidades complementarias**
  - Uno domina geometría pero lucha con álgebra
  - Otro domina álgebra pero lucha con geometría
  - Se ayudan mutuamente con moderación AI
- Sylvie actúa como moderadora: detecta malentendidos, sugiere intervenciones

### 4.5. Parent Copilot — Dashboard Predictivo
- No es "tu hijo completó 3 ejercicios" (Wited) ni "180 hrs de estudio" (Miacademy)
- Es: "Basado en sus patrones de error en fracciones, hay 78% de probabilidad de dificultades en la próxima unidad de ecuaciones. Aquí hay 2 actividades de 10 min para prevenirlo."
- Acciones sugeridas, no datos crudos

### 4.6. Logros de Transferencia
- No solo "completaste la lección de fracciones"
- Sino: "Aplicaste fracciones para calcular ingredientes de una receta real"
- Recompensas por conectar el aprendizaje con el mundo real

### 4.7. Bilingüe Nativo
- No traducción literal
- Contenido adaptado culturalmente
- Code-switching natural: si el estudiante mezcla español e inglés, Sylvie sigue el lead
- Toggle a nivel de familia, no por lección

---

## PARTE 5: DECISIONES DE DISEÑO PARA CLAUDE

### 5.1. Qué copiar de Wited (porque lo hace bien)
1. **Chat con avatar** — Mantener, pero hacerlo proactivo y con memoria
2. **Profe Express** — Mantener como escalón superior, pero Sylvie resuelve 90% en tiempo real
3. **Grid de materias** — Mantener como vista alternativa, pero no principal
4. **Desafíos** — Mantener, pero conectar con currículo y sin pérdida de puntos

### 5.2. Qué copiar de Miacademy (porque lo hace bien)
1. **Mundo 3D** — MANTENER. Es el diferenciador visual más fuerte.
2. **Streaks** — MANTENER. Dopamina de progreso visible.
3. **Leaderboards** — MANTENER. Competencia sana.
4. **Mascotas virtuales** — MANTENER. Motivación emocional.
5. **Tienda/My Shop** — MANTENER. Economía con propósito.
6. **Newspaper/Community** — MANTENER. Engagement social.
7. **UGC Videos** — MANTENER. Creatividad estudiantil.
8. **Recompensas parentales** — MANTENER. Control parental positivo.
9. **Audio por opción** — MANTENER. Accesibilidad.
10. **Calendario de cursos** — MANTENER. Planificación visible.

### 5.3. Qué descartar de Wited (porque lo hace mal)
1. **Navegación jerárquica** — Reemplazar por navegación por intención
2. **Max AI sin contexto** — Reemplazar por Sylvie con memoria persistente
3. **Progreso por materia** — Reemplazar por MasteryMap de competencias
4. **Calificaciones tabulares** — Reemplazar por dashboard predictivo
5. **Estadísticas de actividad** — Reemplazar por métricas de aprendizaje
6. **Gamificación tóxica** — Reemplazar por Nexos por mastery
7. **Perfil básico** — Reemplazar por perfil cognitivo

### 5.4. Qué descartar de Miacademy (porque lo hace mal)
1. **Gold por completar** — Cambiar a Nexos por mastery (80%+)
2. **Self-paced pasivo** — Agregar AI que guía y adapta
3. **Sin AI tutor** — Agregar Sylvie (diferenciador principal)
4. **Solo inglés** — Agregar español nativo + bilingüe
5. **K-8 solo** — Integrar K-12 desde el inicio
6. **MiaPrep separado y caro** — Unificar en una plataforma
7. **Sin reportes regulatorios** — Agregar automáticos por país
8. **Sin personalización cognitiva** — Agregar perfil de aprendizaje

---

## PARTE 6: ROADMAP DE IMPLEMENTACIÓN VISUAL

### Fase 1: Fundamentos (Semanas 1-3)
- [ ] Auth multi-rol (estudiante, padre, tutor)
- [ ] Mundo 3D básico (isla con paths de lecciones)
- [ ] Sylvie avatar con 3 estados (idle, active, explaining)
- [ ] Chat básico con streaming
- [ ] Streaks y leaderboard básico
- [ ] Grid de materias (vista alternativa)

### Fase 2: Core de Aprendizaje (Semanas 4-6)
- [ ] Flujo /stuck: foto/texto → Sylvie identifica → explicación → ejercicio
- [ ] Mascotas virtuales conectadas al progreso
- [ ] Tienda/My Shop básico
- [ ] Recompensas parentales
- [ ] Audio por opción (accesibilidad)
- [ ] Calendario de cursos

### Fase 3: Adaptación y Social (Semanas 7-10)
- [ ] Flujo /prep: assessment diagnóstico + plan de estudio
- [ ] Study Pods: matching básico + sesiones colaborativas
- [ ] MasteryMap visual (constelación de competencias)
- [ ] Newspaper/Community moderada
- [ ] UGC Videos con desafíos temáticos
- [ ] Parent Copilot v1 (informacional)

### Fase 4: Avanzado (Semanas 11-14)
- [ ] Sylvie con 7 estados completos (Rive)
- [ ] Flujo /explore: búsqueda semántica + rutas de descubrimiento
- [ ] Dashboard predictivo (Mapa de Riesgo, Índice de Confianza)
- [ ] IRT adaptativo en assessments
- [ ] Bilingüe: toggle español/inglés
- [ ] Reportes regulatorios automáticos

### Fase 5: Pulido (Semanas 15+)
- [ ] Sylvie moderadora de Study Pods
- [ ] Generación de worksheets personalizados (PDF)
- [ ] Mundos temáticos por materia
- [ ] Logros de Transferencia
- [ ] App mobile nativa
- [ ] VR/AR labs low-cost

---

## PARTE 7: GLOSARIO

| Término | Definición |
|---------|-----------|
| **Sylvie** | Tutor AI de Midsea. Agente autónomo con memoria, perfil cognitivo y contexto curricular. |
| **Nexos** | Moneda virtual de Midsea. Se gana por mastery (80%+), no por tiempo ni completar. |
| **MasteryMap** | Mapa visual de competencias del estudiante. Nodos conectados, niveles 0-4. |
| **Study Pod** | Grupo de 3-4 estudiantes emparejados por debilidades complementarias. |
| **Parent Copilot** | Dashboard del padre con planificación AI, alertas proactivas y reportes regulatorios. |
| **Logro de Transferencia** | Recompensa por aplicar conocimiento al mundo real (foto, video, proyecto). |
| **IRT** | Item Response Theory. Algoritmo para assessments adaptativos. |
| **ProactiveHint** | Sugerencia no-intrusiva de Sylvie cuando detecta dificultad. |
| **Streak de Mastery** | Racha de lecciones completadas con mastery (80%+), no solo completadas. |
| **Mundo Temático** | Mundo 3D dedicado a una materia (Laboratorio Químico, Bosque Literario). |

---

*Documento preparado para: Equipo Midsea*
*Basado en análisis de videos reales de Wited y Miacademy*
*Fecha: 2026-05-17*
