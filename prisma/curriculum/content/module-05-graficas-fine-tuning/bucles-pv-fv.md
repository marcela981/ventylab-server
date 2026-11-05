<!-- page: conceptos-bucle-pv | THEORY | El bucle presión-volumen -->
<!-- block: INTRODUCTION | Por qué importa -->
Un bucle se obtiene al dibujar una variable frente a otra durante un ciclo completo, en lugar de frente al tiempo. El tiempo "desaparece" del gráfico y lo que queda es la relación entre las dos magnitudes: cuánto volumen se gana por cada cmH₂O de presión, o cómo cambia el flujo a medida que el pulmón se vacía. Esa relación es justamente la mecánica respiratoria, por eso los bucles permiten ver de un vistazo cambios de compliance, sobredistensión, obstrucción al flujo espiratorio o secreciones.

También tienen trampas. El bucle que muestra el ventilador en cada ciclo es **dinámico**, mezcla los componentes elástico y resistivo, y depende del modo y del flujo. Esta lección te enseña a construirlos, a leerlos y a conocer sus límites para no sacar conclusiones que no sostienen.

<!-- block: THEORY | Curva P-V estática y bucle P-V dinámico -->
La **curva P-V casi estática** del sistema respiratorio se obtiene insuflando el pulmón con un flujo muy bajo (o en pasos con pausas) en un paciente pasivo, de modo que la presión medida sea casi solo elástica. Tiene forma sigmoidea (Harris, 2005):

- Una zona inicial plana, de baja compliance, en la que hace falta presión para abrir unidades colapsadas.
- Un **punto de inflexión inferior (PII)**, donde la pendiente aumenta.
- Una zona central casi lineal, de mayor compliance.
- Un **punto de inflexión superior (PIS)**, a partir del cual la pendiente cae porque el pulmón se acerca a su capacidad máxima.

La rama de desinflado no coincide con la de insuflación: para un mismo volumen, la presión es menor al desinflar. El área entre ambas ramas es la **histéresis** y refleja sobre todo el reclutamiento durante la insuflación, que se mantiene en parte al desinflar, y las propiedades del surfactante (Harris, 2005).

El **bucle P-V dinámico** que dibuja el ventilador en cada ciclo es diferente. La presión de vía aérea en inspiración incluye el componente resistivo ($R\cdot\dot{V}$), de modo que la rama inspiratoria queda desplazada a la derecha y la espiratoria a la izquierda. Su "histéresis" no es la misma que la de la curva estática: depende en gran parte de la resistencia y del flujo (Lucangelo et al., 2005).

![Panel A: curva presión-volumen casi estática con forma sigmoidea, punto de inflexión inferior y superior, y la rama de desinflado a la izquierda que forma la histéresis. Panel B: bucle presión-volumen dinámico en VCV, normal y con sobredistensión, en el que el final de la rama inspiratoria se aplana formando un pico de pato](/learning/diagrams/i4-bucles-pv.svg "Figura: curva P-V casi estática y bucle P-V dinámico")

<!-- block: THEORY | Sobredistensión: el "pico de pato" -->
En un bucle dinámico de VCV, cuando el volumen corriente lleva parte del pulmón más allá de su zona lineal, el último tramo de la rama inspiratoria se aplana: la presión sigue subiendo sin que el volumen aumente en proporción. El bucle adopta una forma de **pico de pato** (*beaking*) en su extremo superior. Es una pista visual de sobredistensión que debe confirmarse con la presión meseta y la driving pressure (Cairo, 2020). En PCV este signo no aparece de la misma forma, porque la presión es constante y lo que cambia es el volumen.

<!-- page: calculo-bucles | EXERCISE | Pendientes y cálculos en los bucles -->
<!-- block: THEORY | La pendiente del bucle P-V -->
La línea que une el inicio y el final de la inspiración en el bucle P-V es una forma visual de la compliance. Si usas la presión pico, obtienes la **compliance dinámica**; si usas la presión meseta, la **compliance estática** (Hess, 2014):

$$
C_{din} = \frac{V_T}{P_{pico} - PEEP_{total}}
$$

$$
C_{st} = \frac{V_T}{P_{plat} - PEEP_{total}}
$$

Donde:

- $C_{din}$ y $C_{st}$: compliance dinámica y estática (mL/cmH₂O).
- $V_T$: volumen corriente (mL).
- $P_{pico}$: presión pico (cmH₂O), que incluye el componente resistivo.
- $P_{plat}$: presión meseta (cmH₂O), medida con pausa inspiratoria.
- $PEEP_{total}$: PEEP programada más auto-PEEP (cmH₂O).

Como la presión pico incluye la resistencia, la compliance dinámica siempre es menor que la estática. Si la dinámica baja y la estática no, el problema está en la vía aérea; si bajan ambas, está en el pulmón o en la pared torácica.

#### Cómo cambia el bucle P-V con la mecánica

Con la misma escala y el mismo volumen programado en VCV, tres cambios son fáciles de reconocer:

- **Menor compliance** (edema, atelectasia, intubación selectiva, neumotórax, distensión abdominal): el bucle se "acuesta" hacia el eje de presión, porque hace falta más presión para el mismo volumen.
- **Mayor resistencia** (secreciones, broncoespasmo, tubo acodado): el bucle se ensancha, sobre todo la rama inspiratoria, que se desplaza a la derecha por el mayor componente resistivo, mientras la meseta cambia poco.
- **Más PEEP o auto-PEEP**: todo el bucle se desplaza a la derecha en el eje de presión, porque parte de una presión de base mayor.

En PCV el razonamiento se invierte: la presión máxima es fija, así que una caída de compliance acorta el bucle en el eje de volumen en lugar de acostarlo. Por eso siempre debes leer el bucle sabiendo qué variable controla el modo.

<!-- block: THEORY | El bucle flujo-volumen y la fuga -->
En el bucle flujo-volumen, el ancho horizontal es el volumen. Si inspiración y espiración no terminan en el mismo punto, la diferencia es el volumen que no volvió. La fracción de fuga es:

$$
\text{Fuga}\,(\%) = \frac{V_{T,i} - V_{T,e}}{V_{T,i}}\cdot 100
$$

con $V_{T,i}$ y $V_{T,e}$ como volúmenes inspirado y espirado (mL).

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente en VCV con Vt 450 mL y PEEP 8 cmH₂O, sin auto-PEEP. Comparas dos momentos:

| Momento | Ppico (cmH₂O) | Pplat (cmH₂O) |
|---|---|---|
| Ingreso | 28 | 22 |
| 4 horas después | 40 | 23 |

**1. Ingreso.**

$$
C_{din} = \frac{450}{28 - 8} = 22{,}5\;\text{mL/cmH}_2\text{O} \qquad C_{st} = \frac{450}{22 - 8} \approx 32\;\text{mL/cmH}_2\text{O}
$$

**2. Cuatro horas después.**

$$
C_{din} = \frac{450}{40 - 8} \approx 14\;\text{mL/cmH}_2\text{O} \qquad C_{st} = \frac{450}{23 - 8} = 30\;\text{mL/cmH}_2\text{O}
$$

**Interpretación.** La pendiente del bucle P-V dinámico se ha "acostado" mucho (la compliance dinámica cayó de 22,5 a 14 mL/cmH₂O), pero la estática casi no cambió. El aumento está en la diferencia pico-meseta, es decir, en la resistencia: piensa en secreciones, tubo acodado o mordido, o broncoespasmo. Si en el bucle flujo-volumen aparecen dientes de sierra, las secreciones son la primera sospecha.

**3. Fuga.** Si el volumen espirado fuera de 360 mL: $(450 - 360)/450 \cdot 100 = 20$ %. El bucle flujo-volumen y el P-V no se cerrarían en el punto de partida.

<!-- page: bucle-flujo-volumen | THEORY | El bucle flujo-volumen -->
<!-- block: THEORY | Cómo se construye y cómo se ve normalmente -->
El bucle flujo-volumen representa el flujo en el eje vertical y el volumen en el horizontal. La convención de signos cambia entre equipos; en esta lección la inspiración queda por encima del eje y la espiración por debajo. En VCV con flujo constante, la rama inspiratoria es casi plana. La rama espiratoria, pasiva, alcanza enseguida su **pico de flujo espiratorio** y luego desciende de manera bastante regular hasta flujo cero, cuando el volumen vuelve al punto de partida (Lucangelo et al., 2005).

![Tres bucles flujo-volumen: normal, con la rama espiratoria que desciende de forma regular hasta flujo cero; obstrucción, con pico espiratorio menor, rama cóncava y flujo que no llega a cero; y secreciones, con oscilaciones en dientes de sierra](/learning/diagrams/i4-bucles-fv.svg "Figura: bucle flujo-volumen normal, con obstrucción y con secreciones")

<!-- block: THEORY | Obstrucción al flujo espiratorio -->
En la EPOC y el asma, la rama espiratoria cambia de forma característica: el pico de flujo espiratorio es menor, tras el pico el flujo cae bruscamente y el resto de la rama queda **cóncava** respecto al eje de volumen. Si el flujo no llega a cero antes de que empiece la siguiente inspiración, hay atrapamiento aéreo. La forma de la rama espiratoria también sirve para valorar la respuesta a los broncodilatadores: un aumento del pico espiratorio y una rama menos cóncava después del tratamiento sugieren menor obstrucción (Dhand, 2005).

<!-- block: THEORY | Secreciones: el patrón en dientes de sierra -->
Las secreciones en el tubo o en la vía aérea grande generan oscilaciones del flujo que dan al bucle un borde en **dientes de sierra**. En un estudio prospectivo con 66 pacientes ventilados, ese patrón estaba presente en el 82 % de los pacientes con secreciones retenidas, frente al 29,6 % de los que no las tenían; su cociente de probabilidad positivo fue de 2,70 y el negativo de 0,25, y combinado con ruidos audibles sobre la tráquea el cociente positivo subió a 14,7. Los autores concluyeron que la ausencia de dientes de sierra ayuda a descartar secreciones retenidas (Guglielminotti et al., 2000). El agua condensada en las tubuladuras produce un patrón parecido, así que revisa el circuito.

<!-- block: CALLOUT:info | Límites de los bucles -->
- Los puntos de inflexión son difíciles de identificar de forma reproducible a simple vista, y el reclutamiento continúa a lo largo de toda la rama de insuflación, no solo en el PII (Harris, 2005).
- El bucle dinámico solo se parece a la curva estática con flujos muy bajos y paciente pasivo; con esfuerzo del paciente, la forma refleja también la presión muscular.
- La forma depende de la escala, del modo y del flujo programado. Compara bucles solo con la misma configuración.

<!-- page: aplicacion-clinica-bucles | CASE_STUDY | Los bucles en dos pacientes -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente 1.** Mujer de 45 años, 1,65 m (peso predicho de unos 57 kg), con SDRA por neumonía, sedada y en VCV con flujo constante. Vt 500 mL (unos 8,8 mL/kg de peso predicho), PEEP 10 cmH₂O, presión meseta 31 cmH₂O.

**Lo que muestra el bucle P-V.** La rama inspiratoria es recta en casi todo su recorrido, pero en el último tramo se aplana y forma un pico de pato.

**Razonamiento paso a paso.**

1. **Hallazgo gráfico.** El aplanamiento final sugiere que parte del pulmón entra en sobredistensión con el volumen actual (Cairo, 2020).
2. **Confirmación numérica.** La presión meseta supera el límite de 30 cmH₂O y el volumen es mayor que el de 6 mL/kg de peso predicho que usó el ensayo ARDSNet (ARDS Network, 2000). La driving pressure es $31 - 10 = 21$ cmH₂O.
3. **Ajuste.** Reduces el volumen corriente hacia unos 340 mL (6 mL/kg de peso predicho) y aumentas la frecuencia para sostener la ventilación minuto, vigilando la auto-PEEP.
4. **Comprobación.** El pico de pato debería desaparecer y la presión meseta, bajar. La titulación de la PEEP se trata en el módulo de reclutamiento y titulación de PEEP.

**Paciente 2.** Hombre de 30 años con crisis asmática, sedado, en VCV. El bucle flujo-volumen muestra un pico espiratorio bajo, una rama espiratoria muy cóncava y un flujo que no llega a cero al empezar la siguiente inspiración.

1. **Interpretación.** Obstrucción grave al flujo espiratorio con atrapamiento aéreo (Dhand, 2005).
2. **Conducta.** Medir la auto-PEEP con pausa espiratoria, alargar el tiempo espiratorio (bajar la frecuencia, acortar el tiempo inspiratorio) y optimizar el tratamiento broncodilatador.
3. **Seguimiento.** Tras el broncodilatador, un pico espiratorio mayor y una rama menos cóncava indican respuesta.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y muestra el bucle P-V en VCV:

- Aumenta el volumen corriente en pasos y observa cómo el extremo superior del bucle tiende a aplanarse mientras la presión meseta sube.
- Vuelve a un volumen protector y compara la pendiente del bucle.

Después abre [«Crisis asmática grave»](/simulador?tab=simular&case=engine-asthma-crisis) y muestra el bucle F-V: verás la rama espiratoria cóncava y que el flujo no llega a cero antes de la siguiente inspiración. Baja la frecuencia y observa cómo la espiración se completa más.

<!-- block: EXERCISE | Preguntas -->
**1.** La compliance dinámica cae a la mitad, pero la estática no cambia. ¿Dónde está el problema?

*Respuesta:* En la resistencia (vía aérea, tubo o circuito), porque solo aumentó la diferencia entre pico y meseta.

**2.** ¿Por qué no basta el pico de pato para diagnosticar sobredistensión?

*Respuesta:* Porque la forma del bucle dinámico depende del flujo, la escala y el esfuerzo del paciente; hay que confirmarlo con la presión meseta y la driving pressure.

**3.** En el bucle flujo-volumen aparece un borde en dientes de sierra. ¿Qué es lo primero que haces?

*Respuesta:* Auscultar y buscar secreciones o agua en el circuito; si hay secreciones, aspirar. La ausencia del patrón hace poco probable que haya secreciones retenidas (Guglielminotti et al., 2000).

<!-- page: sintesis-bucles | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Un bucle dibuja una variable frente a otra en un ciclo; el bucle del ventilador es dinámico e incluye el componente resistivo (Lucangelo et al., 2005).
- La curva P-V casi estática es sigmoidea, con PII, zona lineal y PIS; la histéresis refleja sobre todo reclutamiento y surfactante (Harris, 2005).
- El pico de pato en el bucle P-V de VCV sugiere sobredistensión y se confirma con presión meseta y driving pressure (Cairo, 2020).
- La pendiente del bucle P-V es una compliance: dinámica con presión pico, estática con presión meseta (Hess, 2014).
- En la obstrucción, la rama espiratoria del bucle F-V es cóncava, con pico bajo, y puede no llegar a cero (Dhand, 2005).
- El patrón en dientes de sierra sugiere secreciones retenidas y su ausencia ayuda a descartarlas (Guglielminotti et al., 2000).
- Un bucle que no se cierra indica fuga; cuantifícala comparando volumen inspirado y espirado.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Usar el PII del bucle dinámico para fijar la PEEP** → el bucle dinámico incluye resistencia y los puntos de inflexión son poco reproducibles → apóyate en métodos de titulación validados (ver el módulo de reclutamiento y titulación de PEEP).
- **Comparar bucles obtenidos con distinta escala o distinto flujo** → la forma cambia por la configuración, no por el paciente → fija la misma escala y los mismos parámetros antes de comparar.
- **Interpretar como obstrucción un bucle F-V deformado por esfuerzos del paciente** → el esfuerzo espiratorio activo también cambia la rama espiratoria → valora con el paciente pasivo o con otros signos.
- **Atribuir siempre los dientes de sierra a secreciones** → el agua en las tubuladuras da un patrón parecido → revisa el circuito antes de aspirar.
- **Fiarse del bucle para descartar sobredistensión** → un bucle aparentemente normal no excluye presiones meseta altas → mide siempre la meseta.

<!-- block: REFERENCES | Referencias -->
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Cairo, J. M. (2020). *Pilbeam's mechanical ventilation: Physiological and clinical applications* (7th ed.). Elsevier.
- Dhand, R. (2005). Ventilator graphics and respiratory mechanics in the patient with obstructive lung disease. *Respiratory Care, 50*(2), 246-261. [https://doi.org/10.4187/respcare.05500246](https://doi.org/10.4187/respcare.05500246)
- Guglielminotti, J., Alzieu, M., Maury, E., Guidet, B., & Offenstadt, G. (2000). Bedside detection of retained tracheobronchial secretions in patients receiving mechanical ventilation: Is it time for tracheal suctioning? *Chest, 118*(4), 1095-1099. [https://doi.org/10.1378/chest.118.4.1095](https://doi.org/10.1378/chest.118.4.1095)
- Harris, R. S. (2005). Pressure-volume curves of the respiratory system. *Respiratory Care, 50*(1), 78-99. [https://doi.org/10.4187/respcare.05500078](https://doi.org/10.4187/respcare.05500078)
- Hess, D. R. (2014). Respiratory mechanics in mechanically ventilated patients. *Respiratory Care, 59*(11), 1773-1794. [https://doi.org/10.4187/respcare.03410](https://doi.org/10.4187/respcare.03410)
- Lucangelo, U., Bernabè, F., & Blanch, L. (2005). Respiratory mechanics derived from signals in the ventilator circuit. *Respiratory Care, 50*(1), 55-67. [https://doi.org/10.4187/respcare.05500055](https://doi.org/10.4187/respcare.05500055)
