<!-- page: un-recurso-compartido | THEORY | Un equipo, muchas personas -->
<!-- block: INTRODUCTION | Por qué hay que reservar -->
VentyLab no solo tiene un simulador digital: también da acceso, a través del navegador, a un **ventilador físico** de la universidad. Practicar con un equipo real añade algo que el simulador no ofrece: la latencia de la telemetría, el comportamiento de un circuito de verdad y la responsabilidad de que cada cambio llegue a una máquina. Pero el equipo es uno solo. La descripción de la tarjeta de reserva lo dice sin rodeos: «El ventilador físico es un recurso único compartido. Reserva un turno antes de conectar; recuerda liberarlo al terminar para que otros estudiantes puedan usarlo.».

La reserva resuelve tres problemas a la vez. Garantiza que en cada momento haya **una sola reserva activa**, así que nadie cambia los parámetros del equipo mientras otra persona practica. Permite **planear**: la práctica con simulación es más útil cuando está integrada en el currículo y se programa con intención, no cuando se improvisa (Issenberg et al., 2005). Y deja un **registro** de quién usó el equipo y cuándo, que el personal docente necesita para organizar las prácticas.

<!-- block: THEORY | Las reglas del calendario -->
Las reglas de la reserva no están fijas en el código: las configura la administración de la plataforma, y la página del calendario te las muestra siempre en una línea como «Franjas de 15 min · duración máxima 2 h · reservas con hasta 14 días de antelación.». Con la configuración por defecto (VentyLab, 2026):

| Regla | Valor por defecto |
|---|---|
| Tamaño de la franja | 15 minutos |
| Duración máxima de una reserva | 120 minutos |
| Antelación máxima | 14 días |
| Reservas próximas por estudiante | 3 |
| Reservas próximas por grupo | 5 |
| Duraciones de «Reservar ahora» | 15, 30, 45 o 60 minutos |

Todas las horas se muestran en **horario de Bogotá**, sin importar la zona horaria de tu computador. Tenlo en cuenta si te conectas desde otro país.

Una reserva empieza y termina en el borde de una franja. Por eso, si eliges una franja a las 8:15 con una duración de 30 minutos, la reserva irá de 8:15 a 8:45. El sistema solo te ofrece duraciones que caben antes de la siguiente reserva y dentro del máximo.

![Esquema del calendario de reservas con celdas Pasado, Ocupado y Reservar, y los dos caminos para reservar: Reservar ahora desde Conexión o una franja libre desde Ver calendario, ambos terminan en Mis reservas](/learning/diagrams/v5-reserva-calendario.svg "Figura: dos caminos para reservar el ventilador físico")

<!-- block: THEORY | Privacidad en el calendario -->
Cuando miras el calendario como estudiante, una franja tomada por otra persona aparece como **Ocupado**, con un texto genérico como «Reservado por un estudiante» o «Reservado por un docente». Nunca ves el nombre de otra persona. El personal docente y la administración sí ven quién tiene cada reserva, porque lo necesitan para coordinar las clases prácticas.

<!-- page: reservar-paso-a-paso | THEORY | Reservar paso a paso -->
<!-- block: THEORY | Camino 1: Reservar ahora -->
Si el equipo está libre y quieres practicar ya, entra a **Simulador Virtual**, pestaña **Conexión**. La primera tarjeta, **1. Reserva del ventilador**, muestra la línea **Reserva:** con el estado actual: **Disponible**, «Activa · N min restantes» si la reserva es tuya o de tu grupo, o «Reservado por …» si es de otra persona.

Pulsa **Reservar ahora**. El diálogo muestra la ventana «Desde ahora · …» y te pide:

1. **Duración**: 15, 30, 45 o 60 minutos (30 por defecto).
2. **Propósito (opcional)**: una frase sobre lo que vas a practicar. Ayuda a tu docente y a ti mismo a darle sentido a la sesión.
3. **Para**: **Para mí** o, si lideras o supervisas un grupo, **Para mi grupo**.

El diálogo te recuerda: «Recuerda liberar la reserva cuando termines para que otros estudiantes puedan usar el equipo.». Al confirmar con **Reservar ahora**, el estado de la conexión pasa por «Reservando…» y llega a «Reservado. Ya puedes conectar.».

<!-- block: THEORY | Camino 2: elegir una franja en el calendario -->
Para planear una práctica futura, pulsa **Ver calendario** en la misma tarjeta. Se abre **Reservas del ventilador**: «Elige una franja libre para reservar el ventilador físico. Horario de Bogotá.».

- Cambia la vista entre **Semana** (por defecto) y **Día**, y navega con **Semana anterior**, **Hoy** y **Semana siguiente** (o sus equivalentes por día).
- La **Leyenda** distingue cuatro tipos de celda: **Libre**, **Ocupado**, **Pasado** y **Fuera de la ventana de reserva**.
- Cada franja libre tiene un botón «Reservar 8:15» (con su hora). Al pulsarlo se abre el diálogo **Reservar el ventilador**.

En ese diálogo respondes **¿Para quién es la reserva?**: **Para mí** («La reserva queda a tu nombre.»), **Para un grupo** (eliges el **Grupo** entre los que lideras o supervisas) o, solo para la administración, **Para otro usuario**. Después eliges la **Duración** entre las que caben desde esa franja, escribes el **Propósito (opcional)** (hasta 500 caracteres) y pulsas **Reservar**. Si todo va bien, la página muestra «Reserva creada.».

<!-- block: THEORY | Cuando la reserva no se puede crear -->
Si algo impide la reserva, el diálogo sigue abierto y te dice el motivo en español. Los más frecuentes son:

- «Ya tienes el máximo de reservas próximas permitido. Cancela una o espera a que termine para reservar otra.»
- «Esa franja está fuera de la ventana de reserva: solo puedes reservar con hasta 14 días de antelación.»
- «Esa franja ya pasó. Elige la franja en curso o una futura.»
- «La franja se solapa con otra reserva. Elige otra franja o una duración menor.»
- «La reserva no puede durar más de 2 h.»

Ninguno de estos mensajes indica un fallo técnico: son las reglas del recurso compartido. Lee el mensaje y ajusta la franja o la duración.

<!-- block: CALLOUT:tip | Reserva con margen -->
Si tu práctica incluye preparar el equipo con el custodio, explicar el caso a tu grupo o revisar la grabación, reserva una duración que lo cubra. Terminar a mitad de una tarea porque la reserva expiró corta justo la parte de reflexión, y la retroalimentación sobre lo practicado es lo que hace rendir la práctica deliberada (McGaghie et al., 2011).

<!-- page: grupos-cancelacion-desplazamiento | THEORY | Grupos, cancelación y desplazamiento -->
<!-- block: THEORY | Reservas de grupo -->
Una reserva puede pertenecer a una persona o a un **grupo**. En una reserva de grupo, todos sus miembros pueden conectarse y ver la telemetría, pero **solo el líder del grupo opera el ventilador**. La tarjeta de conexión se lo dice a los demás: «Observas el equipo: solo el líder del grupo puede operarlo.». Esta regla evita que varias manos cambien los parámetros a la vez y obliga a una dinámica de equipo: uno ejecuta y los demás observan, anotan y proponen. El personal docente ve en **Próximas reservas** del panel docente que, en una reserva de grupo, «Opera el ventilador el líder del grupo.».

<!-- block: THEORY | Mis reservas y la cancelación -->
Debajo del calendario está **Mis reservas**: «Tus reservas y las de tu grupo cuya franja todavía no termina. Horario de Bogotá.». Se divide en **Próximas** (la que está ocurriendo aparece como «En curso») y **Anteriores** (canceladas, desplazadas o finalizadas). Cada reserva muestra su ventana, su titular, el **Propósito** y su estado: **Programada**, **Cancelada**, **Desplazada** o **Finalizada**.

Si ya no vas a usar una franja, pulsa **Cancelar**. La plataforma te pide confirmar en **¿Cancelar la reserva?** y te explica la consecuencia según el caso:

- Una reserva futura: «La franja quedará libre para otras personas.»
- Una reserva en curso: «La reserva está en curso: al cancelarla termina la sesión y se libera el ventilador.»
- Una reserva de grupo: «Es una reserva del grupo …: se cancela para todo el grupo.»

Pueden cancelar quien creó la reserva, su titular, el líder del grupo titular, un docente que supervise ese grupo o la administración. En la pestaña **Conexión**, **Liberar** hace lo mismo con la reserva activa: la termina para que el equipo quede disponible.

<!-- block: THEORY | Desplazamiento por el personal docente -->
Un docente o la administración pueden necesitar el equipo para una clase o una prueba técnica. Por eso pueden reservar sobre una franja ocupada: el diálogo **Desplazar reservas** lista las **Reservas que se desplazarán**, permite elegir a quién se asigna la nueva reserva (**Asignarme a mí** o **Asignar a un grupo**) y se confirma con **Desplazar y reservar**. Un docente no puede desplazar la reserva de otro docente o de la administración: eso solo lo puede hacer la administración.

Si tu reserva es desplazada, recibes un aviso como «Tu reserva del ventilador (…) fue desplazada por un docente o administrador.», con el motivo cuando lo hay. En **Mis reservas** la verás como **Desplazada**, con el «Motivo del desplazamiento». Si estabas operando, el control del equipo se libera de inmediato y la consola pasa a solo lectura (lo verás en la lección «Conectar y operar el equipo real»).

<!-- page: recorrido-planear-practica | CASE_STUDY | Recorrido: planear una práctica de grupo -->
<!-- block: CASE_STUDY | Ejemplo: tu grupo quiere practicar el jueves -->
Lideras un grupo de cuatro estudiantes que quiere comparar, en el equipo real, cómo cambia la presión pico al subir el volumen corriente sobre el pulmón de prueba. Quieren hacerlo el jueves a las 10:00.

**Paso 1. Revisar el calendario.** En **Conexión**, pulsa **Ver calendario**. Navega con **Semana siguiente** si hace falta y ubica el jueves. Comprueba en la **Leyenda** que las franjas de 10:00 a 10:45 están **Libre**.

**Paso 2. Crear la reserva para el grupo.** Pulsa «Reservar 10:00». En **¿Para quién es la reserva?** elige **Para un grupo** y selecciona tu grupo. En **Duración**, elige 45 minutos: 30 para la práctica y 15 para revisar la grabación juntos. En **Propósito (opcional)** escribe «Relación volumen corriente y presión pico en VCV». Pulsa **Reservar** y espera «Reserva creada.».

**Paso 3. Repartir los papeles.** Como líder, serás quien opere. Asigna a los demás la observación de las curvas, el registro de los valores y el control del tiempo.

**Paso 4. El día de la práctica.** A las 10:00, la tarjeta **1. Reserva del ventilador** muestra «Activa · 45 min restantes». Conecta (siguiente lección) y, al terminar, pulsa **Liberar** si sobra tiempo.

**Paso 5. Si algo cambia.** Si el miércoles el grupo decide no ir, entra a **Mis reservas** y pulsa **Cancelar**: el diálogo te advierte que se cancela para todo el grupo.

**Paso 6. Si un docente necesita el equipo.** Supón que el jueves a las 9:30 recibes el aviso de que tu reserva fue desplazada por un docente, con el motivo «Mantenimiento del equipo». En **Mis reservas** la ves como **Desplazada**. No es un castigo ni un error: el personal docente puede necesitar el equipo para una clase o una revisión técnica. Vuelve al calendario, busca otra franja libre con tu grupo y crea una reserva nueva.

<!-- block: EXERCISE | Preguntas -->
1. **Intentas crear tu cuarta reserva próxima y aparece un mensaje de límite. ¿Es un error del sistema?** Respuesta: no. Con la configuración por defecto cada estudiante puede tener hasta 3 reservas próximas; cancela una o espera a que termine.
2. **Un compañero del grupo se conecta durante la reserva de grupo. ¿Puede cambiar la PEEP?** Respuesta: no; observa el equipo. Solo el líder del grupo opera.
3. **Ves una franja como «Ocupado» y quieres saber quién la tiene. ¿Dónde lo consultas?** Respuesta: como estudiante no puedes verlo; el calendario protege la identidad de las demás personas. Si necesitas coordinar, habla con tu docente.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El ventilador físico es un recurso único: solo hay una reserva activa a la vez.
- Hay dos caminos: **Reservar ahora** en la pestaña **Conexión** y una franja libre en **Ver calendario**.
- Las reglas (franja, duración máxima, antelación, límites por persona y grupo) las configura la administración y se muestran en el calendario; todas las horas son de Bogotá.
- En una reserva de grupo todos observan, pero solo el líder opera.
- **Mis reservas** muestra las próximas y las anteriores; **Cancelar** y **Liberar** dejan la franja libre.
- El personal docente puede desplazar reservas con aviso y motivo; si estabas operando, pierdes el control.
- Una práctica planeada, con propósito y tiempo para revisar, aprovecha mejor la simulación (Issenberg et al., 2005).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **No liberar al terminar** → el equipo queda bloqueado hasta el fin de la franja → pulsa **Liberar** en cuanto acabes.
- **Reservar el tiempo justo** → la reserva termina antes de revisar → incluye minutos para la preparación y la revisión.
- **Olvidar la zona horaria** → llegas una hora tarde o temprano → recuerda que todo está en horario de Bogotá.
- **Cancelar una reserva de grupo sin avisar** → se cancela para todos → acuerda la cancelación con tu grupo antes.
- **Esperar operar en una reserva de grupo sin ser líder** → solo observarás → pide a tu líder que reserve para ti, o reserva a tu nombre.
- **Acaparar franjas «por si acaso»** → agotas tu límite de reservas próximas y bloqueas a otras personas → reserva solo lo que vas a usar y cancela lo que no.
- **Leer un mensaje de regla como un fallo técnico** → reintentas lo mismo sin éxito → lee el motivo (límite, antelación, solapamiento, duración) y ajusta la franja.

<!-- block: REFERENCES | Referencias -->
- Issenberg, S. B., McGaghie, W. C., Petrusa, E. R., Gordon, D. L., & Scalese, R. J. (2005). Features and uses of high-fidelity medical simulations that lead to effective learning: A BEME systematic review. *Medical Teacher, 27*(1), 10–28. [https://doi.org/10.1080/01421590500046924](https://doi.org/10.1080/01421590500046924)
- McGaghie, W. C., Issenberg, S. B., Cohen, E. R., Barsuk, J. H., & Wayne, D. B. (2011). Does simulation-based medical education with deliberate practice yield better results than traditional clinical education? A meta-analytic comparative review of the evidence. *Academic Medicine, 86*(6), 706–711. [https://doi.org/10.1097/ACM.0b013e318217e119](https://doi.org/10.1097/ACM.0b013e318217e119)
- VentyLab. (2026). *Manual de uso* [documentación interna].
