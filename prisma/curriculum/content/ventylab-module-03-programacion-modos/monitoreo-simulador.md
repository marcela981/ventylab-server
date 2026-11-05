<!-- page: curvas-y-bucles | THEORY | Curvas y bucles en la consola -->
<!-- block: INTRODUCTION | Mirar antes de tocar -->
Un ventilador entrega exactamente lo que se le programa, pero el paciente responde según su mecánica y su fisiología. El monitoreo es la forma de ver esa respuesta: las curvas muestran cómo se comportan presión, flujo y volumen en cada ciclo, y los valores numéricos resumen lo que pasó. Leerlos de forma sistemática permite detectar problemas antes de que aparezcan en la gasometría, como el atrapamiento aéreo o la sobredistensión (Hess & Kacmarek, 2019). En el simulador, además, puedes congelar, ampliar y repetir lo que en la cama del paciente pasa una sola vez.

<!-- block: THEORY | La zona de curvas -->
En el centro de la pestaña **Monitoreo** hay tres carriles apilados, cada uno con su unidad: **Presión** (cmH₂O), **Flujo** (L/min) y **Volumen** (mL). El flujo inspiratorio se dibuja por encima de cero y el espiratorio por debajo. Al inicio de la barra de herramientas está el chip de estado de la señal: **«Simulando»** en Digital, **«Conectado (Físico)»** en Real y **«Sin señal»** cuando no hay datos.

La barra de herramientas ofrece:

| Control | Para qué sirve |
|---|---|
| **«Zoom de las curvas»**: Acercar, Alejar, Restablecer zoom | Cambia la ventana de tiempo visible entre 5, 10, 20 y 30 s (por defecto 10 s); la etiqueta indica «Ventana N s». |
| **Bucles** | Muestra los bucles **P-V** (presión-volumen) y **F-V** (flujo-volumen) del ciclo. |
| **Congelar** | Detiene el trazado en pantalla (la simulación sigue) y habilita un cursor para medir valores en un punto. |
| **«Opciones de trazado»** | Alterna entre barrido (la curva se redibuja de izquierda a derecha, como en un monitor) y desplazamiento continuo. |

<!-- block: THEORY | Una lectura sistemática en cuatro pasos -->
1. **Flujo**: ¿la inspiración tiene la forma esperada para el modo (rectangular en VCV con flujo constante, desacelerada en PCV y PSV)? ¿El flujo espiratorio vuelve a cero antes de la siguiente respiración? Si no vuelve, hay atrapamiento y auto-PEEP.
2. **Presión**: ¿la línea de base coincide con la PEEP programada? En VCV con pausa, ¿cuánto separa el pico de la meseta? Esa diferencia refleja la resistencia; la meseta refleja la distensibilidad.
3. **Volumen**: ¿la curva regresa a cero al final de la espiración? Una curva que no regresa sugiere fuga o atrapamiento.
4. **Bucles**: en el P-V, un aplanamiento final («pico de pato») sugiere sobredistensión; en el F-V, una rama espiratoria cóncava sugiere obstrucción al flujo.

<!-- block: CALLOUT:tip | Congela antes de medir -->
Para comparar Ppico y Pplat en la curva, activa la pausa inspiratoria, pulsa **Congelar** y usa el cursor. Así lees el valor en el momento exacto y no mientras la curva se desplaza. Si necesitas que el paciente tampoco avance, usa además **«Pausar»** en la franja de la sesión.

<!-- page: tarjetas-de-valores | THEORY | Las tarjetas de valores -->
<!-- block: THEORY | Qué muestra la columna izquierda -->
La lista **«Valores del monitor»** tiene 21 tarjetas. Las seis primeras siguen el orden de un ventilador de cabecera: **Ppico**, **Pmedia**, **PEEP**, **Flujo máx**, **Flujo mín** (el flujo espiratorio máximo, el valor más negativo) y **Vte**. Siguen **Pplat**, **ΔP**, **Auto-PEEP**, **Vt/kg PBW**, **VE**, **FR total**, **I:E**, **FiO2** y **Potencia** (potencia mecánica, J/min), y después los signos del paciente: **SpO2**, **PaO2**, **PaCO2**, **pH** y **PAM**. Un valor que la fuente no entrega aparece como «—».

Cuando un valor sale de su rango de referencia, la tarjeta muestra un icono y el texto **«Alto»** o **«Bajo»**, nunca solo un cambio de color. Algunos rangos de referencia de la consola corresponden a umbrales de ventilación protectora: Pplat de hasta 30 cmH₂O y Vt entre 4 y 8 mL/kg de PBW (ARDS Network, 2000), ΔP de hasta 15 cmH₂O (Amato et al., 2015) y PAM de al menos 65 mmHg (Evans et al., 2021). Son valores didácticos para un adulto; cada caso clínico puede ajustarlos.

Con **«Ajustar»** puedes reordenar las tarjetas (arrastrando o con los botones «Subir» y «Bajar»), ocultarlas («Ocultar» / «Mostrar») y volver al orden original con **«Restablecer tarjetas»**. La preferencia es personal y vale tanto en Digital como en Real.

<!-- block: THEORY | Estado de la mecánica: compliance estática y dinámica -->
Al final de la columna derecha, **«Estado de la mecánica»** muestra dos valores derivados, marcados como «derivada»:

$$
C_{st} = \frac{V_{te}}{P_{plat} - PEEP} \qquad C_{din} = \frac{V_{te}}{P_{pico} - PEEP}
$$

Donde $C_{st}$ es la compliance estática y $C_{din}$ la dinámica (mL/cmH₂O), $V_{te}$ el volumen corriente espirado (mL) y las presiones están en cmH₂O. La estática solo es fiable con una pausa inspiratoria que deje ver la meseta.

**Ejemplo.** Con $V_{te} = 450\,\text{mL}$, $P_{plat} = 20$, $P_{pico} = 28$ y $PEEP = 5\,\text{cmH}_2\text{O}$: $C_{st} = 450/15 = 30\,\text{mL/cmH}_2\text{O}$ y $C_{din} = 450/23 \approx 19{,}6\,\text{mL/cmH}_2\text{O}$. La diferencia entre ambas se debe al componente resistivo, que solo afecta a la presión pico. Si en un ajuste posterior baja la $C_{din}$ pero no la $C_{st}$, piensa primero en la vía aérea (secreciones, broncoespasmo, tubo acodado) antes que en el parénquima.

<!-- block: EQUATION | Presión de distensión -->
\Delta P = P_{plat} - PEEP

<!-- block: THEORY | Leer las tarjetas con criterio -->
Un número aislado dice poco; lo útil es su relación con los demás y su tendencia. Tres hábitos ayudan:

- **Compara lo programado con lo medido.** En VCV, el Vte debería parecerse al Vt programado; si es mucho menor, sospecha una fuga o una desconexión. En PCV, el Vte es la variable que cambia con la mecánica y por eso es la primera que miras.
- **Relaciona presiones.** Ppico alta con Pplat normal apunta a la vía aérea; Ppico y Pplat altas a la vez apuntan al pulmón o a la pared torácica. La **PEEP total** mayor que la programada revela auto-PEEP.
- **Mira la tendencia antes que el umbral.** Las tarjetas de signos vitales tienen una línea de tendencia: una SpO₂ que cae poco a poco merece atención antes de que aparezca la marca «Bajo».

<!-- page: alarmas-y-ayuda | THEORY | Alarmas y ayuda para estabilizar -->
<!-- block: THEORY | La barra de alarmas -->
Sobre las curvas está la barra de alarmas. Las alarmas activas se ordenan por prioridad (**«Prioridad alta»**, **«Prioridad media»**, **«Prioridad baja»**) y, dentro de cada prioridad, de la más reciente a la más antigua. Sin alarmas se lee «Sin alarmas activas». El motor del simulador genera, entre otras, alarmas de desconexión, apnea, presión alta y volumen corriente bajo (prioridad alta) y de volumen corriente alto, frecuencia alta y auto-PEEP (prioridad media). Con la evolución del paciente se suman alarmas del propio paciente: SpO₂ baja, PAM baja, taquicardia, bradicardia y paro cardíaco.

- **Silenciar** apaga el sonido durante 2 minutos con una cuenta regresiva visible; la alarma sigue en pantalla. El sonido está apagado por defecto y se activa con el botón **Sonido**.
- **«Historial de alarmas»** y **«Límites»** abren el panel lateral **«Alertas detalladas»**, con el historial de la sesión (aparición y resolución de cada alarma) y las alertas de validación. En el simulador digital los límites de alarma vienen del caso; el panel para editarlos solo aparece cuando la fuente los ofrece, como el equipo real.

La fatiga de alarmas, es decir, la desensibilización por exposición a muchas alarmas, a menudo irrelevantes, es un riesgo reconocido para la seguridad del paciente (Sendelbach & Funk, 2013). Silenciar sin buscar la causa reproduce ese mal hábito; en el simulador practica lo contrario.

<!-- block: THEORY | Alarmas clicables: «¿Cómo estabilizar?» -->
Cada alarma de la barra es un botón. Al pulsarla se abre el panel **«¿Cómo estabilizar?»**, que muestra primero las **reglas** fijas para ese tipo de alarma, con su referencia, y después una **sugerencia de la IA** que se escribe en vivo, construida con el contexto de tu sesión. La sugerencia se valora con **«¿Te fue útil?»**. Si la IA no responde verás solo las reglas, con el aviso «Sugerencia automática (IA no disponible)»; durante un examen sin asistencia el panel muestra solo la descripción de la alarma («Ayuda no disponible durante el examen»). En un examen que penaliza la asistencia, pedir ayuda queda registrado.

![Flujo de la ayuda de alarmas desde la barra de alarmas hasta el panel ¿Cómo estabilizar? con las reglas fijas y la sugerencia de la IA, y los casos sin IA o en examen](/learning/diagrams/v3-monitoreo-alarma-ayuda.svg "Figura: de la alarma a la acción, siempre decidida por ti")

La ayuda **nunca cambia el ventilador**: tú decides y aplicas cada ajuste. Para una consulta más amplia, el botón **«Asesoría IA»** de la columna derecha abre un panel donde puedes escribir una pregunta opcional y pulsar **«Solicitar asesoría»**; la simulación no se detiene mientras responde y puedes cortar la respuesta con **«Detener»**.

<!-- page: estado-del-paciente | THEORY | El estado del paciente y su evolución -->
<!-- block: THEORY | Signos del paciente simulado -->
El paciente digital tiene gases arteriales y hemodinamia: **SpO2**, **PaO2**, **PaCO2**, **pH**, **PAM** y **frecuencia cardíaca**. Estos valores no cambian al instante: el oxígeno se equilibra en segundos a minutos y el CO₂ en varios minutos tras un cambio de ventilación, igual que en la fisiología real. Cada tarjeta de signo vital incluye una pequeña línea de tendencia con los últimos valores, útil para ver si un ajuste está funcionando antes de que el número cruce un umbral.

<!-- block: THEORY | De estable a crítico, y de vuelta -->
El paciente evoluciona según sus ajustes. El modelo considera cinco **agresiones**: hipoxemia, acidosis, presiones de lesión (meseta o ΔP altas), atrapamiento (auto-PEEP alta) e hipotensión. Mientras haya alguna, la gravedad aumenta, la distensibilidad empeora y el shunt crece; cuando las corriges, la gravedad baja y el paciente mejora poco a poco. Una PEEP excesiva también tiene costo: con meseta alta aparecen sobredistensión y caída de la PAM, de modo que más PEEP mejora la oxigenación solo hasta cierto punto.

![Diagrama de estados del paciente simulado de Estable a Inestable, Crítico, Paro y Fallecido, con el regreso hacia Estable al corregir la causa y la lista de agresiones](/learning/diagrams/v3-monitoreo-estado-paciente.svg "Figura: estados del paciente y su reversibilidad")

Los estados son **estable**, **inestable**, **crítico**, **paro** y **fallecido**. En estado crítico todavía es posible rescatar al paciente corrigiendo la causa; si la exposición crítica se prolonga, llega el paro, que en el simulador es irreversible (no hay reanimación simulada), y después el fallecimiento. En ese caso la sesión se cierra sola y se abre el resumen con el desenlace y la línea de tiempo de tus decisiones, alarmas y cambios de estado. Un caso que empieza estable no llega a crítico solo por esperar.

<!-- block: CALLOUT:warning | Es un modelo educativo -->
Las velocidades de deterioro, los tiempos hasta el paro y los umbrales de cada caso son **convenciones de simulación** pensadas para enseñar, no predicciones clínicas: no existe un umbral validado de saturación o de duración que prediga el paro en una persona. Úsalos para entender la dirección de los efectos, no para estimar plazos en pacientes reales. Recuerda también que el multiplicador ×2 o ×4 acelera esta evolución.

<!-- block: THEORY | El resultado de la sesión -->
Al pulsar **«Finalizar sesión»** se abre el resultado sin salir del simulador: la puntuación que calcula el servidor, los objetivos del caso (cumplido, no cumplido o sin datos aún), el desglose y la evolución de métricas clave (SpO₂, PaCO₂, presión meseta y Vt/kg PBW) en gráficos. Desde ahí puedes abrir la repetición de la sesión en **Mis sesiones**. Los objetivos que ves durante la sesión en el panel **«Caso clínico»** se marcan «en tiempo real» y no son la calificación final.

<!-- page: ejemplo-clinico | CASE_STUDY | Aplicación: leer el monitoreo en una exacerbación de EPOC -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Mujer de 68 años con EPOC grave, intubada por una exacerbación con acidosis respiratoria. Talla 158 cm. Está en VCV con Vt 380 mL, FR 22 rpm, Ti 1,0 s, PEEP 5 cmH₂O y FiO2 35 %.

**Paso 1. Las curvas.** En el carril de flujo, la rama espiratoria desciende lentamente y **no vuelve a cero** antes de la siguiente inspiración. El bucle F-V muestra una rama espiratoria cóncava. Ambos signos sugieren obstrucción al flujo espiratorio con atrapamiento aéreo (Hess & Kacmarek, 2019).

**Paso 2. Las tarjetas y alarmas.** La tarjeta **Auto-PEEP** aparece marcada **«Alto»** y la barra muestra la alarma de auto-PEEP (prioridad media). La **PEEP total** supera la programada. La Ppico está elevada con una diferencia grande frente a la Pplat: el problema dominante es resistivo. La PAM tiende a bajar en su línea de tendencia.

**Paso 3. Razonar el tiempo espiratorio.** Con FR 22 rpm el ciclo dura $60/22 \approx 2{,}73\,\text{s}$ y $T_e \approx 1{,}73\,\text{s}$. Un pulmón con constante de tiempo alargada necesita más tiempo para vaciarse; la estrategia clásica es reducir la frecuencia y, con ella, alargar el tiempo espiratorio (Hess & Kacmarek, 2019).

**Paso 4. Ajustar y verificar.** Pulsas la alarma de auto-PEEP: el panel «¿Cómo estabilizar?» propone, entre sus reglas, revisar la frecuencia y el tiempo espiratorio. Bajas la FR a 16 rpm (ciclo 3,75 s; $T_e = 2{,}75\,\text{s}$) y esperas varios ciclos. El flujo espiratorio ahora llega más cerca de cero, la Auto-PEEP baja y la PAM se estabiliza. Vigilas la PaCO₂ y el pH en los minutos siguientes, porque menos ventilación minuto puede subir el CO₂.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) (si no se carga solo, elígelo en «Cargar caso»). Observa la curva de flujo y confirma que la espiración no termina en cero; mira la tarjeta Auto-PEEP. Baja la FR de a dos respiraciones y espera varios ciclos entre cambios: el flujo espiratorio debería acercarse a cero y la Auto-PEEP disminuir. Pulsa la alarma de auto-PEEP para comparar tu razonamiento con las reglas del panel.

<!-- block: EXERCISE | Preguntas de práctica -->
1. **La tarjeta Vt/kg PBW muestra «Alto». ¿Qué revisas primero?** Respuesta: el Vt programado frente al peso predicho del paciente (panel «Caso clínico») y, en PCV, si una mejora de la compliance aumentó el volumen entregado.
2. **Silencias una alarma de presión alta y desaparece el sonido, pero la alarma sigue visible. ¿Es un error?** Respuesta: no; silenciar solo apaga el sonido 2 minutos; la causa sigue activa hasta que la corriges.
3. **Cdin bajó de 40 a 25 mL/cmH₂O y Cst no cambió. ¿Qué sugiere?** Respuesta: un aumento de la resistencia de la vía aérea, no un cambio del parénquima.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La zona de curvas muestra presión, flujo y volumen; la barra ofrece zoom (5 a 30 s), **Bucles** P-V y F-V, **Congelar** con cursor y opciones de trazado.
- Lee las curvas en orden: flujo, presión, volumen y bucles; un flujo espiratorio que no llega a cero indica atrapamiento.
- Las 21 tarjetas marcan «Alto» o «Bajo» fuera de rango; «Ajustar» personaliza su orden y visibilidad.
- «Estado de la mecánica» calcula Cst y Cdin; su diferencia refleja el componente resistivo.
- Las alarmas se ordenan por prioridad; silenciar apaga el sonido 2 minutos, no la alarma.
- Cada alarma abre **«¿Cómo estabilizar?»** con reglas y una sugerencia de IA; tú aplicas los cambios.
- El paciente evoluciona entre estable, inestable, crítico, paro y fallecido según sus ajustes; los tiempos son un modelo educativo.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Mirar solo los números** → las tarjetas resumen el ciclo y ocultan su forma → empieza por la curva de flujo.
- **Silenciar y seguir** → la causa persiste y se normaliza la fatiga de alarmas → abre la alarma y corrige la causa.
- **Leer la Pplat sin pausa inspiratoria** → sin meseta, la Cst y la ΔP no son fiables → activa la pausa y congela la curva.
- **Esperar un efecto inmediato en la PaCO₂** → el CO₂ tarda minutos en equilibrarse → espera y observa la línea de tendencia.
- **Subir la PEEP sin límite para mejorar la SpO₂** → con meseta alta aparece sobredistensión y cae la PAM → vigila Pplat, ΔP y PAM tras cada paso.
- **Tomar los tiempos de deterioro como clínicos** → son convenciones del simulador → úsalos para entender tendencias, no plazos.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network [ARDS Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Evans, L., Rhodes, A., Alhazzani, W., Antonelli, M., Coopersmith, C. M., French, C., Machado, F. R., Mcintyre, L., Ostermann, M., Prescott, H. C., Schorr, C., Simpson, S., Wiersinga, W. J., Alshamsi, F., Angus, D. C., Arabi, Y., Azevedo, L., Beale, R., Beilman, G., ... Levy, M. (2021). Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock 2021. *Critical Care Medicine, 49*(11), e1063-e1143. [https://doi.org/10.1097/CCM.0000000000005337](https://doi.org/10.1097/CCM.0000000000005337)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Sendelbach, S., & Funk, M. (2013). Alarm fatigue: A patient safety concern. *AACN Advanced Critical Care, 24*(4), 378-386. [https://doi.org/10.4037/NCI.0b013e3182a903f9](https://doi.org/10.4037/NCI.0b013e3182a903f9)
- VentyLab. (2026). *Manual de uso* [documentación interna].
