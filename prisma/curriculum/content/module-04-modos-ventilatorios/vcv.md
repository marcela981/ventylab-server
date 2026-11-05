<!-- page: conceptos-vcv | THEORY | Cómo funciona la ventilación controlada por volumen -->
<!-- block: INTRODUCTION | Por qué importa entender la VCV -->
La ventilación controlada por volumen (VCV, en la taxonomía VC-CMVs) es uno de los modos más usados al iniciar la ventilación invasiva, y fue el modo en el que se demostró que reducir el volumen corriente disminuye la mortalidad en el síndrome de dificultad respiratoria aguda (Acute Respiratory Distress Syndrome Network, 2000). Su atractivo es la previsibilidad: el volumen que programas es el que recibe el paciente en cada ciclo.

Esa garantía tiene un precio. Como el ventilador fija el volumen y el flujo, la presión en la vía aérea se convierte en la variable libre. Si el pulmón se vuelve más rígido o la vía aérea se estrecha, la presión sube sin que el equipo lo impida, salvo por el límite de alarma. Entender qué hace subir cada presión es lo que convierte la VCV en una herramienta segura y, además, en una de las mejores formas de medir la mecánica respiratoria a pie de cama.

<!-- block: THEORY | Qué programas y qué resulta -->
En VCV programas, antes de cada inspiración:

- **Volumen corriente ($V_T$)**, en mL, ajustado al peso corporal predicho (lo viste en «Volumen corriente y peso corporal predicho»).
- **Flujo inspiratorio** (pico de flujo, en L/min) y su **forma de onda**: constante (cuadrada) o desacelerada (rampa descendente).
- **Frecuencia de respaldo**, **PEEP**, **FiO₂** y **sensibilidad del trigger**.
- De forma opcional, una **pausa inspiratoria** al final de la entrega del volumen.

Con estos ajustes el tiempo inspiratorio no se programa directamente en muchos equipos: resulta de dividir el volumen entre el flujo, más la pausa. Lo que **resulta** de la mecánica del paciente es la presión: la presión pico ($P_{pico}$), la presión meseta ($P_{plat}$) y la presión media de la vía aérea (Hess & Kacmarek, 2019).

<!-- block: THEORY | Lectura de las curvas escalares con flujo constante -->
Con flujo constante, las tres curvas tienen formas muy reconocibles:

- **Flujo-tiempo:** un rectángulo durante la inspiración. Si hay pausa, el flujo cae a cero y se mantiene así. En la espiración, que es pasiva, el flujo es negativo, alcanza su máximo al inicio y decae de forma exponencial.
- **Presión-tiempo:** al abrirse la válvula inspiratoria aparece un salto brusco que corresponde a la presión necesaria para vencer la resistencia ($R\cdot\dot{V}$). Después la presión asciende en línea recta, porque el volumen aumenta a ritmo constante y la presión elástica ($V/C$) crece en proporción. Al final de la entrega se alcanza la $P_{pico}$. Durante la pausa, sin flujo, desaparece el componente resistivo y la presión baja hasta la $P_{plat}$, que refleja la presión alveolar al final de la inspiración.
- **Volumen-tiempo:** una rampa lineal hasta el volumen programado, una meseta durante la pausa y un descenso exponencial durante la espiración.

![Tres gráficas apiladas de presión, flujo y volumen frente al tiempo en VCV con flujo constante: la presión sube en rampa lineal hasta la presión pico, cae a la presión meseta durante la pausa y vuelve a la PEEP; el flujo es cuadrado en la inspiración, cero en la pausa y negativo y decreciente en la espiración; el volumen sube linealmente, se mantiene en la pausa y desciende de forma exponencial](/learning/diagrams/b5-vcv-curvas-escalares.svg "Figura: curvas escalares de la VCV con flujo constante y pausa inspiratoria")

La diferencia entre $P_{pico}$ y $P_{plat}$ informa sobre la resistencia; la diferencia entre $P_{plat}$ y PEEP, sobre la distensibilidad. Esa separación solo es posible porque en VCV el flujo es conocido y constante: es la base de la medición de la mecánica a pie de cama.

<!-- block: THEORY | Flujo constante frente a flujo desacelerado -->
Muchos ventiladores permiten entregar el mismo volumen con una rampa descendente: el flujo empieza alto y baja de forma lineal. Si mantienes el mismo volumen y el mismo tiempo inspiratorio, el pico de flujo tiene que ser el doble que con la onda cuadrada, pero la presión pico es menor, porque el flujo es máximo cuando el volumen (y la presión elástica) todavía es bajo, y mínimo cuando el pulmón ya está lleno. La presión meseta no cambia, porque depende solo del volumen y de la compliance.

En un estudio en 14 pacientes con ventilación con presión positiva intermitente, la onda desacelerada redujo la presión pico, la resistencia, el trabajo inspiratorio, la relación espacio muerto/volumen corriente y el gradiente alvéolo-arterial de O₂, y aumentó la compliance y la PaO₂, sin cambios hemodinámicos (Al-Saady & Bennett, 1985). Es un estudio fisiológico pequeño, no un ensayo de resultados clínicos.

![Comparación de flujo cuadrado y flujo desacelerado con el mismo volumen y tiempo inspiratorio: el flujo desacelerado tiene un pico doble, pero su presión pico es menor; la presión meseta es igual en ambos](/learning/diagrams/b5-vcv-flujo-cuadrado-desacelerado.svg "Figura: mismo volumen, distinta forma de flujo, distinta presión pico")

<!-- page: formulas-vcv | THEORY | Fórmulas y cálculo en VCV -->
<!-- block: THEORY | Las presiones de la VCV y su significado -->
En VCV con flujo constante y un paciente pasivo, la ecuación del movimiento se puede escribir para dos instantes del ciclo (Hess & Kacmarek, 2019).

Al final de la entrega del volumen, con el flujo todavía presente:

$$
P_{pico} = \frac{V_T}{C_{rs}} + R_{aw}\cdot\dot{V} + PEEP_{total}
$$

Durante la pausa inspiratoria, con flujo cero:

$$
P_{plat} = \frac{V_T}{C_{rs}} + PEEP_{total}
$$

De ahí se despejan la resistencia, la compliance y la presión de distensión:

$$
R_{aw} = \frac{P_{pico} - P_{plat}}{\dot{V}} \qquad C_{rs} = \frac{V_T}{P_{plat} - PEEP_{total}} \qquad \Delta P = P_{plat} - PEEP_{total}
$$

Y el tiempo inspiratorio resulta de:

$$
T_I = \frac{V_T}{\dot{V}} + T_{pausa}
$$

Símbolos y unidades:

| Símbolo | Significado | Unidad |
|---|---|---|
| $V_T$ | Volumen corriente | L (o mL) |
| $\dot{V}$ | Flujo inspiratorio constante | L/s (1 L/s = 60 L/min) |
| $C_{rs}$ | Compliance del sistema respiratorio | mL/cmH₂O |
| $R_{aw}$ | Resistencia inspiratoria (vía aérea más tubo) | cmH₂O/(L/s) |
| $PEEP_{total}$ | PEEP programada más auto-PEEP | cmH₂O |
| $\Delta P$ | Presión de distensión (driving pressure) | cmH₂O |

Para que la $P_{plat}$ sea válida, el paciente debe estar pasivo y la pausa debe durar lo suficiente para que la presión se estabilice; en el ensayo ARDSNet se midió tras una pausa de 0,5 s al final de la inspiración (Acute Respiratory Distress Syndrome Network, 2000). La $\Delta P$ es la variable ventilatoria que mejor se asoció con la supervivencia en un análisis de ensayos en SDRA (Amato et al., 2015); la estudiarás a fondo en el nivel avanzado.

<!-- block: THEORY | Ejemplo resuelto -->
Un hombre de 175 cm (peso predicho de unos 70,6 kg con la fórmula usada en el ensayo ARDSNet; Acute Respiratory Distress Syndrome Network, 2000) está en VC-CMVs con $V_T = 450\,\text{mL}$ (6,4 mL/kg de peso predicho), flujo constante de $60\,\text{L/min}$, pausa de $0{,}3\,\text{s}$, frecuencia de 18 ciclos/min y PEEP de $5\,\text{cmH}_2\text{O}$, sin auto-PEEP. El monitor muestra $P_{pico} = 26\,\text{cmH}_2\text{O}$ y $P_{plat} = 20\,\text{cmH}_2\text{O}$.

1. Convierte el flujo: $60\,\text{L/min} = 1\,\text{L/s}$.
2. Resistencia: $R_{aw} = (26 - 20)/1 = 6\,\text{cmH}_2\text{O/(L/s)}$.
3. Presión de distensión: $\Delta P = 20 - 5 = 15\,\text{cmH}_2\text{O}$.
4. Compliance: $C_{rs} = 450/15 = 30\,\text{mL/cmH}_2\text{O}$.
5. Tiempo inspiratorio: $T_I = 0{,}45/1 + 0{,}3 = 0{,}75\,\text{s}$. Con 18 ciclos/min, cada ciclo dura $60/18 = 3{,}33\,\text{s}$; el tiempo espiratorio es $3{,}33 - 0{,}75 = 2{,}58\,\text{s}$ y la relación I:E es de alrededor de 1:3,4.

Ahora reduces el flujo a $40\,\text{L/min}$ ($0{,}667\,\text{L/s}$) sin cambiar nada más:

- El componente resistivo baja de $6 \times 1 = 6$ a $6 \times 0{,}667 = 4\,\text{cmH}_2\text{O}$, así que la $P_{pico}$ pasa de 26 a $24\,\text{cmH}_2\text{O}$.
- La $P_{plat}$ sigue en $20\,\text{cmH}_2\text{O}$: el volumen y la compliance no cambiaron.
- El tiempo de entrega sube a $0{,}45/0{,}667 = 0{,}675\,\text{s}$; el $T_I$ total, a $0{,}975\,\text{s}$, y el tiempo espiratorio baja a $2{,}36\,\text{s}$.

La lección práctica: bajar el flujo reduce la presión pico pero alarga la inspiración y acorta la espiración, lo que puede favorecer el atrapamiento aéreo en pacientes obstructivos. Tampoco protege al alvéolo: la presión que lo distiende es la meseta, y esa depende del volumen.

<!-- block: EQUATION | Ventilación minuto en VCV -->
\dot{V}_E = V_T \times f_{total}

<!-- page: aplicacion-vcv | CASE_STUDY | Aplicación clínica: cuando la presión cambia -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
Mujer de 67 años, 160 cm (peso predicho de unos 52,4 kg), intubada por neumonía. Está en VC-CMVs con $V_T = 330\,\text{mL}$ (6,3 mL/kg), flujo constante de $50\,\text{L/min}$, PEEP de $8\,\text{cmH}_2\text{O}$ y FiO₂ de 0,5. A las 8:00 registras $P_{pico} = 27$ y $P_{plat} = 21\,\text{cmH}_2\text{O}$. A las 11:00 suena la alarma de presión alta. Vas a la cabecera, pides que la paciente esté tranquila y haces una pausa inspiratoria.

**Escenario A.** $P_{pico} = 38$, $P_{plat} = 22\,\text{cmH}_2\text{O}$.

- La diferencia pico-meseta pasó de 6 a $16\,\text{cmH}_2\text{O}$; la meseta apenas cambió.
- El problema es **resistivo**: algo estrecha la vía de paso del gas. Busca secreciones (aspiración), tubo acodado o mordido, condensación en el circuito, broncoespasmo (sibilancias, curva de flujo espiratorio que no llega a cero).
- Con el flujo de $50\,\text{L/min}$ ($0{,}83\,\text{L/s}$), la resistencia subió de unos 7 a unos $19\,\text{cmH}_2\text{O/(L/s)}$.

**Escenario B.** $P_{pico} = 36$, $P_{plat} = 30\,\text{cmH}_2\text{O}$.

- La diferencia pico-meseta sigue en 6; la meseta subió 9 cmH₂O y la $\Delta P$ pasó de 13 a $22\,\text{cmH}_2\text{O}$.
- El problema es **elástico**: el mismo volumen ahora distiende más el sistema. Piensa en intubación selectiva (ausculta y revisa la marca del tubo), atelectasia, neumotórax (asimetría, hipotensión), edema, distensión abdominal o auto-PEEP (haz una pausa espiratoria).
- La compliance bajó de $330/13 \approx 25$ a $330/22 = 15\,\text{mL/cmH}_2\text{O}$.

En ambos escenarios el volumen corriente se mantuvo, que es exactamente lo que promete la VCV. Lo que cambió es la presión, y por eso la alarma de presión máxima es tu principal defensa en este modo. En el SDRA, las guías recomiendan volúmenes de 4-8 mL/kg de peso predicho y presión meseta menor de $30\,\text{cmH}_2\text{O}$ (Fan et al., 2017); en el escenario B la paciente está en el límite y necesitas resolver la causa antes de pensar en el modo.

<!-- block: THEORY | El riesgo propio de la VCV: hambre de flujo -->
Si el paciente tiene impulso respiratorio y su demanda supera el flujo programado, sus músculos siguen contrayéndose durante toda la insuflación. En la curva de presión lo verás como una concavidad: la rampa, que debería ser recta, se hunde. En voluntarios sanos ventilados en modo asistido por volumen, el trabajo inspiratorio del sujeto equivalió al 33-50 % del trabajo de insuflación pasiva incluso con los ajustes más favorables, y lo superó con los menos favorables; el flujo pico y la sensibilidad del trigger fueron determinantes (Marini et al., 1985). Las opciones son aumentar el flujo, usar una onda desacelerada, tratar la causa del impulso alto (dolor, fiebre, acidosis, ansiedad) o pasar a un modo de presión. Profundizarás en «Asincronías de flujo y de ciclado».

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** En VCV con flujo de $60\,\text{L/min}$, $P_{pico} = 32$ y $P_{plat} = 18\,\text{cmH}_2\text{O}$. ¿Cuál es la resistencia y qué sugiere?

*Respuesta:* $R = (32 - 18)/1 = 14\,\text{cmH}_2\text{O/(L/s)}$. Es alta para un paciente intubado y orienta a un problema de vía aérea o del tubo (secreciones, broncoespasmo, acodamiento).

**2.** Aumentas el $V_T$ de 400 a 500 mL sin cambiar el flujo. ¿Qué presiones esperas que cambien?

*Respuesta:* sube la meseta (más volumen sobre la misma compliance) y, con ella, la presión pico. La diferencia pico-meseta no cambia, porque el flujo y la resistencia son los mismos. El $T_I$ se alarga.

**3.** ¿Por qué bajar el flujo para que deje de sonar la alarma de presión pico no protege el pulmón?

*Respuesta:* porque solo reduce el componente resistivo. La presión que distiende los alvéolos es la meseta, que depende del volumen y de la compliance, no del flujo.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Crisis asmática grave»](/simulador?tab=simular&case=engine-asthma-crisis) en VCV:

1. Activa una pausa inspiratoria y compara la presión pico con la meseta: la diferencia será grande, señal de una resistencia alta.
2. Reduce el flujo inspiratorio y observa que la presión pico baja, pero el tiempo inspiratorio se alarga y el flujo espiratorio llega aún más lejos de cero antes del siguiente ciclo.
3. Reduce la frecuencia y comprueba cómo el flujo espiratorio se acerca más a cero al final de la espiración.
4. Después abre [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y repite la pausa: la diferencia pico-meseta será pequeña.

<!-- page: sintesis-vcv | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- En VCV el operador fija el volumen corriente y el flujo; la presión de la vía aérea es la variable dependiente.
- Con flujo constante, la presión sube en rampa lineal hasta la $P_{pico}$; con una pausa inspiratoria, cae hasta la $P_{plat}$, que estima la presión alveolar al final de la inspiración.
- $P_{pico} - P_{plat}$ refleja la resistencia; $P_{plat} - PEEP_{total}$ (la $\Delta P$) refleja la distensibilidad del sistema respiratorio.
- La onda desacelerada reduce la presión pico con el mismo volumen, pero no cambia la presión meseta (Al-Saady & Bennett, 1985).
- Ventajas: volumen corriente y ventilación minuto garantizados, y medición sencilla de la mecánica.
- Riesgos: presiones crecientes si la mecánica empeora y hambre de flujo si la demanda del paciente supera el flujo programado (Marini et al., 1985).
- En el SDRA, el objetivo de protección es $V_T$ de 4-8 mL/kg de peso predicho con $P_{plat} < 30\,\text{cmH}_2\text{O}$ (Fan et al., 2017).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Mirar solo la presión pico.** Una pico alta puede ser resistiva o elástica, y el abordaje es opuesto. Haz siempre una pausa inspiratoria y separa los dos componentes.
- **Medir la meseta con el paciente activo o con una pausa demasiado corta.** El esfuerzo del paciente o una presión que aún no se estabiliza dan valores falsos. Confirma la pasividad y espera a que la presión forme una meseta estable.
- **Bajar el flujo para silenciar la alarma de presión.** Reduce la pico pero no la meseta, alarga la inspiración y acorta la espiración. Busca la causa del aumento de presión.
- **Ignorar la concavidad de la curva de presión.** Es el signo de hambre de flujo y significa que el paciente está trabajando. Aumenta el flujo, trata el impulso o cambia de modo.
- **Subir el límite de alarma de presión para que deje de sonar.** En VCV esa alarma es la única barrera frente a presiones peligrosas. Ajústala por encima de la pico habitual y resuelve la causa.
- **Programar el volumen con el peso real.** En pacientes con obesidad se sobredistiende el pulmón. Usa el peso corporal predicho.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Al-Saady, N., & Bennett, E. D. (1985). Decelerating inspiratory flow waveform improves lung mechanics and gas exchange in patients on intermittent positive-pressure ventilation. *Intensive Care Medicine, 11*(2), 68-75. [https://doi.org/10.1007/BF00254777](https://doi.org/10.1007/BF00254777)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., Adhikari, N. K. J., Amato, M. B. P., Branson, R., Brower, R. G., Ferguson, N. D., Gajic, O., Gattinoni, L., Hess, D., Mancebo, J., Meade, M. O., McAuley, D. F., Pesenti, A., Ranieri, V. M., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Marini, J. J., Capps, J. S., & Culver, B. H. (1985). The inspiratory work of breathing during assisted mechanical ventilation. *Chest, 87*(5), 612-618. [https://doi.org/10.1378/chest.87.5.612](https://doi.org/10.1378/chest.87.5.612)
