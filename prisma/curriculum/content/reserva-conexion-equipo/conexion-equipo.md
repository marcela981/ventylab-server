<!-- page: como-llega-la-senal | THEORY | Cómo llegan los datos del equipo a tu pantalla -->
<!-- block: INTRODUCTION | Operar a distancia exige entender el camino -->
Cuando operas el ventilador físico desde VentyLab, entre tu clic y el equipo hay varios saltos: tu navegador, el servidor, un sistema de mensajería y el propio ventilador. Cada salto puede retrasar o perder un dato. Entender ese camino es lo que te permite interpretar bien lo que ves: si una curva se congela, si un cambio tarda en reflejarse o si aparece «Equipo sin datos», necesitas saber dónde pudo estar el problema antes de decidir qué hacer.

El equipo físico de VentyLab se usa para enseñanza. Según el protocolo de prueba del proyecto, el ventilador se conecta a un **pulmón de prueba** (un simulador pulmonar mecánico), **nunca a una persona ni a un animal** (VentyLab, 2026). Todo lo que aprendas en esta lección parte de ese supuesto; la lección «Salvaguardas, rangos seguros y respuesta ante fallas» desarrolla sus consecuencias.

<!-- block: THEORY | La arquitectura en cuatro piezas -->
- **El equipo físico.** El ventilador de la universidad, conectado al pulmón de prueba, publica su telemetría (presión, flujo, volumen y alarmas) y recibe comandos.
- **El broker MQTT.** Un sistema de mensajería ligero por el que el equipo y el servidor intercambian mensajes. La tarjeta de conexión lo menciona: el canal de datos en vivo se establece «a través del servidor (broker MQTT vía WebSocket)».
- **El servidor VentyLab.** Es la única puerta hacia el equipo. Decide quién recibe la telemetría (quienes tienen la reserva activa y el personal docente), quién puede operar y qué comandos se publican. Revisa cada comando antes de enviarlo y nunca envía uno por su cuenta.
- **Tu navegador.** Recibe la telemetría por WebSocket y la dibuja en la pestaña **Monitoreo**, modo **Real**. Tus cambios salen hacia el servidor como solicitudes, no directamente hacia el equipo.

![Esquema con cuatro cajas: equipo físico con pulmón de prueba, broker MQTT, servidor y navegador; la telemetría viaja hacia el navegador y los comandos del operador vuelven al equipo solo después de que el servidor valida reserva, control y rangos](/learning/diagrams/v5-conexion-arquitectura.svg "Figura: camino de la telemetría y de los comandos")

<!-- block: THEORY | Latencia y frescura de los datos -->
En la franja superior de la vista Real ves dos indicadores:

- **Latencia**: el retraso de la telemetría medido con el reloj del servidor, en la forma «N ms · p95 M ms», donde p95 es el valor que el 95 % de las muestras de la sesión no supera. Se acompaña de un semáforo: verde por debajo de 70 ms, amarillo entre 70 y 99 ms y rojo desde 100 ms. Si los relojes no están sincronizados, verás «— (reloj sin sincronizar)».
- **Equipo**: «En línea» mientras llegan datos o «Sin datos» cuando dejan de llegar.

Si pasan más de 2 segundos sin telemetría (valor por defecto configurable), la plataforma declara «Equipo sin datos»: las curvas se muestran grises y congeladas, y los controles se bloquean hasta que vuelvan los datos. Es una decisión deliberada: operar sobre datos viejos es operar a ciegas.

<!-- block: CALLOUT:info | Lo que ves es lo que informa el equipo -->
En modo Real, los valores de la consola son los que el equipo reporta. Un cambio tuyo se considera hecho cuando el equipo lo informa, no cuando pulsas el control. Por eso la consola real tiene estados por parámetro que el simulador digital no necesita.

Ten presente también que los ventiladores de uso clínico se rigen por una norma internacional específica de seguridad básica y desempeño esencial (International Organization for Standardization, 2020). La consola web de VentyLab es una herramienta docente para operar a distancia un equipo con pulmón de prueba; no es la interfaz de un ventilador clínico ni sustituye sus controles locales.

<!-- page: estados-de-la-conexion | THEORY | La pestaña Conexión y el control del equipo -->
<!-- block: THEORY | Dos tarjetas, dos pasos -->
La pestaña **Conexión** del **Simulador Virtual** tiene dos tarjetas que siguen el orden lógico del trabajo:

1. **1. Reserva del ventilador**: muestra la **Reserva:** activa y los botones **Reservar ahora**, **Liberar** y **Ver calendario** (lección «Reservar el equipo físico»).
2. **2. Conexión con el ventilador**: «Con la reserva activa, establece el canal de datos en vivo con el ventilador de la universidad a través del servidor (broker MQTT vía WebSocket).». Muestra el **Estado:**, el **Servidor (broker):** («En línea» o «Sin conexión»), el **Control:** y los botones **Conectar** y **Desconectar**.

<!-- block: THEORY | Los estados de la conexión -->
El indicador de estado usa siete valores, cada uno con su mensaje:

| Estado | Mensaje | Qué puedes hacer |
|---|---|---|
| **Sin reserva** | «Necesitas una reserva activa para conectar al ventilador.» | Reservar |
| **Reservando…** | «Procesando la reserva…» | Esperar |
| **Reservado** | «Ventilador reservado. Ya puedes conectar.» | **Conectar** o **Liberar** |
| **Conectando…** | «Conectando con el ventilador…» | Esperar |
| **Conectado** | «Conectado al ventilador.» | Ir a **Monitoreo**, **Desconectar** |
| **Desconectado** | «Desconectado. Se conserva la reserva: puedes volver a conectar.» | **Conectar** de nuevo |
| **Error** | El mensaje del servidor | Leerlo y corregir |

La diferencia entre **Desconectar** y **Liberar** es importante: desconectar cierra tu canal de datos, pero la reserva sigue siendo tuya; liberar termina la reserva y el equipo queda para la siguiente persona.

![Máquina de estados de la pestaña Conexión: Sin reserva, Reservando, Reservado, Conectando, Conectado, Desconectado y Error, con las acciones Reservar ahora, Conectar, Desconectar y Liberar](/learning/diagrams/v5-conexion-estados.svg "Figura: estados de la conexión con el ventilador físico")

<!-- block: THEORY | El control exclusivo -->
Estar conectado no significa operar. El equipo tiene un **control exclusivo**: una sola persona a la vez puede enviar cambios. La barra de control de la vista Real muestra quién lo tiene: «Controlas el equipo», «Opera: …» o «Control libre», con los botones **Tomar control**, **Quitar control** y **Liberar control**.

- Puede **tomar** el control libre quien tiene la reserva activa (o el líder del grupo titular), un docente o la administración.
- **Quitar control** a otra persona solo pueden hacerlo el líder del grupo titular, un docente o la administración. La plataforma lo confirma con «¿Quitar el control?» y avisa que la acción queda registrada.
- Si no tienes el control, ves la consola en solo lectura: «Solo lectura: no tienes el control del equipo.».

Si cierras todas las pestañas mientras operas, el servidor espera 15 segundos (valor por defecto configurable) antes de liberar tu control por ausencia; si vuelves antes, lo conservas.

<!-- page: operar-con-envio-automatico | THEORY | Operar el equipo con envío automático -->
<!-- block: THEORY | La vista Real del Monitoreo -->
Con el estado **Conectado**, ve a la pestaña **Monitoreo** y elige **Real** en **Modo del monitor**. Si todavía no llegan datos, verás «Conectado al ventilador físico. Esperando datos del ventilador físico...». Cuando llegan, aparece la consola con las curvas, el monitor numérico, la barra de alarmas y los controles. En la columna izquierda ves el estado **Reserva activa**; en la franja superior, «Ventilador físico», **Equipo**, **Latencia**, la barra de control y, si tienes el derecho de control, **Grabar sesión**.

La barra de alarmas reúne dos orígenes: las alarmas que informa el propio equipo (por ejemplo «Presión alta», «Volumen bajo», «Apnea», «Desconexión», «Falla de energía» o «Falla técnica») y las que calcula la consola con los límites que ajustas en su panel de alarmas («Presión pico alta», «Volumen corriente bajo», «Volumen corriente alto», «Frecuencia respiratoria alta»). Ajusta esos límites con sentido: cuando la mayoría de las alarmas no exige ninguna acción, quienes las escuchan se desensibilizan y terminan ignorando también las importantes (Cvach, 2012).

<!-- block: THEORY | Cómo se envían tus cambios -->
El equipo de desarrollo está cambiando la consola para que los parámetros se **apliquen automáticamente**, sin un botón de confirmar ni el diálogo de resumen «Enviar al ventilador». En el modo Real, el envío automático tiene salvaguardas:

1. **Espera de unos 500 ms** después de tu último cambio. Si mueves varios controles seguidos, salen juntos en un solo comando.
2. **Validación del rango seguro** antes de enviar. Un valor fuera de rango nunca se envía: el control muestra «Rechazado» y vuelve al último valor aplicado.
3. **Un comando en vuelo a la vez.** Mientras uno está pendiente, los cambios nuevos se acumulan y gana el último valor de cada parámetro.
4. **Estado por parámetro** junto a cada control: **Enviando**, **Aplicado** o **Rechazado** (con el motivo).
5. **Deshacer último cambio**, un botón de la columna izquierda que reenvía los valores anteriores por el mismo camino y con la misma validación.

El servidor vuelve a validar todo (reserva activa, control, frecuencia de envío, rangos y coherencia de tiempos) y solo entonces publica el comando. Los detalles de estos límites están en la lección de seguridad.

<!-- block: THEORY | Comandos recientes -->
Debajo de las curvas, **Comandos recientes** lista lo que se envió en tu reserva con su estado detallado: «Enviando», «Esperando confirmación del equipo», «Aceptado por el equipo», «Aplicado por el equipo», «Rechazado por el equipo» o «Sin confirmación del equipo», con la latencia. Si el equipo informa un valor distinto del que pediste (por ejemplo, porque alguien lo cambió en el propio equipo), puedes usar **Usar los valores que informa el equipo** para seguir trabajando desde lo que el equipo realmente tiene.

<!-- block: THEORY | Grabar la sesión -->
Si tienes el derecho de control, **Grabar sesión** guarda la telemetría. Una marca REC aparece mientras esta pestaña graba, y la grabación se detiene sola al final de la reserva. Las grabaciones aparecen después en **Mis sesiones** como **Equipo real**, con **Reproducir**.

<!-- page: recorrido-primera-conexion | CASE_STUDY | Recorrido: tu primera conexión -->
<!-- block: CASE_STUDY | Ejemplo: de la reserva al primer cambio -->
Tienes una reserva a tu nombre de 10:00 a 10:30 para observar la relación entre PEEP y presión pico en VCV sobre el pulmón de prueba, junto con el custodio del equipo.

**Paso 1. Conectar.** A las 10:00 entra a **Conexión**. La primera tarjeta dice «Activa · 30 min restantes» y el estado es **Reservado**. Pulsa **Conectar**: pasas por «Conectando…» y llegas a **Conectado**. Comprueba que **Servidor (broker):** diga «En línea».

**Paso 2. Ir al monitor.** En **Monitoreo**, elige **Real**. Espera a que el **Equipo** diga «En línea» y revisa la **Latencia**: si está en verde, la telemetría llega con poco retraso.

**Paso 3. Tomar el control.** Si la barra dice «Control libre», pulsa **Tomar control**. Ahora ves «Controlas el equipo» y los controles se habilitan.

**Paso 4. Leer antes de tocar.** Observa los valores que informa el equipo y las curvas durante varios ciclos. Acuerda con el custodio el cambio que vas a hacer.

**Paso 5. Un solo cambio.** Sube la PEEP un paso. Junto al control verás «Enviando» y luego «Aplicado» cuando el equipo lo informe. En **Comandos recientes** aparece la línea con su latencia. Observa cómo la presión de base y la presión pico suben.

**Paso 6. Interpretar con calma.** Si el estado se queda en «Enviando» o termina en «Sin confirmación del equipo», no repitas el cambio: mira los valores que informa el equipo y la línea de **Comandos recientes**. El cambio pudo haberse aplicado aunque la confirmación no llegara a tiempo. Si el valor informado difiere del que pediste, conversa con el custodio antes de seguir.

**Paso 7. Cerrar ordenadamente.** Devuelve el equipo a los ajustes acordados, pulsa **Liberar control**, luego **Desconectar** y, si terminaste antes de tiempo, **Liberar** la reserva.

<!-- block: EXERCISE | Preguntas -->
1. **Estás en Conectado, pero los controles siguen grises. ¿Qué revisas?** Respuesta: si tienes el control (barra de control) y si el equipo envía datos («Equipo sin datos» bloquea los controles).
2. **Pulsaste Desconectar por error. ¿Perdiste la reserva?** Respuesta: no. El estado es **Desconectado** y «Se conserva la reserva: puedes volver a conectar.».
3. **Mueves tres controles en un segundo. ¿Cuántos comandos salen?** Respuesta: uno, con los tres valores, unos 500 ms después del último cambio.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El equipo físico trabaja con un pulmón de prueba, nunca con una persona; el servidor es la única puerta hacia él.
- La telemetría viaja del equipo al broker MQTT, al servidor y por WebSocket a tu navegador; tus cambios hacen el camino inverso, validados.
- La pestaña **Conexión** tiene dos pasos: reserva y conexión; **Desconectar** conserva la reserva, **Liberar** la termina.
- Conectado no es operar: el **control exclusivo** lo tiene una sola persona.
- Sin datos frescos la consola se bloquea: «Equipo sin datos».
- El envío automático espera unos 500 ms, valida rangos, mantiene un comando en vuelo y muestra **Enviando**, **Aplicado** o **Rechazado**; **Deshacer último cambio** revierte por el mismo camino.
- **Comandos recientes** y **Grabar sesión** te dejan trazabilidad de lo que hiciste.
- Las alarmas tienen dos orígenes, el equipo y los límites de la consola; ajústalos con sentido para no entrenar la fatiga por alarmas (Cvach, 2012).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Confundir Desconectar con Liberar** → bloqueas el equipo o pierdes tu turno → desconecta para pausar, libera para terminar.
- **Cambiar parámetros sin mirar la latencia ni el estado del equipo** → actúas sobre datos viejos → confirma «En línea» y una latencia aceptable.
- **Dar por hecho un cambio al mover el control** → el equipo puede no haberlo aplicado → espera **Aplicado** o revisa **Comandos recientes**.
- **Mover muchos controles a la vez** → no sabes qué produjo cada efecto → cambia un parámetro por vez, como pide el protocolo del equipo.
- **Quitar el control a otra persona sin acordarlo** → interrumpes su práctica y queda registrado → coordina antes con tu grupo o tu docente.
- **Repetir un cambio que quedó «Sin confirmación del equipo»** → puedes duplicar su efecto → revisa primero los valores que informa el equipo.
- **Fijar límites de alarma tan estrechos que suenan sin parar** → el grupo deja de prestarles atención → elige límites que señalen un cambio real (Cvach, 2012).

<!-- block: REFERENCES | Referencias -->
- Cvach, M. (2012). Monitor alarm fatigue: An integrative review. *Biomedical Instrumentation & Technology, 46*(4), 268–277. [https://doi.org/10.2345/0899-8205-46.4.268](https://doi.org/10.2345/0899-8205-46.4.268)
- International Organization for Standardization. (2020). *Medical electrical equipment — Part 2-12: Particular requirements for basic safety and essential performance of critical care ventilators* (ISO Standard No. 80601-2-12:2020). [https://www.iso.org/standard/72069.html](https://www.iso.org/standard/72069.html)
- VentyLab. (2026). *Manual de uso* [documentación interna].
