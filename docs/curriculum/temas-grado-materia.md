# Temas por Grado y Materia — Índice canónico de outlines

> Índice del corpus curricular del founder en `docs/content/source/`. Este archivo es el **mapa que el pipeline de generación (ADR-006) lee como punto de entrada** para descubrir qué outline corresponde a cada curso del catálogo.
>
> No duplica el contenido de los outlines — solo apunta a ellos con metadata estructural.
>
> **Cobertura actual**: 65 archivos cubriendo 12 grados × 6 materias (K-12 completo). Hay dos formatos coexistentes:
> - **Formato A (Primaria-style)**: `Mes → Unidad/Tema → Contenidos → Hands-On → Producto del estudiante`. Usado por: toda Primaria, Sociales HS, Música HS, Inglés ESL todos los niveles (con variante "Semana tipo 4 días").
> - **Formato B (HS-denso)**: `Mes → 2 Temas/mes → Hands-On (4 actividades)` sin "Producto del estudiante". Usado por: Lengua HS, Matemática HS, Ciencias HS.

---

## 1. Inglés ESL (12 archivos, formato A semanal en todos)

| Grado | Nivel CEFR | Archivo (.md) | Carga horaria |
|---|---|---|---|
| 1° Primaria | Pre-A1 | `English ESL/Primaria/Ingles_ESL_Grado_1_Completo_Final.md` | 4 días/sem |
| 2° Primaria | Pre-A1 | `English ESL/Primaria/Ingles_ESL_Grado_2_Completo_Final.md` | 4 días/sem |
| 3° Primaria | Pre-A1/A1 | `English ESL/Primaria/Ingles_ESL_Grado_3_Completo_Final.md` | 4 días/sem |
| 4° Primaria | A1 | `English ESL/Primaria/Ingles_ESL_Grado_4_Completo_Final.md` | 4 días/sem |
| 5° Primaria | A1+ | `English ESL/Primaria/Ingles_ESL_Grado_5_Completo_Final.md` | 4 días/sem |
| 6° Primaria | A1+/A2 | `English ESL/Primaria/Ingles_ESL_Grado_6_Completo_Final.md` | 4 días/sem |
| 7° Middle School | A2 | `English ESL/Middle School/Ingles_ESL_Grado_7_Completo_Final.md` | 4 días/sem |
| 8° Middle School | A2 | `English ESL/Middle School/Ingles_ESL_Grado_8_Completo_Final.md` | 4 días/sem |
| **9° Secundaria** ⭐ | A2 | `English ESL/Secundaria/Ingles_ESL_Grado_9_Completo_Final.md` | 4 días/sem |
| **10° Secundaria** ⭐ | A2+/B1 | `English ESL/Secundaria/Ingles_ESL_Grado_10_Completo_Final.md` | 4 días/sem |
| 11° Secundaria | B1 | `English ESL/Secundaria/Ingles_ESL_Grado_11_Completo_Final.md` | 4 días/sem |
| 12° Secundaria | B1+/B2 | `English ESL/Secundaria/Ingles_ESL_Grado_12_Completo_Final.md` | 4 días/sem |

**Estructura común**: 10 unidades mensuales (Marzo-Diciembre) + Semana tipo 4 días. Día 4 incluye "reflexión cristiana" o "valores cristianos" según grado. Cada unidad tiene Vocabulario + Estructuras gramaticales objetivo.

---

## 2. Lengua (Español) (10 archivos)

| Grado | Archivo | Formato | Carga horaria |
|---|---|---|---|
| 1° Primaria | `Espanol/Primaria/Lengua_1_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 2° Primaria | `Espanol/Primaria/Lengua_2_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 3° Primaria | `Espanol/Primaria/Lengua_3_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 4° Primaria | `Espanol/Primaria/Lengua_4_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 5° Primaria | `Espanol/Primaria/Lengua_5_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 6° Primaria | `Espanol/Primaria/Lengua_6_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 7°-8° Middle School (combinado) | `Espanol/Middle School/Lengua_7th, 8th_ Completo.md` | A o B (verificar) | 4 días/sem |
| **9°-10° Secundaria (combinado)** ⭐ | `Espanol/Secundaria/Lengua_9th, 10th_ Completo_Completo.md` | **B (2 temas/mes)** | 4 días/sem × 4 hs/día |
| 11° Secundaria | `Espanol/Secundaria/Lengua_11_Secundaria_HandsOn_Completo.md` | B | 4 días/sem × 4 hs/día |
| 12° Secundaria | `Espanol/Secundaria/Lengua_12_Secundaria_HandsOn_Completo.md` | B | 4 días/sem × 4 hs/día |

**Nota**: Lengua HS está organizada en archivos combinados (9°-10° juntos) y archivos individuales (11° y 12° separados). El curso del catálogo `language-grade-9-10` mapea al archivo combinado.

---

## 3. Matemática (12 archivos)

| Grado | Archivo | Formato | Carga horaria |
|---|---|---|---|
| 1° Primaria | `Matematicas/Primaria/Matematica_1_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 2° Primaria | `Matematicas/Primaria/Matematica_2_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 3° Primaria | `Matematicas/Primaria/Matematica_3_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 4° Primaria | `Matematicas/Primaria/Matematica_4_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 5° Primaria | `Matematicas/Primaria/Matematica_5_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 6° Primaria | `Matematicas/Primaria/Matematica_6_Primaria_HandsOn_Completo.md` | A | 4 días/sem |
| 7° Middle School | `Matematicas/Middle School/Matematica_7_Marzo_Diciembre_Completo.md` | B | 4 días/sem |
| 8° Middle School | `Matematicas/Middle School/Matematica_8_Marzo_Diciembre_Completo.md` | B | 4 días/sem |
| **9° Secundaria** ⭐ | `Matematicas/Secundaria/Matematica_9_Marzo_Diciembre_Completo.md` | B | 4 días/sem × 4 hs/día |
| **10° Secundaria** ⭐ | `Matematicas/Secundaria/Matematica_10_Marzo_Diciembre_Completo.md` | B | 4 días/sem × 4 hs/día |
| 11° Secundaria | `Matematicas/Secundaria/Matematica_11_Secundaria_HandsOn_Completo.md` | B | 4 días/sem × 4 hs/día |
| 12° Secundaria | `Matematicas/Secundaria/Matematica_12_Secundaria_HandsOn_Completo.md` | B | 4 días/sem × 4 hs/día |

**Nota**: Mat HS está 100% en formato B (2 temas/mes). Cada tema requiere 2-4 lecciones cortas generadas por el pipeline.

---

## 4. Ciencias (11 archivos — algunos HS por disciplina específica)

| Grado / Tema | Archivo | Formato | Notas |
|---|---|---|---|
| 1° Primaria — Ciencia alrededor de mí | `Ciencias/Primaria/Ciencias_1_Primaria_Ciencia_alrededor_de_mi.md` | A | Ciencias generales primaria |
| 2° Primaria — Explorando la Ciencia | `Ciencias/Primaria/Ciencias_2_Primaria_Explorando_la_Ciencia.md` | A | |
| 3° Primaria — Tierra y Espacio | `Ciencias/Primaria/Ciencias_3_Primaria_Tierra_y_Espacio.md` | A | |
| 4° Primaria — Ciencia General | `Ciencias/Primaria/Ciencias_4_Primaria_Ciencia_General.md` | A | |
| 5° Primaria — Estructura de la Ciencia | `Ciencias/Primaria/Ciencias_5_Primaria_Estructura_de_la_Ciencia.md` | A | |
| 6° Primaria — Ciencias Físicas | `Ciencias/Primaria/Ciencias_6_Primaria_Ciencias_Fisicas.md` | A | |
| 7°-8° Middle School — De la Vida | `Ciencias/Middle School/Ciencias_7, 8_De la Vida.md` | A o B (verif.) | Combinado |
| **9°-10° Secundaria — Biología** ⭐ | `Ciencias/Secundaria/Ciencias_9,10_ Biologia .md` | B | "Reflexión fe y ciencia" + "Cierre bíblico" en outline |
| 10° Secundaria — Ecología | `Ciencias/Secundaria/Ciencias_10_Secundaria_Ecologia.md` | B | Curso paralelo a Biología en 10° |
| 11° Secundaria — Química | `Ciencias/Secundaria/Ciencias_11_Secundaria_Quimica.md` | B | |
| 12° Secundaria — Física | `Ciencias/Secundaria/Ciencias_12_Secundaria_Fisica.md` | B | |

**Nota crítica**: Ciencias HS **NO es un curso integrado** sino 4 cursos por disciplina (Biología, Ecología, Química, Física). El catálogo Midsea respeta esta estructura. En el Pilot Mínimo solo Biología 9-10 entra.

---

## 5. Ciencias Sociales (10 archivos — organización por país en Primaria, por tema en HS)

| Grado / Tema | Archivo | Formato | Notas |
|---|---|---|---|
| 1° Primaria — Argentina | `Ciencias Sociales/Primaria/Ciencias_Sociales_1_Primaria_Argentina.md` | A | Historia argentina |
| 2° Primaria — Argentina | `Ciencias Sociales/Primaria/Ciencias_Sociales_2_Primaria_Argentina.md` | A | Continúa AR |
| 3° Primaria — Argentina | `Ciencias Sociales/Primaria/Ciencias_Sociales_3_Primaria_Argentina.md` | A | |
| 4° Primaria — Argentina | `Ciencias Sociales/Primaria/Ciencias_Sociales_4_Primaria_Argentina.md` | A | |
| 5° Primaria — Geografía | `Ciencias Sociales/Primaria/Ciencias_Sociales_5_Primaria_Geografia.md` | A | Transición a Geografía |
| 6° Primaria — Geografía | `Ciencias Sociales/Primaria/Ciencias_Sociales_6_Primaria_Geografia.md` | A | |
| 7°-8° Middle School — Civilización Antigua I | `Ciencias Sociales/Middle School/Ciencias_Sociales_7, 8_Civilizacion_Antigua I.md` | A | Combinado |
| **9°-10° Secundaria — Civilización Antigua II** ⭐ | `Ciencias Sociales/Secundaria/Civilizacion_Antigua_II_Grados_9_10.md` | A "Producto del estudiante" | Continuación de la Civ Antigua I |
| 11° Secundaria — Historia Mundial I | `Ciencias Sociales/Secundaria/Historia_Mundial_I_11_Secundaria.md` | A | |
| 12° Secundaria — Historia Mundial II | `Ciencias Sociales/Secundaria/Historia_Mundial_II_12_Secundaria.md` | A | |

**Nota crítica importante (per usuario)**: En Primaria, Sociales tiene **planificación de cubrir Historia de cada país latino**: Argentina (en proceso), República Dominicana, México, Costa Rica, Colombia. Los archivos actuales solo tienen Argentina; los de RD/MX/CR/CO están planificados pero no creados aún. **No bloquea pilot HS**, pero condiciona v1.2 (expansión a Primaria).

---

## 6. Música (12 archivos, formato A en todos)

| Grado | Archivo | Carga horaria |
|---|---|---|
| 1° Primaria | `Musica/Primaria/Musica_1_Primaria.md` | 2 días/sem |
| 2° Primaria | `Musica/Primaria/Musica_2_Primaria.md` | 2 días/sem |
| 3° Primaria | `Musica/Primaria/Musica_3_Primaria.md` | 2 días/sem |
| 4° Primaria | `Musica/Primaria/Musica_4_Primaria.md` | 2 días/sem |
| 5° Primaria | `Musica/Primaria/Musica_5_Primaria.md` | 2 días/sem |
| 6° Primaria | `Musica/Primaria/Musica_6_Primaria.md` | 2 días/sem |
| 7° Middle School | `Musica/Middle School/Musica_7_MiddleSchool.md` | 2 días/sem |
| 8° Middle School | `Musica/Middle School/Musica_8_MiddleSchool.md` | 2 días/sem |
| **9° Secundaria** ⭐ | `Musica/Secundaria/Musica_9_Secundaria.md` | 2 días/sem |
| 10° Secundaria — Producción digital | `Musica/Secundaria/Musica_10_Secundaria.md` | 2 días/sem |
| 11° Secundaria | `Musica/Secundaria/Musica_11_Secundaria.md` | 2 días/sem |
| 12° Secundaria | `Musica/Secundaria/Musica_12_Secundaria.md` | 2 días/sem |

---

## Símbolo ⭐ — Pilot Mínimo (8 cursos del Epic 04)

Las filas marcadas con ⭐ son los 8 cursos del Pilot Mínimo (ver `docs/curriculum/midsea-hs-catalog.md`). Esos archivos son los que el pipeline va a procesar en Epic 04. Total estimado: **~280 lecciones generadas a partir de estos 8 outlines**.

---

## Cómo el pipeline ADR-006 usa este índice

1. **`scripts/generate-course.mjs --course math-grade-9`**:
   - Lee `docs/curriculum/midsea-hs-catalog.md`, busca `slug = math-grade-9`, encuentra `Source file = Matematicas/Secundaria/Matematica_9_Marzo_Diciembre_Completo.md`.
   - Lee el .md del outline.
   - Detecta el formato (B) y parsea: Mes → 2 Temas → Hands-On (4 actividades).
   - Para cada Tema (20 totales), genera 2 lecciones cortas → 40 lecciones output.
   - Output en `outputs/gen/math-grade-9/<lesson-slug>.json`.

2. **El parser tiene que soportar ambos formatos** (A y B). Detección via heurística simple: presencia del header "Producto del estudiante" o "Semana tipo (4 días)" → Formato A; presencia de "## <MES>" seguido de dos "### Tema:" sin "Producto" → Formato B.

3. **Identidad cristiana del outline se preserva** en el prompt de generación. Si el outline declara "Enfoque cristiano, analítico y aplicado" (ej. Matemática HS), el prompt instruye a Angela a incluir reflexiones espirituales sutiles donde sea natural (ej. "el orden matemático refleja un Creador ordenador"), nunca forzado. Ver ADR-007.

---

*Última actualización: 2026-05-21 (creado tras audit completo del corpus de 65 outlines). Actualizar este archivo cuando: (a) el founder agregue nuevos outlines (ej. Historia de RD/MX/CR/CO para Primaria), (b) cambie la estructura de carpetas de `docs/content/source/`, (c) se reorganicen cursos del catálogo.*
