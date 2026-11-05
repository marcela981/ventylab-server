<!-- page: conceptos-flujo-ciclado | THEORY | Asincronías de flujo y de ciclado -->
<!-- block: INTRODUCTION | Por qué importa en la cabecera del paciente -->
Una vez que el ciclo se ha disparado, todavía pueden ocurrir dos desajustes. El primero es de **cantidad**: el flujo que entrega el ventilador no coincide con el que el paciente "pide". El segundo es de **tiempo**: la inspiración del ventilador termina antes o después que la inspiración neural del paciente. El ciclo respiratorio asistido tiene tres fases que deben coincidir con las del paciente: disparo, entrega (target) y ciclado (Gilstrap & MacIntyre, 2013). La lección «Asincronías de disparo» trató la primera; aquí verás las otras dos.

Estas asincronías tienen consecuencias concretas. El hambre de flujo hace que el paciente trabaje contra la máquina durante toda la inspiración; al reducir a la mitad el flujo programado en pacientes en ventilación asistida por volumen, 10 de 16 desarrollaron una asincronía de flujo con carga medible sobre los músculos inspiratorios (MacIntyre et al., 1997). El ciclado tardío en la obstrucción alarga la inspiración, aumenta la auto-PEEP y favorece los esfuerzos ineficaces (Tassaux et al., 2005). Y el doble disparo puede entregar volúmenes muy superiores al programado aun en ventilación protectora (Pohlman et al., 2008).

<!-- block: THEORY | Asincronía de flujo -->
#### Hambre de flujo (flujo insuficiente)

Ocurre cuando el flujo que recibe el paciente es menor que su demanda. Es típica de la **ventilación controlada por volumen (VCV)**, porque el flujo lo fija el operador y no aumenta con el esfuerzo del paciente; también puede verse en presión controlada o presión de soporte cuando la presión aplicada es baja o la presurización es lenta (Holanda et al., 2018).

La explicación está en la ecuación del movimiento con esfuerzo muscular: si el flujo y el volumen están fijados, todo esfuerzo inspiratorio del paciente se resta directamente de la presión en la vía aérea. En la curva presión-tiempo, en lugar de la rampa lineal del paciente pasivo, ves una curva **hundida o cóncava** hacia la línea de base. Cuanto más profunda la concavidad, mayor el esfuerzo que el ventilador no está satisfaciendo (Georgopoulos et al., 2006).

![Curvas de presión y flujo en ventilación controlada por volumen con flujo constante: la presión de un paciente pasivo sube como una rampa lineal, mientras que con un esfuerzo intenso la curva se hunde por debajo de la rampa y adopta forma cóncava](/learning/diagrams/i5-flujo-hambre-vcv.svg "Figura: la concavidad de la presión revela el hambre de flujo en VCV")

#### Flujo excesivo

Es el problema opuesto: un flujo mayor que la demanda, por un flujo programado alto en VCV o por una presión excesiva o una presurización muy rápida en modos de presión. Se ve como un pico transitorio de presión al inicio de la inspiración (sobrepaso) y puede causar disconfort o un ciclado prematuro en presión de soporte (Holanda et al., 2018).

<!-- block: THEORY | Asincronías de ciclado -->
El ciclado es la transición de inspiración a espiración. Idealmente coincide con el final de la inspiración neural; con frecuencia ocurre antes o después (Gentile, 2011).

#### Ciclado prematuro

El tiempo inspiratorio del ventilador es **más corto** que el tiempo inspiratorio neural: la máquina abre la válvula espiratoria mientras los músculos siguen contrayéndose. En la curva de flujo, al inicio de la espiración aparece una deflexión hacia cero (el paciente sigue "tirando" de aire) y la presión puede caer por debajo de la PEEP. En presión de soporte es más frecuente con mecánica restrictiva y tiempos neurales largos (Holanda et al., 2018). Si el esfuerzo persistente alcanza el umbral del trigger, se convierte en doble disparo.

#### Ciclado tardío

El tiempo inspiratorio del ventilador es **más largo** que el neural: el paciente ya quiere espirar y la máquina sigue insuflando. En presión de soporte, el ventilador cicla cuando el flujo cae hasta un porcentaje del flujo pico; en la obstrucción, el flujo cae lentamente porque la constante de tiempo es larga, y ese umbral se alcanza tarde (Tassaux et al., 2005). En la curva de presión aparece un pico al final de la inspiración por encima del nivel de soporte (el paciente espira activamente contra la máquina) y el flujo cae de forma brusca.

![Tres paneles de presión y flujo en presión de soporte: ciclado sincrónico, ciclado prematuro con una deflexión del flujo espiratorio hacia cero, y ciclado tardío con un pico de presión al final de la inspiración y caída brusca del flujo](/learning/diagrams/i5-ciclado-psv.svg "Figura: ciclado sincrónico, prematuro y tardío en presión de soporte")

<!-- block: THEORY | Doble disparo (introducción) -->
El **doble disparo** son dos ciclos consecutivos separados por una espiración muy breve, desencadenados por un único esfuerzo del paciente. Suele aparecer cuando el tiempo inspiratorio del ventilador es corto respecto del neural o cuando el volumen programado en VCV es bajo para la demanda (Holanda et al., 2018). Como el segundo ciclo empieza antes de que se haya exhalado el primero, los volúmenes se apilan. En pacientes con lesión pulmonar aguda ventilados con volumen corriente bajo, los ciclos apilados alcanzaron un volumen mediano de 10,1 mL/kg de peso predicho, unas 1,6 veces el volumen programado, a pesar de una sedación profunda (Pohlman et al., 2008). El disparo reverso y otros mecanismos del doble disparo se estudian en el módulo avanzado «Asincronías complejas».

![Curvas de volumen y flujo en ventilación controlada por volumen: un ciclo único entrega el volumen programado y se exhala; luego un segundo ciclo se dispara tras una espiración muy breve y el volumen total casi duplica el programado](/learning/diagrams/i5-doble-disparo.svg "Figura: el doble disparo apila volumen sobre el ciclo anterior")
<!-- page: formulas-flujo-ciclado | EXERCISE | Fórmulas: flujo, tiempo inspiratorio y criterio de ciclado -->
<!-- block: THEORY | La ecuación del movimiento con esfuerzo del paciente -->
Durante un ciclo asistido, la presión que distiende el sistema respiratorio es la suma de la que aplica el ventilador y la que generan los músculos:

$$
P_{aw} + P_{mus} = \frac{V}{C_{rs}} + R_{aw}\cdot\dot{V} + PEEP_{total}
$$

- $P_{aw}$: presión en la vía aérea (cmH₂O).
- $P_{mus}$: presión generada por los músculos inspiratorios, positiva cuando el paciente inspira (cmH₂O).
- $V$: volumen por encima del volumen de fin de espiración (L).
- $C_{rs}$: compliance del sistema respiratorio (L/cmH₂O).
- $R_{aw}$: resistencia (cmH₂O·s/L).
- $\dot{V}$: flujo (L/s).

En VCV, $V$ y $\dot{V}$ están impuestos, así que $P_{aw} = V/C_{rs} + R_{aw}\dot{V} + PEEP_{total} - P_{mus}$: **cada cmH₂O de esfuerzo baja un cmH₂O la presión** y eso es la concavidad. En presión controlada o soporte, $P_{aw}$ está fijada y el esfuerzo se traduce en **más flujo y más volumen**; por eso los modos de presión responden mejor a un esfuerzo intenso (MacIntyre et al., 1997), a costa de un volumen corriente menos controlado.

<!-- block: THEORY | Flujo y tiempo inspiratorio en VCV -->
Con flujo constante, el tiempo inspiratorio depende del volumen y del flujo programados:

$$
T_{i} = \frac{V_{T}}{\dot{V}}
$$

Subir el flujo corrige el hambre de flujo, pero **acorta el $T_i$**. Si el tiempo neural del paciente es largo, puedes convertir un problema de flujo en un ciclado prematuro o un doble disparo. Por eso la corrección del flujo debe ir acompañada de la observación del inicio de la espiración.

<!-- block: THEORY | Criterio de ciclado en presión de soporte -->
En presión de soporte el ventilador cicla cuando el flujo inspiratorio cae a un porcentaje del flujo pico (criterio de ciclado, *expiratory trigger sensitivity*, ETS). Los ventiladores permiten ajustarlo habitualmente entre el 5 % y el 70 %, con un valor por defecto frecuente del 25 % (Holanda et al., 2018). En un modelo simplificado de paciente pasivo con presión cuadrada, el flujo decae de forma exponencial con la constante de tiempo $\tau = R_{aw}\cdot C_{rs}$:

$$
\dot{V}(t) = \dot{V}_{pico}\cdot e^{-t/\tau}
$$

El ciclado ocurre cuando $\dot{V}(t) = ETS\cdot\dot{V}_{pico}$, por lo que:

$$
T_{i} \approx \tau\cdot\ln\left(\frac{1}{ETS}\right)
$$

El modelo ignora el esfuerzo del paciente y solo sirve para entender la tendencia: **cuanto mayor es τ (obstrucción), más largo es el $T_i$ con el mismo ETS**, y subir el ETS lo acorta.

<!-- block: EXERCISE | Ejemplo resuelto -->
**1. VCV y flujo.** Programas $V_T = 450\,\text{mL}$ y flujo $40\,\text{L/min}$.

$$
\dot{V} = \frac{40}{60} = 0{,}667\,\text{L/s} \qquad T_i = \frac{0{,}450}{0{,}667} = 0{,}67\,\text{s}
$$

Si subes el flujo a $60\,\text{L/min}$ ($1\,\text{L/s}$): $T_i = 0{,}45\,\text{s}$. Corriges el hambre de flujo pero reduces el $T_i$ en un tercio.

**2. Presión de soporte y obstrucción.** Compara dos pacientes con ETS del 25 %:

- Pulmón con mecánica cercana a lo normal: $R_{aw} = 8\,\text{cmH}_2\text{O·s/L}$, $C_{rs} = 0{,}05\,\text{L/cmH}_2\text{O}$ → $\tau = 0{,}40\,\text{s}$.
- EPOC: $R_{aw} = 20\,\text{cmH}_2\text{O·s/L}$, $C_{rs} = 0{,}06\,\text{L/cmH}_2\text{O}$ → $\tau = 1{,}20\,\text{s}$.

$$
T_i^{normal} \approx 0{,}40\cdot\ln 4 = 0{,}40\cdot 1{,}386 = 0{,}55\,\text{s}
$$

$$
T_i^{EPOC} \approx 1{,}20\cdot 1{,}386 = 1{,}66\,\text{s}
$$

Si en el paciente con EPOC subes el ETS al 50 %:

$$
T_i^{EPOC} \approx 1{,}20\cdot\ln 2 = 1{,}20\cdot 0{,}693 = 0{,}83\,\text{s}
$$

El $T_i$ se reduce a la mitad y deja más tiempo para espirar. Es coherente con lo observado en pacientes obstructivos: un criterio de ciclado más alto redujo el retraso del ciclado y el esfuerzo inspiratorio (Tassaux et al., 2005; Chiumello et al., 2007).

**3. Doble disparo.** Con $V_T$ programado de $350\,\text{mL}$, si el segundo ciclo comienza cuando solo se han exhalado $50\,\text{mL}$ del primero, el volumen pulmonar por encima de la CRF al final del segundo ciclo es $350 - 50 + 350 = 650\,\text{mL}$, casi el doble del programado.
<!-- page: aplicacion-clinica-flujo-ciclado | CASE_STUDY | Aplicación clínica: hambre de flujo, doble disparo y ciclado tardío -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Mujer de 55 años, talla 160 cm (peso corporal predicho ≈ 52,4 kg), con neumonía grave e hipoxemia, intubada hace 10 horas. Ventilación controlada por volumen asistida: $V_T$ 320 mL (≈ 6 mL/kg de peso predicho), flujo constante 30 L/min, FR programada 20/min, PEEP 10 cmH₂O, FiO₂ 0,6.

**Situación.** Temperatura 39,2 °C, gasometría con pH 7,29, PaCO₂ 38 mmHg y HCO₃⁻ 18 mmol/L (acidosis metabólica). Frecuencia real 32/min. En la pantalla ves una curva de presión cóncava durante la inspiración y, cada pocos ciclos, dos ciclos seguidos con una espiración mínima entre ellos; el volumen espirado de esos pares llega a 600 mL.

**Razonamiento paso a paso**

1. **Identifica las asincronías.** Concavidad de la presión en VCV: **hambre de flujo**. Dos ciclos con espiración mínima y volumen casi doble: **doble disparo** con apilamiento.
2. **Calcula el tiempo inspiratorio.** $\dot{V} = 30/60 = 0{,}5\,\text{L/s}$; $T_i = 0{,}32/0{,}5 = 0{,}64\,\text{s}$. Con un impulso tan alto, el tiempo neural probablemente es más largo y el esfuerzo continúa cuando el ventilador ya ha ciclado.
3. **Trata primero el impulso respiratorio.** Fiebre, acidosis metabólica, dolor y ansiedad aumentan la demanda; controlarlos es parte del tratamiento de la asincronía de flujo (Holanda et al., 2018).
4. **Ajusta la entrega.** Puedes subir el flujo para satisfacer la demanda, pero eso acorta el $T_i$ y puede agravar el doble disparo. Alternativas razonables: alargar el $T_i$ (por ejemplo con una pausa inspiratoria breve en VCV) o pasar a un modo de presión, que deja que el flujo aumente con el esfuerzo (Holanda et al., 2018; MacIntyre et al., 1997).
5. **Vigila el volumen real.** En un modo de presión, el volumen corriente ya no está garantizado: un esfuerzo intenso puede producir volúmenes altos. El apilamiento fue menos frecuente con volúmenes programados mayores (Pohlman et al., 2008), pero el volumen debe mantenerse dentro de los límites protectores que se estudian en «VILI y ventilación protectora».
6. **Si persiste en SDRA grave temprano.** La sedación profunda y el bloqueo neuromuscular figuran entre las opciones para el doble disparo que no responde a los ajustes (Holanda et al., 2018); su uso sistemático es debatido y se analiza en la lección de SDRA.

**Evolución.** Con antipiréticos, corrección de la causa de la acidosis y un cambio a presión controlada con $T_i$ de 0,9 s, la concavidad desaparece y los dobles disparos se vuelven ocasionales; el volumen corriente se mantiene entre 330 y 380 mL.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y:

1. En VCV, cambia el flujo inspiratorio (o el tiempo inspiratorio, según el parámetro que ofrezca la consola) y observa cómo varía el tiempo inspiratorio y la forma de la curva de presión.
2. Pasa a PCV con un nivel de presión equivalente y compara la curva de flujo (ahora desacelerada) y el volumen corriente resultante.
3. Abre después [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) en PSV y observa cómo el flujo inspiratorio decrece lentamente, prolongando la inspiración, y cómo el flujo espiratorio no llega a cero.

<!-- block: EXERCISE | Preguntas -->
**1.** Un paciente con EPOC en presión de soporte 14 cmH₂O, ETS 25 %, muestra al final de cada inspiración un pico de presión por encima del nivel programado y contracción abdominal. ¿Qué asincronía es y qué ajustas?

*Respuesta:* **ciclado tardío**. La constante de tiempo larga hace que el flujo tarde en caer al 25 %. Sube el criterio de ciclado, por ejemplo al 40-50 % (Holanda et al., 2018); en pacientes obstructivos un ETS más alto redujo el retraso del ciclado (Tassaux et al., 2005).

**2.** Una paciente con fibrosis pulmonar en presión de soporte presenta, al inicio de la espiración, una deflexión del flujo hacia cero y ocasionales dobles disparos. ¿Qué ajuste corresponde?

*Respuesta:* **ciclado prematuro** por mecánica restrictiva. Baja el porcentaje del criterio de ciclado o sube la presión de soporte para prolongar la inspiración (Holanda et al., 2018), y vigila el volumen corriente.

**3.** En VCV ves una curva de presión cóncava. Un colega propone subir la sensibilidad del trigger. ¿Ayuda?

*Respuesta:* no. El trigger actúa al inicio del ciclo; la concavidad indica que el flujo es insuficiente durante toda la inspiración. Reduce la demanda y ajusta el flujo o el modo.
<!-- page: sintesis-flujo-ciclado | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Tras el disparo, el ciclo puede fallar en la entrega (flujo insuficiente o excesivo) o en el ciclado (prematuro o tardío).
- En VCV, el esfuerzo del paciente se resta de la presión en la vía aérea: la concavidad de la curva de presión es el signo del hambre de flujo.
- En modos de presión, el esfuerzo se traduce en más flujo y volumen: responden mejor a la demanda (MacIntyre et al., 1997), pero el volumen corriente deja de estar garantizado.
- El ciclado prematuro se ve como una deflexión del flujo espiratorio hacia cero; el ciclado tardío, como un pico de presión al final de la inspiración con caída brusca del flujo.
- En presión de soporte, la obstrucción prolonga la inspiración; subir el criterio de ciclado la acorta (Tassaux et al., 2005; Chiumello et al., 2007).
- El doble disparo apila volúmenes y puede superar con creces el volumen programado incluso con sedación profunda (Pohlman et al., 2008).
- Cada corrección tiene un efecto secundario: más flujo acorta el $T_i$, más $T_i$ reduce el tiempo espiratorio. Reevalúa siempre tras cada cambio.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Confundir hambre de flujo con un problema de trigger** → la concavidad aparece durante toda la inspiración, no al inicio → ajusta el flujo o el modo y reduce la demanda.
- **Subir el flujo sin mirar el tiempo inspiratorio** → $T_i$ más corto puede provocar ciclado prematuro y doble disparo → comprueba el inicio de la espiración tras el cambio o alarga el $T_i$.
- **Cambiar a un modo de presión y no vigilar el volumen** → un esfuerzo intenso puede generar volúmenes no protectores → fija alarmas de volumen y revisa el volumen espirado.
- **Dejar el criterio de ciclado por defecto en el paciente obstructivo** → el flujo cae lentamente y la inspiración se prolonga, con más auto-PEEP → valora un porcentaje de ciclado más alto.
- **Atribuir el volumen doble a un error del monitor** → puede ser un doble disparo con apilamiento real → mira las curvas de volumen y flujo y busca dos ciclos con espiración mínima.
- **Tratar la asincronía solo con sedación** → no corrige la causa y aumenta los riesgos de la sedación profunda → corrige primero la demanda y los ajustes (Holanda et al., 2018).

<!-- block: REFERENCES | Referencias -->
- Chiumello, D., Polli, F., Tallarini, F., Chierichetti, M., Motta, G., Azzari, S., Colombo, R., Rech, R., Pelosi, P., Raimondi, F., & Gattinoni, L. (2007). Effect of different cycling-off criteria and positive end-expiratory pressure during pressure support ventilation in patients with chronic obstructive pulmonary disease. *Critical Care Medicine, 35*(11), 2547-2552. [https://doi.org/10.1097/01.ccm.0000287594.80110.34](https://doi.org/10.1097/01.ccm.0000287594.80110.34)
- Gentile, M. A. (2011). Cycling of the mechanical ventilator breath. *Respiratory Care, 56*(1), 52-60. [https://doi.org/10.4187/respcare.01088](https://doi.org/10.4187/respcare.01088)
- Georgopoulos, D., Prinianakis, G., & Kondili, E. (2006). Bedside waveforms interpretation as a tool to identify patient-ventilator asynchronies. *Intensive Care Medicine, 32*(1), 34-47. [https://doi.org/10.1007/s00134-005-2828-5](https://doi.org/10.1007/s00134-005-2828-5)
- Gilstrap, D., & MacIntyre, N. (2013). Patient-ventilator interactions. Implications for clinical management. *American Journal of Respiratory and Critical Care Medicine, 188*(9), 1058-1068. [https://doi.org/10.1164/rccm.201212-2214CI](https://doi.org/10.1164/rccm.201212-2214CI)
- Holanda, M. A., Vasconcelos, R. D. S., Ferreira, J. C., & Pinheiro, B. V. (2018). Patient-ventilator asynchrony. *Jornal Brasileiro de Pneumologia, 44*(4), 321-333. [https://doi.org/10.1590/S1806-37562017000000185](https://doi.org/10.1590/S1806-37562017000000185)
- MacIntyre, N. R., McConnell, R., Cheng, K. C., & Sane, A. (1997). Patient-ventilator flow dyssynchrony: Flow-limited versus pressure-limited breaths. *Critical Care Medicine, 25*(10), 1671-1677. [https://doi.org/10.1097/00003246-199710000-00016](https://doi.org/10.1097/00003246-199710000-00016)
- Pohlman, M. C., McCallister, K. E., Schweickert, W. D., Pohlman, A. S., Nigos, C. P., Krishnan, J. A., Charbeneau, J. T., Gehlbach, B. K., Kress, J. P., & Hall, J. B. (2008). Excessive tidal volume from breath stacking during lung-protective ventilation for acute lung injury. *Critical Care Medicine, 36*(11), 3019-3023. [https://doi.org/10.1097/CCM.0b013e31818b308b](https://doi.org/10.1097/CCM.0b013e31818b308b)
- Tassaux, D., Gainnier, M., Battisti, A., & Jolliet, P. (2005). Impact of expiratory trigger setting on delayed cycling and inspiratory muscle workload. *American Journal of Respiratory and Critical Care Medicine, 172*(10), 1283-1289. [https://doi.org/10.1164/rccm.200407-880OC](https://doi.org/10.1164/rccm.200407-880OC)
