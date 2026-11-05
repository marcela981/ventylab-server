<!-- page: que-protege-cada-modo | THEORY | Qué variable protege cada modo -->
<!-- block: INTRODUCTION | Por qué importa la elección del modo -->
En el nivel Principiante aprendiste a programar la ventilación controlada por volumen (VCV) y la ventilación controlada por presión (PCV). En el paciente complejo (obesidad, SDRA, abdomen a tensión, broncoespasmo, cambios frecuentes de posición) la pregunta ya no es cómo se programa cada modo, sino **qué ocurre con cada uno cuando la mecánica del paciente cambia sin avisar**.

La idea central de esta lección es sencilla y tiene consecuencias prácticas: un ventilador solo puede controlar una variable a la vez durante la inspiración. La que eliges queda fija y la otra queda libre, a merced de la compliance, de la resistencia y del esfuerzo del paciente. Elegir un modo es elegir qué variable quieres proteger y cuál vas a vigilar con las alarmas y con tu propia lectura de la pantalla.

<!-- block: THEORY | Variable controlada y variable dependiente -->
### En VCV el volumen es la variable independiente

Programas el volumen corriente (Vt), el flujo inspiratorio (y su forma) y la frecuencia. El ventilador entrega ese volumen respiración tras respiración. Lo que **no** controlas es la presión necesaria para lograrlo: la presión pico y la presión meseta son el resultado de la mecánica del sistema respiratorio en ese momento.

Si la compliance cae (atelectasia, edema, distensión abdominal, intubación selectiva) o la resistencia sube (secreciones, broncoespasmo, tubo acodado), el Vt sigue siendo el mismo y **la presión sube**. Esa subida es una señal clínica valiosa: la pantalla te avisa de inmediato de que algo cambió. El riesgo es que, si nadie la mira o la alarma de presión alta está mal ajustada, la presión alveolar puede alcanzar niveles lesivos.

### En PCV la presión es la variable independiente

Programas la presión inspiratoria (sobre la PEEP), el tiempo inspiratorio y la frecuencia. El ventilador mantiene esa presión en la vía aérea durante todo el tiempo inspiratorio, y el flujo es el que haga falta para sostenerla: alto al inicio y decreciente después.

Lo que **no** controlas es el Vt. Si la compliance cae o la resistencia sube, la misma presión mueve **menos volumen**. La presión en la vía aérea parece tranquilizadora, pero la ventilación minuto puede caer y la PaCO₂ subir de forma silenciosa. A la inversa, si la compliance mejora (por ejemplo, tras aspirar secreciones o al resolverse el edema), el Vt crece sin que hayas tocado nada y puede superar el objetivo protector.

![Cuatro gráficos comparan VCV y PCV ante una caída de la compliance de 50 a 25 mL/cmH₂O: en VCV la presión pico sube de 20 a 30 y la meseta de 15 a 25 cmH₂O con el volumen fijo en 500 mL; en PCV la presión es igual pero el volumen cae de unos 430 a unos 245 mL](/learning/diagrams/i1-vcv-pcv-cambio-mecanica.svg "Figura: la misma caída de compliance se ve en la presión (VCV) o en el volumen (PCV)")

<!-- block: THEORY | El esfuerzo del paciente cambia las reglas -->
Todo lo anterior supone un paciente pasivo. Cuando el paciente hace esfuerzos inspiratorios, la presión que distiende el pulmón ya no es solo la que genera el ventilador: se suma la presión que generan sus músculos.

- **En PCV con esfuerzo**, la caída de la presión pleural que produce el paciente aumenta la presión transpulmonar y el ventilador entrega más flujo para mantener su presión. El Vt puede crecer mucho y no tiene un techo programado. La presión en la vía aérea no lo refleja: la meseta "aparente" puede ser normal mientras el pulmón recibe un estiramiento alto.
- **En VCV con esfuerzo**, el volumen sí tiene techo, pero si el flujo programado es menor que el que el paciente demanda aparece el **hambre de flujo**: la curva de presión se hunde durante la inspiración y el trabajo respiratorio aumenta. Si el esfuerzo continúa más allá del final del ciclo puede producirse un doble disparo, que entrega dos volúmenes casi seguidos.

Por eso ningún modo protege por sí solo al paciente con impulso respiratorio alto. Este problema se retoma en las lecciones de PSV y de asincronías; aquí basta con retener que la elección del modo no sustituye al tratamiento de la causa del impulso (dolor, acidosis, hipoxemia, fiebre, sedación inadecuada).

<!-- block: CALLOUT:info | Idea para recordar -->
VCV convierte los cambios de mecánica en cambios de **presión**; PCV los convierte en cambios de **volumen**. Ninguna de las dos variables deja de importar: la que el modo no fija es la que tú tienes que vigilar.

<!-- page: ecuacion-y-calculo | EXERCISE | Fórmulas y cálculo: predecir la respuesta a un cambio de mecánica -->
<!-- block: THEORY | La ecuación del movimiento aplicada a cada modo -->
La ecuación del movimiento (lección "La ecuación del movimiento") describe la presión que hay que aplicar al sistema respiratorio pasivo en cada instante de la inspiración:

$$
P_{aw}(t) = \frac{V(t)}{C_{rs}} + R_{aw}\cdot\dot{V}(t) + PEEP_{total}
$$

Símbolos y unidades:

| Símbolo | Significado | Unidad |
|---|---|---|
| $P_{aw}$ | Presión en la vía aérea | cmH₂O |
| $V$ | Volumen insuflado por encima del volumen de fin de espiración | L |
| $C_{rs}$ | Compliance del sistema respiratorio | L/cmH₂O |
| $R_{aw}$ | Resistencia de la vía aérea y del tubo | cmH₂O/L/s |
| $\dot{V}$ | Flujo | L/s |
| $PEEP_{total}$ | PEEP programada más auto-PEEP | cmH₂O |

#### En VCV con flujo constante

El flujo y el volumen están fijados, así que la ecuación se resuelve para la presión. Al final de la inspiración, con flujo todavía presente, obtienes la presión pico; durante la pausa, sin flujo, la presión meseta:

$$
P_{pico} = PEEP + \frac{V_t}{C_{rs}} + R_{aw}\cdot\dot{V} \qquad P_{plat} = PEEP + \frac{V_t}{C_{rs}}
$$

La driving pressure es la parte de la presión que distiende el sistema respiratorio:

$$
\Delta P = P_{plat} - PEEP = \frac{V_t}{C_{rs}}
$$

#### En PCV en el paciente pasivo

La presión aplicada por encima de la PEEP ($\Delta P_{insp}$) está fijada y el volumen se llena de forma exponencial con la constante de tiempo $\tau = R_{aw}\cdot C_{rs}$ (en segundos):

$$
V_t = \Delta P_{insp}\cdot C_{rs}\cdot\left(1 - e^{-T_i/\tau}\right)
$$

Si el tiempo inspiratorio ($T_i$) es largo respecto de $\tau$ (más de unas 3 constantes de tiempo), el flujo llega a cero antes de que termine la inspiración y el Vt se aproxima a $\Delta P_{insp}\cdot C_{rs}$. En ese caso la presión programada equivale a la driving pressure.

<!-- block: EXERCISE | Ejemplo resuelto: la misma caída de compliance en los dos modos -->
Paciente pasivo con $R_{aw} = 10\,\text{cmH}_2\text{O/L/s}$, PEEP $5\,\text{cmH}_2\text{O}$ y compliance inicial $C_{rs} = 50\,\text{mL/cmH}_2\text{O}$ ($0{,}05\,\text{L/cmH}_2\text{O}$). Frecuencia 20/min. Por una distensión abdominal la compliance cae a $25\,\text{mL/cmH}_2\text{O}$.

#### Escenario VCV: Vt 500 mL, flujo constante 30 L/min (0,5 L/s)

1. Componente elástico inicial: $0{,}5 / 0{,}05 = 10\,\text{cmH}_2\text{O}$. Pplat $= 5 + 10 = 15\,\text{cmH}_2\text{O}$.
2. Componente resistivo: $10 \times 0{,}5 = 5\,\text{cmH}_2\text{O}$. Ppico $= 15 + 5 = 20\,\text{cmH}_2\text{O}$.
3. Con la compliance baja: componente elástico $0{,}5 / 0{,}025 = 20\,\text{cmH}_2\text{O}$; Pplat $= 25$; Ppico $= 30\,\text{cmH}_2\text{O}$.
4. La driving pressure pasa de 10 a 20 cmH₂O. El Vt y la ventilación minuto ($0{,}5 \times 20 = 10\,\text{L/min}$) no cambian.

#### Escenario PCV: 10 cmH₂O sobre PEEP (presión total 15), Ti 1 s

1. Constante de tiempo inicial: $\tau = 10 \times 0{,}05 = 0{,}5\,\text{s}$; $T_i/\tau = 2$; $1 - e^{-2} \approx 0{,}865$.
2. Vt $= 10 \times 50 \times 0{,}865 \approx 432\,\text{mL}$. Ventilación minuto $\approx 0{,}432 \times 20 \approx 8{,}6\,\text{L/min}$.
3. Con la compliance baja: $\tau = 10 \times 0{,}025 = 0{,}25\,\text{s}$; $T_i/\tau = 4$; $1 - e^{-4} \approx 0{,}982$.
4. Vt $= 10 \times 25 \times 0{,}982 \approx 245\,\text{mL}$. Ventilación minuto $\approx 4{,}9\,\text{L/min}$: cae a poco más de la mitad.

#### Qué te enseña el ejemplo

En VCV el problema aparece en la pantalla como una subida de 10 cmH₂O en la Pplat y en la Ppico; si la alarma de presión alta estaba ajustada de forma individual, cerca de la Ppico habitual del paciente, sonará. En PCV la pantalla de presión no cambia; lo que cambia es el Vt espirado y la ventilación minuto, y solo te enterarás a tiempo si las alarmas de **Vt bajo** y **VE baja** están ajustadas cerca del valor objetivo y no en los límites de fábrica.

Observa también un detalle: al bajar la compliance, la constante de tiempo se acorta y el llenado en PCV es más completo (98 % frente a 87 %). Por eso el Vt no cae exactamente a la mitad. Con resistencias altas ocurre lo contrario: la constante de tiempo se alarga, el flujo no llega a cero al final de la inspiración y el Vt depende mucho del Ti programado.

<!-- block: CALLOUT:tip | Comprueba tu cálculo en la cabecera -->
En PCV puedes saber si el flujo llega a cero al final de la inspiración mirando la curva de flujo. Si llega a cero, la presión programada se iguala a la presión alveolar y una pausa inspiratoria mostrará una meseta muy parecida a la presión inspiratoria. Si no llega a cero, la presión alveolar final es menor que la programada y la ΔP real es menor que la que lees en la pantalla.

<!-- page: evidencia-comparativa | THEORY | Qué dice la evidencia comparativa -->
<!-- block: THEORY | Ensayos y revisiones en insuficiencia respiratoria y SDRA -->
Durante años se sostuvo que el flujo desacelerado de la PCV mejoraba la distribución del gas y la oxigenación, y que limitar la presión protegía mejor el pulmón. La evidencia comparativa no ha confirmado esas ventajas en resultados clínicos.

- Un ensayo aleatorizado español en 79 pacientes con SDRA, con presión meseta limitada a 35 cmH₂O en ambos grupos, encontró mayor mortalidad hospitalaria con VCV (78 % frente a 51 %). Sin embargo, el grupo VCV desarrolló más fallos orgánicos extrapulmonares, y en el análisis multivariado los factores asociados a mortalidad fueron esos fallos y la insuficiencia renal, **no el modo** (Esteban et al., 2000).
- Una revisión Cochrane que reunió tres ensayos con 1089 pacientes con lesión pulmonar aguda o SDRA concluyó que los datos no permiten confirmar ni descartar una ventaja de un modo sobre otro; el riesgo relativo de mortalidad hospitalaria con PCV fue 0,83 con un intervalo de confianza que incluía el 1 (0,67 a 1,02) (Chacko et al., 2015).
- Una revisión sistemática con base fisiológica de 34 estudios no encontró diferencias entre PCV y VCV en compliance, intercambio gaseoso, hemodinamia, trabajo respiratorio ni resultados clínicos; los autores concluyen que la elección puede quedar abierta mientras se respeten los principios de protección (Rittayamai et al., 2015).

Lo que sí ha demostrado reducir la mortalidad en el SDRA es **cuánto** volumen y presión recibe el pulmón, no el modo con el que se entrega. La ventilación con Vt de 6 mL/kg de peso predicho y presión meseta de 30 cmH₂O o menos redujo la mortalidad frente a 12 mL/kg (31,0 % frente a 39,8 %) (ARDS Network, 2000). La guía ATS/ESICM/SCCM recomienda de forma fuerte limitar el Vt a 4-8 mL/kg de peso predicho y la presión meseta por debajo de 30 cmH₂O (Fan et al., 2017). En un análisis de 3562 pacientes de nueve ensayos, la driving pressure fue la variable ventilatoria más asociada a la supervivencia: cada incremento de una desviación estándar (unos 7 cmH₂O) se asoció a un riesgo relativo de muerte de 1,41 (Amato et al., 2015).

<!-- block: THEORY | Evidencia en anestesia: el estudio de 109 360 pacientes -->
En ventilación intraoperatoria, un análisis retrospectivo de 109 360 adultos en tres hospitales de Massachusetts encontró más complicaciones pulmonares posoperatorias tras PCV que tras VCV (odds ratio ajustada 1,29; IC 95 % 1,21-1,37). Con PCV el Vt y la driving pressure fueron más variables entre pacientes (Bagchi et al., 2017).

Lee este resultado con cuidado: es un estudio observacional, no un ensayo aleatorizado. La elección del modo no fue al azar y puede haber factores de confusión no medidos. Su interpretación más prudente es que **la variabilidad no vigilada del Vt** que permite la PCV puede ser un problema real cuando nadie la controla, y no que la PCV sea dañina por sí misma.

<!-- block: THEORY | Cómo decidir en la práctica -->
Con esta evidencia, el criterio razonable es funcional: elige el modo que te permita sostener mejor la meta protectora en ese paciente y con ese equipo, y vigila activamente la variable que queda libre.

![Diagrama de decisión: primero se define la meta protectora; si hay esfuerzo inspiratorio intenso ningún modo basta y hay que tratar la causa y medir; si no, VCV fija el volumen y la presión delata el cambio, y PCV fija la presión y el volumen delata el cambio, cada uno con sus alarmas](/learning/diagrams/i1-vcv-pcv-decision.svg "Figura: elegir el modo según la variable que quieres fijar y la que vas a vigilar")

- **Prefiere VCV** cuando necesitas un Vt estable y medible de forma fiable: SDRA con Vt ajustado al peso predicho, mecánica cambiante (abdomen, posición, cirugía laparoscópica, obesidad) o cuando quieres medir Pplat y ΔP de forma estandarizada con una pausa inspiratoria.
- **Prefiere PCV** cuando limitar la presión inspiratoria máxima es la prioridad, cuando hay fugas que impiden asegurar el volumen (fístula broncopleural, tubo sin balón) o cuando el patrón de flujo variable mejora la comodidad de un paciente que dispara, siempre con alarmas de Vt y VE ajustadas.
- **En el paciente con obesidad**, la pared torácica rígida y la presión abdominal hacen que la mecánica cambie con la posición. Las recomendaciones de expertos insisten en Vt de 6 mL/kg de peso predicho, PEEP moderada o alta y posición semisentada o en Trendelenburg inverso, sin preferir un modo concreto (De Jong et al., 2020).

<!-- block: CALLOUT:warning | La evidencia es limitada -->
Los ensayos que comparan modos son pocos, pequeños y antiguos, y muchos se hicieron antes de la ventilación protectora actual. No hay un ensayo grande que demuestre que un modo reduce la mortalidad frente al otro cuando ambos se usan con los mismos límites de volumen y presión. Desconfía de cualquier afirmación categórica de superioridad de uno de los dos.

<!-- page: caso-sdra-obesidad | CASE_STUDY | Aplicación clínica: SDRA en una paciente con obesidad -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
#### Presentación

Mujer de 54 años, talla 160 cm, peso 115 kg (IMC 44,9 kg/m²). Ingresa en la UCI por neumonía bilateral con SDRA moderado. Sedada y adaptada, sin esfuerzos espontáneos. Programación al ingreso: VCV, Vt 320 mL, flujo 45 L/min, FR 26/min, PEEP 12 cmH₂O, FiO₂ 0,6.

Mediciones con pausa inspiratoria: Ppico 33 cmH₂O, Pplat 26 cmH₂O. Gasometría: pH 7,31, PaCO₂ 52 mmHg, PaO₂ 78 mmHg.

#### Paso 1: comprueba que el Vt es protector

El peso predicho de una mujer se calcula con la fórmula usada en el ensayo ARDSNet (ARDS Network, 2000): $45{,}5 + 0{,}91 \times (160 - 152{,}4) = 45{,}5 + 6{,}9 \approx 52{,}4\,\text{kg}$. El Vt de 320 mL equivale a $320 / 52{,}4 \approx 6{,}1\,\text{mL/kg}$ de peso predicho: correcto. Si se hubiera usado el peso real (115 kg), 6 mL/kg serían 690 mL, más del doble de lo que el pulmón de esta paciente puede recibir.

#### Paso 2: calcula la mecánica

- $\Delta P = 26 - 12 = 14\,\text{cmH}_2\text{O}$.
- $C_{rs} = 320 / 14 \approx 23\,\text{mL/cmH}_2\text{O}$.
- Diferencia Ppico − Pplat $= 7\,\text{cmH}_2\text{O}$ con un flujo de 0,75 L/s: $R \approx 9{,}3\,\text{cmH}_2\text{O/L/s}$, razonable para un tubo de adulto.

#### Paso 3: un cambio de mecánica a las 3 de la madrugada

Tras un cambio de sábanas la paciente queda en decúbito supino plano. La alarma de presión alta suena: Ppico 39 y Pplat 31 cmH₂O. El Vt sigue siendo 320 mL. ΔP ahora es 19 cmH₂O y la $C_{rs}$ cae a unos 17 mL/cmH₂O.

En VCV el cambio fue visible al instante. Si la paciente hubiera estado en PCV con la misma presión de distensión (14 cmH₂O sobre PEEP), el Vt habría caído a aproximadamente $14 \times 17 \approx 240\,\text{mL}$, la ventilación minuto habría bajado de 8,3 a unos 6,2 L/min y la PaCO₂, ya elevada, habría seguido subiendo, posiblemente sin ninguna alarma si los límites de Vt bajo estaban en valores de fábrica.

#### Paso 4: busca la causa antes de tocar el ventilador

Descarta primero lo urgente (tubo desplazado o acodado, secreciones, neumotórax) con la exploración y la auscultación. Luego atiende la causa más probable: en la obesidad, el decúbito supino plano desplaza el contenido abdominal hacia el tórax y endurece la pared torácica. Colocar a la paciente semisentada o en Trendelenburg inverso es una medida de primera línea (De Jong et al., 2020). Al incorporarla, la Pplat vuelve a 27 cmH₂O.

#### Paso 5: interpreta la Pplat con prudencia

En la obesidad una parte importante de la Pplat puede corresponder a la pared torácica y no al pulmón. Una Pplat algo por encima de 30 cmH₂O no significa necesariamente sobredistensión pulmonar, pero tampoco lo descarta. Para separar ambos componentes hace falta la presión esofágica (lección "Presión esofágica y presión transpulmonar"). Sin esa medición, mantener el Vt en 6 mL/kg de peso predicho y vigilar la ΔP es lo más seguro.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y prueba lo siguiente:

1. En VCV con Vt ajustado al peso predicho, haz una pausa inspiratoria y calcula ΔP y $C_{rs}$ con los valores del monitor.
2. Cambia a PCV y busca la presión inspiratoria que entrega un Vt parecido. Observa que la curva de flujo pasa a ser desacelerada y que el Vt espirado ahora es un valor que vigilar, no un valor programado.
3. En PCV, sube la PEEP sin tocar la presión inspiratoria total: verás que la presión de distensión disminuye y el Vt cae. Repite el cambio en VCV y observa que el Vt se mantiene mientras la meseta sube.
4. Vigila la PaCO₂ y el pH durante unos minutos: una caída de la ventilación minuto en PCV se traduce en hipercapnia progresiva.

<!-- block: EXERCISE | Preguntas -->
1. **Un paciente pasivo en PCV con 15 cmH₂O sobre una PEEP de 8 tiene un Vt de 450 mL y el flujo llega a cero antes del final de la inspiración. Tras aspirar abundantes secreciones y resolverse una atelectasia, el Vt sube a 620 mL. ¿Qué ha ocurrido y qué haces?**
   Respuesta: la compliance ha mejorado (de unos 30 a unos 41 mL/cmH₂O). Con la presión fija, el Vt aumenta. Si 620 mL supera el objetivo de mL/kg de peso predicho, reduce la presión inspiratoria hasta recuperar el Vt objetivo. En VCV este cambio se habría visto como una caída de la Pplat.
2. **En VCV, la Ppico sube de 28 a 40 cmH₂O y la Pplat se mantiene en 20. ¿Compliance o resistencia?**
   Respuesta: aumentó la diferencia Ppico − Pplat con la Pplat estable, lo que indica un aumento de la resistencia (secreciones, broncoespasmo, tubo acodado o mordido), no de la rigidez pulmonar.
3. **¿Por qué una alarma de Vt bajo con su límite de fábrica puede no proteger a un paciente en PCV?**
   Respuesta: porque los límites amplios solo saltan con caídas muy grandes. Una caída del Vt de 400 a 280 mL reduce la ventilación alveolar de forma relevante y puede no activar un límite inferior fijado, por ejemplo, en 150 mL. Ajusta las alarmas de Vt y VE en relación con los valores objetivo del paciente.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Cada modo fija una variable durante la inspiración: VCV fija el volumen y PCV fija la presión. La otra depende de la compliance, la resistencia y el esfuerzo del paciente.
- En VCV un empeoramiento de la mecánica se ve como una subida de Ppico y Pplat; en PCV se ve como una caída del Vt y de la ventilación minuto.
- En PCV, $V_t = \Delta P_{insp}\cdot C_{rs}\cdot(1 - e^{-T_i/\tau})$: el Vt depende también del tiempo inspiratorio cuando la constante de tiempo es larga.
- La evidencia comparativa no demuestra diferencias de mortalidad entre modos en insuficiencia respiratoria aguda o SDRA (Chacko et al., 2015; Rittayamai et al., 2015). Lo que reduce la mortalidad es limitar Vt y presión (ARDS Network, 2000; Fan et al., 2017).
- En anestesia, la PCV se asoció a más complicaciones pulmonares y a mayor variabilidad del Vt en un gran estudio observacional (Bagchi et al., 2017): una asociación, no una prueba de causalidad.
- Con esfuerzo inspiratorio intenso ningún modo protege por sí solo: en PCV el Vt no tiene techo y en VCV aparece el hambre de flujo.
- En el paciente con obesidad la mecánica cambia con la posición; Vt por peso predicho, PEEP adecuada y posición incorporada son más importantes que el modo (De Jong et al., 2020).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Creer que PCV es protectora porque limita la presión** → la presión en la vía aérea no limita el Vt cuando la compliance mejora o el paciente hace esfuerzos → vigila el Vt espirado en mL/kg de peso predicho y ajusta la presión.
- **Dejar las alarmas de Vt y VE en valores de fábrica en PCV** → la hipoventilación progresiva no las activa → ajústalas cerca de los valores objetivo del paciente.
- **Bajar el Vt en VCV sin mirar la frecuencia** → la ventilación minuto cae y aparece hipercapnia → recalcula la VE y compensa con la FR vigilando la auto-PEEP.
- **Interpretar una Pplat alta en obesidad siempre como sobredistensión pulmonar** → una parte puede ser presión de la pared torácica → corrige la posición, mantén el Vt protector y considera la presión esofágica.
- **Cambiar de modo para "arreglar" una presión alta sin buscar la causa** → el problema (tubo, secreciones, neumotórax, abdomen) persiste y solo cambia la variable en la que se manifiesta → evalúa al paciente antes de tocar el ventilador.
- **Calcular el Vt con el peso real** → en la obesidad duplica el volumen adecuado → usa siempre el peso predicho por talla y sexo.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network (ARDS Network). (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Bagchi, A., Rudolph, M. I., Ng, P. Y., Timm, F. P., Long, D. R., Shaefi, S., Ladha, K., Vidal Melo, M. F., & Eikermann, M. (2017). The association of postoperative pulmonary complications in 109,360 patients with pressure-controlled or volume-controlled ventilation. *Anaesthesia, 72*(11), 1334-1343. [https://doi.org/10.1111/anae.14039](https://doi.org/10.1111/anae.14039)
- Chacko, B., Peter, J. V., Tharyan, P., John, G., & Jeyaseelan, L. (2015). Pressure-controlled versus volume-controlled ventilation for acute respiratory failure due to acute lung injury (ALI) or acute respiratory distress syndrome (ARDS). *Cochrane Database of Systematic Reviews*, (1), CD008807. [https://doi.org/10.1002/14651858.CD008807.pub2](https://doi.org/10.1002/14651858.CD008807.pub2)
- De Jong, A., Wrigge, H., Hedenstierna, G., Gattinoni, L., Chiumello, D., Frat, J.-P., Ball, L., Schetz, M., Pickkers, P., & Jaber, S. (2020). How to ventilate obese patients in the ICU. *Intensive Care Medicine, 46*(12), 2423-2435. [https://doi.org/10.1007/s00134-020-06286-x](https://doi.org/10.1007/s00134-020-06286-x)
- Esteban, A., Alía, I., Gordo, F., de Pablo, R., Suarez, J., González, G., & Blanco, J. (2000). Prospective randomized trial comparing pressure-controlled ventilation and volume-controlled ventilation in ARDS. *Chest, 117*(6), 1690-1696. [https://doi.org/10.1378/chest.117.6.1690](https://doi.org/10.1378/chest.117.6.1690)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., Adhikari, N. K. J., Amato, M. B. P., Branson, R., Brower, R. G., Ferguson, N. D., Gajic, O., Gattinoni, L., Hess, D., Mancebo, J., Meade, M. O., McAuley, D. F., Pesenti, A., Ranieri, V. M., . . . Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Rittayamai, N., Katsios, C. M., Beloncle, F., Friedrich, J. O., Mancebo, J., & Brochard, L. (2015). Pressure-controlled vs volume-controlled ventilation in acute respiratory failure: A physiology-based narrative and systematic review. *Chest, 148*(2), 340-355. [https://doi.org/10.1378/chest.14-3169](https://doi.org/10.1378/chest.14-3169)
