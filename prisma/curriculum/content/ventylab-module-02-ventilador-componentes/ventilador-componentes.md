<!-- page: arquitectura-del-sistema | THEORY | Arquitectura: del equipo a tu pantalla -->
<!-- block: INTRODUCTION | Dos ventiladores en una misma consola -->
VentyLab te deja practicar con dos fuentes distintas usando la **misma consola**: un **simulador digital**, cuyo paciente es un modelo matemático, y un **ventilador físico** de laboratorio conectado a un pulmón de prueba. Cambiar entre una y otra es tan simple como elegir **Digital** o **Real** en el selector «Modo del monitor» de la pestaña Monitoreo, pero detrás de ese botón hay recorridos de datos muy diferentes. Entenderlos te permite interpretar lo que ves: por qué una curva real puede tener ruido o retraso, por qué un cambio en el equipo tarda en reflejarse y por qué ciertas maniobras solo existen en el simulador.

Todo ventilador, físico o simulado, cumple las mismas funciones básicas: entrega gas con una variable de control (presión o volumen), decide cuándo empieza y termina cada inspiración y mide lo que ocurre en la vía aérea (Chatburn et al., 2014; Hess & Kacmarek, 2019). En VentyLab esas funciones se reparten entre el equipo, la red y el software.

<!-- block: THEORY | Los cuatro bloques del sistema real -->
1. **Ventilador físico y pulmón de prueba.** El equipo genera los ciclos y mide presión, flujo y volumen. Está conectado a un **pulmón de prueba (simulador pulmonar), nunca a una persona ni a un animal**. Durante las prácticas, una persona responsable del equipo está presente y tiene la última palabra sobre la seguridad.
2. **Broker MQTT.** Es un intermediario de mensajes: el equipo publica su telemetría en un tema y lee los comandos de otro. MQTT es un protocolo estándar de publicación y suscripción pensado para dispositivos conectados (OASIS, 2019).
3. **Servidor VentyLab.** Tiene tres módulos: **reservas** (quién puede usar el equipo y cuándo), **telemetría** (recibe los mensajes del broker, los normaliza y los reenvía) y **comandos** (control exclusivo de un operador, validación, envío y seguimiento de cada cambio).
4. **Navegador.** La consola de Monitoreo en modo **Real** recibe los datos en vivo por una conexión en tiempo real (Socket.io) y dibuja curvas, tarjetas y alarmas.

![Esquema de la arquitectura con el ventilador físico y el pulmón de prueba, el broker MQTT, el servidor VentyLab con reservas, telemetría y comandos, y el navegador; arriba la telemetría hacia el navegador, abajo los comandos hacia el equipo, y aparte el simulador digital que corre en el navegador](/learning/diagrams/v2-ventilador-arquitectura.svg "Figura: recorrido de la telemetría y de los comandos")

<!-- block: THEORY | Qué viaja en la telemetría -->
Cada mensaje del equipo trae, como mínimo, **presión** (cmH₂O), **flujo** (L/min, negativo en la espiración) y **volumen** (mL). Puede traer además el modo, los **ajustes que el equipo informa**, códigos de alarma y, si el equipo los mide, SpO₂ y PCO₂. El servidor agrupa los mensajes y los reenvía en lotes cada 33 ms aproximadamente, de modo que la consola recibe unas 30 actualizaciones por segundo y dibuja las curvas de forma continua.

Algunos valores de las tarjetas no los mide el equipo: el navegador los **calcula a partir de las curvas** (por ejemplo, Ppico, PEEP, Vte, FR, I:E y VE; Pplat y ΔP solo cuando hay meseta). Esas tarjetas llevan la marca **«derivada»** para que sepas que son una estimación.

<!-- block: THEORY | Señales de salud de la conexión -->
- **Latencia**: la franja del modo Real muestra un semáforo con el percentil 95 de la sesión: verde por debajo de 70 ms, amarillo entre 70 y 99 ms y rojo desde 100 ms.
- **«Equipo sin datos»**: si no llega telemetría durante unos 2 segundos, las curvas se congelan en gris, los controles pasan a solo lectura y el indicador del menú cambia. Cuando vuelven los datos, todo se reanuda solo.
- **Grabación**: quien tiene el control puede pulsar **«Grabar sesión»** para guardar la telemetría y revisarla después en «Mis sesiones».

<!-- block: THEORY | Y el simulador digital -->
En modo **Digital** no hay broker ni equipo: el motor fisiológico corre en tu navegador y genera las curvas con la ecuación del movimiento, el intercambio gaseoso y la respuesta hemodinámica del paciente simulado. El servidor guarda los eventos de la sesión (tus cambios, con su tiempo simulado) y la reproduce para calcular el resultado. Por eso el simulador es determinista: la misma sesión, repetida, produce las mismas curvas.

<!-- page: modos-y-parametros | THEORY | Modos y parámetros disponibles -->
<!-- block: THEORY | Modos en cada fuente -->
| Modo | Simulador digital | Equipo real |
|---|---|---|
| **VCV** (volumen control) | Sí | Sí |
| **PCV** (presión control) | Sí | Solo si el equipo ya está en PCV; no se puede cambiar hacia PCV |
| **PSV** (presión de soporte) | Sí | Igual que PCV: no se puede cambiar hacia PSV |
| **CPAP** | Sí | No se puede programar desde la consola |
| **SIMV** | Sí (mandatorias por volumen con soporte de presión) | Sí |

La razón de las restricciones del modo Real es de seguridad: el servidor del equipo expresa la presión como un **límite absoluto** cuyo significado exacto por modo no está documentado por el fabricante del firmware, mientras que la consola trabaja con presiones **por encima de la PEEP**. Antes que adivinar una presión que nadie eligió, la consola rechaza el cambio.

<!-- block: THEORY | Parámetros y rangos del simulador digital -->
En la consola, cada modo muestra solo los parámetros que le aplican. Los rangos del motor digital son:

| Parámetro (etiqueta) | Rango | Paso |
|---|---|---|
| Volumen corriente (**Vt**) | 200-800 mL | 10 mL |
| Presión inspiratoria (**Pinsp**, sobre PEEP) | 5-40 cmH₂O | 1 |
| Presión de soporte (**PS**, sobre PEEP) | 0-30 cmH₂O | 1 |
| Frecuencia (**FR**) | 5-40 rpm | 1 |
| **PEEP** | 0-20 cmH₂O | 1 |
| **FiO2** | 21-100 % | 1 % |
| Tiempo inspiratorio (**Ti**) | 0,5-3 s | 0,1 s |
| Pausa inspiratoria (**Pausa insp.**) | 0-2 s | 0,1 s |
| Disparo por flujo / por presión | 0,5-10 L/min / 0,5-10 cmH₂O | 0,5 |
| **Ciclado** (% del flujo pico) | 5-80 % | 5 % |
| Tiempo de apnea (**T. apnea**) | 10-60 s | 5 s |

Estos son límites técnicos del motor, no recomendaciones: que un valor sea aceptado no significa que sea adecuado para el paciente.

<!-- block: THEORY | Salvaguardas adicionales del equipo real -->
Para el equipo físico, el servidor aplica límites más estrictos: PEEP máxima de 15 cmH₂O, presión límite máxima de 40 cmH₂O, volumen corriente máximo de 700 mL, frecuencia máxima de 35 rpm y relación I:E que no puede ser invertida (I:E ≤ 1:1). Además, el tiempo espiratorio que resulta de la frecuencia y del Ti debe ser de al menos 0,3 s. La consola comprueba estas reglas antes de enviar y el servidor las vuelve a comprobar; si una falla, el cambio no sale.

<!-- block: THEORY | Cálculo de los tiempos del ciclo -->
La consola no tiene un control de I:E: lo calcula a partir de la frecuencia y del tiempo inspiratorio. El ciclo dura $60/FR$ segundos y el tiempo espiratorio es lo que queda:

$$
T_e = \frac{60}{FR} - T_i \qquad \text{I:E} = 1 : \frac{T_e}{T_i}
$$

Donde $FR$ es la frecuencia en respiraciones por minuto, $T_i$ el tiempo inspiratorio en segundos y $T_e$ el tiempo espiratorio en segundos.

**Ejemplo resuelto.** Con $FR = 20\,\text{rpm}$ y $T_i = 1{,}0\,\text{s}$: el ciclo dura $60/20 = 3{,}0\,\text{s}$, de modo que $T_e = 3{,}0 - 1{,}0 = 2{,}0\,\text{s}$ e I:E $= 1:2{,}0$. Si subes la frecuencia a 35 rpm sin tocar el Ti, el ciclo dura $60/35 \approx 1{,}71\,\text{s}$ y $T_e \approx 0{,}71\,\text{s}$: la relación pasa a 1:0,7, es decir, **invertida**. En el equipo real ese cambio se rechaza; en el simulador se acepta, pero verás que el flujo espiratorio no alcanza a volver a cero y aparece auto-PEEP.

<!-- block: EQUATION | Regla de tiempo espiratorio mínimo del equipo real -->
T_e = \frac{60}{FR} - T_i \geq 0{,}3\,\text{s}

<!-- page: comandos-y-salvaguardas | THEORY | Cómo viaja un cambio al equipo real -->
<!-- block: THEORY | Un solo operador a la vez -->
El equipo físico es único. Para usarlo necesitas una **reserva activa** y **tomar el control**: solo una persona, el operador, puede cambiar parámetros. Los demás miembros del grupo, y los docentes que observan, ven la consola en solo lectura con el motivo («Opera: …»). El servidor nunca envía comandos por iniciativa propia: cuando termina la reserva, se cancela o un docente la desplaza, solo retira el control. La reserva y la conexión se explican en detalle en el módulo «Reserva y conexión del equipo físico».

<!-- block: THEORY | Envío automático con salvaguardas -->
En la consola no hay botón «Enviar» ni «Confirmar»: los cambios salen solos, pero no de inmediato ni sin control. El recorrido es este:

1. **Espera de 500 ms** desde el último cambio de cualquier parámetro, para agrupar los ajustes que haces seguidos en un solo comando.
2. **Validación del rango seguro.** Un valor fuera de rango **nunca** se envía: el parámetro muestra «Rechazado: fuera del rango seguro» y el control vuelve al último valor aplicado.
3. **Un comando en vuelo a la vez.** Si todavía hay uno sin resolver, los cambios nuevos esperan y salen juntos (por cada parámetro gana el último valor) cuando el anterior termina.
4. **Estado visible por parámetro**: **«Enviando»**, **«Aplicado»** o **«Rechazado»** (con el motivo del servidor), anunciado también a los lectores de pantalla.
5. **«Deshacer último cambio»**: un botón de la columna izquierda que reenvía los valores que estaban aplicados antes del último comando, por el mismo camino y con la misma validación.

![Diagrama de flujo del envío automático en modo Real con la espera de 500 ms, la validación del rango seguro, la cola de un comando en vuelo y los estados Enviando, Aplicado y Rechazado](/learning/diagrams/v2-ventilador-ciclo-comando.svg "Figura: recorrido de un cambio hasta el equipo")

<!-- block: CALLOUT:warning | La consola muestra lo que el equipo informa -->
En modo Real, el valor que ves en cada parámetro es el que **el equipo informa** en su telemetría, nunca el que acabas de escribir. Un cambio solo se da por aplicado cuando el equipo lo reporta. Si el equipo no confirma, el estado lo indica y la consola puede bloquear nuevos envíos hasta aclarar qué valores tiene realmente el equipo. El software no tiene parada de emergencia: si algo no coincide con la pantalla del equipo, se detiene en el propio equipo y se libera el control.

<!-- page: digital-frente-a-real | CASE_STUDY | Recorrido: el mismo ajuste en Digital y en Real -->
<!-- block: CASE_STUDY | Ejemplo guiado: subir la PEEP de 5 a 8 cmH₂O -->
Un grupo de tres estudiantes prepara una práctica sobre PEEP. Primero ensayan en el simulador y luego repiten en el equipo físico durante su reserva.

**En Digital.** Cargan un paciente en «Simular Paciente», lo envían al Monitoreo y suben la PEEP con el botón + tres veces. Cada pulsación se aplica al instante: en la curva de presión la línea de base sube de 5 a 8 cmH₂O, la tarjeta PEEP lo refleja y, con el paso de los minutos simulados, la oxigenación del paciente cambia según su fisiología. Pueden pausar, cambiar la velocidad y repetir.

**En Real.** Durante la reserva, la estudiante que tiene el control cambia a **Real** en «Modo del monitor». La consola ahora muestra la franja «Ventilador físico» con el estado del equipo y la latencia. Sube la PEEP tres pasos seguidos. Medio segundo después del último paso, la consola valida que 8 cmH₂O está dentro del rango seguro y envía un solo comando; el parámetro muestra «Enviando». Cuando la telemetría del equipo informa PEEP 8, el estado pasa a «Aplicado» y la línea de base del pulmón de prueba sube en la curva. Sus compañeros ven lo mismo en solo lectura.

Luego prueban, de acuerdo con el responsable del equipo, una PEEP de 18 cmH₂O: la consola la rechaza antes de enviarla porque supera el máximo de seguridad del equipo (15 cmH₂O), y el control vuelve a 8. Por último pulsan **«Deshacer último cambio»** para regresar a 5.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) (si no se carga solo, búscalo en «Cargar caso») y envíalo al Monitoreo. Sube la PEEP de a un paso y observa cómo se eleva la línea de base de la curva de presión y cómo cambian Ppico y Pmedia en las tarjetas. Después sube la FR hasta que el I:E calculado se acerque a 1:1 y mira si el flujo espiratorio llega a cero antes de la siguiente inspiración.

<!-- block: EXERCISE | Preguntas de práctica -->
1. **¿Por qué una tarjeta del modo Real dice «derivada»?** Respuesta: porque el equipo no la mide; el navegador la calcula a partir de las curvas recibidas.
2. **Quieres pasar el equipo real de VCV a PCV. ¿Qué ocurre?** Respuesta: el cambio se rechaza, porque el servidor necesitaría una presión límite absoluta que nadie eligió.
3. **Con FR 30 rpm y Ti 1,8 s, ¿se puede enviar al equipo real?** Respuesta: el ciclo dura 2,0 s y Te = 0,2 s; no cumple el mínimo de 0,3 s y además el I:E sería invertido, así que se rechaza.
4. **Las curvas se ponen grises con «Equipo sin datos». ¿Qué significa?** Respuesta: no llega telemetría desde hace unos 2 s; los controles pasan a solo lectura hasta que el equipo vuelva a transmitir.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La misma consola sirve al **simulador digital** (motor en el navegador) y al **equipo real** (telemetría por MQTT y servidor).
- El equipo físico se conecta a un **pulmón de prueba**, nunca a una persona, con el responsable del equipo presente.
- El servidor tiene tres módulos: **reservas**, **telemetría** y **comandos**; solo un operador a la vez puede cambiar parámetros.
- El simulador digital ofrece VCV, PCV, PSV, CPAP y SIMV; en el equipo real solo puedes programar VCV y SIMV.
- El equipo real tiene límites más estrictos (PEEP ≤ 15, presión límite ≤ 40 cmH₂O, Vt ≤ 700 mL, FR ≤ 35 rpm, sin I:E invertido, Te ≥ 0,3 s).
- Los cambios se envían solos tras 500 ms, con validación, un comando en vuelo y estado por parámetro; existe «Deshacer último cambio».
- En modo Real la consola muestra lo que el equipo informa; las tarjetas «derivada» son cálculos del navegador.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Creer que el valor escrito ya está aplicado en el equipo** → solo cuenta lo que el equipo informa → espera «Aplicado» y compara con la pantalla del equipo.
- **Tomar los rangos del motor como recomendaciones clínicas** → son límites técnicos → elige los valores según la fisiología y las guías que estudias en el curso.
- **Hacer muchos cambios a la vez en el equipo real** → se agrupan en un solo comando y cuesta saber qué produjo cada efecto → cambia un parámetro, observa y luego sigue.
- **Esperar que el software detenga el equipo** → no hay parada de emergencia en la aplicación → ante cualquier anomalía se detiene en el equipo y se libera el control.
- **Interpretar «Equipo sin datos» como un problema del pulmón de prueba** → indica que no llega telemetría → revisa la conexión del equipo con el responsable.
- **Comparar al milímetro las curvas reales con las digitales** → el equipo real tiene ruido, latencia y valores derivados → compara tendencias, no décimas.

<!-- block: REFERENCES | Referencias -->
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- OASIS. (2019). *MQTT Version 5.0* (OASIS Standard). [https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- VentyLab. (2026). *Manual de uso* [documentación interna].
