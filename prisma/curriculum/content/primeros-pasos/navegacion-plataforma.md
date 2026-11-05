<!-- page: estructura-de-la-plataforma | THEORY | Cómo está organizada la plataforma -->
<!-- block: INTRODUCTION | Por qué conviene conocer la interfaz antes de estudiar -->
VentyLab reúne en un mismo lugar tres actividades que en la formación clínica suelen estar separadas: estudiar la teoría de la mecánica respiratoria, practicar en un ventilador (simulado o físico) y comprobar lo aprendido con evaluaciones. Las revisiones sobre educación con simulación muestran que el aprendizaje mejora cuando la práctica es deliberada, repetida, con retroalimentación y bien integrada en el currículo (Issenberg et al., 2005; Cook et al., 2011). Para que eso ocurra, primero necesitas moverte con soltura por la plataforma: saber dónde está cada herramienta te permite pasar de la lección al simulador y de vuelta sin perder el hilo de lo que estás razonando.

Esta lección no trata de fisiología; trata de orientación. Al terminarla sabrás reconocer las zonas fijas de la pantalla, qué ve cada rol, cómo editar tu perfil y cómo funcionan las notificaciones. Las siguientes lecciones del módulo profundizan en el estudio con lecciones y tutor de IA y en las evaluaciones.

<!-- block: THEORY | El menú lateral: cuatro puertas de entrada -->
En una pantalla de computador (900 px de ancho o más) la plataforma muestra un **menú lateral permanente** a la izquierda. En la parte superior aparece la marca **VentyLab**, que te lleva al simulador, y el botón **«Contraer menú»** / **«Expandir menú»**, que reduce el menú a iconos para dar más espacio al contenido; la plataforma recuerda tu elección.

Las entradas del menú son pocas a propósito:

| Entrada | Ruta | Para qué sirve |
|---|---|---|
| **Simulador Virtual** | /simulador | Espacio del simulador digital y del equipo físico (pestañas Simular Paciente, Monitoreo, Conexión y Mis sesiones). Es la página de inicio de todos los roles después de iniciar sesión. |
| **Módulo de Enseñanza** | /learn | La sección «Aprender»: currículo, lecciones y progreso. |
| **Evaluación** | /evaluations | Quizzes, talleres y exámenes asignados. |
| **Panel docente** | /teacher | Solo para docentes y administradores: un espacio propio con su propia navegación. |

La entrada **Simulador Virtual** puede mostrar un pequeño indicador del estado del ventilador físico («Equipo en línea» o «Equipo sin datos»). Ese indicador solo aparece cuando el servidor ha informado el estado; si no aparece, no significa que el equipo esté apagado, sino que todavía no hay información.

En pantallas más estrechas (teléfono o tableta vertical) el menú se oculta y queda una barra delgada con el botón **«Abrir menú de navegación»**. El simulador, sin embargo, está pensado para una pantalla amplia: con poco ancho las zonas de la consola se apilan y la propia consola recomienda usar una tableta horizontal o un computador.

![Esquema de la pantalla principal de VentyLab con el menú lateral a la izquierda, el grupo Herramientas, la tarjeta de usuario con el botón Opciones y el área de contenido a la derecha](/learning/diagrams/v1-navegacion-mapa.svg "Figura: zonas fijas de la interfaz y menú Opciones")

<!-- block: THEORY | Herramientas y tarjeta de usuario -->
Debajo de las entradas principales está el grupo **«Herramientas»**, con dos accesos que te acompañan en casi todas las pantallas:

- **Asistente de IA** (botón con la etiqueta accesible «Abrir asistente IA»): abre un panel de conversación sobre ventilación mecánica y fisiología respiratoria. No aparece dentro de las propias páginas del asistente.
- **Campana de notificaciones**: muestra un número con los avisos sin leer (por ejemplo, «Notificaciones, 3 sin leer»).

Si la conexión en tiempo real con el servidor se interrumpe, en este grupo aparece el aviso **«Sin conexión en tiempo real»**. Mientras se vea, las notificaciones nuevas y el estado del equipo pueden llegar con retraso.

Al final del menú está la **tarjeta de usuario**: tu foto o iniciales, tu nombre y un distintivo con tu rol. Al hacer clic en el nombre vas a tu perfil; el botón **«Opciones»** (los tres puntos verticales) abre un menú con tu nombre y correo, los enlaces personales y **«Cerrar sesión»**. Para los estudiantes, ese menú incluye **«Perfil»**, **«Mi resumen»**, **«Mis notas»**, **«Mis calificaciones»** y **«Mi grupo»**; para docentes y administradores, solo **«Perfil»**. Al pie del menú se ve la versión de la aplicación (por ejemplo, «VentyLab v0.1.0»), un dato útil cuando reportas un problema.

<!-- block: CALLOUT:info | La plataforma usa un tema oscuro fijo -->
La interfaz tiene un único esquema de color oscuro y no ofrece selector de tema ni de idioma: todo el contenido está en español. Las figuras de las lecciones llevan su propio fondo blanco para leerse bien sobre ese tema.

<!-- page: roles-y-espacios | THEORY | Roles y lo que ve cada uno -->
<!-- block: INTRODUCTION | Un mismo sistema, tres miradas -->
VentyLab distingue tres roles fijos. Cada persona tiene exactamente uno, y el rol decide qué entradas del menú ve, qué puede modificar y a qué datos accede. Conocer tu rol evita confusiones del tipo «a mi compañero le aparece un botón que a mí no»: casi siempre la diferencia se explica por el rol y no por un error.

<!-- block: THEORY | Los tres roles -->
| Rol (como aparece en el distintivo) | Qué hace en la plataforma |
|---|---|
| **Estudiante** | Estudia las lecciones, practica en el simulador, reserva el equipo físico, presenta evaluaciones y consulta su progreso, notas y calificaciones. |
| **Docente** | Todo lo anterior en modo de vista previa, más el **Panel docente**: estudiantes, grupos, contenido, casos clínicos, evaluaciones y calificación, laboratorio y estado del sistema. |
| **Administrador** | Lo mismo que el docente, más la sección **«Administración»** del panel: usuarios, configuración, auditoría, analítica de IA e investigación. |

El registro abierto («Crear cuenta») solo crea cuentas de **Estudiante**. Los roles de docente y administrador los asigna un administrador; si tu rol cambia, recibirás una notificación que te lleva a tu perfil.

<!-- block: THEORY | El Panel docente es un espacio aparte -->
Cuando un docente entra en **Panel docente**, la pantalla cambia de navegación: aparece un menú propio con **Dashboard**, **Estudiantes**, **Grupos**, **Contenido**, **Casos clínicos**, **Evaluaciones** y **Laboratorio**, seguido de la sección **«Administración»** (con **Estado del sistema** para todo el personal docente y el resto de opciones solo para administradores). Para regresar al resto de la plataforma está el enlace **«Volver a la plataforma»**, que lleva al simulador.

Esta separación tiene una lógica de seguridad y de foco: las tareas de gestión (publicar contenido, calificar, asignar evaluaciones) quedan agrupadas y no se mezclan con la experiencia de aprendizaje que ve el estudiante.

<!-- block: THEORY | Cómo ve el docente la sección Aprender -->
En la sección **Aprender** el docente no tiene pestañas de progreso: ve el **Currículo** en **«Vista previa»**. En ese modo nada está bloqueado, sus visitas no cuentan como progreso, los contenidos no publicados aparecen marcados como **«Borrador»** y un interruptor flotante **«Modo edición»** muestra enlaces **«Editar en el CMS»**. Esto permite revisar una lección exactamente como la verá el estudiante, sin alterar estadísticas.

<!-- block: THEORY | Los espacios personales del estudiante -->
Desde el menú **«Opciones»** el estudiante llega a sus espacios personales:

- **Mi resumen** (/me, titulado «Mi espacio»): un tablero con «Continuar donde quedaste», progreso de aprendizaje, evaluaciones, últimas calificaciones, notas, conversaciones con la IA, sesiones de simulación, reservas del ventilador y el número de notificaciones sin leer.
- **Mis notas**: todas las notas que tomaste en las lecciones, con búsqueda y filtros.
- **Mis calificaciones**: una tabla con las notas ya publicadas de quizzes, talleres y exámenes.
- **Mi grupo**: consulta de tu grupo de estudiantes, su líder y los grupos docentes que lo supervisan. Es solo lectura.

<!-- block: CALLOUT:tip | Ubica tu rol de un vistazo -->
Si no estás seguro de tu rol, mira el distintivo de la tarjeta de usuario («Estudiante», «Docente» o «Administrador»). En tu perfil también aparece, en la sección «Datos de la cuenta», junto con el estado activo o inactivo de la cuenta.

<!-- page: perfil-y-notificaciones | CASE_STUDY | Recorrido guiado: tu primer ingreso -->
<!-- block: CASE_STUDY | Ejemplo guiado: primer día de una residente -->
Laura es residente de medicina interna y empieza la rotación de cuidado intensivo. Su coordinadora le pidió crear una cuenta en VentyLab antes de la primera sesión práctica. Sigue con ella el recorrido.

#### Paso 1. Crear la cuenta e iniciar sesión

En la pantalla **«Iniciar sesión»** («Accede a tu plataforma de aprendizaje de ventilación mecánica») Laura tiene dos caminos: el botón de Google, que aparece primero, o el formulario **«o con tu correo»** con **«Correo electrónico»** y **«Contraseña»**. Como aún no tiene cuenta, pulsa **«¿No tienes cuenta? Regístrate»** y completa **«Nombre completo»**, **«Correo electrónico»**, **«Contraseña»** y **«Confirmar contraseña»**. Al crear la cuenta, la plataforma inicia la sesión sola y la lleva al **Simulador Virtual**, la página de inicio de todos los roles.

Si algún día la sesión caduca, la plataforma la devuelve al inicio de sesión con el aviso «Tu sesión expiró. Inicia sesión de nuevo para continuar.».

#### Paso 2. Completar el perfil

Laura abre **«Opciones» → «Perfil»**. La página **«Mi perfil»** tiene dos pestañas:

1. **«Información personal»**: con **«Cambiar foto»** sube una imagen (PNG, JPEG o WebP), que se recorta en un cuadrado y se guarda de inmediato; **«Quitar foto»** la elimina. El único texto editable es el nombre, que se guarda con **«Guardar cambios»**. La sección **«Datos de la cuenta»** muestra, sin permitir cambios, el correo, el rol y el estado de la cuenta.
2. **«Cambiar contraseña»**: pide la contraseña actual, la nueva y su confirmación, y muestra en vivo una lista de requisitos (entre 8 y 128 caracteres, al menos una minúscula, una mayúscula y un número). Quien entra con Google ve el mensaje «Tu cuenta usa Google; la contraseña se gestiona en Google.».

#### Paso 3. Revisar las notificaciones

Al día siguiente, la campana muestra un 1. Laura la abre: la ventana emergente lista los avisos más recientes. Un clic sobre un aviso lo marca como leído y la lleva a su destino. Los avisos que recibe la plataforma son de evaluaciones (nueva evaluación asignada, calificación publicada, retroalimentación disponible, intento habilitado de nuevo), de reservas del ventilador (reserva cancelada o desplazada por un docente), del equipo físico (equipo sin conexión) y de la cuenta (cambio de rol).

En **«Ver todas»** llega a la página **«Notificaciones»** («Avisos de tus evaluaciones, reservas del ventilador y tu cuenta.»), con el filtro **«Solo no leídas»**, el botón **«Marcar todas como leídas»** y, en cada aviso, **«Marcar como leída»** y **«Eliminar»** (con confirmación).

Las notificaciones nuevas también aparecen como un aviso breve en pantalla, excepto mientras presentas un examen, una simulación de examen o mientras operas la consola del equipo real: en esos momentos la plataforma evita distraerte.

<!-- block: EXERCISE | Comprueba tu orientación -->
1. **Después de iniciar sesión, ¿a qué pantalla llegas?** Respuesta: al **Simulador Virtual** (/simulador), que es la página de inicio de los tres roles.
2. **Un compañero dice que no encuentra «Mis calificaciones» en el menú lateral. ¿Dónde está?** Respuesta: en el menú **«Opciones»** de la tarjeta de usuario, y solo para el rol Estudiante.
3. **Quieres cambiar tu correo electrónico desde el perfil. ¿Puedes?** Respuesta: no; el correo se muestra como dato de la cuenta y solo es editable el nombre. Debes pedir el cambio a un administrador.
4. **Olvidaste tu contraseña. ¿Qué haces?** Respuesta: la recuperación automática todavía no está disponible; la pantalla indica entrar con Google (si tu cuenta lo permite) o contactar al administrador para restablecerla.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El menú lateral tiene cuatro entradas: **Simulador Virtual**, **Módulo de Enseñanza**, **Evaluación** y, solo para docentes y administradores, **Panel docente**.
- Después de iniciar sesión, todos los roles llegan al **Simulador Virtual**.
- El grupo **«Herramientas»** reúne el asistente de IA y la campana de notificaciones; el aviso «Sin conexión en tiempo real» indica que los datos en vivo pueden retrasarse.
- El menú **«Opciones»** de la tarjeta de usuario contiene el perfil, los espacios personales del estudiante y **«Cerrar sesión»**.
- Hay tres roles fijos (**Estudiante**, **Docente**, **Administrador**); el registro abierto solo crea estudiantes.
- En el perfil solo editas el nombre, la foto y la contraseña; no hay preferencias de tema ni de idioma.
- Las notificaciones te llevan directamente a la evaluación, reserva o pantalla relacionada, y se silencian durante exámenes y operación del equipo real.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Buscar los espacios personales en el menú lateral** → ya no están ahí → ábrelos desde **«Opciones»** en la tarjeta de usuario.
- **Pensar que la ausencia del indicador del equipo significa que está apagado** → el indicador solo aparece cuando el servidor ha informado un estado → revisa la pestaña Conexión del simulador si necesitas saberlo.
- **Usar el simulador en un teléfono vertical** → la consola apila sus zonas y las curvas pierden detalle → usa un computador o una tableta horizontal.
- **Ignorar el aviso «Sin conexión en tiempo real»** → las notificaciones y la telemetría pueden llegar tarde → recarga la página o revisa tu red antes de una práctica con el equipo.
- **Compartir tu cuenta con un compañero** → el progreso, las reservas y las calificaciones son personales y quedan auditados → cada persona debe tener su propia cuenta.

<!-- block: REFERENCES | Referencias -->
- Cook, D. A., Hatala, R., Brydges, R., Zendejas, B., Szostek, J. H., Wang, A. T., Erwin, P. J., & Hamstra, S. J. (2011). Technology-enhanced simulation for health professions education: A systematic review and meta-analysis. *JAMA, 306*(9), 978-988. [https://doi.org/10.1001/jama.2011.1234](https://doi.org/10.1001/jama.2011.1234)
- Issenberg, S. B., McGaghie, W. C., Petrusa, E. R., Gordon, D. L., & Scalese, R. J. (2005). Features and uses of high-fidelity medical simulations that lead to effective learning: A BEME systematic review. *Medical Teacher, 27*(1), 10-28. [https://doi.org/10.1080/01421590500046924](https://doi.org/10.1080/01421590500046924)
- VentyLab. (2026). *Manual de uso* [documentación interna].
