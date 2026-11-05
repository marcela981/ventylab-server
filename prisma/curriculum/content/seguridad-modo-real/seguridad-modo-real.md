<!-- page: principios-y-responsabilidades | THEORY | Principios y responsabilidades -->
<!-- block: INTRODUCTION | Un equipo real merece reglas reales -->
En el simulador digital, un error se corrige con un clic y el único «paciente» es un modelo matemático. En el modo real, tus decisiones mueven una máquina de verdad. Aunque el ventilador de VentyLab trabaja sobre un pulmón de prueba y no sobre una persona, las conductas que practicas aquí son las mismas que usarás en un servicio clínico: verificar antes de actuar, cambiar una cosa a la vez, saber detener el equipo y responder con orden cuando algo falla. Esta lección reúne las salvaguardas que la plataforma te ofrece y, sobre todo, las responsabilidades que siguen siendo tuyas.

<!-- block: THEORY | Lo que dicen los documentos del proyecto -->
El protocolo de prueba del equipo físico de VentyLab fija tres condiciones que no se negocian (VentyLab, 2026):

1. **El ventilador se conecta a un pulmón de prueba o simulador pulmonar, nunca a una persona ni a un animal.** VentyLab es una plataforma de enseñanza. La consola web no es la interfaz de un ventilador clínico, y los equipos de uso clínico se rigen por una norma internacional propia de seguridad básica y desempeño esencial (International Organization for Standardization, 2020).
2. **El software no tiene un comando de parada de emergencia.** La persona custodia del equipo debe saber detener la ventilación en el propio equipo. Si algo sale mal, la respuesta se da en el equipo, no en la pantalla.
3. **El servidor nunca envía un comando por su cuenta.** El fin de una reserva, una cancelación, un desplazamiento, una ausencia prolongada o un error solo retiran el control del operador; no cambian los parámetros del equipo. Cada comando lo decide una persona, a propósito.

La inteligencia artificial de la plataforma sigue la misma regla: puede sugerir, pero nunca envía comandos al equipo. Cualquier cambio lo aplicas tú.

<!-- block: THEORY | Quién hace qué -->
| Papel | Responsabilidad |
|---|---|
| **Custodio del equipo** | Prepara el equipo y el pulmón de prueba, conoce la parada en el equipo y tiene la última palabra sobre la seguridad |
| **Operador** (quien tiene el control) | Acuerda cada cambio con el custodio, cambia un parámetro a la vez y vigila la respuesta |
| **Observadores** (resto del grupo) | Vigilan curvas, alarmas y estado del equipo y avisan de cualquier comportamiento inesperado |
| **Docente** | Organiza la práctica, puede tomar o retirar el control y desplazar reservas |

Del protocolo se desprenden reglas de conducta que debes aplicar siempre: parte de los ajustes actuales del equipo; cambia un parámetro por vez y dentro de los límites; y **detén la sesión** (parada en el equipo, liberar el control, anotar el motivo) ante cualquier comportamiento inesperado, una alarma que el custodio no espera o un comando cuyo estado final no coincide con lo que muestra el equipo.

<!-- block: CALLOUT:error | Nunca con un paciente -->
Si en algún momento el equipo del laboratorio estuviera conectado a algo distinto de un pulmón de prueba, no lo operes y avisa de inmediato al custodio y a tu docente.

<!-- page: rangos-seguros | THEORY | Rangos seguros y envío automático -->
<!-- block: THEORY | Dos capas de límites -->
Cada comando pasa por dos capas de límites antes de llegar al equipo. La primera son los **rangos de la plataforma**, comunes a todo el sistema. La segunda son los **límites de seguridad del laboratorio**, más estrictos, que la administración puede ajustar pero nunca hacer más permisivos que la primera capa. Con la configuración por defecto (VentyLab, 2026):

| Parámetro | Rango de la plataforma | Límite del laboratorio |
|---|---|---|
| Volumen corriente | 200–800 mL | máx. 700 mL |
| Frecuencia respiratoria | 5–40 /min | máx. 35 /min |
| PEEP | 0–20 cmH₂O | máx. 15 cmH₂O |
| Presión límite | 10–50 cmH₂O | máx. 40 cmH₂O |
| FiO₂ | 0,21–1 | — |
| Tiempo inspiratorio | 0,5–3 s | — |
| Relación I:E | — | máx. 1 (no se aceptan relaciones invertidas) |

Estos valores **no son recomendaciones clínicas**: son límites técnicos del equipo docente, elegidos de forma conservadora y pendientes de contrastar con el protocolo del fabricante. Que un valor sea aceptado por la plataforma no lo convierte en adecuado para un paciente; para eso están las lecciones clínicas del currículo.

<!-- block: THEORY | Reglas de coherencia -->
Además de cada rango, el servidor comprueba que el conjunto tenga sentido. El tiempo espiratorio se deriva de la frecuencia y del tiempo inspiratorio:

$$
T_e = \frac{60}{FR} - T_i \geq 0{,}3\,\text{s}
$$

y la relación inspiración-espiración no puede superar el límite del laboratorio:

$$
I{:}E = \frac{T_i}{T_e} \leq 1
$$

donde $FR$ es la frecuencia en respiraciones por minuto, $T_i$ el tiempo inspiratorio en segundos y $T_e$ el tiempo espiratorio en segundos. También se exige que la presión límite sea mayor que la PEEP.

**Ejemplo.** Con $FR = 30\,\text{/min}$ y $T_i = 1{,}5\,\text{s}$, el ciclo dura $60/30 = 2\,\text{s}$ y $T_e = 2 - 1{,}5 = 0{,}5\,\text{s}$. El tiempo espiratorio cumple el mínimo, pero $I{:}E = 1{,}5/0{,}5 = 3$, una relación invertida: el comando se rechaza completo. Si bajas el $T_i$ a $1\,\text{s}$, $T_e = 1\,\text{s}$ e $I{:}E = 1$: se acepta.

<!-- block: THEORY | Cómo protege el envío automático -->
La consola está cambiando a **aplicación automática**: ya no habrá un botón de confirmar. En el modo real, esa comodidad viene con salvaguardas propias:

- **Espera de unos 500 ms** tras tu último cambio, para que una ráfaga de ajustes salga como un solo comando.
- **Validación del rango seguro en tu navegador**: un valor fuera de rango nunca se envía; el control queda «Rechazado» y vuelve al último valor aplicado.
- **Un comando en vuelo a la vez**, con los cambios siguientes acumulados (gana el último valor).
- **Estado por parámetro**: **Enviando**, **Aplicado**, **Rechazado**.
- **Deshacer último cambio**, que reenvía los valores anteriores por el mismo camino y con la misma validación.
- **Límite de frecuencia en el servidor**: por defecto, 5 comandos por segundo por persona; si lo superas, verás «Demasiados cambios seguidos: el cambio no se envió.».

![Diagrama de flujo del envío automático en modo real: cambio, espera de 500 ms, validación del rango seguro, comprobación de comando en vuelo, segunda validación en el servidor y equipo, con la ruta de Deshacer último cambio](/learning/diagrams/v6-seguridad-envio-automatico.svg "Figura: salvaguardas del envío automático")

<!-- block: CALLOUT:warning | Deshacer no es una parada -->
**Deshacer último cambio** envía otro comando, que también tarda, puede rechazarse y depende de que el equipo esté en línea. Ante una situación de riesgo, la respuesta es la parada en el equipo a cargo del custodio.

<!-- page: fallas-y-alarmas | THEORY | Pérdida de conexión, control y alarmas -->
<!-- block: THEORY | Cuando dejan de llegar datos -->
La plataforma prefiere bloquearte antes que dejarte operar a ciegas.

- **Equipo sin datos.** Si pasan más de 2 segundos sin telemetría (valor por defecto), aparece «Equipo sin datos: sin señal del ventilador hace más de 2 segundos.». Las curvas quedan grises, los ajustes mostrados son los últimos que informó el equipo y los controles se habilitan cuando vuelva a enviar datos. Un comando que llegue al servidor en ese estado se rechaza con «El equipo no está enviando datos o el servidor no pudo comunicarse con él: el cambio no se envió.».
- **Sin conexión con el servidor.** Si se corta tu canal en tiempo real, verás «Se perdió la conexión en tiempo real con el servidor. Reconectando…» y la consola en solo lectura hasta reconectar.

En ambos casos el equipo sigue con los últimos ajustes que aplicó. La pérdida de datos en tu pantalla no detiene el ventilador.

<!-- block: THEORY | Cuando pierdes el control o termina la reserva -->
- Si otra persona autorizada toma el control, verás «… tomó el control del equipo.»; si te ausentas más de 15 segundos (valor por defecto) con todas las pestañas cerradas, «Se liberó tu control del equipo porque tu conexión con el servidor se interrumpió más tiempo del permitido.». La consola pasa a solo lectura y los cambios sin confirmar se descartan. Puedes volver a pulsar **Tomar control** si te corresponde.
- Si la reserva termina, se cancela o es desplazada, un diálogo bloqueante lo explica («La reserva terminó», «Terminó el tiempo de la reserva» o «La reserva fue desplazada») y solo ofrece **Entendido**.

<!-- block: THEORY | Comandos sin confirmación -->
Un comando puede terminar en «Sin confirmación del equipo» si el equipo no lo confirma en 3 segundos (valor por defecto). Ese estado significa **resultado desconocido**, no rechazo: el equipo pudo haberlo aplicado. Lo mismo ocurre si el servidor no responde a tiempo o se pierde la conexión durante el envío; la plataforma te pide revisar «Comandos recientes» y los valores que informa el equipo antes de reintentar. Repetir un cambio a ciegas puede duplicar su efecto.

<!-- block: THEORY | Alarmas del equipo -->
La barra de alarmas del modo real muestra las alarmas que informa el equipo (presión alta o baja, volumen alto o bajo, apnea, desconexión, falla de energía y falla técnica) y las que calcula la consola con tus límites. Trata cada alarma como real: lee su tipo, mira las curvas, revisa el circuito y el pulmón de prueba y avisa al custodio. La fatiga por alarmas, es decir, la desensibilización ante alarmas frecuentes que no exigen acción, está bien documentada en los servicios clínicos (Cvach, 2012); un laboratorio donde se aprende a ignorar alarmas enseña exactamente lo contrario de lo que se busca.

![Tabla de respuesta ante fallas: equipo sin datos, sin conexión con el servidor, pérdida de control o fin de reserva, alarma del equipo y comando sin confirmación, con lo que ves y lo que haces en cada caso](/learning/diagrams/v6-seguridad-respuesta-fallas.svg "Figura: respuesta ante cada falla del modo real")

<!-- page: higiene-y-cierre | THEORY | Higiene del equipo y cierre de la práctica -->
<!-- block: THEORY | Higiene: lo que aplica en un laboratorio -->
El equipo del laboratorio no entra en contacto con pacientes, pero lo manipulan muchas personas: superficies, perillas, el circuito y el pulmón de prueba pasan de mano en mano. La higiene aquí protege a quienes practican y, sobre todo, refuerza un hábito que llevarás al servicio clínico.

- **Higiene de manos** antes y después de manipular el equipo. La higiene de manos con preparado de base alcohólica o con agua y jabón es la medida básica de prevención de infecciones en la atención de salud (World Health Organization, 2009).
- **Superficies y controles.** Según la clasificación de Spaulding, los objetos que solo tocan piel intacta son no críticos y requieren limpieza y desinfección de bajo nivel (Rutala y Weber, 2016). Aplica a las superficies del equipo y del puesto el producto y el método que indiquen el protocolo del laboratorio y el fabricante.
- **Circuito, filtros y pulmón de prueba.** Siguen las instrucciones del fabricante y del custodio. No los desarmes ni los limpies por tu cuenta.
- **Nunca reutilices** en un paciente un circuito, un filtro o un accesorio del laboratorio.

<!-- block: THEORY | Cierre ordenado de la práctica -->
El protocolo del proyecto define un cierre que conviene repetir siempre (VentyLab, 2026):

1. Devuelve el equipo a los ajustes acordados con el custodio (en el propio equipo si hace falta).
2. Pulsa **Liberar control**.
3. Detén la grabación si la iniciaste (se detiene sola al final de la reserva).
4. **Desconectar** y, si terminaste antes de tiempo, **Liberar** la reserva.
5. Anota cualquier problema observado y comunícalo al custodio o a tu docente.

Cada paso tiene una razón. Devolver los ajustes acordados evita que la siguiente persona encuentre el equipo en un estado que no conoce: el protocolo pide partir siempre de los ajustes actuales, y eso solo es seguro si quien terminó los dejó en un punto conocido. Liberar el control antes de desconectar deja claro que ya nadie opera; si solo cierras la pestaña, el servidor tarda unos segundos en notar tu ausencia. Liberar la reserva cuando sobra tiempo devuelve el recurso al calendario. Y el registro escrito de un incidente, aunque parezca menor, es lo que permite al custodio detectar un problema que se repite entre grupos.

<!-- block: THEORY | Trazabilidad -->
VentyLab conserva el historial de comandos de cada reserva, con su estado y su latencia, y la grabación de la telemetría si la activaste. Esa trazabilidad no está para vigilarte: está para que puedas reconstruir qué pasó y aprender de ello, igual que en una sesión simulada. Si algo salió mal, revisa **Comandos recientes** antes de irte y, si grabaste, vuelve a ver la grabación desde **Mis sesiones**.

<!-- block: CALLOUT:info | Si tu laboratorio tiene un protocolo propio -->
Los repositorios de VentyLab no describen un procedimiento de limpieza específico del equipo. Si tu institución tiene uno, ese protocolo prevalece sobre las indicaciones generales de esta página.

<!-- page: recorrido-falla-durante-practica | CASE_STUDY | Recorrido: una falla durante la práctica -->
<!-- block: CASE_STUDY | Ejemplo: alarma de desconexión y datos congelados -->
Operas el equipo en VCV sobre el pulmón de prueba con tu grupo. Acabas de subir el volumen corriente de 400 a 450 mL, acordado con el custodio.

**Momento 1.** Junto al control ves «Enviando». Dos segundos después, la barra de alarmas muestra «Desconexión» y poco después aparece «Equipo sin datos». Las curvas se ponen grises y los controles se bloquean.

**Qué haces.** No intentas reenviar el cambio: la plataforma no lo permitiría y, además, no sabes en qué estado quedó el equipo. Avisas al custodio, que revisa el circuito en el equipo y encuentra la pieza en Y suelta del pulmón de prueba. El custodio decide si detiene la ventilación en el equipo mientras la reconecta.

**Momento 2.** Con el circuito reconectado, vuelven los datos y el **Equipo** dice «En línea». En **Comandos recientes**, tu cambio figura como «Sin confirmación del equipo».

**Qué haces.** Miras los valores que informa el equipo antes de actuar. Si el volumen informado ya es 450 mL, el cambio se aplicó y no repites nada. Si sigue en 400 mL, acuerdas con el custodio si vuelves a enviarlo. Si el equipo informa un valor distinto de ambos, usas **Usar los valores que informa el equipo** para seguir desde la realidad del equipo.

**Momento 3.** Anotas el incidente: hora, alarma, causa encontrada y estado final del comando. Al cierre de la práctica, se lo comunicas a tu docente.

<!-- block: EXERCISE | Preguntas -->
1. **Escribes una PEEP de 18 cmH₂O. ¿Qué pasa?** Respuesta: con los límites por defecto, supera el máximo del laboratorio (15 cmH₂O): el control queda «Rechazado», no se envía nada y vuelve al último valor aplicado.
2. **Con FR 24/min programas Ti 1,6 s. ¿Se acepta?** Respuesta: el ciclo dura 2,5 s, $T_e = 0{,}9\,\text{s}$ e $I{:}E \approx 1{,}8$; supera el límite de 1, así que se rechaza.
3. **Ves «Sin confirmación del equipo». ¿Repites el cambio?** Respuesta: no de inmediato. Primero revisas los valores que informa el equipo y **Comandos recientes**: el cambio pudo haberse aplicado.
4. **El paciente simulado del pulmón de prueba «empeora» y no sabes por qué. ¿Pides a la IA que lo corrija?** Respuesta: la IA solo sugiere y nunca envía comandos. Puedes consultarla, pero la decisión y la verificación con el custodio son tuyas.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El equipo físico se usa solo con un pulmón de prueba; nunca con una persona ni un animal.
- El software no tiene parada de emergencia: la parada se hace en el equipo, a cargo del custodio.
- Ni el servidor ni la IA envían comandos por su cuenta; cada cambio lo decide una persona.
- Cada comando pasa por los rangos de la plataforma, los límites del laboratorio y las reglas de coherencia; estos límites son técnicos, no clínicos.
- El envío automático espera ~500 ms, valida antes de enviar, mantiene un comando en vuelo y permite **Deshacer último cambio**.
- Sin datos frescos o sin conexión, la consola pasa a solo lectura; el equipo conserva los últimos ajustes.
- «Sin confirmación del equipo» significa resultado desconocido: verifica antes de repetir.
- Atiende cada alarma y mantén la higiene de manos y de superficies (Cvach, 2012; World Health Organization, 2009).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Confiar en Deshacer como freno** → es otro comando que puede tardar o fallar → ante riesgo, pide la parada en el equipo.
- **Repetir un comando sin confirmación** → puedes duplicar el cambio → revisa los valores que informa el equipo y **Comandos recientes**.
- **Pensar que un valor aceptado es clínicamente correcto** → los límites del laboratorio son técnicos → razona con las metas clínicas de cada lección.
- **Silenciar o ignorar alarmas «conocidas»** → entrenas la fatiga por alarmas → lee cada alarma, busca la causa y avisa.
- **Cambiar varios parámetros a la vez** → no puedes atribuir el efecto ni revertir con seguridad → un parámetro por vez, acordado con el custodio.
- **Irte sin cerrar** → dejas el equipo con ajustes desconocidos y bloqueado → sigue el cierre ordenado y libera la reserva.

<!-- block: REFERENCES | Referencias -->
- Cvach, M. (2012). Monitor alarm fatigue: An integrative review. *Biomedical Instrumentation & Technology, 46*(4), 268–277. [https://doi.org/10.2345/0899-8205-46.4.268](https://doi.org/10.2345/0899-8205-46.4.268)
- International Organization for Standardization. (2020). *Medical electrical equipment — Part 2-12: Particular requirements for basic safety and essential performance of critical care ventilators* (ISO Standard No. 80601-2-12:2020). [https://www.iso.org/standard/72069.html](https://www.iso.org/standard/72069.html)
- Rutala, W. A., & Weber, D. J. (2016). Disinfection and sterilization in health care facilities. *Infectious Disease Clinics of North America, 30*(3), 609–637. [https://doi.org/10.1016/j.idc.2016.04.002](https://doi.org/10.1016/j.idc.2016.04.002)
- VentyLab. (2026). *Manual de uso* [documentación interna].
- World Health Organization. (2009). *WHO guidelines on hand hygiene in health care*. [https://www.who.int/publications/i/item/9789241597906](https://www.who.int/publications/i/item/9789241597906)
