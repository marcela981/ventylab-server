#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
add_workshops.py
================
Agrega secciones de tipo 'exercise' y 'case_study' a todos los archivos de
lecciones de mecanica/ y ventylab/ que no las tengan.

- Inserta las secciones ANTES del 'summary' final.
- Renumera los order de todas las secciones.
- No toca el quiz raíz ni la estructura existente.
- Si el archivo ya tiene secciones de tipo exercise/case_study, las omite.
"""

import json
import os

BASE = "C:/Marcela/TESIS/ventilab-web/src/features/ensenanza/shared/data/lessons"

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def insert_before_summary(sections, new_secs):
    idx = next((i for i, s in enumerate(sections) if s.get("type") == "summary"), len(sections))
    for ns in reversed(new_secs):
        sections.insert(idx, ns)
    for i, s in enumerate(sections):
        s["order"] = i + 1
    return sections

def already_has(sections, stype):
    return any(s.get("type") == stype for s in sections)

def update_file(filepath, new_sections):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    existing = data.get("sections", [])
    to_add = [ns for ns in new_sections if not already_has(existing, ns["type"])]
    if not to_add:
        print(f"  SKIP  {os.path.basename(filepath)} -- ya tiene las secciones, sin cambios")
        return
    data["sections"] = insert_before_summary(existing, to_add)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    types_added = [s["type"] for s in to_add]
    print(f"  OK  {os.path.basename(filepath)} -- agregado: {types_added}")

# ─── SECCIONES POR ARCHIVO ───────────────────────────────────────────────────

SECTIONS_MAP = {

# ══════════════════════════════════════════════════════════════════════════════
# MECANICA — NIVEL 1: PRINCIPIANTE
# ══════════════════════════════════════════════════════════════════════════════

os.path.join(BASE, "mecanica/level01-principiante/module-01-inversion-fisiologica.json"): [
  {
    "id": "m1-exercise",
    "type": "exercise",
    "title": "Taller práctico: Inversión fisiológica",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Inversión fisiológica

> Aplica lo aprendido. Este taller no bloquea tu avance; genera un puntaje de participación que queda en tu registro del módulo.

---

### Actividad 1 — Tabla comparativa

Completa mentalmente (o en papel) la siguiente tabla antes de leer las respuestas:

| Parámetro | Respiración espontánea | Ventilación mecánica |
|---|---|---|
| Presión pleural en inspiración | ¿Negativa o positiva? | ¿Negativa o positiva? |
| Motor del movimiento de aire | ¿Diafragma o ventilador? | ¿Diafragma o ventilador? |
| Gradiente de presión | ¿Interior → exterior o exterior → interior? | ¿Interior → exterior o exterior → interior? |
| Efecto sobre retorno venoso | ¿Lo favorece o lo reduce? | ¿Lo favorece o lo reduce? |

**Respuestas:**
- Respiración espontánea: negativa / diafragma / exterior→interior / lo favorece (presión intratorácica ↓).
- Ventilación mecánica: positiva / ventilador / ventilador→pulmón / puede reducirlo (comprime grandes vasos).

---

### Actividad 2 — Preguntas de razonamiento

1. ¿Por qué la presión positiva puede reducir el gasto cardíaco? Explica el mecanismo en 2–3 oraciones.

   *Guía:* La presión intratorácica positiva comprime las venas cavas y reduce la precarga del ventrículo derecho. Además, aumenta la postcarga del VD al elevar la presión vascular pulmonar. El resultado neto puede ser caída del gasto cardíaco, especialmente en pacientes hipovolémicos.

2. El "pulmón de acero" usaba presión negativa. ¿En qué escenario actual tiene sentido retornar a ese principio?

   *Guía:* La ventilación con presión negativa (cuiraza) se investiga en pacientes con falla respiratoria crónica o en soporte extrahospitalario donde se busca preservar la mecánica diafragmática y minimizar los efectos hemodinámicos adversos.

---

### Actividad 3 — Identifica el error

Lee y detecta el error en este enunciado:
> *"Durante la ventilación mecánica estándar, el diafragma genera la presión negativa que succiona el gas del ventilador hacia los pulmones."*

**Error:** En ventilación controlada de presión positiva, el ventilador genera presión positiva en la vía aérea que *empuja* el gas hacia los pulmones; el diafragma puede estar pasivo o activo según el modo, pero no es el motor principal.

---

### ¿Cómo se califica?

- Actividad 1 completa → 30 pts
- Actividades 2 y 3 reflexionadas → 70 pts
- Puntaje total: **100 pts** (informativo, no bloquea avance)
"""}
  }
],

os.path.join(BASE, "mecanica/level01-principiante/module-02-ecuacion-movimiento.json"): [
  {
    "id": "m2-exercise",
    "type": "exercise",
    "title": "Taller práctico: Ecuación del movimiento",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: La ecuación del movimiento en la práctica

> Este taller es de práctica reflexiva. No bloquea tu avance; el puntaje queda registrado en tu progreso.

---

### Recordatorio de la ecuación

**P_total = (Vt / C) + (R × V̇) + PEEP**

- Vt = volumen corriente; C = compliance; R = resistencia; V̇ = flujo

---

### Actividad 1 — Cálculo guiado

Un paciente ventilado tiene los siguientes datos:
- Vt = 500 mL = 0,5 L
- Compliance estática (Cst) = 50 mL/cmH₂O = 0,05 L/cmH₂O
- Resistencia (R) = 10 cmH₂O/L/s
- Flujo inspiratorio (V̇) = 0,5 L/s
- PEEP = 5 cmH₂O

**Calcula la presión pico estimada:**
- P_elástica = 0,5 / 0,05 = **10 cmH₂O**
- P_resistiva = 10 × 0,5 = **5 cmH₂O**
- P_total = 10 + 5 + 5 = **20 cmH₂O** ✓ (dentro de rango seguro)

---

### Actividad 2 — Diagnóstico diferencial

Dado el siguiente escenario, ¿cuál es la causa más probable del aumento de presión?

**Escenario A:** Presión pico ↑, presión meseta normal → \_\_\_
**Escenario B:** Presión pico ↑, presión meseta ↑ → \_\_\_

*Respuestas:*
- A: Resistencia aumentada (broncoespasmo, secreciones, sonda doblada)
- B: Compliance reducida (atelectasia, neumotórax, SDRA, edema)

---

### Actividad 3 — Ajuste clínico

Un paciente con SDRA tiene Cst = 25 mL/cmH₂O. Si mantienes Vt = 500 mL:
- P_elástica = 0,5 / 0,025 = **20 cmH₂O** (solo la componente elástica)

¿Qué ajuste harías para mantener P_meseta ≤ 28–30 cmH₂O?

*Respuesta guiada:* Reducir Vt a 6 mL/kg peso predicho (p. ej., 350–420 mL en adulto promedio), aceptar hipercapnia permisiva si es necesario, y revisar PEEP óptimo.

---

### ¿Cómo se califica?

- Actividad 1: cálculo correcto → 40 pts
- Actividades 2–3: razonamiento aplicado → 60 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

os.path.join(BASE, "mecanica/level01-principiante/module-03-variables-fase.json"): [
  {
    "id": "m3-exercise",
    "type": "exercise",
    "title": "Taller práctico: Variables de fase ventilatoria",
    "estimatedTime": 12,
    "content": {"markdown": """## Taller práctico: Identifica las variables de fase

> Practica el reconocimiento de variables de control, límite, ciclo y línea de base. No bloquea avance.

---

### Actividad 1 — Clasificación de variables

Para cada parámetro, indica su rol en el ciclo ventilatorio:

| Parámetro | Variable de control | Variable de límite | Variable de ciclo | Variable de línea de base |
|---|---|---|---|---|
| Volumen corriente fijo (VCV) | ✓ | — | — | — |
| Presión inspiratoria fija (PCV) | — | — | — | — |
| Tiempo inspiratorio como límite | — | — | — | — |
| PEEP | — | — | — | — |
| Flujo pico como límite | — | — | — | — |

*Completa la tabla y luego verifica:*
- PCV: variable de control es la presión
- Tiempo inspiratorio como límite → variable de límite (flow-limited si flujo alcanza máximo)
- PEEP → variable de línea de base
- Flujo pico como límite → variable de límite en VCV

---

### Actividad 2 — Identificación en curvas

Describe lo que observarías en la curva de presión-tiempo para:

1. **Modo VCV con flujo constante:** Curva de presión \_\_\_ (triangular/cuadrada/rampa), flujo \_\_\_ (constante/decelerante), volumen \_\_\_ (lineal/curvo).

2. **Modo PCV:** Curva de presión \_\_\_ (rectangular), flujo \_\_\_ (decelerante), volumen \_\_\_ (curvo ascendente).

---

### Actividad 3 — Caso breve

Un ventilador está programado en VCV con: Vt = 450 mL, Fr = 16/min, Ti = 1 s, flujo pico = 45 L/min, PEEP = 5 cmH₂O.

Identifica:
- Variable de control: **volumen**
- Variable de ciclo: **tiempo** (Ti fijo) o **volumen** (al alcanzar Vt)
- Variable de línea de base: **PEEP = 5 cmH₂O**

---

### ¿Cómo se califica?

- Actividad 1: clasificación completa → 40 pts
- Actividades 2–3 → 60 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

os.path.join(BASE, "mecanica/level01-principiante/module-04-modos-ventilatorios.json"): [
  {
    "id": "m4-exercise",
    "type": "exercise",
    "title": "Taller práctico: Selección del modo ventilatorio",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Selección del modo ventilatorio

> Ejercita tu criterio clínico para elegir el modo más adecuado en cada escenario. No bloquea avance.

---

### Actividad 1 — Mapa de modos

Ubica cada modo en la categoría correcta:

| Modo | Control por volumen | Control por presión | Modo mixto/dual |
|---|---|---|---|
| VCV | ✓ | | |
| PCV | | ✓ | |
| PRVC (Pressure-Regulated Volume Control) | | | ✓ |
| PSV | | ✓ | |
| SIMV | | | ✓ |
| APRV | | ✓ | |

---

### Actividad 2 — Escenarios clínicos

Para cada paciente, justifica brevemente el modo que elegirías:

**Paciente A:** SDRA severo, sedoanalgesia profunda, sin esfuerzo respiratorio espontáneo.
*Sugerencia:* VCV o PCV con parámetros fijos, ventilación protectora (Vt 4–6 mL/kg, P_meseta ≤ 28–30 cmH₂O).

**Paciente B:** Post-extubación fallida, respiración espontánea parcial, hipercapnia moderada.
*Sugerencia:* PSV o BiPAP (VMNI), soporte suficiente para reducir trabajo respiratorio pero preservando drive espontáneo.

**Paciente C:** Neumonía unilateral, paciente cooperador, iniciando destete.
*Sugerencia:* PSV con reducción progresiva del soporte (titulación diaria), o SIMV con PSV de respaldo.

---

### Actividad 3 — Ventaja/desventaja

Completa la tabla:

| Modo | Principal ventaja | Principal riesgo |
|---|---|---|
| VCV | Vt garantizado | Barotrauma si compliance ↓ |
| PCV | Presión limitada | Vt variable si mecánica cambia |
| PSV | Sincronía con el paciente | Apnea si drive respiratorio ↓ |

---

### ¿Cómo se califica?

- Actividad 1: mapa correcto → 30 pts
- Actividad 2: justificación de escenarios → 50 pts
- Actividad 3: tabla ventaja/riesgo → 20 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

os.path.join(BASE, "mecanica/level01-principiante/module-05-monitorizacion-grafica.json"): [
  {
    "id": "m5-exercise",
    "type": "exercise",
    "title": "Taller práctico: Interpretación de curvas ventilatorias",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Interpretación de curvas ventilatorias

> Entrena tu ojo clínico para leer gráficas P-V-F. Este taller es de práctica; no bloquea avance.

---

### Actividad 1 — Identifica la curva

Para cada descripción, indica qué tipo de curva es (Presión / Volumen / Flujo) y el modo ventilatorio más probable:

1. Curva cuadrada (plataforma) en inspiración → ¿P o V o F? ¿VCV o PCV?
   *Respuesta:* Curva de **presión** cuadrada → **PCV**

2. Curva de flujo constante (rectangular) en inspiración → ¿qué modo?
   *Respuesta:* Flujo constante → **VCV** con patrón de flujo cuadrado

3. Curva de volumen con forma de "S" suave en inspiración → ¿modo?
   *Respuesta:* **PCV** (el flujo es decelerante → el volumen sube con curva suave)

---

### Actividad 2 — Detecta la anomalía

Describe qué anomalía esperarías ver en la gráfica de presión-tiempo en cada situación:

| Situación clínica | Cambio esperado en la curva |
|---|---|
| Broncoespasmo súbito | Pico de presión ↑, presión meseta sin cambio (↑ R) |
| Condensación bilateral (↓ Cst) | Presión meseta ↑, pico también ↑ |
| Asincronía por disparo doble | Dos picos de volumen en un mismo ciclo |
| Auto-PEEP | La curva de flujo espiratorio no regresa a cero antes del siguiente ciclo |

---

### Actividad 3 — Cálculo desde la gráfica

Con los siguientes datos leídos de la pantalla del ventilador:
- Presión pico (Ppico) = 30 cmH₂O
- Presión meseta (Pmeseta) = 22 cmH₂O
- PEEP = 5 cmH₂O
- Vt = 500 mL = 0,5 L
- Flujo inspiratorio al momento de la pausa = 0 L/s

Calcula:
- **Resistencia:** R = (Ppico − Pmeseta) / V̇ → necesitas el flujo *antes* de la pausa, no en pausa. Si flujo pico = 60 L/min = 1 L/s → R = (30−22)/1 = **8 cmH₂O/L/s**
- **Compliance estática:** Cst = Vt / (Pmeseta − PEEP) = 0,5 / (22−5) = 0,5 / 17 = **29,4 mL/cmH₂O**
- **Driving pressure:** ΔP = Pmeseta − PEEP = 22 − 5 = **17 cmH₂O** (rango aceptable <15 idealmente)

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 40 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

os.path.join(BASE, "mecanica/level01-principiante/module-06-efectos-sistemicos.json"): [
  {
    "id": "m6-exercise",
    "type": "exercise",
    "title": "Taller práctico: Efectos sistémicos de la ventilación mecánica",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Efectos sistémicos de la ventilación mecánica

> Conecta los efectos pulmonares con las repercusiones sistémicas. No bloquea avance.

---

### Actividad 1 — Sistema por sistema

Para cada sistema, enumera el efecto más relevante de la presión positiva intratorácica y una medida de monitorización:

| Sistema | Efecto principal | Monitorización clave |
|---|---|---|
| Cardiovascular | Reducción del retorno venoso → ↓ gasto cardíaco | PAM, FC, PVC, PICCO/Swan-Ganz |
| Renal | Oliguria por ↓ flujo renal y activación SRAA | Diuresis horaria, creatinina |
| Hepático/esplácnico | Congestión venosa hepática por ↑ PVC | Bilirrubina, función hepática |
| Cerebral | ↑ PIC si PEEP alta en TEC | PIC, pupilometría, escala Glasgow |
| Pulmonar propio | Lesión por volutrauma/barotrauma | Presiones, Vt, Driving pressure |

---

### Actividad 2 — Caso clínico breve

**Escenario:** Paciente con SDRA severo, PEEP = 16 cmH₂O, PAM = 58 mmHg, FC = 115 lpm, diuresis = 15 mL/h.

Preguntas:
1. ¿El cuadro es consistente con efecto sistémico de la PEEP alta? ¿Por qué?
   *Sí — la PEEP alta reduce el retorno venoso, generando hipotensión y oliguria.*

2. ¿Qué ajustes inmediatos considerarías?
   *Opciones: expansión de volumen cuidadosa, vasopresores (noradrenalina), y evaluar si se puede reducir PEEP sin comprometer oxigenación.*

---

### Actividad 3 — Interacción corazón-pulmón

Completa las flechas:

PEEP ↑ → Presión intratorácica ↑ → Retorno venoso \_\_\_ → Precarga VD \_\_\_ → GC \_\_\_ → PAM \_\_\_

*Respuesta:* ↓ / ↓ / ↓ / ↓

¿Qué mecanismo compensador puede amortiguar este efecto?
*El reflejo barorreflejos y la vasoconstricción periférica compensan parcialmente. La volemia adecuada es el factor más protector.*

---

### ¿Cómo se califica?

- Actividad 1 → 35 pts | Actividad 2 → 40 pts | Actividad 3 → 25 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

# ══════════════════════════════════════════════════════════════════════════════
# MECANICA — NIVEL 2: INTERMEDIO
# ══════════════════════════════════════════════════════════════════════════════

os.path.join(BASE, "mecanica/level02-intermedio/module-01-Ventilacion-vcv-vs-pcv.json"): [
  {
    "id": "m-vcv-pcv-exercise",
    "type": "exercise",
    "title": "Taller práctico: VCV vs. PCV — elige el modo correcto",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: VCV vs. PCV en el paciente crítico

> Aplica los criterios de selección modal en escenarios reales. No bloquea avance; genera puntaje de participación.

---

### Actividad 1 — Ventajas y limitaciones

Completa la tabla con una ventaja y una limitación de cada modo:

| Modo | Ventaja principal | Limitación principal |
|---|---|---|
| VCV (Control de Volumen) | Vt garantizado en todo momento | Presión variable → riesgo de barotrauma si compliance ↓ |
| PCV (Control de Presión) | Presión de vía aérea limitada | Vt variable → riesgo de hipercapnia o volutrauma silente |

---

### Actividad 2 — Escenarios de selección

Elige el modo más adecuado y justifica en una oración:

**A.** Paciente con SDRA moderado, Cst = 28 mL/cmH₂O, sin esfuerzo espontáneo.
*VCV* — permite calcular driving pressure con precisión y aplicar ventilación protectora con Vt fijo.

**B.** Paciente postoperatorio de cirugía torácica, mecánica variable, inicio de destete.
*PCV o PRVC* — la presión limitada protege el parénquima con mecánica inestable; PRVC ajusta automáticamente.

**C.** Paciente obeso (IMC 45), cirugía abdominal laparoscópica, posición Trendelenburg.
*VCV* — garantiza Vt a pesar de la gran carga sobre el tórax; monitorizar presión de cerca.

---

### Actividad 3 — Cálculo comparativo

Dado: Vt objetivo = 480 mL, Cst = 35 mL/cmH₂O, R = 12 cmH₂O/L/s, flujo = 0,8 L/s, PEEP = 6.

- **En VCV:** Ppico = Vt/Cst + R×flujo + PEEP = 480/35 + 12×0,8 + 6 = 13,7 + 9,6 + 6 = **~29 cmH₂O**
- **En PCV:** fijarías P_ins = Pmeseta objetivo (≈22 cmH₂O). Si Cst cambia a 25 mL/cmH₂O → Vt = (Pins − PEEP) × Cst = (22−6)×25 = **400 mL** → ¡Vt cae 80 mL sin alarma de volumen!

Conclusión: En VCV el Vt es estable; en PCV el Vt cae si la mecánica empeora.

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 45 pts | Actividad 3 → 30 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-vcv-pcv-case",
    "type": "case_study",
    "title": "Caso clínico: Selección modal en SDRA leve",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Selección modal en SDRA leve

---

### Presentación

**Paciente:** Mujer, 58 años, 60 kg de peso predicho.
**Diagnóstico:** SDRA leve (P/F = 240) secundario a neumonía bilateral por influenza.
**Estado:** Sedada y analgesiada, sin esfuerzo respiratorio espontáneo.
**Mecánica actual:** Cst = 38 mL/cmH₂O, R = 9 cmH₂O/L/s.
**Parámetros previos:** VCV, Vt = 500 mL, Fr = 18/min, PEEP = 8 cmH₂O, FiO₂ = 0,50.
**Gasometría:** pH 7,36, PaCO₂ 42 mmHg, PaO₂ 88 mmHg, SaO₂ 96%.
**Presiones:** Ppico = 26 cmH₂O, Pmeseta = 19 cmH₂O.

---

### Análisis guiado

**1. ¿Está dentro de ventilación protectora?**
- Vt/kg peso predicho = 500/60 = 8,3 mL/kg → **por encima del límite** (objetivo ≤6 mL/kg en SDRA).
- Driving pressure = Pmeseta − PEEP = 19 − 8 = 11 cmH₂O → aceptable (< 15 cmH₂O).
- Pmeseta = 19 cmH₂O → dentro de límite (< 28–30 cmH₂O).

**2. ¿Cambiarías el Vt?**
Sí. Reducir a 6 mL/kg = 360 mL. Aceptar leve hipercapnia permisiva si pH ≥7,25.

**3. ¿VCV o PCV en este caso?**
VCV es apropiado para garantizar el Vt protector fijo. Si se prefiere PCV, calcular P_ins = (Vt_obj/Cst) + PEEP = (0,36/0,038) + 8 ≈ 17,5 cmH₂O → fijar presión ins = 12 cmH₂O (por encima de PEEP).

---

### Decisión y seguimiento

- **Ajuste:** VCV, Vt 360 mL, Fr 20/min (compensar ↓ ventilación), PEEP 8, FiO₂ 0,50.
- **Monitorizar:** Ppico, Pmeseta, driving pressure, gasometría a los 30 min.
- **Meta:** P/F > 200, pH ≥ 7,28, driving pressure < 15 cmH₂O.

---

### Puntos clave

1. En SDRA, el Vt se basa en peso predicho, no en peso actual.
2. La driving pressure (ΔP) es el parámetro con mayor correlación con mortalidad.
3. VCV y PCV pueden usarse; la clave es monitorizar el parámetro no controlado.
"""}
  }
],

os.path.join(BASE, "mecanica/level02-intermedio/module-02-peep-optimizar-oxigenacion.json"): [
  {
    "id": "m-peep-exercise",
    "type": "exercise",
    "title": "Taller práctico: Titulación de PEEP",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Titulación de PEEP y optimización de oxigenación

> Práctica de ajuste de PEEP en distintos escenarios. No bloquea avance.

---

### Actividad 1 — Efectos del PEEP: completa la tabla

| PEEP | Efecto en oxigenación | Efecto hemodinámico | Efecto en compliance |
|---|---|---|---|
| Muy bajo (< 5 cmH₂O) | Atelectasias, ↓ CRF | Mínimo | Puede ser subóptima |
| Óptimo (5–12 cmH₂O) | ↑ CRF, ↑ reclutamiento | Moderado, bien tolerado | Máxima (zona de complianza óptima) |
| Muy alto (> 15 cmH₂O) | Hiperinsuflación de alvéolos sanos | ↓ GC, hipotensión | ↓ (zona de sobredistensión) |

---

### Actividad 2 — Método de titulación

Describe en 3 pasos el método de PEEP escalado (PEEP table ARDSnet):

1. Ajustar FiO₂ y PEEP según tabla (baja FiO₂ → bajo PEEP; alta FiO₂ → alto PEEP).
2. Titular el par FiO₂/PEEP buscando SaO₂ 88–95% con la menor FiO₂ posible.
3. Vigilar hemodinámica y compliance con cada cambio; si la compliance mejora → PEEP reclutante; si empeora → sobredistensión.

---

### Actividad 3 — Caso numérico

Paciente con SDRA severo. Secuencia de titulación:

| PEEP (cmH₂O) | FiO₂ | SaO₂ | PaO₂/FiO₂ | Cst (mL/cmH₂O) | PAM (mmHg) |
|---|---|---|---|---|---|
| 8 | 0,70 | 88% | 126 | 28 | 72 |
| 10 | 0,65 | 91% | 168 | 34 | 70 |
| 12 | 0,60 | 93% | 186 | 37 | 68 |
| 14 | 0,55 | 94% | 196 | 35 | 62 |
| 16 | 0,50 | 94% | 200 | 29 | 55 |

**Pregunta:** ¿Qué PEEP es el óptimo y por qué?

*Respuesta:* PEEP 12 cmH₂O. Tiene la mayor compliance (37 mL/cmH₂O = punto inflexión), buena oxigenación (P/F 186) y hemodinámica aceptable (PAM 68). Con PEEP 14–16 la compliance cae (sobredistensión) y la PAM baja significativamente.

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 30 pts | Actividad 3 → 45 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-peep-case",
    "type": "case_study",
    "title": "Caso clínico: Hipoxemia refractaria y ajuste de PEEP",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Hipoxemia refractaria — optimización de PEEP

---

### Presentación

**Paciente:** Hombre, 45 años, 70 kg.
**Diagnóstico:** SDRA moderado post-sepsis abdominal (peritonitis fecaloidea).
**Estado:** Sedado y bloqueado neuromuscularmente (fase aguda).
**Parámetros iniciales:** VCV, Vt 420 mL (6 mL/kg), Fr 22/min, PEEP 8 cmH₂O, FiO₂ 0,80.
**Gasometría:** pH 7,31, PaCO₂ 48 mmHg, PaO₂ 62 mmHg → P/F = 77 → SDRA severo.

---

### Análisis guiado

**1. ¿La situación cumple criterios para estrategias de rescate?**
P/F < 100 con PEEP ≥ 5 → considerar: PEEP alto con maniobra de reclutamiento, decúbito prono, bloqueo neuromuscular (ya activo).

**2. Maniobra de reclutamiento + PEEP escalado**
Se realizó maniobra de reclutamiento (CPAP 40 cmH₂O × 40 s) y se escaló PEEP:
- PEEP 12 → Cst 28, P/F 104
- PEEP 14 → Cst 32, P/F 142
- PEEP 16 → Cst 33, P/F 158, PAM 64
- PEEP 18 → Cst 29, P/F 160, PAM 58 ← compliance cae

*PEEP óptimo seleccionado: 16 cmH₂O (mejor compliance antes del punto de inflexión descendente).*

**3. Decisión sobre decúbito prono**
P/F < 150 con FiO₂ ≥ 0,60 → indicación de decúbito prono ≥ 16 horas. Se inicia posicionamiento.

---

### Resultado y seguimiento

Tras 18 h en decúbito prono + PEEP 16 + FiO₂ 0,60:
- PaO₂ 88 mmHg → P/F = 147 (mejoría relativa pero aún severo).
- FiO₂ reducida a 0,55.
- Se planifica segunda sesión de prono.

---

### Puntos clave

1. El PEEP óptimo es el que maximiza la compliance sin comprometer hemodinámica.
2. La maniobra de reclutamiento tiene sentido solo en SDRA difuso y homogéneo (no en SDRA focal).
3. El decúbito prono es la intervención con mayor evidencia de reducción de mortalidad en SDRA severo.
"""}
  }
],

os.path.join(BASE, "mecanica/level02-intermedio/module-03-soporte-PSV-CPAP.json"): [
  {
    "id": "m-psv-exercise",
    "type": "exercise",
    "title": "Taller práctico: Ajuste del soporte en PSV",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Ajuste del soporte en PSV y CPAP

> Práctica de titulación de soporte ventilatorio espontáneo. No bloquea avance.

---

### Actividad 1 — Parámetros de PSV que debes conocer

Relaciona cada parámetro con su función:

| Parámetro | Función |
|---|---|
| Nivel de soporte (PS) | Determina el volumen corriente asistido |
| Trigger de flujo/presión | Define la sensibilidad del disparo del ventilador |
| Criterio de ciclado (% flujo pico) | Termina la inspiración cuando el flujo cae a ese % |
| Rise time | Controla la velocidad de ascenso de presión |
| PEEP en PSV | Mantiene la CRF y facilita el trigger |

---

### Actividad 2 — Signos de mal ajuste de PSV

Para cada signo clínico/gráfico, identifica el problema:

| Observación | Problema probable |
|---|---|
| Vt > 10 mL/kg | PS demasiado alta → sobresoporte |
| FR > 30/min con Vt < 5 mL/kg | PS insuficiente → subsoporte |
| Doble disparo o forcejeo al final de la inspiración | Criterio de ciclado inadecuado (demasiado bajo → Ti largo) |
| Esfuerzo inefectivo (no dispara) | Trigger demasiado sensible o auto-PEEP no compensado |
| Abdomen en movimiento paradójico | Asincronía grave, PS muy alta o muy baja |

---

### Actividad 3 — Titulación guiada

Paciente iniciando destete: PSV inicial = 18 cmH₂O, Vt = 620 mL, FR = 14/min, RVA (índice) = 48.

Protocolo de reducción:
1. Reducir PS en pasos de 2–4 cmH₂O si: FR < 25/min, Vt > 6 mL/kg, SaO₂ > 95%, sin signos de fatiga.
2. Monitorizar Índice de Respiración Rápida Superficial (IRRS = FR/Vt en litros).
   - IRRS < 105 → tolera reducción.
   - IRRS calculado = 14 / 0,62 = **22,6** → muy bien tolerado.
3. Continuar reducción hasta PS = 5–8 cmH₂O → evaluar SBT (prueba en T o CPAP).

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 40 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-psv-case",
    "type": "case_study",
    "title": "Caso clínico: Destete con PSV",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Paciente en destete — titulación de PSV

---

### Presentación

**Paciente:** Mujer, 62 años, 55 kg, peso predicho 52 kg.
**Diagnóstico:** Neumonía lobar derecha resuelta, ventilada 6 días.
**Estado:** Despierta, cooperadora, sin sedación, temperatura 37,2°C.
**Parámetros actuales:** PSV 14 cmH₂O, PEEP 6 cmH₂O, FiO₂ 0,35.
**Gasometría:** pH 7,40, PaCO₂ 40 mmHg, PaO₂ 88 mmHg (SaO₂ 97%).
**Vt espontáneo:** 420 mL | FR: 18/min | IRRS = 18/0,42 = **42,8** (excelente).

---

### Análisis guiado

**1. ¿Está lista para SBT (prueba de respiración espontánea)?**
Criterios para iniciar SBT:
- ✓ Causa del fallo resuelto (neumonía resuelta)
- ✓ Hemodinámicamente estable (sin vasopresores)
- ✓ Oxigenación adecuada (P/F = 88/0,35 = 251 > 200)
- ✓ Capaz de toser y proteger vía aérea
- ✓ IRRS < 105
→ **Sí, procede el SBT.**

**2. Protocolo de SBT**
Modalidad: T-pieza o CPAP 5 cmH₂O (sin soporte PS), duración 30–120 min.
Criterios de fallo del SBT: FR > 35/min, SaO₂ < 90%, FR/Vt > 105, distrés, diaforesis, cambios hemodinámicos.

**3. Resultado del SBT en este caso**
A los 45 min: FR 20/min, Vt 410 mL, SaO₂ 96%, sin distrés → **SBT exitoso → extubación.**

---

### Seguimiento post-extubación

- Oxigenoterapia con cánula nasal de alto flujo (CNAF) preventiva 30 min.
- Monitorización clínica y SpO₂ continua 6 h.
- Fisioterapia respiratoria para expansión del lóbulo derecho.

---

### Puntos clave

1. El IRRS < 105 es el predictor con mejor sensibilidad/especificidad para éxito de extubación.
2. El SBT en T-pieza o CPAP sin PS es equivalente en evidencia.
3. La CNAF post-extubación reduce el riesgo de re-intubación en pacientes de riesgo.
"""}
  }
],

os.path.join(BASE, "mecanica/level02-intermedio/module-04-duales-simv.json"): [
  {
    "id": "m-duales-exercise",
    "type": "exercise",
    "title": "Taller práctico: Modos duales y SIMV",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Modos duales y SIMV

> Consolida el manejo de modos mixtos. No bloquea avance.

---

### Actividad 1 — Identifica el modo

Para cada descripción clínica/gráfica, escribe el modo que se describe:

1. El ventilador garantiza un Vt mínimo ajustando la presión inspiratoria ciclo a ciclo. Si el paciente respira más, el ventilador no interviene. → **PRVC / Volume Support (modo dual)**

2. El ventilador alterna ciclos mandatorios a frecuencia fija con respiraciones espontáneas del paciente entre ellos. → **SIMV (Synchronized Intermittent Mandatory Ventilation)**

3. El modo responde a la mecánica del paciente latido a latido usando un algoritmo de retroalimentación para ajustar la presión y alcanzar el Vt objetivo. → **PRVC / ASV (Adaptive Support Ventilation)**

---

### Actividad 2 — SIMV: análisis de la estrategia

Ventajas e inconvenientes de SIMV:

| Aspecto | Comentario |
|---|---|
| ¿Facilita el destete? | Controvertido. Estudios muestran que PSV + SBT puede ser más eficiente que SIMV gradual |
| ¿Mantiene el drive respiratorio? | Sí, los ciclos espontáneos preservan el esfuerzo del paciente |
| ¿Riesgo de fatiga? | Si la FR mandatoria es baja y el soporte espontáneo es insuficiente |
| ¿Sincronía? | Mejor que IMV clásico (no sincronizado), pero puede haber asincronías en el ciclo espontáneo |

---

### Actividad 3 — Caso de ajuste

Paciente en SIMV: Fr mandatoria 8/min, PS espontánea 12 cmH₂O, PEEP 6 cmH₂O, FiO₂ 0,35.
- FR total observada: 22/min (8 mandatorias + 14 espontáneas)
- Vt mandatorio: 450 mL | Vt espontáneo promedio: 380 mL
- IRRS (espontáneo): 14/0,38 = **36,8** → bien tolerado

¿Cuál sería el siguiente paso de destete?
*Reducir Fr mandatoria a 6/min y/o reducir PS de 12 a 10 cmH₂O. Monitorizar tolerancia. Meta: Fr mandatoria = 0 + PSV puro, luego SBT.*

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-duales-case",
    "type": "case_study",
    "title": "Caso clínico: Transición a ventilación espontánea",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Transición progresiva con SIMV + PSV

---

### Presentación

**Paciente:** Hombre, 55 años, 75 kg, EPOC de base (FEV1/FVC = 62% previo).
**Diagnóstico:** Exacerbación de EPOC + neumonía. Intubado hace 4 días.
**Estado:** Parcialmente despierto, sigue órdenes simples, sedación ligera (RASS −1).
**Parámetros actuales:** SIMV Fr 12/min, Vt 450 mL, PS 10 cmH₂O, PEEP 6 cmH₂O, FiO₂ 0,40.
**Gasometría:** pH 7,38, PaCO₂ 52 mmHg (hipercapnia crónica compensada), PaO₂ 82 mmHg.
**Nota:** PaCO₂ basal del paciente ~55 mmHg (retenedor crónico).

---

### Análisis guiado

**1. ¿Es adecuada la hipercapnia actual?**
Sí. En EPOC retenedor, la meta de PaCO₂ es el valor basal del paciente (~55 mmHg), no la normalidad. Hiperventilar reduce la bicarbonatura compensatoria y dificulta la extubación.

**2. ¿Cómo afecta el EPOC al destete?**
- Auto-PEEP por atrapamiento aéreo → aumenta el umbral de trigger → asincronías.
- Contramedidas: PEEP extrínseca para compensar auto-PEEP (medir con pausa espiratoria), broncodilatadores, fisioterapia.

**3. Plan de descenso**
Día 1: SIMV 12 → 8, PS 10 mantenida.
Día 2: SIMV 8 → 4 si tolerado (FR total < 28, IRRS espontáneo < 105).
Día 3: SIMV 4 → 0 + PSV puro 10 cmH₂O.
Día 4: SBT si cumple criterios.

---

### Complicación encontrada

Al reducir SIMV a 4, el paciente desarrolla asincronía por auto-PEEP (PEEP intrínseco medido: 8 cmH₂O). Se ajusta PEEP extrínseca a 6 cmH₂O (75% del auto-PEEP medido). Mejora el trigger y la sincronía.

---

### Puntos clave

1. En EPOC, el objetivo gasométrico es el basal, no la normalidad.
2. El auto-PEEP es la causa más frecuente de asincronía en EPOC en destete.
3. La PEEP extrínseca al 70–80% del auto-PEEP reduce el trabajo de trigger sin agravar el atrapamiento.
"""}
  }
],

os.path.join(BASE, "mecanica/level02-intermedio/module-05-graficas-fine-tuning.json"): [
  {
    "id": "m-graficas-exercise",
    "type": "exercise",
    "title": "Taller práctico: Ajuste fino de parámetros por gráficas",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Fine tuning de parámetros a través de gráficas

> Mejora tu lectura de curvas para optimización de parámetros. No bloquea avance.

---

### Actividad 1 — La curva P-V estática (lazo presión-volumen)

Relaciona cada zona del lazo P-V con su interpretación:

| Zona del lazo P-V | Interpretación | Acción recomendada |
|---|---|---|
| Punto de inflexión inferior (LIP) | Umbral de cierre alveolar / zona de colapso | PEEP debe estar por encima del LIP |
| Zona de compliance máxima (pendiente mayor) | Zona de reclutamiento activo sin sobredistensión | Ventilación en esta ventana = ventilación protectora |
| Punto de inflexión superior (UIP) | Inicio de sobredistensión | Presión meseta debe estar por debajo del UIP |

---

### Actividad 2 — Detecta el problema en la gráfica

Describe el hallazgo esperado en la curva de flujo-tiempo para cada situación:

1. **Auto-PEEP presente:** La curva de flujo espiratorio NO regresa a cero antes del siguiente ciclo. El ventilador comienza la inspiración con flujo espiratorio positivo residual.

2. **Trigger insensible:** Hay una pequeña deflexión negativa en la curva de presión ANTES del disparo del ventilador (esfuerzo del paciente no detectado = esfuerzo inefectivo).

3. **Rise time demasiado lento:** La curva de presión asciende lentamente al inicio de la inspiración; el paciente "lucha" contra el ventilador en los primeros 100–200 ms.

---

### Actividad 3 — Ajuste de rise time

Paciente en PCV con los siguientes hallazgos:
- Curva de flujo muestra un pico muy abrupto al inicio de la inspiración (↑↑ flujo inicial).
- El paciente presenta "hambre de aire" (sensación de inspiración incompleta).
- Presión meseta alcanzada muy rápido → riesgo de pico de presión.

**Ajuste:** Aumentar el rise time (tiempo de ascenso de presión de 0 a la presión objetivo). Un rise time más largo suaviza el perfil de flujo y mejora la sincronía. En PSV, el criterio de ciclado también se puede ajustar.

---

### ¿Cómo se califica?

- Actividad 1 → 35 pts | Actividad 2 → 35 pts | Actividad 3 → 30 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-graficas-case",
    "type": "case_study",
    "title": "Caso clínico: Asincronía detectada por gráficas",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Asincronía paciente-ventilador detectada en pantalla

---

### Presentación

**Paciente:** Hombre, 49 años, 68 kg.
**Diagnóstico:** Neumonía grave bilateral, sedado con propofol RASS −2.
**Parámetros:** VCV, Vt 408 mL, Fr 16/min, flujo pico 50 L/min, PEEP 8 cmH₂O, FiO₂ 0,55.
**Alarma activa:** Volumen minuto aumentado (Ve > 12 L/min).
**Observación en pantalla:** Se detectan 28 ciclos/min a pesar de Fr programada = 16/min.

---

### Análisis guiado

**1. ¿Qué está pasando?**
El paciente está disparando ciclos adicionales no programados (12 ciclos espontáneos/min sobre los 16 mandatorios). El trigger está respondiendo a esfuerzos espontáneos del paciente → asincronía de frecuencia.

**2. Lectura de la curva de presión**
En los ciclos espontáneos se observa una pequeña deflexión negativa previa al disparo → el paciente está haciendo esfuerzo. El nivel de sedación puede ser insuficiente, o el drive respiratorio central está muy activo (hipercapnia, hipoxemia, ansiedad).

**3. Ajustes posibles**
- Verificar gasometría: ¿hay hipercapnia o hipoxemia que esté activando el centro respiratorio?
- Revisar nivel de sedación: RASS −2 puede ser insuficiente en la fase aguda de SDRA con esfuerzo activo.
- Considerar modo PSV si el paciente tiene drive activo y la sincronía es el objetivo.
- Si el drive es excesivo y genera P-SILI (lesión por esfuerzo espontáneo), puede valorarse bloqueo neuromuscular transitorio.

---

### Resolución

Gasometría: PaCO₂ 35 mmHg (hipocapnia leve). FiO₂ reducida a 0,45 y ajuste de Vt a 380 mL para elevar PaCO₂ leve y reducir el drive. Se aumenta propofol. A los 30 min: Fr total 20/min, mejor sincronía.

---

### Puntos clave

1. El Ve (volumen minuto) > programado = el paciente está disparando ciclos extras → investigar.
2. La hipocapnia es un potente estímulo para aumentar la FR espontánea.
3. La P-SILI (Patient Self-Inflicted Lung Injury) ocurre cuando el esfuerzo espontáneo excesivo genera grandes variaciones de presión transpulmonar.
"""}
  }
],

os.path.join(BASE, "mecanica/level02-intermedio/module-06-avanzado-evaluacion-destete.json"): [
  {
    "id": "m-destete-exercise",
    "type": "exercise",
    "title": "Taller práctico: Protocolo de evaluación para destete",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Evaluación sistemática para el destete ventilatorio

> Practica la aplicación del protocolo de destete paso a paso. No bloquea avance.

---

### Actividad 1 — Checklist de criterios para iniciar SBT

Marca qué criterios deben cumplirse (✓) antes de intentar la SBT (Spontaneous Breathing Trial):

| Criterio | ¿Obligatorio? | ¿Cómo se evalúa? |
|---|---|---|
| Causa del fallo resuelto o controlada | ✓ Obligatorio | Historia clínica + imagen |
| SaO₂ ≥ 90% con FiO₂ ≤ 0,40 y PEEP ≤ 8 | ✓ Obligatorio | Gasometría o SaO₂ continua |
| Hemodinámicamente estable (sin vasopresores o dosis baja estable) | ✓ Obligatorio | FC, PAM, vasopresores activos |
| Capaz de toser y expectorar | ✓ Importante | Evaluación clínica, test de secreciones |
| Sin sedación profunda (RASS ≥ −1) o capaz de obedecer órdenes simples | ✓ Obligatorio | Escala de sedación |
| Balance hídrico neutro o negativo | ✓ Importante | Balance acumulado últimas 24 h |
| Electrolitos normales (K⁺, P, Mg²⁺) | ✓ Importante | Laboratorios |

---

### Actividad 2 — Criterios de fallo durante la SBT

Identifica qué observación indica fallo de la SBT y justifica brevemente:

1. FR = 38/min a los 15 min del SBT → **Fallo.** Taquipnea > 35/min indica sobrecarga del trabajo respiratorio.
2. SaO₂ 88% (basal era 97%) a los 20 min → **Fallo.** Deterioro significativo de la oxigenación.
3. Diaforesis, uso de músculos accesorios, agitación → **Fallo.** Signos clínicos de distrés respiratorio.
4. IRRS (FR/Vt) = 98 a los 30 min → **Tolerando.** IRRS < 105 es aceptable; observar evolución hasta 120 min.

---

### Actividad 3 — Causa de fallo de extubación

Diferencia los tipos de fallo:

| Tipo | Descripción | Manejo |
|---|---|---|
| Fallo de SBT | No tolera el SBT → ventilación aún necesaria | Retomar soporte, investigar causa |
| Fallo de extubación sin estridor | Insuficiencia resp. post-extubación (carga, secreciones) | CNAF o VMNI |
| Estridor post-extubación | Edema laríngeo / subglótico | Adrenalina nebulizada, corticoides, cánula si progresa |
| Reintubación | Fallo de todas las medidas | Vía aérea segura prioritaria |

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 40 pts | Actividad 3 → 30 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-destete-case",
    "type": "case_study",
    "title": "Caso clínico: Destete fallido — análisis y plan",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Destete fallido — causas y estrategia

---

### Presentación

**Paciente:** Mujer, 71 años, 58 kg, antecedentes de ICC (FE 40%) y EPOC leve.
**Diagnóstico:** Sepsis pulmonar (streptococcus), intubada hace 8 días, en mejoría.
**Estado:** Despierta, RASS 0, T 37,6°C, sin vasopresores.
**Pre-SBT:** FiO₂ 0,35, PEEP 6, PSV 8 cmH₂O. SaO₂ 96%, FR 18/min.
**SBT en T-pieza (30 min):** a los 25 min → FR 36/min, Vt 280 mL, diaforesis, SaO₂ 91% → **SBT fallido.**

---

### Análisis de causas del fallo

**1. ¿Por qué falló el SBT?**
Posibles causas a investigar sistemáticamente:
- **Carga respiratoria:** Secreciones abundantes, broncoespasmo residual, atelectasias basales (ICC + inmovilización).
- **Debilidad muscular:** 8 días de ventilación, probable miopatía del paciente crítico.
- **Fallo cardíaco:** El paso a respiración espontánea aumenta el trabajo cardíaco → descompensación aguda de ICC.
- **Anemia:** Hb 7,2 g/dL → reducción de transporte de O₂.

**2. Evaluación dirigida**
- Rx tórax: infiltrados bilaterales (edema + atelectasias basales) → balance hídrico negativo 500 mL.
- Ecocardiograma: llenado ventricular izquierdo alterado durante el SBT → ↑ presión de enclavamiento.
- Test de cuff-leak: positivo (sin fuga) → riesgo de estridor post-extubación bajo pero edema laríngeo posible.

**3. Plan de acción**
- Diuresis con furosemida + corrección de Hb (transfusión).
- Fisioterapia respiratoria intensiva + broncoscopio para limpiar secreciones.
- Esperar 48 h antes de repetir SBT.
- Al repetir, usar T-pieza con FiO₂ 0,40 y monitorización ECG.

---

### Resultado

48 h después: balance −1,2 L, Hb 9,5 g/dL, Rx mejorada. Nuevo SBT exitoso a los 45 min. Extubación con CNAF preventiva. Alta de UCI a los 2 días.

---

### Puntos clave

1. El fallo de SBT no es un fracaso; es información diagnóstica.
2. La ICC es la causa más frecuente de fallo de extubación en ancianos.
3. La VMNI post-extubación en pacientes con ICC mejora los resultados de extubación.
"""}
  }
],

# ══════════════════════════════════════════════════════════════════════════════
# MECANICA — NIVEL 3: AVANZADO
# ══════════════════════════════════════════════════════════════════════════════

os.path.join(BASE, "mecanica/level03-avanzado/module-01-daño-pulmonar-vili-ventilacion-protectora.json"): [
  {
    "id": "m-vili-exercise",
    "type": "exercise",
    "title": "Taller práctico: Ventilación protectora — cálculo de parámetros",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Ventilación protectora y prevención de VILI

> Calcula parámetros seguros y aplica criterios de VILI. No bloquea avance.

---

### Actividad 1 — Los 5 mecanismos de VILI

Relaciona cada mecanismo con su definición y el parámetro que lo previene:

| Mecanismo VILI | Causa | Parámetro protector |
|---|---|---|
| Volutrauma | Sobredistensión por Vt excesivo | Vt ≤ 6 mL/kg peso predicho |
| Barotrauma | Presiones excesivas → ruptura | P_meseta < 28–30 cmH₂O |
| Atelectrauma | Apertura/cierre cíclico de alvéolos | PEEP adecuado (> LIP) |
| Biotrauma | Mediadores inflamatorios sistémicos | Todas las medidas anteriores |
| Stress relajación | Tensión en tejido pulmonar no homogéneo | Driving pressure < 15 cmH₂O |

---

### Actividad 2 — Cálculo de parámetros protectores

Paciente con SDRA severo: Mujer, 55 años, talla 165 cm.

**Peso predicho (mujer):** = 45,5 + 0,91 × (165 − 152,4) = 45,5 + 0,91 × 12,6 = **56,95 kg ≈ 57 kg**

| Parámetro | Cálculo | Valor objetivo |
|---|---|---|
| Vt protector | 6 mL/kg × 57 kg | 342 mL (usar 340–360 mL) |
| Vt mínimo (4 mL/kg) | 4 × 57 | 228 mL (límite inferior) |
| Driving pressure objetivo | P_meseta − PEEP | < 15 cmH₂O (meta < 12 ideal) |
| P_meseta máxima | — | < 28–30 cmH₂O |

---

### Actividad 3 — Simulación clínica

Con los parámetros calculados y Cst = 22 mL/cmH₂O, PEEP = 10 cmH₂O:

- P_meseta = Vt/Cst + PEEP = 0,35/0,022 + 10 = 15,9 + 10 = **25,9 cmH₂O** ✓
- Driving pressure = P_meseta − PEEP = 25,9 − 10 = **15,9 cmH₂O** → en el límite, considerar reducir Vt a 5 mL/kg.
- Con Vt 285 mL: P_meseta = 0,285/0,022 + 10 = **22,95 cmH₂O**, ΔP = **12,95** → mejor.

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-vili-case",
    "type": "case_study",
    "title": "Caso clínico: SDRA moderado — aplicar ventilación protectora",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: SDRA moderado — optimizar ventilación protectora

---

### Presentación

**Paciente:** Hombre, 42 años, talla 175 cm, peso real 90 kg (obeso).
**Diagnóstico:** SDRA moderado (P/F = 148) por aspiración gástrica.
**Estado:** Sedado profundo + bloqueo neuromuscular (fase aguda, 72 h de intubación).
**Parámetros actuales:** VCV, Vt = 540 mL (aplicado antes de calcular peso predicho), Fr = 20/min, PEEP = 10, FiO₂ = 0,70.
**Mecánica:** Cst = 26 mL/cmH₂O, P_meseta = 34 cmH₂O → **¡ALERTA! > 30 cmH₂O**

---

### Análisis guiado

**1. Identifica el error**
El Vt fue calculado sobre peso real (90 kg) → 6 × 90 = 540 mL. En SDRA, el Vt debe calcularse sobre **peso predicho.**

**Peso predicho (hombre):** = 50 + 0,91 × (175 − 152,4) = 50 + 20,6 = **70,6 kg**
**Vt correcto:** 6 mL/kg × 70,6 = **424 mL** (usar 420–430 mL).

**2. Recalcula la situación con Vt 420 mL**
- P_meseta = 0,42/0,026 + 10 = 16,15 + 10 = **26,15 cmH₂O** ✓ (< 30)
- Driving pressure = 26,15 − 10 = **16,15 cmH₂O** → ligeramente > 15. Considerar PEEP optimización.
- Con PEEP 12: P_meseta = 0,42/0,026 + 12 = **28,15**, ΔP = **16,15** → igual ΔP pero mejor reclutamiento.

**3. PEEP y prono**
P/F 148 con FiO₂ 0,70 → SDRA moderado/severo. Indicación de decúbito prono si P/F < 150 con PEEP ≥ 5 y FiO₂ ≥ 0,60. → **Indicado.**

---

### Plan definitivo

VCV: Vt 420 mL, Fr 22/min (ajustar para compensar ↓ Vt), PEEP 12, FiO₂ 0,65.
→ Decúbito prono 16 h + bloqueo neuromuscular × 48 h.
→ Re-evaluar gasometría + mecánica a las 4 h de prono.

---

### Puntos clave

1. En obesidad, el Vt SIEMPRE se calcula sobre peso predicho (basado en talla), nunca peso real.
2. La P_meseta > 30 cmH₂O es una emergencia; reducir Vt inmediatamente.
3. La driving pressure < 15 cmH₂O es el objetivo con mayor correlación con supervivencia.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/module-02-monitorizacion-alto-nivel.json"): [
  {
    "id": "m-monit-adv-exercise",
    "type": "exercise",
    "title": "Taller práctico: Métricas avanzadas de monitorización ventilatoria",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Métricas avanzadas de monitorización ventilatoria

> Calcula e interpreta driving pressure, stress index, RSBI y otras métricas avanzadas. No bloquea avance.

---

### Actividad 1 — Driving pressure y su importancia

**Cálculo:**
ΔP (Driving Pressure) = Pmeseta − PEEP

**Interpretación:**
| Driving Pressure | Significado | Acción |
|---|---|---|
| < 12 cmH₂O | Óptimo | Mantener parámetros |
| 12–15 cmH₂O | Aceptable | Vigilancia estrecha |
| > 15 cmH₂O | Riesgo aumentado de VILI | Reducir Vt o incrementar PEEP |

**Ejercicio:** Paciente: Pmeseta = 24 cmH₂O, PEEP = 8. ΔP = \_\_\_ cmH₂O.
*Respuesta:* 24 − 8 = **16 cmH₂O** → riesgo → reducir Vt de 6 a 5 mL/kg.

---

### Actividad 2 — Stress Index (índice de estrés)

El stress index se mide en la pendiente de la curva presión-tiempo durante VCV con flujo constante:
- SI < 1 → pendiente cóncava → compliance mejora durante el ciclo → pulmón en zona de reclutamiento → PEEP puede estar baja.
- SI = 1 → pendiente lineal → mecánica estable durante el ciclo → PEEP óptimo.
- SI > 1 → pendiente convexa → compliance empeora durante el ciclo → pulmón se sobredistiende → reducir PEEP o Vt.

**Ejercicio:** La curva de presión durante VCV con flujo constante muestra una forma cóncava (pendiente inicial lenta que acelera). ¿Qué indica y qué harías?
*SI < 1 → PEEP puede estar baja → aumentar PEEP gradualmente y re-evaluar.*

---

### Actividad 3 — Oclusión para medir P0.1

P0.1 (presión de oclusión a 100 ms) es la presión generada durante los primeros 100 ms de una oclusión inspiratoria. Es un índice del drive respiratorio central:
- P0.1 < 1,5 cmH₂O → drive bajo (riesgo de apnea en destete)
- P0.1 1,5–3,5 cmH₂O → drive normal → buenas condiciones de destete
- P0.1 > 3,5 cmH₂O → drive elevado (esfuerzo excesivo, riesgo de P-SILI)

**Interpretación práctica:** Si P0.1 = 4,2 cmH₂O en un paciente que intenta destete, ¿qué implica?
*Drive respiratorio muy activo → investigar causa (hipercapnia, hipoxemia, dolor, agitación). Riesgo de P-SILI y fracaso del destete.*

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-monit-adv-case",
    "type": "case_study",
    "title": "Caso clínico: Deterioro de mecánica — análisis avanzado",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Deterioro agudo de mecánica pulmonar

---

### Presentación

**Paciente:** Mujer, 66 años, 62 kg (peso predicho 57 kg).
**Diagnóstico:** SDRA moderado, día 5 de intubación, previamente estabilizada.
**Parámetros previos (ayer):** VCV 342 mL, PEEP 10, FiO₂ 0,50. Pmeseta 22, P_pico 28. ΔP 12.
**Hoy al turno:** Alerta de presión pico → P_pico 38 cmH₂O, Pmeseta 34 cmH₂O.
**Mecánica:** Cst cayó de 32 a 21 mL/cmH₂O. Stress index = 1,3 (convexo).

---

### Análisis diferencial

**1. El pico subió, la meseta también → problema de compliance (no de resistencia)**
Si P_pico sube pero P_meseta no → aumento de R (secreciones, broncoespasmo).
Si ambas suben proporcionalmente → caída de Cst → evaluar causas:
- Neumotórax (agudo, unilateral, ausencia de murmullo vesicular)
- Atelectasia masiva (puede verse en Rx tórax)
- Edema pulmonar agudo (por fluidos o cardíaco)
- Progresión del SDRA (nuevo infiltrado bilateral)
- Derrame pleural a tensión

**2. Evaluación inmediata**
- Auscultación bilateral → murmullo vesicular simétrico (descarta neumotórax)
- Rx tórax urgente → nuevo infiltrado lobar izquierdo: atelectasia por tapón de moco.
- Stress index > 1 → posible sobredistensión en el pulmón sano (pulmón derecho solo).

**3. Acciones**
- Fisioterapia respiratoria urgente + aspiración de secreciones.
- Broncoscopio terapéutico para eliminar tapón mucoso.
- Reducir temporalmente PEEP a 8 para no sobredistender el parénquima sano.
- Posicionamiento lateral (pulmón sano abajo) hasta resolver atelectasia.

---

### Evolución

Broncoscopio: tapón mucoso lobulo inferior izquierdo resuelto. A las 2 h: P_pico 29, Pmeseta 22, Cst 30 mL/cmH₂O. Recuperación gradual.

---

### Puntos clave

1. La separación P_pico/P_meseta indica el origen del problema (R vs Cst).
2. El stress index > 1 indica sobredistensión, no siempre global: puede ser asimétrica.
3. La broncoscofia terapéutica es la intervención más rápida para tapones de moco.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/module-03-advertencias-asincronias-situaciones-complejas.json"): [
  {
    "id": "m-asinc-exercise",
    "type": "exercise",
    "title": "Taller práctico: Identifica y clasifica asincronías",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Identificación y clasificación de asincronías paciente-ventilador

> Entrena el reconocimiento de asincronías en curvas y clinica. No bloquea avance.

---

### Actividad 1 — Tipos de asincronías

Clasifica cada asincronía según la fase del ciclo donde ocurre:

| Asincronía | Fase | Descripción breve |
|---|---|---|
| Trigger delay | Trigger (inicio) | Retraso entre el esfuerzo del paciente y el disparo del ventilador |
| Esfuerzo inefectivo | Trigger | El paciente hace esfuerzo pero el ventilador no dispara |
| Disparo doble | Ciclado | El ventilador da dos ciclos por un solo esfuerzo del paciente |
| Asincronía de flujo | Meseta | El flujo entregado no coincide con la demanda del paciente |
| Ciclado prematuro | Ciclado | La inspiración del ventilador termina antes de que el paciente quiera |
| Ciclado tardío | Ciclado | La inspiración del ventilador continúa después de que el paciente quiere espirar |

---

### Actividad 2 — Diagnóstico por gráficas

Para cada hallazgo gráfico, identifica la asincronía más probable:

1. Deflexión negativa de presión sin disparo del ventilador → **Esfuerzo inefectivo** (auto-PEEP, trigger insensible).

2. Dos ciclos de volumen por cada ciclo de presión → **Disparo doble** (Ti muy largo, el paciente inicia un nuevo esfuerzo al final del ciclo anterior).

3. Curva de presión "cuadrada" muestra una "muesca" o depresión durante la meseta → **Asincronía de flujo** (demanda del paciente supera el flujo entregado en VCV).

4. La curva de flujo espiratorio no llega a cero antes del siguiente disparo → **Auto-PEEP** (atrapamiento aéreo) → riesgo de esfuerzo inefectivo.

---

### Actividad 3 — Manejo clínico

Para cada asincronía, indica un ajuste de primer paso:

| Asincronía | Ajuste de primer paso |
|---|---|
| Trigger insensible | Aumentar sensibilidad del trigger (reducir umbral de disparo) |
| Auto-PEEP | Aumentar tiempo espiratorio (↓ Fr, ↓ Ti, PEEP extrínseca) |
| Asincronía de flujo en VCV | Aumentar flujo pico o cambiar a PCV/PSV |
| Ciclado tardío en PSV | Aumentar criterio de ciclado (% flujo pico) |
| Disparo doble | Acortar Ti, ajustar criterio de ciclado |

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 40 pts | Actividad 3 → 30 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-asinc-case",
    "type": "case_study",
    "title": "Caso clínico: Paciente agitado con asincronías graves",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Agitación y asincronías graves en SDRA

---

### Presentación

**Paciente:** Hombre, 52 años, 78 kg, diagnosticado de SDRA severo (P/F = 85).
**Estado:** RASS +2 (agitado, resistente), CPOT 6 (dolor significativo).
**Parámetros:** VCV, Vt 468 mL (6 mL/kg), Fr 22/min, PEEP 14, FiO₂ 0,80.
**Alarmas activas:** Ve ↑ (minuto ventilación = 18 L/min), P_pico ↑ episódica (42 cmH₂O).
**Gráficas:** Se observan disparos dobles frecuentes, muescas en curva de presión durante meseta, y FR real = 35/min.

---

### Análisis clínico

**1. ¿Qué está causando las asincronías?**
- El paciente está muy activo (RASS +2) → drive respiratorio extremo.
- La sedoanalgesia es insuficiente para el nivel de esfuerzo espontáneo.
- Disparos dobles: Ti programado (Ti = 60/Fr × 0,33 = ~0,9 s) es demasiado largo para la frecuencia natural del paciente agitado.
- Muesca en meseta: demanda de flujo muy alta (VCV con flujo fijo = asincronía de flujo).

**2. Consecuencias de esta situación**
- P-SILI (lesión autoprovocada): las grandes oscilaciones de presión transpulmonar en cada esfuerzo espontáneo pueden inducir lesión pulmonar independientemente del ventilador.
- P_pico episódica 42 cmH₂O → supera umbral de barotrauma.
- Gasto metabólico elevado → hipercapnia y acidosis respiratoria.

**3. Plan de manejo**
**Paso 1:** Analgesia adecuada → fentanilo en infusión → evaluar CPOT (objetivo < 3).
**Paso 2:** Sedación profunda → midazolam o propofol → RASS objetivo −3.
**Paso 3:** Si persiste asincronía grave → bloqueo neuromuscular (cisatracurio × 48 h) + decúbito prono.
**Paso 4:** Ajustar ventilador: cambiar a PCV para limitar presión, reducir Ti, aumentar flujo.

---

### Resultado

Con cisatracurio + prono: P/F 124 a las 8 h, disparos dobles desaparecen, P_pico máx 32 cmH₂O, ΔP = 15 cmH₂O.

---

### Puntos clave

1. La agitación no tratada es la mayor causa de asincronías graves.
2. P-SILI puede ser tan dañina como el VILI inducido por el ventilador.
3. El bloqueo neuromuscular en SDRA severo (primeras 48 h) mejora la supervivencia al eliminar esfuerzos espontáneos dañinos.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/module-04-destete-complejo-vmni.json"): [
  {
    "id": "m-destete-vmni-exercise",
    "type": "exercise",
    "title": "Taller práctico: Protocolo de destete difícil y VMNI",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Destete difícil y uso de VMNI

> Aplica criterios de destete complejo y estrategias de VMNI. No bloquea avance.

---

### Actividad 1 — Clasificación del destete

Clasifica el destete según número de SBT fallidas:

| Categoría | Criterio | Estrategia |
|---|---|---|
| Destete simple | 1 SBT exitosa desde el primer intento | Extubación directa |
| Destete difícil | Requiere hasta 3 SBT o hasta 7 días | Reducción progresiva de soporte |
| Destete prolongado | > 3 SBT fallidas o > 7 días en intento de destete | VMNI post-extubación, traqueotomía electiva |

---

### Actividad 2 — VMNI en destete: indicaciones

Indica si VMNI está indicada o contraindicada en cada situación:

| Situación | VMNI indicada | Justificación |
|---|---|---|
| Post-extubación en paciente con EPOC y hx de retención de CO₂ | ✓ Sí | Reduce riesgo de re-intubación; evidencia clase A |
| Post-extubación en paciente sin factores de riesgo | En discusión | Puede usarse de forma preventiva en pacientes de alto riesgo |
| Fallo de extubación establecido (FR 40, SaO₂ 86%) | Solo si no hay contraindicaciones | Si la vía aérea está comprometida o hay secreciones → IOT |
| Alteración del nivel de conciencia severa | ✗ No | No puede proteger la vía aérea → riesgo de aspiración |
| Cirugía facial reciente con heridas en el territorio de la mascarilla | ✗ No | No hay sellado posible |

---

### Actividad 3 — Titulación de PSV hacia extubación

Esquema de reducción para destete difícil:

```
Día 1:  PSV 16 → 14  (si IRRS < 80, Fr < 28, SaO₂ > 93%)
Día 2:  PSV 14 → 12 → 10
Día 3:  PSV 10 → 8   + SBT a los 2 días
Día 4:  SBT exitosa → extubación + VMNI preventiva 2 h/turno × 24 h
```

Señales de alarma que detienen el descenso:
- FR > 30/min sostenida
- IRRS > 105
- SaO₂ < 90%
- Uso de musculatura accesoria o paradoja toracoabdominal

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 40 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-destete-vmni-case",
    "type": "case_study",
    "title": "Caso clínico: Destete prolongado con VMNI",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Destete prolongado — estrategia con VMNI

---

### Presentación

**Paciente:** Mujer, 74 años, 60 kg, EPOC moderado-severo (GOLD III), ICC diastólica.
**Diagnóstico:** SDRA leve por neumonía bacteriana, intubada hace 12 días.
**Destete:** 4 intentos de SBT fallidos en los últimos 5 días.
**Causa del fallo:** cada vez presenta fatiga muscular a los 30–45 min + deterioro hemodinámico.
**Estado actual:** RASS 0, cooperadora, capaz de toser, T 37°C, sin vasopresores.
**Función pulmonar de base:** FEV1 48% (EPOC moderado-severo) → pulmón de reserva limitada.
**Gasometría pre-SBT:** pH 7,39, PaCO₂ 50 mmHg (basal ~53), PaO₂ 78 mmHg (FiO₂ 0,35, PEEP 5).

---

### Análisis y plan

**1. ¿Por qué falla el SBT repetidamente?**
- Debilidad muscular respiratoria severa (12 días de ventilación, posible miopatía del crítico).
- Reserva pulmonar limitada por EPOC + secuelas de SDRA.
- Cada SBT agota los músculos → acumula fatiga → siguiente SBT peor.
- ICC diastólica → aumento de postcarga al respirar espontáneamente.

**2. ¿Se justifica traqueotomía?**
Sí. Criterios: > 7 días en intento de destete, fallo repetido, pronóstico de ventilación prolongada → traqueotomía percutánea electiva a las 24 h.

**3. Manejo post-traqueotomía**
- VMNI nocturna con mascarilla nasal (menor carga muscular nocturna).
- Ventilación espontánea gradual diurna con incremento progresivo de tiempo libre.
- Protocolo de rehabilitación: fisioterapia 2×/día, movilización precoz.
- Nutrición optimizada (hipercalórica con suplementos proteicos para recuperar masa muscular).

---

### Evolución

Semana 1 post-traqueotomía: 6 h/día sin ventilación.
Semana 2: 12 h/día libre.
Semana 3: 20 h/día → intento de decanulación.
Semana 4: Decanulación exitosa con O₂ por cánula nasal.

---

### Puntos clave

1. El destete prolongado requiere un abordaje multidisciplinario (UCI, fisioterapia, nutrición).
2. La traqueotomía precoz (< 14 días en criterios apropiados) mejora el confort y facilita el destete.
3. La VMNI nocturna en traqueotomizados en destete reduce la fatiga muscular acumulada.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/pathologies/module-05-obesidad-sedentarismo.json"): [
  {
    "id": "m-obesidad-exercise",
    "type": "exercise",
    "title": "Taller práctico: Ajuste de parámetros en obesidad",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Ventilación mecánica en el paciente obeso

> Aplica los ajustes específicos para obesidad mórbida. No bloquea avance.

---

### Actividad 1 — Impacto de la obesidad en la mecánica

Indica si cada afirmación es verdadera (V) o falsa (F) y justifica:

1. "En obesidad, el Vt se calcula sobre peso real."
   **F** — Se usa peso predicho basado en talla para evitar volutrauma.

2. "La FRC (capacidad residual funcional) está aumentada en decúbito supino en obesos."
   **F** — La FRC está disminuida por la presión del abdomen sobre el diafragma → atelectasias basales.

3. "El PEEP recomendado en obesos suele ser mayor que en pacientes de peso normal."
   **V** — Se necesita más PEEP para contrarrestar la presión abdominal y mantener los alvéolos abiertos (8–12 cmH₂O frecuente).

4. "La posición 30–45° (semi-Fowler) mejora la mecánica ventilatoria en obesos."
   **V** — Reduce la presión diafragmática por el peso visceral.

---

### Actividad 2 — Cálculo en caso obeso

Paciente obeso: sexo masculino, talla 170 cm, peso real 130 kg, IMC 45.
- Peso predicho = 50 + 0,91 × (170 − 152,4) = 50 + 16 = **66 kg**
- Vt protector = 6 × 66 = **396 mL** (usar 390–400 mL)
- Diferencia vs. peso real: 6 × 130 = 780 mL → **casi el doble** → barotrauma garantizado si se usa peso real.

PEEP recomendado en obeso postquirúrgico sin SDRA: **8–10 cmH₂O**
PEEP en SDRA + obesidad: **10–14 cmH₂O** (individualizar con compliance y hemodinámica).

---

### Actividad 3 — Maniobra de reclutamiento perioperatoria

¿Cuándo y cómo se aplica una maniobra de reclutamiento en el obeso?

- **Indicación:** inicio de ventilación mecánica, cambios de posición, desconexiones del circuito.
- **Técnica:** CPAP 40 cmH₂O × 8 respiraciones lentas o PEEP escalado hasta 20 cmH₂O y descenso.
- **Monitorización:** SaO₂, compliance (Cst mejora con reclutamiento), hemodinámica.
- **Contraindicación relativa:** hipotensión, neumotórax previo, bulla enfisematosa.

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-obesidad-case",
    "type": "case_study",
    "title": "Caso clínico: Paciente obeso con insuficiencia respiratoria",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Obeso mórbido en fallo respiratorio agudo

---

### Presentación

**Paciente:** Hombre, 58 años, talla 168 cm, peso 148 kg (IMC 52,5). Sedentario severo, HTA, DM2, SAHOS conocido (no tratado).
**Motivo de ingreso:** Insuficiencia respiratoria hipoxémica (SaO₂ 74% al ingreso) tras cirugía de bypass gástrico laparoscópico (4 h, posición Trendelenburg 30°).
**Gasometría en urgencias (FiO₂ 0,60 con MR):** pH 7,28, PaCO₂ 58 mmHg, PaO₂ 52 mmHg → PaFi = 87 → SDRA severo.
**Intubación:** secuencia rápida con crico presión, 2 intentos (vía aérea difícil).

---

### Análisis guiado

**1. Peso predicho**
= 50 + 0,91 × (168 − 152,4) = 50 + 14,2 = **64,2 kg**
Vt protector = 6 × 64,2 = **385 mL**

**2. Parámetros iniciales recomendados**
- VCV: Vt 385 mL, Fr 22/min, PEEP 12 cmH₂O, FiO₂ 0,80.
- Semi-Fowler 30°.
- Sedación profunda + bloqueo neuromuscular (SDRA severo + IMC > 40).

**3. Evaluación de mecánica a 30 min**
Pmeseta = 30 cmH₂O, Cst = 0,385/(30−12) = **21,4 mL/cmH₂O** (muy baja).
ΔP = 30 − 12 = **18 cmH₂O** → peligroso. Reducir Vt a 5 mL/kg = 321 mL.

**4. PEEP y prono**
P/F = 52/0,80 = 65 → SDRA severo → decúbito prono indicado.
Prono en obeso: requiere equipo especializado (mínimo 5 personas), almohadas específicas, monitorización de presión abdominal.

---

### Evolución a 24 h

Post-prono (16 h): P/F 135. PEEP reducida a 10. FiO₂ a 0,65.
ΔP = Pmeseta − PEEP = 28 − 10 = 18 → reducir Vt a 4 mL/kg = 257 mL + hipercapnia permisiva.
Día 3: P/F 172 → SDRA moderado. Pronación × 2ª sesión.

---

### Puntos clave

1. SAHOS + cirugía abdominal + Trendelenburg = tormenta perfecta para atelectasias y SDRA postoperatorio.
2. En obesos, la PEEP debe contrarrestar la presión de la pared torácica/abdominal (más alta que en normopeso).
3. La posición prono es técnicamente compleja en obesos pero factible y eficaz.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/pathologies/module-06-epoc-asma-fumadores.json"): [
  {
    "id": "m-epoc-exercise",
    "type": "exercise",
    "title": "Taller práctico: Estrategia ventilatoria en obstrucción",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Ventilación mecánica en EPOC y asma

> Aplica estrategias específicas para la obstrucción al flujo. No bloquea avance.

---

### Actividad 1 — Diferencias entre EPOC y asma en el ventilador

| Aspecto | EPOC | Asma aguda grave |
|---|---|---|
| Auto-PEEP | Frecuente y significativo | Puede ser muy elevado |
| Resistencia vía aérea | Moderada-alta, fija | Alta, variable (broncoespasmo) |
| Compliance | Aumentada (enfisema) o normal | Normal o levemente ↓ |
| Estrategia de tiempo espiratorio | Alargar Te (↓ Fr, ↓ Ti) | Alargar Te agresivamente |
| PEEP extrínseca | 70-80% del auto-PEEP medido | Mínima o 0 (no se opone al broncoespasmo) |
| Meta de CO₂ | CO₂ basal del paciente (puede ser alta) | Hipercapnia permisiva en asma severa |

---

### Actividad 2 — Medición de auto-PEEP

¿Cómo mides el auto-PEEP en el ventilador?
1. Realiza una pausa espiratoria al final de la espiración (tecla "hold" espiratoria) durante 3–5 s.
2. La presión que se lee al final de la pausa es la **presión end-expiratory = PEEP + auto-PEEP**.
3. Auto-PEEP = Presión pausa espiratoria − PEEP programada.

**Ejemplo:** PEEP programada = 5 cmH₂O. Pausa espiratoria → presión = 13 cmH₂O. Auto-PEEP = **8 cmH₂O**.
Acción: PEEP extrínseca = 0,75 × 8 = **6 cmH₂O** (para reducir trabajo de trigger sin agravar atrapamiento).

---

### Actividad 3 — Hipercapnia permisiva en asma

Un paciente con estado asmático grave tiene:
- PaCO₂ = 72 mmHg con pH 7,20.
- No hay otra causa de acidosis.
- SaO₂ 92% con FiO₂ 0,40.

¿Está indicada la hipercapnia permisiva? ¿Cuál es el límite?

**Sí.** En asma grave con atrapamiento severo, aumentar la Fr para corregir CO₂ empeora el atrapamiento → mayor auto-PEEP → mayor riesgo de neumotórax y colapso hemodinámico.
**Límite aceptado:** pH ≥ 7,15–7,20. Con pH 7,20 está en el límite → bicarbonato IV si tiende a bajar más; tratar el broncoespasmo agresivamente (β₂ agonistas IV, magnesio IV, heliox).

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-epoc-case",
    "type": "case_study",
    "title": "Caso clínico: EPOC exacerbado intubado",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: EPOC exacerbado con insuficiencia respiratoria global

---

### Presentación

**Paciente:** Hombre, 68 años, fumador 50 paquetes-año, EPOC GOLD IV (FEV1 28% previo).
**Motivo:** Exacerbación infecciosa (Haemophilus influenzae en esputo). Llegó con SaO₂ 78%, uso máximo de músculos accesorios, GLASGOW 10.
**VMNI fracasada** a los 45 min (no toleró mascara, empeoramiento progresivo). → Intubación orotraqueal.
**Gasometría pre-intubación:** pH 7,12, PaCO₂ 92 mmHg, PaO₂ 44 mmHg.

---

### Configuración inicial del ventilador

**Principio EPOC:** el objetivo NO es normalizar el CO₂; es devolver al paciente a su estado basal (PaCO₂ ~60–65 mmHg en este caso).

**Parámetros seleccionados:**
- Modo: VCV (control garantiza Vt con mecánica variable)
- Vt: 6 mL/kg PP. Peso predicho = 50 + 0,91×(172−152,4) = **67,8 kg** → Vt = **407 mL**
- Fr: 12/min (baja → alarga Te → reduce auto-PEEP)
- Ti: 0,8 s → Te = 60/12 − 0,8 = 4,2 s → relación I:E = 1:5,25 ✓
- PEEP: 0 inicialmente → medir auto-PEEP a los 15 min.
- FiO₂: 0,50 (ajustar por SaO₂)

---

### Seguimiento a 30 min

Auto-PEEP medido (pausa espiratoria): 11 cmH₂O.
PEEP extrínseca ajustada: 0,75 × 11 = **8 cmH₂O**.
Gasometría: pH 7,22, PaCO₂ 78 mmHg (descendió 14 en 30 min → bien).

**¡Alerta!** No corregir demasiado rápido → riesgo de alcalosis metabólica post-hipercápnica (el riñón ha retenido bicarbonato como compensación). Meta: pH 7,28–7,35.

---

### Plan de destete

1. Tratar la infección agresivamente (antibiótico, broncodilatadores, corticoides IV).
2. VMNI post-extubación como puente para este paciente (evidencia fuerte en EPOC).
3. Criterios de extubación adaptados: PaCO₂ basal recuperada, IRRS < 80 (en EPOC se usa umbral menor).
4. Educación y plan de seguimiento (VMNI domiciliaria, vacunación, rehabilitación pulmonar).

---

### Puntos clave

1. En EPOC, normalizar el CO₂ rápidamente puede generar alcalosis severa → taquicardia, convulsiones.
2. El auto-PEEP es el principal enemigo en la fase aguda; el manejo del Te es la solución.
3. La VMNI post-extubación es el estándar de cuidado en EPOC con hx de retención.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/pathologies/module-07-sdra.json"): [
  {
    "id": "m-sdra-exercise",
    "type": "exercise",
    "title": "Taller práctico: Manejo integral del SDRA",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Manejo integral del SDRA — guía paso a paso

> Aplica el protocolo completo de manejo del SDRA según evidencia 2024. No bloquea avance.

---

### Actividad 1 — Clasificación de Berlin

Clasifica el SDRA según los criterios de Berlin 2012 y 2023:

| Criterio | Leve | Moderado | Severo |
|---|---|---|---|
| P/F (mmHg) con PEEP ≥ 5 | 200–300 | 100–200 | < 100 |
| Mortalidad estimada | ~27% | ~32% | ~45% |
| Intervenciones adicionales | Opcional prono | Considerar prono | Prono + BNM indicados |

*(Definición revisada 2023 incluye VNI con PEEP ≥ 10 para leve/moderado)*

---

### Actividad 2 — "Paquete" de ventilación protectora

Enumera los 5 componentes del paquete de ventilación protectora del SDRA:

1. **Vt ≤ 6 mL/kg** peso predicho (rango 4–8 mL/kg según mecánica)
2. **Pmeseta ≤ 28–30 cmH₂O** (límite absoluto)
3. **Driving pressure < 15 cmH₂O** (meta ideal < 12)
4. **PEEP adecuado** para la mecánica individual (tabla ARDSnet, compliance o EIT)
5. **Decúbito prono ≥ 16 h/día** en SDRA moderado-severo (P/F < 150)

---

### Actividad 3 — Maniobra de reclutamiento: cuándo y cómo

**¿Cuándo aplicar maniobra de reclutamiento?**
- SDRA difuso/bilateral con colapso alveolar generalizado.
- Antes de titular PEEP con método de compliance.
- Tras desconexión accidental del circuito.

**¿Cómo?**
- CPAP 40 cmH₂O × 40 s (técnica clásica).
- PEEP escalonado: 15→20→25→30 cmH₂O con descenso posterior.
- PCV con PEEP 25 + P_insp 15 cmH₂O = Ppico 40 × 2 min.

**¿Cuándo NO aplicar?**
- SDRA focal (neumonía lobar): el pulmón sano se sobredistiende → peor resultado.
- Hipotensión severa → riesgo de colapso circulatorio.
- Neumotórax no drenado.

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 40 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-sdra-case",
    "type": "case_study",
    "title": "Caso clínico: SDRA severo — estrategia completa",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: SDRA severo — protocolo completo

---

### Presentación

**Paciente:** Mujer, 38 años, talla 162 cm, 58 kg, previamente sana.
**Diagnóstico:** SDRA severo post-influenza A H1N1, infiltrados bilaterales en Rx y TC.
**Gasometría (intubación):** pH 7,18, PaCO₂ 62 mmHg, PaO₂ 48 mmHg, FiO₂ 0,80 → P/F = 60.
**Fecha de ingreso a UCI:** día 1.

---

### Plan por días

**Día 1 — Fase aguda, SDRA severo**
- Bloqueo neuromuscular (cisatracurio × 48 h) → eliminar esfuerzo espontáneo peligroso.
- VCV: Vt = 6×PP = 6 × [45,5 + 0,91×(162−152,4)] = 6 × 54,2 = **325 mL**
- Fr 22/min, PEEP 14 (tabla ARDSnet FiO₂ 0,80), FiO₂ 0,80.
- Pmeseta 26, ΔP = 12 cmH₂O ✓.
- **Decúbito prono** iniciado a las 2 h post-intubación.

**Día 2 (tras 18 h de prono)**
- P/F en prono: 118 → mejoría. Supino: P/F 78 → profundo efecto del prono.
- 2ª sesión de prono. FiO₂ reducida a 0,70.

**Día 4**
- P/F 142 (moderado). FiO₂ 0,60. Cisatracurio suspendido. RASS objetivo −2.
- PEEP reducida a 12 (compliance 28 mL/cmH₂O).

**Día 7**
- P/F 198 (leve). PEEP 8. FiO₂ 0,45. Inicio destete de sedación.
- No más sesiones de prono (P/F > 150 en supino).

**Día 10**
- PSV 10 cmH₂O, PEEP 6, FiO₂ 0,35. IRRS 48. SBT exitosa 90 min.
- **Extubación.** CNAF preventiva 30 min/turno × 12 h.

---

### Resultados

Alta UCI día 14. Sin complicaciones mayores.

---

### Puntos clave

1. El bloqueo neuromuscular precoz en SDRA severo (P/F < 150) en las primeras 48 h mejora la supervivencia.
2. El prono es el tratamiento con mayor NNT favorable en medicina intensiva: ~6 pacientes tratados para salvar 1 vida.
3. La recuperación de SDRA es posible incluso en casos severos si el soporte es adecuado y se minimizan las complicaciones iatrogénicas.
"""}
  }
],

os.path.join(BASE, "mecanica/level03-avanzado/pathologies/module-08-recuperacion-proteccion.json"): [
  {
    "id": "m-recuperacion-exercise",
    "type": "exercise",
    "title": "Taller práctico: Planificación del cuidado post-extubación",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller práctico: Recuperación y protección post-UCI

> Diseña el plan de cuidados post-extubación. No bloquea avance.

---

### Actividad 1 — Síndrome Post-UCI (PICS)

Identifica los dominios del PICS y una intervención para cada uno:

| Dominio | Manifestación | Intervención |
|---|---|---|
| Físico (neuromuscular) | Debilidad muscular, dificultad para deambular | Fisioterapia precoz, movilización progresiva en UCI |
| Cognitivo | Memoria reducida, dificultad de concentración | Reorientación frecuente, protocolo ABCDEF, estimulación cognitiva |
| Psicológico | PTSD, depresión, ansiedad | Diario de UCI, seguimiento psicológico, apoyo familiar |
| Nutricional | Caquexia, sarcopenia | Nutrición hipercalórica-hiperproteica, suplementos |

---

### Actividad 2 — Checklist de alta de UCI

Marca los ítems que deben evaluarse antes del traslado a planta:

| Ítem | ¿Evaluado? | Responsable |
|---|---|---|
| Vía aérea estable, reflejo tusígeno presente | ✓ | Médico UCI |
| Oxigenación adecuada con O₂ suplementario ≤ 4 L/min | ✓ | Médico UCI |
| Movilidad: al menos capaz de girar en cama | ✓ | Fisioterapia |
| Plan de rehabilitación documentado | ✓ | Fisio + médico |
| Interconsulta a psicología programada | ✓ | Enfermería + trabajo social |
| Nutrición oral o enteral establecida | ✓ | Nutrición clínica |
| Educación al paciente/familia sobre PICS | ✓ | Equipo multidisciplinar |

---

### Actividad 3 — Predictor de ingreso prolongado en planta

Indica cómo la miopatía del paciente crítico afecta el alta hospitalaria:

La miopatía del paciente crítico (CIMP/CINM) ocurre en el 25–50% de los pacientes en ventilación mecánica > 7 días. Sus consecuencias:
- Retraso en la deambulación → hospitalización prolongada.
- Mayor riesgo de neumonía por aspiración (debilidad faríngea).
- Necesidad de rehabilitación domiciliaria o en centro de media estancia.
- Asociada con ↑ mortalidad a 1 año post-UCI.

**Factores de riesgo a documentar:** duración de VMI, uso de BNM, corticoides, hiperglucemia, inmovilización.

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  },
  {
    "id": "m-recuperacion-case",
    "type": "case_study",
    "title": "Caso clínico: Planificación del alta de UCI",
    "estimatedTime": 12,
    "content": {"markdown": """## Caso clínico: Planificación integral del alta de UCI tras VM prolongada

---

### Presentación

**Paciente:** Hombre, 55 años, 72 kg, técnico industrial.
**Diagnóstico:** SDRA moderado post-cirugía abdominal complicada. Ventilación mecánica 14 días.
**Estado actual (día 18 de UCI):** Extubado hace 4 días. SaO₂ 95% con cánula nasal 3 L/min. Febril 38,1°C (UTI de catéter en resolución).
**Funcional:** No deambula de forma independiente. Se sienta al borde de la cama 10 min/día. Debilidad de MMII (MRC suma 36/60 → debilidad moderada).
**Cognitivo:** Desorientado en tiempo, confusión fluctuante (posible delirio post-UCI).
**Emocional:** Referido por enfermería como ansioso, pesadillas nocturnas, pregunta repetidamente "¿cuándo salgo?".

---

### Análisis y plan multidisciplinar

**1. Evaluación neuromotora**
MRC < 48/60 → criterio de debilidad adquirida en UCI (ICUAW).
Plan fisioterapia: progresión diaria: sedestación → bipedestación → marcha asistida → marcha independiente.
Meta para el alta: marcha 10 m con apoyo.

**2. Evaluación cognitiva**
Mini-Cog o Montreal Cognitive Assessment (MoCA) al alta.
Protocolo de delirio: orientación horaria, luz natural, ciclo sueño-vigilia, participación familiar.
Seguimiento neuropsicológico ambulatorio al mes del alta hospitalaria.

**3. Evaluación emocional (PTSD precoz)**
Diario de UCI: se entrega al paciente para que reconstruya su historia durante la hospitalización.
Derivación a psicología clínica.
Grupo de apoyo de supervivientes de UCI (disponible en algunos centros).

**4. Plan nutricional**
Objetivo: recuperar masa muscular perdida (estimado: −3–5 kg de masa magra).
Dieta hipercalórica-hiperproteica (proteína 1,5–2 g/kg/día).
Suplementos orales de alta densidad calórica.
Seguimiento con nutricionista al alta.

---

### Indicadores de alta a planta

- ✓ SaO₂ ≥ 95% con ≤ 3 L/min O₂
- ✓ Sin vasopresores ni ventilación mecánica invasiva
- ✓ Tolera vía oral o nutrición enteral
- ✓ Fisioterapia planificada y iniciada
- ✓ Documentación del PICS y plan de seguimiento a 1 y 3 meses

---

### Puntos clave

1. El PICS afecta al 50–70% de los sobrevivientes de UCI con VM > 7 días.
2. La rehabilitación precoz (desde el día 2–3 en UCI) reduce la incidencia y severidad del PICS.
3. El seguimiento ambulatorio estructurado a los 3 meses post-UCI mejora la calidad de vida y reduce las readmisiones.
"""}
  }
],

# ══════════════════════════════════════════════════════════════════════════════
# VENTYLAB — NIVEL 1: PRINCIPIANTE
# ══════════════════════════════════════════════════════════════════════════════

os.path.join(BASE, "ventylab/level01-principiante/historia_fisiología_aplicada.json"): [
  {
    "id": "vl1-hfa-exercise",
    "type": "exercise",
    "title": "Taller: Diseña tu plan de estudio con SDL y retrieval practice",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller: Diseña tu plan de estudio personalizado

> Este taller te ayuda a aplicar SDL y retrieval practice en tu propio aprendizaje de ventilación mecánica. No bloquea avance.

---

### Actividad 1 — Diagnóstico de tus necesidades de aprendizaje (SDL)

Responde honestamente las siguientes preguntas para identificar tu punto de partida:

1. ¿Cuánto tiempo disponible tienes por semana para estudiar ventilación mecánica? _____ h/semana.

2. ¿Cuál es tu mayor dificultad actual con el tema?
   □ Fundamentos fisiológicos (presiones, volúmenes)
   □ Interpretación de gráficas del ventilador
   □ Selección de modos ventilatorios
   □ Manejo de casos clínicos complejos
   □ Destete del paciente

3. ¿Qué recurso de aprendizaje activo usas actualmente?
   □ Anki o similar (repetición espaciada)
   □ Preguntas de autoexamen
   □ Presentación de casos con colegas (TBL informal)
   □ Ninguno todavía

---

### Actividad 2 — Diseña tu semana de estudio con práctica espaciada

Completa la siguiente plantilla de sesiones de estudio:

| Día | Tema | Duración | Actividad de recuperación |
|---|---|---|---|
| Lunes | Ecuación del movimiento | 30 min | Preguntas de autoexamen (5 preguntas) |
| Miércoles | Revisión: ecuación + variables de fase | 20 min | Flashcards Anki |
| Viernes | Modos ventilatorios | 30 min | Caso clínico breve |
| Domingo | Repaso libre de la semana | 15 min | Cuestionario de recuerdo sin notas |

*Adapta este esquema a tus disponibilidad real.*

---

### Actividad 3 — Reflexión sobre tu estrategia de retrieval

Compara en tu experiencia personal:

| Estrategia | ¿La usas? | Resultado percibido |
|---|---|---|
| Releer los apuntes varias veces | Sí/No | ¿Sientes que retienes? |
| Responder preguntas de examen | Sí/No | ¿Más difícil pero efectivo? |
| Explicar el tema a un colega | Sí/No | ¿Notas los vacíos de conocimiento? |

Según la evidencia del módulo, el **efecto de prueba** (responder preguntas) supera a la relectura en retención a largo plazo. Elige al menos 1 estrategia de recuperación para implementar esta semana.

---

### ¿Cómo se califica?

- Actividad 1 (diagnóstico) → 30 pts
- Actividad 2 (diseño del plan) → 40 pts
- Actividad 3 (reflexión) → 30 pts
- **Total: 100 pts** (informativo — tu plan es tu resultado)
"""}
  }
],

os.path.join(BASE, "ventylab/level01-principiante/ventilador_compontentes.json"): [
  {
    "id": "vl1-vent-exercise",
    "type": "exercise",
    "title": "Taller: Identifica y relaciona los componentes del ventilador",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller: Componentes del ventilador y su función

> Relaciona los componentes con su función clínica. No bloquea avance.

---

### Actividad 1 — Bloques funcionales del ventilador

Conecta cada bloque con su función principal:

| Bloque | Función |
|---|---|
| Fuente de gas (O₂/aire) | Suministra el gas mezclado al paciente a la concentración de FiO₂ seleccionada |
| Unidad de mezcla (blender) | Ajusta la proporción O₂/aire para lograr la FiO₂ programada |
| Sensor de flujo inspiratorio | Detecta el esfuerzo del paciente para el trigger del ventilador |
| Válvula espiratoria (PEEP) | Mantiene la presión positiva al final de la espiración |
| Circuito del paciente | Conduce el gas entre el ventilador y la vía aérea del paciente |
| Pantalla/interfaz | Muestra parámetros, curvas y alarmas en tiempo real |

---

### Actividad 2 — Alarmas básicas: interpreta y actúa

Para cada alarma, indica la causa más frecuente y la primera acción:

| Alarma | Causa frecuente | Primera acción |
|---|---|---|
| Presión alta (High Pressure) | Tos, secreciones, broncoespasmo, sonda doblada | Aspirar, auscultación, revisar circuito |
| Presión baja (Low Pressure / Desconexión) | Fuga en el circuito, extubación accidental | Verificar conexión circuito-TET, reconectar |
| Apnea (Apnea Alarm) | Paciente en modo espontáneo sin esfuerzo | Cambiar a modo controlado, evaluar nivel de conciencia |
| FiO₂ baja | Fallo en suministro de O₂ o mezcla | Verificar fuente de O₂, alarma de central |
| Volumen minuto bajo | Vt insuficiente o fuga de aire | Revisar ajuste de Vt, buscar fuga |

---

### Actividad 3 — Verificación pre-uso (check list simplificado)

Ordena estos pasos en la secuencia correcta para verificar el ventilador antes de conectar al paciente:

A. Conectar al simulador pulmonar y verificar Vt entregado.
B. Encender el ventilador y verificar autotest.
C. Configurar los parámetros iniciales para el paciente.
D. Conectar fuentes de gas (O₂ y aire comprimido).
E. Verificar integridad del circuito (sin fugas).
F. Programar alarmas según el paciente.

**Orden correcto:** D → B → E → A → C → F

*D (fuentes) → B (encender/test) → E (circuito sin fugas) → A (test con simulador) → C (parámetros) → F (alarmas)*

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 40 pts | Actividad 3 → 30 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

# ══════════════════════════════════════════════════════════════════════════════
# VENTYLAB — NIVEL 2: INTERMEDIO
# ══════════════════════════════════════════════════════════════════════════════

os.path.join(BASE, "ventylab/level02-intermedio/programación_modo_clasicos.json"): [
  {
    "id": "vl2-prog-exercise",
    "type": "exercise",
    "title": "Taller: Configura un modo clásico paso a paso",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller: Configuración de modos clásicos en el ventilador

> Practica la programación de VCV y PCV en un escenario simulado. No bloquea avance.

---

### Actividad 1 — Parámetros necesarios para VCV

Indica qué parámetros son obligatorios y cuáles son opcionales al configurar VCV:

| Parámetro | Obligatorio | Opcional | Valor de referencia |
|---|---|---|---|
| Volumen corriente (Vt) | ✓ | — | 6–8 mL/kg PP |
| Frecuencia respiratoria (Fr) | ✓ | — | 12–20/min |
| FiO₂ | ✓ | — | Mínimo para SaO₂ ≥ 95% |
| PEEP | ✓ | — | ≥ 5 cmH₂O |
| Flujo pico (o Ti) | ✓ | — | 40–60 L/min |
| Pausa inspiratoria | — | ✓ | 0–0,2 s |
| Trigger | ✓ | — | Flujo −2 L/min o presión −2 cmH₂O |
| Alarmas de presión | ✓ | — | Ppico + 10 cmH₂O |

---

### Actividad 2 — Ejercicio de configuración

**Caso:** Paciente varón, talla 170 cm (PP = 66 kg), sin SDRA, postoperatorio cardíaco.

Rellena los parámetros recomendados:

| Parámetro | Tu valor | Justificación |
|---|---|---|
| Modo | VCV | Control garantizado en fase aguda |
| Vt | 396 mL (6 mL/kg) | Protector incluso sin SDRA |
| Fr | 14/min | Fisiológico, minuto ventilación adecuado |
| FiO₂ | 0,40 | Titular por SaO₂; evitar hiperóxia |
| PEEP | 5 cmH₂O | Basal, evitar atelectasias |
| Flujo pico | 45 L/min | Ti ≈ 0,53 s → I:E ≈ 1:2 |

---

### Actividad 3 — Diferencias en la pantalla: VCV vs PCV

Describe qué curvas verías en cada modo (flujo-tiempo, presión-tiempo, volumen-tiempo):

**En VCV con flujo constante:**
- Flujo-tiempo: rectangular (constante en inspiración)
- Presión-tiempo: rampa ascendente + plateau en pausa
- Volumen-tiempo: ascenso lineal durante inspiración

**En PCV:**
- Flujo-tiempo: deceleración rápida al inicio, luego curva exponencial
- Presión-tiempo: ascenso rápido → plateau rectangular → descenso en espiración
- Volumen-tiempo: curva sigmoide suave

---

### ¿Cómo se califica?

- Actividad 1 → 25 pts | Actividad 2 → 45 pts | Actividad 3 → 30 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

os.path.join(BASE, "ventylab/level02-intermedio/ventilaciónnoinvasiva_destete.json"): [
  {
    "id": "vl2-vmni-exercise",
    "type": "exercise",
    "title": "Taller: Estrategias de aprendizaje para VMNI y destete",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller: Organiza tu aprendizaje sobre VMNI y destete

> Aplica las estrategias del módulo para consolidar el conocimiento de VMNI. No bloquea avance.

---

### Actividad 1 — Mapa conceptual: indicaciones de VMNI

Clasifica las siguientes indicaciones en la categoría correcta:

| Indicación | VMNI de primera elección | VMNI como puente | VMNI contraindicada |
|---|---|---|---|
| EPOC exacerbado (pH 7,28–7,35) | ✓ | — | — |
| Edema pulmonar cardiogénico agudo | ✓ | — | — |
| Post-extubación en paciente EPOC | ✓ | — | — |
| Fallo de extubación sin vía aérea comprometida | — | ✓ | — |
| Obstrucción severa de vía aérea superior | — | — | ✓ |
| Paciente no colaborador / agitado | — | — | ✓ |
| Parada respiratoria inminente | — | — | ✓ (IOT de urgencia) |

---

### Actividad 2 — Interfaz de VMNI: selección

Para cada contexto, elige la interfaz más adecuada:

| Contexto | Interfaz preferida | Razón |
|---|---|---|
| EPOC crónico, destete nocturno | Nasal o nasobucal | Menor claustrofobia, tolerancia diurna |
| Edema pulmonar agudo, estado agitado | Oronasal (full face) | Mayor sellado, menor fuga |
| Paciente con claustrofobia severa | Casco/Helmet | Sin contacto facial |
| Largo plazo en casa (>10 h/noche) | Nasal | Menor presión facial, mayor comodidad |

---

### Actividad 3 — Retrieval: preguntas sobre destete y VMNI

Responde sin consultar el material (práctica de recuperación):

1. ¿Qué es el IRRS y cuál es el umbral predictivo de éxito de extubación?
   *IRRS = FR/Vt (litros). < 105/min/L predice éxito.*

2. ¿Cuánto tiempo debe durar una SBT estándar?
   *30 minutos a 2 horas. Si tolera, extubación.*

3. ¿Cuál es la diferencia entre fallo de SBT y fallo de extubación?
   *Fallo de SBT: no tolera respiración espontánea → re-intubación no siempre necesaria, retorna a soporte. Fallo de extubación: tolera SBT pero falla tras extubación → requiere VMNI o re-intubación.*

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 30 pts | Actividad 3 → 40 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

# ══════════════════════════════════════════════════════════════════════════════
# VENTYLAB — NIVEL 3: AVANZADO
# ══════════════════════════════════════════════════════════════════════════════

os.path.join(BASE, "ventylab/level03-avanzado/innovación_tecnología_gestión.json"): [
  {
    "id": "vl3-innov-exercise",
    "type": "exercise",
    "title": "Taller: Análisis crítico de tecnología ventilatoria",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller: Evaluación crítica de tecnología ventilatoria emergente

> Aplica pensamiento crítico al evaluar nuevas tecnologías. No bloquea avance.

---

### Actividad 1 — Marco de evaluación tecnológica

Usa el siguiente marco para evaluar cualquier tecnología ventilatoria nueva:

| Dimensión | Pregunta clave | Ejemplo: IA para ajuste automático de PEEP |
|---|---|---|
| Evidencia clínica | ¿Hay ECA con outcomes relevantes (mortalidad, días de UCI)? | ECA fase II/III en marcha; datos observacionales prometedores |
| Seguridad | ¿Tiene alarmas de seguridad independientes de la IA? | Sí — el ventilador mantiene límites de presión hardcoded |
| Implementación | ¿Requiere formación especializada? | Sí — curva de aprendizaje para el equipo de UCI |
| Costo-efectividad | ¿El beneficio justifica el costo vs. alternativas actuales? | Por determinar — datos de costo-utilidad pendientes |
| Equidad | ¿Está disponible en contextos de recursos limitados? | No actualmente — solo hospitales terciarios |

---

### Actividad 2 — Ventiladores inteligentes: fortalezas y limitaciones

Lista 3 fortalezas y 3 limitaciones del uso de IA en la gestión del ventilador:

**Fortalezas:**
1. Reducción de asincronías por adaptación continua al paciente.
2. Detección temprana de deterioro (cambios sutiles en compliance o resistencia).
3. Descarga cognitiva del equipo en entornos de alta carga de trabajo.

**Limitaciones:**
1. "Caja negra": difícil interpretar por qué el sistema tomó una decisión.
2. Riesgo de sobredependencia — el clínico puede perder habilidades manuales.
3. Sesgos en los datos de entrenamiento: si los datos de entrenamiento no incluyen poblaciones diversas, el rendimiento puede ser inferior en ciertos grupos.

---

### Actividad 3 — Gestión del aprendizaje clínico continuo

Diseña una estrategia de actualización continua en tecnología ventilatoria:

| Recurso | Frecuencia | Meta |
|---|---|---|
| Revisión de guías (ESICM, ATS, SCCM) | Anual | Actualizar protocolos institucionales |
| Journal club en UCI | Quincenal | Discutir papers relevantes del mes |
| Simulación clínica con casos complejos | Mensual | Mantener habilidades en situaciones de baja frecuencia |
| Certificaciones (FCCS, EDIC) | Según carrera | Validar competencias formalmente |
| Seguimiento de Cochrane + PubMed | Semanal (alertas) | Detectar nueva evidencia en tiempo real |

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

os.path.join(BASE, "ventylab/level03-avanzado/raciocinioclínico_patologíascríticas.json"): [
  {
    "id": "vl3-racion-exercise",
    "type": "exercise",
    "title": "Taller: Raciocinio clínico estructurado",
    "estimatedTime": 15,
    "content": {"markdown": """## Taller: Raciocinio clínico estructurado en ventilación mecánica

> Entrena el pensamiento clínico sistemático en escenarios de alta complejidad. No bloquea avance.

---

### Actividad 1 — Modelo de raciocinio dual (Sistema 1 / Sistema 2)

El raciocinio diagnóstico involucra dos sistemas (Kahneman):
- **Sistema 1:** Rápido, automático, basado en reconocimiento de patrones ("este paciente con SDRA tiene auto-PEEP" — reconocido de inmediato).
- **Sistema 2:** Lento, analítico, deliberativo ("¿por qué el P/F no mejora con PEEP 16? → análisis paso a paso").

Para cada situación clínica, indica qué sistema debes activar predominantemente y por qué:

| Situación | Sistema predominante | Justificación |
|---|---|---|
| Alarma de presión alta súbita, SaO₂ cayendo | S1 (rápido) | Requiere acción inmediata; patrón reconocible (neumotórax, sonda doblada) |
| Paciente que no mejora tras 72 h de ventilación protectora | S2 (analítico) | Situación compleja, sin respuesta típica → revisión sistemática |
| Selección de FiO₂ de mantenimiento | S1 | Regla simple: menor FiO₂ con SaO₂ ≥ 95% |
| Evaluar criterios de extubación en paciente con comorbilidades | S2 | Múltiples factores a ponderar; error costoso |

---

### Actividad 2 — Sesgos cognitivos en UCI

Identifica el sesgo cognitivo presente en cada escenario:

1. El médico asume que la taquicardia del paciente intubado es por dolor/ansiedad sin descartar neumotórax porque "siempre es eso". → **Sesgo de anclaje** (anclar en diagnóstico previo frecuente).

2. Ante un paciente con SDRA, el médico usa el mismo protocolo que usó con éxito la semana anterior sin evaluar las diferencias. → **Sesgo de disponibilidad** (lo que recuerdo mejor influye mi decisión).

3. El médico de guardia no cuestiona el manejo del turno anterior porque "fue una decisión del especialista". → **Efecto de autoridad** / **Sesgo de confirmación** (no buscar información que contradiga la decisión existente).

---

### Actividad 3 — Caso de raciocinio integrado (ejercicio final)

**Escenario:** Mujer, 61 años, SDRA moderado día 8. Parámetros: VCV 360 mL, PEEP 12, FiO₂ 0,55. Hoy P/F bajó de 165 a 102 sin causa aparente. Nuevo infiltrado en Rx basal derecha.

**Genera tu lista de hipótesis diagnósticas ordenada por probabilidad:**

1. Neumonía asociada a ventilación mecánica (NAVM) — lo más frecuente en día 8 con nuevo infiltrado.
2. Atelectasia lobar por tapón mucoso — causa tratable con fisio/broncoscopio.
3. Derrame pleural significativo — evaluar con eco a la cabecera.
4. Progresión del SDRA — si las anteriores se descartan.
5. Tromboembolismo pulmonar — menos frecuente pero mortal si se omite.

**Pasos inmediatos:**
- Auscultación + eco pulmonar rápido (B-lines, derrame).
- Rx o TC tórax urgente.
- Hemocultivos + aspirado traqueal para cultivo.
- Ajuste de FiO₂ mientras se investiga.

---

### ¿Cómo se califica?

- Actividad 1 → 30 pts | Actividad 2 → 35 pts | Actividad 3 → 35 pts
- **Total: 100 pts** (informativo)
"""}
  }
],

}  # End of SECTIONS_MAP

# ─── EXECUTE ──────────────────────────────────────────────────────────────────

print("\nAgregando talleres y casos clinicos a los archivos de lecciones...\n")

errors = []
for filepath, new_sections in SECTIONS_MAP.items():
    if not os.path.exists(filepath):
        print(f"  ⚠  ARCHIVO NO ENCONTRADO: {filepath}")
        errors.append(filepath)
        continue
    try:
        update_file(filepath, new_sections)
    except Exception as e:
        print(f"  ✗  ERROR en {os.path.basename(filepath)}: {e}")
        errors.append(filepath)

print(f"\nProceso completado.")
if errors:
    print(f"Archivos con errores: {len(errors)}")
    for e in errors:
        print(f"   - {e}")
else:
    print("Sin errores.")
