<!-- page: arquitectura-del-ventilador | THEORY | Conceptos: cómo está construido un ventilador -->
<!-- block: INTRODUCTION | Por qué conocer la máquina por dentro -->
Cuando conectas a un paciente a un ventilador, cada ciclo que recibe pasa por una cadena de piezas: una fuente de gas, un mezclador, una válvula que abre y cierra, unos sensores que miden, un circuito de tubos, un sistema de humidificación y, al final, una interfaz que llega a la vía aérea. Si una sola pieza falla o está mal elegida, el resultado clínico cambia: una fuga en el circuito puede hacer que el ventilador se dispare solo, un intercambiador de calor y humedad (HME) colocado en un paciente con volumen corriente bajo puede subir la PaCO₂, y una válvula espiratoria obstruida puede impedir que el paciente exhale.

Conocer la arquitectura del equipo no es un tema de ingeniería reservado al técnico. Es lo que te permite interpretar lo que muestra la pantalla, saber qué está midiendo realmente cada número y resolver de forma ordenada una alarma. Esta lección prepara el terreno para la siguiente, «Variables de fase: disparo, límite y ciclado», en la que verás cómo esas piezas se coordinan para construir cada respiración.

<!-- block: THEORY | Un sistema de control en lazo cerrado -->
Un ventilador moderno funciona como un sistema de control con retroalimentación. Tú programas un objetivo (por ejemplo, un volumen corriente con un flujo determinado o una presión inspiratoria), el controlador electrónico abre la válvula inspiratoria, los sensores miden lo que realmente sale y lo que regresa, y el controlador corrige la apertura de la válvula muchas veces por segundo para acercar lo medido a lo programado (Hess y Kacmarek, 2019).

La consecuencia práctica es importante: lo que ves en la pantalla es lo que miden los sensores, no lo que llega exactamente a los alvéolos. La presión que se muestra es la presión en la vía aérea medida en el equipo o cerca de la pieza en Y, y el volumen es la integral del flujo medido. Entre esos sensores y el alvéolo están el tubo endotraqueal, la vía aérea del paciente y, a veces, accesorios que añaden resistencia o espacio muerto.

![Diagrama de bloques del ventilador: oxígeno y aire entran al mezclador, pasan por la válvula inspiratoria y el sensor de flujo, recorren la rama inspiratoria con el humidificador hasta la pieza en Y y el paciente; el gas espirado vuelve por la rama espiratoria, el filtro, el sensor de flujo espiratorio y la válvula espiratoria que mantiene la PEEP; un controlador recibe las señales y comanda las válvulas](/learning/diagrams/b3-componentes-esquema-ventilador.svg "Figura: arquitectura funcional del ventilador y del circuito")

<!-- block: THEORY | Las piezas, una por una -->
#### Fuente de gas y mezclador

El ventilador recibe oxígeno y aire medicinal, habitualmente desde la red de gases del hospital a alta presión, o genera el flujo con una turbina interna que toma aire ambiente. El mezclador combina ambos gases para obtener la fracción inspirada de oxígeno (FiO₂) programada, desde la del aire ambiente hasta oxígeno puro. Muchos equipos incorporan un analizador de oxígeno que verifica la FiO₂ entregada y alarma si se aparta del valor programado.

#### Válvula inspiratoria

Es la pieza que da forma a cada respiración. En los equipos actuales suele ser una válvula proporcional controlada electrónicamente, capaz de abrirse parcialmente para entregar un flujo constante, un flujo desacelerado o la cantidad de flujo necesaria para mantener una presión. Que el ventilador «controle volumen» o «controle presión» depende de cómo el controlador maneja esta válvula, no de un hardware distinto.

#### Sensores de presión y de flujo

Los transductores de presión miden la presión en el circuito y los sensores de flujo (por ejemplo, de diferencia de presión o de hilo caliente) miden el flujo inspiratorio y espiratorio. A partir del flujo, el equipo calcula volúmenes; a partir de la presión, reconoce esfuerzos del paciente, calcula presiones pico, meseta y media y activa alarmas (Hess y Kacmarek, 2019).

#### Válvula espiratoria

Durante la inspiración permanece cerrada (o regula la salida) para que el gas vaya al paciente. Durante la espiración se abre y deja salir el gas, pero no hasta la presión atmosférica: se cierra lo suficiente para mantener la presión al final de la espiración programada (PEEP). Una válvula espiratoria que no abre bien o un filtro espiratorio saturado se traducen en dificultad para exhalar y en aumento de la presión de base.

#### Controlador e interfaz de usuario

El controlador integra las órdenes del operador, las señales de los sensores y las alarmas. La interfaz muestra los parámetros programados, los valores medidos, las curvas y las alarmas. La lección «Monitoreo básico: presiones, volúmenes y curvas escalares» profundiza en cómo leerlas.
<!-- page: circuito-humidificacion-filtros | THEORY | Circuito, humidificación, filtros e interfaz -->
<!-- block: THEORY | El circuito del paciente -->
El circuito conecta el ventilador con el paciente. En la configuración más habitual en cuidados intensivos tiene dos ramas: la **rama inspiratoria** lleva el gas fresco hacia el paciente y la **rama espiratoria** devuelve el gas exhalado al ventilador, donde se mide y sale por la válvula espiratoria. Ambas ramas se unen en la **pieza en Y**, que se conecta al tubo endotraqueal o a la cánula de traqueostomía, a menudo con una pieza corta flexible intermedia.

Un concepto clave es dónde se reinhala gas. Las ramas inspiratoria y espiratoria llevan el gas en una sola dirección, por lo que no se suman al espacio muerto. En cambio, todo lo que está **entre la pieza en Y y el paciente** (conectores, tubo flexible, HME, sensor proximal, adaptadores) lo atraviesa el gas en ambos sentidos: al final de cada espiración queda lleno de gas alveolar con CO₂, que vuelve a entrar en la siguiente inspiración. Ese volumen es espacio muerto instrumental y se suma al espacio muerto anatómico y alveolar que estudiaste en «Volúmenes pulmonares, espacio muerto y ventilación alveolar».

El circuito también tiene compliance propia: parte del volumen que entrega el ventilador se queda comprimido en los tubos y nunca llega al paciente. Muchos equipos compensan este volumen compresible tras una prueba del circuito al encenderlos; por eso es importante hacer esa autoprueba con el mismo circuito que vas a usar.

En cuanto al mantenimiento, cambiar el circuito de forma rutinaria con un calendario fijo no reduce la neumonía asociada al ventilador. Las recomendaciones de prevención de 2022 indican, como práctica esencial en adultos, cambiarlo solo si está visiblemente sucio o funciona mal (calidad de la evidencia alta), o según las instrucciones del fabricante (Klompas et al., 2022).

<!-- block: THEORY | Humidificación: reemplazar a la vía aérea superior -->
La nariz y la faringe calientan y humidifican el aire inspirado. El tubo endotraqueal las salta por completo, y los gases medicinales llegan fríos y secos. Sin humidificación, las secreciones se espesan, el epitelio se daña y aumenta el riesgo de obstrucción del tubo. Por eso la guía de práctica clínica de la AARC recomienda humidificar a todo paciente con ventilación mecánica invasiva (Restrepo y Walsh, 2012). Hay dos estrategias:

| | Humidificación activa | Intercambiador de calor y humedad (HME) |
|---|---|---|
| Principio | Cámara de agua calentada en la rama inspiratoria | Material que retiene el calor y el agua del gas espirado y los devuelve en la siguiente inspiración |
| Meta de humedad | Entre 33 y 44 mg H₂O/L, de 34 a 41 °C en la pieza en Y, humedad relativa del 100 % (Restrepo y Walsh, 2012) | Al menos 30 mg H₂O/L (Restrepo y Walsh, 2012; Wilkes, 2011a) |
| Espacio muerto | No añade volumen tras la Y | Añade su volumen interno al espacio muerto |
| Resistencia | No añade resistencia al paciente | Añade resistencia y puede obstruirse con secreciones o sangre (Wilkes, 2011b) |

![Comparación de dos configuraciones del circuito: a la izquierda el humidificador calentado está en la rama inspiratoria y no añade volumen tras la pieza en Y; a la derecha el HME está entre la pieza en Y y el paciente, añadiendo espacio muerto y resistencia](/learning/diagrams/b3-componentes-humidificacion.svg "Figura: humidificación activa frente a HME")

La misma guía hace tres advertencias prácticas. Primera: en pacientes con volúmenes corrientes bajos, como en la ventilación protectora, no se recomienda el HME porque su espacio muerto aumenta la ventilación necesaria y la PaCO₂. Segunda: no se recomienda la humidificación pasiva en ventilación no invasiva. Tercera: el HME no debe usarse como estrategia para prevenir la neumonía asociada al ventilador (Restrepo y Walsh, 2012).

Por el mismo mecanismo físico, nunca combines un humidificador activo con un HME en el mismo circuito: el HME se satura de agua, su resistencia sube y puede ocluirse.

<!-- block: THEORY | Filtros e interfaz con el paciente -->
Los **filtros** protegen al paciente, al equipo y al personal frente a partículas y microorganismos. Pueden colocarse en la salida inspiratoria del ventilador, en la entrada de la rama espiratoria (protegen los sensores y el ambiente) o, combinados con un HME, en la pieza en Y. Su eficacia de filtración varía entre productos (Wilkes, 2011a) y todos añaden resistencia al flujo, que aumenta si se humedecen o se obstruyen (Wilkes, 2011b). Un filtro espiratorio húmedo o con depósitos de aerosol puede aumentar la resistencia espiratoria hasta generar atrapamiento de aire.

La **interfaz** es el último eslabón. En ventilación invasiva es el tubo endotraqueal o la cánula de traqueostomía; su diámetro interno y su longitud determinan buena parte de la resistencia que ves como diferencia entre presión pico y presión meseta. En ventilación no invasiva se usan mascarillas nasales, oronasales, faciales totales o cascos, en las que las fugas son la regla y el ventilador debe compensarlas.
<!-- page: calculos-del-circuito | EXERCISE | Fórmulas y cálculo: volumen, espacio muerto y volumen compresible -->
<!-- block: THEORY | Del flujo al volumen -->
El ventilador no mide el volumen directamente: mide el flujo y lo integra en el tiempo. Si el flujo es constante, la integral se reduce a una multiplicación.

$$
V_T = \int_{0}^{T_i} \dot{V}(t)\,dt \quad\Rightarrow\quad V_T = \dot{V}\cdot T_{i}\ \ (\text{si el flujo es constante})
$$

- $V_T$: volumen corriente, en L o mL.
- $\dot{V}$: flujo inspiratorio, en L/s (para convertir desde L/min divide entre 60).
- $T_i$: tiempo con flujo inspiratorio, en s.

**Ejemplo.** Programas un flujo constante de $40\,\text{L/min}$, que equivale a $40/60 = 0{,}667\,\text{L/s}$, durante $0{,}6\,\text{s}$. El volumen entregado es $0{,}667 \times 0{,}6 = 0{,}40\,\text{L}$, es decir, $400\,\text{mL}$. Si el sensor de flujo espiratorio está sucio o mal calibrado, el volumen espirado que ves en pantalla tendrá el mismo error, porque también es una integral de flujo.

<!-- block: EQUATION | Ventilación alveolar y espacio muerto -->
\dot{V}_A = FR \cdot \left(V_T - V_D\right)

<!-- block: THEORY | Cómo afecta un accesorio a la ventilación alveolar -->
- $\dot{V}_A$: ventilación alveolar, en mL/min o L/min.
- $FR$: frecuencia respiratoria, en respiraciones/min.
- $V_D$: espacio muerto total (anatómico, alveolar e instrumental), en mL.

Como la producción de CO₂ ($\dot{V}CO_2$) es estable a corto plazo, la PaCO₂ es inversamente proporcional a la ventilación alveolar:

$$
\frac{PaCO_{2,\,nueva}}{PaCO_{2,\,previa}} \approx \frac{\dot{V}_{A,\,previa}}{\dot{V}_{A,\,nueva}}
$$

**Ejemplo resuelto.** Un paciente recibe $V_T = 420\,\text{mL}$ y $FR = 26$ respiraciones/min. Supón que su espacio muerto total es de $250\,\text{mL}$ y su PaCO₂ es de $46\,\text{mmHg}$. Se coloca un HME con una pieza flexible que, en conjunto, añaden $30\,\text{mL}$ (valor ilustrativo: el volumen interno real figura en la ficha del fabricante).

1. Ventilación alveolar previa: $26 \times (420 - 250) = 26 \times 170 = 4420\,\text{mL/min}$.
2. Ventilación alveolar nueva: $26 \times (420 - 280) = 26 \times 140 = 3640\,\text{mL/min}$.
3. Relación: $4420 / 3640 = 1{,}21$. PaCO₂ esperada: $46 \times 1{,}21 \approx 56\,\text{mmHg}$.
4. Para volver a la ventilación alveolar previa sin quitar el HME necesitarías $FR = 4420 / 140 \approx 32$ respiraciones/min, lo que acorta el tiempo espiratorio y favorece el atrapamiento de aire.

La lección del cálculo: cuanto menor es el volumen corriente, mayor es el peso relativo de cada mililitro de espacio muerto. En pacientes con lesión pulmonar aguda ventilados con volumen corriente bajo, retirar el HME y la pieza flexible redujo la PaCO₂ y subió el pH con una ventilación minuto menor (Hinkson et al., 2006). Sustituir el HME por humidificación activa también redujo la PaCO₂ y, manteniendo la PaCO₂ constante, permitió bajar el volumen corriente y la presión meseta (Morán et al., 2006).

<!-- block: EQUATION | Volumen compresible del circuito -->
V_{comp} = C_{circ}\cdot\left(P_{pico} - PEEP\right)

<!-- block: THEORY | Volumen que se queda en los tubos -->
- $V_{comp}$: volumen comprimido en el circuito, en mL.
- $C_{circ}$: compliance del circuito, en mL/cmH₂O (la determina la autoprueba del equipo).
- $P_{pico}$ y $PEEP$: en cmH₂O.

**Ejemplo.** Supón un circuito con una compliance de $2\,\text{mL/cmH}_2\text{O}$ (valor ilustrativo), una presión pico de $30\,\text{cmH}_2\text{O}$ y PEEP de $5\,\text{cmH}_2\text{O}$. El volumen que se queda en los tubos es $2 \times (30 - 5) = 50\,\text{mL}$. Si el ventilador no compensara, de $400\,\text{mL}$ programados el paciente recibiría unos $350\,\text{mL}$. Por eso debes hacer la autoprueba con el circuito definitivo y no cambiar a un circuito más distensible sin repetirla.

<!-- block: EXERCISE | Comprueba tu cálculo -->
1. Un flujo constante de $60\,\text{L/min}$ se mantiene durante $0{,}5\,\text{s}$. ¿Qué volumen se entrega?
2. Con $V_T = 350\,\text{mL}$, $FR = 28$ y $V_D = 210\,\text{mL}$, ¿cuál es la ventilación alveolar? ¿Y si se añaden $40\,\text{mL}$ de espacio muerto instrumental?

**Respuestas.** 1) $60/60 = 1\,\text{L/s}$; $1 \times 0{,}5 = 0{,}5\,\text{L} = 500\,\text{mL}$. 2) $28 \times 140 = 3920\,\text{mL/min}$; con el accesorio, $28 \times 100 = 2800\,\text{mL/min}$, una caída del 29 %: si la $\dot{V}CO_2$ no cambia, la PaCO₂ subiría en una proporción de $3920/2800 = 1{,}4$.
<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: cuando el circuito explica la gasometría -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 58 años, talla 172 cm, con neumonía bilateral y síndrome de dificultad respiratoria aguda moderado, intubado hace 12 horas. Está en ventilación controlada por volumen con $V_T$ de 380 mL, FR de 28 respiraciones/min, PEEP de 10 cmH₂O y FiO₂ de 0,6. Para el traslado a tomografía se le colocó un HME con filtro entre la pieza en Y y el tubo, y una pieza flexible corrugada; al volver a la unidad nadie retiró ese conjunto, aunque el ventilador tiene un humidificador activo montado y apagado.

**Datos.** Gasometría de ingreso: pH 7,32 y PaCO₂ 52 mmHg. Gasometría actual, sin cambios en el ventilador: pH 7,24 y PaCO₂ 63 mmHg. La presión pico subió de 31 a 34 cmH₂O y la meseta no cambió (25 cmH₂O). En la curva de flujo, el flujo espiratorio llega a cero antes del siguiente ciclo.

**Razonamiento paso a paso.**

1. **¿Cambió la ventilación minuto?** No: el volumen corriente y la frecuencia son los mismos. El problema no está en lo programado.
2. **¿Cambió la mecánica pulmonar?** La presión meseta es igual, así que la compliance del sistema respiratorio no cambió. La presión pico subió con meseta estable: aumentó un componente resistivo, compatible con un HME y un filtro añadidos.
3. **¿Cambió el espacio muerto?** Sí: el HME y la pieza flexible están entre la Y y el paciente, y todo su volumen se reinhala en cada ciclo. Con un volumen corriente bajo, unos pocos mililitros añadidos reducen mucho la ventilación alveolar, tal como calculaste en la página anterior.
4. **¿Hay atrapamiento?** El flujo espiratorio vuelve a cero, lo que hace poco probable que el aumento de PaCO₂ se deba a auto-PEEP.
5. **Decisión.** Retirar el HME y la pieza flexible, encender el humidificador activo con las metas de temperatura y humedad recomendadas (Restrepo y Walsh, 2012), confirmar que no hay HME en el circuito al usar humidificación activa y repetir la gasometría a los 20 a 30 minutos. Es la misma intervención que, en pacientes con volumen corriente bajo, redujo la PaCO₂ sin aumentar la ventilación minuto (Hinkson et al., 2006).
6. **Qué no hacer primero.** Subir la frecuencia para «lavar» el CO₂ trataría el número sin corregir la causa y acortaría el tiempo espiratorio.

**Evolución esperada.** Tras retirar el espacio muerto instrumental, la presión pico vuelve a su valor previo y la PaCO₂ desciende. Si no lo hiciera, deberías buscar otras causas (aumento del espacio muerto alveolar, fiebre con mayor producción de CO₂, auto-PEEP).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y relaciona lo que ves con las piezas del equipo:

- En VCV, observa que la curva de volumen crece de forma lineal mientras el flujo es constante: es la integral del flujo que calculan los sensores.
- Sube la PEEP unos pocos cmH₂O y fíjate en cómo la presión de base de toda la curva se desplaza hacia arriba: es la válvula espiratoria cerrándose antes.
- Cambia de VCV a PCV y comprueba que la válvula inspiratoria ahora entrega la forma de onda de presión cuadrada y el flujo se vuelve desacelerado.

<!-- block: EXERCISE | Preguntas de razonamiento -->
1. Un paciente en ventilación protectora tiene humidificación activa y, además, alguien añadió un HME. ¿Qué dos problemas puede generar esta combinación?
2. La presión pico sube y la meseta no cambia justo después de colocar un filtro nuevo en la pieza en Y. ¿Qué componente de la ecuación del movimiento cambió?
3. ¿Por qué cambiar el circuito cada 48 horas no es una buena estrategia de prevención?

**Respuestas.** 1) El HME se satura de agua, aumenta su resistencia y puede ocluirse; además añade espacio muerto innecesario en un paciente con volumen corriente bajo (Restrepo y Walsh, 2012). 2) El componente resistivo: el filtro aumenta la resistencia al flujo y no modifica la compliance. 3) Porque cambiarlo con calendario fijo no reduce la neumonía asociada al ventilador; se recomienda cambiarlo solo si está sucio o funciona mal (Klompas et al., 2022), lo que además evita desconexiones innecesarias.
<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El ventilador es un sistema de control con retroalimentación: la válvula inspiratoria entrega gas, los sensores miden y el controlador corrige en cada ciclo.
- Lo que muestra la pantalla es lo que miden los sensores; el volumen es una integral del flujo y la presión se mide en el circuito, no en el alvéolo.
- La válvula espiratoria es la que mantiene la PEEP; si se obstruye ella o el filtro espiratorio, el paciente no puede exhalar con normalidad.
- Todo lo que está entre la pieza en Y y el paciente es espacio muerto instrumental: con volúmenes corrientes bajos, cada mililitro cuenta.
- Toda ventilación invasiva necesita humidificación; la activa busca entre 33 y 44 mg H₂O/L a 34-41 °C en la Y, y el HME debe aportar al menos 30 mg H₂O/L (Restrepo y Walsh, 2012).
- En ventilación protectora no se recomienda el HME por su espacio muerto (Restrepo y Walsh, 2012).
- El circuito se cambia solo si está sucio o funciona mal, no con un calendario fijo (Klompas et al., 2022).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Dejar un HME de traslado en un paciente con volumen corriente bajo** → su espacio muerto reduce la ventilación alveolar y sube la PaCO₂ → retíralo al volver y usa humidificación activa (Restrepo y Walsh, 2012).
- **Combinar humidificador activo y HME** → el HME se empapa, aumenta la resistencia y puede ocluir la vía aérea → usa una sola estrategia de humidificación.
- **Subir la frecuencia ante una PaCO₂ alta sin revisar el circuito** → tratas el número y no la causa, y acortas el tiempo espiratorio → revisa primero el espacio muerto instrumental, las fugas y el atrapamiento.
- **Omitir la autoprueba al cambiar el circuito** → el equipo no conoce la compliance y la resistencia del nuevo circuito y el volumen entregado puede diferir del programado → repite la prueba con el circuito definitivo.
- **Interpretar el volumen espirado sin sospechar del sensor** → un sensor de flujo sucio o un filtro húmedo distorsionan las medidas → si el valor no cuadra con la clínica, revisa sensores y filtros.
- **Cambiar el circuito de forma rutinaria «por protocolo»** → no reduce la neumonía y aumenta las desconexiones → cámbialo solo si está sucio o funciona mal (Klompas et al., 2022).

<!-- block: REFERENCES | Referencias -->
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Hinkson, C. R., Benson, M. S., Stephens, L. M., & Deem, S. (2006). The effects of apparatus dead space on PaCO2 in patients receiving lung-protective ventilation. *Respiratory Care, 51*(10), 1140-1144. [https://pubmed.ncbi.nlm.nih.gov/17005059/](https://pubmed.ncbi.nlm.nih.gov/17005059/)
- Klompas, M., Branson, R., Cawcutt, K., Crist, M., Eichenwald, E. C., Greene, L. R., Lee, G., Maragakis, L. L., Powell, K., Priebe, G. P., Speck, K., Yokoe, D. S., & Berenholtz, S. M. (2022). Strategies to prevent ventilator-associated pneumonia, ventilator-associated events, and nonventilator hospital-acquired pneumonia in acute-care hospitals: 2022 update. *Infection Control & Hospital Epidemiology, 43*(6), 687-713. [https://doi.org/10.1017/ice.2022.88](https://doi.org/10.1017/ice.2022.88)
- Morán, I., Bellapart, J., Vari, A., & Mancebo, J. (2006). Heat and moisture exchangers and heated humidifiers in acute lung injury/acute respiratory distress syndrome patients: Effects on respiratory mechanics and gas exchange. *Intensive Care Medicine, 32*(4), 524-531. [https://doi.org/10.1007/s00134-006-0073-1](https://doi.org/10.1007/s00134-006-0073-1)
- Restrepo, R. D., & Walsh, B. K. (2012). Humidification during invasive and noninvasive mechanical ventilation: 2012. *Respiratory Care, 57*(5), 782-788. [https://doi.org/10.4187/respcare.01766](https://doi.org/10.4187/respcare.01766)
- Wilkes, A. R. (2011a). Heat and moisture exchangers and breathing system filters: Their use in anaesthesia and intensive care. Part 1 - history, principles and efficiency. *Anaesthesia, 66*(1), 31-39. [https://doi.org/10.1111/j.1365-2044.2010.06563.x](https://doi.org/10.1111/j.1365-2044.2010.06563.x)
- Wilkes, A. R. (2011b). Heat and moisture exchangers and breathing system filters: Their use in anaesthesia and intensive care. Part 2 - practical use, including problems, and their use with paediatric patients. *Anaesthesia, 66*(1), 40-51. [https://doi.org/10.1111/j.1365-2044.2010.06564.x](https://doi.org/10.1111/j.1365-2044.2010.06564.x)
