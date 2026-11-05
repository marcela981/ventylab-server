<!-- page: mecanismo-cpap | THEORY | Qué hace la presión positiva continua -->
<!-- block: INTRODUCTION | Por qué importa la CPAP -->
La presión positiva continua en la vía aérea (CPAP) es la forma más simple de presión positiva: mantiene la misma presión durante todo el ciclo respiratorio, en inspiración y en espiración, mientras el paciente respira por sí mismo. No entrega respiraciones ni añade presión durante la inspiración. Aun así, tiene efectos fisiológicos potentes y ha demostrado beneficio clínico en situaciones frecuentes: el edema pulmonar cardiogénico, la hipoxemia posoperatoria y la apnea obstructiva del sueño.

La CPAP se usa en dos contextos que conviene distinguir:

- **No invasiva**, con mascarilla nasal, oronasal, facial total o casco (helmet), mediante un generador de flujo o un ventilador.
- **Invasiva**, como modo del ventilador en un paciente intubado o traqueostomizado que respira espontáneamente, habitualmente durante el destete. En muchos ventiladores equivale a la PSV con un soporte de cero.

<!-- block: THEORY | La CPAP desplaza la línea de base -->
Con CPAP el paciente hace todo el trabajo inspiratorio: su respiración oscila alrededor de una presión de base elevada en lugar de alrededor de la presión atmosférica. Un buen sistema de CPAP mantiene esas oscilaciones pequeñas; si la presión cae mucho durante la inspiración, el flujo del sistema es insuficiente para la demanda del paciente y su trabajo aumenta.

![Gráfico de presión en la vía aérea frente al tiempo: sin CPAP la presión oscila alrededor de cero; con CPAP de 8 cmH₂O la misma oscilación ocurre alrededor de 8 cmH₂O](/learning/diagrams/i2-cpap-presion-tiempo.svg "Figura: la CPAP eleva la presión de base; el patrón respiratorio lo pone el paciente")

<!-- block: THEORY | Efectos respiratorios -->
### Aumenta la capacidad residual funcional

La presión positiva al final de la espiración mantiene abiertos alvéolos y vías aéreas pequeñas que tienden a cerrarse cuando el volumen pulmonar es bajo: tras una anestesia general, en decúbito supino, con distensión abdominal o en la obesidad. Al aumentar el volumen de fin de espiración (la capacidad residual funcional, CRF) mejora la relación ventilación-perfusión y disminuye el cortocircuito intrapulmonar, por lo que suele subir la PaO₂ sin cambiar la FiO₂ (Hess & Kacmarek, 2019).

### Mejora la compliance y reduce el trabajo respiratorio

Cuando la CRF es baja, el pulmón respira en la parte inferior y plana de su curva presión-volumen: cada centímetro de agua de presión transpulmonar mueve poco volumen y el paciente tiene que generar grandes cambios de presión pleural. Al subir la CRF, la respiración se desplaza a la zona más empinada de la curva, de mayor compliance, y el mismo esfuerzo mueve más volumen. Si la presión es excesiva, el pulmón llega a la parte superior de la curva, se aplana de nuevo y aparece sobredistensión.

![Curva presión-volumen sigmoidea: sin CPAP, una variación de presión transpulmonar de 5 cmH₂O en la parte baja de la curva mueve poco volumen; con CPAP, la misma variación en la parte empinada mueve más; arriba la curva se aplana (sobredistensión)](/learning/diagrams/i2-cpap-curva-pv.svg "Figura: la CPAP desplaza la respiración a la zona de mayor compliance")

### Actúa como férula neumática de la vía aérea superior

En la apnea obstructiva del sueño (AOS), la faringe se colapsa durante el sueño. La presión positiva mantiene la faringe abierta desde dentro, como una férula de aire. Este fue el principio del tratamiento con CPAP nasal de la AOS y sigue siendo su base (Patil et al., 2019).

### Contrarresta la auto-PEEP

En el paciente con limitación al flujo espiratorio (EPOC) y auto-PEEP, cada inspiración debe empezar por reducir la presión alveolar desde la auto-PEEP hasta la presión de la vía aérea antes de que entre aire. Esa es una **carga umbral**. Una presión externa moderada, menor que la auto-PEEP, reduce esa carga sin aumentar necesariamente la hiperinsuflación (Hess & Kacmarek, 2019). La lección "Auto-PEEP e hiperinflación dinámica" profundiza en ello.

<!-- block: THEORY | Efectos cardiovasculares -->
La presión positiva aumenta la presión pleural media. Esto tiene dos efectos opuestos que debes conocer (Hess & Kacmarek, 2019):

- **Reduce el retorno venoso** (precarga). En un paciente hipovolémico puede bajar el gasto cardíaco y la presión arterial.
- **Reduce la poscarga del ventrículo izquierdo**: el ventrículo tiene que generar menos presión transmural para eyectar la sangre, porque la presión que lo rodea es mayor. En el corazón insuficiente y sobrecargado de volumen este efecto es beneficioso y explica, junto con la reducción del trabajo respiratorio, la utilidad de la CPAP en el edema pulmonar cardiogénico.

<!-- page: calculos-cpap | THEORY | Fórmulas y cálculo: presiones que cambian con la CPAP -->
<!-- block: THEORY | Presión transpulmonar y presión transmural -->
Para razonar sobre la CPAP necesitas dos presiones "de diferencia", que expresan lo que realmente distiende una estructura: la presión dentro menos la presión fuera.

$$
P_{tp} = P_{alv} - P_{pl}
$$

$$
P_{tm,VI} = P_{VI} - P_{pl}
$$

| Símbolo | Significado | Unidad |
|---|---|---|
| $P_{tp}$ | Presión transpulmonar (distiende el pulmón) | cmH₂O |
| $P_{alv}$ | Presión alveolar (igual a la de la vía aérea cuando no hay flujo) | cmH₂O |
| $P_{pl}$ | Presión pleural (se estima con la presión esofágica) | cmH₂O |
| $P_{tm,VI}$ | Presión transmural del ventrículo izquierdo durante la eyección (representa su poscarga) | mmHg |
| $P_{VI}$ | Presión intraventricular sistólica (aproximadamente la presión arterial sistólica) | mmHg |

Recuerda que 1 cmH₂O equivale a unos 0,74 mmHg; para sumar presiones del tórax a presiones vasculares conviértelas a la misma unidad.

<!-- block: EQUATION | Carga umbral por auto-PEEP con presión externa -->
P_{umbral} = PEEP_{i} - CPAP \quad (\text{si}\ CPAP < PEEP_{i})

<!-- block: EXERCISE | Ejemplo resuelto -->
#### Parte A: poscarga del ventrículo izquierdo

Paciente con edema pulmonar cardiogénico, presión arterial sistólica 150 mmHg y gran esfuerzo inspiratorio: durante la inspiración la presión pleural cae a $-20\,\text{cmH}_2\text{O}$ ($\approx -15\,\text{mmHg}$).

1. Sin CPAP, presión transmural sistólica del VI en inspiración: $150 - (-15) = 165\,\text{mmHg}$. Las grandes caídas de presión pleural aumentan la poscarga.
2. Con CPAP, el esfuerzo disminuye y la presión pleural media sube. Supón que la presión pleural inspiratoria pasa a $-4\,\text{cmH}_2\text{O}$ ($\approx -3\,\text{mmHg}$): $150 - (-3) = 153\,\text{mmHg}$.
3. La poscarga efectiva baja unos 12 mmHg sin ningún fármaco. Los valores son ilustrativos: lo importante es el sentido del cambio.

#### Parte B: carga umbral en un paciente con EPOC

Paciente con auto-PEEP de $8\,\text{cmH}_2\text{O}$ que respira espontáneamente.

1. Sin presión externa, cada inspiración empieza con una carga umbral de 8 cmH₂O: los músculos deben generar esa presión antes de que entre aire. Si el paciente está conectado a un ventilador, ningún disparo por presión o por flujo se producirá hasta superarla.
2. Con una CPAP de $5\,\text{cmH}_2\text{O}$: $P_{umbral} = 8 - 5 = 3\,\text{cmH}_2\text{O}$. La carga se reduce en más de la mitad.
3. Si la CPAP se sube por encima de la auto-PEEP, deja de compensar una carga y empieza a añadir volumen al pulmón ya hiperinsuflado. La presión externa debe quedar por debajo de la auto-PEEP medida.

#### Parte C: lectura de la presión en la pantalla

Un paciente intubado en CPAP de $6\,\text{cmH}_2\text{O}$ sin soporte muestra caídas de presión hasta $3\,\text{cmH}_2\text{O}$ durante cada inspiración. Esa caída de 3 cmH₂O indica que el sistema no acompaña la demanda o que el tubo endotraqueal impone una resistencia importante: el paciente trabaja contra el tubo. Un pequeño nivel de soporte o un disparo más sensible pueden ser necesarios, según el objetivo de la prueba.

<!-- block: CALLOUT:info | Qué no hace la CPAP -->
La CPAP no aumenta la ventilación alveolar por sí misma: no añade presión en inspiración. Si el problema principal es la hipercapnia por fatiga o por bajo impulso, necesitas un modo con soporte inspiratorio (ventilación no invasiva con dos niveles de presión o ventilación invasiva), no solo CPAP.

<!-- page: indicaciones-evidencia | THEORY | Indicaciones y evidencia -->
<!-- block: THEORY | Edema pulmonar cardiogénico -->
Es la indicación con evidencia más sólida. La guía ERS/ATS de ventilación no invasiva recomienda de forma fuerte, con certeza moderada, usar CPAP o ventilación no invasiva con dos niveles de presión en la insuficiencia respiratoria aguda por edema pulmonar cardiogénico (Rochwerg et al., 2017).

El ensayo 3CPO, con 1069 pacientes, aporta un matiz importante: la ventilación no invasiva (CPAP de 5 a 15 cmH₂O o dos niveles de presión) mejoró más rápido la disnea, la frecuencia cardíaca, la acidosis y la hipercapnia que el oxígeno convencional, pero **no redujo la mortalidad a 7 días** (9,5 % frente a 9,8 %). No hubo diferencias entre CPAP y dos niveles de presión en muerte o intubación (Gray et al., 2008). La CPAP es, por tanto, una forma de aliviar rápido el distrés mientras actúa el tratamiento médico.

<!-- block: THEORY | Hipoxemia posoperatoria -->
Tras una cirugía abdominal mayor, la anestesia, el dolor, el decúbito y la distensión abdominal reducen la CRF y favorecen las atelectasias. En un ensayo multicéntrico de 209 pacientes con hipoxemia grave tras cirugía abdominal electiva, añadir CPAP con casco al oxígeno redujo la tasa de intubación (1 % frente a 10 %) y la incidencia de neumonía, infección y sepsis (Squadrone et al., 2005). En ese ensayo se usó una CPAP de 7,5 cmH₂O con FiO₂ de 0,5.

La guía ERS/ATS sugiere, de forma condicional, ventilación no invasiva en la insuficiencia respiratoria aguda posoperatoria (Rochwerg et al., 2017). En el paciente con obesidad, la ventilación no invasiva se considera de primera línea en la insuficiencia respiratoria posoperatoria y se aconseja también como medida profiláctica tras la extubación (De Jong et al., 2020).

<!-- block: THEORY | Apnea obstructiva del sueño y período perioperatorio -->
La guía de la American Academy of Sleep Medicine recomienda de forma fuerte la presión positiva para tratar la AOS en adultos con somnolencia excesiva, y CPAP o CPAP autoajustable para el tratamiento continuado (Patil et al., 2019).

En el período perioperatorio, el paciente con AOS tiene un riesgo que se prolonga más allá de la sala de recuperación. En un estudio con polisomnografía antes y después de la cirugía, el índice de apnea-hipopnea aumentó tras la cirugía tanto en pacientes con AOS como sin ella, y el pico se produjo en la **tercera noche** posoperatoria, mientras que la alteración de la arquitectura del sueño (con menos sueño REM) fue máxima en la primera noche (Chung et al., 2014). Que un paciente esté estable en las primeras horas no garantiza que lo esté cuando ya ha salido de la unidad monitorizada.

<!-- block: THEORY | Otras situaciones -->
- **Insuficiencia respiratoria hipoxémica por COVID-19**: en el ensayo RECOVERY-RS, una estrategia inicial con CPAP redujo el desenlace combinado de intubación o muerte a 30 días frente al oxígeno convencional (36,3 % frente a 44,4 %), con más efectos adversos (Perkins et al., 2022). El ensayo se detuvo antes de tiempo y hubo cruces entre grupos, lo que obliga a interpretarlo con prudencia.
- **Destete**: la CPAP invasiva sin soporte puede usarse en la prueba de ventilación espontánea (lección "Prueba de ventilación espontánea y extubación").

<!-- block: CALLOUT:warning | Cuándo la CPAP no es suficiente o es peligrosa -->
- Disminución del nivel de conciencia o incapacidad para proteger la vía aérea, vómitos o hemorragia digestiva alta.
- Inestabilidad hemodinámica grave o hipovolemia no corregida (la caída del retorno venoso puede precipitar hipotensión).
- Hipercapnia progresiva: la CPAP no aumenta la ventilación.
- Neumotórax no drenado, cirugía reciente de vía aérea superior, esófago o estómago sin valoración del equipo quirúrgico.
- Ausencia de mejoría en la primera hora: retrasar la intubación cuando la CPAP fracasa expone al paciente a una intubación de mayor riesgo.

<!-- page: caso-postoperatorio | CASE_STUDY | Aplicación clínica: hipoxemia tras una laparotomía -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
#### Presentación

Mujer de 61 años, IMC 41 kg/m², primer día tras una laparotomía por oclusión intestinal. Ronca intensamente según su familia, pero nunca se ha estudiado una posible AOS. Está despierta, colaboradora y con buen control del dolor con analgesia epidural.

Con mascarilla Venturi a FiO₂ 0,5: SpO₂ 88 %, FR 28/min, uso de músculos del cuello. Presión arterial 138/82 mmHg, frecuencia cardíaca 104/min. Gasometría: pH 7,41, PaCO₂ 39 mmHg, PaO₂ 62 mmHg. Radiografía: atelectasias bibasales, sin neumotórax ni derrame importante.

#### Paso 1: clasifica la insuficiencia respiratoria

$PaO_2/FiO_2 = 62 / 0{,}5 = 124\,\text{mmHg}$: hipoxemia grave. La PaCO₂ es normal: el problema es de oxigenación (cortocircuito por atelectasias), no de ventilación. Es el escenario en el que la CPAP actúa mejor.

#### Paso 2: verifica que no hay contraindicaciones

Conciencia normal, sin vómitos, hemodinamia estable, sin hipercapnia, sin neumotórax. La cirugía es abdominal, no esofágica ni gástrica alta. Comenta la indicación con el equipo quirúrgico.

#### Paso 3: inicia la CPAP

- Incorpora a la paciente: sentada o semisentada, para reducir la presión del abdomen sobre el diafragma (De Jong et al., 2020).
- Usa una interfaz bien adaptada (casco o mascarilla oronasal) y comienza con un nivel de presión similar al que mostró beneficio en la hipoxemia posoperatoria, 7,5 cmH₂O con FiO₂ 0,5 (Squadrone et al., 2005), ajustando después según la respuesta y la tolerancia.
- Vigila la SpO₂ de forma continua, la FR, el esfuerzo, la presión arterial y la distensión abdominal.

#### Paso 4: evalúa la respuesta en la primera hora

A los 60 minutos: SpO₂ 95 %, FR 20/min, sin uso de músculos accesorios. Gasometría con FiO₂ 0,5: PaO₂ 98 mmHg, PaCO₂ 38 mmHg. $PaO_2/FiO_2 = 196\,\text{mmHg}$. Ha mejorado: la CPAP ha reabierto parte del pulmón colapsado. Puedes plantear reducir la FiO₂ con meta de SpO₂ y mantener la presión.

Si en lugar de mejorar hubiera aparecido somnolencia, hipercapnia, agotamiento o inestabilidad, la decisión correcta habría sido la intubación sin demora.

#### Paso 5: planifica las noches siguientes

La sospecha de AOS no estudiada y el uso de opioides elevan el riesgo de eventos obstructivos en los días posteriores, con un pico en la tercera noche (Chung et al., 2014). Antes de trasladarla a una unidad sin monitorización continua, deja documentado el riesgo, la necesidad de vigilar la oximetría por la noche y la posibilidad de continuar con presión positiva durante el sueño.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y prueba lo siguiente:

1. Selecciona el modo CPAP con una presión baja y observa la curva de presión: las oscilaciones del paciente ocurren alrededor de la presión de base, sin ciclos con presión añadida.
2. Sube la CPAP de forma escalonada y observa la SpO₂ y la PaO₂: con más presión de base suele mejorar la oxigenación.
3. Fíjate en la presión arterial media y la frecuencia cardíaca al subir mucho la presión: la reducción del retorno venoso puede hacerse visible.
4. Compara con PSV (lección "Ventilación con presión de soporte"): con soporte, la presión sube en cada inspiración y el Vt aumenta; con CPAP, no.

<!-- block: EXERCISE | Preguntas -->
1. **Un paciente con EPOC en exacerbación tiene pH 7,25 y PaCO₂ 70 mmHg. ¿Es la CPAP el tratamiento de elección?**
   Respuesta: no. El problema principal es ventilatorio y la CPAP no añade presión en inspiración. Está indicada la ventilación no invasiva con dos niveles de presión (lección "Ventilación en la exacerbación de EPOC").
2. **¿Por qué la CPAP puede ser útil en el edema pulmonar cardiogénico aunque no reduzca la mortalidad a corto plazo?**
   Respuesta: porque mejora rápidamente la disnea, la acidosis y la hipercapnia (Gray et al., 2008) al reabrir alvéolos inundados, reducir el trabajo respiratorio y disminuir la poscarga del ventrículo izquierdo, lo que da tiempo a que actúe el tratamiento médico.
3. **Un paciente hipovolémico tras una hemorragia se vuelve hipotenso al iniciar CPAP. ¿Por qué?**
   Respuesta: el aumento de la presión pleural reduce el retorno venoso y, con poco volumen intravascular, cae el gasto cardíaco. Reduce la presión, trata la hipovolemia y reevalúa la indicación.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La CPAP mantiene la misma presión en todo el ciclo: eleva la línea de base, pero no añade presión en inspiración ni aumenta la ventilación por sí misma.
- Aumenta la CRF, reabre unidades colapsadas, mejora la compliance y la oxigenación y reduce el trabajo respiratorio (Hess & Kacmarek, 2019).
- Disminuye la poscarga del ventrículo izquierdo y el retorno venoso: es beneficiosa en el corazón sobrecargado y peligrosa en la hipovolemia.
- En el edema pulmonar cardiogénico la guía ERS/ATS la recomienda de forma fuerte (Rochwerg et al., 2017), aunque el ensayo 3CPO no mostró menor mortalidad a 7 días (Gray et al., 2008).
- En la hipoxemia tras cirugía abdominal, la CPAP redujo la intubación del 10 % al 1 % en un ensayo aleatorizado (Squadrone et al., 2005).
- En la AOS la presión positiva es el tratamiento recomendado (Patil et al., 2019), y en el posoperatorio los eventos obstructivos alcanzan su máximo en la tercera noche (Chung et al., 2014).
- Frente a la auto-PEEP, una presión externa menor que la auto-PEEP reduce la carga umbral del disparo.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Usar CPAP para tratar la hipercapnia aguda** → no añade presión inspiratoria ni aumenta la ventilación → usa ventilación no invasiva con dos niveles o ventilación invasiva.
- **Insistir con la CPAP cuando no hay mejoría** → retrasar la intubación aumenta su riesgo → define antes de empezar los criterios de fracaso y reevalúa en la primera hora.
- **Aplicar CPAP sin valorar la volemia** → la caída del retorno venoso puede causar hipotensión → vigila presión arterial y frecuencia cardíaca y corrige la hipovolemia.
- **Ignorar fugas e intolerancia a la interfaz** → la presión real es menor que la programada y el paciente abandona el tratamiento → elige la interfaz adecuada, ajústala y revisa la presión medida.
- **Considerar seguro al paciente con AOS porque está estable en recuperación** → los eventos obstructivos aumentan en las noches siguientes → planifica la monitorización y la presión positiva durante el sueño.
- **Subir la CPAP por encima de la auto-PEEP en el paciente con EPOC** → añade hiperinsuflación en lugar de reducir la carga → mantén la presión externa por debajo de la auto-PEEP medida.

<!-- block: REFERENCES | Referencias -->
- Chung, F., Liao, P., Yegneswaran, B., Shapiro, C. M., & Kang, W. (2014). Postoperative changes in sleep-disordered breathing and sleep architecture in patients with obstructive sleep apnea. *Anesthesiology, 120*(2), 287-298. [https://doi.org/10.1097/ALN.0000000000000040](https://doi.org/10.1097/ALN.0000000000000040)
- De Jong, A., Wrigge, H., Hedenstierna, G., Gattinoni, L., Chiumello, D., Frat, J.-P., Ball, L., Schetz, M., Pickkers, P., & Jaber, S. (2020). How to ventilate obese patients in the ICU. *Intensive Care Medicine, 46*(12), 2423-2435. [https://doi.org/10.1007/s00134-020-06286-x](https://doi.org/10.1007/s00134-020-06286-x)
- Gray, A., Goodacre, S., Newby, D. E., Masson, M., Sampson, F., & Nicholl, J. (2008). Noninvasive ventilation in acute cardiogenic pulmonary edema. *New England Journal of Medicine, 359*(2), 142-151. [https://doi.org/10.1056/NEJMoa0707992](https://doi.org/10.1056/NEJMoa0707992)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Patil, S. P., Ayappa, I. A., Caples, S. M., Kimoff, R. J., Patel, S. R., & Harrod, C. G. (2019). Treatment of adult obstructive sleep apnea with positive airway pressure: An American Academy of Sleep Medicine clinical practice guideline. *Journal of Clinical Sleep Medicine, 15*(2), 335-343. [https://doi.org/10.5664/jcsm.7640](https://doi.org/10.5664/jcsm.7640)
- Perkins, G. D., Ji, C., Connolly, B. A., Couper, K., Lall, R., Baillie, J. K., Bradley, J. M., Dark, P., Dave, C., De Soyza, A., Dennis, A. V., Devrell, A., Fairbairn, S., Ghani, H., Gorman, E. A., Green, C. A., Hart, N., Hee, S. W., Kimbley, Z., . . . McAuley, D. F. (2022). Effect of noninvasive respiratory strategies on intubation or mortality among patients with acute hypoxemic respiratory failure and COVID-19: The RECOVERY-RS randomized clinical trial. *JAMA, 327*(6), 546-558. [https://doi.org/10.1001/jama.2022.0028](https://doi.org/10.1001/jama.2022.0028)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., & Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Squadrone, V., Coha, M., Cerutti, E., Schellino, M. M., Biolino, P., Occella, P., Belloni, G., Vilianis, G., Fiore, G., Cavallo, F., Ranieri, V. M., & Piedmont Intensive Care Units Network (PICUN). (2005). Continuous positive airway pressure for treatment of postoperative hypoxemia: A randomized controlled trial. *JAMA, 293*(5), 589-595. [https://doi.org/10.1001/jama.293.5.589](https://doi.org/10.1001/jama.293.5.589)
