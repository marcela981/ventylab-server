<!-- page: mis-sesiones | THEORY | Mis sesiones: tu historial de práctica -->
<!-- block: INTRODUCTION | La práctica que no se revisa se olvida -->
Terminar una simulación es solo la mitad del trabajo. La otra mitad es mirar qué hiciste, en qué orden y con qué efecto. En la educación con simulación, la discusión posterior a la práctica (el *debriefing*) se considera uno de los componentes que más aportan al aprendizaje, porque convierte una experiencia en una reflexión explícita (Fanning y Gaba, 2007). La práctica deliberada, es decir, repetir una tarea bien definida con retroalimentación y corrección, produce mejores resultados que la formación clínica tradicional en la adquisición de habilidades (McGaghie et al., 2011). VentyLab guarda cada sesión para que puedas hacer ambas cosas.

<!-- block: THEORY | La pestaña Mis sesiones -->
La cuarta pestaña del **Simulador Virtual** es **Mis sesiones**. Reúne en una sola lista, de la más reciente a la más antigua, dos tipos de registro:

- Las sesiones **Simulada** del simulador digital, con el título del caso (o «Paciente propio» si llenaste el formulario a mano), la fecha, el estado y, cuando la sesión terminó, «Puntaje: …» y «Duración: …».
- Las grabaciones **Equipo real** del ventilador físico, con el título «Ventilador físico».

El selector **Tipo de sesión** filtra entre **Todas**, **Simuladas** y **Equipo real**. La lista muestra periodos de 31 días; con **31 días anteriores** y **31 días siguientes** te mueves en el tiempo. Si no hay nada en el periodo, la pantalla te sugiere iniciar una práctica desde **Simular Paciente** o revisar el periodo anterior.

Cada fila ofrece la acción que corresponde a su estado:

| Estado de la fila | Acción | Qué hace |
|---|---|---|
| Sesión simulada **En curso** | **Continuar** | Retoma la sesión donde quedó |
| Sesión simulada **Finalizada** | **Ver resultado** | Abre el resultado oficial del servidor |
| Sesión simulada **Finalizada** | **Ver repetición** | Reproduce la sesión en solo lectura |
| Grabación del equipo real | **Reproducir** | Reproduce la telemetría grabada |

El resultado y la repetición se abren dentro de la misma pestaña, con **Volver a la lista** para regresar.

![Ciclo de una sesión: iniciar desde Simular Paciente, practicar en Monitoreo, finalizar, el servidor repite los eventos y calcula el puntaje, ver el resultado y revisar en Mis sesiones; la Asesoría IA es opcional durante la práctica](/learning/diagrams/v4-sesiones-ciclo-sesion.svg "Figura: ciclo de una sesión de simulación")

<!-- block: THEORY | Por qué cada cambio queda registrado -->
El motor fisiológico es determinista: con el mismo caso, la misma semilla y los mismos eventos, produce exactamente la misma evolución. Por eso VentyLab no necesita grabar las curvas de tu sesión digital; le basta con registrar **eventos**, como cada cambio de parámetros, cada solicitud de asesoría o cada alarma reconocida, con el momento simulado en que ocurrió. Con esa lista, el servidor puede reconstruir tu sesión completa.

Esta decisión de diseño explica tres comportamientos que verás en la consola:

- Si pierdes la conexión, la sesión sigue en tu navegador y aparece «n eventos pendientes de envío» con la advertencia de revisar tu conexión: los cambios se guardan y se envían al recuperarla.
- Si abres la misma sesión en otra pestaña, una de ellas queda en solo lectura con el aviso «Esta sesión ya está abierta en otra pestaña», para que no haya dos fuentes de eventos.
- Si el servidor rechaza un cambio, aparece el diálogo «La sesión local y la del servidor divergieron», que solo ofrece **Recargar sesión**: lo que ves dejó de coincidir con lo que se evaluará, y la sesión se reconstruye desde lo guardado.

<!-- block: CALLOUT:info | Una sesión en curso no se pierde -->
Si cierras el navegador a mitad de una práctica, la sesión queda «En curso». Vuelve a **Mis sesiones** y pulsa **Continuar**.

<!-- page: resultado-y-repeticion | THEORY | Resultado de la sesión y repetición -->
<!-- block: THEORY | Finalizar la sesión -->
Cuando consideres que terminaste, pulsa **Finalizar sesión**. El diálogo **¿Finalizar la sesión?** explica la consecuencia: se detiene la simulación, se envían tus cambios y el servidor calcula el resultado; no podrás continuar esa sesión. Si dudas, elige **Seguir simulando**. Al confirmar con **Finalizar**, el **Resultado de la sesión** se abre en un diálogo sin salir del simulador, con los botones **Ver repetición** y **Cerrar**.

<!-- block: THEORY | Qué muestra el resultado -->
El resultado tiene dos capas, y conviene distinguirlas.

**Resultado del servidor.** Es el oficial: «lo calcula el servidor a partir de los eventos registrados». Muestra el **Puntaje calculado por el servidor**, el **Estado**, el **Tiempo simulado evaluado** y la **Duración**. Debajo están:

- **Objetivos clínicos al final**: cada objetivo con su **Meta**, su **Valor final** y si quedó **Cumplido** o **No cumplido**.
- **Tiempo hasta estabilizar**: cuánto tardaste en alcanzar y mantener todos los objetivos (o el aviso de que no se lograron).
- **Violaciones de seguridad**: el tiempo que pasaste fuera de los límites de seguridad del caso.
- **Solicitudes de asesoría IA**.
- **Desglose de la rúbrica (servidor)**: cada **Criterio** con su **Peso**, su **Valor**, sus **Puntos** y la **Justificación del servidor**. Los criterios posibles son objetivos alcanzados, tiempo hasta estabilizar, tiempo en rango, violaciones de seguridad (límites de presión meseta, presión de distensión, volumen corriente y auto-PEEP) y uso de la asesoría IA.

**Evolución de la sesión.** Son gráficas de SpO₂, PaCO₂, presión meseta y volumen corriente por kilo de peso predicho, reconstruidas en tu navegador repitiendo la sesión con el motor. Son informativas; si no coinciden del todo con el servidor, la pantalla lo advierte y el resultado oficial sigue siendo el del servidor.

Con el modelo de evolución que se está incorporando, el resultado añadirá el desenlace del paciente (por ejemplo, **Paciente fallecido**) y una línea de tiempo con tus cambios de parámetros, las alarmas al aparecer y los cambios de estado del paciente. Esa línea de tiempo es la base natural de tu debriefing.

<!-- block: THEORY | La repetición -->
**Ver repetición** abre la sesión en la consola con la marca **Solo lectura**. Los **Controles de la repetición** permiten **Reproducir**, **Pausar**, **Repetir desde el inicio**, cambiar la **Velocidad de reproducción** (×1, ×2, ×4 u ×8; es local y no cambia la sesión) y mover la **Posición de la repetición**. La lista **Eventos de la sesión** te lleva directamente a cada cambio de parámetros, solicitud de asesoría, alarma o evento del caso.

Usa la repetición para responder preguntas concretas: ¿qué vi en las curvas justo antes de mi cambio?, ¿cuánto tardó la SpO₂ en responder?, ¿qué pasó en el momento del evento del caso? Ver otra vez la misma situación con la respuesta ya conocida es una forma eficaz de fijar el patrón.

<!-- block: CALLOUT:warning | La nota de la sesión no es la de una evaluación -->
El puntaje de una práctica libre te orienta. Las calificaciones de los quizzes, talleres y exámenes del módulo **Evaluación** siguen sus propias reglas de publicación, y el docente decide cuándo se liberan.

<!-- page: asesoria-ia | THEORY | Retroalimentación con IA y sus límites -->
<!-- block: THEORY | La Asesoría IA durante la práctica -->
En la barra de la sesión está el botón **Asesoría IA**. Abre un panel lateral que explica su alcance: «La asesoría revisa el estado actual de tu simulación. Puedes escribir una pregunta concreta o dejarla vacía. La simulación sigue corriendo mientras respondo.». Escribe tu pregunta en **Pregunta (opcional)** (hasta 1000 caracteres) y pulsa **Solicitar asesoría**. La respuesta aparece mientras se genera; si no la necesitas, **Detener** la corta y esa asesoría no se registra. Las respuestas terminadas quedan en **Asesorías de esta sesión**.

Cada respuesta lleva el control **¿Te fue útil?**, con un pulgar arriba («Sí, fue útil»), un pulgar abajo («No fue útil») y un **Comentario (opcional)**. Tu valoración no cambia tu puntaje: sirve para que el equipo mida la calidad de la IA y la mejore.

Debes conocer cuatro reglas:

1. **La simulación no se pausa** mientras la IA responde: el paciente sigue evolucionando.
2. **Cada asesoría queda registrada** como evento de la sesión y aparece en el resultado. En un examen, la política la fija el docente: puede estar desactivada («La asesoría de IA está desactivada en este examen.») o permitida con penalización, y entonces la plataforma te pide confirmar antes de cada solicitud.
3. **Hay un límite de uso.** Si lo alcanzas, verás «Alcanzaste el límite de uso de la IA.».
4. **Si no hay IA disponible**, la plataforma puede entregar una respuesta automática basada en reglas, marcada como tal («Respuesta automática (IA no disponible)»).

<!-- block: THEORY | Novedades en incorporación -->
El equipo está incorporando tres funciones más. La **interpretación del caso**: al iniciar una práctica libre, la IA puede proponer ajustes a los parámetros del motor a partir de la historia clínica, siempre validados contra rangos fisiológicos y limitados a una variación pequeña respecto de los valores curados; el cajón del caso indicará si se usaron «Parámetros interpretados por IA» o los «Parámetros del caso». Las **alarmas clicables**: cada alarma abrirá el panel **¿Cómo estabilizar?** con sugerencias deterministas por tipo de alarma y, si hay proveedor, una sugerencia de IA; sin IA se marcará «Sugerencia automática (IA no disponible)». Y un **coaching** que tendrá en cuenta las tendencias de los últimos minutos. En todos los casos, la IA nunca dibuja curvas ni cambia parámetros: solo sugiere, y tú decides.

<!-- block: THEORY | Usar la IA con criterio -->
Los modelos de lenguaje pueden producir afirmaciones falsas con apariencia convincente, y quien los usa tiende a confiar de más en una respuesta automática (sesgo de automatización); la Organización Mundial de la Salud señala ambos riesgos en su guía sobre modelos multimodales grandes (World Health Organization, 2024). En educación de profesionales de la salud se recomienda transparencia sobre cuándo interviene la IA, supervisión humana y desarrollo del juicio propio antes que la dependencia de la herramienta (Masters, 2023).

Traducido a tu práctica: formula primero tu hipótesis, después consulta. Contrasta cada sugerencia con lo que ves en las curvas y con los objetivos del caso. Si la sugerencia contradice la fisiología o una guía, tu deber es descartarla y, si quieres, explicarlo en el comentario de la valoración.

<!-- page: recorrido-debriefing | CASE_STUDY | Recorrido: revisar una sesión -->
<!-- block: CASE_STUDY | Ejemplo: debriefing de una práctica con EPOC -->
Imagina que practicaste el caso **Exacerbación de EPOC con hiperinflación dinámica** y obtuviste un puntaje bajo. Vas a revisarlo en orden.

**Paso 1. Encontrar la sesión.** En **Mis sesiones**, filtra **Simuladas** y ubica la fila del caso con estado **Finalizada**.

**Paso 2. Leer el resultado de arriba abajo.** Pulsa **Ver resultado**. En **Objetivos clínicos al final** ves que la auto-PEEP quedó **No cumplido**. En **Violaciones de seguridad** aparecen segundos fuera de los límites. En el **Desglose de la rúbrica (servidor)**, el criterio de límite de auto-PEEP restó puntos y la **Justificación del servidor** lo explica.

**Paso 3. Formular una hipótesis.** Antes de abrir la repetición, escribe en una frase qué crees que pasó; por ejemplo: «subí la frecuencia para bajar la PaCO₂ y acorté el tiempo espiratorio».

**Paso 4. Verificar en la repetición.** Pulsa **Ver repetición** y, en **Eventos de la sesión**, salta a tu cambio de frecuencia. Reproduce a ×2 y mira la curva de flujo: el flujo espiratorio no vuelve a cero antes de la siguiente inspiración. Tu hipótesis se confirma.

**Paso 5. Planear la siguiente práctica.** Define un solo cambio de estrategia (por ejemplo, alargar el tiempo espiratorio) y vuelve a **Simular Paciente** con el mismo caso. Comparar dos sesiones del mismo caso con una sola variable distinta es práctica deliberada en su forma más simple (McGaghie et al., 2011).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation); si el formulario no aparece lleno, usa **Cargar caso** y elígelo. Prueba esto:

1. Sube la frecuencia respiratoria y observa que el flujo espiratorio no llega a cero: aparece auto-PEEP.
2. Finaliza la sesión y revisa en el resultado qué criterio de la rúbrica cambió.
3. Repite el caso alargando el tiempo espiratorio y compara las dos filas en **Mis sesiones**.

<!-- block: EXERCISE | Preguntas -->
1. **La gráfica de evolución y el puntaje del servidor no coinciden del todo. ¿Cuál vale?** Respuesta: el del servidor. La evolución se reconstruye en tu navegador y es informativa; la pantalla advierte la diferencia.
2. **Pediste una asesoría y la cortaste con Detener porque ya sabías la respuesta. ¿Cuenta en el resultado?** Respuesta: no; una respuesta detenida no se registra como asesoría.
3. **La IA te sugiere subir el volumen corriente a 10 mL/kg de peso predicho en un caso de SDRA para bajar la PaCO₂. ¿Qué haces?** Respuesta: no la aplicas: contradice la ventilación protectora. Buscas otra opción (frecuencia, espacio muerto) y lo comentas en **¿Te fue útil?**.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- **Mis sesiones** reúne las sesiones simuladas y las grabaciones del equipo real, filtrables por **Tipo de sesión** y en periodos de 31 días.
- Cada cambio queda registrado como evento; con ellos el servidor reconstruye la sesión y calcula el resultado oficial.
- **Finalizar sesión** es definitivo; una sesión «En curso» se retoma con **Continuar**.
- El **Resultado de la sesión** muestra objetivos, tiempo hasta estabilizar, violaciones de seguridad, asesorías y el desglose de la rúbrica.
- La **repetición** es de solo lectura y permite saltar a cada evento; es la herramienta del debriefing (Fanning y Gaba, 2007).
- La **Asesoría IA** no pausa la simulación, queda registrada y puede estar restringida en exámenes.
- La IA solo sugiere: contrasta cada respuesta con la fisiología y con los objetivos del caso (Masters, 2023).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Revisar solo el puntaje** → no sabes qué corregir → lee el desglose de la rúbrica y salta al evento en la repetición.
- **Pedir asesoría antes de pensar** → la IA sustituye tu razonamiento → formula tu hipótesis y luego consulta.
- **Creer que la simulación espera a la IA** → el paciente sigue evolucionando → vigila el monitor mientras llega la respuesta.
- **Abrir la misma sesión en dos pestañas** → una queda en solo lectura → trabaja en una sola pestaña.
- **Aplicar una sugerencia de IA sin verificarla** → puede ser incorrecta → compárala con las curvas, los objetivos y las guías (World Health Organization, 2024).
- **Repetir el caso cambiando todo a la vez** → no sabes qué funcionó → cambia una variable por práctica.

<!-- block: REFERENCES | Referencias -->
- Fanning, R. M., & Gaba, D. M. (2007). The role of debriefing in simulation-based learning. *Simulation in Healthcare, 2*(2), 115–125. [https://doi.org/10.1097/SIH.0b013e3180315539](https://doi.org/10.1097/SIH.0b013e3180315539)
- Masters, K. (2023). Ethical use of artificial intelligence in health professions education: AMEE Guide No. 158. *Medical Teacher, 45*(6), 574–584. [https://doi.org/10.1080/0142159X.2023.2186203](https://doi.org/10.1080/0142159X.2023.2186203)
- McGaghie, W. C., Issenberg, S. B., Cohen, E. R., Barsuk, J. H., & Wayne, D. B. (2011). Does simulation-based medical education with deliberate practice yield better results than traditional clinical education? A meta-analytic comparative review of the evidence. *Academic Medicine, 86*(6), 706–711. [https://doi.org/10.1097/ACM.0b013e318217e119](https://doi.org/10.1097/ACM.0b013e318217e119)
- VentyLab. (2026). *Manual de uso* [documentación interna].
- World Health Organization. (2024). *Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models*. [https://www.who.int/publications/i/item/9789240084759](https://www.who.int/publications/i/item/9789240084759)
