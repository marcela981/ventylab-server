<!-- page: caso-catalogo-y-paciente-propio | THEORY | Caso del catálogo y paciente propio -->
<!-- block: INTRODUCTION | Por qué practicar con casos -->
Un ventilador no se aprende moviendo perillas al azar. Lo que convierte la práctica en aprendizaje es un problema clínico concreto: un paciente con una mecánica determinada, unos gases de partida, una meta que alcanzar y un tiempo que corre. Por eso el simulador digital de VentyLab se organiza alrededor de **casos clínicos**. Cada caso le dice al motor fisiológico cómo es el pulmón (distensibilidad, resistencia, espacio muerto, cortocircuito), cómo empieza el ventilador y qué se espera de ti al final.

La literatura sobre educación con simulación respalda este enfoque: la simulación resulta más útil cuando se integra en un currículo, ofrece niveles de dificultad crecientes, permite repetir la práctica y entrega retroalimentación (Issenberg et al., 2005). Una revisión sistemática con metaanálisis encontró además que la simulación apoyada en tecnología se asocia con mejores resultados de conocimiento, habilidades y conductas que no recibir ninguna intervención (Cook et al., 2011). Los casos del catálogo son la forma en que VentyLab aplica esos principios.

<!-- block: THEORY | Dos maneras de definir al paciente -->
En la pestaña **Simular Paciente** del menú **Simulador Virtual** encuentras el bloque **Configuración del Paciente** y, dentro de él, el **Módulo de Pacientes Simulados**. Allí tienes tres caminos:

- **Cargar caso**: eliges un caso clínico publicado por el equipo docente. Sus datos llenan el formulario y la sesión usa ese caso como base, con su mecánica, sus objetivos y sus eventos programados. Debajo de los botones aparece la línea «Caso base: …» para que sepas sobre qué estás trabajando.
- **Aleatorio**: la plataforma llena todo el formulario con un adulto plausible y muestra el aviso «Datos simulados aleatorios cargados.». Sirve para practicar la lectura del monitor sin un guion previo.
- **Llenar a mano** (paciente propio): escribes tú los datos. Es útil para reproducir un paciente que viste en tu servicio, siempre con datos inventados o anonimizados.

En los tres casos el formulario tiene dos pasos. El primero, **Paciente y Condición**, pide los **Datos del Paciente** (nombre opcional, edad, sexo, peso actual y estatura) y la **Condición Clínica** (condición principal, dificultad, diagnóstico o resumen clínico, alergias y antecedentes relevantes). Mientras escribes, la plataforma calcula el **Peso Corp. Ideal (PCI)** con la fórmula de ARDSNet, el **IMC** y un **VT predicho**. El segundo paso, **Estado Actual y Resumen**, recoge los signos vitales (frecuencia cardíaca y respiratoria, SpO₂, temperatura, tensión arterial, Glasgow y patrón respiratorio) y resume los **Parámetros Ventilatorios Sugeridos**.

El campo **Dificultad** lleva la ayuda «Solo una etiqueta: no cambia la simulación». Lo que define la fisiología es el caso base y la condición principal; la dificultad solo te ayuda a ordenar tus prácticas.

![Esquema de la pestaña Simular Paciente: tres maneras de llenar el formulario (Cargar caso, Aleatorio o a mano), el formulario de dos pasos y el botón Enviar al Monitoreo que abre la práctica en la pestaña Monitoreo](/learning/diagrams/v4-casos-flujo-cargar-caso.svg "Figura: del caso del catálogo a la práctica en Monitoreo")

<!-- block: THEORY | Cargar un caso del catálogo -->
Al pulsar **Cargar caso** se abre el diálogo **Cargar caso clínico**. Arriba tienes los filtros **Patología** y **Dificultad** (la opción «Todas» quita el filtro y **Limpiar filtros** vuelve al inicio). Cada caso de la lista muestra su título, su patología y su nivel (Básico, Intermedio o Avanzado). Con el botón **Cargar** del caso elegido, el diálogo se cierra, el formulario se llena y aparece el aviso «Historia clínica "…" cargada.». Si la lista tiene varias páginas, usa **Anterior** y **Siguiente**.

Revisa los dos pasos del formulario antes de enviar: puedes corregir un dato, pero recuerda que el caso base sigue siendo el mismo. Cuando todo esté completo, pulsa **Enviar al Monitoreo**. La plataforma valida ambos pasos (si falta algo te devuelve al paso con el error), inicia una sesión de **Práctica libre** y abre la pestaña **Monitoreo** con el paciente conectado. Si no cargaste un caso, el servidor elige el caso base que corresponde a la condición principal que marcaste.

<!-- block: CALLOUT:info | Qué cambia el formulario y qué no -->
El caso base fija la mecánica respiratoria y los objetivos de la práctica. Los datos que escribes describen al paciente y alimentan los cálculos de peso predicho e IMC que ves en pantalla. Si quieres un pulmón distinto, elige otro caso; no esperes que cambiar el nombre o la temperatura transforme la mecánica.

<!-- page: objetivos-y-evolucion | THEORY | Objetivos del caso y evolución del paciente -->
<!-- block: INTRODUCTION | Saber hacia dónde vas -->
Un caso sin metas es solo una demostración. En VentyLab cada caso del catálogo trae **objetivos clínicos** medibles (por ejemplo, un rango de SpO₂, un pH mínimo o una presión meseta máxima) y un **objetivo educativo** que explica qué decisión se quiere entrenar. Conocerlos antes de tocar el ventilador cambia tu forma de mirar el monitor: ya no buscas «que se vea bien», sino que cada variable entre en su rango y se mantenga allí.

<!-- block: THEORY | El cajón «Caso clínico» -->
Durante la sesión, la barra de la consola tiene el botón **Mostrar caso clínico** (y **Ocultar caso clínico** para cerrarlo). Abre un panel lateral con:

- **Historia clínica**: el relato del caso, con la enfermedad actual y los antecedentes.
- **Objetivo educativo**: la intención docente del caso.
- **Comorbilidades**.
- **Paciente**: sexo, talla, edad, peso real y **Peso predicho (PBW)**.
- **Objetivos**, marcados «en tiempo real». Cada objetivo aparece como **Cumplido**, **No cumplido** o **Sin datos aún**.

La nota del panel lo deja claro: «Lectura local mientras simulas; no es una calificación. La nota oficial la calcula el servidor al finalizar.». El estado en vivo sirve para orientarte; el resultado oficial se calcula después, repitiendo tu sesión en el servidor con los mismos eventos (lo verás en la lección «Sesiones, repetición y retroalimentación con IA»).

<!-- block: THEORY | El tiempo simulado y los eventos del caso -->
El reloj de la sesión es **Tiempo simulado**: avanza con el motor, no con tu reloj de pared. En práctica libre puedes **Pausar** y **Reanudar**, y elegir la velocidad entre ×1, ×2 y ×4, con un límite: «La velocidad máxima se eligió al iniciar la práctica en el catálogo; aquí solo puedes bajarla.». En un examen la velocidad es fija y no hay pausa.

Algunos casos traen **eventos programados**. Por ejemplo, el caso de SDRA con obesidad incluye un desreclutamiento a los 10 minutos simulados, como el que ocurre después de una aspiración abierta: la distensibilidad cae y el cortocircuito aumenta. El evento no es un error tuyo; es parte del problema y pone a prueba si vuelves a revisar la mecánica cuando el paciente cambia.

<!-- block: THEORY | Un paciente que mejora o empeora -->
El equipo de desarrollo está incorporando un **modelo de evolución** al motor. Con él, el paciente deja de ser una fotografía y responde en el tiempo a la calidad de tu ventilación:

- Si los ajustes son adecuados y no hay agresiones activas, la gravedad baja poco a poco y verás mejorar la SpO₂, los gases y la presión arterial.
- Si hay una **agresión** (hipoxemia, acidosis, presión meseta o presión de distensión altas, atrapamiento aéreo o hipotensión), la gravedad sube mientras dure.
- Si el paciente arranca inestable y no actúas, el deterioro progresa a la velocidad que define el caso: estado crítico, paro y, por último, **Paciente fallecido**. La sesión se cierra sola y se abre un debriefing con la línea de tiempo de tus decisiones.

Dos reglas de diseño protegen la experiencia de aprendizaje: un caso que empieza **estable** nunca llega a crítico solo porque esperes, y el paro es irreversible (el simulador no incluye reanimación). Las tasas y tiempos de este modelo son convenciones de simulación educativa; no pretenden predecir la evolución real de ninguna persona.

![Cadena de estados del paciente simulado: Estable, Inestable, Crítico, Paro y Paciente fallecido, con flechas de regreso cuando se corrige la causa o se rescata antes del paro](/learning/diagrams/v4-casos-estados-paciente.svg "Figura: estados del paciente en el modelo de evolución")

<!-- block: CALLOUT:warning | El simulador no es un pronóstico -->
El motor reproduce relaciones fisiológicas conocidas (ecuación del movimiento, intercambio gaseoso, efecto de la presión intratorácica sobre la presión arterial), pero los tiempos hasta el deterioro son parámetros docentes. Usa el simulador para entrenar el razonamiento, no para estimar cuánto tolera un paciente real una hipoxemia.

<!-- page: recorrido-caso-sdra-obesidad | CASE_STUDY | Recorrido: cargar y resolver un caso -->
<!-- block: CASE_STUDY | Ejemplo clínico: SDRA moderado en una paciente con obesidad -->
Vas a recorrer un caso real del catálogo, **SDRA moderado en paciente con obesidad**. Los datos son ficticios y forman parte del caso publicado.

**Paso 1. Cargar el caso.** En **Simular Paciente**, pulsa **Cargar caso**. En **Patología** elige «SDRA» y en **Dificultad**, «Avanzado». Pulsa **Cargar** junto al caso. El formulario muestra una mujer de 52 años, 120 kg de peso real y 160 cm de estatura, con neumonía adquirida en la comunidad, obesidad grado III e hipertensión arterial.

**Paso 2. Leer el resumen antes de enviar.** En **Estado Actual y Resumen**, mira el **Peso Corporal Ideal (PCI)**. La fórmula de ARDSNet para mujeres es (Acute Respiratory Distress Syndrome Network, 2000):

$$
PBW_{mujer} = 45{,}5 + 0{,}91\,(\text{talla en cm} - 152{,}4)
$$

Con 160 cm: $45{,}5 + 0{,}91 \times 7{,}6 = 52{,}4\,\text{kg}$. El peso real (120 kg) es más del doble, y aquí está la trampa del caso.

**Paso 3. Enviar al Monitoreo y leer el punto de partida.** Pulsa **Enviar al Monitoreo**. El caso arranca en VCV con un volumen corriente de 500 mL, FR 18/min, PEEP 5 cmH₂O y FiO₂ 0,6. Abre **Mostrar caso clínico** y lee los objetivos. Calcula el volumen por kilo de peso predicho:

$$
\frac{500\,\text{mL}}{52{,}4\,\text{kg}} \approx 9{,}5\,\text{mL/kg}
$$

El ensayo de ARDSNet usó 6 mL/kg de peso predicho, con un margen de 4 a 8 mL/kg, y una presión meseta de hasta 30 cmH₂O (Acute Respiratory Distress Syndrome Network, 2000). El caso está programado con ese error clásico: volumen calculado con el peso real.

**Paso 4. Corregir y observar.** Baja el volumen hacia unos 310–320 mL (6 mL/kg) y ajusta la frecuencia para cuidar la ventilación minuto. Observa que la presión meseta y la presión de distensión bajan. El análisis de Amato et al. (2015) mostró que la presión de distensión se asocia con la supervivencia en el SDRA, y el caso fija como objetivo no superar 15 cmH₂O. Después revisa la oxigenación: el objetivo de SpO₂ del caso es 88–95 %, el mismo intervalo que usó ARDSNet (Acute Respiratory Distress Syndrome Network, 2000).

**Paso 5. Esperar el evento.** A los 10 minutos simulados el pulmón se desrecluta. Vuelve a mirar la SpO₂, la meseta y el cajón de objetivos: lo que estaba **Cumplido** puede pasar a **No cumplido**.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese); si el formulario no aparece lleno, usa **Cargar caso** y elígelo en la lista. Prueba esto:

1. Antes de cambiar nada, anota la presión meseta con el volumen inicial: es alta para el tamaño de ese pulmón.
2. Lleva el volumen a unos 6 mL/kg de peso predicho: la meseta y la presión de distensión bajan y el objetivo de volumen por kilo pasa a **Cumplido**.
3. Sube la PEEP en pasos y observa la SpO₂ y la presión arterial media: la oxigenación mejora, pero la presión media de la vía aérea sube y la presión arterial puede bajar.
4. Deja correr el tiempo hasta el desreclutamiento y comprueba si tus ajustes siguen cumpliendo los objetivos.

<!-- block: EXERCISE | Preguntas -->
1. **¿Por qué el caso arranca con 500 mL si el objetivo es proteger el pulmón?** Respuesta: porque entrena un error frecuente, calcular el volumen con el peso real. Con 52,4 kg de peso predicho, 500 mL equivalen a unos 9,5 mL/kg, por encima del margen de 4–8 mL/kg (Acute Respiratory Distress Syndrome Network, 2000).
2. **Cambias el campo Dificultad de «Avanzado» a «Básico» antes de enviar. ¿El caso será más fácil?** Respuesta: no. La ayuda del campo dice «Solo una etiqueta: no cambia la simulación». La mecánica la define el caso base.
3. **En el cajón ves «Cumplido» en todos los objetivos a los 8 minutos. ¿Ya tienes la nota?** Respuesta: no. El estado en vivo es una lectura local; la nota oficial la calcula el servidor al finalizar y, además, a los 10 minutos ocurre un evento que puede cambiar la situación.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Los casos clínicos dan a la práctica un problema, unas metas y un tiempo; esa estructura es la que convierte la simulación en aprendizaje (Issenberg et al., 2005).
- En **Simular Paciente** puedes **Cargar caso**, generar uno **Aleatorio** o llenar el formulario a mano; **Enviar al Monitoreo** inicia una práctica libre.
- El caso base define la mecánica y los objetivos; el campo **Dificultad** es solo una etiqueta.
- El cajón **Caso clínico** muestra la historia, el objetivo educativo, el peso predicho y los **Objetivos** en tiempo real, que no son la nota.
- El **Tiempo simulado** puede ir más rápido que el real; algunos casos traen eventos programados que cambian la mecánica.
- Con el modelo de evolución, el paciente mejora con ajustes adecuados y se deteriora con agresiones activas; un caso estable no empeora solo por esperar.
- Calcula siempre el volumen corriente por peso predicho, no por peso real (Acute Respiratory Distress Syndrome Network, 2000).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Enviar al Monitoreo sin leer el caso** → empiezas a ajustar sin saber qué se evalúa → abre **Mostrar caso clínico** y lee los objetivos antes del primer cambio.
- **Tomar «Cumplido» como nota final** → el estado en vivo es local y puede cambiar con un evento → espera el **Resultado de la sesión** que calcula el servidor.
- **Cambiar la dificultad para «facilitar» el caso** → no altera la fisiología → elige otro caso si quieres otro nivel.
- **Usar el peso real para el volumen corriente** → sobredistiendes un pulmón pequeño → usa el **Peso Corp. Ideal (PCI)** que calcula el formulario.
- **Escribir datos reales de un paciente en el paciente propio** → expones información sensible → usa datos inventados o anonimizados.
- **Interpretar el tiempo al paro como dato clínico** → es una convención docente → usa el deterioro para entrenar la prioridad de tus decisiones, no como pronóstico.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network, Brower, R. G., Matthay, M. A., Morris, A., Schoenfeld, D., Thompson, B. T., & Wheeler, A. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747–755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Cook, D. A., Hatala, R., Brydges, R., Zendejas, B., Szostek, J. H., Wang, A. T., Erwin, P. J., & Hamstra, S. J. (2011). Technology-enhanced simulation for health professions education: A systematic review and meta-analysis. *JAMA, 306*(9), 978–988. [https://doi.org/10.1001/jama.2011.1234](https://doi.org/10.1001/jama.2011.1234)
- Issenberg, S. B., McGaghie, W. C., Petrusa, E. R., Gordon, D. L., & Scalese, R. J. (2005). Features and uses of high-fidelity medical simulations that lead to effective learning: A BEME systematic review. *Medical Teacher, 27*(1), 10–28. [https://doi.org/10.1080/01421590500046924](https://doi.org/10.1080/01421590500046924)
- VentyLab. (2026). *Manual de uso* [documentación interna].
