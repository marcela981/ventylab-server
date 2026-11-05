<!-- page: driving-pressure-concepto | THEORY | Driving pressure: el volumen corriente visto desde el pulmón que queda -->
<!-- block: INTRODUCTION | Por qué importa -->
Cuando programas un volumen corriente de 6 mL/kg de peso predicho, das por hecho que todos los pacientes con la misma talla tienen un pulmón del mismo tamaño. En el síndrome de dificultad respiratoria aguda (SDRA) esa suposición falla: una parte del parénquima está colapsada o consolidada y no recibe gas, de modo que el volumen corriente se reparte en un pulmón aireado mucho más pequeño que el normal, el llamado *baby lung*. Dos pacientes con el mismo volumen por kilo pueden estar recibiendo una deformación muy distinta de su tejido ventilable.

La **presión de distensión** o *driving pressure* ($\Delta P$) es la forma más sencilla de ver ese problema a pie de cama. Se obtiene con dos números que ya tienes en el ventilador (la presión meseta y la PEEP) y expresa cuánta presión elástica hace falta para meter el volumen corriente en el pulmón que realmente está disponible. En esta lección aprenderás a medirla, a interpretarla, a calcular la potencia mecánica, que intenta resumir toda la energía que el ventilador transfiere al sistema respiratorio, y a reconocer lo que la evidencia sobre ambas variables permite y no permite afirmar.

<!-- block: THEORY | De la compliance a la driving pressure -->
En un paciente pasivo (sin esfuerzo inspiratorio), durante una pausa al final de la inspiración el flujo es cero y desaparece el componente resistivo. La presión en la vía aérea en ese momento, la presión meseta ($P_{plat}$), refleja solo la presión elástica del sistema respiratorio más la presión de fin de espiración. Por eso la diferencia entre ambas es la presión necesaria para distender el sistema con el volumen corriente:

$$
\Delta P = P_{plat} - PEEP_{total} = \frac{V_T}{C_{rs}}
$$

La segunda igualdad es la clave fisiológica. La compliance del sistema respiratorio ($C_{rs}$) es, en buena medida, proporcional a la cantidad de pulmón aireado. Si la compliance es baja porque solo queda un tercio del pulmón abierto, ese tercio recibe todo el volumen corriente y se deforma mucho más. La $\Delta P$ es, por tanto, el volumen corriente «normalizado» por el tamaño del pulmón funcional y no por el tamaño que el pulmón debería tener según la talla. Esta fue precisamente la hipótesis del análisis de Amato y colaboradores (Amato et al., 2015).

Observa dos consecuencias prácticas:

- La $\Delta P$ sube si aumentas el volumen corriente o si cae la compliance (más colapso, edema, neumotórax, intubación selectiva, distensión abdominal).
- Un cambio de PEEP modifica la $\Delta P$ solo a través de la compliance: si la PEEP abre unidades colapsadas, la $C_{rs}$ aumenta y la $\Delta P$ baja con el mismo volumen; si sobredistiende unidades ya abiertas, la $C_{rs}$ cae y la $\Delta P$ sube.

![Curva de presión en la vía aérea frente al tiempo en ventilación controlada por volumen con flujo constante: rampa hasta la presión pico, caída a la presión meseta durante la pausa inspiratoria y descenso hasta la PEEP. Se señalan la presión resistiva (pico menos meseta) y la driving pressure (meseta menos PEEP).](/learning/diagrams/a5-dp-presiones-vcv.svg "Figura: la pausa inspiratoria separa el componente resistivo del elástico; la driving pressure es la meseta menos la PEEP total")

<!-- block: THEORY | Qué mostró la evidencia -->
Amato y colaboradores reanalizaron los datos individuales de 3562 pacientes con SDRA incluidos en nueve ensayos aleatorizados. Entre todas las variables del ventilador, la $\Delta P$ fue la que más se asoció con la supervivencia: un incremento de una desviación estándar (unos 7 cmH₂O) se asoció con un riesgo relativo de muerte de 1,41, también en los pacientes que ya recibían presiones meseta y volúmenes considerados protectores. Los cambios de volumen corriente o de PEEP tras la aleatorización solo se asociaron con la supervivencia cuando se acompañaban de una reducción de la $\Delta P$ (Amato et al., 2015). En la gran cohorte observacional LUNG SAFE y en otras series, la $\Delta P$ elevada también se asoció con mayor mortalidad (Bugedo et al., 2017).

Lo que estos estudios **no** demuestran es que bajar activamente la $\Delta P$ hasta un valor concreto mejore el pronóstico. Son análisis secundarios y observacionales: una $\Delta P$ alta puede ser en parte un marcador de pulmón más enfermo y no solo una causa de daño. Por eso no hay un umbral validado en ensayos. Bugedo y colaboradores proponen 15 cmH₂O como **límite de seguridad** y no como objetivo, y advierten expresamente que esa cifra es especulativa (Bugedo et al., 2017). Las guías de la ESICM de 2023 recomiendan el volumen corriente bajo (4-8 mL/kg de peso predicho) y señalan como pregunta de investigación pendiente si el volumen corriente debería ajustarse por peso predicho o por driving pressure (Grasselli et al., 2023).

<!-- block: CALLOUT:info | Condiciones para que la medida sea válida -->
La $\Delta P$ calculada con la presión de la vía aérea solo es interpretable si el paciente está **pasivo** durante la pausa (un esfuerzo inspiratorio o espiratorio deforma la meseta) y si usas la **PEEP total** (PEEP programada más auto-PEEP, medida con pausa espiratoria). Si existe auto-PEEP y restas solo la PEEP programada, sobrestimas la $\Delta P$. La lección «Auto-PEEP e hiperinflación dinámica» explica cómo medirla.

<!-- page: potencia-mecanica-calculo | EXERCISE | Potencia mecánica: fórmulas y cálculo -->
<!-- block: THEORY | Qué es la potencia mecánica -->
La $\Delta P$ describe la carga elástica de **una** respiración. Pero el pulmón recibe esa carga muchas veces por minuto, y en cada inspiración también se gasta energía en vencer la resistencia de la vía aérea y en presurizar el sistema por encima de la PEEP. Gattinoni y colaboradores propusieron reunir todos estos determinantes (presión, volumen, flujo y frecuencia) en una sola variable: la **potencia mecánica**, es decir, la energía que el ventilador entrega al sistema respiratorio por unidad de tiempo, expresada en julios por minuto (Gattinoni et al., 2016).

Desde el punto de vista físico, la energía de una inspiración es el área bajo la curva presión-volumen inspiratoria: la integral de la presión en la vía aérea a lo largo del volumen insuflado. Multiplicada por la frecuencia respiratoria da la potencia. En ventilación controlada por volumen con flujo constante, la presión crece de forma lineal con el volumen y esa área se descompone en tres partes: la debida a la PEEP, la resistiva y la elástica.

![Gráfico de presión frente a volumen durante una inspiración con flujo constante. El área bajo la línea de presión se divide en un rectángulo inferior por la PEEP, una franja por la presión resistiva y un triángulo superior por la presión elástica dinámica.](/learning/diagrams/a5-dp-potencia-area.svg "Figura: la energía por ciclo es el área bajo la curva presión-volumen inspiratoria, con sus componentes PEEP, resistivo y elástico")

<!-- block: THEORY | Fórmula simplificada en VCV -->
La ecuación original de Gattinoni es larga, pero en ventilación controlada por volumen con flujo constante puede reescribirse a partir de valores medidos al pie de cama: la presión pico, la presión meseta y la PEEP. Chiumello y colaboradores la llaman fórmula «completa» porque conserva los componentes elástico y resistivo, y requiere una pausa inspiratoria (Chiumello et al., 2020):

$$
MP = 0{,}098 \cdot FR \cdot V_T \cdot \left(P_{pico} - \frac{1}{2}\,\Delta P\right)
$$

Símbolos y unidades:

- $MP$: potencia mecánica, en J/min.
- $0{,}098$: factor de conversión de $\text{cmH}_2\text{O}\cdot\text{L}$ a julios (1 $\text{cmH}_2\text{O}$ equivale a 98 Pa y 1 L a $10^{-3}\,\text{m}^3$).
- $FR$: frecuencia respiratoria, en respiraciones/min.
- $V_T$: volumen corriente, en **litros**.
- $P_{pico}$: presión pico, en cmH₂O.
- $\Delta P$: driving pressure ($P_{plat} - PEEP$), en cmH₂O.

Para ver de dónde sale, recuerda que con flujo constante $P_{pico} = PEEP + \Delta P + (P_{pico} - P_{plat})$. Si sustituyes, el paréntesis queda como $PEEP + (P_{pico} - P_{plat}) + \tfrac{1}{2}\Delta P$: el rectángulo de la PEEP, la franja resistiva y el triángulo elástico de la figura. En ventilación controlada por presión, con onda de presión casi cuadrada, Chiumello y colaboradores validaron una aproximación aún más sencilla, $MP \approx 0{,}098 \cdot FR \cdot V_T \cdot (PEEP + \Delta P_{insp})$, donde $\Delta P_{insp}$ es la presión programada por encima de la PEEP (Chiumello et al., 2020).

<!-- block: THEORY | Una alternativa más simple: 4·ΔP + FR -->
Costa y colaboradores analizaron 4549 pacientes con SDRA de seis ensayos y una cohorte observacional. La potencia mecánica se asoció con la mortalidad, pero un modelo que solo incluía la $\Delta P$ y la frecuencia fue equivalente, y el impacto de cada cmH₂O de $\Delta P$ fue unas cuatro veces mayor que el de cada respiración por minuto (Costa et al., 2021). De ahí el índice práctico:

$$
\text{Índice} = 4 \cdot \Delta P + FR
$$

Este índice no tiene unidades físicas; sirve para comparar dos programaciones del mismo paciente y recuerda que, en el SDRA, la $\Delta P$ pesa más que la frecuencia.

<!-- block: EXERCISE | Ejemplo resuelto -->
Un paciente pasivo en VCV con flujo constante tiene $V_T = 420\,\text{mL}$, $FR = 22$, $PEEP = 10$, $P_{pico} = 30$ y $P_{plat} = 24\,\text{cmH}_2\text{O}$ (sin auto-PEEP).

1. **Driving pressure**: $\Delta P = 24 - 10 = 14\,\text{cmH}_2\text{O}$.
2. **Compliance**: $C_{rs} = 420 / 14 = 30\,\text{mL/cmH}_2\text{O}$.
3. **Potencia mecánica**: $MP = 0{,}098 \cdot 22 \cdot 0{,}42 \cdot (30 - 7) = 0{,}098 \cdot 22 \cdot 0{,}42 \cdot 23 \approx 20{,}8\,\text{J/min}$.
4. **Índice**: $4 \cdot 14 + 22 = 78$.

Ahora reduces el volumen a 360 mL y subes la frecuencia a 26 para mantener la ventilación minuto (unos 9,3 L/min). Si la compliance y la resistencia no cambian y mantienes el mismo flujo, $\Delta P = 360/30 = 12$, la presión resistiva sigue en 6 cmH₂O, $P_{plat} = 22$ y $P_{pico} = 28$:

- $MP = 0{,}098 \cdot 26 \cdot 0{,}36 \cdot (28 - 6) \approx 20{,}2\,\text{J/min}$.
- Índice: $4 \cdot 12 + 26 = 74$.

La potencia apenas cambia, porque la energía que ahorras en cada respiración la gastas en más respiraciones; la $\Delta P$, en cambio, baja 2 cmH₂O. Este ejemplo muestra por qué ambas variables se complementan y por qué subir la frecuencia no es neutro.

<!-- page: aplicacion-clinica-dp | CASE_STUDY | Aplicación clínica: SDRA con driving pressure elevada -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente**: mujer de 58 años, peso predicho 52 kg, SDRA por neumonía, segundo día de ventilación invasiva, sedada y con bloqueo neuromuscular.

**Programación**: VCV, $V_T = 330\,\text{mL}$ (6,3 mL/kg), $FR = 26$, $PEEP = 12$, FiO₂ 0,6, flujo constante.

**Monitoreo**: $P_{pico} = 35$, $P_{plat} = 29\,\text{cmH}_2\text{O}$; la pausa espiratoria muestra una PEEP total de 12 (sin auto-PEEP). PaO₂/FiO₂ 130 mmHg, PaCO₂ 52 mmHg, pH 7,31.

**Paso 1. Comprobar los límites clásicos.** El volumen está dentro del rango de 4-8 mL/kg recomendado (Grasselli et al., 2023) y la meseta no supera los 30 cmH₂O del protocolo de la red ARDS (ARDS Network, 2000). A primera vista, la ventilación es «protectora».

**Paso 2. Calcular la driving pressure y la compliance.** $\Delta P = 29 - 12 = 17\,\text{cmH}_2\text{O}$; $C_{rs} = 330 / 17 \approx 19\,\text{mL/cmH}_2\text{O}$. La $\Delta P$ supera el límite de seguridad de 15 cmH₂O que algunos autores proponen (Bugedo et al., 2017): el volumen corriente, aunque pequeño por kilo, es grande para el pulmón aireado que queda.

**Paso 3. Calcular la potencia mecánica.** $MP = 0{,}098 \cdot 26 \cdot 0{,}33 \cdot (35 - 8{,}5) \approx 22{,}3\,\text{J/min}$. En una cohorte de 8207 pacientes ventilados al menos 48 horas, el riesgo de muerte aumentó de forma consistente por encima de 17 J/min (Serpa Neto et al., 2018); recuerda que es una asociación observacional, no un objetivo validado.

**Paso 4. Decidir qué cambiar.** Tienes dos palancas, y conviene probarlas de una en una midiendo la meseta tras cada cambio:

- **Probar la respuesta a la PEEP**: sube la PEEP 2-3 cmH₂O con el mismo volumen y repite la pausa. Si la $\Delta P$ baja, la compliance mejoró: la PEEP abrió unidades. Si sube, estás sobredistendiendo y debes volver al valor previo. Vigila la presión arterial.
- **Reducir el volumen corriente**: a 5 mL/kg (unos 260-270 mL), con la misma compliance, la $\Delta P$ bajaría a unos 14 cmH₂O. Para compensar la PaCO₂ tendrías que subir la frecuencia, por ejemplo a 30: la potencia quedaría en torno a $0{,}098 \cdot 30 \cdot 0{,}27 \cdot (32 - 7) \approx 19{,}8\,\text{J/min}$ si la presión resistiva se mantiene en 6 cmH₂O. Acepta una PaCO₂ algo mayor si el pH lo permite, y comprueba con una pausa espiratoria que la frecuencia más alta no genere auto-PEEP.

Si con estos ajustes la $\Delta P$ sigue alta y la hipoxemia es grave, la evaluación pasa a medidas como el decúbito prono, tratadas en el módulo correspondiente.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) en VCV y:

1. Aplica una pausa inspiratoria, anota la presión meseta y la PEEP y calcula la driving pressure y la compliance.
2. Reduce el volumen corriente en escalones de 50 mL: observa que la meseta y la driving pressure bajan, y que con el tiempo la PaCO₂ tiende a subir si no ajustas la frecuencia.
3. Sube la PEEP en 2 cmH₂O manteniendo el volumen y repite la pausa: fíjate si la driving pressure baja (mejor compliance) o sube (sobredistensión), y qué ocurre con la SpO₂ y la presión arterial media.

<!-- block: EXERCISE | Preguntas -->
**1.** Un paciente tiene $P_{plat} = 26$, PEEP programada 8 y PEEP total 12 cmH₂O. ¿Cuál es la $\Delta P$ correcta?

*Respuesta*: $26 - 12 = 14\,\text{cmH}_2\text{O}$. Si restas la PEEP programada obtienes 18 y sobrestimas la carga elástica, porque parte de la presión de fin de espiración se debe al atrapamiento.

**2.** Al subir la PEEP de 10 a 14 con el mismo volumen, la meseta pasa de 26 a 32 cmH₂O. ¿Qué indica?

*Respuesta*: la $\Delta P$ pasa de 16 a 18: la compliance empeoró. Predomina la sobredistensión sobre el reclutamiento; vuelve a la PEEP previa.

**3.** ¿Por qué una $\Delta P$ baja no garantiza una ventilación segura?

*Respuesta*: porque no incluye la frecuencia ni el flujo, que también aportan energía, y porque refleja todo el sistema respiratorio (pulmón y pared torácica). Con una pared torácica rígida, parte de la presión no distiende el pulmón; con esfuerzos espontáneos intensos, la distensión real del pulmón puede ser mayor de la que muestra la vía aérea.

<!-- page: limites-de-la-evidencia | THEORY | Límites de la driving pressure y la potencia mecánica -->
<!-- block: THEORY | Límites de ambas variables -->
Antes de usar la $\Delta P$ o la potencia mecánica para decidir, ten presentes sus limitaciones:

- **Son medidas del sistema respiratorio completo.** Incluyen la pared torácica. En obesidad, distensión abdominal o edema de pared, una parte de la presión se gasta en mover la caja torácica y no en distender el pulmón. La presión esofágica permite separar ambos componentes (lección «Presión esofágica y presión transpulmonar»).
- **Requieren un paciente pasivo** para que la meseta sea fiable. Con esfuerzos inspiratorios, la presión de la vía aérea subestima la distensión pulmonar.
- **La potencia mecánica no está normalizada.** El mismo valor en julios por minuto no tiene el mismo significado en un pulmón grande y sano que en un *baby lung*. Costa y colaboradores la expresaron por kilo de peso predicho, con una media de 0,32 J/min/kg en su población (Costa et al., 2021), pero no existe un umbral validado.
- **No toda la energía es igual de dañina.** La fórmula suma la energía usada para vencer la resistencia y la debida a la PEEP; el peso relativo de cada componente en la lesión pulmonar sigue en discusión (Gattinoni et al., 2016).
- **La evidencia es observacional.** Ningún ensayo aleatorizado ha demostrado todavía que programar el ventilador para alcanzar una $\Delta P$ o una potencia determinadas reduzca la mortalidad; las guías de la ESICM de 2023 lo consideran una línea de investigación abierta (Grasselli et al., 2023).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Restar la PEEP programada en lugar de la PEEP total** → sobrestima la $\Delta P$ cuando hay auto-PEEP → mide la PEEP total con pausa espiratoria y úsala en el cálculo.
- **Medir la meseta con el paciente haciendo esfuerzos** → la presión de la pausa no es estática y el valor no es fiable → asegura una pausa sin esfuerzo visible (curva de presión plana) o interpreta con cautela.
- **Tomar 15 cmH₂O como un objetivo que hay que alcanzar a toda costa** → la cifra no procede de ensayos y perseguirla puede llevar a volúmenes muy bajos con acidosis grave → úsala como señal de alarma y busca la causa de la baja compliance.
- **Subir la PEEP para «bajar la driving pressure» sin medir** → si la PEEP sobredistiende, la $\Delta P$ sube y además cae el gasto cardíaco → cambia la PEEP en escalones y repite la pausa tras cada uno.
- **Comparar potencias mecánicas entre pacientes distintos** → el valor no está normalizado por el tamaño del pulmón → úsala para comparar programaciones en el mismo paciente.
- **Introducir el volumen en mL en la fórmula de potencia** → el resultado sale mil veces mayor → expresa $V_T$ en litros.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La driving pressure es $P_{plat} - PEEP_{total}$ y equivale a $V_T/C_{rs}$: expresa el volumen corriente en relación con el pulmón aireado disponible.
- En el análisis de 3562 pacientes con SDRA fue la variable del ventilador más asociada con la supervivencia (Amato et al., 2015).
- No existe un umbral validado; 15 cmH₂O se ha propuesto como límite de seguridad, no como objetivo (Bugedo et al., 2017).
- Un cambio de PEEP que baja la $\Delta P$ con el mismo volumen sugiere reclutamiento; uno que la sube sugiere sobredistensión.
- La potencia mecánica integra presión, volumen, flujo y frecuencia en J/min; en VCV se estima con $0{,}098 \cdot FR \cdot V_T \cdot (P_{pico} - \tfrac{1}{2}\Delta P)$ (Chiumello et al., 2020).
- Bajar el volumen y subir la frecuencia puede reducir la $\Delta P$ sin cambiar mucho la potencia: valora ambas.
- El índice $4 \cdot \Delta P + FR$ resume que, en el SDRA, cada cmH₂O de $\Delta P$ pesa unas cuatro veces más que cada respiración por minuto (Costa et al., 2021).

<!-- block: REFERENCES | Referencias -->
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Bugedo, G., Retamal, J., & Bruhn, A. (2017). Driving pressure: A marker of severity, a safety limit, or a goal for mechanical ventilation? *Critical Care, 21*, 199. [https://doi.org/10.1186/s13054-017-1779-x](https://doi.org/10.1186/s13054-017-1779-x)
- Chiumello, D., Gotti, M., Guanziroli, M., Formenti, P., Umbrello, M., Pasticci, I., Mistraletti, G., & Busana, M. (2020). Bedside calculation of mechanical power during volume- and pressure-controlled mechanical ventilation. *Critical Care, 24*, 417. [https://doi.org/10.1186/s13054-020-03116-w](https://doi.org/10.1186/s13054-020-03116-w)
- Costa, E. L. V., Slutsky, A. S., Brochard, L. J., Brower, R., Serpa-Neto, A., Cavalcanti, A. B., Mercat, A., Meade, M., Morais, C. C. A., Goligher, E., Carvalho, C. R. R., & Amato, M. B. P. (2021). Ventilatory variables and mechanical power in patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 204*(3), 303-311. [https://doi.org/10.1164/rccm.202009-3467OC](https://doi.org/10.1164/rccm.202009-3467OC)
- Gattinoni, L., Tonetti, T., Cressoni, M., Cadringher, P., Herrmann, P., Moerer, O., Protti, A., Gotti, M., Chiurazzi, C., Carlesso, E., Chiumello, D., & Quintel, M. (2016). Ventilator-related causes of lung injury: The mechanical power. *Intensive Care Medicine, 42*(10), 1567-1575. [https://doi.org/10.1007/s00134-016-4505-2](https://doi.org/10.1007/s00134-016-4505-2)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Serpa Neto, A., Deliberato, R. O., Johnson, A. E. W., Bos, L. D., Amorim, P., Pereira, S. M., Cazati, D. C., Cordioli, R. L., Correa, T. D., Pollard, T. J., Schettino, G. P. P., Timenetsky, K. T., Celi, L. A., Pelosi, P., Gama de Abreu, M., & Schultz, M. J. (2018). Mechanical power of ventilation is associated with mortality in critically ill patients: An analysis of patients in two observational cohorts. *Intensive Care Medicine, 44*(11), 1914-1922. [https://doi.org/10.1007/s00134-018-5375-6](https://doi.org/10.1007/s00134-018-5375-6)
