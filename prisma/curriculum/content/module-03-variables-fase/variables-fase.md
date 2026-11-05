<!-- page: conceptos-variables-fase | THEORY | Conceptos: la lógica de cada respiración -->
<!-- block: INTRODUCTION | Por qué hablar de variables de fase -->
Cada fabricante da a sus modos nombres comerciales distintos, y un mismo nombre puede esconder comportamientos diferentes en dos equipos. Si aprendes los modos como una lista de siglas, te perderás en cuanto cambies de ventilador. Si, en cambio, aprendes a preguntarte **qué inicia la inspiración, qué se mantiene durante ella, qué la termina y qué ocurre entre una respiración y la siguiente**, podrás describir y predecir el comportamiento de cualquier modo.

Esa es la idea de las variables de fase. Además de ordenar el conocimiento, tienen consecuencias clínicas directas: un disparo mal ajustado hace que el paciente gaste esfuerzos que el ventilador no reconoce, y un ciclado que no coincide con el final de la inspiración del paciente lo lleva a pelear contra la máquina. Las asincronías son frecuentes: en un estudio prospectivo, una cuarta parte de los pacientes en ventilación asistida tenía un índice de asincronía mayor del 10 %, y esa situación se asoció con más días de ventilación mecánica (Thille et al., 2006).

<!-- block: THEORY | La variable de control: presión o volumen, nunca ambos -->
Recuerda la ecuación del movimiento que viste en «La ecuación del movimiento»: la presión necesaria para insuflar el sistema respiratorio es la suma de un componente elástico (volumen dividido entre compliance), un componente resistivo (resistencia por flujo) y la presión de base. Como la compliance y la resistencia dependen del paciente, el ventilador solo puede predeterminar **una** de las dos cosas: o fija la forma de la presión y el volumen resulta de la mecánica, o fija el volumen (y su flujo) y la presión resulta de la mecánica. A esa magnitud fijada se le llama **variable de control** (Chatburn et al., 2014).

- En el **control por volumen**, el volumen y el flujo inspiratorio están predeterminados; la presión varía si cambian la compliance o la resistencia.
- En el **control por presión**, la presión inspiratoria está predeterminada; el volumen y el flujo varían con la mecánica y con el esfuerzo del paciente.

La lección «Taxonomía de los modos ventilatorios» desarrolla esta clasificación; aquí nos centramos en las fases de cada respiración.

<!-- block: THEORY | Las cuatro variables de fase -->
Cada respiración mecánica tiene cuatro momentos, y cada uno lo gobierna una variable (Chatburn et al., 2014; Hess y Kacmarek, 2019):

| Fase | Pregunta que responde | Variables posibles |
|---|---|---|
| Disparo (*trigger*) | ¿Qué inicia la inspiración? | Tiempo (máquina); presión, flujo o señal neural (paciente) |
| Límite u objetivo (*target*) | ¿Qué valor se mantiene o no se supera durante la inspiración? | Presión, flujo o volumen |
| Ciclado (*cycle*) | ¿Qué termina la inspiración? | Tiempo, volumen, flujo o presión |
| Base (*baseline*) | ¿Qué se mantiene durante la espiración? | Presión: PEEP o CPAP |

![Curvas de presión y de flujo en el tiempo en ventilación controlada por volumen: el disparo marca el inicio de la inspiración; durante la inspiración el flujo es constante (objetivo) y la presión sube hasta el pico y cae a la meseta en la pausa; el ciclado ocurre al terminar el tiempo inspiratorio; en la espiración la presión vuelve a la PEEP, que es la línea de base](/learning/diagrams/b3-variables-ciclo-fases.svg "Figura: las cuatro variables de fase en un ciclo de VCV")

Observa la figura con atención a una distinción que confunde a muchos principiantes: **limitar no es terminar**. Durante la inspiración del ejemplo, el flujo se mantiene en el valor programado (es el objetivo o límite), pero la inspiración no termina por eso; termina cuando se cumple el criterio de ciclado. Del mismo modo, en ventilación controlada por presión la presión alcanza el nivel programado y se mantiene en una meseta hasta que el tiempo inspiratorio programado termina. En la literatura anterior se hablaba de «variable límite»; la taxonomía actual prefiere hablar de **objetivo** (*target*) para describir lo que el ventilador busca entregar dentro de la respiración (Chatburn et al., 2014).

<!-- block: THEORY | Respiraciones mandatorias y espontáneas -->
Las variables de disparo y ciclado permiten clasificar cada respiración según quién decide sus tiempos (Chatburn et al., 2014):

- **Respiración espontánea:** el paciente decide tanto el inicio como el final de la inspiración (disparo y ciclado por el paciente). Puede ser asistida, como en presión de soporte, o no asistida, como en CPAP.
- **Respiración mandatoria:** el ventilador decide el inicio, el final o ambos. Una respiración disparada por el paciente pero ciclada por tiempo o por volumen sigue siendo mandatoria, porque el paciente no controla cuándo termina.

Esta distinción es la base de las secuencias de respiraciones (ventilación mandatoria continua, intermitente y espontánea continua) que estudiarás en la lección sobre taxonomía de los modos.
<!-- page: disparo-ciclado-base | THEORY | Disparo, ciclado y línea de base en detalle -->
<!-- block: THEORY | Disparo: quién y cómo inicia la inspiración -->
#### Disparo por tiempo

El ventilador inicia la inspiración cuando transcurre el intervalo que resulta de la frecuencia programada, con independencia de lo que haga el paciente. Es el disparo de las respiraciones totalmente controladas, por ejemplo en un paciente sedado y relajado.

#### Disparo por presión

El paciente contrae sus músculos inspiratorios contra un circuito cerrado y hace caer la presión por debajo de la PEEP. Cuando la caída alcanza el umbral programado (la sensibilidad), el ventilador abre la válvula inspiratoria.

#### Disparo por flujo

Entre respiraciones circula por el circuito un flujo de base; el ventilador compara el flujo que sale por la rama inspiratoria con el que regresa por la espiratoria. Cuando el paciente inspira, parte de ese flujo se desvía hacia él, aparece una diferencia y, al superar el umbral, se dispara la respiración. El paciente no necesita generar una caída de presión apreciable.

![Dos paneles. A la izquierda, disparo por presión: la presión baja desde la PEEP hasta el umbral y en ese punto comienza la asistencia. A la derecha, disparo por flujo: el flujo sube desde cero hasta cruzar el umbral de flujo y en ese punto se entrega la inspiración](/learning/diagrams/b3-variables-disparo.svg "Figura: disparo por presión frente a disparo por flujo")

**¿Cuál es mejor?** En un estudio de banco con nueve ventiladores, el esfuerzo para disparar varió de forma significativa entre equipos con ajustes de uso habitual; en pacientes con presión de soporte, el disparo por flujo con 2 L/min redujo los índices de esfuerzo respiratorio entre un 13 % y un 16 % frente al disparo por presión con −2 cmH₂O, mientras que en ventilación asistida-controlada por volumen no hubo diferencias (Aslanian et al., 1998). La diferencia real depende del equipo y, sobre todo, de lo que ocurre después del disparo: si el flujo entregado no cubre la demanda, el paciente sigue haciendo esfuerzo.

#### Los dos extremos de la sensibilidad

- **Demasiado poco sensible:** el paciente hace esfuerzos que no alcanzan el umbral y no reciben respiración (esfuerzos ineficaces). Un disparo menos sensible, un nivel de presión de soporte alto y un volumen corriente alto se asociaron con más esfuerzos ineficaces (Thille et al., 2006). Los umbrales altos y la propia técnica de disparo favorecen esfuerzos desperdiciados, que empeoran si hay debilidad muscular o un impulso respiratorio bajo (Sassoon, 2011).
- **Demasiado sensible:** el ventilador interpreta como esfuerzo algo que no lo es (autodisparo): fugas, agua en el circuito o las oscilaciones transmitidas por el latido cardíaco. En pacientes paralizados tras cirugía cardíaca con disparo por flujo a 1 L/min, el 22 % presentó autodisparo por oscilación cardiogénica, con alcalosis respiratoria e hiperinflación (Imanaka et al., 2000).

<!-- block: THEORY | Ciclado: qué termina la inspiración -->
- **Por tiempo:** la inspiración termina al cumplirse el tiempo inspiratorio programado. Es el ciclado de la ventilación controlada por presión y de la controlada por volumen cuando hay pausa inspiratoria.
- **Por volumen:** termina cuando se ha entregado el volumen programado. En algunos equipos, el volumen y el flujo programados determinan en la práctica el tiempo inspiratorio.
- **Por flujo:** termina cuando el flujo inspiratorio cae a un porcentaje del flujo pico. Es el ciclado de la presión de soporte, y lo controla el paciente.
- **Por presión:** termina al alcanzar una presión. Hoy se usa sobre todo como mecanismo de seguridad: cuando la presión supera el límite de alarma de presión alta, el ventilador interrumpe la inspiración (Hess y Kacmarek, 2019).

![Curva de flujo inspiratorio en presión de soporte: el flujo sube al pico y decae; con criterio de ciclado del 50 % del pico la inspiración termina antes y el tiempo inspiratorio es corto, con el 25 % termina después y el tiempo inspiratorio es largo](/learning/diagrams/b3-variables-ciclado-flujo.svg "Figura: ciclado por flujo en presión de soporte")

El ciclado ideal coincide con el final de la inspiración neural del paciente. Si el ventilador termina antes (ciclado prematuro) o después (ciclado tardío), aparece asincronía; la mayoría de los ventiladores actuales permite ajustar el criterio de ciclado y apoyarse en las curvas para hacerlo (Gentile, 2011). En pacientes con enfermedad obstructiva, el flujo decae lentamente y el ciclado se retrasa; elevar el criterio de ciclado del 10 % al 70 % del flujo pico redujo el retraso del ciclado, la auto-PEEP y los esfuerzos no disparados (Tassaux et al., 2005). Volverás sobre estas asincronías en «Asincronías de flujo y de ciclado».

<!-- block: THEORY | Línea de base: lo que ocurre entre respiraciones -->
La variable de base es la presión que el ventilador mantiene durante la espiración: la PEEP en las respiraciones mandatorias o la CPAP en las espontáneas. Si es cero, el paciente exhala hasta la presión atmosférica. La línea de base importa por tres razones: mantiene abiertos alvéolos inestables al final de la espiración, es el punto de partida desde el que se mide el esfuerzo de disparo y es la referencia para calcular la presión de distensión. Cuando el paciente no termina de exhalar antes del siguiente ciclo, la presión alveolar al final de la espiración queda por encima de la PEEP programada (auto-PEEP) y el paciente tendrá que superar esa diferencia antes de poder disparar.
<!-- page: formulas-tiempos | EXERCISE | Fórmulas y cálculo: tiempo inspiratorio y criterio de ciclado -->
<!-- block: EQUATION | Ecuación del movimiento con esfuerzo del paciente -->
P_{vent} + P_{mus} = \frac{V}{C_{rs}} + R_{aw}\cdot\dot{V} + PEEP_{total}

<!-- block: THEORY | Qué significa cada término -->
- $P_{vent}$: presión aplicada por el ventilador, en cmH₂O.
- $P_{mus}$: presión generada por los músculos del paciente, en cmH₂O (cero en un paciente pasivo).
- $V$: volumen por encima de la capacidad residual funcional, en L.
- $C_{rs}$: compliance del sistema respiratorio, en L/cmH₂O.
- $R_{aw}$: resistencia, en cmH₂O/(L/s).
- $\dot{V}$: flujo, en L/s.
- $PEEP_{total}$: PEEP programada más auto-PEEP, en cmH₂O.

La ecuación explica el disparo: antes de que el ventilador actúe ($P_{vent}$ todavía igual a la base), el esfuerzo $P_{mus}$ del paciente es lo único que produce la caída de presión o el flujo que detectan los sensores. Si hay auto-PEEP, una parte de $P_{mus}$ se gasta en anularla antes de que aparezca cualquier señal.

<!-- block: THEORY | Tiempo inspiratorio en VCV con flujo constante -->
Con flujo constante, el tiempo de entrega de volumen es el volumen dividido entre el flujo; si programas una pausa, el ciclado ocurre al terminarla:

$$
T_i = \frac{V_T}{\dot{V}} + T_{pausa}
$$

**Ejemplo resuelto.** $V_T = 450\,\text{mL} = 0{,}45\,\text{L}$; flujo $= 54\,\text{L/min} = 54/60 = 0{,}9\,\text{L/s}$; pausa de $0{,}3\,\text{s}$.

1. Tiempo con flujo: $0{,}45 / 0{,}9 = 0{,}5\,\text{s}$.
2. Tiempo inspiratorio total: $0{,}5 + 0{,}3 = 0{,}8\,\text{s}$.
3. Si subes el flujo a $72\,\text{L/min}$ ($1{,}2\,\text{L/s}$), el tiempo con flujo baja a $0{,}375\,\text{s}$ y el total a $0{,}675\,\text{s}$: el ciclado llega antes y queda más tiempo para espirar.

<!-- block: THEORY | Ciclado por flujo en presión de soporte -->
En presión de soporte el ventilador cicla cuando el flujo cae a una fracción $f$ del flujo pico:

$$
\dot{V}_{ciclado} = f\cdot\dot{V}_{pico}
$$

En un paciente que deja de hacer esfuerzo poco después del disparo, el flujo decae de forma aproximadamente exponencial con la constante de tiempo del sistema respiratorio, $\tau = R_{aw}\cdot C_{rs}$. El tiempo que tarda en caer hasta el umbral es:

$$
t_{ciclado} \approx \tau\cdot\ln\!\left(\frac{1}{f}\right)
$$

Es una simplificación con fines didácticos: el esfuerzo activo del paciente y el tiempo de presurización modifican la forma real de la curva.

**Ejemplo resuelto.** Flujo pico de $60\,\text{L/min}$.

1. Umbral con $f = 0{,}25$: $0{,}25 \times 60 = 15\,\text{L/min}$. Con $f = 0{,}50$: $30\,\text{L/min}$.
2. Paciente con mecánica cercana a la normal: $R_{aw} = 10\,\text{cmH}_2\text{O/(L/s)}$ y $C_{rs} = 0{,}05\,\text{L/cmH}_2\text{O}$, así que $\tau = 0{,}5\,\text{s}$. Con $f = 0{,}25$: $0{,}5 \times \ln 4 = 0{,}5 \times 1{,}386 \approx 0{,}69\,\text{s}$.
3. Paciente con obstrucción: $R_{aw} = 20$ y $C_{rs} = 0{,}04$, así que $\tau = 0{,}8\,\text{s}$. Con $f = 0{,}25$: $0{,}8 \times 1{,}386 \approx 1{,}11\,\text{s}$. Con $f = 0{,}50$: $0{,}8 \times \ln 2 = 0{,}8 \times 0{,}693 \approx 0{,}55\,\text{s}$.

La conclusión es fisiológica, no solo aritmética: con la misma regla de ciclado, el paciente obstructivo recibe una inspiración más larga, que roba tiempo a una espiración que ya es lenta. Aumentar la fracción de ciclado acorta la inspiración, coherente con lo observado por Tassaux et al. (2005).

<!-- block: EXERCISE | Comprueba tu cálculo -->
1. En VCV, $V_T = 400\,\text{mL}$, flujo de $48\,\text{L/min}$ y sin pausa. ¿Cuál es el tiempo inspiratorio?
2. En presión de soporte, flujo pico de $50\,\text{L/min}$ y criterio del 30 %. ¿A qué flujo cicla?
3. Con $\tau = 0{,}6\,\text{s}$, ¿cuánto tarda en ciclar con criterio del 25 % y con el 50 %?

**Respuestas.** 1) $48/60 = 0{,}8\,\text{L/s}$; $0{,}4/0{,}8 = 0{,}5\,\text{s}$. 2) $0{,}3 \times 50 = 15\,\text{L/min}$. 3) $0{,}6 \times 1{,}386 \approx 0{,}83\,\text{s}$ y $0{,}6 \times 0{,}693 \approx 0{,}42\,\text{s}$.
<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: leer las fases en un paciente obstructivo -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Mujer de 67 años con EPOC grave, intubada hace tres días por una exacerbación con acidosis respiratoria. La causa está mejorando y se pasó a presión de soporte: soporte de 16 cmH₂O sobre PEEP de 5 cmH₂O, disparo por flujo y criterio de ciclado del 25 % del flujo pico.

**Lo que observas.** La frecuencia que muestra el ventilador es de 18 respiraciones/min, pero al mirar a la paciente cuentas unas 26 contracciones del cuello y el abdomen por minuto. En la curva de flujo, el flujo espiratorio no llega a cero antes de la siguiente respiración, y en algunas espiraciones hay pequeñas deflexiones del flujo hacia la línea de cero sin que el ventilador entregue un ciclo. Al final de varias inspiraciones aparece una pequeña elevación de la presión por encima del nivel de soporte.

**Razonamiento paso a paso, fase por fase.**

1. **Disparo.** Hay esfuerzos que no disparan: son esfuerzos ineficaces. El flujo espiratorio que no vuelve a cero indica auto-PEEP: la paciente tiene que anularla con sus músculos antes de que el ventilador perciba nada.
2. **Objetivo.** Un soporte alto genera volúmenes grandes que necesitan más tiempo para exhalarse; el soporte alto y el volumen corriente alto se asociaron con más esfuerzos ineficaces (Thille et al., 2006).
3. **Ciclado.** La elevación de presión al final de la inspiración sugiere que la paciente ya está intentando exhalar mientras el ventilador sigue insuflando: ciclado tardío. Con una constante de tiempo larga, el flujo tarda en caer al 25 % del pico, como calculaste en la página anterior.
4. **Base.** La PEEP programada es menor que la auto-PEEP probable; la lección «Auto-PEEP e hiperinflación dinámica» explica cómo medirla y cuándo ajustar la PEEP externa.
5. **Ajustes razonados.** Aumentar el criterio de ciclado para acortar la inspiración, una intervención que en pacientes obstructivos redujo el retraso del ciclado, la auto-PEEP y los esfuerzos no disparados (Tassaux et al., 2005); valorar reducir el nivel de soporte si el volumen corriente es alto; comprobar la sensibilidad del disparo sin llevarla al extremo que produce autodisparo; y tratar la causa de la obstrucción (broncodilatación, secreciones).
6. **Reevaluación.** El éxito se reconoce cuando la frecuencia del ventilador se acerca a la de la paciente, desaparecen las deflexiones sin ciclo y el flujo espiratorio se acerca a cero al final de la espiración.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y analiza las fases de cada respiración:

- En VCV, identifica en la curva el disparo, el flujo constante (objetivo) y el ciclado; observa que el flujo espiratorio no llega a cero antes del siguiente ciclo.
- Reduce la frecuencia o aumenta el flujo inspiratorio y comprueba que el ciclado llega antes, la espiración se alarga y el flujo espiratorio se acerca a cero.
- Cambia a PSV y fíjate en que el flujo inspiratorio pasa a ser desacelerado y el final de la inspiración lo decide la caída del flujo, no un tiempo fijo.

<!-- block: EXERCISE | Preguntas de razonamiento -->
1. En un modo controlado por presión, la presión llega al nivel programado a los 0,2 s y el tiempo inspiratorio es de 1 s. ¿Cuál es la variable objetivo y cuál la de ciclado?
2. Una respiración la dispara el paciente, entrega un volumen fijo y termina al completarse ese volumen. ¿Es una respiración espontánea o mandatoria?
3. Tras cirugía cardíaca, un paciente sedado y sin esfuerzos tiene una frecuencia medida muy superior a la programada y la PaCO₂ baja. ¿Qué sospechas y qué revisas?

**Respuestas.** 1) Objetivo: presión; ciclado: tiempo. 2) Mandatoria: el ventilador decide cuándo termina (Chatburn et al., 2014). 3) Autodisparo; revisa fugas, agua en el circuito y oscilaciones cardiogénicas, y reduce la sensibilidad del disparo hasta que desaparezca, como se describió con el disparo por flujo tras cirugía cardíaca (Imanaka et al., 2000).
<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El ventilador solo puede controlar una variable a la vez, presión o volumen; la otra depende de la mecánica del paciente.
- Cada respiración se describe con cuatro variables de fase: disparo, objetivo o límite, ciclado y base (Chatburn et al., 2014).
- Limitar no es terminar: el objetivo se mantiene durante la inspiración, pero la inspiración termina solo cuando se cumple el criterio de ciclado.
- Una respiración es espontánea solo si el paciente la dispara y la cicla; si el ventilador decide el inicio o el final, es mandatoria.
- Un disparo poco sensible produce esfuerzos ineficaces y uno demasiado sensible produce autodisparo (Thille et al., 2006; Imanaka et al., 2000).
- En presión de soporte, el ciclado por flujo depende de la constante de tiempo: en la obstrucción la inspiración se alarga y elevar el criterio de ciclado la acorta (Tassaux et al., 2005).
- La línea de base (PEEP o CPAP) es la referencia del disparo; la auto-PEEP se suma al esfuerzo que el paciente debe hacer para disparar.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Confundir límite con ciclado** → la presión o el flujo pueden mantenerse en su valor objetivo sin que la inspiración termine → pregúntate siempre por separado qué se mantiene y qué termina la inspiración.
- **Llamar «espontánea» a toda respiración disparada por el paciente** → si el ventilador decide el final, la respiración es mandatoria → mira quién controla el ciclado.
- **Subir la sensibilidad al máximo «para que no le cueste disparar»** → aparecen autodisparos por fugas, agua u oscilación cardiogénica (Imanaka et al., 2000) → ajusta hasta el punto más sensible que no autodispare.
- **Atribuir los esfuerzos ineficaces solo al disparo** → la auto-PEEP, el soporte alto y el volumen corriente alto también los favorecen (Thille et al., 2006) → revisa el flujo espiratorio y el nivel de asistencia.
- **Dejar el criterio de ciclado de fábrica en un paciente obstructivo** → la inspiración se prolonga y la espiración no alcanza → valora un criterio de ciclado más alto y comprueba el efecto en las curvas (Tassaux et al., 2005).
- **Contar solo la frecuencia que muestra la pantalla** → los esfuerzos que no disparan no aparecen en ella → observa al paciente y compáralo con la curva de flujo.

<!-- block: REFERENCES | Referencias -->
- Aslanian, P., El Atrous, S., Isabey, D., Valente, E., Corsi, D., Harf, A., Lemaire, F., & Brochard, L. (1998). Effects of flow triggering on breathing effort during partial ventilatory support. *American Journal of Respiratory and Critical Care Medicine, 157*(1), 135-143. [https://doi.org/10.1164/ajrccm.157.1.96-12052](https://doi.org/10.1164/ajrccm.157.1.96-12052)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Gentile, M. A. (2011). Cycling of the mechanical ventilator breath. *Respiratory Care, 56*(1), 52-60. [https://doi.org/10.4187/respcare.01088](https://doi.org/10.4187/respcare.01088)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Imanaka, H., Nishimura, M., Takeuchi, M., Kimball, W. R., Yahagi, N., & Kumon, K. (2000). Autotriggering caused by cardiogenic oscillation during flow-triggered mechanical ventilation. *Critical Care Medicine, 28*(2), 402-407. [https://doi.org/10.1097/00003246-200002000-00019](https://doi.org/10.1097/00003246-200002000-00019)
- Sassoon, C. S. (2011). Triggering of the ventilator in patient-ventilator interactions. *Respiratory Care, 56*(1), 39-51. [https://doi.org/10.4187/respcare.01006](https://doi.org/10.4187/respcare.01006)
- Tassaux, D., Gainnier, M., Battisti, A., & Jolliet, P. (2005). Impact of expiratory trigger setting on delayed cycling and inspiratory muscle workload. *American Journal of Respiratory and Critical Care Medicine, 172*(10), 1283-1289. [https://doi.org/10.1164/rccm.200407-880OC](https://doi.org/10.1164/rccm.200407-880OC)
- Thille, A. W., Rodriguez, P., Cabello, B., Lellouche, F., & Brochard, L. (2006). Patient-ventilator asynchrony during assisted mechanical ventilation. *Intensive Care Medicine, 32*(10), 1515-1522. [https://doi.org/10.1007/s00134-006-0301-8](https://doi.org/10.1007/s00134-006-0301-8)
