# Auditoría de Objetivos Específicos — VentyLab

**Tesis:** Plataforma educativa interactiva para entrenamiento en ventilación mecánica.
**Autora:** Marcela Mazo Castro — Universidad del Valle
**Generado:** 2026-05-19T02:44:55.219Z

## Resumen ejecutivo

- **Gates aprobados:** 12 / 14
- **OE1** — Diseñar e implementar el modelo de contenido didáctico estructurado y trazable. → 4/5 PASS
- **OE2** — Construir el módulo de evaluación basado en quizzes y actividades (exámenes y talleres). → 5/5 PASS
- **OE3** — Generar retroalimentación pedagógica con LLM y respaldo determinístico. → 3/4 PASS

## OE1 — Diseñar e implementar el modelo de contenido didáctico estructurado y trazable.

> OE1: 4/5 gates en estado PASS.

### Gates

| ID | Gate | Estado | Detalle | Evidencia |
|---|---|---|---|---|
| OE1.G1 | Conteo de módulos por nivel coincide con el currículo esperado | PASS | 7 niveles auditados sin discrepancias. | prisma.level.findMany + EXPECTED_BY_TRACK |
| OE1.G2 | Cada módulo tiene al menos una lección | PASS | 0 módulo(s) sin lecciones |  |
| OE1.G3 | Cada lección tiene ≥1 Page con ≥1 PageSection no vacía | WARN | Lecciones sin Page: 5; Lecciones sin secciones útiles: 5 |  |
| OE1.G4 | No existen lecciones huérfanas (sin Module) | PASS | 0 lección(es) huérfana(s) | SELECT COUNT(*) FROM lessons LEFT JOIN modules ... |
| OE1.G5 | Grafo de prerequisitos sin ciclos | PASS | DFS no detectó ciclos en módulos ni niveles. | DFS sobre ModulePrerequisite y LevelPrerequisite |

### OE1 — Cobertura del modelo didáctico

| Level | Module | Lesson | #Pages | #Sections | Status |
| --- | --- | --- | --- | --- | --- |
| mecanica/Prerequisitos | Fisiología Respiratoria | La Inversión Fisiológica (Fundamentos) | 0 | 0 | FAIL: módulo sin Page |
| mecanica/Prerequisitos | Fisiología Respiratoria | Ecuación de Movimiento (Fundamentos) | 0 | 0 | FAIL: módulo sin Page |
| mecanica/Prerequisitos | Fisiología Respiratoria | Variables de Fase (Fundamentos) | 0 | 0 | FAIL: módulo sin Page |
| mecanica/Prerequisitos | Principios de Ventilación Mecánica | Indicaciones de Ventilación Mecánica | 0 | 0 | FAIL: módulo sin Page |
| mecanica/Prerequisitos | Principios de Ventilación Mecánica | Parámetros Ventilatorios Básicos | 0 | 0 | FAIL: módulo sin Page |
| mecanica/Nivel Principiante | La Inversión Fisiológica: De la Presión Negativa a la Positiva | La Inversión Fisiológica: De la Presión Negativa a la Positiva | 1 | 44 | PASS (cobertura a nivel de Module) |
| mecanica/Nivel Principiante | El Santo Grial – La Ecuación del Movimiento Respiratorio | El Santo Grial – La Ecuación del Movimiento Respiratorio | 1 | 35 | PASS (cobertura a nivel de Module) |
| mecanica/Nivel Principiante | Variables de Fase y el Ciclo Respiratorio | La Lógica de la Máquina: Variables de Fase y el Ciclo Respiratorio | 1 | 13 | PASS (cobertura a nivel de Module) |
| mecanica/Nivel Principiante | Taxonomía de los Modos Ventilatorios | Taxonomía de los Modos: Volumen vs. Presión (Control y Asistencia) | 1 | 23 | PASS (cobertura a nivel de Module) |
| mecanica/Nivel Principiante | Monitorización Gráfica I: Escalares y Bucles | Monitorización Gráfica I: Escalares, Bucles y Asincronías básicas | 1 | 98 | PASS (cobertura a nivel de Module) |
| mecanica/Nivel Principiante | Efectos Sistémicos y VILI | Efectos Sistémicos y Lesión Inducida por la Ventilación (VILI) | 1 | 86 | PASS (cobertura a nivel de Module) |
| mecanica/Nivel Intermedio | VCV vs PCV en el Paciente de Alta Complejidad | Ventilación por Control de Volumen (VCV) vs. Control de Presión (PCV) en el Paciente de Alta Complejidad | 1 | 10 | PASS |
| mecanica/Nivel Intermedio | PEEP: Fisiopatología y Optimización de la Oxigenación | PEEP: fisiopatología y optimización de la oxigenación en el paciente obeso | 1 | 11 | PASS |
| mecanica/Nivel Intermedio | Soporte Ventilatorio: PSV, CPAP y Protección Pulmonar | Soporte ventilatorio en el paciente obeso: PSV, CPAP y estrategias de protección pulmonar | 1 | 10 | PASS |
| mecanica/Nivel Intermedio | Modos Duales y SIMV: Fisiopatología Avanzada | Modos duales y SIMV: fisiopatología avanzada, ventilación protectora y andamiaje pedagógico | 1 | 10 | PASS |
| mecanica/Nivel Intermedio | Monitorización Gráfica y Fine Tuning | Monitorización gráfica y Fine Tuning en el paciente con obesidad | 1 | 10 | PASS |
| mecanica/Nivel Intermedio | Mecánicas Avanzadas y Evaluación para el Destete | Mecánicas avanzadas y evaluación para el destete en el paciente obeso | 1 | 10 | PASS |
| mecanica/Nivel Avanzado | VILI y Ventilación Protectora en el Paciente con Obesidad | VILI y ventilación protectora en el paciente con obesidad | 1 | 9 | PASS |
| mecanica/Nivel Avanzado | Monitorización de Alto Nivel: Driving Pressure y Poder Mecánico | Monitorización de alto nivel: Driving Pressure y Poder Mecánico | 1 | 11 | PASS |
| mecanica/Nivel Avanzado | Advertencias, Asincronías y Situaciones Complejas | Advertencias, asincronías y resolución de situaciones complejas | 1 | 10 | PASS |
| mecanica/Nivel Avanzado | Destete Ventilatorio Complejo y VMNI en el Paciente con Obesidad | Destete ventilatorio complejo y uso de VMNI en el paciente con obesidad | 1 | 11 | PASS |
| mecanica/Nivel Avanzado | Ventilación en Obesidad y Sedentarismo: Patologías Avanzadas | Ventilación en el paciente con obesidad y sedentarismo: perspectiva de patologías avanzadas | 1 | 10 | PASS |
| mecanica/Nivel Avanzado | Estrategias en Enfermedades Obstructivas: EPOC, Asma y Fumadores | Estrategias en enfermedades obstructivas: EPOC, asma y fumadores | 1 | 11 | PASS |
| mecanica/Nivel Avanzado | SDRA en el Paciente Obeso: Ventilación Protectora Avanzada | SDRA en el paciente obeso: ventilación protectora avanzada y monitoreo de alta precisión | 1 | 10 | PASS |
| mecanica/Nivel Avanzado | Protección Extrema: Sinergia entre Fisiología Respiratoria y Arquitectura Cognitiva | Protección extrema: sinergia entre fisiología respiratoria y arquitectura cognitiva | 1 | 10 | PASS |
| ventylab/Principiante | Historia y Fisiología Aplicada | Historia y fisiología aplicada: SDL/TBL y estrategias de recuperación | 1 | 9 | PASS |
| ventylab/Principiante | El Ventilador y sus Componentes | El Ventilador y sus Componentes: Aprendizaje autodirigido con SDL/TBL | 1 | 9 | PASS |
| ventylab/Intermedio | Programación de Modos Clásicos | Arquitectura del Aprendizaje Activo y Estructuración con JSON (Programación de modos clásicos) | 1 | 10 | PASS |
| ventylab/Intermedio | Ventilación No Invasiva y Destete | Guía maestra de estrategias de aprendizaje para ventilación no invasiva y destete | 1 | 10 | PASS |
| ventylab/Avanzado | Raciocinio Clínico en Patologías Críticas | Raciocinio clínico en patologías críticas: neurobiología, recuperación y arquitectura de datos | 1 | 9 | PASS |
| ventylab/Avanzado | Innovación, Tecnología y Gestión del Aprendizaje | Innovación, tecnología y gestión del aprendizaje clínico | 1 | 10 | PASS |

## OE2 — Construir el módulo de evaluación basado en quizzes y actividades (exámenes y talleres).

> OE2: 5/5 gates en estado PASS.

### Gates

| ID | Gate | Estado | Detalle | Evidencia |
|---|---|---|---|---|
| OE2.G1 | Existen ≥26 quizzes activos | PASS | 26/26 quizzes activos en BD | prisma.quiz.findMany |
| OE2.G2 | Cada quiz tiene questions[] válidas, passingScore y referencia (Lesson o Module) | PASS | 26/26 quizzes bien formados; 0 sin vínculo válido |  |
| OE2.G3 | Actividades EXAM (≥6) y TALLER (≥9) presentes | PASS | EXAM=6/6, TALLER=9/9, otros=0 | prisma.activity.findMany |
| OE2.G4 | Cada actividad tiene maxScore válido y estructura coherente | PASS | 15/15 actividades bien formadas |  |
| OE2.G5 | evaluation.service.compareConfigurations sigue exportado (API residual) | PASS | Función disponible para futuras integraciones (casos clínicos quedaron fuera de scope). | src/modules/evaluation/evaluation.service.ts |

### OE2 — Inventario de quizzes y actividades

| tipo | título | #preguntas | maxScore/passingScore | vínculo | status |
| --- | --- | --- | --- | --- | --- |
| QUIZ | Quiz: Asincronías Paciente-Ventilador | 5 | 80 | module: module-03-advertencias-asincronias | PASS |
| QUIZ | Quiz: Destete Complejo y VMNI | 5 | 80 | module: module-04-destete-complejo-vmni | PASS |
| QUIZ | Quiz: EPOC y Crisis Asmática | 5 | 80 | module: module-06-epoc-asma-fumadores | PASS |
| QUIZ | Quiz: Monitorización de Alto Nivel | 5 | 80 | module: module-02-monitorizacion-alto-nivel | PASS |
| QUIZ | Quiz: Ventilación en Pacientes Obesos | 5 | 80 | module: module-05-obesidad-sedentarismo | PASS |
| QUIZ | Quiz: Recuperación, Pronóstico y Secuelas | 5 | 80 | module: module-08-recuperacion-proteccion | PASS |
| QUIZ | Quiz: Manejo del SDRA (Síndrome de Distrés Respira | 5 | 80 | module: module-07-sdra | PASS |
| QUIZ | Quiz: VILI y Ventilación Protectora | 5 | 80 | module: module-01-vili-ventilacion-protectora | PASS |
| QUIZ | Quiz: Evaluación y Práctica del Destete (Weaning) | 5 | 80 | module: module-06-avanzado-evaluacion-destete | PASS |
| QUIZ | Quiz: Modos Sincronizados y Duales | 5 | 80 | module: module-04-duales-simv | PASS |
| QUIZ | Quiz: Análisis Gráfico y Fine Tuning | 5 | 80 | module: module-05-graficas-fine-tuning | PASS |
| QUIZ | Quiz: Optimización del PEEP | 5 | 80 | module: module-02-peep-optimizar-oxigenacion | PASS |
| QUIZ | Quiz: Modos Espontáneos - PSV y CPAP | 5 | 80 | module: module-03-soporte-psv-cpap | PASS |
| QUIZ | Quiz: VCV vs PCV - Análisis Profundo | 5 | 80 | module: module-01-vcv-vs-pcv | PASS |
| QUIZ | Quiz: La Ecuación del Movimiento | 5 | 80 | module: module-02-ecuacion-movimiento | PASS |
| QUIZ | Quiz: Efectos Sistémicos de la Ventilación | 5 | 80 | module: module-06-efectos-sistemicos | PASS |
| QUIZ | Quiz: La Inversión Fisiológica | 5 | 80 | module: module-01-inversion-fisiologica | PASS |
| QUIZ | Quiz: Modos Ventilatorios Básicos | 5 | 80 | module: module-04-modos-ventilatorios | PASS |
| QUIZ | Quiz: Monitorización Gráfica Básica | 5 | 80 | module: module-05-monitorizacion-grafica | PASS |
| QUIZ | Quiz: Variables de Fase del Ventilador | 5 | 80 | module: module-03-variables-fase | PASS |
| QUIZ | Quiz: Innovación, Tecnología y Gestión | 5 | 80 | module: ventylab-module-06-innovacion-tecnologia | PASS |
| QUIZ | Quiz: Raciocinio Clínico - Patologías Críticas | 5 | 80 | module: ventylab-module-05-raciocinio-clinico | PASS |
| QUIZ | Quiz: Programación de Modos Clásicos | 5 | 80 | module: ventylab-module-03-programacion-modos | PASS |
| QUIZ | Quiz: VMNI y Estrategias de Destete | 5 | 80 | module: ventylab-module-04-vni-destete | PASS |
| QUIZ | Quiz: Historia y Fisiología Aplicada | 5 | 80 | module: ventylab-module-01-historia-fisiologia | PASS |
| QUIZ | Quiz: Ventilador y sus Componentes | 5 | 80 | module: ventylab-module-02-ventilador-componentes | PASS |
| EXAM | Examen Final: Especialista en Ventilación Mecánica | — | 100 | 0 asignaciones | PASS |
| EXAM | Examen Final: Ventilación Mecánica Intermedia | — | 100 | 0 asignaciones | PASS |
| EXAM | Examen Final: Fundamentos de Ventilación Mecánica | — | 100 | 0 asignaciones | PASS |
| EXAM | Examen Final: VentyLab Avanzado | — | 100 | 0 asignaciones | PASS |
| EXAM | Examen Final: VentyLab Intermedio | — | 100 | 0 asignaciones | PASS |
| EXAM | Examen Final: VentyLab Principiante | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Crisis Asmática y EPOC Exacerbado | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Manejo del Paciente Obeso | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Manejo Avanzado del SDRA | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Interpretación de Ondas y Bucles | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Transición de Modos y Soporte Parcial | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller de Integración: Configuración Inicial y Par | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Troubleshooting y Raciocinio Avanzado | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Programación en el Simulador VentyLab | — | 100 | 0 asignaciones | PASS |
| TALLER | Taller ABP: Reconocimiento y Armado del Circuito | — | 100 | 0 asignaciones | PASS |

## OE3 — Generar retroalimentación pedagógica con LLM y respaldo determinístico.

> OE3: 3/4 gates en estado PASS.

### Gates

| ID | Gate | Estado | Detalle | Evidencia |
|---|---|---|---|---|
| OE3.G1 | evaluation.service.ts existe y exporta compareConfigurations + generateFeedback | PASS | compareConfigurations=true, generateFeedback=true | src/modules/evaluation/evaluation.service.ts |
| OE3.G2 | Smoke test fallback determinístico ⇒ EvaluationFeedback válido | PASS | feedback.length=102, arrays=[strengths=true, improvements=true, recommendations=true] | evaluation.service.ts → generateFeedback (catch → generateFallbackFeedback) |
| OE3.G3 | Provider strategy soporta ≥3 proveedores (OpenAI, Anthropic, Gemini) | PASS | proveedores encontrados: openai, anthropic, gemini | src/config/aiConfig.ts |
| OE3.G4 | Log estructurado con {provider, latencyMs, parsedOK} | WARN | No se encontró un sitio que loguee las tres claves simultáneamente. Reportado como gap (no se modifica código). |  |

### OE3 — Verificación del módulo de retroalimentación

| check | status | evidence_path |
| --- | --- | --- |
| evaluation.service.ts presente y exports OK | PASS | src/modules/evaluation/evaluation.service.ts |
| Fallback determinístico produce EvaluationFeedback válido | PASS | src/modules/evaluation/evaluation.service.ts → generateFallbackFeedback |
| Provider strategy soporta ≥3 proveedores (OpenAI, Anthropic, Gemini) | PASS | src/config/aiConfig.ts |
| Log estructurado con {provider, latencyMs, parsedOK} | WARN | — |

## Conclusión para defensa de tesis

### OE1
- Demuestra que existe un esquema relacional (Level → Module → Lesson → Page → PageSection) instanciado en Postgres.
- Cuantifica cobertura de contenido por track del currículo (mecánica y ventylab).
- Garantiza la integridad referencial: ausencia de lecciones huérfanas y de ciclos en prerequisitos.

### OE2
- Demuestra que el módulo de evaluación está poblado: 26 quizzes, 6 exámenes, 9 talleres.
- Evidencia que cada quiz declara una rúbrica explícita (passingScore) y referencia a la lección que evalúa.
- Garantiza la trazabilidad lecciones ↔ instrumentos de evaluación, alineada con los niveles del currículo.

### OE3
- Demuestra que el servicio de evaluación expone una API estable para comparación y feedback.
- Garantiza un camino determinístico cuando el LLM no está disponible (resiliencia educativa).
- Documenta la estrategia multi-proveedor de IA y los puntos de observabilidad existentes (o reporta su ausencia como gap).
