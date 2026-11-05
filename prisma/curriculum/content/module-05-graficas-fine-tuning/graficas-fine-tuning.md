<!-- page: conceptos-curvas-escalares | THEORY | Las curvas escalares por modo -->
<!-- block: INTRODUCTION | Por qué importa -->
Las cifras del monitor (presión pico, volumen espirado, frecuencia) son promedios o valores puntuales; las curvas, en cambio, muestran **cómo** ocurre cada ciclo. Con ellas puedes ver si el pulmón termina de vaciarse antes del siguiente ciclo, si hay una fuga, si el flujo que entrega el ventilador satisface al paciente o si hay secreciones en la vía aérea. Muchas de estas situaciones no disparan ninguna alarma y, sin embargo, cambian la conducta: ajustar el tiempo inspiratorio, subir el flujo, aspirar o revisar el circuito.

En el módulo de monitoreo básico aprendiste a reconocer las tres curvas escalares. Aquí das el paso siguiente: reconocer patrones anormales y usarlos para el ajuste fino del ventilador.

<!-- block: THEORY | Qué curva "manda" en cada modo -->
El ventilador solo puede controlar una variable a la vez dentro de un ciclo; las otras dependen de la mecánica del paciente (Lucangelo et al., 2005). Esta idea te dice dónde buscar los problemas:

| Modo | Curva con forma fija | Curvas que dependen del paciente |
|---|---|---|
| VCV con flujo constante | Flujo (cuadrado) y volumen (rampa lineal) | Presión |
| PCV y PSV | Presión (cuadrada) | Flujo y volumen |

- En **VCV**, la curva de presión es el "espejo" de la mecánica: su altura refleja compliance y resistencia, y su forma refleja si el paciente participa.
- En **PCV o PSV**, la curva de flujo es el espejo: su pico, su velocidad de caída y el punto donde llega a cero dependen de la resistencia, la compliance y el esfuerzo del paciente.

![Comparación de curvas en VCV y PCV: en VCV, presión en rampa con pico y meseta, flujo cuadrado y volumen lineal; en PCV, presión cuadrada, flujo desacelerado y volumen que se aplana](/learning/diagrams/i4-graficas-vcv-pcv.svg "Figura: formas de onda típicas en VCV y PCV")

<!-- block: THEORY | Una lectura sistemática -->
Para no perderte en la pantalla, revisa las curvas siempre en el mismo orden:

1. **Escala y velocidad de barrido.** Una escala mal elegida puede ocultar un flujo espiratorio que no llega a cero o exagerar una oscilación.
2. **Flujo-tiempo.** ¿El flujo espiratorio vuelve a cero antes del siguiente ciclo? ¿Hay oscilaciones? En modos de presión, ¿el flujo inspiratorio llega a cero antes de que termine el tiempo inspiratorio?
3. **Presión-tiempo.** ¿Hay una deflexión negativa antes del disparo (esfuerzo del paciente)? En VCV, ¿la rampa es recta, cóncava o convexa? ¿Qué diferencia hay entre pico y meseta?
4. **Volumen-tiempo.** ¿El volumen vuelve a la línea de base al final de la espiración?
5. **Correlación.** Un hallazgo cobra sentido cuando lo confirmas en otra curva y en el paciente.

Las curvas escalares también son la base para detectar asincronías, un tema que se desarrolla en el módulo de asincronías paciente-ventilador (Georgopoulos et al., 2006).

<!-- page: calculo-mecanica-desde-curvas | EXERCISE | Mecánica a partir de las curvas -->
<!-- block: THEORY | Resistencia, compliance y constante de tiempo -->
En VCV con flujo constante y una pausa inspiratoria en un paciente pasivo, la curva de presión permite separar los componentes resistivo y elástico de la ecuación del movimiento (Lucangelo et al., 2005; Hess, 2014):

$$
R_{aw} = \frac{P_{pico} - P_{plat}}{\dot{V}}
$$

$$
C_{st} = \frac{V_T}{P_{plat} - PEEP_{total}}
$$

$$
\tau = R_{aw}\cdot C_{st}
$$

Donde:

- $R_{aw}$: resistencia inspiratoria del sistema (cmH₂O/L/s).
- $P_{pico}$ y $P_{plat}$: presión pico y presión meseta (cmH₂O).
- $\dot{V}$: flujo inspiratorio constante, en L/s (divide los L/min entre 60).
- $C_{st}$: compliance estática (L/cmH₂O o mL/cmH₂O).
- $V_T$: volumen corriente (L o mL).
- $PEEP_{total}$: PEEP programada más auto-PEEP (cmH₂O).
- $\tau$: constante de tiempo (s). Tras $1\tau$ sale alrededor del 63 % del volumen, tras $3\tau$ alrededor del 95 %.

Si el tiempo espiratorio es menor que unas tres constantes de tiempo, el pulmón no termina de vaciarse y aparece auto-PEEP; eso es lo que se ve en la curva de flujo cuando la espiración se interrumpe antes de llegar a cero (Dhand, 2005).

<!-- block: THEORY | La forma de la rampa: índice de estrés -->
En VCV con flujo constante y paciente pasivo, la curva de presión durante la inspiración debería ser casi recta. Si se curva, la compliance está cambiando dentro del ciclo. Esa forma se describe con una función de potencia:

$$
P_{aw} = a\cdot t^{\,b} + c
$$

El coeficiente $b$ es el índice de estrés: $b = 1$ indica una rampa recta; $b < 1$, una rampa cuya pendiente disminuye a lo largo de la inspiración (concavidad hacia abajo), que sugiere reclutamiento y desreclutamiento cíclico; y $b > 1$, una rampa cuya pendiente aumenta (concavidad hacia arriba), que sugiere sobredistensión. En un modelo experimental de lesión pulmonar, estos patrones correspondieron a los hallazgos tomográficos (Grasso et al., 2004). Solo es interpretable con flujo constante y sin esfuerzo del paciente, y su uso clínico requiere software o una valoración visual cuidadosa (Hess, 2014).

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente pasivo en VCV: Vt 500 mL, flujo constante 60 L/min, presión pico 32 cmH₂O, presión meseta 20 cmH₂O, PEEP 5 cmH₂O, sin auto-PEEP. Frecuencia 20/min, tiempo inspiratorio 1,0 s.

**1. Flujo en L/s.** $60/60 = 1{,}0$ L/s.

**2. Resistencia.**

$$
R_{aw} = \frac{32 - 20}{1{,}0} = 12\;\text{cmH}_2\text{O/L/s}
$$

**3. Compliance estática.**

$$
C_{st} = \frac{0{,}5}{20 - 5} = 0{,}033\;\text{L/cmH}_2\text{O} \;(33\;\text{mL/cmH}_2\text{O})
$$

**4. Constante de tiempo y tiempo espiratorio.**

$$
\tau = 12 \cdot 0{,}033 \approx 0{,}40\;\text{s} \qquad 3\tau \approx 1{,}2\;\text{s}
$$

El ciclo dura $60/20 = 3$ s y el tiempo espiratorio es $3 - 1 = 2$ s, mayor que $3\tau$: el pulmón debería vaciarse y el flujo espiratorio llegar a cero.

**5. Si la resistencia sube a 30 cmH₂O/L/s** por broncoespasmo: $\tau = 30\cdot 0{,}033 \approx 1{,}0$ s y $3\tau \approx 3{,}0$ s, más que los 2 s disponibles. Esperas que el flujo espiratorio no llegue a cero, es decir, auto-PEEP. Para alargar el tiempo espiratorio puedes bajar la frecuencia, reducir el volumen o acortar el tiempo inspiratorio, además de tratar el broncoespasmo.

<!-- page: patrones-anormales | THEORY | Patrones anormales y ajuste fino -->
<!-- block: THEORY | Auto-PEEP en la curva de flujo -->
El signo gráfico más útil de atrapamiento aéreo es un **flujo espiratorio que no vuelve a cero** antes de que empiece el siguiente ciclo (Dhand, 2005). La presión alveolar al final de la espiración sigue siendo mayor que la PEEP del circuito, y esa diferencia es la auto-PEEP. La curva te dice que existe, pero no cuánta hay: para medirla se usa una pausa espiratoria en un paciente pasivo, tema de la lección de auto-PEEP e hiperinflación dinámica. En pacientes que respiran espontáneamente, la auto-PEEP también se manifiesta como esfuerzos que no consiguen disparar el ventilador.

![Arriba, curva de flujo en la que el flujo espiratorio de los ciclos con auto-PEEP no llega a cero antes del ciclo siguiente, comparada con un ciclo de referencia que sí llega; abajo, curva de volumen en la que la rama espiratoria no regresa a cero por una fuga y cae de forma vertical al inicio del ciclo siguiente](/learning/diagrams/i4-graficas-autopeep-fuga.svg "Figura: auto-PEEP en la curva de flujo y fuga en la curva de volumen")

<!-- block: THEORY | Fugas en la curva de volumen -->
El ventilador calcula el volumen integrando el flujo. Si parte del gas inspirado no vuelve por la rama espiratoria (fuga por el balón del tubo, por una fístula broncopleural, por un drenaje torácico o por una conexión floja), la rama espiratoria de la curva de volumen **no regresa a cero**; el equipo la "reinicia" al empezar el siguiente ciclo y aparece una caída vertical. Al mismo tiempo, el volumen espirado es menor que el inspirado. Cuanto mayor es la diferencia, mayor es la fuga. Antes de cambiar parámetros, revisa el circuito, el balón y las conexiones.

<!-- block: THEORY | Secreciones y agua en el circuito -->
Las secreciones en la vía aérea o el agua condensada en las tubuladuras producen **oscilaciones irregulares** de alta frecuencia en la curva de flujo y, a veces, en la de presión, sobre todo en la espiración. Son las mismas que dan el aspecto en dientes de sierra al bucle flujo-volumen, que verás en la lección siguiente (Guglielminotti et al., 2000). Si aparecen, ausculta, aspira si está indicado y vacía las trampas de agua.

<!-- block: THEORY | Ajuste fino del flujo y del tiempo inspiratorio -->
- **VCV y hambre de flujo.** Si el paciente quiere más flujo del que está programado, su esfuerzo "tira" de la presión hacia abajo durante la inspiración y la rampa se vuelve cóncava, con una muesca. Indica que el flujo o el patrón de flujo no satisfacen la demanda; puedes aumentar el flujo, cambiar a un patrón desacelerado o a un modo de presión y, sobre todo, buscar la causa de la demanda (Georgopoulos et al., 2006).
- **PCV y tiempo inspiratorio.** Mira dónde llega a cero el flujo inspiratorio. Si llega a cero mucho antes de que termine el tiempo inspiratorio, hay un periodo sin flujo que solo alarga la inspiración y quita tiempo a la espiración; si el flujo aún es alto cuando termina, alargar un poco el tiempo inspiratorio puede aumentar el volumen. Ajusta el tiempo inspiratorio en función de lo que muestran el flujo inspiratorio y el espiratorio, no solo de una relación I:E fija.
- **Rise time (tiempo de subida) en PCV y PSV.** Una subida demasiado lenta deja al paciente con "hambre" al inicio; una demasiado rápida produce un pico de presión por encima del valor programado al comienzo de la inspiración. Ajústalo hasta obtener una presión que suba con rapidez y se mantenga plana.

<!-- page: aplicacion-clinica-curvas | CASE_STUDY | Las curvas en un caso real -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 67 años con EPOC grave, intubado por una exacerbación con acidosis respiratoria. Está sedado y sin esfuerzos. VCV: Vt 450 mL, frecuencia 22/min, flujo constante 40 L/min, PEEP 5 cmH₂O, FiO₂ 0,35. La presión arterial bajó en la última hora.

**Lo que muestran las curvas.**

- Flujo-tiempo: el flujo espiratorio cae con rapidez al principio y luego sigue saliendo lentamente; **no llega a cero** cuando empieza el siguiente ciclo.
- Presión-tiempo: presión pico 38 cmH₂O y meseta 22 cmH₂O.

**Razonamiento paso a paso.**

1. **Tiempos.** Ciclo de $60/22 \approx 2{,}7$ s. Con un flujo de 40 L/min (0,67 L/s), el tiempo inspiratorio es $0{,}45/0{,}67 \approx 0{,}68$ s, de modo que el tiempo espiratorio es de unos 2,0 s.
2. **Resistencia.** $R_{aw} = (38 - 22)/0{,}67 \approx 24$ cmH₂O/L/s, elevada, coherente con obstrucción.
3. **Interpretación.** El flujo que no llega a cero indica atrapamiento aéreo y auto-PEEP (Dhand, 2005); la hipotensión puede deberse al aumento de la presión intratorácica, que reduce el retorno venoso.
4. **Medición.** Haz una pausa espiratoria para cuantificar la auto-PEEP y recalcula la compliance con la PEEP total.
5. **Ajustes.** Tu objetivo es alargar el tiempo espiratorio: bajar la frecuencia (por ejemplo, de 22 a 14/min alarga el ciclo a unos 4,3 s); aumentar el flujo inspiratorio acorta el tiempo inspiratorio y deja más tiempo para espirar, aunque la presión pico subirá por el componente resistivo. Acompaña los ajustes con tratamiento broncodilatador y acepta cierto grado de hipercapnia si el pH lo permite; los objetivos concretos se tratan en el módulo de enfermedad obstructiva.
6. **Comprobación.** Tras el cambio, el flujo espiratorio debería acercarse a cero antes del siguiente ciclo, la auto-PEEP medida debería bajar y la presión arterial, mejorar.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) en VCV:

- Observa la curva de flujo-tiempo: verás que el flujo espiratorio no llega a cero antes del siguiente ciclo.
- Baja la frecuencia en varios pasos y comprueba que la espiración se completa cada vez más; fíjate también en la tendencia de la presión meseta y de la presión arterial media.
- Aumenta el flujo inspiratorio: la presión pico sube, pero el tiempo espiratorio se alarga.
- Cambia a PCV y observa que ahora es la curva de flujo inspiratorio la que cambia con la mecánica.

<!-- block: EXERCISE | Preguntas -->
**1.** En PCV, el flujo inspiratorio llega a cero a los 0,6 s y el tiempo inspiratorio programado es de 1,4 s. ¿Qué ajuste consideras?

*Respuesta:* Acortar el tiempo inspiratorio: los últimos 0,8 s no aportan volumen y quitan tiempo a la espiración. Comprueba después que el volumen no cae.

**2.** El volumen espirado es de 380 mL y el inspirado de 500 mL; en la curva de volumen la rama espiratoria no llega a cero. ¿Qué haces primero?

*Respuesta:* Buscar la fuga: revisar balón, conexiones, drenajes y circuito antes de cambiar parámetros.

**3.** En VCV, la rampa de presión se vuelve cóncava con una muesca durante la inspiración en un paciente despierto. ¿Qué indica?

*Respuesta:* Esfuerzo inspiratorio del paciente durante el ciclo, por un flujo insuficiente para su demanda (Georgopoulos et al., 2006).

<!-- page: sintesis-curvas | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- En VCV la presión refleja la mecánica; en PCV y PSV, el flujo y el volumen la reflejan.
- Lee siempre las curvas en el mismo orden y confirma cada hallazgo en otra curva y en el paciente.
- Con pausa inspiratoria en VCV puedes calcular la resistencia y la compliance estática (Lucangelo et al., 2005; Hess, 2014).
- Un flujo espiratorio que no vuelve a cero indica auto-PEEP; la pausa espiratoria la cuantifica (Dhand, 2005).
- Si la curva de volumen no regresa a cero y el volumen espirado es menor que el inspirado, busca una fuga.
- Las oscilaciones irregulares en el flujo sugieren secreciones o agua en el circuito.
- En PCV, ajusta el tiempo inspiratorio según el punto en que el flujo inspiratorio llega a cero; en VCV, una rampa cóncava indica hambre de flujo (Georgopoulos et al., 2006).
- La forma de la rampa de presión en VCV con flujo constante (índice de estrés) sugiere reclutamiento cíclico o sobredistensión, con evidencia sobre todo experimental (Grasso et al., 2004).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Calcular la resistencia con el flujo en L/min** → el resultado queda 60 veces menor → convierte el flujo a L/s antes de dividir.
- **Interpretar la presión pico como presión alveolar** → la pico incluye el componente resistivo → mide la meseta con una pausa inspiratoria para valorar la distensión alveolar.
- **Ver un flujo espiratorio que no llega a cero y subir la frecuencia para "ventilar más"** → acorta aún más la espiración y empeora el atrapamiento → alarga el tiempo espiratorio y mide la auto-PEEP.
- **Aplicar el índice de estrés en un paciente que respira o con flujo desacelerado** → la forma de la curva ya no depende solo de la mecánica → úsalo solo en VCV con flujo constante y paciente pasivo.
- **Corregir parámetros ante una curva de volumen que no regresa a cero** → la causa suele ser una fuga física → revisa balón, conexiones y drenajes primero.

<!-- block: REFERENCES | Referencias -->
- Dhand, R. (2005). Ventilator graphics and respiratory mechanics in the patient with obstructive lung disease. *Respiratory Care, 50*(2), 246-261. [https://doi.org/10.4187/respcare.05500246](https://doi.org/10.4187/respcare.05500246)
- Georgopoulos, D., Prinianakis, G., & Kondili, E. (2006). Bedside waveforms interpretation as a tool to identify patient-ventilator asynchronies. *Intensive Care Medicine, 32*(1), 34-47. [https://doi.org/10.1007/s00134-005-2828-5](https://doi.org/10.1007/s00134-005-2828-5)
- Grasso, S., Terragni, P., Mascia, L., Fanelli, V., Quintel, M., Herrmann, P., Hedenstierna, G., Slutsky, A. S., & Ranieri, V. M. (2004). Airway pressure-time curve profile (stress index) detects tidal recruitment/hyperinflation in experimental acute lung injury. *Critical Care Medicine, 32*(4), 1018-1027. [https://doi.org/10.1097/01.CCM.0000120059.94009.AD](https://doi.org/10.1097/01.CCM.0000120059.94009.AD)
- Guglielminotti, J., Alzieu, M., Maury, E., Guidet, B., & Offenstadt, G. (2000). Bedside detection of retained tracheobronchial secretions in patients receiving mechanical ventilation: Is it time for tracheal suctioning? *Chest, 118*(4), 1095-1099. [https://doi.org/10.1378/chest.118.4.1095](https://doi.org/10.1378/chest.118.4.1095)
- Hess, D. R. (2014). Respiratory mechanics in mechanically ventilated patients. *Respiratory Care, 59*(11), 1773-1794. [https://doi.org/10.4187/respcare.03410](https://doi.org/10.4187/respcare.03410)
- Lucangelo, U., Bernabè, F., & Blanch, L. (2005). Respiratory mechanics derived from signals in the ventilator circuit. *Respiratory Care, 50*(1), 55-67. [https://doi.org/10.4187/respcare.05500055](https://doi.org/10.4187/respcare.05500055)
