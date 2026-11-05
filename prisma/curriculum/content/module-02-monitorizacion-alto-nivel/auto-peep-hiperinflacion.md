<!-- page: mecanismo-auto-peep | THEORY | Mecanismo: cuando la espiración no termina -->
<!-- block: INTRODUCTION | Por qué importa -->
La espiración en ventilación mecánica es pasiva: el ventilador abre la válvula espiratoria y el gas sale impulsado solo por la retracción elástica del sistema respiratorio. Si el tiempo disponible no alcanza para que el pulmón vuelva a su volumen de reposo, la siguiente inspiración empieza antes de que el vaciado termine. Una parte del volumen queda atrapada, el volumen de fin de espiración aumenta respiración tras respiración y la presión alveolar al final de la espiración queda por encima de la PEEP programada. Esa presión oculta es la **auto-PEEP** (o PEEP intrínseca, PEEPi), y el aumento progresivo del volumen pulmonar es la **hiperinflación dinámica**.

Pepe y Marini describieron el fenómeno en 1982 en pacientes con obstrucción al flujo aéreo: la presión alveolar podía permanecer positiva durante todo el ciclo sin que el manómetro del ventilador lo mostrara, y ese aumento de la presión intratorácica podía deprimir el gasto cardíaco (Pepe & Marini, 1982). Desde entonces se sabe que la auto-PEEP también predispone al barotrauma, aumenta el trabajo respiratorio, causa asincronías, altera la interpretación de la mecánica y la hemodinamia y reduce la eficacia de los modos controlados por presión (Marini, 2011). Reconocerla y medirla es una competencia básica en el paciente con EPOC o asma, pero también aparece en el SDRA con frecuencias altas.

<!-- block: THEORY | Tiempo espiratorio frente a constante de tiempo -->
En un modelo simple de un solo compartimento, el volumen que queda por espirar cae de forma exponencial con una **constante de tiempo** $\tau = R \cdot C$. Tras un tiempo igual a $\tau$ queda por salir alrededor del 37 % del volumen corriente; tras $3\tau$, alrededor del 5 %. Cuanto mayor es la resistencia (broncoespasmo, secreciones, tubo estrecho) o la compliance (enfisema), más lento es el vaciado.

El tiempo espiratorio ($T_E$) depende de la programación: $T_E = 60/FR - T_I$. Cualquier cambio que acorte el $T_E$ (más frecuencia, más tiempo inspiratorio, flujo inspiratorio más lento, pausas largas) o que aumente el volumen a espirar (más volumen corriente) favorece el atrapamiento. Tuxen y Lane lo demostraron en pacientes con obstrucción grave ventilados bajo parálisis: el volumen pulmonar al final de la inspiración aumentó de forma progresiva al subir el volumen corriente o al acortar el tiempo espiratorio, ya fuera por más frecuencia o por un flujo inspiratorio más lento con la misma ventilación minuto; la presión alveolar, venosa central y esofágica subieron en paralelo y la mayoría de los pacientes presentó hipotensión con los volúmenes más altos (Tuxen & Lane, 1987).

En la EPOC y el asma graves, además, la vía aérea pequeña se colapsa durante la espiración (**limitación del flujo espiratorio**): llega un punto en que aumentar la presión de empuje no aumenta el flujo. Por eso el vaciado es todavía más lento de lo que predice una constante de tiempo única, y por eso la PEEP externa se comporta de forma especial en estos pacientes (lo verás en la página de manejo).

![Curvas de flujo frente al tiempo en dos situaciones. Arriba, el flujo espiratorio vuelve a cero antes de la siguiente inspiración. Abajo, con tiempo espiratorio corto, el flujo espiratorio sigue siendo negativo cuando comienza la siguiente inspiración, lo que indica atrapamiento aéreo y auto-PEEP.](/learning/diagrams/a5-autopeep-flujo-tiempo.svg "Figura: si el flujo espiratorio no llega a cero antes del siguiente ciclo, hay atrapamiento y auto-PEEP")

<!-- block: THEORY | Cómo sospecharla en el monitor -->
La pista más útil está en la **curva de flujo-tiempo**: si el flujo espiratorio no ha regresado a la línea de cero cuando empieza la siguiente inspiración, todavía había gas saliendo y la presión alveolar era mayor que la PEEP programada. Otras señales son una presión meseta que sube sin cambios de volumen, una caída de la presión arterial tras aumentar la frecuencia, esfuerzos del paciente que no disparan el ventilador y, en modos controlados por presión, una caída del volumen corriente (la presión de fin de espiración más alta reduce el gradiente de presión disponible para insuflar).

Ten en cuenta que la curva de flujo confirma la presencia de atrapamiento, pero no lo cuantifica: para eso necesitas medir.

<!-- page: medicion-y-calculo | EXERCISE | Medición y cálculo de la auto-PEEP -->
<!-- block: THEORY | Pausa espiratoria: auto-PEEP estática -->
El método de referencia en el paciente pasivo es la **oclusión al final de la espiración**, que Pepe y Marini propusieron como maniobra de cabecera (Pepe & Marini, 1982). Al cerrar las válvulas justo antes de la siguiente inspiración, el flujo se detiene, las presiones de los alvéolos y de la vía aérea central se igualan, y el manómetro del ventilador muestra la presión alveolar media de fin de espiración: la **PEEP total**.

$$
PEEP_{i} = PEEP_{total} - PEEP_{programada}
$$

- $PEEP_{total}$: presión estable durante la pausa espiratoria (cmH₂O).
- $PEEP_{programada}$: PEEP externa ajustada en el ventilador (cmH₂O).
- $PEEP_{i}$: auto-PEEP estática (cmH₂O).

Condiciones para que la medida sea válida (Blanch et al., 2005):

- El paciente debe estar **relajado**: un esfuerzo inspiratorio o una contracción espiratoria durante la pausa falsea la presión.
- La pausa debe durar lo suficiente para que la presión se estabilice (en general, unos segundos).
- No debe haber fugas (circuito, manguito, fístula).

La auto-PEEP estática es un **promedio**: en un pulmón heterogéneo algunas regiones tienen presiones de fin de espiración más altas que otras, y las unidades con vía aérea cerrada al final de la espiración pueden no comunicarse con la vía aérea durante la pausa, de modo que la medida puede infravalorar el atrapamiento real (Blanch et al., 2005). Existe también una auto-PEEP «dinámica», que es la presión necesaria para que empiece el flujo inspiratorio; es menor que la estática porque refleja las unidades con la presión más baja.

![Curva de presión en la vía aérea frente al tiempo durante una pausa espiratoria. Al ocluir al final de la espiración, la presión sube desde la PEEP programada hasta una meseta más alta, la PEEP total; la diferencia es la auto-PEEP.](/learning/diagrams/a5-autopeep-pausa-espiratoria.svg "Figura: la pausa espiratoria revela la PEEP total; la diferencia con la PEEP programada es la auto-PEEP")

<!-- block: THEORY | Otras mediciones útiles -->
- **Volumen atrapado**: con el paciente paralizado, una apnea prolongada permite medir todo el volumen que sale por encima de la capacidad residual funcional. Tuxen y Lane usaron el volumen espirado durante 20-40 s de apnea como medida del volumen de fin de inspiración, y lo consideraron más relevante que la presión pico para el riesgo de barotrauma (Tuxen & Lane, 1987). Es una medida de investigación más que de rutina.
- **Presión meseta**: si sube sin que cambie el volumen corriente, el volumen de fin de espiración probablemente ha aumentado. La meseta incluye la auto-PEEP.
- **Presión esofágica** en el paciente que respira espontáneamente: la caída de la presión esofágica antes de que empiece el flujo inspiratorio estima la auto-PEEP dinámica (Blanch et al., 2005).

<!-- block: EXERCISE | Ejemplo resuelto: ¿cuánto se atrapa? -->
Un paciente pasivo tiene $R = 25\,\text{cmH}_2\text{O·s/L}$ y $C = 0{,}06\,\text{L/cmH}_2\text{O}$. Recibe $V_T = 0{,}5\,\text{L}$, $FR = 20$ y $T_I = 1\,\text{s}$.

1. **Constante de tiempo**: $\tau = 25 \cdot 0{,}06 = 1{,}5\,\text{s}$; tres constantes son 4,5 s.
2. **Tiempo espiratorio**: ciclo de $60/20 = 3\,\text{s}$, de modo que $T_E = 3 - 1 = 2\,\text{s}$, menos de $3\tau$.
3. **Fracción que no se espira en cada ciclo**: $e^{-T_E/\tau} = e^{-2/1{,}5} \approx 0{,}26$.

En el modelo lineal, el volumen atrapado se acumula hasta un equilibrio:

$$
V_{atrapado} = V_T \cdot \frac{e^{-T_E/\tau}}{1 - e^{-T_E/\tau}}
$$

4. $V_{atrapado} = 0{,}5 \cdot 0{,}26 / 0{,}74 \approx 0{,}18\,\text{L}$.
5. **Auto-PEEP estimada**: $PEEP_i = V_{atrapado}/C = 0{,}18/0{,}06 \approx 3\,\text{cmH}_2\text{O}$.

Si bajas la frecuencia a 14 con el mismo $T_I$: ciclo de 4,29 s, $T_E \approx 3{,}29\,\text{s}$, $e^{-3{,}29/1{,}5} \approx 0{,}11$, $V_{atrapado} \approx 0{,}5 \cdot 0{,}11/0{,}89 \approx 0{,}06\,\text{L}$ y $PEEP_i \approx 1\,\text{cmH}_2\text{O}$.

Es un modelo idealizado: con limitación del flujo espiratorio el vaciado es más lento y la auto-PEEP real suele ser mayor. Pero muestra la regla principal: **el tiempo espiratorio y la ventilación minuto mandan**.

<!-- page: consecuencias-y-manejo | THEORY | Consecuencias y estrategias de manejo -->
<!-- block: THEORY | Efectos hemodinámicos -->
La auto-PEEP eleva la presión intratorácica igual que una PEEP externa, pero sin que nadie la haya programado ni la vea en la pantalla. La presión intratorácica alta reduce el retorno venoso y, con volúmenes pulmonares elevados, aumenta la resistencia vascular pulmonar y la poscarga del ventrículo derecho. El resultado puede ser hipotensión, a veces grave, justo después de intubar y ventilar con bolsa o con frecuencias altas a un paciente obstructivo. Pepe y Marini advirtieron que, si no se reconoce, la hipotensión puede tratarse de forma equivocada con restricción de líquidos o vasopresores innecesarios, y que la auto-PEEP eleva además la presión de enclavamiento medida al final de la espiración, lo que confunde la valoración de la volemia (Pepe & Marini, 1982).

Desde el punto de vista fisiológico, si la hipotensión se debe a hiperinflación, debería mejorar al dar más tiempo para espirar. Una apnea breve y controlada que se acompaña de recuperación de la presión arterial apoya el diagnóstico; repítela solo con monitorización continua y vuelve a ventilar con una frecuencia menor.

<!-- block: THEORY | Disparo ineficaz -->
En los modos asistidos, el ventilador detecta el esfuerzo cuando la presión (o el flujo) en la vía aérea cae por debajo de la PEEP programada en la cantidad que fija la sensibilidad. Si hay auto-PEEP, la presión alveolar al inicio del esfuerzo es mayor que la PEEP programada, y los músculos inspiratorios deben primero bajarla hasta ese valor antes de que el ventilador «note» algo. La auto-PEEP actúa como una **carga umbral**: con 8 cmH₂O de auto-PEEP y un disparo de 2 cmH₂O, el paciente necesita generar alrededor de 10 cmH₂O de presión muscular solo para disparar. Los esfuerzos que no lo logran aparecen como **esfuerzos ineficaces**: pequeñas muescas en la curva de presión y deflexiones en la curva de flujo espiratorio sin ciclo del ventilador.

![Esquema de barras que compara la presión que deben generar los músculos para disparar el ventilador sin auto-PEEP, con auto-PEEP de 8 cmH₂O y con PEEP externa añadida que contrabalancea parte de la auto-PEEP.](/learning/diagrams/a5-autopeep-disparo-umbral.svg "Figura: la auto-PEEP se suma al umbral de disparo; una PEEP externa adecuada en el paciente con limitación del flujo reduce esa carga")

<!-- block: THEORY | Estrategias -->
El tratamiento combina tres líneas: reducir la obstrucción, dar más tiempo para espirar y reducir el volumen que hay que espirar.

1. **Reducir la ventilación minuto**, sobre todo la frecuencia: es la medida más eficaz, porque alarga el $T_E$ y disminuye el volumen a espirar (Tuxen & Lane, 1987). Esto implica a menudo aceptar hipercapnia mientras el pH lo permita.
2. **Reducir el volumen corriente**, que también acorta el vaciado necesario.
3. **Acortar el tiempo inspiratorio**: aumentar el flujo inspiratorio en VCV o reducir el $T_I$ en PCV, y evitar pausas inspiratorias largas. La presión pico subirá por el componente resistivo, pero esa presión se disipa en la vía aérea y no refleja la distensión alveolar.
4. **Tratar la causa**: broncodilatadores, corticoides cuando estén indicados, aspiración de secreciones, comprobar que el tubo no esté acodado o mordido, y usar un tubo de calibre adecuado.
5. **PEEP externa, con criterio**. En el paciente con limitación del flujo espiratorio que **dispara** el ventilador, una PEEP externa inferior a la auto-PEEP reduce la carga umbral sin aumentar el atrapamiento, porque el flujo no depende de la presión aguas abajo del punto de colapso. Smith y Marini observaron que 5-10 cmH₂O de PEEP mejoraron la sensibilidad efectiva del disparo y redujeron el trabajo respiratorio sin aumentar sustancialmente la hiperinflación (Smith & Marini, 1988); Guérin y colaboradores mostraron que una PEEP cercana a la auto-PEEP redujo el trabajo inspiratorio sin más hiperinflación (Guérin et al., 2000). El límite es estrecho: en ventilación controlada, Ranieri y colaboradores observaron que una PEEP superior al 85 % de la auto-PEEP produjo más hiperinflación y empeoró la hemodinamia y el intercambio gaseoso (Ranieri et al., 1993). Tras cualquier cambio de PEEP, vuelve a medir la PEEP total y la meseta: si suben, la PEEP externa se está sumando al atrapamiento.

<!-- page: aplicacion-clinica-autopeep | CASE_STUDY | Aplicación clínica: EPOC con hipotensión tras la intubación -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente**: hombre de 68 años con EPOC grave, intubado hace 30 minutos por acidosis respiratoria tras fracasar la ventilación no invasiva. Sedado, sin esfuerzos visibles.

**Programación inicial**: VCV, $V_T = 500\,\text{mL}$, $FR = 20$, flujo constante 50 L/min, PEEP 5 cmH₂O, FiO₂ 0,4.

**Monitoreo**: presión arterial media 58 mmHg (era 85 antes de la intubación), $P_{pico} = 42$, $P_{plat} = 28\,\text{cmH}_2\text{O}$. La curva de flujo espiratorio no llega a cero antes de cada inspiración. Pausa espiratoria: PEEP total 14 cmH₂O.

**Paso 1. Cuantificar.** Auto-PEEP $= 14 - 5 = 9\,\text{cmH}_2\text{O}$. La diferencia pico-meseta (14 cmH₂O) indica resistencia alta. La driving pressure real es $28 - 14 = 14\,\text{cmH}_2\text{O}$, no 23.

**Paso 2. Analizar los tiempos.** $T_I = 0{,}5\,\text{L} / (50/60\,\text{L/s}) = 0{,}6\,\text{s}$. Ciclo de 3 s, de modo que $T_E = 2{,}4\,\text{s}$, insuficiente para un pulmón con constante de tiempo prolongada.

**Paso 3. Relacionar con la hipotensión.** Hipotensión tras iniciar la ventilación, auto-PEEP de 9 cmH₂O y flujo espiratorio que no termina: la hiperinflación dinámica es la primera sospecha, sin olvidar el neumotórax (asimetría, caída brusca de compliance) y el efecto de los fármacos de inducción (Pepe & Marini, 1982; Marini, 2011).

**Paso 4. Ajustar.**

- Frecuencia 12, volumen 450 mL, flujo 70 L/min: $T_I = 0{,}45/1{,}17 \approx 0{,}39\,\text{s}$; ciclo 5 s; $T_E \approx 4{,}6\,\text{s}$, casi el doble que antes. La ventilación minuto baja de 10 a 5,4 L/min, por lo que la PaCO₂ subirá: se acepta mientras el pH se mantenga en un rango tolerable.
- Broncodilatadores inhalados por el circuito y aspiración de secreciones.
- Mantener PEEP 5 mientras está pasivo; reconsiderar la PEEP externa cuando empiece a disparar.

**Paso 5. Reevaluar.** A los 15 minutos: PEEP total 8 cmH₂O (auto-PEEP 3), meseta 21, la curva de flujo espiratorio llega casi a cero y la presión arterial media sube a 72 mmHg. Repite la pausa espiratoria tras cada cambio relevante y con la gasometría de control.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y:

1. Observa la curva de flujo-tiempo: el flujo espiratorio no vuelve a cero antes de la siguiente inspiración.
2. Sube la frecuencia respiratoria: la auto-PEEP y la presión meseta aumentan, y con el tiempo puede caer la presión arterial media.
3. Baja la frecuencia y aumenta el flujo inspiratorio: el tiempo espiratorio se alarga, el flujo espiratorio se acerca a cero y la auto-PEEP disminuye, aunque la PaCO₂ tiende a subir.

<!-- block: EXERCISE | Preguntas -->
**1.** En PCV con presión inspiratoria de 20 cmH₂O sobre una PEEP de 5, el volumen corriente cae de 450 a 330 mL al subir la frecuencia. ¿Qué sospechas?

*Respuesta*: auto-PEEP. Al no vaciarse el pulmón, la presión alveolar al inicio de la inspiración es mayor que 5 cmH₂O y el gradiente disponible para insuflar es menor. Mide la PEEP total con pausa espiratoria.

**2.** Un paciente con EPOC en presión de soporte presenta esfuerzos visibles que no disparan el ventilador. La auto-PEEP medida fue 8 cmH₂O. ¿Qué opciones tienes?

*Respuesta*: reducir el atrapamiento (broncodilatación, menos soporte si el volumen es excesivo, ciclado más precoz para alargar la espiración) y valorar una PEEP externa inferior a la auto-PEEP, comprobando después que la PEEP total no aumente.

**3.** ¿Por qué subir el flujo inspiratorio en VCV aumenta la presión pico pero puede reducir el riesgo?

*Respuesta*: el flujo mayor aumenta la caída de presión resistiva (pico), que se disipa en la vía aérea; en cambio acorta el tiempo inspiratorio, alarga el espiratorio y disminuye la hiperinflación, que es lo que eleva la presión alveolar y compromete la hemodinamia.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La auto-PEEP aparece cuando el tiempo espiratorio es insuficiente para el vaciado del pulmón, determinado por la constante de tiempo $\tau = R \cdot C$ y, en la EPOC y el asma, por la limitación del flujo espiratorio.
- El signo de sospecha es un flujo espiratorio que no vuelve a cero; la cuantificación se hace con una pausa espiratoria en el paciente pasivo: $PEEP_i = PEEP_{total} - PEEP_{programada}$ (Pepe & Marini, 1982).
- La auto-PEEP estática es un promedio y puede infravalorar el atrapamiento en un pulmón heterogéneo (Blanch et al., 2005).
- Sus consecuencias son hipotensión, barotrauma, mayor trabajo respiratorio, esfuerzos ineficaces y errores al interpretar la mecánica y la hemodinamia (Marini, 2011).
- La medida más eficaz es reducir la ventilación minuto, sobre todo la frecuencia, aceptando hipercapnia (Tuxen & Lane, 1987).
- Acortar el tiempo inspiratorio con más flujo y tratar la obstrucción completan el manejo.
- En el paciente con limitación del flujo que dispara, una PEEP externa inferior a la auto-PEEP reduce la carga de disparo; por encima de alrededor del 85 % de la auto-PEEP puede aumentar la hiperinflación (Ranieri et al., 1993).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Confiar en la PEEP que muestra el ventilador** → la PEEP programada no incluye la auto-PEEP → realiza una pausa espiratoria en todo paciente obstructivo o con frecuencia alta.
- **Medir la auto-PEEP con el paciente haciendo esfuerzos** → los esfuerzos inspiratorios o espiratorios deforman la presión de la pausa → mide con el paciente relajado o interpreta con cautela.
- **Subir la frecuencia para corregir la hipercapnia en un paciente atrapado** → acorta el tiempo espiratorio, aumenta el atrapamiento y puede no mejorar la PaCO₂ → reduce la frecuencia, acepta la hipercapnia si el pH lo permite y trata la obstrucción.
- **Tratar la hipotensión tras la intubación solo con vasopresores** → si la causa es la hiperinflación, se enmascara el problema → revisa la curva de flujo, mide la auto-PEEP y alarga el tiempo espiratorio.
- **Añadir PEEP externa igual o mayor que la auto-PEEP en un paciente pasivo** → puede sumarse al atrapamiento → reserva la PEEP externa para reducir la carga de disparo y comprueba la PEEP total y la meseta tras cada cambio.
- **Calcular la driving pressure restando solo la PEEP programada** → sobrestima la carga elástica → usa la PEEP total.

<!-- block: REFERENCES | Referencias -->
- Blanch, L., Bernabé, F., & Lucangelo, U. (2005). Measurement of air trapping, intrinsic positive end-expiratory pressure, and dynamic hyperinflation in mechanically ventilated patients. *Respiratory Care, 50*(1), 110-124. [https://doi.org/10.4187/respcare.05500110](https://doi.org/10.4187/respcare.05500110)
- Guérin, C., Milic-Emili, J., & Fournier, G. (2000). Effect of PEEP on work of breathing in mechanically ventilated COPD patients. *Intensive Care Medicine, 26*(9), 1207-1214. [https://doi.org/10.1007/s001340051339](https://doi.org/10.1007/s001340051339)
- Marini, J. J. (2011). Dynamic hyperinflation and auto-positive end-expiratory pressure: Lessons learned over 30 years. *American Journal of Respiratory and Critical Care Medicine, 184*(7), 756-762. [https://doi.org/10.1164/rccm.201102-0226PP](https://doi.org/10.1164/rccm.201102-0226PP)
- Pepe, P. E., & Marini, J. J. (1982). Occult positive end-expiratory pressure in mechanically ventilated patients with airflow obstruction: The auto-PEEP effect. *American Review of Respiratory Disease, 126*(1), 166-170. [https://doi.org/10.1164/arrd.1982.126.1.166](https://doi.org/10.1164/arrd.1982.126.1.166)
- Ranieri, V. M., Giuliani, R., Cinnella, G., Pesce, C., Brienza, N., Ippolito, E. L., Pomo, V., Fiore, T., Gottfried, S. B., & Brienza, A. (1993). Physiologic effects of positive end-expiratory pressure in patients with chronic obstructive pulmonary disease during acute ventilatory failure and controlled mechanical ventilation. *American Review of Respiratory Disease, 147*(1), 5-13. [https://doi.org/10.1164/ajrccm/147.1.5](https://doi.org/10.1164/ajrccm/147.1.5)
- Smith, T. C., & Marini, J. J. (1988). Impact of PEEP on lung mechanics and work of breathing in severe airflow obstruction. *Journal of Applied Physiology, 65*(4), 1488-1499. [https://doi.org/10.1152/jappl.1988.65.4.1488](https://doi.org/10.1152/jappl.1988.65.4.1488)
- Tuxen, D. V., & Lane, S. (1987). The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *American Review of Respiratory Disease, 136*(4), 872-879. [https://doi.org/10.1164/ajrccm/136.4.872](https://doi.org/10.1164/ajrccm/136.4.872)
