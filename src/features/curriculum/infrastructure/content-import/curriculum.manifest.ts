/*
 * Funcionalidad: Manifiesto del currículo importable
 * Descripción: Estructura completa del currículo de mecánica respiratoria y ventilación mecánica (secciones, niveles, módulos y lecciones) que importa prisma/import-curriculum.ts: conserva los ids de julio de los niveles, módulos y lecciones que siguen en el currículo (para no huérfanos de progreso ni de evaluaciones en producción), deriva ids deterministas para lo nuevo y declara los módulos y lecciones heredados que se archivan. El contenido de cada lección vive en prisma/curriculum/content/<módulo>/<lección>.md. Contenido pendiente de validación experta (docs/cierre/validacion-contenido.md)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export type CurriculumTrack = "mecanica" | "ventylab";

export type ModuleDifficulty = "prerequisitos" | "beginner" | "intermediate" | "advanced";

export interface LessonEntry {
  /** Unique inside its module; the content file is `<module key>/<slug>.md`. */
  readonly slug: string;
  readonly title: string;
  /** July lesson id kept as the database id (progress and evaluations already point to it). */
  readonly legacyId?: string;
  readonly estimatedMinutes: number;
  readonly objectives: readonly string[];
}

export interface ModuleEntry {
  /** Stable key: the July module id when `legacy` is true (and then also the database id), otherwise a slug. */
  readonly key: string;
  readonly legacy: boolean;
  readonly title: string;
  readonly description: string;
  readonly lessons: readonly LessonEntry[];
}

export interface LevelEntry {
  readonly id: string;
  readonly track: CurriculumTrack;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly difficulty: ModuleDifficulty;
  /** Modules of the level unlock one after another (ModulePrerequisite chain). */
  readonly sequentialModules: boolean;
  readonly prerequisiteLevelId?: string;
  readonly modules: readonly ModuleEntry[];
}

export interface CurriculumManifest {
  readonly levels: readonly LevelEntry[];
  /** July modules that leave the curriculum: archived (status ARCHIVED, isActive false), never deleted. */
  readonly retiredModuleIds: readonly string[];
  /** July lessons that leave the curriculum (inside kept or retired modules): archived, never deleted. */
  readonly retiredLessonIds: readonly string[];
}

export const CURRICULUM_MANIFEST: CurriculumManifest = {
  levels: [
    {
      id: "level-prerequisitos",
      track: "mecanica",
      title: "Prerequisitos",
      description: "Repaso opcional de fisiología respiratoria y de las bases físicas y clínicas antes del currículo principal.",
      order: 1,
      difficulty: "prerequisitos",
      sequentialModules: false,
      modules: [
        {
          key: "respiratory-physiology",
          legacy: true,
          title: "Fisiología respiratoria esencial",
          description: "Anatomía funcional, mecánica de la respiración espontánea e intercambio gaseoso.",
          lessons: [
            {
              slug: "anatomia-funcional",
              title: "Anatomía funcional del sistema respiratorio",
              estimatedMinutes: 35,
              objectives: [
                "Diferenciar la zona de conducción de la zona respiratoria y relacionarlas con el espacio muerto anatómico",
                "Explicar la función del surfactante a partir de la ley de Laplace",
                "Calcular el efecto de un cambio de radio sobre la resistencia de la vía aérea con la ley de Poiseuille",
                "Describir el papel del diafragma, la pleura y la circulación pulmonar en la mecánica y el intercambio",
                "Calcular la resistencia vascular pulmonar e interpretarla frente a los umbrales de las guías",
              ],
            },
            {
              slug: "mecanica-respiracion-espontanea",
              title: "Mecánica de la respiración espontánea",
              estimatedMinutes: 40,
              objectives: [
                "Definir las presiones alveolar, pleural, transpulmonar y del sistema respiratorio y los puntos entre los que se miden",
                "Describir los cambios de volumen, presión alveolar y presión pleural durante un ciclo espontáneo",
                "Calcular la compliance pulmonar, de la pared y del sistema respiratorio a partir de cambios de presión y volumen",
                "Interpretar el trabajo respiratorio y su aumento cuando cae la compliance",
                "Justificar el uso de la presión esofágica como estimación de la presión pleural",
              ],
            },
            {
              slug: "intercambio-gaseoso",
              title: "Intercambio gaseoso y transporte de O₂ y CO₂",
              estimatedMinutes: 45,
              objectives: [
                "Explicar la difusión alveolocapilar con la ley de Fick",
                "Clasificar las alteraciones de la relación ventilación-perfusión en shunt, relaciones bajas y espacio muerto, y predecir su respuesta al oxígeno",
                "Interpretar la curva de disociación de la oxihemoglobina y sus desplazamientos",
                "Calcular el contenido arterial de oxígeno, el aporte de oxígeno y la fracción de shunt",
                "Describir las formas de transporte del CO₂ y el efecto Haldane",
              ],
            },
          ],
        },
        {
          key: "ventilation-principles",
          legacy: true,
          title: "Bases físicas y clínicas de la ventilación",
          description: "Física de los gases y unidades de medida; indicaciones y objetivos de la ventilación mecánica.",
          lessons: [
            {
              slug: "fisica-de-gases",
              title: "Física de los gases, presiones y unidades",
              estimatedMinutes: 35,
              objectives: [
                "Distinguir presión, volumen y flujo, y relacionar el volumen con el área bajo la curva de flujo",
                "Aplicar las leyes de Boyle, Dalton y Henry para explicar el movimiento del gas, la presión inspirada de O₂ y el O₂ disuelto",
                "Calcular la presión inspirada de O₂ a distintas presiones barométricas",
                "Convertir correctamente entre cmH₂O, mmHg y kPa, y entre L/min y L/s",
                "Interpretar una gráfica magnitud-tiempo identificando ejes, línea de base, fases del ciclo, pendiente y área",
              ],
            },
            {
              slug: "indicaciones-vm",
              title: "Indicaciones y objetivos de la ventilación mecánica",
              legacyId: "vm-indications",
              estimatedMinutes: 35,
              objectives: [
                "Clasificar la insuficiencia respiratoria aguda en hipoxémica o hipercápnica a partir del mecanismo y la gasometría",
                "Identificar las principales indicaciones de ventilación mecánica, incluida la controversia sobre la protección de la vía aérea",
                "Explicar los objetivos fisiológicos y clínicos del soporte ventilatorio",
                "Justificar la elección entre oxígeno de alto flujo, ventilación no invasiva y ventilación invasiva según las guías vigentes",
                "Reconocer los criterios de fracaso del soporte no invasivo que obligan a intubar sin demora",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "level-beginner",
      track: "mecanica",
      title: "Nivel Principiante",
      description: "Fisiología aplicada, mecánica respiratoria, el ventilador, parámetros y modos básicos, monitoreo, alarmas y seguridad.",
      order: 2,
      difficulty: "beginner",
      sequentialModules: false,
      modules: [
        {
          key: "module-01-inversion-fisiologica",
          legacy: true,
          title: "La inversión fisiológica y la fisiología aplicada",
          description: "Del gradiente negativo de la respiración espontánea a la presión positiva; volúmenes, ventilación alveolar y oxigenación.",
          lessons: [
            {
              slug: "inversion-fisiologica",
              title: "De la presión negativa a la presión positiva",
              legacyId: "module-01-inversion-fisiologica",
              estimatedMinutes: 40,
              objectives: [
                "Comparar las presiones alveolar, pleural y transpulmonar durante la respiración espontánea y durante la ventilación con presión positiva.",
                "Explicar cómo cambia la distribución de la ventilación en el paciente anestesiado y paralizado frente al paciente que respira solo.",
                "Describir el papel del pulmón de acero y de la epidemia de poliomielitis de Copenhague de 1952 en el paso a la ventilación con presión positiva.",
                "Relacionar el aumento de la presión intratorácica con sus efectos sobre el retorno venoso y la poscarga de ambos ventrículos.",
                "Analizar una hipotensión tras el inicio de la ventilación mecánica e identificar las causas que deben descartarse.",
              ],
            },
            {
              slug: "volumenes-y-ventilacion-alveolar",
              title: "Volúmenes pulmonares, espacio muerto y ventilación alveolar",
              estimatedMinutes: 45,
              objectives: [
                "Identificar los volúmenes y capacidades pulmonares y explicar la importancia clínica de la capacidad residual funcional.",
                "Diferenciar el espacio muerto anatómico, instrumental, alveolar y fisiológico.",
                "Calcular la ventilación minuto, la ventilación alveolar y la fracción de espacio muerto con la ecuación de Bohr-Enghoff.",
                "Predecir el efecto de un cambio de volumen corriente o de frecuencia sobre la PaCO₂ mediante la ecuación de la ventilación alveolar.",
                "Interpretar una hipercapnia con volumen minuto aparentemente adecuado y proponer medidas para reducir el espacio muerto.",
              ],
            },
            {
              slug: "oxigenacion-vs-ventilacion",
              title: "Oxigenación y ventilación: dos objetivos distintos",
              estimatedMinutes: 40,
              objectives: [
                "Distinguir los controles del ventilador que modifican la oxigenación de los que modifican la eliminación de CO₂.",
                "Calcular la PO₂ alveolar con la ecuación del gas alveolar y el gradiente alveolo-arterial.",
                "Clasificar un caso de hipoxemia según su mecanismo a partir del gradiente A-a y de la respuesta a la FiO₂.",
                "Estimar la presión media de la vía aérea en una onda de presión cuadrada y explicar su relación con la oxigenación.",
                "Justificar la elección de ajustes iniciales ante un paciente con hipoxemia e hipercapnia simultáneas.",
              ],
            },
          ],
        },
        {
          key: "module-02-ecuacion-movimiento",
          legacy: true,
          title: "Mecánica respiratoria: la ecuación del movimiento",
          description: "Ecuación del movimiento, compliance, elastancia, resistencia y constante de tiempo.",
          lessons: [
            {
              slug: "ecuacion-movimiento",
              title: "La ecuación del movimiento",
              legacyId: "module-02-ecuacion-movimiento",
              estimatedMinutes: 45,
              objectives: [
                "Identificar los términos de la ecuación del movimiento (presión elástica, presión resistiva, PEEP total y presión muscular) y sus unidades.",
                "Calcular la presión pico y la presión meseta esperadas a partir del volumen, el flujo, la compliance, la resistencia y la PEEP.",
                "Interpretar un aumento de presión en la vía aérea distinguiendo un patrón resistivo de uno elástico mediante la comparación pico-meseta.",
                "Explicar qué variable controla el ventilador y cuál depende del paciente en VCV y en PCV.",
                "Justificar por qué las mediciones de mecánica deben realizarse con el paciente pasivo.",
              ],
            },
            {
              slug: "compliance-elastancia",
              title: "Compliance y elastancia del sistema respiratorio",
              estimatedMinutes: 40,
              objectives: [
                "Calcular la compliance estática, la compliance dinámica, la elastancia y la driving pressure usando la PEEP total.",
                "Diferenciar la compliance estática de la dinámica y explicar qué información aporta cada una.",
                "Interpretar la curva presión-volumen estática, incluidas la zona lineal y la de sobredistensión.",
                "Identificar causas de compliance baja de origen pulmonar y de la pared torácica, y causas de compliance alta.",
                "Justificar por qué una misma presión meseta puede implicar distinta tensión pulmonar según la pared torácica.",
              ],
            },
            {
              slug: "resistencia-constante-tiempo",
              title: "Resistencia de la vía aérea y constante de tiempo",
              estimatedMinutes: 40,
              objectives: [
                "Calcular la resistencia inspiratoria con la fórmula (Ppico − Pmeseta)/flujo en VCV con flujo constante.",
                "Identificar los factores que aumentan la resistencia (radio, tubo endotraqueal, secreciones, broncoespasmo, circuito) y su relación con la ley de Poiseuille.",
                "Calcular la constante de tiempo y estimar la fracción de volumen exhalada según el tiempo espiratorio.",
                "Interpretar el atrapamiento aéreo y la auto-PEEP como consecuencia de un tiempo espiratorio corto respecto a la constante de tiempo.",
                "Ajustar de forma razonada la frecuencia y el tiempo inspiratorio para alargar el tiempo espiratorio en un paciente obstruido.",
              ],
            },
          ],
        },
        {
          key: "module-03-variables-fase",
          legacy: true,
          title: "El ventilador: componentes y variables de fase",
          description: "Componentes del ventilador y del circuito; disparo, límite, ciclado y línea de base.",
          lessons: [
            {
              slug: "componentes-ventilador",
              title: "Componentes del ventilador y del circuito",
              estimatedMinutes: 35,
              objectives: [
                "Identificar la función de la fuente de gas, el mezclador, las válvulas inspiratoria y espiratoria, los sensores y el controlador en el suministro de cada respiración.",
                "Diferenciar la humidificación activa del intercambiador de calor y humedad según sus metas de humedad, su espacio muerto y su resistencia.",
                "Calcular el efecto del espacio muerto instrumental sobre la ventilación alveolar y la PaCO₂ esperada.",
                "Calcular el volumen compresible del circuito y justificar la autoprueba del equipo con el circuito definitivo.",
                "Justificar ante un caso clínico la retirada de un accesorio del circuito como causa de hipercapnia o de aumento de la presión pico.",
              ],
            },
            {
              slug: "variables-fase",
              title: "Variables de fase: disparo, límite y ciclado",
              legacyId: "module-03-variables-fase",
              estimatedMinutes: 40,
              objectives: [
                "Identificar en las curvas de presión y flujo las cuatro variables de fase de una respiración: disparo, objetivo o límite, ciclado y línea de base.",
                "Clasificar una respiración como mandatoria o espontánea según quién controla su disparo y su ciclado.",
                "Calcular el tiempo inspiratorio en VCV con flujo constante y el flujo de ciclado en presión de soporte.",
                "Interpretar los signos de un disparo poco sensible, de autodisparo y de ciclado tardío.",
                "Ajustar de forma razonada la sensibilidad del disparo y el criterio de ciclado en un paciente con obstrucción al flujo aéreo.",
              ],
            },
          ],
        },
        {
          key: "parametros-basicos",
          legacy: false,
          title: "Parámetros ventilatorios básicos",
          description: "Volumen corriente por peso predicho, frecuencia, tiempos, relación I:E, FiO₂ y PEEP iniciales.",
          lessons: [
            {
              slug: "volumen-corriente-peso-predicho",
              title: "Volumen corriente y peso corporal predicho",
              estimatedMinutes: 35,
              objectives: [
                "Calcular el peso corporal predicho a partir de la talla y el sexo con la fórmula de ARDSNet.",
                "Calcular el volumen corriente en mL a partir de un objetivo en mL/kg de peso predicho y expresar en mL/kg un volumen ya programado.",
                "Justificar por qué el volumen corriente se dosifica según el peso predicho y no según el peso real.",
                "Seleccionar un rango de volumen corriente coherente con la evidencia en pacientes con y sin SDRA.",
                "Identificar los errores habituales de dosificación en pacientes con obesidad o de baja talla.",
              ],
            },
            {
              slug: "frecuencia-tiempos-ie",
              title: "Frecuencia, tiempos y relación I:E",
              estimatedMinutes: 35,
              objectives: [
                "Calcular el tiempo de ciclo total, el tiempo inspiratorio, el tiempo espiratorio y la relación I:E a partir de la frecuencia, el volumen corriente, el flujo y la pausa.",
                "Calcular la ventilación minuto y estimar la ventilación alveolar considerando el espacio muerto.",
                "Estimar el cambio esperado de PaCO₂ al modificar la ventilación alveolar.",
                "Interpretar en la curva de flujo un tiempo espiratorio insuficiente y relacionarlo con la auto-PEEP.",
                "Ajustar frecuencia y flujo inspiratorio para prolongar el tiempo espiratorio en un paciente obstructivo.",
              ],
            },
            {
              slug: "fio2-peep-iniciales",
              title: "FiO₂ y PEEP: primeros ajustes",
              estimatedMinutes: 35,
              objectives: [
                "Explicar los mecanismos por los que la FiO₂ y la PEEP mejoran la oxigenación y sus riesgos principales.",
                "Seleccionar la meta de SpO₂ adecuada según el contexto clínico y las guías.",
                "Calcular e interpretar el cociente PaO₂/FiO₂ indicando la FiO₂ y la PEEP de referencia.",
                "Ajustar la sensibilidad del disparo al valor más sensible que no produzca autodisparo.",
                "Aplicar una secuencia ordenada de comprobaciones y ajustes durante los primeros 30 minutos de ventilación.",
              ],
            },
          ],
        },
        {
          key: "module-04-modos-ventilatorios",
          legacy: true,
          title: "Modos ventilatorios básicos: VCV y PCV",
          description: "Taxonomía de los modos y ventilación controlada por volumen y por presión.",
          lessons: [
            {
              slug: "modos-ventilatorios",
              title: "Taxonomía de los modos ventilatorios",
              legacyId: "module-04-modos-ventilatorios",
              estimatedMinutes: 40,
              objectives: [
                "Diferenciar un ciclo mandatorio de uno espontáneo según quién decide el disparo y el ciclado",
                "Identificar la variable de control (volumen o presión) de un modo a partir de lo que se preestablece en cada ciclo",
                "Clasificar un modo en su patrón ventilatorio (VC-CMV, VC-IMV, PC-CMV, PC-IMV o PC-CSV) y justificar por qué no existe VC-CSV",
                "Traducir nombres comerciales frecuentes (A/C, PRVC, VC+, PSV) a su etiqueta taxonómica",
                "Calcular la ventilación minuto real en CMV cuando el paciente dispara ciclos adicionales",
              ],
            },
            {
              slug: "vcv",
              title: "Ventilación controlada por volumen (VCV)",
              estimatedMinutes: 40,
              objectives: [
                "Interpretar las curvas de presión, flujo y volumen de la VCV con flujo constante y pausa inspiratoria",
                "Calcular resistencia, compliance, presión de distensión y tiempo inspiratorio a partir de la presión pico, la presión meseta y el flujo",
                "Distinguir un aumento de presión de origen resistivo de uno de origen elástico mediante la pausa inspiratoria",
                "Explicar el efecto del flujo constante frente al desacelerado sobre la presión pico y la presión meseta",
                "Reconocer el hambre de flujo en la curva de presión y proponer ajustes correctivos",
              ],
            },
            {
              slug: "pcv",
              title: "Ventilación controlada por presión (PCV)",
              estimatedMinutes: 40,
              objectives: [
                "Explicar por qué en PCV la presión es cuadrada y el flujo desacelerado",
                "Calcular el volumen corriente esperado en PCV a partir de la compliance, la resistencia, la presión y el tiempo inspiratorio",
                "Interpretar la curva de flujo para decidir si alargar el tiempo inspiratorio aumentará el volumen",
                "Identificar las causas de un cambio de volumen con presión constante y priorizar la respuesta",
                "Ajustar las alarmas de volumen espirado y ventilación minuto como vigilancia principal del modo",
              ],
            },
          ],
        },
        {
          key: "module-05-monitorizacion-grafica",
          legacy: true,
          title: "Monitoreo básico y alarmas",
          description: "Presiones, volúmenes y curvas escalares; alarmas del ventilador y respuesta escalonada.",
          lessons: [
            {
              slug: "monitorizacion-grafica",
              title: "Monitoreo básico: presiones, volúmenes y curvas escalares",
              legacyId: "module-05-monitorizacion-grafica",
              estimatedMinutes: 45,
              objectives: [
                "Identificar en el monitor la presión pico, la presión meseta, la PEEP total, la presión media, el Vti, el Vte y la ventilación minuto, y explicar qué representa cada una.",
                "Calcular la resistencia, la compliance estática, la driving pressure, la ventilación minuto y la fracción de fuga a partir de los valores del monitor.",
                "Interpretar las curvas escalares de presión, flujo y volumen frente al tiempo en VCV y PCV, incluidos los signos de auto-PEEP, fuga y secreciones.",
                "Aplicar una secuencia sistemática de lectura del monitor y justificar si un cambio de presión es de origen resistivo o elástico.",
              ],
            },
            {
              slug: "alarmas-basicas",
              title: "Alarmas del ventilador: tipos y respuesta",
              estimatedMinutes: 40,
              objectives: [
                "Identificar las alarmas básicas del ventilador (presión alta y baja, Vte bajo, VE alta y baja, frecuencia alta, apnea, desconexión, fallo de gas o energía) y sus causas más frecuentes.",
                "Ajustar los límites de alarma a partir de los valores estables del paciente y reajustarlos tras cada cambio de parámetros.",
                "Explicar qué es la fatiga de alarmas, por qué se produce y qué estrategias la reducen.",
                "Aplicar una respuesta escalonada ante una alarma, priorizando la evaluación del paciente y la ventilación manual cuando está inestable.",
              ],
            },
          ],
        },
        {
          key: "module-06-efectos-sistemicos",
          legacy: true,
          title: "Efectos sistémicos y seguridad del paciente ventilado",
          description: "Interacción corazón-pulmón, lesión inducida por el ventilador y seguridad del paciente.",
          lessons: [
            {
              slug: "efectos-sistemicos",
              title: "Efectos sistémicos y lesión inducida por el ventilador",
              legacyId: "module-06-efectos-sistemicos",
              estimatedMinutes: 45,
              objectives: [
                "Explicar cómo la presión positiva intratorácica modifica el retorno venoso, la poscarga del ventrículo derecho y la poscarga del ventrículo izquierdo.",
                "Identificar los efectos renales y neurológicos de la ventilación mecánica y los factores que los agravan.",
                "Diferenciar barotrauma, volutrauma, atelectrauma y biotrauma por su mecanismo y su manifestación clínica.",
                "Calcular el peso corporal predicho, el volumen corriente por kilo y la presión de distensión a partir de datos del ventilador.",
                "Justificar un ajuste de volumen corriente, PEEP o FiO₂ considerando a la vez su efecto pulmonar y hemodinámico.",
              ],
            },
            {
              slug: "seguridad-paciente-ventilado",
              title: "Seguridad del paciente ventilado",
              estimatedMinutes: 40,
              objectives: [
                "Aplicar una verificación sistemática del equipo y de la cabecera antes de conectar al paciente y en cada turno.",
                "Enumerar las prácticas esenciales de prevención de la neumonía asociada a la ventilación según la actualización SHEA 2022 y justificar su mecanismo.",
                "Calcular y verificar la presión del manguito dentro del rango que evita fuga e isquemia de la mucosa.",
                "Identificar los factores de riesgo de desconexión y extubación no planificada y las medidas para prevenirlas.",
                "Aplicar el enfoque DOPE y la ventilación manual de rescate ante el deterioro agudo de un paciente intubado.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "level-intermedio",
      track: "mecanica",
      title: "Nivel Intermedio",
      description: "Selección del modo, modos espontáneos, SIMV y duales, curvas y bucles, asincronías, gasometría, oxigenación y destete.",
      order: 3,
      difficulty: "intermediate",
      sequentialModules: true,
      prerequisiteLevelId: "level-beginner",
      modules: [
        {
          key: "module-01-vcv-vs-pcv",
          legacy: true,
          title: "Selección del modo: VCV frente a PCV en el paciente complejo",
          description: "Evidencia comparativa y criterios para elegir la variable de control.",
          lessons: [
            {
              slug: "vcv-vs-pcv",
              title: "VCV frente a PCV en el paciente complejo",
              legacyId: "lesson-vcv-vs-pcv",
              estimatedMinutes: 45,
              objectives: [
                "Identificar qué variable controla y cuál deja libre cada modo ante un cambio de compliance, resistencia o esfuerzo del paciente.",
                "Calcular con la ecuación del movimiento la Ppico, la Pplat y la driving pressure en VCV y el volumen corriente esperado en PCV.",
                "Interpretar la evidencia comparativa entre VCV y PCV en SDRA y en anestesia, distinguiendo asociación de causalidad.",
                "Justificar la elección del modo y el ajuste de alarmas en un paciente con obesidad y SDRA.",
                "Ajustar la presión inspiratoria en PCV cuando la compliance cambia para mantener el volumen corriente protector.",
              ],
            },
          ],
        },
        {
          key: "module-03-soporte-psv-cpap",
          legacy: true,
          title: "Modos espontáneos: PSV y CPAP",
          description: "Presión de soporte y presión positiva continua.",
          lessons: [
            {
              slug: "soporte-psv-cpap",
              title: "Ventilación con presión de soporte (PSV)",
              legacyId: "lesson-soporte-psv-cpap",
              estimatedMinutes: 40,
              objectives: [
                "Identificar en las curvas de presión y flujo el disparo, la presurización (rise time) y el ciclado por flujo de una respiración en PSV.",
                "Calcular el flujo de ciclado a partir del criterio programado y estimar el esfuerzo muscular y la driving pressure transpulmonar con la presión de oclusión.",
                "Interpretar los signos clínicos y gráficos de sobreasistencia e infraasistencia, incluidos los esfuerzos ineficaces.",
                "Ajustar el nivel de soporte y el criterio de ciclado en un paciente con EPOC y asincronía.",
                "Justificar por qué el volumen corriente y la frecuencia en PSV son resultados y no ajustes.",
              ],
            },
            {
              slug: "cpap",
              title: "CPAP y presión positiva continua",
              estimatedMinutes: 35,
              objectives: [
                "Explicar los efectos de la CPAP sobre la capacidad residual funcional, la compliance, el trabajo respiratorio y la vía aérea superior.",
                "Calcular el cambio de la carga umbral por auto-PEEP y el sentido del cambio de la poscarga del ventrículo izquierdo con presión positiva.",
                "Identificar las indicaciones con evidencia (edema pulmonar cardiogénico, hipoxemia posoperatoria, apnea obstructiva del sueño) y las situaciones en que la CPAP no basta.",
                "Interpretar la respuesta a la CPAP en la primera hora y decidir cuándo escalar el soporte.",
                "Planificar la vigilancia posoperatoria del paciente con apnea obstructiva del sueño.",
              ],
            },
          ],
        },
        {
          key: "module-04-duales-simv",
          legacy: true,
          title: "SIMV y modos duales",
          description: "Ventilación mandatoria intermitente sincronizada y modos de control adaptativo.",
          lessons: [
            {
              slug: "duales-simv",
              title: "SIMV: principios, usos y limitaciones",
              legacyId: "lesson-duales-simv",
              estimatedMinutes: 40,
              objectives: [
                "Identificar en las curvas los ciclos mandatorios y espontáneos de SIMV con presión de soporte",
                "Explicar la lógica de la ventana de sincronía y en qué se diferencia SIMV de la ventilación asistida-controlada",
                "Calcular la ventilación minuto total y la fracción aportada por los ciclos mandatorios",
                "Justificar con la evidencia por qué la reducción progresiva de la frecuencia SIMV no es un método de destete recomendado",
              ],
            },
            {
              slug: "modos-duales-adaptativos",
              title: "Modos duales y de control adaptativo",
              estimatedMinutes: 40,
              objectives: [
                "Describir cómo un modo de volumen objetivo con presión adaptativa ajusta la presión ciclo a ciclo",
                "Calcular la presión inspiratoria necesaria para un volumen objetivo a partir de la compliance",
                "Interpretar una presión adaptativa creciente o decreciente como signo clínico",
                "Identificar el riesgo de retirada de soporte y de volumen excesivo con esfuerzo intenso del paciente",
                "Calcular la frecuencia de liberación y la presión media en APRV y valorar los límites de su evidencia",
              ],
            },
          ],
        },
        {
          key: "module-05-graficas-fine-tuning",
          legacy: true,
          title: "Curvas y bucles ventilatorios",
          description: "Curvas escalares por modo y bucles presión-volumen y flujo-volumen.",
          lessons: [
            {
              slug: "graficas-fine-tuning",
              title: "Curvas de presión, flujo y volumen en el tiempo",
              legacyId: "lesson-graficas-fine-tuning",
              estimatedMinutes: 45,
              objectives: [
                "Identificar qué curva refleja la mecánica del paciente en VCV y en PCV",
                "Calcular la resistencia, la compliance estática y la constante de tiempo a partir de las curvas",
                "Interpretar los signos gráficos de auto-PEEP, fuga, secreciones y hambre de flujo",
                "Ajustar el flujo inspiratorio, el tiempo inspiratorio y el tiempo de subida según la forma de las curvas",
              ],
            },
            {
              slug: "bucles-pv-fv",
              title: "Bucles presión-volumen y flujo-volumen",
              estimatedMinutes: 40,
              objectives: [
                "Diferenciar la curva presión-volumen casi estática del bucle dinámico del ventilador",
                "Calcular la compliance dinámica y estática y la fracción de fuga a partir de los bucles",
                "Interpretar en los bucles la sobredistensión, la obstrucción al flujo espiratorio y las secreciones",
                "Justificar las limitaciones de los bucles antes de tomar decisiones de ajuste",
              ],
            },
          ],
        },
        {
          key: "asincronias-basicas",
          legacy: false,
          title: "Asincronías paciente-ventilador",
          description: "Asincronías de disparo, de flujo y de ciclado: reconocimiento y corrección.",
          lessons: [
            {
              slug: "asincronias-disparo",
              title: "Asincronías de disparo",
              estimatedMinutes: 40,
              objectives: [
                "Identificar en las curvas de presión y flujo el esfuerzo ineficaz, el disparo retardado y el autodisparo.",
                "Explicar por qué la auto-PEEP y la sobreasistencia producen esfuerzos ineficaces.",
                "Calcular el índice de asincronía y el umbral de disparo en presencia de auto-PEEP.",
                "Ajustar el nivel de soporte, la sensibilidad del trigger y la PEEP externa según la causa identificada.",
                "Justificar por qué la frecuencia del monitor no sustituye a la observación clínica del paciente.",
              ],
            },
            {
              slug: "asincronias-flujo-ciclado",
              title: "Asincronías de flujo y de ciclado",
              estimatedMinutes: 40,
              objectives: [
                "Reconocer el hambre de flujo, el flujo excesivo, el ciclado prematuro, el ciclado tardío y el doble disparo en las curvas escalares.",
                "Interpretar la ecuación del movimiento con esfuerzo muscular para explicar la concavidad de la presión en VCV.",
                "Calcular el tiempo inspiratorio en VCV y estimar el efecto del criterio de ciclado en presión de soporte según la constante de tiempo.",
                "Ajustar flujo, tiempo inspiratorio, modo y criterio de ciclado anticipando sus efectos secundarios.",
                "Justificar la vigilancia del volumen corriente real ante el doble disparo y el cambio a modos de presión.",
              ],
            },
          ],
        },
        {
          key: "gasometria-arterial",
          legacy: false,
          title: "Gasometría arterial",
          description: "Interpretación sistemática del equilibrio ácido-base y su relación con los ajustes del ventilador.",
          lessons: [
            {
              slug: "interpretacion-acido-base",
              title: "Interpretación sistemática del equilibrio ácido-base",
              estimatedMinutes: 45,
              objectives: [
                "Identificar el trastorno ácido-base primario a partir de pH, PaCO₂ y HCO₃⁻",
                "Calcular la compensación esperada con la fórmula de Winter y las reglas de compensación respiratoria y metabólica",
                "Distinguir un trastorno respiratorio agudo de uno crónico según la respuesta del bicarbonato",
                "Calcular e interpretar el anión gap corregido por albúmina y el delta ratio",
                "Justificar la presencia de un trastorno mixto cuando la compensación medida no coincide con la esperada",
              ],
            },
            {
              slug: "gasometria-ajustes-ventilador",
              title: "Gasometría y ajustes del ventilador",
              estimatedMinutes: 40,
              objectives: [
                "Interpretar el cociente PaO₂/FiO₂ y clasificar la gravedad de la hipoxemia según la definición de Berlín y la definición global",
                "Seleccionar la palanca del ventilador adecuada para corregir un problema de oxigenación o de ventilación",
                "Calcular la frecuencia respiratoria o el volumen corriente necesarios para alcanzar una PaCO₂ objetivo",
                "Aplicar los límites de pH de la hipercapnia permisiva y reconocer sus contraindicaciones",
                "Justificar cuándo una gasometría venosa no sustituye a la arterial",
              ],
            },
          ],
        },
        {
          key: "module-02-peep-optimizar-oxigenacion",
          legacy: true,
          title: "Oxigenación y PEEP",
          description: "Fisiología de la PEEP e índices de oxigenación.",
          lessons: [
            {
              slug: "peep-optimizar-oxigenacion",
              title: "PEEP: fisiología, beneficios y riesgos",
              legacyId: "lesson-peep-optimizar-oxigenacion",
              estimatedMinutes: 40,
              objectives: [
                "Explicar cómo la PEEP aumenta el volumen pulmonar al final de la espiración y reduce el cortocircuito intrapulmonar.",
                "Diferenciar la PEEP extrínseca de la intrínseca y medir la PEEP total con una pausa espiratoria.",
                "Calcular la presión de distensión y la compliance usando la PEEP total.",
                "Interpretar la respuesta de la presión meseta a un cambio de PEEP para distinguir reclutamiento de sobredistensión.",
                "Identificar los efectos hemodinámicos de la PEEP sobre el retorno venoso y la poscarga del ventrículo derecho.",
              ],
            },
            {
              slug: "indices-oxigenacion",
              title: "Índices de oxigenación y ajuste de FiO₂ y PEEP",
              estimatedMinutes: 40,
              objectives: [
                "Calcular PaO₂/FiO₂, SpO₂/FiO₂, índice de oxigenación e índice de saturación de oxígeno.",
                "Clasificar la gravedad de la hipoxemia según la definición global de SDRA, incluida la corrección por altitud.",
                "Interpretar las tablas FiO₂/PEEP de la red ARDS como punto de partida del ajuste.",
                "Seleccionar una meta de SpO₂ o PaO₂ adecuada al contexto clínico.",
                "Justificar cuándo confirmar la pulsioximetría con gasometría arterial.",
              ],
            },
          ],
        },
        {
          key: "module-06-avanzado-evaluacion-destete",
          legacy: true,
          title: "Destete y prueba de ventilación espontánea",
          description: "Preparación para el destete, prueba de ventilación espontánea y extubación.",
          lessons: [
            {
              slug: "avanzado-evaluacion-destete",
              title: "Preparación para el destete",
              legacyId: "lesson-avanzado-evaluacion-destete",
              estimatedMinutes: 40,
              objectives: [
                "Identificar los criterios de preparación para una prueba de ventilación espontánea en sus cinco dominios.",
                "Justificar la combinación diaria de la prueba de despertar con la prueba de ventilación espontánea.",
                "Calcular e interpretar el índice de respiración rápida superficial y reconocer sus limitaciones.",
                "Clasificar el destete como simple, difícil o prolongado según el consenso de 2007 y el estudio WIND.",
              ],
            },
            {
              slug: "prueba-ventilacion-espontanea",
              title: "Prueba de ventilación espontánea y extubación",
              estimatedMinutes: 40,
              objectives: [
                "Comparar la prueba con tubo en T, CPAP y presión de soporte baja según su fisiología y la evidencia.",
                "Reconocer los criterios objetivos y clínicos de fracaso de la prueba y actuar ante ellos.",
                "Calcular el volumen de fuga del balón e interpretar el riesgo de estridor postextubación.",
                "Planificar la extubación y la vigilancia posterior, incluida la ventilación no invasiva preventiva en pacientes de alto riesgo.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "level-avanzado",
      track: "mecanica",
      title: "Nivel Avanzado",
      description: "VILI, SDRA, reclutamiento, prono, mecánica avanzada, enfermedad obstructiva, asincronías complejas, destete difícil y casos integradores.",
      order: 4,
      difficulty: "advanced",
      sequentialModules: true,
      prerequisiteLevelId: "level-intermedio",
      modules: [
        {
          key: "module-01-vili-ventilacion-protectora",
          legacy: true,
          title: "VILI y ventilación protectora",
          description: "Mecanismos de lesión inducida por el ventilador y estrategia protectora.",
          lessons: [
            {
              slug: "vili-ventilacion-protectora",
              title: "Mecanismos de la lesión inducida por el ventilador",
              legacyId: "lesson-vili-ventilacion-protectora",
              estimatedMinutes: 45,
              objectives: [
                "Identificar los mecanismos de la VILI (volutrauma, atelectrauma, barotrauma, biotrauma, ergotrauma y P-SILI) y su base fisiológica",
                "Calcular el strain y estimar el stress pulmonar a partir del volumen insuflado, el volumen aireado y la elastancia específica",
                "Interpretar la compliance baja del SDRA según el concepto de baby lung",
                "Justificar por qué cumplir 6 mL/kg y una meseta de 30 cmH₂O no garantiza la ausencia de lesión",
                "Distinguir la evidencia experimental firme de las hipótesis sin umbral clínico validado",
              ],
            },
            {
              slug: "ventilacion-protectora",
              title: "Ventilación protectora: volumen corriente, presión meseta y driving pressure",
              estimatedMinutes: 45,
              objectives: [
                "Calcular el peso corporal predicho y el volumen corriente de 4 a 8 mL/kg PBW",
                "Medir e interpretar la presión pico, la presión meseta y la driving pressure con pausa inspiratoria",
                "Aplicar los pasos del protocolo ARDSNet para ajustar volumen, frecuencia y meta de pH",
                "Comparar las recomendaciones de ATS y ESICM sobre volumen, meseta y driving pressure con su fuerza y certeza",
                "Justificar la ventilación protectora en cirugía y en pacientes de UCI sin SDRA según la evidencia disponible",
              ],
            },
          ],
        },
        {
          key: "module-07-sdra",
          legacy: true,
          title: "Síndrome de dificultad respiratoria aguda (SDRA)",
          description: "Definición, fisiopatología, gravedad y manejo ventilatorio escalonado.",
          lessons: [
            {
              slug: "sdra",
              title: "SDRA: definición, fisiopatología y gravedad",
              legacyId: "lesson-sdra",
              estimatedMinutes: 45,
              objectives: [
                "Identificar los criterios de la definición de Berlín y las ampliaciones de la definición global de 2024",
                "Calcular PaO₂/FiO₂ y SpO₂/FiO₂, con corrección por altitud, para clasificar la gravedad",
                "Explicar cómo el daño de la barrera alveolocapilar produce shunt, baby lung y aumento del espacio muerto",
                "Interpretar los datos epidemiológicos y el concepto de subfenotipos y sus límites actuales",
              ],
            },
            {
              slug: "manejo-escalonado-sdra",
              title: "Manejo ventilatorio escalonado del SDRA",
              estimatedMinutes: 45,
              objectives: [
                "Interpretar la fuerza y la certeza de las recomendaciones de ATS 2017/2024 y ESICM 2023",
                "Evaluar la respuesta a la PEEP mediante la driving pressure y la compliance",
                "Justificar la indicación, el momento y la duración del decúbito prono según PROSEVA y las guías",
                "Comparar la evidencia y las recomendaciones sobre bloqueo neuromuscular y ECMO venovenosa",
                "Identificar las intervenciones desaconsejadas: reclutamiento prolongado, HFOV rutinaria y ECCO₂R fuera de ensayos",
              ],
            },
          ],
        },
        {
          key: "reclutamiento-titulacion-peep",
          legacy: false,
          title: "Reclutamiento alveolar y titulación de PEEP",
          description: "Reclutabilidad, maniobras de reclutamiento y métodos de titulación de PEEP.",
          lessons: [
            {
              slug: "maniobras-reclutamiento",
              title: "Maniobras de reclutamiento: fisiología, evidencia y riesgos",
              estimatedMinutes: 40,
              objectives: [
                "Explicar la histéresis de la curva presión-volumen y su relación con la PEEP tras el reclutamiento",
                "Calcular el volumen reclutado y la relación reclutamiento/insuflación (R/I) a partir de datos del ventilador",
                "Interpretar los resultados del ensayo ART y su impacto en las guías ESICM 2023 y ATS 2024",
                "Distinguir una maniobra prolongada de una breve según la definición de las guías",
                "Justificar ante un caso clínico por qué priorizar medidas de bajo riesgo frente a una maniobra a alta presión",
              ],
            },
            {
              slug: "titulacion-peep",
              title: "Métodos de titulación de PEEP",
              estimatedMinutes: 45,
              objectives: [
                "Identificar en las tablas FiO₂/PEEP de la red ARDS la PEEP correspondiente a una FiO₂ dada",
                "Calcular la presión de distensión y la compliance en cada escalón de una prueba decremental",
                "Interpretar la presión transpulmonar espiratoria obtenida con presión esofágica",
                "Comparar la evidencia de los ensayos de PEEP alta frente a baja y las recomendaciones discordantes de las guías",
                "Ajustar la PEEP en un caso clínico integrando mecánica, oxigenación y hemodinamia",
              ],
            },
          ],
        },
        {
          key: "ventilacion-prono",
          legacy: false,
          title: "Ventilación en decúbito prono",
          description: "Fisiología, indicaciones, técnica y seguridad del decúbito prono.",
          lessons: [
            {
              slug: "fisiologia-prono",
              title: "Fisiología del decúbito prono",
              estimatedMinutes: 35,
              objectives: [
                "Explicar por qué en prono la reapertura dorsal supera al colapso ventral",
                "Interpretar el efecto del prono sobre la relación ventilación-perfusión sabiendo que la perfusión sigue siendo dorsal",
                "Calcular la compliance del sistema respiratorio a partir de las compliances del pulmón y de la pared torácica",
                "Relacionar la caída de la PaCO₂ y de la presión de distensión con la descarga del ventrículo derecho",
                "Justificar por qué la respuesta en oxigenación no es el criterio para mantener o abandonar el prono",
              ],
            },
            {
              slug: "prono-indicaciones-tecnica",
              title: "Indicaciones, técnica y seguridad del prono",
              estimatedMinutes: 40,
              objectives: [
                "Identificar a los pacientes candidatos a prono según el ensayo PROSEVA y la guía ESICM 2023",
                "Reconocer la contraindicación absoluta y las contraindicaciones relativas del prono",
                "Describir los pasos y funciones del equipo para realizar el giro con seguridad",
                "Calcular el cambio porcentual de la PaO₂/FiO₂ y aplicar los criterios de suspensión",
                "Justificar el papel limitado del prono despierto según la evidencia disponible",
              ],
            },
          ],
        },
        {
          key: "module-02-monitorizacion-alto-nivel",
          legacy: true,
          title: "Mecánica avanzada: driving pressure, potencia mecánica y auto-PEEP",
          description: "Driving pressure, potencia mecánica, hiperinflación dinámica y presión transpulmonar.",
          lessons: [
            {
              slug: "monitorizacion-alto-nivel",
              title: "Driving pressure y potencia mecánica",
              legacyId: "lesson-monitorizacion-alto-nivel",
              estimatedMinutes: 45,
              objectives: [
                "Calcular la driving pressure y la compliance a partir de la presión meseta y la PEEP total.",
                "Interpretar la driving pressure como el volumen corriente normalizado por el pulmón aireado disponible.",
                "Calcular la potencia mecánica en VCV con la fórmula simplificada y el índice 4·ΔP + FR.",
                "Ajustar el volumen corriente o la PEEP según la respuesta de la driving pressure en un paciente con SDRA.",
                "Justificar los límites de la evidencia observacional sobre driving pressure y potencia mecánica.",
              ],
            },
            {
              slug: "auto-peep-hiperinflacion",
              title: "Auto-PEEP e hiperinflación dinámica",
              estimatedMinutes: 40,
              objectives: [
                "Explicar el mecanismo de la auto-PEEP a partir del tiempo espiratorio, la constante de tiempo y la limitación del flujo.",
                "Identificar el atrapamiento aéreo en la curva de flujo-tiempo.",
                "Calcular la auto-PEEP con una pausa espiratoria y estimar el volumen atrapado en un modelo simple.",
                "Interpretar sus efectos hemodinámicos y su papel en los esfuerzos ineficaces.",
                "Ajustar frecuencia, volumen, flujo inspiratorio y PEEP externa para reducir la hiperinflación.",
              ],
            },
            {
              slug: "presion-esofagica",
              title: "Presión esofágica y presión transpulmonar",
              estimatedMinutes: 40,
              objectives: [
                "Describir la técnica de medición de la presión esofágica y su validación con la prueba de oclusión.",
                "Calcular la presión transpulmonar espiratoria e inspiratoria por el método directo y el derivado de elastancias.",
                "Interpretar qué región pulmonar representa cada método de presión transpulmonar.",
                "Justificar la titulación de PEEP con presión transpulmonar en un paciente con obesidad.",
                "Evaluar la evidencia de los ensayos EPVent y EPVent-2 y la posición de las guías de la ESICM de 2023.",
              ],
            },
          ],
        },
        {
          key: "module-06-epoc-asma-fumadores",
          legacy: true,
          title: "Enfermedad obstructiva: EPOC y asma",
          description: "Fisiopatología de la obstrucción y ventilación en la exacerbación de EPOC y en el asma grave.",
          lessons: [
            {
              slug: "epoc-asma-fumadores",
              title: "Fisiopatología de la obstrucción al flujo aéreo",
              legacyId: "lesson-epoc-asma-fumadores",
              estimatedMinutes: 40,
              objectives: [
                "Diferenciar los mecanismos de obstrucción de la vía aérea en la EPOC y en el asma grave",
                "Explicar la limitación del flujo espiratorio y su relación con la hiperinflación dinámica y la auto-PEEP",
                "Calcular la constante de tiempo, el tiempo espiratorio y el volumen atrapado estimado en un modelo unicompartimental",
                "Interpretar las presiones pico, meseta y la PEEP total para identificar un problema predominantemente resistivo",
                "Justificar la cesación tabáquica a partir de su efecto en la historia natural de la EPOC y del asma",
              ],
            },
            {
              slug: "ventilacion-epoc",
              title: "Ventilación en la exacerbación de EPOC",
              estimatedMinutes: 45,
              objectives: [
                "Identificar las indicaciones de VNI en la exacerbación de EPOC según las guías ERS/ATS y BTS/ICS",
                "Reconocer los criterios de fracaso de la VNI y las indicaciones de intubación",
                "Ajustar la ventilación invasiva para prolongar el tiempo espiratorio y limitar la hiperinflación dinámica",
                "Calcular la auto-PEEP con pausa espiratoria y ajustar la PEEP externa a una fracción de ella",
                "Justificar una PaCO₂ objetivo cercana a la basal del paciente con hipercapnia crónica",
              ],
            },
            {
              slug: "ventilacion-asma",
              title: "Ventilación en el asma grave",
              estimatedMinutes: 45,
              objectives: [
                "Explicar cómo la ventilación minuto, el volumen corriente y el tiempo espiratorio determinan la hiperinflación en el asma grave",
                "Ajustar los parámetros iniciales del ventilador según la estrategia de hipoventilación controlada",
                "Interpretar la presión meseta, la auto-PEEP, el VEI y los signos indirectos de atrapamiento",
                "Aplicar una secuencia de evaluación ante la hipotensión tras la intubación del paciente asmático",
                "Justificar los límites aceptados de la hipercapnia permisiva",
              ],
            },
          ],
        },
        {
          key: "module-03-advertencias-asincronias",
          legacy: true,
          title: "Asincronías complejas",
          description: "Doble disparo, disparo reverso, esfuerzos ineficaces y abordaje sistemático.",
          lessons: [
            {
              slug: "advertencias-asincronias",
              title: "Asincronías complejas: doble disparo, disparo reverso y P-SILI",
              legacyId: "lesson-advertencias-asincronias",
              estimatedMinutes: 45,
              objectives: [
                "Identificar en las curvas de presión y flujo el doble disparo iniciado por el paciente y diferenciarlo del disparo reverso",
                "Calcular el índice de asincronía y el volumen apilado en mL/kg de peso predicho a partir de un registro",
                "Explicar el mecanismo de la lesión pulmonar autoinfligida y del pendelluft en el pulmón lesionado",
                "Interpretar la relación entre asincronía frecuente y pronóstico reconociendo los límites de la evidencia observacional",
              ],
            },
            {
              slug: "manejo-asincronias",
              title: "Abordaje sistemático de las asincronías",
              estimatedMinutes: 40,
              objectives: [
                "Aplicar un algoritmo de detección, clasificación, búsqueda de la causa y corrección de las asincronías",
                "Calcular el esfuerzo muscular y la presión transpulmonar dinámica estimados a partir de la presión de oclusión espiratoria",
                "Interpretar la P0.1 para decidir si el paciente está infraasistido o sobreasistido",
                "Ajustar el soporte, el tiempo inspiratorio y el ciclado según el tipo de asincronía",
                "Justificar el uso de sedoanalgesia y bloqueo neuromuscular según la evidencia y las guías actuales",
              ],
            },
          ],
        },
        {
          key: "module-04-destete-complejo-vmni",
          legacy: true,
          title: "Destete difícil y ventilación no invasiva",
          description: "Destete difícil y prolongado; VNI y cánula nasal de alto flujo tras la extubación.",
          lessons: [
            {
              slug: "destete-complejo-vmni",
              title: "Destete difícil y prolongado",
              legacyId: "lesson-destete-complejo-vmni",
              estimatedMinutes: 45,
              objectives: [
                "Clasificar el destete de un paciente según el consenso de 2007 y según el estudio WIND",
                "Calcular el índice tensión-tiempo y el cociente frecuencia/volumen e interpretarlos como balance entre carga y capacidad",
                "Identificar las causas de fracaso del destete mediante el esquema ABCDE",
                "Justificar el momento de la traqueostomía y el método de destete en el paciente prolongado según la evidencia",
              ],
            },
            {
              slug: "vni-post-extubacion",
              title: "VNI y cánula nasal de alto flujo tras la extubación",
              estimatedMinutes: 40,
              objectives: [
                "Diferenciar el uso preventivo de la ventilación no invasiva de su uso como rescate",
                "Identificar a los pacientes con alto riesgo de fracaso de la extubación según los criterios de los ensayos",
                "Seleccionar ventilación no invasiva, cánula nasal de alto flujo u oxígeno convencional según el riesgo y las guías",
                "Calcular la reducción absoluta del riesgo y el número necesario a tratar a partir de los resultados de un ensayo",
                "Justificar la reintubación sin demora ante una insuficiencia respiratoria posextubación establecida",
              ],
            },
          ],
        },
        {
          key: "module-05-obesidad-sedentarismo",
          legacy: true,
          title: "Ventilación en el paciente con obesidad",
          description: "Mecánica, programación y cuidados del paciente con obesidad.",
          lessons: [
            {
              slug: "obesidad-sedentarismo",
              title: "Ventilación en el paciente con obesidad",
              legacyId: "lesson-obesidad-sedentarismo",
              estimatedMinutes: 45,
              objectives: [
                "Explicar cómo la obesidad reduce la CRF y eleva la presión pleural, y por qué eso produce atelectasias en decúbito supino",
                "Calcular el peso corporal predicho y el volumen corriente a partir de la talla medida",
                "Calcular la driving pressure, la compliance y la presión transpulmonar espiratoria e inspiratoria con presión esofágica",
                "Ajustar la PEEP según la respuesta de la mecánica y la hemodinamia, justificando el uso selectivo del reclutamiento",
                "Planificar la posición, la preoxigenación y el soporte tras la extubación en el paciente con obesidad",
              ],
            },
          ],
        },
        {
          key: "module-08-recuperacion-proteccion",
          legacy: true,
          title: "Casos integradores",
          description: "Casos clínicos completos que integran el currículo, con práctica en el simulador.",
          lessons: [
            {
              slug: "recuperacion-proteccion",
              title: "Caso integrador 1: SDRA por neumonía",
              legacyId: "lesson-recuperacion-proteccion",
              estimatedMinutes: 50,
              objectives: [
                "Identificar un SDRA con la definición de Berlín y con la definición global de 2024",
                "Calcular el volumen corriente por peso predicho, la driving pressure y la compliance en cada etapa del caso",
                "Justificar la indicación de prono y las decisiones sobre PEEP y reclutamiento según las guías ESICM 2023 y ATS 2024",
                "Ajustar el descenso de FiO₂ y PEEP y la transición a modo asistido",
                "Planificar la prueba de ventilación espontánea y el soporte tras la extubación",
              ],
            },
            {
              slug: "caso-epoc",
              title: "Caso integrador 2: exacerbación de EPOC con hiperinflación dinámica",
              estimatedMinutes: 45,
              objectives: [
                "Interpretar una acidosis respiratoria crónica agudizada e indicar la VNI",
                "Calcular el tiempo espiratorio, la resistencia, la auto-PEEP y la compliance con la PEEP total",
                "Ajustar la frecuencia, el flujo y la presión de soporte para reducir la hiperinflación y los esfuerzos ineficaces",
                "Justificar una meta de PaCO₂ basada en el estado previo del paciente",
                "Distinguir el uso preventivo de la VNI tras la extubación de su uso como rescate",
              ],
            },
            {
              slug: "caso-asma",
              title: "Caso integrador 3: crisis asmática grave",
              estimatedMinutes: 45,
              objectives: [
                "Identificar los signos de agotamiento que indican la intubación en la crisis asmática",
                "Calcular el tiempo espiratorio, la resistencia, la auto-PEEP y el volumen al final de la inspiración por kg de peso predicho",
                "Aplicar la hipoventilación controlada priorizando la prevención de la hiperinflación sobre la corrección de la PaCO₂",
                "Diferenciar hiperinflación dinámica y neumotórax a tensión ante un deterioro súbito",
                "Justificar el momento de inicio del destete según la evolución de la obstrucción",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ventylab-principiante",
      track: "ventylab",
      title: "Principiante",
      description: "Primeros pasos en la plataforma y el ventilador VentyLab.",
      order: 1,
      difficulty: "beginner",
      sequentialModules: true,
      modules: [
        {
          key: "primeros-pasos",
          legacy: false,
          title: "Primeros pasos en VentyLab",
          description: "Navegación, aprendizaje con el currículo y el tutor IA, y evaluaciones.",
          lessons: [
            {
              slug: "navegacion-plataforma",
              title: "Navegación, roles, perfil y notificaciones",
              estimatedMinutes: 20,
              objectives: [
                "Identificar las entradas del menú lateral, el grupo Herramientas y el menú Opciones de la tarjeta de usuario.",
                "Diferenciar lo que ven y pueden hacer los roles Estudiante, Docente y Administrador.",
                "Actualizar el nombre, la foto y la contraseña desde Mi perfil.",
                "Gestionar las notificaciones desde la campana y la página Notificaciones.",
              ],
            },
            {
              slug: "aprender-con-ventylab",
              title: "Aprender con VentyLab: currículo, progreso y tutor IA",
              estimatedMinutes: 25,
              objectives: [
                "Describir la organización del currículo en bloques, niveles y módulos y las reglas de desbloqueo.",
                "Explicar qué cuenta como página vista y lección completada.",
                "Utilizar TutorAI, la expansión de tema y las notas ancladas para estudiar con práctica de recuperación.",
                "Valorar las respuestas de la IA con comentarios concretos.",
                "Justificar por qué las respuestas de la IA deben verificarse y nunca usarse para decisiones sobre pacientes reales.",
              ],
            },
            {
              slug: "evaluaciones-plataforma",
              title: "Evaluaciones: quizzes, talleres y exámenes",
              estimatedMinutes: 20,
              objectives: [
                "Diferenciar quiz, taller y examen según su presentación, retroalimentación y publicación de la nota.",
                "Aplicar las reglas de tiempo, guardado automático, intentos y envío al presentar un intento.",
                "Interpretar los estados de un intento y explicar cuándo se publica la calificación.",
                "Calcular el efecto de la calificación todo o nada en preguntas de selección múltiple.",
              ],
            },
          ],
        },
        {
          key: "ventylab-module-02-ventilador-componentes",
          legacy: true,
          title: "El ventilador VentyLab y sus componentes",
          description: "Arquitectura del equipo físico, telemetría y diferencias con el simulador digital.",
          lessons: [
            {
              slug: "ventilador-componentes",
              title: "El ventilador VentyLab y sus componentes",
              legacyId: "vl-ventilador-componentes",
              estimatedMinutes: 30,
              objectives: [
                "Describir el recorrido de la telemetría y de los comandos entre el equipo, el broker, el servidor y el navegador.",
                "Comparar los modos y rangos disponibles en el simulador digital y en el equipo real.",
                "Calcular el tiempo espiratorio y la relación I:E a partir de FR y Ti y verificar la regla de Te mínimo.",
                "Interpretar los estados Enviando, Aplicado y Rechazado de un cambio en el equipo real.",
                "Justificar por qué la consola muestra los valores que informa el equipo y no los escritos.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ventylab-intermedio",
      track: "ventylab",
      title: "Intermedio",
      description: "El simulador digital, los casos clínicos, las sesiones y la retroalimentación.",
      order: 2,
      difficulty: "intermediate",
      sequentialModules: true,
      prerequisiteLevelId: "ventylab-principiante",
      modules: [
        {
          key: "ventylab-module-03-programacion-modos",
          legacy: true,
          title: "El simulador digital: programación y monitoreo",
          description: "Programar modos clásicos y leer el monitoreo, las alarmas y el estado del paciente.",
          lessons: [
            {
              slug: "programacion-modos-clasicos",
              title: "Programar modos clásicos en el simulador",
              legacyId: "vl-programacion-modos-clasicos",
              estimatedMinutes: 30,
              objectives: [
                "Identificar las zonas de la consola y los parámetros que muestra cada modo.",
                "Calcular el peso corporal predicho, el volumen corriente por kilogramo y el volumen minuto.",
                "Ajustar FR y Ti para obtener una relación I:E determinada.",
                "Explicar cuándo se aplica cada tipo de cambio y cómo actúa el multiplicador de tiempo.",
                "Programar VCV y PCV en un paciente simulado y comparar sus curvas.",
              ],
            },
            {
              slug: "monitoreo-simulador",
              title: "Leer el monitoreo, las alarmas y el estado del paciente",
              estimatedMinutes: 30,
              objectives: [
                "Interpretar las curvas de presión, flujo y volumen y los bucles P-V y F-V con una lectura sistemática.",
                "Calcular la compliance estática, la dinámica y la presión de distensión a partir de las tarjetas.",
                "Priorizar y resolver alarmas usando el panel ¿Cómo estabilizar? sin delegar la decisión.",
                "Explicar los estados de evolución del paciente simulado y sus límites como modelo educativo.",
                "Ajustar la frecuencia ante auto-PEEP y verificar el efecto en las curvas.",
              ],
            },
          ],
        },
        {
          key: "casos-sesiones-ia",
          legacy: false,
          title: "Casos clínicos, sesiones y retroalimentación",
          description: "Casos del catálogo y paciente propio; sesiones, repetición y retroalimentación con IA.",
          lessons: [
            {
              slug: "casos-clinicos-simulador",
              title: "Casos clínicos del catálogo y paciente propio",
              estimatedMinutes: 25,
              objectives: [
                "Cargar un caso clínico publicado con los filtros de patología y dificultad y enviarlo al Monitoreo",
                "Diferenciar un caso del catálogo, un paciente aleatorio y un paciente propio según lo que define cada uno en la simulación",
                "Interpretar los objetivos del cajón «Caso clínico» y su estado en tiempo real sin confundirlo con la nota",
                "Calcular el volumen corriente por kilo de peso predicho a partir de los datos del caso",
                "Explicar cómo el modelo de evolución hace mejorar o empeorar al paciente simulado",
              ],
            },
            {
              slug: "sesiones-repeticion-ia",
              title: "Sesiones, repetición y retroalimentación con IA",
              estimatedMinutes: 25,
              objectives: [
                "Localizar una sesión en Mis sesiones con el filtro de tipo y los periodos de 31 días y elegir la acción adecuada",
                "Interpretar el resultado oficial del servidor, sus objetivos y el desglose de la rúbrica",
                "Usar la repetición y sus eventos para verificar una hipótesis sobre la propia práctica",
                "Aplicar las reglas de uso de la Asesoría IA (registro, política en examen, límite de uso)",
                "Justificar cuándo descartar una sugerencia de IA contrastándola con la fisiología y los objetivos del caso",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "ventylab-avanzado",
      track: "ventylab",
      title: "Avanzado",
      description: "Reserva, conexión y uso seguro del equipo físico.",
      order: 3,
      difficulty: "advanced",
      sequentialModules: true,
      prerequisiteLevelId: "ventylab-intermedio",
      modules: [
        {
          key: "reserva-conexion-equipo",
          legacy: false,
          title: "Reserva y conexión del equipo físico",
          description: "Reservar el equipo y operarlo desde la pestaña Conexión.",
          lessons: [
            {
              slug: "reserva-equipo",
              title: "Reservar el equipo físico",
              estimatedMinutes: 20,
              objectives: [
                "Reservar el ventilador con «Reservar ahora» o desde una franja libre del calendario",
                "Identificar las reglas de reserva vigentes (franja, duración máxima, antelación y límites) en la página del calendario",
                "Distinguir una reserva personal de una de grupo y quién opera en cada una",
                "Cancelar o liberar una reserva e interpretar el aviso de una reserva desplazada",
              ],
            },
            {
              slug: "conexion-equipo",
              title: "Conectar y operar el equipo real",
              estimatedMinutes: 30,
              objectives: [
                "Describir el camino de la telemetría y de los comandos entre el equipo, el broker MQTT, el servidor y el navegador",
                "Interpretar los estados de la pestaña Conexión y la diferencia entre Desconectar y Liberar",
                "Tomar, liberar o ceder el control exclusivo del equipo según el rol",
                "Interpretar la latencia, el estado del equipo y el estado por parámetro del envío automático",
                "Verificar en Comandos recientes si un cambio fue aplicado por el equipo",
              ],
            },
          ],
        },
        {
          key: "seguridad-modo-real",
          legacy: false,
          title: "Seguridad en el modo real",
          description: "Salvaguardas, rangos seguros y respuesta ante fallas del equipo.",
          lessons: [
            {
              slug: "seguridad-modo-real",
              title: "Salvaguardas, rangos seguros y respuesta ante fallas",
              estimatedMinutes: 30,
              objectives: [
                "Identificar las condiciones de uso del equipo físico (pulmón de prueba, parada en el equipo, sin comandos automáticos) y las responsabilidades de cada papel",
                "Calcular el tiempo espiratorio y la relación I:E de un ajuste y predecir si el servidor lo rechaza",
                "Diferenciar los límites técnicos del laboratorio de una recomendación clínica",
                "Aplicar la respuesta adecuada ante equipo sin datos, pérdida de conexión o de control, alarmas y comandos sin confirmación",
                "Ejecutar el cierre ordenado y las medidas de higiene de la práctica",
              ],
            },
          ],
        },
      ],
    },
  ],
  retiredModuleIds: [
    "ventylab-module-01-historia-fisiologia",
    "ventylab-module-04-vni-destete",
    "ventylab-module-05-raciocinio-clinico",
    "ventylab-module-06-innovacion-tecnologia",
  ],
  retiredLessonIds: [
    "rp-inversion-fisiologica",
    "rp-ecuacion-movimiento",
    "rp-variables-fase",
    "basic-parameters",
    "vl-historia-fisiologia-aplicada",
    "vl-vni-destete",
    "vl-raciocinio-clinico-patologias",
    "vl-innovacion-tecnologia-gestion",
  ],
};
