<!-- page: conceptos-simv | THEORY | SIMV: cómo funciona -->
<!-- block: INTRODUCTION | Por qué importa -->
La ventilación mandatoria intermitente sincronizada (SIMV) fue durante décadas uno de los modos más usados en las unidades de cuidados intensivos y todavía aparece en muchos ventiladores, protocolos locales y traslados. Su idea es atractiva: el ventilador garantiza un número mínimo de ciclos "de seguridad" y deja que el paciente respire por su cuenta entre ellos, de modo que se puede ir retirando el soporte poco a poco. Sin embargo, esa intuición resultó ser engañosa cuando se estudió con cuidado: el paciente no descansa durante los ciclos mandatorios tanto como parece, y los ensayos clínicos mostraron que retirar el ventilador con SIMV es más lento que con otras estrategias.

Entender SIMV te sirve para tres cosas: programarlo con seguridad cuando lo encuentres, reconocer en las curvas qué tipo de ciclo está recibiendo el paciente y justificar por qué hoy no se recomienda como método de destete.

<!-- block: THEORY | Dos tipos de ciclo en un mismo modo -->
En la taxonomía de Chatburn, SIMV pertenece al patrón de **ventilación mandatoria intermitente (IMV)**: el ventilador mezcla ciclos mandatorios con ciclos espontáneos, y entre unos y otros puede haber respiraciones espontáneas del paciente (Chatburn et al., 2014). Dentro de un mismo minuto conviven, por tanto:

- **Ciclos mandatorios.** El ventilador decide cómo terminan. Pueden ser controlados por volumen (Vt programado, flujo fijo, ciclado por tiempo o volumen) o por presión (presión inspiratoria y tiempo inspiratorio programados). Su número mínimo lo fija la frecuencia mandatoria.
- **Ciclos espontáneos.** El paciente los dispara y en la práctica también los termina, porque se ciclan por flujo. Si no se añade soporte, el paciente respira solo contra el nivel de PEEP; lo habitual es añadir **presión de soporte (PS)** para compensar parte del trabajo impuesto por el tubo y el circuito.

La diferencia esencial con la ventilación asistida-controlada (A/C) es qué ocurre cuando el paciente hace un esfuerzo por encima de la frecuencia programada. En A/C, cada esfuerzo detectado recibe un ciclo mandatorio completo. En SIMV, solo un número fijo de esfuerzos por minuto se convierte en ciclo mandatorio; el resto recibe ciclos espontáneos con el soporte que hayas programado (Cairo, 2020).

<!-- block: THEORY | La ventana de sincronía -->
La "S" de SIMV significa que los ciclos mandatorios se sincronizan con el esfuerzo del paciente para no entregar un volumen completo en plena espiración. El ventilador divide el tiempo en ciclos SIMV cuya duración es 60 segundos dividido por la frecuencia mandatoria. Al principio de cada ciclo hay un **periodo mandatorio**: el primer esfuerzo que el trigger detecta en ese periodo recibe un ciclo mandatorio sincronizado (asistido). Si el paciente no hace ningún esfuerzo, al terminar el periodo el ventilador entrega el ciclo mandatorio por tiempo. El resto del ciclo es un **periodo espontáneo**, en el que cada esfuerzo recibe un ciclo espontáneo (Chatburn et al., 2014; Hess y Kacmarek, 2019).

El nombre del periodo, su duración y su posición dentro del ciclo cambian según el fabricante; algunos equipos ponen la ventana al final del intervalo. Lo importante es la lógica: el paciente siempre recibe al menos la frecuencia mandatoria y nunca dos ciclos mandatorios "pegados".

![Esquema de dos escenarios de SIMV: con esfuerzos del paciente, el primer esfuerzo del periodo mandatorio recibe un ciclo mandatorio sincronizado y los demás reciben respiraciones espontáneas con presión de soporte; sin esfuerzos, el ventilador dispara el ciclo mandatorio por tiempo al final del periodo mandatorio](/learning/diagrams/i3-simv-ventana-sincronia.svg "Figura: lógica del ciclo SIMV")

<!-- block: THEORY | Cómo se ve en las curvas -->
En la pantalla, SIMV con PS muestra dos "familias" de ciclos con forma distinta. Si los mandatorios son de volumen con flujo constante, verás flujo inspiratorio cuadrado y presión en rampa hasta un pico; las respiraciones espontáneas con PS tienen presión cuadrada y flujo desacelerado que termina cuando cae a la fracción programada del pico. El volumen de las espontáneas varía de un ciclo a otro porque depende del esfuerzo del paciente y del nivel de PS, mientras que el de las mandatorias de volumen es fijo.

![Curvas de presión y flujo en SIMV: ciclos mandatorios por volumen con flujo cuadrado y presión en rampa con meseta, alternando con respiraciones espontáneas con presión de soporte de presión cuadrada y flujo desacelerado; una banda señala la ventana de sincronía en la que el esfuerzo del paciente dispara el segundo ciclo mandatorio](/learning/diagrams/i3-simv-curvas.svg "Figura: SIMV por volumen con presión de soporte")

<!-- page: calculo-simv | EXERCISE | Ventilación minuto y reparto del trabajo -->
<!-- block: THEORY | La ventilación minuto en SIMV tiene dos sumandos -->
En SIMV la ventilación minuto total ($\dot{V}_E$) es la suma de lo que aporta el ventilador con los ciclos mandatorios y de lo que aporta el paciente con los ciclos espontáneos:

$$
\dot{V}_E = f_{mand}\cdot V_{T,mand} + f_{esp}\cdot \overline{V}_{T,esp}
$$

Donde:

- $\dot{V}_E$: ventilación minuto total (L/min).
- $f_{mand}$: frecuencia mandatoria programada (ciclos/min).
- $V_{T,mand}$: volumen corriente de los ciclos mandatorios (L).
- $f_{esp}$: frecuencia de ciclos espontáneos, es decir, la frecuencia total medida menos la mandatoria (ciclos/min).
- $\overline{V}_{T,esp}$: volumen corriente medio de los ciclos espontáneos (L), que depende del esfuerzo y del nivel de PS.

La fracción de la ventilación que entregan los ciclos mandatorios se calcula así:

$$
F_{mand} = \frac{f_{mand}\cdot V_{T,mand}}{\dot{V}_E}
$$

Y la duración de cada ciclo SIMV, que delimita los periodos mandatorio y espontáneo, es:

$$
T_{SIMV} = \frac{60}{f_{mand}}\;\text{s}
$$

<!-- block: CALLOUT:info | Por qué la fracción mandatoria engaña -->
Sería tentador pensar que, si el ventilador aporta el 60 % de la ventilación minuto, el paciente hace solo el 40 % del trabajo. No es así. Marini et al. (1988) midieron el esfuerzo en pacientes en SIMV por volumen y comprobaron que, en los ciclos asistidos, la presión media que generaban los músculos era alrededor de un 20 % menor que en los espontáneos, pero la contracción duraba alrededor de un 20 % más, de modo que el producto presión-tiempo era casi igual en ambos tipos de ciclo. El centro respiratorio no ajusta su salida ciclo a ciclo: programa un esfuerzo "promedio" y lo aplica tanto a los ciclos que recibirán ayuda como a los que no. Por eso, a niveles intermedios de soporte, los músculos trabajan durante los ciclos mandatorios casi tanto como durante los espontáneos.

<!-- block: EXERCISE | Ejemplo resuelto -->
Un paciente está en SIMV por volumen con frecuencia mandatoria de 10/min, Vt mandatorio de 450 mL, PS de 10 cmH₂O y PEEP de 5 cmH₂O. El monitor muestra una frecuencia total de 24/min y un volumen espontáneo medio de 250 mL.

**1. Frecuencia espontánea.**

$$
f_{esp} = 24 - 10 = 14\;\text{ciclos/min}
$$

**2. Ventilación aportada por cada tipo de ciclo.**

$$
\dot{V}_{mand} = 10 \cdot 0{,}45 = 4{,}5\;\text{L/min} \qquad \dot{V}_{esp} = 14 \cdot 0{,}25 = 3{,}5\;\text{L/min}
$$

**3. Ventilación minuto total y fracción mandatoria.**

$$
\dot{V}_E = 4{,}5 + 3{,}5 = 8{,}0\;\text{L/min} \qquad F_{mand} = \frac{4{,}5}{8{,}0} \approx 0{,}56
$$

**4. Duración del ciclo SIMV.**

$$
T_{SIMV} = \frac{60}{10} = 6\;\text{s}
$$

**Interpretación.** El ventilador entrega algo más de la mitad de la ventilación, pero el paciente dispara 14 ciclos espontáneos de volumen bajo cada minuto y, por lo visto en la sección anterior, también se esfuerza durante los 10 ciclos mandatorios. Una frecuencia espontánea alta con volúmenes pequeños es un patrón de respiración rápida y superficial: antes de bajar más la frecuencia mandatoria, debes preguntarte si el soporte de las espontáneas es suficiente y si la carga del paciente es aceptable.

<!-- page: aplicacion-clinica-simv | CASE_STUDY | SIMV en la práctica clínica -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Mujer de 62 años, 1,60 m de talla, en el cuarto día de ventilación por neumonía comunitaria. La fiebre cedió, la radiografía mejora y está despierta con sedación ligera. El equipo de la noche la dejó en SIMV por volumen "para ir destetándola": frecuencia mandatoria 6/min, Vt 380 mL, PS 5 cmH₂O, PEEP 6 cmH₂O, FiO₂ 0,35.

**Lo que observas.** Frecuencia total 32/min, volumen espontáneo medio 220 mL, uso visible de músculos accesorios y sudoración. SpO₂ 93 %. En la curva de presión, los ciclos espontáneos muestran una deflexión negativa marcada al inicio y una presión que apenas se separa de la PEEP.

**Razonamiento paso a paso.**

1. **¿Cuánto aporta cada tipo de ciclo?** Mandatorio: $6 \cdot 0{,}38 = 2{,}3$ L/min. Espontáneo: $26 \cdot 0{,}22 = 5{,}7$ L/min. La paciente genera la mayor parte de la ventilación con ciclos de volumen bajo.
2. **¿El esfuerzo está protegido en los ciclos mandatorios?** No necesariamente. Como el esfuerzo se mantiene en los ciclos asistidos (Marini et al., 1988), con una frecuencia mandatoria baja la carga real se parece mucho a la de respirar casi sin ayuda.
3. **¿Qué significa el patrón?** Taquipnea con volúmenes bajos y signos de esfuerzo intenso indica que la carga supera la capacidad con el soporte actual. No es una "prueba de destete" que la paciente esté superando: es fatiga en curso.
4. **¿Qué haces?** Primero, aumentas el soporte para descargar a la paciente (por ejemplo, pasar a A/C o a PSV con un nivel suficiente para que la frecuencia baje y el volumen suba) y buscas causas tratables de la carga (secreciones, broncoespasmo, fiebre, ansiedad). Segundo, cuando cumpla criterios de preparación, la evalúas con una prueba de ventilación espontánea estandarizada en lugar de seguir bajando la frecuencia SIMV.

<!-- block: THEORY | Lo que dice la evidencia sobre el destete con SIMV -->
Dos ensayos aleatorizados de los años noventa compararon métodos de retirada gradual en pacientes que habían fracasado una primera prueba de ventilación espontánea:

- Brochard et al. (1994) asignaron 109 pacientes a pruebas con tubo en T, SIMV o PSV. El fracaso del destete fue del 42 % con SIMV, del 43 % con tubo en T y del 23 % con PSV; al excluir los fracasos por complicaciones ajenas al destete, la diferencia a favor de PSV fue mayor (8 % frente a 33 % y 39 %).
- Esteban et al. (1995) asignaron 130 pacientes a cuatro métodos. La mediana de duración del destete fue de 5 días con IMV, 4 con PSV y 3 con pruebas de ventilación espontánea; una prueba diaria permitió extubar alrededor de tres veces más rápido que la IMV y dos veces más rápido que la PSV.

Con ambos estudios la conclusión es la misma: reducir de forma progresiva la frecuencia mandatoria es el método de retirada más lento. La guía ATS/ACCP de 2017 sobre liberación de la ventilación mecánica sugiere hacer la primera prueba de ventilación espontánea con una presión inspiratoria añadida de 5-8 cmH₂O en lugar de tubo en T o CPAP (recomendación condicional, evidencia de certeza moderada) y no incluye la SIMV progresiva entre sus estrategias (Schmidt et al., 2017).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y programa SIMV con una frecuencia mandatoria baja y presión de soporte. Prueba lo siguiente:

- Observa las curvas: identifica qué ciclos son mandatorios (forma de onda del modo de control que elegiste) y cuáles son espontáneos (presión cuadrada y flujo desacelerado de la PS).
- Baja la presión de soporte hasta cero y fíjate en cómo los volúmenes espontáneos se hacen más pequeños y variables.
- Aumenta la frecuencia mandatoria y comprueba que la proporción de ciclos mandatorios en la ventilación minuto crece; compara la ventilación minuto total antes y después.

<!-- block: EXERCISE | Preguntas -->
**1.** En SIMV con frecuencia mandatoria de 12/min, ¿cuánto dura cada ciclo SIMV y qué ocurre si el paciente no hace ningún esfuerzo?

*Respuesta:* $60/12 = 5$ s. Si no hay esfuerzo en el periodo mandatorio, el ventilador entrega el ciclo mandatorio por tiempo; el paciente recibe al menos 12 ciclos por minuto.

**2.** Un compañero afirma que con SIMV "el paciente descansa en los ciclos mandatorios y trabaja en los espontáneos". ¿Es correcto?

*Respuesta:* No del todo. A niveles intermedios de soporte, el esfuerzo inspiratorio es similar en ciclos asistidos y espontáneos, porque el centro respiratorio no se adapta ciclo a ciclo (Marini et al., 1988).

**3.** ¿Por qué se añade presión de soporte a los ciclos espontáneos de SIMV?

*Respuesta:* Para compensar parte del trabajo impuesto por el tubo endotraqueal y el circuito y evitar que los ciclos espontáneos sean de volumen muy bajo; sin PS, el paciente respira solo contra la PEEP.

<!-- page: sintesis-simv | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- SIMV combina ciclos mandatorios (de volumen o de presión) con ciclos espontáneos, que suelen llevar presión de soporte (Chatburn et al., 2014).
- Solo un número fijo de esfuerzos por minuto recibe ciclo mandatorio; el resto recibe ciclos espontáneos. Esa es la diferencia con A/C.
- La ventana de sincronía evita entregar un ciclo mandatorio en plena espiración; su forma exacta depende del fabricante.
- La ventilación minuto total es la suma de la aportada por los ciclos mandatorios y la aportada por los espontáneos; vigila ambas.
- El esfuerzo del paciente apenas disminuye en los ciclos asistidos a niveles intermedios de soporte (Marini et al., 1988), así que la fracción mandatoria no mide la descarga muscular.
- La retirada progresiva de la frecuencia SIMV fue el método de destete más lento en los ensayos comparativos (Brochard et al., 1994; Esteban et al., 1995).
- Para liberar al paciente, la guía actual favorece las pruebas de ventilación espontánea con presión inspiratoria añadida (Schmidt et al., 2017).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Dejar SIMV con frecuencia mandatoria baja y PS mínima "para que el paciente se entrene"** → el paciente puede entrar en fatiga con taquipnea y volúmenes bajos → si quieres evaluar si puede respirar solo, haz una prueba de ventilación espontánea estandarizada y vuelve a un soporte completo si fracasa.
- **Mirar solo la frecuencia mandatoria programada** → la ventilación real depende también de los ciclos espontáneos → revisa la frecuencia total, el volumen espontáneo y la ventilación minuto total.
- **Confundir SIMV con A/C al leer las curvas** → en A/C todos los ciclos tienen la misma forma; en SIMV verás dos formas distintas → identifica cada familia de ciclos antes de interpretar presiones o volúmenes.
- **Suponer que el paciente descansa durante los ciclos mandatorios** → el esfuerzo se mantiene en los ciclos asistidos → valora la carga con signos clínicos y con el patrón de respiración, no con la fracción mandatoria.
- **Fijar una alarma de volumen minuto bajo pensando solo en los ciclos mandatorios** → si el paciente deja de respirar entre ellos, la ventilación cae bruscamente → ajusta la alarma de volumen minuto y de apnea a la ventilación mínima aceptable para ese paciente.

<!-- block: REFERENCES | Referencias -->
- Brochard, L., Rauss, A., Benito, S., Conti, G., Mancebo, J., Rekik, N., Gasparetto, A., & Lemaire, F. (1994). Comparison of three methods of gradual withdrawal from ventilatory support during weaning from mechanical ventilation. *American Journal of Respiratory and Critical Care Medicine, 150*(4), 896-903. [https://doi.org/10.1164/ajrccm.150.4.7921460](https://doi.org/10.1164/ajrccm.150.4.7921460)
- Cairo, J. M. (2020). *Pilbeam's mechanical ventilation: Physiological and clinical applications* (7th ed.). Elsevier.
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Esteban, A., Frutos, F., Tobin, M. J., Alía, I., Solsona, J. F., Valverdú, I., Fernández, R., de la Cal, M. A., Benito, S., Tomás, R., et al. (1995). A comparison of four methods of weaning patients from mechanical ventilation. *New England Journal of Medicine, 332*(6), 345-350. [https://doi.org/10.1056/NEJM199502093320601](https://doi.org/10.1056/NEJM199502093320601)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Marini, J. J., Smith, T. C., & Lamb, V. J. (1988). External work output and force generation during synchronized intermittent mechanical ventilation: Effect of machine assistance on breathing effort. *American Review of Respiratory Disease, 138*(5), 1169-1179. [https://doi.org/10.1164/ajrccm/138.5.1169](https://doi.org/10.1164/ajrccm/138.5.1169)
- Schmidt, G. A., Girard, T. D., Kress, J. P., Morris, P. E., Ouellette, D. R., Alhazzani, W., Burns, S. M., Epstein, S. K., Esteban, A., Fan, E., Ferrer, M., Fraser, G. L., Gong, M. N., Hough, C. L., Mehta, S., Nanchal, R., Patel, S., Pawlik, A. J., Schweickert, W. D., … Truwit, J. D. (2017). Official executive summary of an American Thoracic Society/American College of Chest Physicians clinical practice guideline: Liberation from mechanical ventilation in critically ill adults. *American Journal of Respiratory and Critical Care Medicine, 195*(1), 115-119. [https://doi.org/10.1164/rccm.201610-2076ST](https://doi.org/10.1164/rccm.201610-2076ST)
