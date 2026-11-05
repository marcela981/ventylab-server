<!-- page: que-mide-el-ventilador | THEORY | Qué mide el ventilador y qué significa cada valor -->
<!-- block: INTRODUCTION | Por qué importa -->
Un ventilador mecánico no solo entrega gas: también es el instrumento de medida más completo que tienes junto a la cama del paciente. Cada ciclo deja un registro de presiones, flujos y volúmenes que, bien leído, te dice si el pulmón se está volviendo más rígido, si la vía aérea se está obstruyendo, si hay una fuga o si el aire no alcanza a salir antes de la siguiente respiración. Muchos de estos cambios aparecen en la pantalla antes de que se alteren la saturación o la gasometría.

El monitoreo básico tiene dos componentes que se complementan: los **valores numéricos** (presión pico, presión meseta, PEEP, presión media, volúmenes y ventilación minuto) y las **curvas escalares**, es decir, la presión, el flujo y el volumen dibujados frente al tiempo. Los números resumen; las curvas explican de dónde salen los números (Dexter & Clark, 2020).

<!-- block: THEORY | De dónde salen los datos -->
El ventilador mide directamente solo dos magnitudes: **presión** y **flujo**. Los sensores pueden estar dentro del equipo (en las ramas inspiratoria y espiratoria) o en la pieza en Y, cerca del paciente. El **volumen** no se mide: el ventilador lo calcula integrando el flujo en el tiempo, de modo que cualquier error del sensor de flujo (agua, secreciones, calibración) se traslada al volumen.

Esto tiene una consecuencia práctica: la presión que ves es la **presión en la vía aérea proximal** ($P_{aw}$), no la presión dentro de los alvéolos. Mientras hay flujo, la presión proximal incluye la presión necesaria para vencer la resistencia del tubo y de las vías aéreas. Solo cuando el flujo se detiene (en una pausa) la presión proximal se equilibra con la alveolar. Esta idea, que viene de la ecuación del movimiento estudiada en el módulo de mecánica respiratoria, es la base de todo lo que sigue (Hess, 2014).

<!-- block: THEORY | Los valores numéricos esenciales -->
| Variable | Qué representa | Qué la modifica |
|---|---|---|
| Presión pico ($P_{pico}$) | Presión máxima en la vía aérea durante la inspiración | Resistencia, flujo, volumen, compliance, PEEP |
| Presión meseta ($P_{plat}$) | Presión con flujo cero al final de la inspiración; estima la presión alveolar | Volumen corriente, compliance, PEEP total |
| PEEP programada y PEEP total | Presión al final de la espiración; la total incluye la auto-PEEP | Ajuste de PEEP, vaciado incompleto |
| Presión media ($P_{media}$) | Promedio de la presión en todo el ciclo | PEEP, presión inspiratoria, tiempo inspiratorio |
| Vti y Vte | Volumen inspirado y espirado en cada ciclo | Modo, mecánica, fugas |
| Ventilación minuto (VE) | Volumen espirado por minuto | Vt y frecuencia total |

Algunas ideas clave para leer esta tabla:

- **Pico y meseta no miden lo mismo.** El pico suma un componente resistivo y uno elástico; la meseta solo refleja el elástico más la PEEP. Por eso, si sube el pico sin que cambie la meseta, el problema está en la resistencia (tubo, secreciones, broncoespasmo); si suben los dos en paralelo, el sistema respiratorio se ha vuelto más rígido o el volumen ha aumentado.
- **La meseta es un indicador de seguridad.** En el ensayo ARDSNet, la estrategia protectora mantuvo la presión meseta en 30 cmH₂O o menos, y esa cifra se ha convertido en una referencia habitual (Acute Respiratory Distress Syndrome Network, 2000). El tema se desarrolla en el módulo de ventilación protectora.
- **El volumen que cuenta es el espirado.** El Vte es el volumen que realmente salió del paciente; si es claramente menor que el Vti, una parte del gas se perdió por una fuga (manguito, circuito, fístula).
- **La presión media** se relaciona con la oxigenación y con los efectos hemodinámicos de la ventilación, porque representa la presión que el pulmón y el tórax "sienten" en promedio (Marini & Ravenscraft, 1992).

<!-- block: THEORY | Las tres curvas escalares -->
Las curvas escalares muestran cada variable en el eje vertical y el tiempo en el horizontal. Conviene leerlas siempre juntas y alineadas, porque un mismo instante del ciclo aparece en las tres a la vez.

![Tres curvas alineadas en el tiempo en ventilación controlada por volumen con flujo constante: la presión sube en rampa hasta la presión pico, cae a una meseta durante la pausa inspiratoria y vuelve a la PEEP; el flujo inspiratorio es rectangular, se hace cero en la pausa y el espiratorio es negativo y decae hasta cero; el volumen sube linealmente, se mantiene en la pausa y desciende durante la espiración](/learning/diagrams/b6-monitorizacion-escalares-vcv.svg "Figura: curvas de presión, flujo y volumen en VCV con pausa inspiratoria")

- **Presión-tiempo:** muestra cómo se presuriza el sistema. En VCV con flujo constante dibuja una rampa; en PCV, una forma casi rectangular.
- **Flujo-tiempo:** el flujo inspiratorio se dibuja por encima de la línea de cero y el espiratorio por debajo. Es la curva más informativa para detectar que la espiración no termina (el flujo no vuelve a cero antes del siguiente ciclo).
- **Volumen-tiempo:** sube durante la inspiración y baja en la espiración. Debe volver a la línea de base; si queda "colgada" por encima de cero y se corta bruscamente, sugiere una fuga.
<!-- page: formulas-y-calculo | EXERCISE | Fórmulas y cálculo a partir del monitor -->
<!-- block: INTRODUCTION | De la pantalla a la mecánica -->
Con tres números que el ventilador ya te ofrece (presión pico, presión meseta y PEEP total) y dos que tú programas (volumen corriente y flujo), puedes estimar la compliance y la resistencia del sistema respiratorio en pocos segundos. Estas cuentas solo son válidas si el paciente está **pasivo** (sin esfuerzo inspiratorio), en **VCV con flujo constante** y con una **pausa inspiratoria** que deje ver una meseta estable.

<!-- block: THEORY | Fórmulas básicas -->
La diferencia entre pico y meseta refleja el componente resistivo:

$$
R_{aw} = \frac{P_{pico} - P_{plat}}{\dot{V}}
$$

La diferencia entre meseta y PEEP total refleja el componente elástico, y su cociente con el volumen corriente da la compliance estática:

$$
C_{st} = \frac{V_T}{P_{plat} - PEEP_{total}}
$$

Ese mismo denominador es la **presión de distensión** o *driving pressure*:

$$
\Delta P = P_{plat} - PEEP_{total}
$$

La ventilación minuto espirada es el producto del volumen espirado por la frecuencia total (programada más la disparada por el paciente):

$$
\dot{V}_E = V_{Te}\cdot f
$$

Y la fracción de fuga se estima comparando lo que entra con lo que sale:

$$
\text{Fuga}\,(\%) = \frac{V_{Ti} - V_{Te}}{V_{Ti}}\times 100
$$

Símbolos y unidades:

- $P_{pico}$, $P_{plat}$, $PEEP_{total}$: presiones en cmH₂O.
- $\dot{V}$: flujo inspiratorio en L/s (divide los L/min entre 60).
- $V_T$, $V_{Ti}$, $V_{Te}$: volumen corriente, inspirado y espirado; en L para la compliance (el resultado se expresa en mL/cmH₂O multiplicando por 1000).
- $R_{aw}$: resistencia en cmH₂O/L/s; $C_{st}$: compliance en mL/cmH₂O.
- $f$: frecuencia respiratoria total en respiraciones/min; $\dot{V}_E$ en L/min.

<!-- block: EQUATION | Presión media con onda de presión rectangular -->
\bar{P}_{aw} \approx \left(P_{insp} - PEEP\right)\cdot\frac{T_i}{T_{tot}} + PEEP

<!-- block: THEORY | Sobre la presión media -->
La presión media es, por definición, el área bajo la curva de presión dividida por la duración del ciclo. Si la onda de presión es casi rectangular, como en PCV, el área se calcula como un rectángulo y se obtiene la expresión anterior. Con una rampa (VCV) el área es menor y la fórmula sobrestima el valor real; por eso, en la práctica, usa el valor que calcula el ventilador. Lo importante es entender sus determinantes: **PEEP, presión inspiratoria y fracción del ciclo que dura la inspiración**. Subir la PEEP o alargar el tiempo inspiratorio eleva la presión media, con efectos sobre la oxigenación y sobre el retorno venoso (Marini & Ravenscraft, 1992).

<!-- block: CALLOUT:info | Cuánto debe durar la pausa -->
La meseta no es perfectamente plana: la presión sigue cayendo un poco durante los primeros segundos de pausa porque el gas se redistribuye entre regiones con distintas constantes de tiempo. En un estudio fisiológico, la presión leída a los 0,5 s de pausa fue unos 2 cmH₂O mayor que a los 5 s, y esa diferencia hizo sobrestimar la elastancia y subestimar la resistencia calculadas (Barberis et al., 2003). Usa siempre la misma duración de pausa cuando compares mediciones en el tiempo.

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente pasivo en VCV: $V_T = 450\,\text{mL}$, flujo constante de $60\,\text{L/min}$, PEEP programada $5\,\text{cmH}_2\text{O}$, sin auto-PEEP en la pausa espiratoria. El monitor muestra $P_{pico} = 28\,\text{cmH}_2\text{O}$ y, con pausa inspiratoria, $P_{plat} = 20\,\text{cmH}_2\text{O}$. Frecuencia total 16/min; Vti 450 mL, Vte 440 mL.

**1. Convierte el flujo:** $60\,\text{L/min} \div 60 = 1\,\text{L/s}$.

**2. Resistencia:** $R_{aw} = (28 - 20) / 1 = 8\,\text{cmH}_2\text{O/L/s}$.

**3. Driving pressure:** $\Delta P = 20 - 5 = 15\,\text{cmH}_2\text{O}$.

**4. Compliance estática:** $C_{st} = 0{,}450 / 15 = 0{,}030\,\text{L/cmH}_2\text{O} = 30\,\text{mL/cmH}_2\text{O}$.

**5. Ventilación minuto:** $\dot{V}_E = 0{,}440 \times 16 = 7{,}04\,\text{L/min}$.

**6. Fuga:** $(450 - 440)/450 \times 100 \approx 2{,}2\,\%$, una diferencia pequeña que puede deberse a la precisión de los sensores.

**Interpretación:** el componente resistivo es de 8 cmH₂O y el elástico de 15 cmH₂O. Si en una hora el pico sube a 38 cmH₂O con la meseta todavía en 20 cmH₂O, la resistencia se habría duplicado (18 cmH₂O/L/s) con la compliance intacta: piensa primero en el tubo y la vía aérea, no en el parénquima.
<!-- page: lectura-sistematica | THEORY | Lectura sistemática de las curvas -->
<!-- block: INTRODUCTION | Un método antes que un patrón -->
Ante una pantalla con tres curvas y una docena de números, el riesgo es fijarse en lo más llamativo y pasar por alto lo importante. Un orden fijo de lectura, siempre el mismo, reduce ese riesgo y te obliga a correlacionar las curvas entre sí en lugar de interpretar cada una aislada (Dexter & Clark, 2020).

<!-- block: THEORY | Seis pasos de lectura -->
![Diagrama de flujo con seis pasos de lectura sistemática: 1 comprobar escalas y unidades, 2 identificar el modo por la forma de la presión y el flujo, 3 revisar el disparo y la sincronía, 4 evaluar la mecánica con pico, meseta y PEEP, 5 comprobar que el flujo espiratorio vuelve a cero y que el volumen regresa a la base, 6 correlacionar con el paciente y decidir, con una flecha de retorno para reevaluar tras cada ajuste](/learning/diagrams/b6-monitorizacion-lectura-sistematica.svg "Figura: secuencia de lectura sistemática del monitor")

1. **Escalas y unidades.** Una escala de presión mal elegida puede aplanar una meseta o esconder una muesca. Comprueba que las curvas no estén recortadas por la parte superior.
2. **Modo.** Reconócelo por la forma: si el flujo es rectangular y la presión hace rampa, el ventilador controla el flujo (VCV); si la presión es rectangular y el flujo decae, controla la presión (PCV o PSV). Saber qué variable fija el ventilador te dice cuál será la variable dependiente que debes vigilar: en VCV, la presión; en PCV, el volumen.
3. **Disparo y sincronía.** Busca una pequeña deflexión negativa de presión o un flujo inspiratorio que aparece antes del ciclo: indican esfuerzo del paciente. Los detalles se estudian en el módulo de asincronías.
4. **Mecánica.** Lee pico, meseta y PEEP total y calcula el componente resistivo y el elástico. Compara con las mediciones previas: la tendencia vale más que el valor aislado.
5. **Espiración.** El flujo espiratorio debe llegar a cero antes de la siguiente inspiración, y el volumen debe volver a la línea de base.
6. **Paciente y decisión.** Correlaciona con la exploración, la saturación, la hemodinamia y los gases, decide y vuelve al paso 1 después de cada ajuste.

<!-- block: THEORY | Hallazgos que debes reconocer desde el principio -->
- **Flujo espiratorio que no llega a cero.** La siguiente inspiración comienza mientras todavía sale gas: los alvéolos no alcanzaron su volumen de reposo y queda una presión positiva al final de la espiración, la auto-PEEP. No aparece en el manómetro durante la ventilación normal; se mide ocluyendo la válvula espiratoria al final de la espiración (Pepe & Marini, 1982). Es típica de la obstrucción al flujo aéreo y de frecuencias altas con tiempos espiratorios cortos.
- **Volumen que no vuelve a cero.** La rama espiratoria de la curva de volumen queda por encima de la base y el ventilador la "corta" al iniciar el siguiente ciclo. Significa que salió menos gas del que entró: una fuga.
- **Oscilaciones en dientes de sierra** en el flujo espiratorio, y a veces en la presión: sugieren secreciones o agua condensada en el circuito.
- **Pico que sube con meseta estable:** aumento de resistencia. **Pico y meseta que suben juntos:** caída de la compliance o aumento del volumen.
- **Muesca o concavidad en la rampa de presión en VCV:** el paciente demanda más flujo del que se le entrega.

<!-- block: CALLOUT:info | Curvas e intervenciones -->
Las curvas también te dicen si una intervención funcionó: tras aspirar secreciones, el pico debería bajar; tras un broncodilatador en un paciente con obstrucción, el flujo espiratorio debería acercarse más a cero al final de la espiración. Usa el monitor como una medida de antes y después, no solo como un detector de problemas.

<!-- block: THEORY | Limitaciones del monitoreo básico -->
Las mediciones estáticas (meseta, auto-PEEP) solo son fiables con el paciente relajado: cualquier esfuerzo durante la pausa altera la lectura. Las curvas dependen de la calidad del sensor de flujo y de la compensación del circuito. Y la presión en la vía aérea no distingue entre la parte que distiende el pulmón y la que distiende la pared torácica; esa separación requiere presión esofágica, un tema del nivel avanzado (Hess, 2014).
<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: un cambio en el monitor -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** varón de 58 años, 78 kg, peso predicho de 70 kg, en el posoperatorio inmediato de una laparotomía, intubado con tubo de 7,5 mm, sedado y sin esfuerzo inspiratorio.

**Ajustes:** VCV, $V_T = 420\,\text{mL}$, frecuencia 16/min, flujo constante de 50 L/min, PEEP 5 cmH₂O, FiO₂ 0,40, pausa inspiratoria de 0,5 s.

**Primera lectura (08:00):** $P_{pico} = 22$, $P_{plat} = 16$, PEEP total 5 cmH₂O; Vte 415 mL; VE 6,6 L/min; SpO₂ 97 %.

**Segunda lectura (09:30):** suena la alarma de presión alta. $P_{pico} = 34$, $P_{plat} = 17$, PEEP total 5 cmH₂O; Vte 410 mL; SpO₂ 95 %. En la curva de flujo espiratorio ves oscilaciones irregulares y en la auscultación hay roncus.

**Razonamiento paso a paso:**

1. **Escalas y modo:** VCV con flujo rectangular; la variable que cambia es la presión, como era de esperar.
2. **Separa componentes.** Flujo $= 50/60 \approx 0{,}83\,\text{L/s}$. A las 08:00, resistencia $= (22-16)/0{,}83 \approx 7{,}2\,\text{cmH}_2\text{O/L/s}$; a las 09:30, $(34-17)/0{,}83 \approx 20{,}5\,\text{cmH}_2\text{O/L/s}$.
3. **Compliance:** a las 08:00, $420/(16-5) \approx 38\,\text{mL/cmH}_2\text{O}$; a las 09:30, $420/(17-5) = 35\,\text{mL/cmH}_2\text{O}$. Casi sin cambio.
4. **Conclusión mecánica:** la resistencia casi se triplicó con la compliance estable. El problema es de la vía aérea o del tubo, no del parénquima.
5. **Correlación:** oscilaciones en el flujo y roncus orientan a secreciones. Otras causas a descartar: tubo acodado o mordido, broncoespasmo.
6. **Acción y reevaluación:** aspiración de secreciones. Después, el pico baja a 23 cmH₂O y las oscilaciones desaparecen: la medida de antes y después confirma la hipótesis.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y prueba lo siguiente:

1. En VCV, activa una pausa inspiratoria y localiza el pico y la meseta en la curva de presión.
2. Aumenta la resistencia del paciente: verás que el pico sube y la meseta casi no cambia.
3. Vuelve a la resistencia inicial y reduce la compliance: ahora pico y meseta suben juntos.
4. Cambia a PCV y repite el paso 3: esta vez la presión no cambia, pero el volumen corriente y la ventilación minuto caen.

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** En VCV, el pico pasa de 25 a 35 cmH₂O y la meseta de 18 a 28 cmH₂O, con la misma PEEP. ¿Qué cambió?

*Respuesta:* la diferencia pico-meseta se mantuvo en 7 cmH₂O, así que la resistencia no cambió. La meseta subió 10 cmH₂O con el mismo volumen: la compliance cayó (por ejemplo, atelectasia, neumotórax, distensión abdominal o intubación selectiva). Evalúa al paciente antes de tocar el ventilador.

**2.** En PCV, con la misma presión inspiratoria, el Vte cae de 480 a 330 mL. ¿Por qué no sonó la alarma de presión alta?

*Respuesta:* en PCV la presión es la variable controlada y no cambia; lo que cambia es el volumen. Un aumento de resistencia o una caída de compliance se manifiesta como menos volumen. Por eso en PCV debes vigilar sobre todo el Vte y la VE.

**3.** El flujo espiratorio no llega a cero antes de cada inspiración en un paciente con EPOC. ¿Qué medición confirma el hallazgo?

*Respuesta:* una pausa espiratoria (oclusión al final de la espiración) con el paciente pasivo, que muestra la PEEP total; la diferencia con la PEEP programada es la auto-PEEP (Pepe & Marini, 1982).
<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El ventilador mide presión y flujo; el volumen se calcula integrando el flujo, por lo que hereda los errores del sensor de flujo.
- La presión pico incluye un componente resistivo y uno elástico; la meseta, medida con flujo cero, estima la presión alveolar al final de la inspiración.
- Pico que sube con meseta estable indica más resistencia; pico y meseta que suben juntos indican menos compliance o más volumen.
- La meseta es una referencia de seguridad: la estrategia protectora del ensayo ARDSNet la mantuvo en 30 cmH₂O o menos (Acute Respiratory Distress Syndrome Network, 2000).
- El volumen que importa es el espirado; una diferencia importante entre Vti y Vte indica fuga.
- En VCV vigila la presión; en PCV y PSV vigila el volumen corriente y la ventilación minuto.
- Un flujo espiratorio que no vuelve a cero sugiere auto-PEEP, que se confirma con una pausa espiratoria (Pepe & Marini, 1982).
- Lee siempre en el mismo orden y reevalúa después de cada ajuste: la tendencia vale más que un valor aislado.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Medir la meseta con el paciente haciendo esfuerzo** → el esfuerzo modifica la presión durante la pausa y la lectura no representa la presión alveolar → mide con el paciente pasivo y repite si la meseta no es estable.
- **Interpretar la presión pico como si fuera la presión alveolar** → en el pico se suma la presión resistiva del tubo y la vía aérea → usa la meseta para juzgar distensión y la diferencia pico-meseta para juzgar resistencia.
- **Fiarse del volumen programado en lugar del espirado** → con una fuga, el paciente recibe menos de lo programado → vigila el Vte y compáralo con el Vti.
- **Esperar alarmas de presión en PCV** → en PCV la presión no cambia aunque empeore la mecánica → ajusta y vigila los límites de volumen y de ventilación minuto.
- **Leer una sola curva** → un mismo hallazgo puede tener varias causas → correlaciona presión, flujo y volumen en el mismo instante del ciclo.
- **Comparar mesetas medidas con pausas de distinta duración** → la presión sigue bajando durante la pausa (Barberis et al., 2003) → usa siempre la misma duración.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Barberis, L., Manno, E., & Guérin, C. (2003). Effect of end-inspiratory pause duration on plateau pressure in mechanically ventilated patients. *Intensive Care Medicine, 29*(1), 130-134. [https://doi.org/10.1007/s00134-002-1568-z](https://doi.org/10.1007/s00134-002-1568-z)
- Dexter, A. M., & Clark, K. (2020). Ventilator graphics: Scalars, loops, & secondary measures. *Respiratory Care, 65*(6), 739-759. [https://doi.org/10.4187/respcare.07805](https://doi.org/10.4187/respcare.07805)
- Hess, D. R. (2014). Respiratory mechanics in mechanically ventilated patients. *Respiratory Care, 59*(11), 1773-1794. [https://doi.org/10.4187/respcare.03410](https://doi.org/10.4187/respcare.03410)
- Marini, J. J., & Ravenscraft, S. A. (1992). Mean airway pressure: Physiologic determinants and clinical importance—Part 1: Physiologic determinants and measurements. *Critical Care Medicine, 20*(10), 1461-1472. [https://doi.org/10.1097/00003246-199210000-00017](https://doi.org/10.1097/00003246-199210000-00017)
- Pepe, P. E., & Marini, J. J. (1982). Occult positive end-expiratory pressure in mechanically ventilated patients with airflow obstruction: The auto-PEEP effect. *American Review of Respiratory Disease, 126*(1), 166-170. [https://pubmed.ncbi.nlm.nih.gov/7046541/](https://pubmed.ncbi.nlm.nih.gov/7046541/)
