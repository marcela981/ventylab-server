<!-- page: conceptos-modos-adaptativos | THEORY | Volumen objetivo con presión adaptativa -->
<!-- block: INTRODUCTION | Por qué importa -->
Los ventiladores modernos ofrecen modos que prometen "lo mejor de los dos mundos": la entrega de flujo de un modo de presión, con su flujo desacelerado y variable, y la garantía de volumen de un modo de volumen. Se comercializan con nombres distintos (PRVC, VC+, AutoFlow, volumen garantizado, entre otros) y en muchos servicios son el modo de inicio por defecto. Bien entendidos, ahorran ajustes manuales cuando la mecánica del paciente cambia. Mal entendidos, pueden retirar soporte justo cuando el paciente más lo necesita o dejar pasar volúmenes mayores que el objetivo protector.

En esta lección aprenderás qué hace realmente el algoritmo, qué variable queda protegida y cuál no, y verás una introducción a otro modo de presión con un concepto distinto, la ventilación con liberación de presión (APRV).

<!-- block: THEORY | Qué significa "modo dual" o "adaptativo" -->
El término "modo dual" se usó durante años para cosas muy distintas, lo que generó confusión. La taxonomía de Chatburn propone describir cada modo por su variable de control, su secuencia de ciclos y su **esquema de objetivo** (*targeting scheme*). En los modos que aquí nos interesan, la variable de control es la **presión**: dentro de cada ciclo, el ventilador aplica una presión inspiratoria constante, igual que en PCV o PSV. Lo que cambia es que esa presión no la fija el operador, sino un algoritmo que la ajusta de un ciclo al siguiente para acercar el volumen corriente a un valor objetivo. Chatburn llama a esto **objetivo adaptativo** (Chatburn et al., 2014; Mireles-Cabodevila et al., 2013).

Esta precisión tiene consecuencias prácticas:

- Dentro de un ciclo el comportamiento es el de un modo de presión: flujo desacelerado, que aumenta si el paciente inspira con más fuerza.
- El volumen objetivo no se garantiza ciclo a ciclo; se persigue **en promedio** a lo largo de varios ciclos.
- Existen versiones con ciclos mandatorios (por ejemplo, PRVC o VC+ en A/C) y versiones espontáneas, ciclada por flujo, que equivalen a una PSV con volumen objetivo (por ejemplo, el *volume support*).

<!-- block: THEORY | Cómo trabaja el algoritmo -->
Aunque cada fabricante tiene su propia implementación, la lógica general es la siguiente (Branson y Chatburn, 2007; Mireles-Cabodevila et al., 2013):

1. Al iniciar el modo, el ventilador entrega uno o varios ciclos de prueba y estima la compliance a partir del volumen obtenido con la presión aplicada.
2. Calcula la presión que, con esa compliance, debería producir el volumen objetivo y la aplica en el ciclo siguiente.
3. En cada ciclo compara el volumen espirado con el objetivo. Si quedó corto, sube la presión; si se pasó, la baja. Los cambios se hacen en escalones pequeños, cuyo tamaño máximo depende del equipo, para evitar oscilaciones.
4. La presión nunca sobrepasa un límite superior que tú programas (normalmente unos cmH₂O por debajo de la alarma de alta presión) ni baja de la PEEP. Si el volumen objetivo no puede alcanzarse sin superar ese límite, el equipo alarma.

![Esquema de doce ciclos en un modo de volumen objetivo con presión adaptativa: tras una caída de la compliance, el volumen baja y la presión sube en escalones hasta recuperarlo; cuando el paciente hace un esfuerzo intenso, el volumen supera el objetivo y el ventilador reduce la presión](/learning/diagrams/i3-duales-prvc-ajuste.svg "Figura: ajuste adaptativo de la presión ciclo a ciclo")

<!-- block: THEORY | El punto débil: el esfuerzo intenso -->
El algoritmo no distingue por qué cambió el volumen. Si la compliance mejora (por ejemplo, tras aspirar secreciones), bajar la presión es correcto. Pero si el volumen sube porque el paciente, con hambre de aire, inspira con mucha fuerza, el ventilador interpreta el volumen alto como "sobra soporte" y **reduce la presión**. El resultado es que el trabajo respiratorio pasa al paciente justo cuando su demanda aumenta, lo que puede perpetuar la taquipnea y la fatiga (Branson y Chatburn, 2007).

El segundo problema es que, con esfuerzo intenso, el volumen corriente puede superar el objetivo aunque la presión baje hasta la PEEP, porque la presión muscular del paciente se suma a la del ventilador. En un estudio cruzado en 14 pacientes con lesión pulmonar aguda o SDRA y volumen objetivo protector, PRVC y PCV no redujeron el trabajo respiratorio frente a VCV con flujo alto de 75 L/min, y en el 40 % de los pacientes el volumen superó claramente el objetivo protector en PRVC y PCV (Kallet et al., 2005). En otras palabras, el modo adaptativo no "garantiza" el volumen en un paciente que respira con fuerza.

<!-- page: calculo-modos-adaptativos | EXERCISE | La presión que busca el algoritmo -->
<!-- block: THEORY | Relación entre presión, compliance y volumen -->
En un paciente pasivo, con flujo que llega a cero al final de la inspiración, el volumen que produce un modo de presión depende de la presión por encima de la PEEP y de la compliance del sistema respiratorio:

$$
V_T = C_{rs}\cdot\left(P_{insp} - PEEP\right)
$$

Por eso la presión que el algoritmo busca para un volumen objetivo es:

$$
P_{insp} - PEEP = \frac{V_{T,obj}}{C_{rs}}
$$

Donde:

- $V_T$ y $V_{T,obj}$: volumen corriente entregado y volumen objetivo (mL).
- $C_{rs}$: compliance del sistema respiratorio estimada por el ventilador (mL/cmH₂O).
- $P_{insp}$: presión inspiratoria total en la vía aérea (cmH₂O); algunos equipos muestran la presión por encima de la PEEP.
- $PEEP$: presión positiva al final de la espiración (cmH₂O).

Si el tiempo inspiratorio es corto y el flujo no llega a cero, el volumen real será menor que el que predice la fórmula, porque el pulmón no tiene tiempo de equilibrarse con la presión aplicada.

Cuando hay esfuerzo del paciente, la ecuación del movimiento añade la presión muscular ($P_{mus}$), y el volumen ya no depende solo de la presión del ventilador:

$$
V_T \approx C_{rs}\cdot\left(P_{insp} - PEEP + P_{mus}\right)
$$

<!-- block: EXERCISE | Ejemplo resuelto -->
Un hombre de 1,75 m está en un modo de volumen objetivo con presión adaptativa. El volumen objetivo es de 420 mL, la PEEP de 8 cmH₂O y el límite superior de presión de 30 cmH₂O.

**1. Situación inicial.** El ventilador estima una compliance de 35 mL/cmH₂O.

$$
P_{insp} - PEEP = \frac{420}{35} = 12\;\text{cmH}_2\text{O} \quad\Rightarrow\quad P_{insp} = 20\;\text{cmH}_2\text{O}
$$

**2. La compliance cae** a 21 mL/cmH₂O (por ejemplo, por un tapón mucoso o atelectasia). Con la presión anterior, el volumen sería:

$$
V_T = 21 \cdot 12 = 252\;\text{mL}
$$

El algoritmo sube la presión en escalones hasta:

$$
P_{insp} - PEEP = \frac{420}{21} = 20\;\text{cmH}_2\text{O} \quad\Rightarrow\quad P_{insp} = 28\;\text{cmH}_2\text{O}
$$

Está a 2 cmH₂O del límite. Si la compliance sigue empeorando, el ventilador no podrá alcanzar el objetivo y alarmará. El aumento de presión es una **señal clínica**: algo cambió en el paciente y debes buscarlo.

**3. El paciente inspira con fuerza.** Con la compliance inicial (35 mL/cmH₂O) y una presión muscular estimada de 8 cmH₂O, con $P_{insp}$ de 20 cmH₂O:

$$
V_T \approx 35 \cdot (12 + 8) = 700\;\text{mL}
$$

El algoritmo bajará la presión en los ciclos siguientes. Aun en el extremo de que la presión baje hasta la PEEP, el volumen seguiría siendo de alrededor de $35 \cdot 8 = 280$ mL solo por el esfuerzo, y el paciente recibiría muy poca ayuda. La conducta no es "dejar que el modo lo resuelva", sino evaluar la causa de la demanda (dolor, ansiedad, acidosis, fiebre, hipoxemia) y considerar un modo en el que el soporte no disminuya con el esfuerzo.

<!-- page: aprv-introduccion | THEORY | APRV: una introducción -->
<!-- block: THEORY | Qué es APRV -->
La ventilación con liberación de presión en la vía aérea (APRV) parte de una idea diferente. En lugar de entregar ciclos inspiratorios sobre una PEEP baja, mantiene al paciente casi todo el tiempo en un nivel de **presión alta** (P alta) durante un **tiempo alto** largo, como si fuera una CPAP elevada que favorece el reclutamiento y la oxigenación. Periódicamente, la presión cae a un nivel bajo (P baja) durante un **tiempo bajo** muy breve: esa "liberación" permite que salga un volumen de gas y, con él, CO₂. El paciente puede respirar de forma espontánea en cualquier momento, sobre todo durante la fase de presión alta, gracias a válvulas que permiten el flujo en ambos sentidos (Kallet, 2011).

![Curva de presión en APRV: presión alta durante un tiempo largo con pequeñas ondulaciones por respiraciones espontáneas, interrumpida por liberaciones breves y periódicas a presión baja](/learning/diagrams/i3-duales-aprv.svg "Figura: patrón de presión en APRV")

En la taxonomía, APRV es un modo de control por presión con secuencia IMV: las liberaciones son ciclos mandatorios "invertidos" y las respiraciones sobre P alta son espontáneas (Chatburn et al., 2014).

<!-- block: THEORY | Variables que se programan -->
- **P alta:** determina la presión media y, con ella, gran parte de la oxigenación.
- **T alto:** suele ocupar la mayor parte del ciclo, lo que produce una relación I:E muy invertida.
- **P baja:** presión durante la liberación.
- **T bajo:** muy corto; en muchos protocolos se programa observando la curva de flujo espiratorio para terminar la liberación antes de que el flujo llegue a cero, con lo que se genera una PEEP intrínseca intencional que mantiene el volumen pulmonar.

Las fórmulas útiles son las de cualquier patrón de dos niveles:

$$
f_{lib} = \frac{60}{T_{alto} + T_{bajo}}
$$

$$
\bar{P}_{aw} \approx \frac{P_{alta}\cdot T_{alto} + P_{baja}\cdot T_{bajo}}{T_{alto} + T_{bajo}}
$$

Por ejemplo, con P alta de 26 cmH₂O, T alto de 4,5 s, P baja de 5 cmH₂O y T bajo de 0,5 s: $f_{lib} = 60/5 = 12$ liberaciones/min y $\bar{P}_{aw} \approx (26\cdot 4{,}5 + 5\cdot 0{,}5)/5 \approx 23{,}9$ cmH₂O. La presión media es mucho mayor que en una ventilación convencional con la misma presión meseta, lo que explica el efecto sobre la oxigenación y también el riesgo hemodinámico.

<!-- block: CALLOUT:warning | Evidencia limitada y protocolos muy distintos -->
Los protocolos publicados de APRV difieren mucho en cómo se programan P baja y T bajo, por lo que "APRV" no es una intervención única (Kallet, 2011). En un ensayo unicéntrico con 138 pacientes con SDRA, la APRV precoz (P alta igual a la última presión meseta sin superar 30 cmH₂O, P baja de 5 cmH₂O y T bajo ajustado para terminar la liberación cuando el flujo espiratorio cayera al 50 % o más de su pico) aumentó los días libres de ventilación frente a la ventilación con volumen bajo; la diferencia en mortalidad en UCI (19,7 % frente a 34,3 %) no alcanzó significación estadística (Zhou et al., 2017). Un metaanálisis de siete ensayos con 412 pacientes encontró menor mortalidad y mejor oxigenación con APRV, pero sus autores subrayan que el número de pacientes es pequeño y que se necesitan ensayos multicéntricos más grandes (Lim y Litton, 2019). Con esta evidencia, la APRV es una opción que exige experiencia del equipo y un protocolo local; no reemplaza la ventilación protectora estándar.

<!-- page: aplicacion-clinica-adaptativos | CASE_STUDY | Modos adaptativos en la cabecera -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 58 años, 1,70 m (peso predicho de unos 66 kg), con SDRA moderado por neumonía. Está en PRVC (A/C) con volumen objetivo de 400 mL, aproximadamente 6 mL/kg de peso predicho, el volumen que usó el ensayo ARDSNet (ARDS Network, 2000). PEEP 10 cmH₂O, FiO₂ 0,6, frecuencia programada 24/min, límite superior de presión 30 cmH₂O.

**Hora 0.** Sedación profunda. La presión inspiratoria que aplica el ventilador es de 24 cmH₂O y el volumen espirado coincide con el objetivo. Con pausa inspiratoria, la presión meseta es de 24 cmH₂O, dentro del límite de 30 cmH₂O usado en ese ensayo (ARDS Network, 2000).

**Hora 6.** Se redujo la sedación. El paciente está agitado, con frecuencia total de 34/min. El volumen espirado oscila entre 520 y 650 mL y la presión inspiratoria del ventilador ha bajado a 14 cmH₂O.

**Razonamiento paso a paso.**

1. **¿Por qué bajó la presión?** No por mejoría de la compliance, sino porque el esfuerzo del paciente aumentó el volumen y el algoritmo respondió quitando soporte.
2. **¿Está protegido el pulmón?** No. El volumen real está muy por encima de 6 mL/kg de peso predicho; el modo no puede limitarlo porque la fuerza viene del paciente (Kallet et al., 2005).
3. **¿Y el paciente?** Recibe menos ayuda con más demanda: el trabajo respiratorio aumenta y la frecuencia sube.
4. **¿Qué haces?** Evalúas y tratas la causa del esfuerzo (dolor, delirium, hipoxemia, acidosis, asincronía), ajustas analgesia y sedación según objetivos, y valoras un modo en el que el volumen quede limitado o el soporte no se retire con el esfuerzo. Documentas el hallazgo: una presión adaptativa que cae mientras el volumen sube es una alarma clínica, aunque el ventilador no suene.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
El simulador no incluye modos adaptativos, pero puedes reproducir a mano lo que hace el algoritmo. Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y elige PCV:

- Ajusta la presión inspiratoria hasta que el volumen corriente se acerque al objetivo protector; anota la presión necesaria.
- Si la compliance del paciente cambia durante el caso, observa cómo cae el volumen con la misma presión y corrígela como lo haría un modo adaptativo.
- Cambia a VCV con el mismo volumen y compara: ahora el volumen queda fijo y es la presión la que varía cuando cambia la mecánica.

<!-- block: EXERCISE | Preguntas -->
**1.** En PRVC, la presión inspiratoria sube de 18 a 27 cmH₂O en una hora sin cambios de programación. ¿Qué significa?

*Respuesta:* Que el algoritmo necesita más presión para el mismo volumen: la compliance bajó o la resistencia subió (secreciones, atelectasia, neumotórax, intubación selectiva, broncoespasmo). Es un signo de deterioro que debes investigar.

**2.** ¿Por qué un modo adaptativo puede empeorar la fatiga de un paciente con hambre de aire?

*Respuesta:* Porque interpreta el volumen alto que genera el esfuerzo como exceso de soporte y reduce la presión, de modo que el paciente hace más trabajo (Branson y Chatburn, 2007).

**3.** Con P alta de 28 cmH₂O, T alto de 5,4 s, P baja de 5 cmH₂O y T bajo de 0,6 s, ¿cuál es la frecuencia de liberación?

*Respuesta:* $60/(5{,}4 + 0{,}6) = 10$ liberaciones/min.

<!-- page: sintesis-modos-adaptativos | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- PRVC, VC+ y modos similares controlan la presión dentro de cada ciclo y ajustan esa presión ciclo a ciclo para perseguir un volumen objetivo (Chatburn et al., 2014).
- El volumen se alcanza en promedio, no se garantiza en cada ciclo; la presión está acotada por el límite superior que programas.
- Un aumento progresivo de la presión que aplica el algoritmo indica empeoramiento de la mecánica y debe investigarse.
- Con esfuerzo intenso, el algoritmo reduce el soporte y el volumen puede superar el objetivo protector (Kallet et al., 2005; Branson y Chatburn, 2007).
- APRV mantiene una presión alta prolongada con liberaciones breves y permite la respiración espontánea; su presión media es elevada (Kallet, 2011).
- La evidencia de APRV en SDRA es prometedora pero procede de ensayos pequeños con protocolos heterogéneos (Zhou et al., 2017; Lim y Litton, 2019).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Creer que PRVC "garantiza" el volumen** → el volumen se persigue en promedio y puede superarse con esfuerzo intenso → mide el volumen espirado real y calcula los mL/kg de peso predicho.
- **Ignorar que la presión del algoritmo sube** → el ventilador compensa en silencio el deterioro hasta llegar al límite → vigila la tendencia de la presión inspiratoria y mide la meseta cuando cambie.
- **Programar un límite superior de presión muy alto** → el algoritmo podrá aplicar presiones lesivas antes de alarmar → fija el límite según tus objetivos de presión meseta y driving pressure.
- **Responder al volumen alto por esfuerzo dejando que el modo baje la presión** → el paciente se fatiga → trata la causa de la demanda y valora otro modo o ajustes de sedación y analgesia.
- **Usar APRV sin protocolo ni experiencia** → los ajustes de T bajo y P baja determinan el volumen y la PEEP intrínseca, y un error puede causar hipoventilación o sobredistensión → aplícala solo con un protocolo local y vigilancia estrecha de volumen, gasometría y hemodinamia.

<!-- block: REFERENCES | Referencias -->
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Branson, R. D., & Chatburn, R. L. (2007). Should adaptive pressure control modes be utilized for virtually all patients receiving mechanical ventilation? *Respiratory Care, 52*(4), 478-488. [https://doi.org/10.4187/respcare.07520478](https://doi.org/10.4187/respcare.07520478)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Kallet, R. H. (2011). Patient-ventilator interaction during acute lung injury, and the role of spontaneous breathing: Part 2: Airway pressure release ventilation. *Respiratory Care, 56*(2), 190-206. [https://doi.org/10.4187/respcare.00968](https://doi.org/10.4187/respcare.00968)
- Kallet, R. H., Campbell, A. R., Dicker, R. A., Katz, J. A., & Mackersie, R. C. (2005). Work of breathing during lung-protective ventilation in patients with acute lung injury and acute respiratory distress syndrome: A comparison between volume and pressure-regulated breathing modes. *Respiratory Care, 50*(12), 1623-1631. [https://doi.org/10.4187/respcare.05501623](https://doi.org/10.4187/respcare.05501623)
- Lim, J., & Litton, E. (2019). Airway pressure release ventilation in adult patients with acute hypoxemic respiratory failure: A systematic review and meta-analysis. *Critical Care Medicine, 47*(12), 1794-1799. [https://doi.org/10.1097/CCM.0000000000003972](https://doi.org/10.1097/CCM.0000000000003972)
- Mireles-Cabodevila, E., Hatipoğlu, U., & Chatburn, R. L. (2013). A rational framework for selecting modes of ventilation. *Respiratory Care, 58*(2), 348-366. [https://doi.org/10.4187/respcare.01839](https://doi.org/10.4187/respcare.01839)
- Zhou, Y., Jin, X., Lv, Y., Wang, P., Yang, Y., Liang, G., Wang, B., & Kang, Y. (2017). Early application of airway pressure release ventilation may reduce the duration of mechanical ventilation in acute respiratory distress syndrome. *Intensive Care Medicine, 43*(11), 1648-1659. [https://doi.org/10.1007/s00134-017-4912-z](https://doi.org/10.1007/s00134-017-4912-z)
