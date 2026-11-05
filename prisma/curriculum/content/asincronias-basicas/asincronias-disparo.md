<!-- page: conceptos-asincronias-disparo | THEORY | Qué es una asincronía de disparo -->
<!-- block: INTRODUCTION | Por qué importa en la cabecera del paciente -->
Cuando el paciente respira con el ventilador en un modo asistido, dos "controladores" comparten el mismo ciclo: el centro respiratorio del paciente, que decide cuándo y cuánto inspirar, y el ventilador, que decide cuándo abrir la válvula inspiratoria, cuánto flujo dar y cuándo terminar. Hay **asincronía paciente-ventilador** cuando las fases del ciclo que entrega la máquina no coinciden con las del paciente. Las de **disparo** afectan al inicio del ciclo: el ventilador no responde al esfuerzo, responde tarde o dispara sin que haya esfuerzo.

No es un problema estético de la pantalla. En una cohorte de 62 pacientes con ventilación asistida, una cuarta parte (24 %) tenía un índice de asincronía mayor del 10 %, y ese grupo tuvo una ventilación mecánica más prolongada (Thille et al., 2006). En otro estudio, un índice de esfuerzos ineficaces ≥ 10 % en las primeras 24 horas predijo más días de ventilación y estancia (de Wit et al., 2009), y un índice de asincronía mayor del 10 % se asoció con mayor mortalidad en la UCI y en el hospital (Blanch et al., 2015). Estos estudios son observacionales: muestran asociación, no prueban que la asincronía cause el peor pronóstico, y sus propios autores lo advierten (Blanch et al., 2015).

Lo que sí sabes con certeza es que la asincronía aumenta el trabajo respiratorio, produce disconfort y suele llevar a más sedación (Holanda et al., 2018). Reconocerla en las curvas es una habilidad básica de quien cuida al paciente ventilado.

<!-- block: THEORY | Cómo dispara el ventilador -->
El ventilador "se entera" del esfuerzo del paciente midiendo una señal en el circuito:

- **Disparo por presión**: la contracción de los músculos inspiratorios baja la presión en el circuito; cuando cae por debajo de la PEEP en el valor programado (la sensibilidad), se inicia el ciclo.
- **Disparo por flujo**: el ventilador mantiene un pequeño flujo de base y detecta la diferencia entre el flujo que sale por la rama inspiratoria y el que vuelve por la espiratoria; cuando el paciente "roba" el valor programado, se dispara el ciclo.

En los dos casos, el esfuerzo tiene que llegar primero al sensor. Todo lo que se interponga entre el músculo y el sensor (presión alveolar residual, un tubo estrecho, una válvula lenta) retrasa o impide el disparo; todo lo que produzca una señal falsa en el circuito (una fuga, agua, el latido cardíaco) puede disparar ciclos sin esfuerzo. El disparo por flujo suele ser más sensible que el disparo por presión (Holanda et al., 2018).

<!-- block: THEORY | Los tres tipos de asincronía de disparo -->
#### Esfuerzo ineficaz

El paciente contrae los músculos inspiratorios, pero el ventilador no entrega un ciclo. Es la asincronía más frecuente en los estudios de cohorte (Thille et al., 2006; Blanch et al., 2015). En la curva ves, **durante la espiración**, una pequeña caída de presión en la vía aérea y una deflexión de la curva de flujo espiratorio hacia cero (a veces una pequeña joroba), sin que aparezca un ciclo nuevo. En la clínica, el tórax o el abdomen del paciente se mueven con más frecuencia que la que registra el ventilador.

#### Disparo retardado

El ventilador sí responde, pero tarde: entre el inicio del esfuerzo y el inicio del flujo hay un intervalo largo en que el paciente trabaja contra un sistema cerrado. Se ve como una caída de presión más prolongada y profunda antes del ascenso del ciclo. Comparte causas con el esfuerzo ineficaz y suele ser su antesala.

#### Autodisparo

El ventilador entrega ciclos que el paciente no pidió. El ciclo empieza **sin caída previa de presión** y la frecuencia del ventilador supera la frecuencia de esfuerzos reales del paciente. Lo producen las fugas del sistema (que despresurizan el circuito), la condensación de agua que oscila en las tubuladuras, las oscilaciones cardiogénicas y una sensibilidad demasiado alta (Holanda et al., 2018). Tras cirugía cardíaca, con disparo por flujo, el autodisparo por oscilaciones cardiogénicas fue frecuente y produjo alcalosis respiratoria e hiperinflación (Imanaka et al., 2000).

![Curvas de presión y flujo frente al tiempo en presión de soporte que muestran un disparo normal, un esfuerzo ineficaz durante la espiración con flujo espiratorio que no llega a cero, un disparo retardado con una caída de presión prolongada y un autodisparo sin caída previa de presión](/learning/diagrams/i5-disparo-curvas.svg "Figura: las tres asincronías de disparo en las curvas escalares")

<!-- block: THEORY | La causa más importante: auto-PEEP y sobreasistencia -->
El mecanismo central del esfuerzo ineficaz es la **hiperinflación dinámica**. Si el pulmón no termina de vaciarse antes del siguiente esfuerzo, la presión alveolar al final de la espiración queda por encima de la PEEP programada (auto-PEEP). El paciente debe primero bajar su presión alveolar hasta igualar la PEEP del circuito y solo después puede generar la caída adicional que reconoce el trigger. La auto-PEEP funciona como una carga umbral que no ve el ventilador (Holanda et al., 2018).

Leung et al. (1997) mostraron que los esfuerzos que no lograban disparar estaban precedidos por ciclos con tiempo espiratorio más corto y auto-PEEP más alta. También mostraron algo poco intuitivo: al **aumentar la asistencia**, los esfuerzos ineficaces se hicieron más frecuentes, porque un volumen mayor tarda más en exhalarse y la mayor descarga reduce el impulso respiratorio. En la misma línea, los pacientes con muchos esfuerzos ineficaces recibían más presión de soporte, más volumen corriente y tenían un pH más alto (Thille et al., 2006). Por eso el esfuerzo ineficaz es, con frecuencia, una señal de **sobreasistencia**, no de falta de soporte.
<!-- page: formulas-indice-umbral | EXERCISE | Fórmulas: índice de asincronía y umbral de disparo -->
<!-- block: THEORY | Cuantificar: el índice de asincronía -->
Para pasar de "veo algunas asincronías" a un dato comparable se usa el **índice de asincronía (IA)**: el número de eventos asincrónicos dividido entre la frecuencia respiratoria total, entendida como la suma de los ciclos del ventilador y los esfuerzos ineficaces, expresado en porcentaje (Holanda et al., 2018). Un IA mayor del 10 % se considera alto en los estudios clínicos (Thille et al., 2006; Blanch et al., 2015).

$$
IA = \frac{N_{\text{asincronías}}}{N_{\text{ciclos del ventilador}} + N_{\text{esfuerzos ineficaces}}}\times 100
$$

- $N_{\text{asincronías}}$: eventos contados en el periodo (esfuerzos ineficaces, autodisparos, dobles disparos, ciclados prematuros o tardíos), sin unidades.
- $N_{\text{ciclos del ventilador}}$: ciclos entregados en el mismo periodo.
- $N_{\text{esfuerzos ineficaces}}$: se suman al denominador porque son respiraciones del paciente que el ventilador no registró.

Un índice similar, restringido a los esfuerzos ineficaces, es el **índice de disparo ineficaz**: esfuerzos ineficaces divididos entre la suma de ciclos disparados más esfuerzos ineficaces (de Wit et al., 2009).

<!-- block: CALLOUT:info | Contar a ojo tiene límites -->
Detectar asincronías mirando la pantalla es menos fiable de lo que parece. Cuando médicos de UCI analizaron curvas de flujo y presión ciclo a ciclo, la sensibilidad para identificar asincronías fue del 22 % frente a una referencia con actividad eléctrica del diafragma; la experiencia mejoró la detección (Colombo et al., 2011). Observa siempre al paciente además de la pantalla y cuenta durante al menos un minuto completo.

<!-- block: THEORY | El umbral de disparo con auto-PEEP -->
Con disparo por presión, la caída de presión que el músculo debe generar antes de que comience el ciclo es, de forma simplificada:

$$
\Delta P_{mus,\,\text{disparo}} \approx \left(PEEP_{i}\right) + \left|S_{trigger}\right|
$$

donde $PEEP_{i} = PEEP_{total} - PEEP_{e}$ es la auto-PEEP (cmH₂O), $PEEP_{total}$ la presión medida con pausa espiratoria (cmH₂O), $PEEP_{e}$ la PEEP programada (cmH₂O) y $S_{trigger}$ la sensibilidad por presión programada (cmH₂O). La ecuación muestra las dos palancas: reducir la auto-PEEP (vaciado más completo) y, cuando la obstrucción limita el flujo espiratorio, elevar con cautela la PEEP externa para acercarla a la presión alveolar del final de la espiración, sin superarla (Holanda et al., 2018).

La medición de la $PEEP_{total}$ con pausa espiratoria solo es válida si el paciente está relajado durante la maniobra: un esfuerzo activo durante la pausa altera la lectura.

<!-- block: EQUATION | Auto-PEEP -->
PEEP_{i} = PEEP_{total} - PEEP_{e}

<!-- block: EXERCISE | Ejemplo resuelto -->
Observas durante 2 minutos a un paciente en presión de soporte. El ventilador registra 36 ciclos. Contando los movimientos del abdomen y las deflexiones de la curva de flujo, identificas 18 esfuerzos ineficaces. No ves otros eventos.

**1. Índice de asincronía**

$$
IA = \frac{18}{36 + 18}\times 100 = \frac{18}{54}\times 100 = 33{,}3\,\%
$$

La frecuencia real del paciente es $54/2 = 27$ respiraciones/min, aunque el monitor muestre 18/min. El IA supera ampliamente el 10 %.

**2. Umbral de disparo**

Con una pausa espiratoria en un momento de relajación mides $PEEP_{total} = 11\,\text{cmH}_2\text{O}$; la PEEP programada es $5\,\text{cmH}_2\text{O}$ y el trigger por presión es $-2\,\text{cmH}_2\text{O}$.

$$
PEEP_{i} = 11 - 5 = 6\,\text{cmH}_2\text{O}
$$

$$
\Delta P_{mus,\,\text{disparo}} \approx 6 + 2 = 8\,\text{cmH}_2\text{O}
$$

El paciente debe generar unos 8 cmH₂O de caída de presión antes de recibir ayuda. Si se elevara la PEEP externa a $8\,\text{cmH}_2\text{O}$ (por debajo de la $PEEP_{total}$ medida) y la auto-PEEP no aumentara, el umbral bajaría a $(11-8) + 2 = 5\,\text{cmH}_2\text{O}$. Comprueba siempre tras el cambio que la $PEEP_{total}$ no sube: si sube, la PEEP externa está añadiendo hiperinflación.

**3. Lectura clínica**

La mayor parte de la carga del disparo procede de la auto-PEEP, no de la sensibilidad. Cambiar solo el trigger tendría poco efecto; hay que actuar sobre el vaciado espiratorio y sobre el nivel de asistencia.
<!-- page: aplicacion-clinica-disparo | CASE_STUDY | Aplicación clínica: esfuerzos ineficaces en EPOC -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 68 años con EPOC, intubado hace 4 días por una exacerbación con acidosis respiratoria. Talla 175 cm (peso corporal predicho ≈ 70,6 kg). Ahora está en presión de soporte: PS 18 cmH₂O, PEEP 5 cmH₂O, FiO₂ 0,35, trigger por presión −2 cmH₂O.

**Monitor.** Volumen corriente espirado 640 mL (≈ 9 mL/kg de peso predicho), frecuencia registrada 16/min, SpO₂ 93 %. Gasometría: pH 7,46, PaCO₂ 43 mmHg.

**Observación.** El abdomen se contrae unas 26 veces por minuto. La curva de flujo espiratorio no vuelve a cero antes del ciclo siguiente y muestra deflexiones hacia la línea de base sin ciclo. El paciente está inquieto y la enfermera ha pedido aumentar la sedación.

**Razonamiento paso a paso**

1. **Identifica la asincronía.** Frecuencia del paciente (26/min) mayor que la del ventilador (16/min), deflexiones del flujo espiratorio sin ciclo: son **esfuerzos ineficaces**. Unos 10 por minuto: $IA = 10/(16+10)\times100 \approx 38\,\%$.
2. **Busca la causa.** El flujo espiratorio que no llega a cero indica hiperinflación dinámica. El volumen corriente es alto para el peso predicho y el pH alcalémico sugiere que el paciente está sobreasistido. Este perfil (más soporte, más volumen y pH más alto) es el que se asoció con esfuerzos ineficaces (Thille et al., 2006).
3. **Actúa sobre la asistencia primero.** Reduce la PS de forma escalonada y observa. En pacientes con más del 10 % de esfuerzos ineficaces, bajar la PS de 20 a 13 cmH₂O redujo el volumen corriente hasta cerca de 6 mL/kg de peso predicho y eliminó los esfuerzos ineficaces en dos tercios de los pacientes, sin aumentar la frecuencia propia del paciente ni la PaCO₂ (Thille et al., 2008). Fíjate en que, al bajar la PS, la frecuencia que registra el ventilador **sube**: no es que el paciente respire más rápido, es que ahora sus esfuerzos sí se cuentan.
4. **Mejora el vaciado.** Trata la obstrucción (broncodilatador, aspiración de secreciones si hay signos). Un menor volumen corriente también acorta el tiempo necesario para exhalar.
5. **Ajusta el disparo.** Valora el cambio a disparo por flujo, más sensible, comprobando que no aparezca autodisparo (Holanda et al., 2018).
6. **PEEP externa, con cautela.** Si persisten los esfuerzos ineficaces y puedes medir la PEEP total con el paciente relajado, sube la PEEP externa por pasos sin superar la PEEP total, vigilando que esta no aumente (Holanda et al., 2018).
7. **Evita la respuesta refleja.** Aumentar la sedación sin corregir la asistencia solo deprime el impulso respiratorio y puede empeorar el problema.

**Evolución.** Con PS 12 cmH₂O, el volumen corriente cae a 470 mL, la frecuencia registrada sube a 24/min y coincide con la del abdomen. Las deflexiones del flujo espiratorio desaparecen y el paciente se tranquiliza.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y:

1. Observa la curva de flujo-tiempo: el flujo espiratorio no llega a cero antes del siguiente ciclo, la huella de la auto-PEEP.
2. Sube la frecuencia respiratoria y comprueba cómo el tiempo espiratorio se acorta y el flujo al final de la espiración queda más lejos de cero.
3. Baja la frecuencia o el volumen corriente y observa cómo el flujo espiratorio se acerca a la línea de base; relaciona ese cambio con el umbral de disparo que calculaste en la página anterior.

<!-- block: EXERCISE | Preguntas -->
**1.** Un paciente operado de cirugía cardíaca hace 2 horas, profundamente sedado, está en un modo asistido con disparo por flujo muy sensible. El ventilador marca 28/min, pero no ves movimiento respiratorio espontáneo y cada ciclo empieza sin caída previa de presión. Tiene alcalosis respiratoria. ¿Qué ocurre?

*Respuesta:* es un **autodisparo**, probablemente por oscilaciones cardiogénicas transmitidas al circuito, descritas precisamente tras cirugía cardíaca con disparo por flujo (Imanaka et al., 2000). Descarta fugas y agua en el circuito, y reduce la sensibilidad hasta que la frecuencia del ventilador coincida con la del paciente.

**2.** En un paciente con esfuerzos ineficaces, alguien propone "aumentar la presión de soporte para que le llegue más ayuda". ¿Es razonable?

*Respuesta:* en general no. Más asistencia aumenta el volumen, alarga el tiempo de vaciado y reduce el impulso; los esfuerzos ineficaces se hicieron más frecuentes al aumentar la asistencia (Leung et al., 1997). Lo indicado es valorar la reducción del soporte.

**3.** En 1 minuto cuentas 20 ciclos del ventilador, 4 autodisparos (incluidos en esos 20) y ningún esfuerzo ineficaz. ¿Cuál es el IA?

*Respuesta:* $IA = 4/(20+0)\times100 = 20\,\%$. Supera el 10 %; busca la causa del autodisparo.
<!-- page: sintesis-disparo | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Las asincronías de disparo son tres: esfuerzo ineficaz (el ventilador no responde), disparo retardado (responde tarde) y autodisparo (dispara sin esfuerzo).
- El esfuerzo ineficaz se reconoce por una caída de presión y una deflexión del flujo espiratorio hacia cero sin ciclo, y porque la frecuencia del paciente supera la del ventilador.
- El autodisparo se reconoce por ciclos sin caída previa de presión y una frecuencia del ventilador mayor que la del paciente; sus causas son fugas, agua en el circuito, oscilaciones cardiogénicas y sensibilidad excesiva.
- La auto-PEEP es una carga umbral que el paciente debe vencer antes de disparar; el flujo espiratorio que no llega a cero es su signo en la curva.
- El esfuerzo ineficaz suele indicar sobreasistencia: reducir el soporte excesivo fue eficaz para eliminarlo (Thille et al., 2008).
- El índice de asincronía mayor del 10 % se asocia con ventilación más prolongada y mayor mortalidad en estudios observacionales (Thille et al., 2006; Blanch et al., 2015), sin que se haya demostrado causalidad.
- Mira al paciente además de la pantalla: la detección visual de asincronías tiene baja sensibilidad (Colombo et al., 2011).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Fiarse de la frecuencia del monitor** → el ventilador no cuenta los esfuerzos ineficaces → cuenta las respiraciones del paciente mirando tórax y abdomen durante un minuto.
- **Subir el soporte ante esfuerzos ineficaces** → aumenta el volumen, la auto-PEEP y la depresión del impulso → valora reducir el soporte hasta un volumen corriente razonable y reevalúa.
- **Aumentar la sedación como primera medida** → oculta la asincronía sin corregir su causa y prolonga la ventilación → corrige primero los ajustes y las causas del paciente (dolor, fiebre, obstrucción).
- **Corregir el autodisparo solo bajando la sensibilidad** → si la causa es una fuga, el problema persiste y puede aparecer esfuerzo ineficaz → busca y repara primero fugas y condensación.
- **Subir la PEEP externa sin medir** → si supera la presión alveolar de fin de espiración añade hiperinflación → mide la PEEP total con el paciente relajado y comprueba que no aumenta tras el cambio.
- **Interpretar la mayor frecuencia del ventilador tras bajar el soporte como empeoramiento** → solo indica que ahora se disparan esfuerzos que antes se perdían → compárala con la frecuencia real del paciente.

<!-- block: DIVIDER -->
<!-- block: THEORY | Algoritmo de abordaje -->
![Diagrama de flujo que compara la frecuencia del paciente con la del ventilador: si la del paciente es mayor se buscan auto-PEEP, sobreasistencia y trigger poco sensible; si la del ventilador es mayor se buscan fugas, agua, oscilaciones cardiogénicas y trigger demasiado sensible, con las correcciones de cada rama](/learning/diagrams/i5-disparo-algoritmo.svg "Figura: abordaje escalonado de las asincronías de disparo")

Usa el algoritmo como guía mental, no como protocolo rígido: cada ajuste debe ir seguido de una nueva observación de las curvas, del volumen corriente, de la frecuencia real, de la gasometría y del confort del paciente. Las asincronías complejas (disparo reverso, esfuerzos ineficaces en el destete difícil) se tratan en el módulo avanzado «Asincronías complejas».

<!-- block: REFERENCES | Referencias -->
- Blanch, L., Villagra, A., Sales, B., Montanya, J., Lucangelo, U., Luján, M., García-Esquirol, O., Chacón, E., Estruga, A., Oliva, J. C., Hernández-Abadia, A., Albaiceta, G. M., Fernández-Mondejar, E., Fernández, R., Lopez-Aguilar, J., Villar, J., Murias, G., & Kacmarek, R. M. (2015). Asynchronies during mechanical ventilation are associated with mortality. *Intensive Care Medicine, 41*(4), 633-641. [https://doi.org/10.1007/s00134-015-3692-6](https://doi.org/10.1007/s00134-015-3692-6)
- Colombo, D., Cammarota, G., Alemani, M., Carenzo, L., Barra, F. L., Vaschetto, R., Slutsky, A. S., Della Corte, F., & Navalesi, P. (2011). Efficacy of ventilator waveforms observation in detecting patient-ventilator asynchrony. *Critical Care Medicine, 39*(11), 2452-2457. [https://doi.org/10.1097/CCM.0b013e318225753c](https://doi.org/10.1097/CCM.0b013e318225753c)
- de Wit, M., Miller, K. B., Green, D. A., Ostman, H. E., Gennings, C., & Epstein, S. K. (2009). Ineffective triggering predicts increased duration of mechanical ventilation. *Critical Care Medicine, 37*(10), 2740-2745. [https://doi.org/10.1097/ccm.0b013e3181a98a05](https://doi.org/10.1097/ccm.0b013e3181a98a05)
- Holanda, M. A., Vasconcelos, R. D. S., Ferreira, J. C., & Pinheiro, B. V. (2018). Patient-ventilator asynchrony. *Jornal Brasileiro de Pneumologia, 44*(4), 321-333. [https://doi.org/10.1590/S1806-37562017000000185](https://doi.org/10.1590/S1806-37562017000000185)
- Imanaka, H., Nishimura, M., Takeuchi, M., Kimball, W. R., Yahagi, N., & Kumon, K. (2000). Autotriggering caused by cardiogenic oscillation during flow-triggered mechanical ventilation. *Critical Care Medicine, 28*(2), 402-407. [https://doi.org/10.1097/00003246-200002000-00019](https://doi.org/10.1097/00003246-200002000-00019)
- Leung, P., Jubran, A., & Tobin, M. J. (1997). Comparison of assisted ventilator modes on triggering, patient effort, and dyspnea. *American Journal of Respiratory and Critical Care Medicine, 155*(6), 1940-1948. [https://doi.org/10.1164/ajrccm.155.6.9196100](https://doi.org/10.1164/ajrccm.155.6.9196100)
- Thille, A. W., Cabello, B., Galia, F., Lyazidi, A., & Brochard, L. (2008). Reduction of patient-ventilator asynchrony by reducing tidal volume during pressure-support ventilation. *Intensive Care Medicine, 34*(8), 1477-1486. [https://doi.org/10.1007/s00134-008-1121-9](https://doi.org/10.1007/s00134-008-1121-9)
- Thille, A. W., Rodriguez, P., Cabello, B., Lellouche, F., & Brochard, L. (2006). Patient-ventilator asynchrony during assisted mechanical ventilation. *Intensive Care Medicine, 32*(10), 1515-1522. [https://doi.org/10.1007/s00134-006-0301-8](https://doi.org/10.1007/s00134-006-0301-8)
