<!-- page: tipos-de-alarma | THEORY | Para qué sirven las alarmas y qué tipos existen -->
<!-- block: INTRODUCTION | Por qué importa -->
El paciente ventilado depende por completo de un equipo y de un circuito que pueden fallar, desconectarse u obstruirse en cualquier momento. Las alarmas son la red de seguridad que avisa de esos eventos cuando nadie está mirando la pantalla. Pero una alarma solo protege si está bien configurada y si alguien responde a ella: un límite demasiado amplio no detecta el problema, y uno demasiado estrecho suena tantas veces que el equipo deja de escucharlo. La seguridad de las alarmas de los dispositivos médicos es un problema reconocido por las agencias de calidad hospitalaria (The Joint Commission, 2013).

<!-- block: THEORY | Qué vigila una alarma -->
Cada alarma compara una variable medida con un límite. Algunos límites los programas tú (presión alta, volumen bajo, ventilación minuto, frecuencia alta); otros son fijos o automáticos del equipo (fallo de suministro de gas, fallo eléctrico, apnea con ventilación de respaldo, fallo técnico). Los fabricantes clasifican además las alarmas por **prioridad**, que se reconoce por el color, el tono y la repetición de la señal sonora; los estudios de alarmas suelen centrarse en las de prioridad alta y media porque son las que exigen respuesta (Langga et al., 2021).

Conviene agruparlas según lo que protegen:

| Grupo | Alarmas | Qué te dicen |
|---|---|---|
| Presión | Presión alta, presión baja | La vía aérea se obstruye, la mecánica empeora o el circuito pierde presión |
| Volumen y ventilación | Vte bajo, VE alta o baja | El paciente recibe menos (o más) ventilación de la esperada |
| Frecuencia y apnea | FR alta, apnea | Cambios en el impulso respiratorio, autodisparo o ausencia de esfuerzo |
| Integridad del circuito | Desconexión, fuga | El gas no llega al paciente o no vuelve al ventilador |
| Suministro y equipo | Fallo de gas, de energía o técnico | El ventilador no puede funcionar como está programado |

<!-- block: THEORY | Presión alta y presión baja: dos alarmas opuestas -->
![Esquema comparativo de dos columnas: a la izquierda, causas de alarma de presión alta agrupadas en vía aérea y tubo (secreciones, tubo acodado o mordido, broncoespasmo, tos o lucha con el ventilador) y en el pulmón y el tórax (caída de compliance, neumotórax, intubación selectiva, distensión abdominal); a la derecha, causas de alarma de presión baja o volumen bajo (desconexión, fuga por el manguito, fuga del circuito, extubación accidental, esfuerzo inspiratorio intenso en VCV)](/learning/diagrams/b6-alarmas-alta-baja-presion.svg "Figura: causas frecuentes de alarma de presión alta frente a presión baja")

La **alarma de presión alta** se activa cuando la presión en la vía aérea supera el límite. En la mayoría de los equipos, además de sonar, el ventilador interrumpe la inspiración en curso y abre la válvula espiratoria para no seguir subiendo la presión. La consecuencia es que ese ciclo entrega **menos volumen** del programado. Por eso, una alarma de presión alta repetida puede acabar provocando hipoventilación aunque no veas una alarma de volumen.

Recuerda lo aprendido en la lección de monitoreo: si sube el pico pero no la meseta, el problema es resistivo (secreciones, tubo acodado o mordido, broncoespasmo); si suben pico y meseta, la compliance cayó (neumotórax, intubación selectiva, atelectasia, distensión abdominal). La tos y la lucha del paciente con el ventilador también elevan la presión de forma brusca y transitoria.

La **alarma de presión baja** indica que el sistema no se presuriza como debería: lo más frecuente es una desconexión o una fuga (manguito desinflado, conexión floja, tubo desplazado hacia la glotis). En VCV, un esfuerzo inspiratorio muy intenso del paciente también puede bajar la presión, porque el paciente "tira" del gas más rápido de lo que el ventilador lo entrega.

<!-- block: THEORY | Volumen, ventilación minuto, frecuencia y apnea -->
- **Vte bajo / VE baja:** sale menos gas del paciente. Piensa en fuga, desconexión parcial, o, en modos controlados por presión, en una caída de la compliance o un aumento de la resistencia, que reducen el volumen sin cambiar la presión. En PCV y PSV estas son las alarmas que realmente vigilan la mecánica.
- **VE alta / FR alta:** el paciente respira más rápido o el ventilador se dispara solo. Puede reflejar dolor, ansiedad, acidosis metabólica, fiebre o hipoxemia, pero también autodisparo por fugas o agua en el circuito. Una taquipnea mantenida es una señal de carga respiratoria excesiva que obliga a buscar la causa.
- **Apnea:** no se detecta ningún ciclo durante el tiempo programado. Los equipos inician entonces una ventilación de respaldo. Es especialmente relevante en modos espontáneos (PSV, CPAP), en los que la frecuencia depende del paciente.
- **Desconexión y fallos de suministro o energía:** son alarmas de máxima prioridad porque el paciente puede quedar sin ventilación en segundos. Verifica siempre que el equipo esté conectado a la red eléctrica, que la batería esté cargada y que las tomas de gas estén bien acopladas.
<!-- page: ajuste-de-limites | EXERCISE | Cómo ajustar los límites -->
<!-- block: INTRODUCTION | Un límite es una decisión clínica -->
Los valores predeterminados de un ventilador están pensados para un paciente promedio que no existe. Una revisión sobre estrategias de alarma propone justamente lo contrario: ajustar los límites a las características de cada paciente, con una lógica parecida a la de la medicina personalizada (Walsh & Waugh, 2020). No hay una nomenclatura ni unos valores estandarizados de configuración de alarmas para la ventilación mecánica (Scott et al., 2019), así que cada institución define su política y tú la aplicas al paciente concreto.

<!-- block: THEORY | Principios para fijar un límite -->
Un buen límite cumple tres condiciones:

1. **Está anclado a los valores actuales del paciente**, medidos cuando está estable, y no a un número fijo del equipo.
2. **Deja un margen** suficiente para que la variabilidad normal (un cambio de postura, una tos aislada) no lo active continuamente, pero lo bastante estrecho para que un cambio relevante sí lo haga.
3. **Se revisa** cada vez que cambias el modo, el volumen, la presión o la frecuencia, y cada vez que cambia la situación del paciente.

Como ejemplo de una política institucional publicada, un hospital pediátrico fijaba el límite de presión alta entre 10 y 15 cmH₂O por encima de la presión inspiratoria pico del paciente y el de presión baja 5 cmH₂O por debajo de ese pico (Langga et al., 2021). Tómalo como una ilustración de cómo se construye un límite relativo, no como una norma universal: sigue el protocolo de tu unidad.

<!-- block: THEORY | Fórmulas útiles -->
Un límite relativo se expresa como el valor medido más (o menos) un margen:

$$
L_{P\,alta} = P_{pico} + m
$$

donde $L_{P\,alta}$ es el límite de presión alta (cmH₂O), $P_{pico}$ la presión pico estable del paciente (cmH₂O) y $m$ el margen definido por tu protocolo (cmH₂O).

La ventilación minuto esperada, con la que se comparan las alarmas de VE, es:

$$
\dot{V}_E = V_{Te}\cdot f
$$

con $V_{Te}$ en litros y $f$ en respiraciones por minuto; el resultado está en L/min. Si el modo es controlado y el paciente no dispara ciclos adicionales, $f$ es la frecuencia programada; si dispara, usa la frecuencia total medida.

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente en VCV, estable, con $V_T = 450\,\text{mL}$, frecuencia programada 16/min y sin ciclos disparados. El monitor muestra $P_{pico} = 24\,\text{cmH}_2\text{O}$ y Vte 445 mL. Tu unidad aplica un margen de 10 cmH₂O para la presión alta.

**1. Límite de presión alta:** $L_{P\,alta} = 24 + 10 = 34\,\text{cmH}_2\text{O}$.

**2. Ventilación minuto actual:** $\dot{V}_E = 0{,}445 \times 16 = 7{,}12\,\text{L/min}$. Los límites de VE alta y baja deben rodear este valor con el margen que fije tu protocolo.

**3. Revisión tras un cambio:** subes el volumen a 500 mL. El pico pasa a 27 cmH₂O, de modo que el nuevo límite, con el mismo margen, sería 37 cmH₂O, y la VE esperada pasa a $0{,}495 \times 16 \approx 7{,}9\,\text{L/min}$. Si no reajustas, el límite de presión quedará más cerca del valor habitual y la alarma de VE baja puede quedar demasiado lejos para detectar una fuga.

**4. Comprobación de seguridad:** antes de dar por bueno un límite de presión alta, pregúntate si permitiría una presión que no aceptarías en ese paciente. Elevar el límite no protege: solo silencia el aviso.

<!-- block: CALLOUT:warning | Lo que nunca debes hacer -->
No amplíes un límite para que una alarma "deje de molestar" sin haber identificado antes su causa. Una alarma de presión alta que suena una y otra vez está diciendo algo sobre el paciente o el tubo; abrir el límite convierte un aviso útil en un riesgo silencioso.
<!-- page: fatiga-de-alarmas | THEORY | Fatiga de alarmas -->
<!-- block: INTRODUCTION | Cuando hay demasiadas alarmas -->
La fatiga de alarmas es la sobrecarga sensorial que se produce cuando el personal está expuesto a un número excesivo de alarmas; el resultado es la desensibilización y, con ella, alarmas que no se atienden. Se han atribuido muertes de pacientes a este fenómeno (Sendelbach & Funk, 2013). No es un problema de falta de profesionalidad, sino una respuesta humana previsible ante estímulos que casi nunca anuncian algo importante.

<!-- block: THEORY | La magnitud del problema -->
Las cifras explican por qué ocurre:

- En una revisión sobre alarmas clínicas en general, entre el 72 % y el 99 % resultaron ser falsas (Sendelbach & Funk, 2013).
- En la ventilación mecánica, menos del 15 % de las alarmas estudiadas fueron clínicamente relevantes o requirieron una acción (Walsh & Waugh, 2020).
- En dos unidades de cuidados intensivos pediátricos, la tasa global fue de 22,5 alarmas del ventilador por día de ventilación por paciente, y las causas más frecuentes variaron según el modelo de equipo (Langga et al., 2021).

En 2013, The Joint Commission publicó una alerta de eventos centinela dedicada a la seguridad de las alarmas de los dispositivos médicos, y la gestión de alarmas pasó a ser una meta nacional de seguridad del paciente en 2014 (The Joint Commission, 2013; Sendelbach & Funk, 2013).

<!-- block: THEORY | Por qué se generan alarmas inútiles -->
Las alarmas no accionables tienen causas reconocibles, y casi todas se pueden prevenir:

- **Límites predeterminados** que no corresponden al paciente.
- **Límites no reajustados** después de cambiar el modo o los parámetros.
- **Problemas del circuito:** agua condensada que provoca oscilaciones y autodisparo, conexiones flojas, sensores sucios.
- **Procedimientos previsibles:** aspiración, cambios de postura, traslado, nebulización. Muchos equipos permiten silenciar las alarmas durante un tiempo breve antes de una maniobra planificada.
- **Duplicación:** varias alarmas que describen el mismo evento (presión baja, Vte bajo y VE baja ante una sola desconexión).

<!-- block: THEORY | Estrategias que reducen la carga sin perder seguridad -->
1. **Personaliza los límites** al inicio y después de cada cambio, como viste en la página anterior. Adaptar los parámetros al paciente es una de las estrategias que redujeron las falsas alarmas en proyectos de mejora (Sendelbach & Funk, 2013).
2. **Mantén el circuito:** drena el agua condensada, revisa las conexiones y respeta el mantenimiento de sensores y filtros.
3. **Silencia con intención:** usa la pausa de alarma solo durante la maniobra y comprueba que el sonido vuelve a quedar activo.
4. **Forma al equipo** en el significado de cada alarma y en la respuesta esperada; la formación también figura entre las estrategias eficaces (Sendelbach & Funk, 2013).
5. **Revisa los límites en cada cambio de turno** como parte de la verificación del ventilador.

<!-- block: CALLOUT:info | La evidencia es todavía limitada -->
La mayoría de las intervenciones contra la fatiga de alarmas proceden de proyectos de mejora de calidad, y sus autores reconocen que hacen falta ensayos rigurosos para demostrar que reducen la carga de alarmas sin comprometer la seguridad (Sendelbach & Funk, 2013). En ventilación mecánica, tampoco existe todavía una configuración estándar validada (Scott et al., 2019).
<!-- page: respuesta-escalonada | CASE_STUDY | Respuesta escalonada ante una alarma -->
<!-- block: INTRODUCTION | Primero el paciente, después la pantalla -->
Cuando suena una alarma, la pregunta inicial no es "¿qué alarma es?", sino "¿cómo está el paciente?". Si el paciente está estable, tienes tiempo para leer el monitor e identificar la causa. Si está inestable, la prioridad es asegurar la oxigenación y la ventilación mientras buscas el problema.

<!-- block: THEORY | El algoritmo -->
![Algoritmo: ante una alarma, mira al paciente; si está inestable, pide ayuda, desconéctalo, ventila con bolsa y oxígeno y revisa tubo, neumotórax y equipo; si está estable, identifica la alarma, recorre el circuito desde el paciente, corrige la causa, reajusta límites si procede y reevalúa](/learning/diagrams/b6-alarmas-respuesta-escalonada.svg "Figura: respuesta escalonada ante una alarma del ventilador")

1. **Mira al paciente:** color, movimiento del tórax, esfuerzo, saturación, frecuencia cardiaca y presión arterial.
2. **Si está inestable:** pide ayuda, desconecta al paciente del ventilador y ventílalo manualmente con bolsa autoinflable conectada a oxígeno. Así separas el problema del equipo del problema del paciente: si con la bolsa mejora, el fallo probablemente está en el ventilador o el circuito; si no mejora, está en el tubo o en el paciente. Revisa entonces el tubo (posición y permeabilidad), un posible neumotórax y el equipo; el módulo de seguridad del paciente ventilado desarrolla este repaso.
3. **Si está estable:** lee qué alarma sonó y sus valores, y recorre el circuito con la vista y con la mano **desde el paciente hacia el ventilador**: tubo y fijación, manguito, pieza en Y, tubuladuras, trampas de agua, filtros y conexiones.
4. **Corrige la causa** y comprueba que la alarma se resuelve.
5. **Reajusta los límites** si la situación del paciente cambió de forma legítima.
6. **Reevalúa** y deja constancia.

<!-- block: CALLOUT:info | El tubo es la causa más grave -->
Muchas emergencias de vía aérea en cuidados intensivos ocurren después de la intubación, por tubos desplazados u obstruidos (Higgs et al., 2018). La capnografía con curva es obligatoria para confirmar la intubación según esa guía; si dispones de ella, una curva de CO₂ que desaparece es un signo inmediato de desplazamiento, desconexión u obstrucción.

<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 67 años con neumonía, intubada, en PCV con presión inspiratoria de 18 cmH₂O sobre una PEEP de 8 cmH₂O, frecuencia 20/min, FiO₂ 0,50. Vte habitual de 430 mL y VE de 8,6 L/min. Límites: Vte bajo 300 mL, VE baja 6 L/min.

**Evento:** tras girarla para un cambio de ropa de cama suenan las alarmas de **Vte bajo** y **VE baja**. El monitor muestra Vti 440 mL y Vte 250 mL; en la curva de volumen, la rama espiratoria no regresa a cero y se corta al iniciar el siguiente ciclo. La presión inspiratoria se mantiene en el valor programado. SpO₂ 93 %, antes 95 %; tensión arterial y frecuencia cardiaca estables. Se oye un ruido de gas en la boca.

**Razonamiento paso a paso:**

1. **Paciente:** desaturación leve, hemodinamia estable, tórax que se mueve. Hay tiempo para buscar la causa, pero no para demorarse.
2. **Qué dicen los números:** entra un volumen normal y sale mucho menos. Fuga $= (440 - 250)/440 \times 100 \approx 43\,\%$. No es un problema de mecánica (en ese caso bajarían Vti y Vte por igual), sino de pérdida de gas.
3. **Por qué no sonó la presión baja:** en PCV el ventilador compensa parte de la fuga aportando más flujo para mantener la presión, de modo que el volumen espirado es la alarma que la revela.
4. **Recorrido del circuito desde la paciente:** el ruido de gas en la boca sugiere fuga alrededor del tubo. Revisas la marca del tubo en la comisura: está 3 cm más afuera que la registrada. El tubo se desplazó durante la movilización.
5. **Acción:** pides ayuda, compruebas la presión del manguito, reposicionas el tubo según el protocolo de tu unidad y confirmas su posición con capnografía y auscultación; después, una radiografía de control.
6. **Reevaluación:** el Vte vuelve a 425 mL, las alarmas se resuelven, la SpO₂ recupera 95 %. Registras el evento y refuerzas la fijación.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y prueba lo siguiente:

1. En PCV, reduce la compliance del paciente: observa cómo cae el volumen corriente con la misma presión y qué alarmas de volumen o de ventilación minuto aparecen en el monitor.
2. Cambia a VCV con un volumen fijo y repite el cambio de compliance: ahora es la presión la que sube y la alarma relevante pasa a ser la de presión alta.
3. Deja al paciente sin corregir la causa durante un tiempo y observa cómo evolucionan la SpO₂ y la PaCO₂: el simulador muestra el deterioro si el problema no se resuelve.

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** Un paciente en VCV hace sonar la alarma de presión alta en todos los ciclos, con pico de 45 cmH₂O y meseta de 20 cmH₂O. ¿Qué buscas primero?

*Respuesta:* la diferencia pico-meseta es muy grande y la meseta es aceptable: el problema es resistivo. Revisa si el tubo está acodado o mordido, aspira secreciones y valora broncoespasmo. Recuerda que cada ciclo interrumpido por el límite entrega menos volumen.

**2.** Suena la alarma de apnea en un paciente en PSV que estaba despertando. ¿Qué significa y qué haces?

*Respuesta:* el paciente no ha disparado ciclos durante el tiempo programado; puede deberse a sedación excesiva, a una caída del impulso respiratorio o a una sensibilidad del trigger mal ajustada. Valora al paciente, comprueba que el equipo inició la ventilación de respaldo y considera un modo con frecuencia mandatoria mientras identificas la causa.
<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Una alarma compara una variable medida con un límite; protege solo si el límite está ajustado al paciente y si alguien responde a ella.
- La alarma de presión alta suele interrumpir la inspiración: si se repite, el paciente recibe menos volumen del programado.
- En modos controlados por presión, el empeoramiento de la mecánica se manifiesta como Vte y VE bajos, no como presión alta.
- Una diferencia grande entre Vti y Vte indica fuga o desconexión parcial; recorre el circuito desde el paciente hacia el ventilador.
- No hay una configuración estándar de alarmas del ventilador (Scott et al., 2019): ancla los límites a los valores actuales del paciente y sigue el protocolo de tu unidad.
- La mayoría de las alarmas no son accionables, menos del 15 % en ventilación mecánica (Walsh & Waugh, 2020), y eso genera fatiga de alarmas.
- Ante una alarma, mira primero al paciente; si está inestable, desconéctalo y ventílalo manualmente con oxígeno mientras buscas la causa.
- Reajusta los límites tras cada cambio de parámetros y revísalos en cada turno.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Silenciar o ampliar el límite sin buscar la causa** → la alarma deja de sonar pero el problema sigue → identifica y corrige la causa antes de tocar el límite.
- **Mirar la pantalla antes que al paciente** → retrasa la respuesta en una situación inestable → evalúa primero color, tórax, saturación y hemodinamia.
- **Dejar los límites predeterminados** → no corresponden al paciente y generan falsas alarmas o no detectan eventos reales → personalízalos al inicio y tras cada cambio (Walsh & Waugh, 2020).
- **Confiar en la alarma de presión en PCV o PSV** → la presión está controlada y no cambia aunque empeore la mecánica → vigila el Vte y la VE con límites ajustados.
- **Dejar la pausa de alarma activa tras una maniobra** → el paciente queda sin protección → comprueba que el sonido se reactiva.
- **Buscar la fuga desde el ventilador hacia el paciente** → el punto más grave (el tubo) se revisa al final → recorre el circuito desde el paciente.

<!-- block: REFERENCES | Referencias -->
- Higgs, A., McGrath, B. A., Goddard, C., Rangasami, J., Suntharalingam, G., Gale, R., Cook, T. M., Difficult Airway Society, Intensive Care Society, Faculty of Intensive Care Medicine, & Royal College of Anaesthetists. (2018). Guidelines for the management of tracheal intubation in critically ill adults. *British Journal of Anaesthesia, 120*(2), 323-352. [https://doi.org/10.1016/j.bja.2017.10.021](https://doi.org/10.1016/j.bja.2017.10.021)
- Langga, L., Oh, J., López, D., Blake, N., McField, E., Hotz, J., Nava-Guerra, L., Knox, K., & Chinnock, R. (2021). Prevalence, proportionality, and cause of ventilator alarms in a pediatric intensive care setting. *Respiratory Care, 66*(4), 541-550. [https://doi.org/10.4187/respcare.07200](https://doi.org/10.4187/respcare.07200)
- Scott, J. B., De Vaux, L., Dills, C., & Strickland, S. L. (2019). Mechanical ventilation alarms and alarm fatigue. *Respiratory Care, 64*(10), 1308-1313. [https://doi.org/10.4187/respcare.06878](https://doi.org/10.4187/respcare.06878)
- Sendelbach, S., & Funk, M. (2013). Alarm fatigue: A patient safety concern. *AACN Advanced Critical Care, 24*(4), 378-386. [https://doi.org/10.4037/NCI.0b013e3182a903f9](https://doi.org/10.4037/NCI.0b013e3182a903f9)
- The Joint Commission. (2013, 8 de abril). *Medical device alarm safety in hospitals* (Sentinel Event Alert, Issue 50). [https://www.jointcommission.org/sea_issue_50](https://www.jointcommission.org/sea_issue_50)
- Walsh, B. K., & Waugh, J. B. (2020). Alarm strategies and surveillance for mechanical ventilation. *Respiratory Care, 65*(6), 820-831. [https://doi.org/10.4187/respcare.07546](https://doi.org/10.4187/respcare.07546)
