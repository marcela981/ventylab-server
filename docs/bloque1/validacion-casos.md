<!--
 * Funcionalidad: Validación clínica de los casos de julio
 * Descripción: Lista, para el colaborador médico, cada valor de los tres casos clínicos de julio sembrados al arrancar el servidor (neumonía grave, EPOC descompensado y SDRA por sepsis) que necesita validación clínica, con su origen (julio o propuesto), unidad y comentario, y la tabla de mecánica del paciente propio
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
-->

# Validación clínica de los casos de julio

Los tres casos del simulador de paciente de julio entran al catálogo como **publicados** y con **`validatedByExpert = false`**. El servidor los inserta al arrancar solo si no existen y nunca los modifica después.

- Datos: `src/features/clinical-cases/infrastructure/persistence/seed/july-clinical-cases.data.ts`.
- Fuente de julio: `_legacy-web-jul/src/features/simulador/simuladorPaciente/casosClinicos/datos/patientSimulatedData.js`.
- En el código, cada valor propuesto lleva el comentario `pendiente validación clínica`.

**Cómo leer las tablas**

- **julio**: el valor viene tal cual del caso de julio. Se revisa si es coherente, pero no se inventó.
- **julio (derivado)**: se calculó a partir de valores de julio, sin supuestos nuevos.
- **propuesto**: julio no lo tenía. Es la propuesta del Anexo B de `DISENO_BLOQUE1.md` o un parámetro del modelo. **Es lo que más necesita validación.**

Si un valor cambia, hay que editar el caso desde el editor (si aún no tiene sesiones) o duplicarlo. El sembrador no vuelve a escribir un caso que ya existe.

## Caso 1: Neumonía grave con hipoxemia (`july-neumonia-grave`)

Hombre de 60 años, 70 kg, 175 cm. Dificultad INTERMEDIATE, patología NEUMONIA.

| Valor | Dato | Origen | Unidad | Comentario |
|---|---|---|---|---|
| Edad, sexo, peso, estatura | 60, M, 70, 175 | julio | años, —, kg, cm | |
| pH / PaO₂ / PaCO₂ / HCO₃ | 7.45 / 52 / 35 / 24 | julio | —, mmHg, mmHg, mmol/L | Gasometría tomada con FiO₂ 0.40. PaO₂ y PaCO₂ son el estado inicial del motor. |
| Hemoglobina | 13.5 | julio | g/dL | Del hemograma de julio |
| Modo, Vt, FR, FiO₂, PEEP | VCV, 420, 20, 1.0, 8 | julio | —, mL, rpm, fracción, cmH₂O | FiO₂ 100 % pasada a fracción |
| Tiempo inspiratorio | 1.0 | julio (derivado) | s | I:E 1:2 con FR 20 |
| Trigger | presión, 2 | julio | cmH₂O | Julio: −2 cmH₂O |
| Signos vitales (FC/FR/SpO₂/T/PAS/PAD/Glasgow) | 105/24/84/39.1/150/90/15 | julio | lpm, rpm, %, °C, mmHg, mmHg, — | Solo se muestran |
| PAM basal | 110 | julio (derivado) | mmHg | PAD + (PAS − PAD)/3 |
| Compliance | 35 | propuesto | mL/cmH₂O | Anexo B |
| Resistencia | 10 | propuesto | cmH₂O/L/s | Anexo B |
| Espacio muerto | 170 | propuesto | mL | |
| VCO₂ | 240 | propuesto | mL/min | Elevada por la fiebre |
| Diferencia arteriovenosa de O₂ | 5 | propuesto | mL/dL | Normal |
| Shunt basal | 0.25 | propuesto | fracción | PaO₂/FiO₂ 130 |
| Curva de reclutamiento (PEEP → shunt) | 5 → 0.25, 10 → 0.20, 15 → 0.17 | propuesto | cmH₂O → fracción | Pulmón parcialmente reclutable |
| Esfuerzo del paciente | 0, 0, 0.35 | propuesto | cmH₂O, rpm, Ti/Ttot | Paciente sedado |
| Umbral de Paw y caída de PAM | 15, 1 | propuesto | cmH₂O, mmHg/cmH₂O | Parámetros del modelo hemodinámico |
| Constantes de tiempo PaCO₂ / O₂ | 4, 150 | propuesto | min, s | |
| Deterioro | 0 | propuesto | — | Escenario estable |
| Patrón de flujo, pausa inspiratoria | cuadrado, 0 | propuesto | —, s | |
| Objetivo SpO₂ / PaCO₂ / pH | 92–96 / 35–45 / 7.35–7.45 | propuesto | %, mmHg, — | |
| Presión meseta máx., distensión máx., Vt/kg PBW, auto-PEEP máx. | 30, 15, 6–8, 5 | propuesto | cmH₂O, cmH₂O, mL/kg, cmH₂O | |
| Rúbrica | La de los casos del motor | propuesto | — | Aprobado ≥ 70; objetivos 40, estabilización 20, tiempo en rango 40 |
| Resumen y objetivo educativo | Textos nuevos | propuesto | — | Julio no los tenía |

## Caso 2: EPOC descompensado (`july-epoc-descompensado`)

Mujer de 68 años, 65 kg, 160 cm. Dificultad INTERMEDIATE, patología EPOC.

| Valor | Dato | Origen | Unidad | Comentario |
|---|---|---|---|---|
| Edad, sexo, peso, estatura | 68, F, 65, 160 | julio | años, —, kg, cm | |
| pH / PaO₂ / PaCO₂ / HCO₃ | 7.25 / 58 / 75 / 32 | julio | —, mmHg, mmHg, mmol/L | Gasometría con FiO₂ 0.35 |
| Hemoglobina | 16.8 | julio | g/dL | Policitemia secundaria |
| Modo, Vt, FR, FiO₂, PEEP | VCV, **480**, 12, 0.35, 5 | julio | —, mL, rpm, fracción, cmH₂O | **Vt 480 se dejó como en julio.** Con 160 cm el peso predicho es 52.4 kg, así que son 9.2 mL/kg (por encima de 6–8). Revisar si se conserva como error didáctico. |
| Tiempo inspiratorio | 1.0 | julio (derivado) | s | I:E 1:4 con FR 12 |
| Trigger | presión, 1 | julio | cmH₂O | Julio: −1 cmH₂O |
| Signos vitales (FC/FR/SpO₂/T/PAS/PAD/Glasgow) | 95/28/88/37.5/135/85/14 | julio | lpm, rpm, %, °C, mmHg, mmHg, — | Solo se muestran |
| PAM basal | 101.7 | julio (derivado) | mmHg | PAD + (PAS − PAD)/3 |
| Compliance | 71 | propuesto | mL/cmH₂O | Anexo B |
| Resistencia | 20 | propuesto | cmH₂O/L/s | Anexo B |
| Espacio muerto | 220 | propuesto | mL | Alteración V/Q |
| VCO₂ | 220 | propuesto | mL/min | |
| Diferencia arteriovenosa de O₂ | 5 | propuesto | mL/dL | |
| Shunt basal y curva de reclutamiento | 0.10, sin reclutamiento | propuesto | fracción | La PEEP no recluta en EPOC |
| Esfuerzo del paciente | 0, 0, 0.35 | propuesto | cmH₂O, rpm, Ti/Ttot | Paciente sedado |
| Umbral de Paw y caída de PAM | 12, 2 | propuesto | cmH₂O, mmHg/cmH₂O | Hiperinflación |
| Constantes de tiempo PaCO₂ / O₂ | 8, 300 | propuesto | min, s | |
| Deterioro | 0 | propuesto | — | Escenario estable |
| Patrón de flujo, pausa inspiratoria | cuadrado, 0 | propuesto | —, s | |
| Objetivo SpO₂ / PaCO₂ / pH | 88–92 / 50–65 / 7.30–7.45 | propuesto | %, mmHg, — | Hipercapnia crónica |
| Presión meseta máx., distensión máx., Vt/kg PBW, auto-PEEP máx. | 30, 15, 6–8, 5 | propuesto | cmH₂O, cmH₂O, mL/kg, cmH₂O | |
| Rúbrica | La de los casos del motor | propuesto | — | |
| Resumen y objetivo educativo | Textos nuevos | propuesto | — | Julio no los tenía |

## Caso 3: SDRA por sepsis (`july-sdra-sepsis`)

Hombre de 55 años, 72 kg, 173 cm. Dificultad ADVANCED, patología SDRA.

| Valor | Dato | Origen | Unidad | Comentario |
|---|---|---|---|---|
| Edad, sexo, peso, estatura | 55, M, 72, 173 | julio | años, —, kg, cm | |
| pH / PaO₂ / PaCO₂ / HCO₃ | 7.30 / 63 / 45 / 20 | julio | —, mmHg, mmHg, mmol/L | Gasometría con FiO₂ 0.80. La descripción de julio dice PaO₂/FiO₂ 140, pero la gasometría da 79. |
| Hemoglobina | 9.8 | julio | g/dL | |
| Modo, Vt, FR, FiO₂, PEEP | VCV, 420, 22, 0.9, 11 | julio | —, mL, rpm, fracción, cmH₂O | |
| Tiempo inspiratorio | 0.91 | julio (derivado) | s | I:E 1:2 con FR 22 |
| Trigger | presión, 1 | julio | cmH₂O | Julio: −1 cmH₂O |
| Signos vitales (FC/FR/SpO₂/T/PAS/PAD/Glasgow) | 128/32/89/38.8/85/45/12 | julio | lpm, rpm, %, °C, mmHg, mmHg, — | Solo se muestran |
| PAM basal | 58.3 | julio (derivado) | mmHg | Shock séptico; está por debajo de la meta de 65 |
| Compliance | 20 | propuesto | mL/cmH₂O | El Anexo B propone 15–25; se tomó el punto medio |
| Resistencia | 12 | propuesto | cmH₂O/L/s | Anexo B |
| Espacio muerto | 200 | propuesto | mL | |
| VCO₂ | 280 | propuesto | mL/min | Sepsis con fiebre |
| Diferencia arteriovenosa de O₂ | 5 | propuesto | mL/dL | |
| Shunt basal | 0.40 | propuesto | fracción | PaO₂/FiO₂ 79 |
| Curva de reclutamiento (PEEP → shunt) | 5 → 0.40, 10 → 0.32, 15 → 0.26 | propuesto | cmH₂O → fracción | |
| Esfuerzo del paciente | 0, 0, 0.35 | propuesto | cmH₂O, rpm, Ti/Ttot | Paciente sedado |
| Umbral de Paw y caída de PAM | 12, 1.5 | propuesto | cmH₂O, mmHg/cmH₂O | |
| Constantes de tiempo PaCO₂ / O₂ | 4, 180 | propuesto | min, s | |
| Deterioro | 0.01, 0.2, 0.1 | propuesto | /min, fracción, fracción | Progresión lenta si no se corrige |
| Patrón de flujo, pausa inspiratoria | cuadrado, 0 | propuesto | —, s | |
| Objetivo SpO₂ / PaCO₂ / pH | 88–95 / 35–60 / 7.30–7.45 | propuesto | %, mmHg, — | Metas de ARDSNet |
| Presión meseta máx., distensión máx., Vt/kg PBW, auto-PEEP máx. | 30, 15, 4–8, 5 | propuesto | cmH₂O, cmH₂O, mL/kg, cmH₂O | |
| Rúbrica | La de los casos del motor | propuesto | — | |
| Resumen y objetivo educativo | Textos nuevos | propuesto | — | Julio no los tenía |

## Mecánica del paciente propio ("Simular paciente")

El formulario no crea un caso nuevo: parte de un caso base publicado y le aplica estos ajustes. La compliance y la resistencia por condición son los valores de julio **tal cual**. Julio los pensó para un paciente sin intubar; el Anexo A pide recalibrarlos para un paciente intubado. Por ejemplo, la resistencia "sana" de 3 cmH₂O/L/s no incluye el tubo.

| Condición | Caso base | Compliance (mL/cmH₂O) | Resistencia (cmH₂O/L/s) |
|---|---|---|---|
| Sano | `engine-normal-lung` | 75 | 3 |
| Neuromuscular | `engine-normal-lung` | 60 | 3 |
| Postquirúrgico | `engine-normal-lung` | 50 | 5 |
| SDRA leve / moderado / severo | `july-sdra-sepsis` | 40 / 25 / 15 | 6 / 8 / 10 |
| Edema pulmonar | `july-sdra-sepsis` | 30 | 6 |
| Neumotórax | `july-sdra-sepsis` | 20 | 5 |
| EPOC leve / moderado / severo | `july-epoc-descompensado` | 75 | 8 / 12 / 18 |
| Asma leve / moderada / severa | `engine-asthma-crisis` | 75 | 10 / 15 / 25 |
| Neumonía | `july-neumonia-grave` | 35 | 7 |
| Hipoventilación por obesidad | `engine-ards-obese` | 40 | 3 |

**Ajustes, como en julio:**
- Compliance: −0.5 por cada año sobre 60, y −1 % por cada punto de IMC sobre 30. Nunca baja de 15.
- La FR del formulario pasa a ser la FR inicial del ventilador (5–40).
- La SpO₂ da la PaO₂ inicial con la inversa de la ecuación de Severinghaus.
- PAS y PAD dan la PAM basal (50–120).
- La dificultad, la FC, la temperatura, el Glasgow, el patrón respiratorio, el diagnóstico, las alergias y los antecedentes solo se muestran.

Versión del mapeo: 1. Las sesiones guardan los ajustes ya resueltos, así que un cambio de esta tabla no altera las sesiones pasadas.
