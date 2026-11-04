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
                "Diferenciar la zona de conducción de la zona respiratoria de la vía aérea.",
                "Describir la función del surfactante y de la interfaz alvéolo-capilar.",
                "Identificar los músculos inspiratorios y espiratorios y su papel en reposo y en esfuerzo.",
              ],
            },
            {
              slug: "mecanica-respiracion-espontanea",
              title: "Mecánica de la respiración espontánea",
              estimatedMinutes: 40,
              objectives: [
                "Explicar las presiones pleural, alveolar y transpulmonar durante el ciclo respiratorio.",
                "Relacionar el gradiente de presión con el flujo de aire en la respiración espontánea.",
                "Describir los componentes del trabajo respiratorio.",
              ],
            },
            {
              slug: "intercambio-gaseoso",
              title: "Intercambio gaseoso y transporte de O₂ y CO₂",
              estimatedMinutes: 45,
              objectives: [
                "Aplicar la ley de Fick a la difusión alvéolo-capilar.",
                "Distinguir shunt, espacio muerto y desequilibrio ventilación/perfusión.",
                "Calcular el contenido arterial de oxígeno e interpretar la curva de disociación de la hemoglobina.",
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
                "Aplicar las leyes de Boyle, Dalton y Henry a la fisiología respiratoria.",
                "Convertir entre cmH₂O, mmHg y kPa.",
                "Leer gráficas magnitud-tiempo de presión, flujo y volumen.",
              ],
            },
            {
              slug: "indicaciones-vm",
              title: "Indicaciones y objetivos de la ventilación mecánica",
              legacyId: "vm-indications",
              estimatedMinutes: 35,
              objectives: [
                "Reconocer la insuficiencia respiratoria hipoxémica e hipercápnica.",
                "Enumerar las indicaciones de la ventilación mecánica invasiva y no invasiva.",
                "Formular los objetivos fisiológicos y clínicos de la ventilación.",
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
                "Contrastar el gradiente de presión de la respiración espontánea con el de la ventilación con presión positiva.",
                "Explicar las consecuencias de la presión positiva sobre la distribución de la ventilación y la hemodinamia.",
                "Situar los hitos históricos de la ventilación mecánica.",
              ],
            },
            {
              slug: "volumenes-y-ventilacion-alveolar",
              title: "Volúmenes pulmonares, espacio muerto y ventilación alveolar",
              estimatedMinutes: 45,
              objectives: [
                "Definir los volúmenes y capacidades pulmonares y la capacidad residual funcional.",
                "Calcular la ventilación minuto y la ventilación alveolar.",
                "Estimar el espacio muerto con la ecuación de Bohr-Enghoff y relacionarlo con la PaCO₂.",
              ],
            },
            {
              slug: "oxigenacion-vs-ventilacion",
              title: "Oxigenación y ventilación: dos objetivos distintos",
              estimatedMinutes: 40,
              objectives: [
                "Identificar los determinantes de la PaO₂ y de la PaCO₂.",
                "Aplicar la ecuación del gas alveolar y calcular el gradiente alvéolo-arterial.",
                "Elegir qué parámetro modificar ante hipoxemia o hipercapnia.",
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
                "Describir los componentes elástico y resistivo de la presión en la vía aérea.",
                "Calcular la presión pico y la presión meseta a partir de la mecánica.",
                "Aplicar la ecuación del movimiento en VCV y en PCV.",
              ],
            },
            {
              slug: "compliance-elastancia",
              title: "Compliance y elastancia del sistema respiratorio",
              estimatedMinutes: 40,
              objectives: [
                "Diferenciar compliance estática y dinámica.",
                "Medir la compliance con una pausa inspiratoria.",
                "Reconocer causas de compliance baja y alta.",
              ],
            },
            {
              slug: "resistencia-constante-tiempo",
              title: "Resistencia de la vía aérea y constante de tiempo",
              estimatedMinutes: 40,
              objectives: [
                "Calcular la resistencia de la vía aérea con la diferencia pico-meseta.",
                "Identificar causas de resistencia aumentada.",
                "Calcular la constante de tiempo y relacionarla con el vaciado espiratorio.",
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
                "Identificar los componentes neumáticos y de medición del ventilador.",
                "Describir el circuito, la humidificación y los filtros.",
                "Relacionar cada componente con riesgos para el paciente.",
              ],
            },
            {
              slug: "variables-fase",
              title: "Variables de fase: disparo, límite y ciclado",
              legacyId: "module-03-variables-fase",
              estimatedMinutes: 40,
              objectives: [
                "Definir variable de control y variables de fase.",
                "Clasificar el disparo, el límite y el ciclado de una respiración.",
                "Aplicar la taxonomía de los modos ventilatorios.",
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
                "Calcular el peso corporal predicho por sexo y talla.",
                "Programar el volumen corriente en mL/kg de peso predicho.",
                "Justificar por qué no se usa el peso real.",
              ],
            },
            {
              slug: "frecuencia-tiempos-ie",
              title: "Frecuencia, tiempos y relación I:E",
              estimatedMinutes: 35,
              objectives: [
                "Calcular el tiempo inspiratorio, el espiratorio y la relación I:E.",
                "Relacionar flujo inspiratorio, volumen y tiempo inspiratorio.",
                "Ajustar la frecuencia para la ventilación minuto deseada.",
              ],
            },
            {
              slug: "fio2-peep-iniciales",
              title: "FiO₂ y PEEP: primeros ajustes",
              estimatedMinutes: 35,
              objectives: [
                "Elegir FiO₂ y PEEP iniciales y metas de saturación.",
                "Programar la sensibilidad del disparo.",
                "Planificar la reevaluación de los primeros 30 minutos.",
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
                "Clasificar los modos por variable de control y patrón respiratorio.",
                "Diferenciar respiraciones mandatorias y espontáneas.",
                "Traducir nombres comerciales a la taxonomía.",
              ],
            },
            {
              slug: "vcv",
              title: "Ventilación controlada por volumen (VCV)",
              estimatedMinutes: 40,
              objectives: [
                "Describir las curvas de VCV con flujo constante y desacelerado.",
                "Interpretar la presión pico y la presión meseta en VCV.",
                "Identificar ventajas y riesgos de VCV.",
              ],
            },
            {
              slug: "pcv",
              title: "Ventilación controlada por presión (PCV)",
              estimatedMinutes: 40,
              objectives: [
                "Describir las curvas de PCV.",
                "Predecir el volumen corriente ante cambios de compliance y resistencia.",
                "Identificar ventajas y riesgos de PCV.",
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
                "Leer de forma sistemática las curvas de presión, flujo y volumen en el tiempo.",
                "Interpretar presión pico, meseta, media y PEEP.",
                "Reconocer patrones anormales básicos.",
              ],
            },
            {
              slug: "alarmas-basicas",
              title: "Alarmas del ventilador: tipos y respuesta",
              estimatedMinutes: 40,
              objectives: [
                "Clasificar las alarmas del ventilador por prioridad.",
                "Ajustar límites de alarma con criterio clínico.",
                "Aplicar una respuesta escalonada a cada alarma.",
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
                "Explicar la interacción corazón-pulmón bajo presión positiva.",
                "Describir los mecanismos de barotrauma, volutrauma, atelectrauma y biotrauma.",
                "Reconocer los efectos extrapulmonares de la ventilación.",
              ],
            },
            {
              slug: "seguridad-paciente-ventilado",
              title: "Seguridad del paciente ventilado",
              estimatedMinutes: 40,
              objectives: [
                "Verificar el equipo antes de conectar al paciente.",
                "Aplicar medidas de prevención de eventos asociados a la ventilación.",
                "Responder al deterioro agudo con un enfoque sistemático.",
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
                "Comparar VCV y PCV según la variable protegida.",
                "Elegir el modo según la mecánica y los objetivos.",
                "Anticipar el efecto de los cambios de mecánica en cada modo.",
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
                "Describir el disparo y el ciclado por flujo en PSV.",
                "Ajustar el nivel de soporte y el criterio de ciclado.",
                "Reconocer sobreasistencia e infraasistencia.",
              ],
            },
            {
              slug: "cpap",
              title: "CPAP y presión positiva continua",
              estimatedMinutes: 35,
              objectives: [
                "Explicar el efecto de la CPAP sobre la CRF y el trabajo respiratorio.",
                "Identificar indicaciones de CPAP invasiva y no invasiva.",
                "Reconocer sus limitaciones.",
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
                "Describir las respiraciones mandatorias y espontáneas en SIMV.",
                "Explicar la ventana de sincronía.",
                "Valorar la evidencia de SIMV en el destete.",
              ],
            },
            {
              slug: "modos-duales-adaptativos",
              title: "Modos duales y de control adaptativo",
              estimatedMinutes: 40,
              objectives: [
                "Explicar el control adaptativo de presión con volumen objetivo.",
                "Identificar riesgos de los modos adaptativos con esfuerzo intenso.",
                "Describir APRV de forma introductoria.",
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
                "Reconocer la forma de las curvas en cada modo.",
                "Detectar auto-PEEP, fugas y secreciones en las curvas.",
                "Ajustar flujo y tiempo inspiratorio con base en las curvas.",
              ],
            },
            {
              slug: "bucles-pv-fv",
              title: "Bucles presión-volumen y flujo-volumen",
              estimatedMinutes: 40,
              objectives: [
                "Construir e interpretar los bucles P-V y F-V.",
                "Reconocer sobredistensión, obstrucción y secreciones en los bucles.",
                "Conocer las limitaciones de los bucles dinámicos.",
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
                "Reconocer esfuerzos ineficaces, autodisparo y disparo retardado en las curvas.",
                "Identificar sus causas.",
                "Proponer ajustes correctivos.",
              ],
            },
            {
              slug: "asincronias-flujo-ciclado",
              title: "Asincronías de flujo y de ciclado",
              estimatedMinutes: 40,
              objectives: [
                "Reconocer hambre de flujo y flujo excesivo.",
                "Reconocer ciclado prematuro y tardío.",
                "Corregir el flujo, el tiempo inspiratorio o el criterio de ciclado.",
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
                "Aplicar un método sistemático a la gasometría arterial.",
                "Identificar el trastorno primario y calcular la compensación esperada.",
                "Calcular el anión gap.",
              ],
            },
            {
              slug: "gasometria-ajustes-ventilador",
              title: "Gasometría y ajustes del ventilador",
              estimatedMinutes: 40,
              objectives: [
                "Calcular el cociente PaO₂/FiO₂.",
                "Ajustar la ventilación minuto para una PaCO₂ objetivo.",
                "Aplicar la hipercapnia permisiva con sus límites.",
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
                "Explicar el efecto de la PEEP sobre la CRF y el reclutamiento.",
                "Diferenciar PEEP extrínseca e intrínseca.",
                "Reconocer los efectos hemodinámicos y la sobredistensión.",
              ],
            },
            {
              slug: "indices-oxigenacion",
              title: "Índices de oxigenación y ajuste de FiO₂ y PEEP",
              estimatedMinutes: 40,
              objectives: [
                "Calcular PaO₂/FiO₂, SpO₂/FiO₂ e índice de oxigenación.",
                "Aplicar tablas FiO₂/PEEP de forma introductoria.",
                "Definir metas de oxigenación.",
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
                "Aplicar los criterios de preparación para el destete.",
                "Calcular e interpretar el índice de respiración rápida superficial.",
                "Clasificar el destete en simple, difícil y prolongado.",
              ],
            },
            {
              slug: "prueba-ventilacion-espontanea",
              title: "Prueba de ventilación espontánea y extubación",
              estimatedMinutes: 40,
              objectives: [
                "Realizar una prueba de ventilación espontánea.",
                "Reconocer los criterios de fracaso.",
                "Planificar la extubación y la vigilancia posterior.",
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
                "Explicar stress, strain y el concepto de baby lung.",
                "Describir volutrauma, atelectrauma, ergotrauma y biotrauma.",
                "Reconocer la lesión autoinfligida por el paciente.",
              ],
            },
            {
              slug: "ventilacion-protectora",
              title: "Ventilación protectora: volumen corriente, presión meseta y driving pressure",
              estimatedMinutes: 45,
              objectives: [
                "Programar una estrategia protectora con Vt bajo y límites de presión.",
                "Calcular la driving pressure.",
                "Aplicar la protección pulmonar también en pulmones sanos.",
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
                "Aplicar la definición de Berlín y la definición global del SDRA.",
                "Explicar la fisiopatología y la mecánica del SDRA.",
                "Clasificar la gravedad.",
              ],
            },
            {
              slug: "manejo-escalonado-sdra",
              title: "Manejo ventilatorio escalonado del SDRA",
              estimatedMinutes: 45,
              objectives: [
                "Aplicar las recomendaciones de las guías vigentes.",
                "Escalar el tratamiento según la gravedad.",
                "Identificar criterios de terapias de rescate.",
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
                "Explicar el concepto de reclutabilidad.",
                "Valorar la evidencia sobre las maniobras de reclutamiento.",
                "Reconocer sus riesgos.",
              ],
            },
            {
              slug: "titulacion-peep",
              title: "Métodos de titulación de PEEP",
              estimatedMinutes: 45,
              objectives: [
                "Comparar tablas FiO₂/PEEP, titulación por compliance y por presión esofágica.",
                "Realizar una titulación decremental.",
                "Valorar la evidencia de cada método.",
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
                "Explicar los cambios de ventilación y perfusión en prono.",
                "Relacionar el prono con la homogeneización del stress pulmonar.",
                "Describir sus efectos sobre el ventrículo derecho.",
              ],
            },
            {
              slug: "prono-indicaciones-tecnica",
              title: "Indicaciones, técnica y seguridad del prono",
              estimatedMinutes: 40,
              objectives: [
                "Aplicar las indicaciones basadas en la evidencia.",
                "Planificar el procedimiento con el equipo.",
                "Prevenir y reconocer las complicaciones.",
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
                "Calcular la driving pressure y la potencia mecánica.",
                "Interpretar la evidencia que las asocia con el pronóstico.",
                "Reconocer los límites de estas métricas.",
              ],
            },
            {
              slug: "auto-peep-hiperinflacion",
              title: "Auto-PEEP e hiperinflación dinámica",
              estimatedMinutes: 40,
              objectives: [
                "Explicar el mecanismo de la hiperinflación dinámica.",
                "Medir la auto-PEEP con una pausa espiratoria.",
                "Aplicar estrategias para reducirla.",
              ],
            },
            {
              slug: "presion-esofagica",
              title: "Presión esofágica y presión transpulmonar",
              estimatedMinutes: 40,
              objectives: [
                "Describir la medición de la presión esofágica.",
                "Calcular la presión transpulmonar inspiratoria y espiratoria.",
                "Identificar situaciones en que cambia la decisión clínica.",
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
                "Explicar la limitación del flujo espiratorio y el atrapamiento aéreo.",
                "Diferenciar la fisiopatología de EPOC y asma.",
                "Relacionar el tabaquismo con el daño de la vía aérea.",
              ],
            },
            {
              slug: "ventilacion-epoc",
              title: "Ventilación en la exacerbación de EPOC",
              estimatedMinutes: 45,
              objectives: [
                "Indicar la ventilación no invasiva en la exacerbación.",
                "Programar la ventilación invasiva para reducir la hiperinflación.",
                "Usar la PEEP externa frente a la auto-PEEP.",
              ],
            },
            {
              slug: "ventilacion-asma",
              title: "Ventilación en el asma grave",
              estimatedMinutes: 45,
              objectives: [
                "Programar la ventilación del asma grave con hipercapnia permisiva.",
                "Vigilar presión meseta y auto-PEEP.",
                "Prevenir barotrauma e hipotensión.",
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
              title: "Asincronías complejas",
              legacyId: "lesson-advertencias-asincronias",
              estimatedMinutes: 45,
              objectives: [
                "Reconocer doble disparo y disparo reverso.",
                "Relacionar los esfuerzos ineficaces con la auto-PEEP.",
                "Valorar el impacto pronóstico de las asincronías.",
              ],
            },
            {
              slug: "manejo-asincronias",
              title: "Abordaje sistemático de las asincronías",
              estimatedMinutes: 40,
              objectives: [
                "Aplicar un algoritmo de detección y corrección.",
                "Distinguir causas del paciente, del ventilador y del ajuste.",
                "Integrar sedación y analgesia en el manejo.",
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
                "Identificar las causas de fracaso del destete.",
                "Planificar el destete difícil.",
                "Reconocer la debilidad adquirida en la UCI.",
              ],
            },
            {
              slug: "vni-post-extubacion",
              title: "VNI y cánula nasal de alto flujo tras la extubación",
              estimatedMinutes: 40,
              objectives: [
                "Diferenciar uso preventivo y de rescate.",
                "Seleccionar la población de alto riesgo.",
                "Evitar el retraso de la reintubación.",
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
                "Explicar los cambios de mecánica en la obesidad.",
                "Programar Vt por peso predicho y PEEP adecuada.",
                "Planificar la posición, la inducción y la extubación.",
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
                "Integrar oxigenación, protección pulmonar y gasometría en un caso de SDRA.",
                "Justificar cada ajuste con la mecánica medida.",
                "Planificar el destete.",
              ],
            },
            {
              slug: "caso-epoc",
              title: "Caso integrador 2: EPOC con hiperinflación dinámica",
              estimatedMinutes: 45,
              objectives: [
                "Detectar y reducir la hiperinflación dinámica.",
                "Ajustar la ventilación ante acidosis respiratoria.",
                "Planificar la transición a ventilación espontánea.",
              ],
            },
            {
              slug: "caso-asma",
              title: "Caso integrador 3: crisis asmática grave",
              estimatedMinutes: 45,
              objectives: [
                "Programar la ventilación inicial del asma grave.",
                "Reconocer y manejar la hipotensión por hiperinflación.",
                "Aplicar la hipercapnia permisiva.",
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
              title: "Navegación, perfil y preferencias",
              estimatedMinutes: 20,
              objectives: ["Ubicar las secciones principales de la plataforma.", "Configurar el perfil.", "Gestionar las notificaciones."],
            },
            {
              slug: "aprender-con-ventylab",
              title: "Aprender con VentyLab: currículo, progreso y tutor IA",
              estimatedMinutes: 25,
              objectives: ["Recorrer el currículo y el visor de lecciones.", "Interpretar el progreso.", "Usar el tutor IA de forma responsable."],
            },
            {
              slug: "evaluaciones-plataforma",
              title: "Evaluaciones: quizzes, talleres y exámenes",
              estimatedMinutes: 20,
              objectives: ["Diferenciar los tipos de evaluación.", "Responder y entregar un intento.", "Consultar los resultados cuando el docente los libera."],
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
              objectives: ["Describir la arquitectura del equipo y su conexión con la plataforma.", "Identificar los modos y parámetros disponibles.", "Diferenciar el simulador digital del equipo real."],
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
              objectives: ["Elegir el modo y programar sus parámetros.", "Comprender la aplicación automática de los cambios.", "Usar el multiplicador de tiempo."],
            },
            {
              slug: "monitoreo-simulador",
              title: "Leer el monitoreo, las alarmas y el estado del paciente",
              estimatedMinutes: 30,
              objectives: ["Interpretar curvas, bucles y tarjetas del monitoreo.", "Usar las sugerencias de cada alarma.", "Seguir la evolución del paciente."],
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
              objectives: ["Cargar un caso del catálogo.", "Crear un paciente propio.", "Seguir los objetivos del caso."],
            },
            {
              slug: "sesiones-repeticion-ia",
              title: "Sesiones, repetición y retroalimentación con IA",
              estimatedMinutes: 25,
              objectives: ["Revisar una sesión y su repetición.", "Interpretar la nota de la sesión.", "Usar el coaching de IA conociendo sus límites."],
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
              objectives: ["Crear y cancelar una reserva.", "Entender los turnos y las reservas de grupo.", "Preparar la sesión con el equipo."],
            },
            {
              slug: "conexion-equipo",
              title: "Conectar y operar el equipo real",
              estimatedMinutes: 30,
              objectives: ["Conectar con el equipo y leer su estado.", "Interpretar la telemetría.", "Usar el envío automático con sus salvaguardas."],
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
              objectives: ["Explicar las salvaguardas del envío automático.", "Responder ante una pérdida de conexión o una alarma del equipo.", "Aplicar las responsabilidades del usuario."],
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
