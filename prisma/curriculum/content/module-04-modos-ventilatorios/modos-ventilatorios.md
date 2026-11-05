<!-- page: conceptos-de-modo | THEORY | Qué es un modo ventilatorio -->
<!-- block: INTRODUCTION | Por qué necesitas un mapa de los modos -->
Cada fabricante de ventiladores bautiza sus modos a su manera. El mismo patrón de entrega puede aparecer como «A/C», «CMV», «IPPV» o «VC» según la marca, y dos modos con nombres casi idénticos pueden comportarse de forma muy distinta frente a un cambio de la mecánica pulmonar. En la práctica clínica esto tiene consecuencias concretas: cuando un paciente llega trasladado desde otro servicio con «PRVC» o «VC+», necesitas saber qué variable protege realmente el equipo, qué ocurrirá si la compliance cae y qué alarma debes vigilar.

Esta lección te da una forma sistemática de responder a esas preguntas. En lugar de memorizar nombres comerciales, aprenderás a describir cualquier modo con tres preguntas: qué controla el ventilador durante la inspiración, qué tipos de ciclo permite y con qué lógica ajusta su objetivo. Este esquema procede de la taxonomía propuesta por Chatburn y colaboradores (Chatburn et al., 2014), actualizada y publicada en español en 2025 (Fajardo-Campoverdi et al., 2025).

<!-- block: THEORY | El ciclo ventilatorio y sus dos fases -->
Un **ciclo** (o respiración) es un pico de flujo positivo (inspiración) asociado a un pico de flujo negativo (espiración), medidos en la vía aérea. Cada ciclo tiene dos eventos que lo delimitan:

- **Disparo (trigger):** el criterio que inicia la inspiración. Puede ser el tiempo (el ventilador inicia el ciclo cuando se cumple el periodo programado) o una señal del paciente (una caída de presión o la aparición de flujo producidas por su esfuerzo).
- **Ciclado (cycle):** el criterio que termina la inspiración y abre la válvula espiratoria. Puede ser el tiempo, el volumen entregado, la caída del flujo o una señal del paciente.

Ya estudiaste las variables de fase en la lección «Variables de fase: disparo, límite y ciclado». Aquí las usarás para definir dos tipos de ciclo que son la base de toda la clasificación (Chatburn et al., 2014):

- **Ciclo espontáneo:** el paciente decide tanto el inicio como el final de la inspiración. El ventilador puede ayudar (presión de soporte) o no ayudar (CPAP sin soporte), pero no impone la duración.
- **Ciclo mandatorio:** el ventilador decide el inicio, el final o ambos. Si el paciente dispara el ciclo pero la máquina lo termina por tiempo o por volumen, el ciclo sigue siendo mandatorio.

Un concepto relacionado es el de **ciclo asistido**: aquel en el que el ventilador realiza parte o todo el trabajo de insuflar el sistema respiratorio (Hess & Kacmarek, 2019). «Asistido» describe quién hace el trabajo; «espontáneo» y «mandatorio» describen quién decide el tiempo. Un ciclo puede ser a la vez espontáneo y asistido (por ejemplo, en presión de soporte).

<!-- block: THEORY | La variable de control: presión o volumen, nunca ambas -->
La ecuación del movimiento del sistema respiratorio, que estudiaste en la lección «La ecuación del movimiento», relaciona la presión que se aplica con el volumen y el flujo que resultan (Tobin, 2013):

$$
P_{aw} + P_{mus} = \frac{V}{C_{rs}} + R_{aw}\cdot\dot{V} + PEEP_{total}
$$

En el lado izquierdo está la presión que mueve el gas (la del ventilador más la de los músculos del paciente); en el lado derecho, la carga que opone el sistema (elástica y resistiva). La idea central de la taxonomía es que **un ventilador solo puede controlar un lado de la ecuación a la vez** (Chatburn et al., 2014). Si controla la presión, el volumen y el flujo quedan determinados por la compliance, la resistencia y el esfuerzo del paciente. Si controla el volumen y el flujo, la presión es la que queda libre.

De ahí sale el primer nivel de la clasificación:

- **Control de volumen (VC):** antes de la inspiración están preestablecidos tanto el volumen corriente como el flujo inspiratorio (Fajardo-Campoverdi et al., 2025). La presión en la vía aérea es el resultado.
- **Control de presión (PC):** está preestablecida la presión inspiratoria (como valor fijo o como una función del esfuerzo del paciente). El volumen y el flujo son el resultado (Fajardo-Campoverdi et al., 2025).

Observa que no basta con que el operador «programe un volumen» para que el modo sea de control de volumen: si el ventilador alcanza ese volumen ajustando la presión de un ciclo a otro, en cada ciclo está controlando la presión. Volverás a este punto al analizar los nombres comerciales.

![Diagrama de tres niveles: variable de control (volumen o presión), secuencia de ciclos (CMV, IMV o CSV) y esquema de control del objetivo (punto fijo, dual, servo, adaptativo, biovariable, óptimo, inteligente), con ejemplos de etiquetas como VC-CMVs, PC-CMVs, PC-CMVa y PC-CSVs y sus nombres comerciales habituales](/learning/diagrams/b5-modos-taxonomia-niveles.svg "Figura: las tres preguntas que clasifican cualquier modo ventilatorio")

<!-- block: CALLOUT:info | Control frente a asistencia -->
En el lenguaje cotidiano se dice «modo controlado» para un paciente sin esfuerzo propio y «modo asistido» cuando el paciente dispara. La taxonomía evita esa ambigüedad: en un modo de ventilación mandatoria continua todos los ciclos son mandatorios, los dispare el reloj o el paciente. Que el paciente dispare cambia la frecuencia real, no el tipo de ciclo.

<!-- page: secuencias-y-patrones | THEORY | Secuencias de ciclos y patrones ventilatorios -->
<!-- block: THEORY | Las tres secuencias de ciclos -->
El segundo nivel de la clasificación responde a la pregunta: ¿qué tipos de ciclo permite el modo? Hay tres posibilidades (Chatburn et al., 2014):

- **CMV, ventilación mandatoria continua:** todos los ciclos son mandatorios. Si el paciente hace un esfuerzo que supera la sensibilidad del trigger, recibe un ciclo mandatorio completo, igual a los disparados por tiempo. Es lo que en la cabecera se suele llamar «asistida/controlada» o «A/C».
- **IMV, ventilación mandatoria intermitente:** se combinan ciclos mandatorios y ciclos espontáneos. Entre los mandatorios, el paciente puede respirar por su cuenta, con o sin presión de soporte. La actualización de 2025 distingue cinco tipos de IMV según cómo se intercalan unos y otros (Fajardo-Campoverdi et al., 2025); la versión más conocida es la SIMV, que estudiarás en «SIMV: principios, usos y limitaciones».
- **CSV, ventilación espontánea continua:** todos los ciclos son espontáneos. El ejemplo típico es la presión de soporte, con o sin CPAP.

![Tres trazados esquemáticos de presión frente al tiempo: CMV con todos los ciclos mandatorios, algunos disparados por el paciente; IMV con ciclos mandatorios grandes intercalados con ciclos espontáneos pequeños; CSV con todos los ciclos espontáneos](/learning/diagrams/b5-modos-secuencias-ciclos.svg "Figura: secuencias de ciclos CMV, IMV y CSV")

<!-- block: THEORY | Cinco patrones posibles, no seis -->
Al combinar la variable de control con la secuencia se obtienen los **patrones ventilatorios**. Con dos variables y tres secuencias cabría esperar seis combinaciones, pero solo hay cinco: VC-CMV, VC-IMV, PC-CMV, PC-IMV y PC-CSV (Chatburn et al., 2014; Fajardo-Campoverdi et al., 2025).

La combinación que falta, VC-CSV, no existe por una razón lógica: si el volumen y el flujo están fijados antes de la inspiración, el ventilador termina el ciclo cuando entrega ese volumen; por tanto, el ciclado lo decide la máquina y el ciclo es mandatorio por definición. Dicho de otro modo, no puede haber ciclos espontáneos en control de volumen (Fajardo-Campoverdi et al., 2025).

| Patrón | Qué fija el ventilador | Tipos de ciclo | Nombre de cabecera frecuente |
|---|---|---|---|
| VC-CMV | Vt y flujo | Solo mandatorios | A/C por volumen, VCV |
| VC-IMV | Vt y flujo en los mandatorios | Mandatorios y espontáneos | SIMV por volumen |
| PC-CMV | Presión inspiratoria | Solo mandatorios | A/C por presión, PCV |
| PC-IMV | Presión inspiratoria | Mandatorios y espontáneos | SIMV por presión, BIPAP o APRV en algunos equipos |
| PC-CSV | Presión (soporte o CPAP) | Solo espontáneos | PSV, CPAP |

<!-- block: THEORY | El tercer nivel: el esquema de control del objetivo -->
El último nivel describe cómo el ventilador decide el valor de su objetivo (targeting). La actualización de 2025 reconoce siete esquemas, cada uno con una letra (Fajardo-Campoverdi et al., 2025): punto fijo (s), dual (d), servo (r), adaptativo (a), biovariable (b), óptimo (o) e inteligente (i). En el nivel principiante te bastan dos:

- **Punto fijo (s):** el ventilador entrega exactamente lo que programaste (un volumen y un flujo, o una presión) en cada ciclo. VCV y PCV clásicos son de punto fijo.
- **Adaptativo (a):** el ventilador cambia automáticamente un objetivo de un ciclo a otro para alcanzar otro. Por ejemplo, ajusta la presión inspiratoria para que el volumen medido se acerque al volumen programado.

La etiqueta completa se escribe así: variable de control, guion, secuencia y letra del esquema. **VC-CMVs** es la VCV clásica; **PC-CMVs**, la PCV clásica; **PC-CSVs**, la presión de soporte o la CPAP. En los modos IMV se ponen dos letras separadas por coma: la primera para los ciclos mandatorios y la segunda para los espontáneos (Fajardo-Campoverdi et al., 2025).

<!-- block: THEORY | Cálculo: ventilación minuto en CMV con disparo del paciente -->
En CMV, cada esfuerzo que dispara el ventilador recibe un ciclo mandatorio completo. Por eso la ventilación minuto real depende de la frecuencia total, no de la programada:

$$
\dot{V}_E = V_T \times f_{total}
$$

donde $\dot{V}_E$ es la ventilación minuto (L/min), $V_T$ el volumen corriente (L) y $f_{total}$ la frecuencia total, suma de los ciclos disparados por tiempo y por el paciente (ciclos/min).

#### Ejemplo resuelto

Programas VC-CMVs con $V_T = 450\,\text{mL}$, frecuencia de respaldo $14\,\text{ciclos/min}$ y PEEP de $5\,\text{cmH}_2\text{O}$. El monitor muestra una frecuencia total de 20 ciclos/min.

1. Ciclos disparados por el paciente: $20 - 14 = 6$ por minuto. Cada uno recibe 450 mL, igual que los disparados por tiempo.
2. Ventilación minuto programada (si el paciente no disparara): $0{,}45 \times 14 = 6{,}3\,\text{L/min}$.
3. Ventilación minuto real: $0{,}45 \times 20 = 9{,}0\,\text{L/min}$.

El paciente recibe un 43 % más de ventilación que la programada. Si la frecuencia subiera por dolor, fiebre o ansiedad, la ventilación minuto también subiría y, con ella, el riesgo de hipocapnia y de atrapamiento aéreo por tiempos espiratorios cortos. En IMV, en cambio, los esfuerzos que superan la frecuencia mandatoria reciben ciclos espontáneos cuyo volumen depende del paciente.

<!-- page: nombres-comerciales | CASE_STUDY | Del nombre comercial a la taxonomía -->
<!-- block: THEORY | Por qué el nombre no basta -->
La literatura describe una proliferación de modos impulsada más por la tecnología y el mercado que por los datos clínicos, y una nomenclatura incoherente que dificulta comparar modos entre sí (Mireles-Cabodevila et al., 2013). La propuesta de clasificar por variable de control, secuencia y esquema nació precisamente para ordenar ese caos (Chatburn, 2007). Algunos ejemplos que conviene conocer:

- Los modos de volumen con presión adaptativa reciben nombres como «PRVC», «VC+» o «CMV + AutoFlow». Aunque el operador programa un volumen, en cada ciclo el ventilador controla la presión y la ajusta según el volumen medido del ciclo anterior. Por eso la taxonomía los clasifica como **PC-CMVa**, no como control de volumen (Fajardo-Campoverdi et al., 2025).
- El nombre en pantalla de un modo puede mantenerse igual mientras su clasificación cambia al activar opciones adicionales del equipo (Fajardo-Campoverdi et al., 2025).
- La sigla «CMV» se usa en algunos equipos como sinónimo de control de volumen, cuando en la taxonomía indica una secuencia de ciclos, no una variable de control.

Clasificar el modo te dice qué variable es independiente (la que protege el equipo) y cuál es dependiente (la que debes vigilar con alarmas). En control de volumen vigilas la presión; en control de presión vigilas el volumen corriente y la ventilación minuto.

<!-- block: CASE_STUDY | Ejemplo clínico -->
Ingresa a la UCI un hombre de 58 años, trasladado desde quirófano tras una laparotomía por perforación intestinal. Pesa 82 kg, mide 175 cm y llega sedado. La hoja de traslado indica: «modo PRVC, Vt 480 mL, FR 16, PEEP 6, FiO₂ 0,5». En la UCI conectas un ventilador de otra marca que no tiene un modo con ese nombre.

**Paso 1. Clasificar el modo de origen.** PRVC es un modo en el que se programa un volumen objetivo, pero en cada ciclo el ventilador entrega una presión constante que ajusta entre ciclos según el volumen medido. Es PC-CMVa: control de presión, todos los ciclos mandatorios, esquema adaptativo.

**Paso 2. Decidir qué buscar en el equipo de destino.** Puedes elegir el equivalente adaptativo del nuevo ventilador (también PC-CMVa, aunque se llame distinto) o pasar a un modo de punto fijo. Si eliges VC-CMVs, garantizas el volumen, pero la presión pasa a ser la variable libre y necesitas medir la presión meseta. Si eliges PC-CMVs, la presión queda fija y el volumen dependerá de la mecánica.

**Paso 3. Anticipar el comportamiento.** En PC-CMVa, si el paciente hace esfuerzos inspiratorios intensos, el ventilador mide volúmenes altos y responde bajando la presión: el soporte disminuye justo cuando el paciente más lo demanda. Revisarás esta limitación en «Modos duales y de control adaptativo».

**Paso 4. Ajustar las alarmas a la variable dependiente.** En el modo que elijas, coloca los límites de alarma sobre lo que el equipo no controla: presión máxima en VC; volumen corriente espirado y ventilación minuto en PC.

<!-- block: EXERCISE | Clasifica estos modos -->
**1.** Un modo en el que programas presión inspiratoria, tiempo inspiratorio y frecuencia, y en el que cada esfuerzo del paciente recibe un ciclo idéntico a los programados. ¿Cuál es su etiqueta?

*Respuesta:* PC-CMVs. La presión está preestablecida (PC), todos los ciclos son mandatorios porque el tiempo los cicla (CMV) y la presión no cambia de un ciclo a otro (punto fijo).

**2.** ¿Por qué no puedes encontrar un modo VC-CSV en ningún ventilador?

*Respuesta:* porque si el volumen y el flujo están fijados, el ventilador termina la inspiración al entregar el volumen; el ciclado lo decide la máquina y el ciclo es mandatorio, no espontáneo.

**3.** Un paciente en VC-CMVs con frecuencia programada de 12 ciclos/min y Vt de 500 mL tiene una frecuencia total de 24 ciclos/min. ¿Cuál es su ventilación minuto?

*Respuesta:* $0{,}5 \times 24 = 12\,\text{L/min}$, el doble de la programada ($6\,\text{L/min}$), porque en CMV cada disparo del paciente recibe el volumen completo.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y compara tres modos sin cambiar la mecánica del paciente:

1. En VCV, observa que el volumen corriente es igual en todos los ciclos y que lo que varía si cambias el flujo es la presión pico.
2. Cambia a PCV con una presión que dé un volumen parecido: la curva de presión se vuelve cuadrada y la de flujo, desacelerada.
3. Prueba PSV y fíjate en que la frecuencia y la duración de cada ciclo pasan a depender del paciente.
4. Clasifica cada uno con la etiqueta taxonómica (VC-CMVs, PC-CMVs, PC-CSVs) antes de pasar al siguiente.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Un modo se describe con tres preguntas: variable de control (volumen o presión), secuencia de ciclos (CMV, IMV o CSV) y esquema de control del objetivo (Chatburn et al., 2014).
- El ventilador solo puede controlar un lado de la ecuación del movimiento a la vez: si fija la presión, el volumen resulta; si fija volumen y flujo, la presión resulta.
- Un ciclo es espontáneo si el paciente decide su inicio y su final; es mandatorio si el ventilador decide el inicio, el final o ambos.
- En CMV todos los ciclos son mandatorios, aunque los dispare el paciente; por eso la ventilación minuto real es $V_T \times f_{total}$.
- Existen cinco patrones ventilatorios; VC-CSV es imposible porque el control de volumen implica ciclado por la máquina (Fajardo-Campoverdi et al., 2025).
- Los modos de «volumen con presión adaptativa» (PRVC, VC+, AutoFlow) son control de presión con esquema adaptativo: PC-CMVa.
- La variable que el modo no controla es la que debes vigilar con alarmas.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Confundir «asistido» con «espontáneo».** Un ciclo disparado por el paciente y ciclado por la máquina es mandatorio; si lo tratas como espontáneo, subestimas la ventilación que recibe. Fíjate siempre en quién termina la inspiración.
- **Clasificar un modo por el valor que programas.** Programar un volumen objetivo no convierte un modo en control de volumen si el ventilador ajusta la presión de un ciclo a otro. Pregúntate qué variable es constante dentro de cada ciclo.
- **Leer «CMV» como «control de volumen».** En la taxonomía, CMV es una secuencia de ciclos y existe tanto en VC como en PC. Comprueba la variable de control por separado.
- **Calcular la ventilación minuto con la frecuencia programada.** En CMV cada disparo del paciente añade un ciclo completo. Usa la frecuencia total medida.
- **Programar alarmas sobre la variable controlada.** Una alarma de volumen bajo apenas aporta en VCV de punto fijo, mientras que en PCV es esencial. Ajusta los límites sobre la variable dependiente.

<!-- block: REFERENCES | Referencias -->
- Chatburn, R. L. (2007). Classification of ventilator modes: Update and proposal for implementation. *Respiratory Care, 52*(3), 301-323. [https://doi.org/10.4187/respcare.07520301](https://doi.org/10.4187/respcare.07520301)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Fajardo-Campoverdi, A., Mireles-Cabodevila, E., Medina, A., Ibarra-Estrada, M., Baltazar-Torres, J., & Chatburn, R. (2025). Actualización de la taxonomía de los modos de ventilación mecánica. *Medicina Intensiva, 49*(10), 502211. [https://doi.org/10.1016/j.medin.2025.502211](https://doi.org/10.1016/j.medin.2025.502211)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Mireles-Cabodevila, E., Hatipoğlu, U., & Chatburn, R. L. (2013). A rational framework for selecting modes of ventilation. *Respiratory Care, 58*(2), 348-366. [https://doi.org/10.4187/respcare.01839](https://doi.org/10.4187/respcare.01839)
- Tobin, M. J. (Ed.). (2013). *Principles and practice of mechanical ventilation* (3rd ed.). McGraw-Hill Medical.
