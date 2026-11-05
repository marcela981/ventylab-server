/*
 * Funcionalidad: Reglas deterministas "¿Cómo estabilizar?" por alarma
 * Descripción: Sugerencias de primera línea por tipo de alarma (del motor y del ventilador físico) y por contexto del monitor (presión pico frente a meseta, auto-PEEP, oxigenación, PAM), con su referencia bibliográfica; siempre disponibles, sin IA. Redacción original, pendiente de validación experta (docs/cierre/validacion-contenido.md, Bloque A)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type StabilizationLanguage = "es" | "en";

/** Monitor values the rules may branch on; all optional (the real ventilator reports fewer values) */
export interface AlarmRuleContext {
  readonly peakPressureCmH2O?: number;
  readonly plateauPressureCmH2O?: number;
  readonly autoPeepCmH2O?: number;
  readonly spo2Percent?: number;
  readonly fio2?: number;
  readonly peepCmH2O?: number;
  readonly meanArterialPressureMmHg?: number;
  readonly mode?: string;
}

export interface StabilizationRule {
  readonly id: string;
  readonly text: string;
  readonly reference: string;
}

interface RuleText {
  readonly id: string;
  readonly es: string;
  readonly en: string;
  readonly reference: string;
  readonly when?: (context: AlarmRuleContext) => boolean;
}

const HESS: string = "Hess y Kacmarek (2019)";
const ARDSNET: string = "ARDS Network (2000)";
const AMATO: string = "Amato et al. (2015)";
const BLANCH: string = "Blanch et al. (2005)";
const LEATHERMAN: string = "Leatherman (2015)";
const PINSKY: string = "Pinsky (2018)";
const EVANS: string = "Evans et al. (2021)";
const AHA: string = "American Heart Association (2020)";
const BENATAR: string = "Benatar et al. (1973)";

/** Peak − plateau above this gap points to a resistive problem (modelling threshold, pending expert review) */
const RESISTIVE_GAP_CMH2O: number = 10;
const PLATEAU_LIMIT_CMH2O: number = 30;

const DOPES: RuleText = {
  id: "DOPES",
  es: "Ante un deterioro agudo, revisa en orden: desplazamiento del tubo, obstrucción, neumotórax, falla del equipo y apilamiento de respiraciones (auto-PEEP).",
  en: "In an acute deterioration check, in order: tube displacement, obstruction, pneumothorax, equipment failure and breath stacking (auto-PEEP).",
  reference: `${AHA}; ${HESS}`,
};

const RULES: Readonly<Record<string, readonly RuleText[]>> = {
  HIGH_PRESSURE: [
    {
      id: "HIGH_PRESSURE_COMPARE",
      es: "Compara la presión pico con la meseta (pausa inspiratoria): si solo sube el pico el problema es resistivo; si sube también la meseta, es de distensibilidad o de hiperinsuflación.",
      en: "Compare peak and plateau pressure (inspiratory hold): a rise in peak alone is resistive; a rise in plateau too points to compliance or hyperinflation.",
      reference: HESS,
    },
    {
      id: "HIGH_PRESSURE_RESISTIVE",
      es: "Pico alto con meseta normal: aspira secreciones, descarta tubo acodado o mordido y considera broncoespasmo.",
      en: "High peak with a normal plateau: suction secretions, rule out a kinked or bitten tube and consider bronchospasm.",
      reference: HESS,
      when: (context: AlarmRuleContext): boolean =>
        context.peakPressureCmH2O !== undefined &&
        context.plateauPressureCmH2O !== undefined &&
        context.peakPressureCmH2O - context.plateauPressureCmH2O > RESISTIVE_GAP_CMH2O,
    },
    {
      id: "HIGH_PRESSURE_PLATEAU",
      es: "Meseta por encima de 30 cmH2O: baja el volumen corriente hacia 6 mL/kg de peso predicho y descarta neumotórax o intubación selectiva.",
      en: "Plateau above 30 cmH2O: lower the tidal volume toward 6 mL/kg of predicted body weight and rule out pneumothorax or mainstem intubation.",
      reference: `${ARDSNET}; ${AMATO}`,
      when: (context: AlarmRuleContext): boolean =>
        context.plateauPressureCmH2O !== undefined && context.plateauPressureCmH2O > PLATEAU_LIMIT_CMH2O,
    },
  ],
  LOW_TIDAL_VOLUME: [
    {
      id: "LOW_VT_LEAK",
      es: "Busca fugas: balón del tubo, conexiones y circuito.",
      en: "Look for leaks: tube cuff, connections and circuit.",
      reference: HESS,
    },
    {
      id: "LOW_VT_PRESSURE_MODE",
      es: "En modos por presión, un volumen que cae indica menor distensibilidad o mayor resistencia: revisa la mecánica antes de subir la presión.",
      en: "In pressure modes a falling volume means lower compliance or higher resistance: check the mechanics before raising the pressure.",
      reference: HESS,
    },
  ],
  HIGH_TIDAL_VOLUME: [
    {
      id: "HIGH_VT_PROTECTIVE",
      es: "Calcula el volumen por peso predicho (talla y sexo) y llévalo a 6-8 mL/kg; en modos por presión, baja la presión inspiratoria o de soporte.",
      en: "Compute the volume per predicted body weight (height and sex) and bring it to 6-8 mL/kg; in pressure modes lower the inspiratory or support pressure.",
      reference: ARDSNET,
    },
  ],
  APNEA: [
    {
      id: "APNEA_BACKUP",
      es: "Verifica que el paciente reciba respiraciones: reconecta o ventila con bolsa y oxígeno al 100 %, revisa la ventilación de respaldo y la sedación.",
      en: "Make sure the patient is receiving breaths: reconnect or bag with 100 % oxygen, check backup ventilation and sedation.",
      reference: HESS,
    },
  ],
  DISCONNECTION: [
    {
      id: "DISCONNECTION_RECONNECT",
      es: "Reconecta el circuito y, si no es posible de inmediato, ventila con bolsa y oxígeno al 100 %.",
      en: "Reconnect the circuit; if that is not possible right away, bag with 100 % oxygen.",
      reference: HESS,
    },
  ],
  HIGH_RESPIRATORY_RATE: [
    {
      id: "HIGH_RR_CAUSE",
      es: "Busca la causa de la taquipnea: asincronía, dolor o ansiedad, hipoxemia o acidosis; ajusta disparo, flujo o soporte antes de sedar.",
      en: "Look for the cause of tachypnea: asynchrony, pain or anxiety, hypoxemia or acidosis; adjust trigger, flow or support before sedating.",
      reference: HESS,
    },
  ],
  AUTO_PEEP: [
    {
      id: "AUTO_PEEP_EXPIRATION",
      es: "Alarga el tiempo espiratorio: baja la frecuencia, acorta el tiempo inspiratorio o sube el flujo; trata el broncoespasmo. Mira que el flujo espiratorio llegue a cero antes de cada respiración.",
      en: "Lengthen expiratory time: lower the rate, shorten inspiratory time or raise the flow; treat bronchospasm. Watch for expiratory flow to reach zero before each breath.",
      reference: `${BLANCH}; ${LEATHERMAN}`,
    },
    {
      id: "AUTO_PEEP_HYPOTENSION",
      es: "Con hipotensión grave por hiperinsuflación, una desconexión breve permite vaciar el pulmón mientras se corrige el patrón.",
      en: "With severe hypotension from hyperinflation, a brief disconnection lets the lung empty while the pattern is corrected.",
      reference: LEATHERMAN,
      when: (context: AlarmRuleContext): boolean =>
        context.meanArterialPressureMmHg !== undefined && context.meanArterialPressureMmHg < 65,
    },
  ],
  LOW_SPO2: [
    {
      id: "LOW_SPO2_SIGNAL",
      es: "Confirma la señal del oxímetro y revisa al paciente con DOPES antes de cambiar el ventilador.",
      en: "Confirm the oximeter signal and check the patient with DOPES before changing the ventilator.",
      reference: HESS,
    },
    {
      id: "LOW_SPO2_PEEP_FIO2",
      es: "Ajusta la combinación PEEP/FiO2 según la tabla de ARDSNet; con shunt alto la FiO2 sola mejora poco y la PEEP recluta, vigilando la meseta y la PAM.",
      en: "Adjust the PEEP/FiO2 combination per the ARDSNet table; with a high shunt FiO2 alone helps little and PEEP recruits, watching plateau and MAP.",
      reference: `${ARDSNET}; ${BENATAR}`,
    },
  ],
  LOW_MAP: [
    {
      id: "LOW_MAP_VENTILATOR",
      es: "Descarta neumotórax a tensión y auto-PEEP; si la presión media de la vía aérea es alta, reduce PEEP o tiempo inspiratorio si la oxigenación lo permite.",
      en: "Rule out tension pneumothorax and auto-PEEP; if mean airway pressure is high, reduce PEEP or inspiratory time if oxygenation allows.",
      reference: PINSKY,
    },
    {
      id: "LOW_MAP_TARGET",
      es: "La meta habitual es una PAM de al menos 65 mmHg; la volemia y los vasopresores quedan fuera del simulador y son decisión del equipo tratante.",
      en: "The usual target is a MAP of at least 65 mmHg; fluids and vasopressors are outside the simulator and a decision of the treating team.",
      reference: EVANS,
    },
  ],
  TACHYCARDIA: [
    {
      id: "TACHYCARDIA_CAUSE",
      es: "La taquicardia suele acompañar a la hipoxemia, la hipercapnia o la hipotensión: corrige la causa ventilatoria antes que la frecuencia.",
      en: "Tachycardia usually accompanies hypoxemia, hypercapnia or hypotension: correct the ventilatory cause rather than the rate.",
      reference: PINSKY,
    },
  ],
  BRADYCARDIA: [
    {
      id: "BRADYCARDIA_HYPOXEMIA",
      es: "Bradicardia con hipoxemia grave anuncia un paro: oxígeno al 100 %, verifica la vía aérea con DOPES y recluta si el shunt es alto.",
      en: "Bradycardia with severe hypoxemia heralds arrest: 100 % oxygen, check the airway with DOPES and recruit if the shunt is high.",
      reference: `${AHA}; ${HESS}`,
    },
  ],
  CARDIAC_ARREST: [
    {
      id: "CARDIAC_ARREST_RESUSCITATION",
      es: "Paro cardíaco: en la práctica real se inicia la reanimación según el protocolo institucional; el simulador no modela la reanimación.",
      en: "Cardiac arrest: in real practice resuscitation starts per the institutional protocol; the simulator does not model resuscitation.",
      reference: AHA,
    },
  ],
};

/** Real ventilator alarm codes that share the engine rules */
const ALIASES: Readonly<Record<string, string>> = {
  HIGH_VOLUME: "HIGH_TIDAL_VOLUME",
  LOW_VOLUME: "LOW_TIDAL_VOLUME",
  LOW_PRESSURE: "DISCONNECTION",
};

export function stabilizationRulesFor(alarmCode: string, context: AlarmRuleContext, language: StabilizationLanguage = "es"): StabilizationRule[] {
  const code: string = ALIASES[alarmCode] ?? alarmCode;
  const specific: readonly RuleText[] = RULES[code] ?? [];
  const applicable: RuleText[] = specific.filter((rule: RuleText): boolean => rule.when === undefined || rule.when(context));

  return [...applicable, DOPES].map((rule: RuleText): StabilizationRule => ({ id: rule.id, text: rule[language], reference: rule.reference }));
}

/** Plain-text fallback answer when no AI provider answers */
export function stabilizationRulesText(rules: readonly StabilizationRule[]): string {
  return rules.map((rule: StabilizationRule, index: number): string => `${index + 1}. ${rule.text} (${rule.reference})`).join("\n");
}
