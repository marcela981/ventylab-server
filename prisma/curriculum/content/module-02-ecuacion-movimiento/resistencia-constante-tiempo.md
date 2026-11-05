<!-- page: conceptos-resistencia | THEORY | Resistencia de la vía aérea: conceptos -->
<!-- block: INTRODUCTION | Por qué importa la resistencia -->
La resistencia mide la dificultad que encuentra el gas para avanzar por los conductos: el tubo endotraqueal, la tráquea y los bronquios. Es la parte de la presión que se gasta en mover aire, no en distender el pulmón. Por eso un aumento de la resistencia eleva la presión pico, pero no carga directamente al alvéolo durante la inspiración.

El problema aparece en la espiración. La espiración en ventilación mecánica es pasiva: el gas sale gracias a la retracción elástica del sistema respiratorio y tiene que atravesar la misma vía aérea. Si la resistencia es alta, el vaciado se enlentece, y si el tiempo disponible no alcanza, parte del volumen queda atrapado. Ese atrapamiento genera auto-PEEP, que puede afectar la hemodinámica, favorecer el barotrauma, aumentar el trabajo respiratorio y alterar la sincronía con el ventilador (Marini, 2011). La **constante de tiempo** es el concepto que une resistencia y compliance para predecir cuánto tarda en vaciarse el pulmón.

<!-- block: THEORY | Qué determina la resistencia -->
Cuando el flujo es laminar, la resistencia de un tubo sigue la ley de Poiseuille: es proporcional a la longitud del tubo y a la viscosidad del gas, e inversamente proporcional a la **cuarta potencia del radio**. Duplicar el radio reduce la resistencia dieciséis veces; reducirlo a la mitad la multiplica por dieciséis (Grinnan y Truwit, 2005). Esta relación explica por qué pequeños cambios de calibre tienen efectos tan grandes. Cuando el flujo es turbulento, como ocurre con flujos altos o en zonas de bifurcación y estrechez, la presión necesaria crece más que proporcionalmente con el flujo, de modo que la resistencia medida aumenta al aumentar el flujo.

En el paciente intubado, la resistencia total suma la del tubo endotraqueal y la de las vías aéreas del paciente. La mayoría de los tubos son bastante más estrechos que la tráquea, así que la resistencia al flujo aumenta de forma importante, y el calibre del tubo es un dato clave cuando se investiga una resistencia elevada (Grinnan y Truwit, 2005). En un adulto sin enfermedad de la vía aérea, la resistencia inspiratoria rara vez supera 15 cmH₂O/L/s (Grinnan y Truwit, 2005).

Las causas de resistencia aumentada se pueden ordenar desde el ventilador hacia el paciente:

- **Circuito y accesorios:** tubuladuras acodadas o con agua, filtro o intercambiador de calor y humedad saturado.
- **Tubo endotraqueal:** calibre pequeño, acodamiento, mordida del paciente, secreciones o tapón mucoso en la luz.
- **Vía aérea del paciente:** secreciones, broncoespasmo, edema de la mucosa, compresión extrínseca.

Las causas más frecuentes de un aumento súbito (problema del circuito, moco en la vía aérea o broncoespasmo) suelen ser tratables de inmediato, por lo que identificar el patrón resistivo debe llevar a una búsqueda activa (Grinnan y Truwit, 2005).

<!-- block: THEORY | El patrón resistivo en la curva de presión -->
En VCV con flujo constante, la resistencia se reconoce porque **la presión pico sube mientras la meseta se mantiene**: la diferencia entre ambas crece. Si lo que cambia es la compliance, pico y meseta suben juntos y la diferencia se conserva (Pérez-Nieto et al., 2023). La figura compara las tres situaciones con el mismo volumen y flujo.

![Tres curvas de presión en el tiempo en VCV con el mismo volumen y flujo. Referencia: pico 25 y meseta 15 cmH2O. Resistencia aumentada: pico 38 y meseta 16, la diferencia pico menos meseta crece a 22. Compliance disminuida: pico 37 y meseta 27, la diferencia pico menos meseta se mantiene en 10 y la meseta menos PEEP sube a 22](/learning/diagrams/b2-resistencia-pico-meseta.svg "Figura: patrón resistivo frente a patrón elástico en VCV")

En PCV el patrón es distinto, porque la presión está fijada: una resistencia alta enlentece el llenado, el flujo inspiratorio tarda más en llegar a cero o no llega, y el volumen corriente puede disminuir. En la espiración, en cualquier modo, la resistencia alta produce un flujo espiratorio de pico más bajo y una cola prolongada que puede no alcanzar la línea de cero antes de la siguiente respiración. Los bucles flujo-volumen también reflejan las tendencias de la resistencia (Lucangelo et al., 2005); se estudian en la lección de curvas y bucles.

<!-- block: THEORY | La constante de tiempo -->
Durante una espiración pasiva, la presión que impulsa el gas hacia afuera es la presión elástica acumulada ($V/C$), y lo que se opone es la resistencia. Al principio hay mucho volumen y la presión elástica es alta, así que el flujo es grande; a medida que el pulmón se vacía, la presión motriz cae y el flujo se reduce. El resultado es un vaciado **exponencial**, cuya velocidad depende del producto de la resistencia por la compliance: la constante de tiempo, $\tau$ (Marini y Crooke, 1993).

Un $\tau$ largo significa vaciado lento. Puede deberse a resistencia alta (asma, EPOC, tubo estrecho), a compliance alta (enfisema) o a ambas. Un $\tau$ corto, típico del pulmón rígido con vía aérea normal, permite vaciar rápido y tolera frecuencias más altas.

<!-- page: formulas-resistencia | THEORY | Fórmulas y cálculo -->
<!-- block: THEORY | Resistencia inspiratoria -->
En VCV con **flujo constante (onda cuadrada)** y una pausa al final de la inspiración, la diferencia entre la presión pico y la meseta corresponde al flujo que dejó de existir, así que (Grinnan y Truwit, 2005):

$$
R_{aw} = \frac{P_{pico} - P_{meseta}}{\dot{V}}
$$

| Símbolo | Significado | Unidades |
|---|---|---|
| $R_{aw}$ | Resistencia inspiratoria (tubo más vía aérea) | cmH₂O/L/s |
| $P_{pico}$ | Presión máxima al final del flujo inspiratorio | cmH₂O |
| $P_{meseta}$ | Presión estable durante la pausa sin flujo | cmH₂O |
| $\dot{V}$ | Flujo inspiratorio constante justo antes de la pausa | L/s |

La fórmula exige que el flujo sea constante y conocido en el instante previo a la pausa y que el paciente esté pasivo. Con flujo desacelerado o en PCV, el flujo al final de la inspiración es variable y la fórmula simple deja de ser válida. Recuerda convertir el flujo: $60\,\text{L/min} = 1\,\text{L/s}$.

La ley de Poiseuille, para flujo laminar, muestra el peso del radio ($r$), la longitud ($l$) y la viscosidad ($\eta$):

$$
R = \frac{8\,\eta\, l}{\pi\, r^{4}}
$$

<!-- block: EQUATION | Constante de tiempo -->
\tau = R_{aw}\cdot C_{rs}

<!-- block: THEORY | Vaciado espiratorio y múltiplos de tau -->
Las unidades encajan: $\text{cmH}_2\text{O/L/s} \times \text{L/cmH}_2\text{O} = \text{s}$. Durante una espiración pasiva, el volumen que queda por exhalar sigue la curva

$$
V(t) = V_t\cdot e^{-t/\tau}
$$

de modo que la fracción exhalada tras un tiempo $t$ es $1 - e^{-t/\tau}$. Son resultados matemáticos de la exponencial:

| Tiempo espiratorio | Volumen exhalado | Volumen que queda |
|---|---|---|
| $1\,\tau$ | 63 % | 37 % |
| $2\,\tau$ | 86 % | 14 % |
| $3\,\tau$ | 95 % | 5 % |
| $4\,\tau$ | 98 % | 2 % |
| $5\,\tau$ | 99 % | menos del 1 % |

Por eso se suele razonar que el tiempo espiratorio debería cubrir al menos unas tres constantes de tiempo para que el vaciado sea casi completo; con menos tiempo, el volumen residual se acumula de una respiración a otra hasta alcanzar un nuevo equilibrio con hiperinflación y auto-PEEP.

![Curva exponencial del volumen que queda por exhalar frente al tiempo en múltiplos de tau. Tras una constante de tiempo se ha exhalado el 63 por ciento, tras tres el 95 y tras cinco el 99. Una curva discontinua con tau 2,5 veces mayor aún conserva cerca del 30 por ciento del volumen cuando empieza la siguiente inspiración](/learning/diagrams/b2-resistencia-vaciado-exponencial.svg "Figura: vaciado espiratorio pasivo y constante de tiempo")

<!-- block: THEORY | Ejemplo resuelto -->
Paciente en VCV con flujo constante de 60 L/min, $V_t = 500\,\text{mL}$, Ppico 30 cmH₂O, Pmeseta 18 cmH₂O, PEEP total 8 cmH₂O.

**Paso 1, resistencia:** $\dot{V} = 1\,\text{L/s}$; $R_{aw} = (30 - 18)/1 = 12\,\text{cmH}_2\text{O/L/s}$.

**Paso 2, compliance:** $C_{st} = 0{,}5/(18 - 8) = 0{,}05\,\text{L/cmH}_2\text{O}$ (50 mL/cmH₂O).

**Paso 3, constante de tiempo:** $\tau = 12 \times 0{,}05 = 0{,}6\,\text{s}$.

**Paso 4, tiempo espiratorio necesario:** $3\,\tau = 1{,}8\,\text{s}$. Con frecuencia de 20/min el ciclo dura 3 s; si el tiempo inspiratorio total es 1 s, quedan 2 s de espiración, algo más de tres constantes de tiempo: el vaciado será casi completo. Con frecuencia de 30/min (ciclo de 2 s) quedaría 1 s, menos de dos constantes de tiempo, y aproximadamente una quinta parte del volumen no se exhalaría ($e^{-1/0{,}6} \approx 0{,}19$).

**Advertencia sobre el modelo:** un pulmón enfermo no tiene una única constante de tiempo. En la obstrucción grave conviven unidades que se vacían rápido con otras muy lentas, la resistencia espiratoria suele ser mayor que la inspiratoria y puede existir limitación al flujo espiratorio. El cálculo con $\tau$ orienta, pero la confirmación está en la curva de flujo y en la medición de la auto-PEEP con pausa espiratoria (Marini, 2011).

<!-- page: aplicacion-clinica-resistencia | CASE_STUDY | Aplicación clínica: resistencia alta y atrapamiento -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 32 años con asma grave, intubada en urgencias por agotamiento. Sedada, sin esfuerzo inspiratorio, tubo de 7,5 mm. VCV con $V_t = 450\,\text{mL}$, flujo constante 60 L/min, frecuencia 18/min, tiempo inspiratorio total 1 s, PEEP 5 cmH₂O.

**Mediciones:** Ppico 47 cmH₂O; pausa inspiratoria con Pmeseta 23 cmH₂O; pausa espiratoria con PEEP total 11 cmH₂O. La curva de flujo espiratorio no vuelve a cero antes de cada inspiración.

**Paso 1, resistencia.** $R_{aw} = (47 - 23)/1 = 24\,\text{cmH}_2\text{O/L/s}$, muy por encima de lo esperable en un adulto sin enfermedad de la vía aérea (Grinnan y Truwit, 2005). La diferencia pico menos meseta de 24 cmH₂O revela un problema predominantemente resistivo.

**Paso 2, auto-PEEP y compliance.** Auto-PEEP $= 11 - 5 = 6\,\text{cmH}_2\text{O}$. Compliance estática $= 450/(23 - 11) = 37{,}5\,\text{mL/cmH}_2\text{O}$. Si hubieras restado la PEEP programada habrías obtenido $450/18 = 25\,\text{mL/cmH}_2\text{O}$, una compliance falsamente baja.

**Paso 3, constante de tiempo.** $\tau = 24 \times 0{,}0375 = 0{,}9\,\text{s}$. El ciclo dura $60/18 \approx 3{,}3\,\text{s}$, de modo que el tiempo espiratorio es de unos 2,3 s, alrededor de 2,6 constantes de tiempo. El modelo predice que quedaría sin exhalar cerca del 8 % del volumen; la auto-PEEP medida y el flujo que no llega a cero indican que el atrapamiento real es mayor, algo esperable porque la resistencia espiratoria en el asma es mayor que la inspiratoria y la obstrucción es heterogénea.

**Paso 4, razonar el ajuste.** La ecuación señala dos palancas: reducir la resistencia (tratar el broncoespasmo, aspirar secreciones, revisar el tubo) y alargar el tiempo espiratorio. Si la frecuencia bajara a 12/min con el mismo tiempo inspiratorio, el ciclo duraría 5 s y el tiempo espiratorio sería de 4 s, más de cuatro constantes de tiempo calculadas. Reducir el volumen corriente también disminuye el volumen que hay que exhalar. Estas medidas pueden elevar la PaCO₂; los objetivos y límites concretos en el asma grave se tratan en la lección «Ventilación en el asma grave».

**Paso 5, vigilar consecuencias.** La auto-PEEP puede reducir el retorno venoso y producir hipotensión, y favorece el barotrauma (Marini, 2011). Controla la presión arterial y repite la pausa espiratoria después de cada cambio.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Crisis asmática grave»](/simulador?tab=simular&case=engine-asthma-crisis) en VCV con flujo constante y prueba lo siguiente:

1. Observa la curva de flujo: el flujo espiratorio no llega a cero antes de la siguiente inspiración, señal de atrapamiento.
2. Compara presión pico y meseta: la diferencia es grande y la meseta es mucho menor que el pico.
3. Reduce la frecuencia respiratoria: el tiempo espiratorio se alarga, la cola de flujo espiratorio se acerca a cero y la auto-PEEP disminuye; vigila la PaCO₂ y el pH en el monitor.
4. Aumenta el flujo inspiratorio para acortar la inspiración: la presión pico sube, pero gana tiempo espiratorio. Compara el efecto con el de bajar la frecuencia.

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** En VCV con flujo constante de 45 L/min, Ppico 32 cmH₂O y Pmeseta 20 cmH₂O, ¿cuál es la resistencia?

*Respuesta:* $45\,\text{L/min} = 0{,}75\,\text{L/s}$; $R_{aw} = 12/0{,}75 = 16\,\text{cmH}_2\text{O/L/s}$.

**2.** Un paciente tiene $R_{aw} = 20\,\text{cmH}_2\text{O/L/s}$ y $C_{rs} = 0{,}06\,\text{L/cmH}_2\text{O}$. ¿Cuánto tiempo espiratorio necesita para exhalar alrededor del 95 % del volumen?

*Respuesta:* $\tau = 1{,}2\,\text{s}$; $3\,\tau = 3{,}6\,\text{s}$.

**3.** Tras cambiar un tubo de 8,0 mm por uno de 7,0 mm, la presión pico sube con la misma meseta. ¿Por qué?

*Respuesta:* el radio interno disminuye y, con flujo laminar, la resistencia es inversamente proporcional a la cuarta potencia del radio; con turbulencia el efecto es aún mayor. Aumenta solo el componente resistivo.

**4.** ¿Por qué la fórmula $R = (P_{pico} - P_{meseta})/\dot{V}$ no sirve en PCV?

*Respuesta:* porque en PCV el flujo es desacelerado y su valor al final de la inspiración no es el que programaste; además, la presión pico coincide con la presión programada y no contiene un componente resistivo calculable de forma simple.

<!-- page: sintesis-resistencia | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La resistencia es la presión necesaria para mover el gas por unidad de flujo; se mide en VCV con flujo constante como (Ppico − Pmeseta)/V̇.
- El radio domina la resistencia: en flujo laminar es inversamente proporcional a la cuarta potencia del radio, y el tubo endotraqueal añade una resistencia importante.
- En un adulto sin enfermedad de la vía aérea la resistencia inspiratoria rara vez supera 15 cmH₂O/L/s (Grinnan y Truwit, 2005).
- El patrón resistivo es presión pico en aumento con meseta estable; sus causas comunes (circuito, secreciones, broncoespasmo) son tratables.
- La constante de tiempo, τ = R·C, determina la velocidad del vaciado pasivo: 63 % en 1 τ, 95 % en 3 τ y 99 % en 5 τ.
- Si el tiempo espiratorio es corto respecto a τ, el volumen se atrapa y aparece auto-PEEP, con riesgo hemodinámico y de barotrauma.
- El modelo de una sola constante de tiempo es una aproximación; confirma con la curva de flujo y la pausa espiratoria.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Calcular la resistencia con flujo desacelerado o en PCV** → el flujo previo a la pausa no es el programado y el resultado es erróneo → mide en VCV con flujo cuadrado y pausa inspiratoria.
- **Olvidar convertir el flujo a L/s** → usar L/min da una resistencia 60 veces menor → divide el flujo en L/min entre 60.
- **Subir la sedación o el límite de presión ante una presión pico alta** → oculta una obstrucción tratable y deja al paciente expuesto → identifica el patrón resistivo y busca acodamiento, secreciones, filtro saturado o broncoespasmo.
- **Ignorar la cola del flujo espiratorio** → un flujo que no llega a cero indica atrapamiento aunque las presiones parezcan aceptables → revisa la curva de flujo y mide la auto-PEEP con pausa espiratoria.
- **Aumentar la frecuencia para corregir la PaCO₂ en un paciente obstruido** → acorta el tiempo espiratorio, empeora el atrapamiento y puede incluso reducir la ventilación efectiva → valora primero el tiempo espiratorio en relación con τ.
- **Confiar en τ calculado como valor exacto** → la obstrucción es heterogénea y la resistencia espiratoria suele ser mayor → úsalo como orientación y confirma con la clínica y las curvas.

<!-- block: REFERENCES | Referencias -->
- Grinnan, D. C., & Truwit, J. D. (2005). Clinical review: Respiratory mechanics in spontaneous and assisted ventilation. *Critical Care, 9*(5), 472–484. [https://doi.org/10.1186/cc3516](https://doi.org/10.1186/cc3516)
- Lucangelo, U., Bernabé, F., & Blanch, L. (2005). Respiratory mechanics derived from signals in the ventilator circuit. *Respiratory Care, 50*(1), 55–67. [https://pubmed.ncbi.nlm.nih.gov/15636645/](https://pubmed.ncbi.nlm.nih.gov/15636645/)
- Marini, J. J. (2011). Dynamic hyperinflation and auto-positive end-expiratory pressure: Lessons learned over 30 years. *American Journal of Respiratory and Critical Care Medicine, 184*(7), 756–762. [https://doi.org/10.1164/rccm.201102-0226PP](https://doi.org/10.1164/rccm.201102-0226PP)
- Marini, J. J., & Crooke, P. S. (1993). A general mathematical model for respiratory dynamics relevant to the clinical setting. *American Review of Respiratory Disease, 147*(1), 14–24. [https://doi.org/10.1164/ajrccm/147.1.14](https://doi.org/10.1164/ajrccm/147.1.14)
- Pérez-Nieto, O. R., Mancilla-Galindo, J., Mendiola-Villalobos, C., Carrión-Moya, J. D., Zamarrón-López, E. I., Guerrero-Gutiérrez, M. A., et al. (2023). Aplicaciones clínicas de la ecuación del movimiento del sistema respiratorio para la toma de decisiones en el paciente bajo ventilación mecánica invasiva: artículo de reflexión. *Iatreia, 36*(1), 112–127. [https://doi.org/10.17533/udea.iatreia.179](https://doi.org/10.17533/udea.iatreia.179)
