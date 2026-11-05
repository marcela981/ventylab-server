<!-- page: la-consola-y-sus-zonas | THEORY | La consola del simulador y la elección del modo -->
<!-- block: INTRODUCTION | Programar como frente a un ventilador real -->
Programar un ventilador es traducir una decisión clínica (cuánto volumen, a qué presión, con qué frecuencia y cuánto oxígeno) en valores concretos de una máquina. Un error de transcripción, como confundir la presión inspiratoria sobre PEEP con la presión pico total, puede duplicar la presión que recibe el pulmón. La consola de VentyLab imita la distribución de un ventilador de cabecera para que practiques ese gesto con las mismas etiquetas y el mismo orden mental que usarás en la unidad, pero en un entorno donde equivocarse no tiene consecuencias para nadie (Gaba, 2004).

<!-- block: THEORY | Cómo llegas a la consola -->
En **Simulador Virtual** la pantalla tiene cuatro pestañas en la parte inferior: **Simular Paciente**, **Monitoreo**, **Conexión** y **Mis sesiones**. Para programar el simulador digital:

1. En **Simular Paciente** («Configuración del Paciente») eliges un paciente: **«Cargar caso»** abre los casos publicados con filtros de patología y dificultad, y **«Aleatorio»** genera un paciente plausible. El formulario tiene dos pasos, **«Paciente y Condición»** y **«Estado Actual y Resumen»**, con los botones **«Limpiar»**, **«← Atrás»** y **«Siguiente →»**.
2. Pulsa **«Enviar al Monitoreo»**: se crea la sesión y la plataforma abre la pestaña **Monitoreo** con el paciente conectado.
3. En **Monitoreo**, el selector **«Modo del monitor»** debe estar en **Digital**; el chip de estado mostrará **«Simulando»**.

Si abres Monitoreo sin paciente, verás «Configura o inicia un paciente en la pestaña "Simular Paciente" para ver las curvas en tiempo real.» con el acceso **«Ir a Simular Paciente»**. Los casos clínicos y el paciente propio se tratan a fondo en el módulo «Casos clínicos, sesiones y retroalimentación».

<!-- block: THEORY | Las tres columnas -->
- **Izquierda, «Valores»**: «Modo del monitor», «Paciente activo» y la lista de tarjetas con los valores medidos (botón **«Ajustar»** para ordenarlas u ocultarlas).
- **Centro**: arriba la **fila de entrada** con los tres ajustes más usados, **FiO2**, el control principal del modo (**Volumen** en VCV, **PIP** en PCV o **Presión de soporte**) y **PEEP**; debajo la barra de alarmas y las curvas.
- **Derecha, «Controles»**: el selector **VOL CTRL** / **PRES CTRL**, el menú **«Más modos»** (PSV, CPAP, SIMV), **«Asesoría IA»**, el bloque de **tiempos**, la **frecuencia**, **«Más parámetros»** y, al final, **«Estado de la mecánica»**.

![Esquema de la consola en tres columnas: a la izquierda los valores y el modo del monitor, al centro la fila FiO2, Volumen y PEEP, la barra de alarmas y las curvas de presión, flujo y volumen en VCV, y a la derecha los controles con VOL CTRL, PRES CTRL, Más modos, tiempos y frecuencia](/learning/diagrams/v3-programacion-consola-zonas.svg "Figura: zonas de la pestaña Monitoreo en modo Digital")

<!-- block: THEORY | Qué parámetros muestra cada modo -->
Al cambiar de modo, la consola muestra solo los parámetros que ese modo usa, siguiendo la lógica de la taxonomía de modos: qué variable se controla, qué dispara y qué cicla cada respiración (Chatburn et al., 2014).

| Modo | Parámetros que aparecen |
|---|---|
| **VCV** (VOL CTRL) | Vt, FR, PEEP, FiO2, Ti, Pausa insp., disparo |
| **PCV** (PRES CTRL) | Pinsp, FR, PEEP, FiO2, Ti, disparo |
| **PSV** | PS, PEEP, FiO2, disparo, Ciclado, T. apnea |
| **CPAP** | PEEP, FiO2, disparo, Ciclado, T. apnea |
| **SIMV** | Vt, FR, PEEP, FiO2, Ti, Pausa insp., PS, disparo, Ciclado |

En **VCV** y **PCV** las respiraciones son mandatorias por tiempo, pero el paciente puede dispararlas (asistida-controlada). En **PSV** y **CPAP** las respiraciones las inicia el paciente y terminan por flujo; el **tiempo de apnea** activa un respaldo si deja de respirar. **SIMV** combina respiraciones mandatorias por volumen con espontáneas apoyadas por PS. Las presiones **Pinsp** y **PS** se programan **por encima de la PEEP**.

<!-- page: tiempos-volumen-y-calculos | EXERCISE | Volumen, tiempos y cálculos de apoyo -->
<!-- block: THEORY | El volumen corriente se piensa por peso predicho -->
El tamaño del pulmón depende de la talla y del sexo, no del peso real. Por eso el volumen corriente se programa en mililitros por kilogramo de **peso corporal predicho** (PBW). La consola lo calcula con la fórmula de Devine y muestra la tarjeta **«Vt/kg PBW»**; los datos de talla y peso del paciente están en el panel **«Caso clínico»**. En el ensayo ARDS Network, la estrategia de 6 mL/kg de PBW (con margen de 4 a 8 mL/kg) redujo la mortalidad frente a 12 mL/kg en pacientes con lesión pulmonar aguda y SDRA (ARDS Network, 2000).

$$
PBW_{\text{hombre}} = 50 + 0{,}91\,(\text{talla}_{cm} - 152{,}4) \qquad PBW_{\text{mujer}} = 45{,}5 + 0{,}91\,(\text{talla}_{cm} - 152{,}4)
$$

Donde $PBW$ es el peso corporal predicho en kg y la talla se expresa en centímetros.

<!-- block: EQUATION | Volumen minuto -->
\dot{V}_E = V_t \cdot FR

<!-- block: THEORY | Los tiempos en la columna derecha -->
La consola no tiene un control de I:E; lo calcula. El deslizador **«Insp ── Esp»** reparte el ciclo entre inspiración y espiración y fija el **Ti**; junto a él se leen, sin poder editarlos, el **I:E** (por ejemplo «1 : 2,0») y el **Te**. También están el tiempo y la pausa inspiratoria; la pausa espiratoria aparece desactivada con el texto «No disponible en este simulador».

$$
T_{ciclo} = \frac{60}{FR} \qquad T_e = T_{ciclo} - T_i
$$

Donde $FR$ está en rpm, $T_i$ y $T_e$ en segundos. En VCV con pausa, la pausa forma parte del tiempo inspiratorio total del ciclo.

<!-- block: EXERCISE | Ejemplo resuelto: programar VCV para un adulto -->
**Datos.** Hombre de 175 cm, sin enfermedad pulmonar, en el postoperatorio inmediato. Objetivo didáctico: Vt de 6 mL/kg de PBW, FR 16 rpm, Ti 1,0 s (ARDS Network, 2000).

1. **PBW**: $50 + 0{,}91\,(175 - 152{,}4) = 50 + 0{,}91 \times 22{,}6 = 50 + 20{,}6 = 70{,}6\,\text{kg}$.
2. **Vt**: $6 \times 70{,}6 = 423{,}6\,\text{mL}$. Como el control de Vt avanza de 10 en 10 mL, programas **420 mL** (5,9 mL/kg).
3. **Volumen minuto**: $0{,}42\,\text{L} \times 16 = 6{,}7\,\text{L/min}$.
4. **Tiempos**: ciclo $= 60/16 = 3{,}75\,\text{s}$; $T_e = 3{,}75 - 1{,}0 = 2{,}75\,\text{s}$; I:E $= 1:2{,}75$, que la consola muestra redondeado como «1 : 2,8».

**Pregunta 1.** Si cambias a una mujer de 160 cm con el mismo objetivo, ¿qué Vt programas? Respuesta: $PBW = 45{,}5 + 0{,}91 \times 7{,}6 = 52{,}4\,\text{kg}$; $6 \times 52{,}4 = 314\,\text{mL}$, es decir, **310 mL**.

**Pregunta 2.** Con FR 16 rpm, ¿qué Ti da un I:E de 1:2? Respuesta: el ciclo es 3,75 s; un tercio corresponde a la inspiración, $T_i = 1{,}25\,\text{s}$, que con paso de 0,1 s programas como 1,2 o 1,3 s.

**Pregunta 3.** Subes la FR a 24 rpm sin tocar el Vt. ¿Cuál es el nuevo volumen minuto? Respuesta: $0{,}42 \times 24 = 10{,}1\,\text{L/min}$.

<!-- page: aplicacion-automatica-y-tiempo | THEORY | Cambios automáticos y control del tiempo -->
<!-- block: THEORY | Los cambios se aplican solos -->
En la consola del simulador no existen los botones «Confirmar» ni «Cancelar»: cada ajuste entra al motor por sí mismo. La plataforma distingue dos tipos de entrada:

- **Entradas discretas** (botones + y −, flechas del teclado, valor escrito, cambio de modo o selección en «Más modos»): se aplican **en el acto**.
- **Entradas continuas** (deslizadores y rueda del ratón): se aplican **300 ms después** del último movimiento, para que un arrastre se convierta en un solo cambio y no en decenas.

Con el teclado, **Enter** aplica de inmediato lo que esté en espera y **Esc** lo descarta. Si un cambio no es válido (por ejemplo, una combinación de FR y Ti que el motor rechaza), no entra: el control vuelve al valor aplicado y aparece un aviso. Cada cambio queda registrado en la sesión con su tiempo simulado, lo que permite repetir la sesión y calcular la nota de forma reproducible.

Cada parámetro se ajusta con los botones +/−, la rueda del ratón sobre el valor seleccionado o el teclado (flechas = un paso; RePág/AvPág = diez pasos; Inicio/Fin = mínimo y máximo). El valor siempre se ajusta al paso y al rango del parámetro.

![Tres líneas de tiempo que comparan la aplicación inmediata de los botones en Digital, la espera de 300 ms del deslizador y la espera de 500 ms con validación del modo Real](/learning/diagrams/v3-programacion-aplicacion-automatica.svg "Figura: cuándo se aplica cada tipo de cambio")

<!-- block: THEORY | El reloj de la simulación -->
La franja superior de la sesión muestra **«Tiempo simulado»** y el grupo **«Velocidad»** con los botones **×1**, **×2** y **×4**, además de **«Pausar»** / **«Reanudar»** (con la etiqueta «En pausa» mientras está detenida).

- Con **×2** o **×4**, el tiempo simulado avanza dos o cuatro veces más rápido que el reloj real. Eso acelera también los procesos lentos del paciente, como el ajuste de la PaCO₂ o el deterioro de un caso inestable, de modo que puedes observar en pocos minutos lo que tardaría mucho más.
- La velocidad máxima se fija al iniciar la sesión; durante la sesión solo puedes **bajarla**. Si los botones superiores aparecen deshabilitados, es por esa regla.
- **Pausar** congela el paciente y las curvas: úsalo para analizar una curva con calma o para discutir en grupo.

Cuando terminas, **«Finalizar sesión»** pide confirmación (**«Finalizar»** o **«Seguir simulando»**) y abre el resultado sin salir del simulador.

<!-- block: CALLOUT:info | Diferencias en modo examen -->
Si la simulación forma parte de un examen, la velocidad es fija y no hay pausa, el botón «Ajustar» de las tarjetas aparece bloqueado («Disponible fuera del examen») y la Asesoría IA sigue la política de asistencia que definió el docente. Los cambios de parámetros se aplican igual que en la práctica libre.

<!-- page: ejemplo-clinico | CASE_STUDY | Aplicación: de VCV a PCV en un paciente postoperatorio -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 62 años, 175 cm y 82 kg, en el postoperatorio inmediato de una colectomía, sin antecedentes pulmonares, todavía bajo efecto de la anestesia.

**Paso 1. Elegir el modo y el volumen.** En la fase inicial interesa garantizar la ventilación, así que eliges **VOL CTRL** (VCV). Con el PBW de 70,6 kg calculado en la página anterior programas **Vt 420 mL**, **FR 16 rpm**, **PEEP 5 cmH₂O** y **FiO2 40 %**. Cada pulsación de los botones + y − se aplica sola; observa cómo la curva de flujo se vuelve un rectángulo durante la inspiración y la presión sube en rampa.

**Paso 2. Medir la meseta.** Añades una **Pausa insp.** de 0,3 s desde «Más parámetros». En la curva de presión aparece una meseta tras el pico. Las tarjetas muestran Ppico, Pplat y ΔP. Supón que lees Ppico 18 y Pplat 14 cmH₂O: la diferencia de 4 cmH₂O es el componente resistivo y ΔP = 14 − 5 = 9 cmH₂O. Una Pplat por debajo de 30 cmH₂O y una ΔP por debajo de 15 cmH₂O son las referencias de ventilación protectora más usadas (ARDS Network, 2000; Amato et al., 2015).

**Paso 3. Pasar a PCV.** Para comparar, cambias a **PRES CTRL**. Ahora el control principal de la fila de entrada es la presión (**PIP**, sobre PEEP). Para obtener un volumen parecido programas la presión cercana a la ΔP que mediste (9-10 cmH₂O sobre PEEP) y **Ti 1,0 s**. La presión se vuelve cuadrada y el flujo desacelerado; el **Vte** pasa a depender de la mecánica del paciente, así que vigílalo en las tarjetas después de cada cambio.

**Paso 4. Verificar.** Comparas Vte, VE y Vt/kg PBW con los de VCV. Si el Vte quedó bajo, subes la presión de a 1 cmH₂O y esperas algunos ciclos antes del siguiente ajuste.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) (si no se carga solo, elígelo en «Cargar caso») y pulsa «Enviar al Monitoreo». Programa VCV con una pausa inspiratoria y localiza la meseta en la curva de presión. Cambia a PCV y observa cómo el flujo pasa de rectangular a desacelerado. Finalmente arrastra el deslizador «Insp ── Esp» y comprueba que el cambio se aplica solo al soltar.

<!-- block: EXERCISE | Preguntas de práctica -->
1. **En PCV programas PIP 15 con PEEP 8. ¿Qué presión pico total esperas?** Respuesta: alrededor de 23 cmH₂O, porque la PIP de la consola se suma a la PEEP.
2. **Arrastras el deslizador de tiempos y la curva no cambia de inmediato. ¿Falla algo?** Respuesta: no; las entradas continuas se aplican 300 ms después del último movimiento.
3. **¿Por qué en PCV debes vigilar el Vte y en VCV la Pplat?** Respuesta: en PCV la variable fija es la presión y el volumen depende de compliance y resistencia; en VCV ocurre lo contrario.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Para programar el simulador: **Simular Paciente → Enviar al Monitoreo**, con «Modo del monitor» en **Digital**.
- La fila de entrada concentra **FiO2**, el control principal del modo y **PEEP**; **VOL CTRL** / **PRES CTRL** y **«Más modos»** eligen el modo.
- Cada modo muestra solo sus parámetros; Pinsp y PS se programan sobre la PEEP.
- El Vt se programa por kilogramo de peso predicho (Devine); la tarjeta «Vt/kg PBW» lo comprueba.
- El I:E y el Te se calculan a partir de FR y Ti; no hay control directo de I:E.
- Los cambios se aplican solos: botones al instante, deslizadores y rueda a los 300 ms; Enter aplica y Esc descarta lo pendiente.
- La velocidad (×1, ×2, ×4) acelera también la evolución del paciente; solo puede bajarse durante la sesión.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Programar el Vt por peso real** → sobredimensiona el volumen en pacientes con obesidad → calcula el PBW con la talla y revisa «Vt/kg PBW».
- **Interpretar la PIP de PCV como presión total** → la consola la suma a la PEEP → la presión pico total es PIP + PEEP.
- **Hacer varios cambios seguidos sin esperar** → no sabrás cuál produjo cada efecto → cambia un parámetro y observa varios ciclos.
- **Usar ×4 para analizar curvas finas** → los eventos pasan muy rápido → usa ×1 o «Pausar» para leer con calma.
- **Buscar el botón «Confirmar»** → ya no existe → el cambio se aplica solo; usa Esc si quieres descartar lo que esté en espera.
- **Cambiar de VCV a PCV sin vigilar el volumen** → el Vte pasa a depender de la mecánica → revisa Vte y VE tras cada ajuste.

<!-- block: REFERENCES | Referencias -->
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Acute Respiratory Distress Syndrome Network [ARDS Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Gaba, D. M. (2004). The future vision of simulation in health care. *Quality and Safety in Health Care, 13*(Suppl. 1), i2-i10. [https://doi.org/10.1136/qshc.2004.009878](https://doi.org/10.1136/qshc.2004.009878)
- VentyLab. (2026). *Manual de uso* [documentación interna].
