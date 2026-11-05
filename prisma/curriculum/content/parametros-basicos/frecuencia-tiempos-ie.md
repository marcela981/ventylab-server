<!-- page: ciclo-ventilatorio-en-el-tiempo | THEORY | Conceptos: el ciclo ventilatorio repartido en el tiempo -->
<!-- block: INTRODUCTION | Por qué importa -->
La frecuencia respiratoria (FR) parece el parámetro más sencillo del ventilador: cuántas respiraciones por minuto. Sin embargo, al fijarla decides también cuánto tiempo dura cada ciclo, y ese tiempo hay que repartirlo entre inspirar y espirar. Si la espiración se queda corta, el pulmón no termina de vaciarse y el gas se acumula de un ciclo al siguiente (auto-PEEP). Si la inspiración es demasiado corta o demasiado larga respecto de lo que el paciente desea, aparecen asincronías. Y si el producto de FR por volumen corriente no basta, sube la PaCO₂.

Esta lección te enseña a "ver" el ciclo como una línea de tiempo: frecuencia, tiempo inspiratorio (Ti), pausa, tiempo espiratorio (Te), relación I:E, flujo inspiratorio y ventilación minuto, y cómo se condicionan entre sí.

<!-- block: THEORY | La duración del ciclo la fija la frecuencia -->
Si programas 15 respiraciones por minuto, cada ciclo dispone de 60 / 15 = 4 segundos. Ese **tiempo de ciclo total** (TCT) se divide en dos partes que siempre suman lo mismo: el **Ti**, desde que empieza a entrar gas hasta que se abre la válvula espiratoria, y el **Te**, desde ese momento hasta que comienza la siguiente inspiración. Cualquier cosa que alargue el Ti, con la FR constante, acorta el Te en la misma cantidad.

La **relación I:E** expresa esa proporción. Se escribe con el Ti normalizado a 1: un Ti de 1 s y un Te de 3 s dan 1:3. Cuanto mayor sea el segundo número, más tiempo relativo tiene el pulmón para vaciarse. El protocolo de la red ARDS recomienda que la inspiración no dure más que la espiración, es decir, una relación I:E de 1:1 o con un Te mayor (NHLBI ARDS Network, 2008).

#### Cómo se obtiene el Ti según el modo

- **VCV con flujo constante.** No programas el Ti directamente: resulta del volumen corriente dividido por el flujo inspiratorio, más la pausa inspiratoria si la usas. Más flujo significa un Ti más corto; un Vt mayor o una pausa más larga, un Ti más largo.
- **PCV.** Programas el Ti (o la relación I:E, según el fabricante). El volumen que entra dependerá de la presión, la mecánica del paciente y ese tiempo.
- **Modos espontáneos (PSV).** El Ti lo decide el paciente junto con el criterio de ciclado; no hay FR programada.

En VCV, la forma del flujo también modifica el Ti: con un flujo constante (onda cuadrada) el Vt entra antes que con un flujo desacelerado del mismo pico, por lo que la onda cuadrada se usa a veces para alargar el Te en pacientes con riesgo de atrapamiento (Walter et al., 2018).

![Curvas de presión y de flujo frente al tiempo en VCV durante dos ciclos, con el tiempo inspiratorio de flujo, la pausa, el tiempo espiratorio y el ciclo total señalados](/learning/diagrams/b4-fr-ciclo-tiempos.svg "Figura: tiempos del ciclo en VCV con flujo constante y pausa")

<!-- block: THEORY | Ventilación minuto y ventilación alveolar -->
La **ventilación minuto** (VE) es el volumen total movilizado por minuto: volumen corriente por frecuencia. En adultos que requieren ventilación por causas que no alteran mucho el intercambio de CO₂, una VE de unos 6 a 8 L/min suele ser suficiente (Walter et al., 2018). Pacientes con sepsis, acidosis metabólica o SDRA pueden necesitar bastante más.

No todo ese volumen participa en el intercambio. Una parte de cada Vt llena la vía aérea de conducción, el tubo endotraqueal y las piezas del circuito situadas entre la pieza en Y y el paciente: es el **espacio muerto**. Lo que elimina CO₂ es la **ventilación alveolar** (VA), que se obtiene restando el espacio muerto a cada Vt antes de multiplicar por la FR. De ahí una consecuencia práctica muy importante: con la misma VE, un patrón de Vt pequeño y FR alta ventila peor los alvéolos que uno de Vt mayor y FR menor, porque el espacio muerto se "paga" en cada respiración. Por eso la estrategia de Vt bajo eleva algo la PaCO₂ y baja el pH respecto de Vt más altos (Serpa Neto et al., 2012), y por eso los protocolos de Vt bajo incluyen frecuencias más altas (Simonis et al., 2015). La lección «Volúmenes pulmonares, espacio muerto y ventilación alveolar» desarrolla la fisiología del espacio muerto.

<!-- block: CALLOUT:info | Un tiempo, dos personas -->
En los modos asistidos, el paciente puede disparar más ciclos que los programados. La FR real (la que muestra el monitor) puede ser mayor que la programada, y con ella el TCT de cada ciclo se acorta. Revisa siempre la FR medida, no solo la que programaste, cuando calcules el Te.

<!-- page: formulas-tiempos | EXERCISE | Fórmulas y cálculo de los tiempos -->
<!-- block: THEORY | Ecuaciones del ciclo -->
Las relaciones son aritméticas, pero conviene escribirlas con sus unidades:

$$
TCT = \frac{60}{FR}
$$

$$
T_i = \frac{V_T}{\dot{V}_{insp}} + T_{pausa}
$$

$$
T_e = TCT - T_i \qquad\qquad I{:}E = 1 : \frac{T_e}{T_i}
$$

$$
\dot{V}_E = V_T \times FR \qquad\qquad \dot{V}_A = \left(V_T - V_D\right)\times FR
$$

| Símbolo | Significado | Unidad |
|---|---|---|
| $FR$ | Frecuencia respiratoria | respiraciones/min |
| $TCT$ | Tiempo de ciclo total | s |
| $T_i$, $T_e$ | Tiempo inspiratorio y espiratorio | s |
| $\dot{V}_{insp}$ | Flujo inspiratorio constante (L/min ÷ 60 = L/s) | L/s |
| $V_T$, $V_D$ | Volumen corriente y espacio muerto | L |

Un detalle que causa muchos errores: el ventilador muestra el flujo en L/min, pero para calcular el Ti necesitas L/s. Un flujo de 60 L/min equivale a 1 L/s.

<!-- block: EQUATION | Relación entre ventilación alveolar y PaCO₂ (producción de CO₂ constante) -->
PaCO_{2,\text{nueva}} \approx PaCO_{2,\text{actual}} \times \frac{\dot{V}_{A,\text{actual}}}{\dot{V}_{A,\text{nueva}}}

<!-- block: THEORY | De dónde sale la última fórmula -->
En equilibrio, la PaCO₂ es proporcional a la producción de CO₂ dividida entre la ventilación alveolar. Si la producción no cambia en los minutos siguientes, duplicar la VA reduce la PaCO₂ aproximadamente a la mitad, y reducir la VA a la mitad la duplica. Es una aproximación: no tiene en cuenta los cambios del espacio muerto fisiológico, de la producción de CO₂ por fiebre o agitación, ni el tiempo que tarda el CO₂ corporal en equilibrarse. Úsala para estimar la dirección y la magnitud del cambio, y confirma siempre con una gasometría. La lección de gasometría y ajustes del ventilador la amplía.

<!-- block: EXERCISE | Ejemplo resuelto -->
**Programación:** VCV, Vt 450 mL, FR 16, flujo constante 60 L/min, pausa inspiratoria 0,3 s. Supón un espacio muerto de 150 mL (valor ilustrativo).

1. TCT $= 60/16 = 3{,}75$ s.
2. Flujo en L/s: $60/60 = 1$ L/s. Ti de flujo $= 0{,}45/1 = 0{,}45$ s. Ti total $= 0{,}45 + 0{,}3 = 0{,}75$ s.
3. Te $= 3{,}75 - 0{,}75 = 3{,}0$ s. I:E $= 1 : (3{,}0/0{,}75) = 1:4$.
4. VE $= 0{,}45 \times 16 = 7{,}2$ L/min.
5. VA $= (0{,}45 - 0{,}15) \times 16 = 4{,}8$ L/min.

**Variación A: subes la FR a 24.** TCT $= 2{,}5$ s; Te $= 2{,}5 - 0{,}75 = 1{,}75$ s; I:E $= 1:2{,}3$. VE $= 10{,}8$ L/min; VA $= 7{,}2$ L/min. Si la PaCO₂ inicial era 55 mmHg, la estimación es $55 \times 4{,}8/7{,}2 \approx 37$ mmHg. Observa que el Te se acortó casi a la mitad.

**Variación B: bajas el flujo a 30 L/min con FR 16.** Flujo $= 0{,}5$ L/s; Ti de flujo $= 0{,}9$ s; Ti total $= 1{,}2$ s; Te $= 2{,}55$ s; I:E $= 1:2{,}1$. La VE no cambia, pero el pulmón dispone de menos tiempo para vaciarse y el paciente percibe una inspiración más lenta.

**Variación C: Vt 300 mL y FR 24 (misma VE de 7,2 L/min).** VA $= (0{,}30 - 0{,}15) \times 24 = 3{,}6$ L/min, frente a 4,8 L/min del patrón inicial. Misma VE, peor ventilación alveolar: el espacio muerto pesa más.

<!-- page: aplicacion-clinica-tiempos | CASE_STUDY | Aplicación clínica: cuando el tiempo espiratorio no alcanza -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Situación.** Hombre de 67 años con EPOC grave, intubado por una exacerbación con acidosis respiratoria. Talla 172 cm (PBW 67,8 kg). Programación inicial: VCV, Vt 480 mL (unos 7 mL/kg de PBW), FR 14, flujo constante 60 L/min, sin pausa, PEEP 5 cmH₂O. Una hora después, la gasometría muestra pH 7,24 y PaCO₂ 70 mmHg. Para "corregir el CO₂" se sube la FR a 28. Treinta minutos más tarde, la presión arterial cae, la presión meseta aumenta y el paciente parece hacer esfuerzos que el ventilador no detecta.

**Paso 1: calcula los tiempos antes y después.** Ti $= 0{,}48/1 = 0{,}48$ s en ambos casos. Con FR 14: TCT $= 4{,}29$ s y Te $= 3{,}81$ s. Con FR 28: TCT $= 2{,}14$ s y Te $= 1{,}66$ s. El Te se redujo a menos de la mitad.

**Paso 2: relaciona el Te con la mecánica.** En la obstrucción, la resistencia elevada alarga la constante de tiempo espiratoria (τ = R·C). Con un vaciado exponencial pasivo, tras un tiempo igual a τ sale alrededor del 63 % del volumen, y tras 3τ alrededor del 95 %. Si τ ronda 1 s, un Te de 1,66 s no basta: el siguiente ciclo empieza con gas atrapado y la presión alveolar al final de la espiración supera la PEEP programada. En la curva de flujo lo ves porque el flujo espiratorio no vuelve a cero antes de la siguiente inspiración (Walter et al., 2018).

**Paso 3: explica los hallazgos.** El aumento de la presión intratorácica reduce el retorno venoso y aumenta la poscarga del ventrículo derecho, lo que explica la hipotensión; además, el paciente tiene que vencer la auto-PEEP antes de poder disparar el ventilador, de ahí los esfuerzos no detectados (Walter et al., 2018).

**Paso 4: corrige.** Las estrategias que alargan el Te (bajar la FR, limitar el Vt y aumentar el flujo inspiratorio) reducen la auto-PEEP (Walter et al., 2018). Para estos pacientes se proponen FR iniciales de 10 a 14, flujo constante de 60 L/min y una VE objetivo de 6 a 8 L/min, aceptando elevaciones de la PaCO₂ siempre que el pH no baje de 7,15 (Walter et al., 2018). Si la inestabilidad hemodinámica es grave y se atribuye a auto-PEEP, desconectar brevemente al paciente del ventilador para permitir la exhalación forma parte del manejo descrito (Walter et al., 2018). El manejo completo de la EPOC ventilada se trata en el nivel avanzado.

![Dos curvas de flujo en un pulmón obstructivo: con frecuencia de 16 el flujo espiratorio vuelve casi a cero; con frecuencia de 30 el tiempo espiratorio es de 1,25 segundos y el flujo no llega a cero antes de la siguiente inspiración](/learning/diagrams/b4-fr-te-corto-autopeep.svg "Figura: un tiempo espiratorio corto genera atrapamiento aéreo")

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y prueba lo siguiente:

- Observa la curva de flujo con la programación inicial y comprueba si el flujo espiratorio llega a cero antes de cada inspiración.
- Sube la frecuencia de forma marcada: verás que el flujo espiratorio no llega a cero, que aparece auto-PEEP y que la presión meseta sube.
- Vuelve a una frecuencia baja y aumenta el flujo inspiratorio: el Ti se acorta, el Te se alarga y el atrapamiento disminuye.
- Compara después con el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung): con la misma frecuencia alta, el vaciado es mucho más rápido porque la constante de tiempo es menor.

<!-- block: EXERCISE | Preguntas de práctica -->
**1.** PCV con FR 20 y Ti 1,2 s. ¿Cuál es la relación I:E?

*Respuesta:* TCT $= 3$ s; Te $= 1{,}8$ s; I:E $= 1:1{,}5$. Cumple que la inspiración no supere a la espiración (NHLBI ARDS Network, 2008).

**2.** VCV, Vt 500 mL, flujo 40 L/min, pausa 0,5 s, FR 25. ¿Hay problema?

*Respuesta:* flujo $= 0{,}667$ L/s; Ti de flujo $= 0{,}75$ s; Ti total $= 1{,}25$ s; TCT $= 2{,}4$ s; Te $= 1{,}15$ s. La relación es casi 1:1 y el Te es corto: en un paciente con obstrucción habría riesgo alto de atrapamiento. Puedes acortar la pausa, aumentar el flujo o revisar si esa FR es necesaria.

**3.** PaCO₂ de 60 mmHg con VA estimada de 4 L/min. ¿Qué VA necesitarías para llegar aproximadamente a 40 mmHg?

*Respuesta:* $\dot{V}_{A,\text{nueva}} = 4 \times 60/40 = 6$ L/min. Recuerda que es una estimación y que, en el SDRA, el protocolo limita la FR programada a 35 (NHLBI ARDS Network, 2008).

**4.** Un paciente con esfuerzo inspiratorio propio está en PCV con un Ti programado largo y parece "pelear" con el ventilador al final de cada inspiración. ¿Por qué?

*Respuesta:* porque su tiempo inspiratorio neural no coincide con el Ti mecánico; esa falta de coincidencia es una forma de asincronía de tiempo (Sassoon, 2011).

<!-- page: sintesis-tiempos | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La FR define el tiempo de ciclo total (60/FR); Ti y Te se reparten ese tiempo, y alargar uno acorta el otro.
- En VCV con flujo constante, el Ti es Vt/flujo más la pausa; en PCV el Ti se programa directamente.
- Convierte el flujo a L/s antes de calcular tiempos: 60 L/min = 1 L/s.
- Se recomienda que la inspiración no dure más que la espiración (NHLBI ARDS Network, 2008).
- La VE es Vt × FR; lo que elimina CO₂ es la ventilación alveolar, que descuenta el espacio muerto en cada ciclo.
- Con la misma VE, Vt bajos y FR altas aumentan la fracción de espacio muerto y suelen elevar la PaCO₂ (Serpa Neto et al., 2012).
- En la obstrucción, un Te corto produce atrapamiento y auto-PEEP: el flujo espiratorio no llega a cero (Walter et al., 2018).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Subir la FR para corregir la PaCO₂ en un paciente obstructivo** → acorta el Te y aumenta el atrapamiento, puede causar hipotensión → valora el Te y la curva de flujo antes; en obstrucción, limita FR y Vt y acepta hipercapnia si el pH lo permite (Walter et al., 2018).
- **Confundir L/min con L/s** → calculas Ti 60 veces mayores o menores → divide el flujo en L/min entre 60.
- **Olvidar la pausa al calcular el Ti** → sobrestimas el Te → suma la pausa al Ti en VCV.
- **Mirar solo la FR programada** → en modos asistidos la FR real puede ser mayor y el Te real más corto → usa la FR medida.
- **Igualar ventilación minuto con ventilación alveolar** → con Vt pequeños el espacio muerto consume una fracción mayor → estima la VA y confirma con gasometría.

<!-- block: REFERENCES | Referencias -->
- Walter, J. M., Corbridge, T. C., & Singer, B. D. (2018). Invasive mechanical ventilation. *Southern Medical Journal, 111*(12), 746–753. [https://doi.org/10.14423/SMJ.0000000000000905](https://doi.org/10.14423/SMJ.0000000000000905)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary* [Protocolo]. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Serpa Neto, A., Cardoso, S. O., Manetta, J. A., Pereira, V. G., Espósito, D. C., Pasqualucci, M. de O., et al. (2012). Association between use of lung-protective ventilation with lower tidal volumes and clinical outcomes among patients without acute respiratory distress syndrome: A meta-analysis. *JAMA, 308*(16), 1651–1659. [https://doi.org/10.1001/jama.2012.13730](https://doi.org/10.1001/jama.2012.13730)
- Simonis, F. D., Binnekade, J. M., Braber, A., Gelissen, H. P., et al. (2015). PReVENT — protective ventilation in patients without ARDS at start of ventilation: Study protocol for a randomized controlled trial. *Trials, 16*, 226. [https://doi.org/10.1186/s13063-015-0759-1](https://doi.org/10.1186/s13063-015-0759-1)
- Sassoon, C. S. H. (2011). Triggering of the ventilator in patient-ventilator interactions. *Respiratory Care, 56*(1), 39–51. [https://doi.org/10.4187/respcare.01006](https://doi.org/10.4187/respcare.01006)
