<!-- page: conceptos-vili | THEORY | Qué es la lesión inducida por el ventilador -->
<!-- block: INTRODUCTION | Por qué importa -->
El ventilador mantiene con vida a un paciente que no puede respirar por sí mismo, pero no es un tratamiento neutro: cada ciclo aplica fuerzas sobre un tejido que ya puede estar dañado. Cuando esas fuerzas superan lo que el pulmón tolera, aparece la **lesión pulmonar inducida por el ventilador** (VILI, por sus siglas en inglés). Su aspecto clínico y anatomopatológico se parece al del propio síndrome de dificultad respiratoria aguda (SDRA): edema por aumento de la permeabilidad, inflamación y daño alveolar difuso. Por eso la VILI es silenciosa: el clínico puede atribuir al curso de la enfermedad un empeoramiento que en realidad está provocando la programación.

Entender cómo se produce la lesión es lo que da sentido a las reglas de la ventilación protectora que verás en la lección «Ventilación protectora: volumen corriente, presión meseta y driving pressure». Sin la fisiología, esas reglas se aplican de forma mecánica y se rompen justo cuando el paciente es más vulnerable.

<!-- block: THEORY | Los mecanismos clásicos -->
Se describen varios mecanismos que actúan a la vez y se potencian entre sí:

- **Barotrauma.** Es la forma más visible: rotura alveolar con fuga de aire hacia el intersticio, el mediastino o la pleura (enfisema intersticial, neumomediastino, neumotórax). El nombre sugiere que la culpable es la presión, pero lo que rompe la pared alveolar es la tensión del tejido, que depende de la presión transpulmonar y del volumen alcanzado, no de la presión en la vía aérea por sí sola.
- **Volutrauma.** Lesión por sobredistensión de las unidades que reciben el volumen. Los experimentos en animales mostraron que un volumen alto produce edema por permeabilidad aunque la presión en la vía aérea sea baja, mientras que una presión alta con volumen normal no lo produce (Dreyfuss et al., 1988). La variable que daña es el estiramiento.
- **Atelectrauma.** Lesión por apertura y cierre repetidos de alvéolos y bronquiolos inestables en cada ciclo. En la interfase entre tejido abierto y colapsado se concentran fuerzas de cizallamiento que dañan el epitelio y el surfactante. En los mismos experimentos, añadir PEEP redujo el edema producido por volúmenes altos (Dreyfuss et al., 1988).
- **Biotrauma.** Las fuerzas mecánicas se traducen en señales biológicas (mecanotransducción): las células liberan citocinas y reclutan neutrófilos. En pacientes con SDRA, una estrategia con volúmenes y presiones mayores elevó las concentraciones de mediadores inflamatorios en el lavado broncoalveolar y en plasma, mientras que una estrategia protectora las redujo (Ranieri et al., 1999). Esto ofrece una explicación de por qué un pulmón mal ventilado puede contribuir a la falla de otros órganos.

<!-- block: THEORY | Mecanismos más recientes: ergotrauma y P-SILI -->
- **Ergotrauma.** Propone unificar todas las causas mecánicas en una sola magnitud, la **potencia mecánica**: la energía que el ventilador entrega al sistema respiratorio por unidad de tiempo. En el modelo de Gattinoni et al. (2016), la potencia crece con el cuadrado del volumen corriente, de la driving pressure y del flujo, con un exponente de 1,4 para la frecuencia respiratoria y de forma lineal con la PEEP. La idea clave es que el daño depende no solo de cuánto se estira el pulmón en cada ciclo, sino de cuántas veces por minuto y con qué rapidez. El cálculo y sus límites se tratan en la lección «Driving pressure y potencia mecánica».
- **P-SILI (lesión pulmonar autoinfligida por el paciente).** En un paciente con lesión pulmonar y un impulso respiratorio muy alto, los propios esfuerzos inspiratorios pueden generar oscilaciones amplias de presión transpulmonar, volúmenes grandes y aumento de la presión transmural en los capilares, con más fuga de líquido. Brochard et al. (2017) plantean que esta lesión se parece a la VILI y que la ventilación protectora podría verse, en algunos casos, como una medida para frenar la progresión y no solo como soporte. Es un concepto con base fisiológica sólida pero todavía debatido en cuanto a sus implicaciones clínicas (por ejemplo, cuándo intubar).

![Curva presión-volumen sigmoidea con tres zonas: abajo, zona de colapso y reapertura cíclica rotulada atelectrauma; en el centro, zona de pendiente máxima rotulada zona de menor riesgo; arriba, zona donde la curva se aplana rotulada volutrauma por sobredistensión](/learning/diagrams/a1-vili-curva-pv-zonas.svg "Figura: zonas de lesión sobre la curva presión-volumen estática")

<!-- block: CALLOUT:info | Una idea que une todo -->
Los mecanismos no compiten: el mismo pulmón puede tener regiones dependientes que colapsan y se reabren (atelectrauma) y regiones no dependientes sobredistendidas (volutrauma) en el mismo ciclo, y ambas alimentan la inflamación (biotrauma). Por eso la protección combina limitar el estiramiento con evitar el colapso cíclico.

<!-- page: stress-strain-baby-lung | THEORY | Stress, strain y baby lung -->
<!-- block: INTRODUCTION | Del ventilador al tejido -->
El ventilador mide presión y volumen en la vía aérea, pero el tejido pulmonar «siente» otras dos magnitudes: la fuerza que lo distiende (**stress**) y la deformación que sufre respecto de su tamaño de reposo (**strain**). Traducir unas en otras explica por qué un mismo volumen corriente puede ser inocuo en un paciente y lesivo en otro.

<!-- block: THEORY | Definiciones -->
En el sistema respiratorio, el equivalente clínico del stress es la **presión transpulmonar** ($P_L$), la diferencia entre la presión alveolar y la pleural. El strain es la relación entre el volumen insuflado y el volumen de reposo del pulmón, que es la capacidad residual funcional (CRF) (Chiumello et al., 2008):

$$
\text{Strain} = \frac{\Delta V}{CRF}
$$

$$
\text{Stress} = P_L = k \cdot \text{Strain}
$$

- $\Delta V$: volumen insuflado por encima de la CRF, en mL (en el ciclo corriente, el volumen corriente; con PEEP, se suma el volumen que la PEEP mantiene).
- $CRF$: volumen aireado al final de la espiración, en mL.
- $P_L$: presión transpulmonar, en cmH₂O.
- $k$: **elastancia específica del pulmón**, en cmH₂O; es la presión necesaria para duplicar el volumen de reposo.

El hallazgo central de Chiumello et al. (2008) fue que $k$ era muy parecida en sujetos sanos, en pacientes con lesión pulmonar aguda y en pacientes con SDRA (alrededor de 13 a 14 cmH₂O de media en todos los grupos) y no cambiaba con la PEEP ni con el volumen. En cambio, la CRF y la proporción de la presión aplicada que se transmite al pulmón variaban mucho. Conclusión práctica: la presión meseta y el volumen corriente por kilogramo son sustitutos imperfectos del stress y del strain reales.

<!-- block: THEORY | El baby lung -->
La tomografía de pacientes con SDRA mostró que el tejido normalmente aireado puede quedar reducido al tamaño del pulmón de un niño de 5 a 6 años, unos 300 a 500 g de tejido aireado (Gattinoni & Pesenti, 2005). Ese **baby lung** no es rígido: tiene elasticidad casi normal, pero es pequeño. La compliance del sistema respiratorio se relaciona linealmente con su tamaño, de modo que una compliance baja indica sobre todo «poco pulmón disponible». Además, el baby lung es un concepto funcional y no anatómico: en prono la densidad se redistribuye y cambian las regiones aireadas (Gattinoni & Pesenti, 2005).

La consecuencia es directa: lo peligroso no es el volumen corriente por kilogramo de peso, sino el volumen corriente en relación con el baby lung (Gattinoni & Pesenti, 2005).

![Dos columnas que comparan un pulmón sano con 2100 mL aireados y un pulmón con SDRA con 700 mL aireados; ambos reciben 420 mL de volumen corriente; el strain resulta 0,20 en el sano y 0,60 en el SDRA](/learning/diagrams/a1-vili-baby-lung-strain.svg "Figura: el mismo volumen corriente produce tres veces más strain en un baby lung")

<!-- block: THEORY | Ejemplo resuelto -->
Un paciente con SDRA recibe un volumen corriente de 420 mL. Supón que su volumen aireado al final de la espiración es de 700 mL (valor ilustrativo; la CRF no se mide de rutina en la cabecera).

1. Strain: $420 / 700 = 0{,}60$.
2. Stress estimado con una elastancia específica de 13,5 cmH₂O: $13{,}5 \times 0{,}60 \approx 8{,}1\,\text{cmH}_2\text{O}$ de presión transpulmonar corriente.
3. Si al mismo paciente se le programaran 840 mL (el doble), el strain sería $840/700 = 1{,}2$ y el stress, unos 16 cmH₂O.
4. Compara con un pulmón sano de 2100 mL aireados: 420 mL producen un strain de solo 0,20.

¿Existe un umbral de strain seguro? En cerdos sanos ventilados durante 54 horas, la lesión (aumento del peso pulmonar) apareció solo cuando el strain superó aproximadamente 1,5 a 2 (Protti et al., 2011). Los autores advierten que las propiedades del pulmón difieren entre especies, así que este valor orienta la fisiología pero no es un objetivo clínico validado en humanos.

<!-- block: CALLOUT:warning | Límite del modelo -->
La relación stress-strain describe el pulmón en conjunto. En un pulmón heterogéneo, las zonas de transición entre tejido abierto y colapsado actúan como amplificadores locales del stress, de modo que algunas regiones pueden sufrir mucho más de lo que sugiere el promedio. Por eso un strain global «aceptable» no garantiza ausencia de lesión regional.

<!-- page: evidencia-vili | THEORY | De los experimentos a la práctica clínica -->
<!-- block: INTRODUCTION | Cómo se construyó la evidencia -->
La VILI no se demostró en un solo estudio: se reconstruyó combinando experimentos en animales, que permiten aislar variables, con estudios fisiológicos y ensayos en pacientes, que confirman la relevancia clínica. Conocer esa cadena te ayuda a valorar la fuerza de cada recomendación.

<!-- block: THEORY | Evidencia experimental -->
#### El volumen, más que la presión

En ratas ventiladas con distintas combinaciones, una presión alta con volumen corriente normal no produjo edema, mientras que los grupos con volumen alto desarrollaron edema por aumento de la permeabilidad, incluso cuando la presión en la vía aérea era baja; la PEEP redujo el edema y preservó la ultraestructura del epitelio alveolar (Dreyfuss et al., 1988). De aquí surge el término volutrauma y la noción de que la PEEP, bien aplicada, puede ser protectora.

#### Existe un rango de deformación tolerable

El trabajo de Protti et al. (2011) mostró, en cerdos sanos, dos grupos bien separados: los animales que superaron un strain de alrededor de 1,5 a 2 aumentaron el peso pulmonar y desarrollaron inflamación pulmonar y sistémica y disfunción de órganos; los que se mantuvieron por debajo, no. Esto apoya que la lesión aparece al superar un umbral de deformación, aunque el valor exacto en humanos se desconoce.

#### La mecánica se convierte en inflamación

Ranieri et al. (1999) aleatorizaron a pacientes con SDRA a una estrategia convencional o a una estrategia protectora basada en la curva presión-volumen (menor volumen y más PEEP). A las 36 horas, el grupo convencional tenía más citocinas inflamatorias en el pulmón y en la sangre que el grupo protector. El estudio midió mediadores, no mortalidad, pero conectó la programación del ventilador con una respuesta sistémica.

<!-- block: THEORY | Evidencia clínica y sus matices -->
La demostración definitiva de que limitar el volumen salva vidas llegó con el ensayo de la red ARDSNet, que se analiza en la lección «Ventilación protectora: volumen corriente, presión meseta y driving pressure». Aquí interesa un matiz que deriva directamente del concepto de baby lung: **cumplir las cifras no garantiza la protección**.

Terragni et al. (2007) estudiaron con tomografía a pacientes ventilados con 6 mL/kg de peso predicho. En un tercio de ellos, el volumen corriente se distribuía sobre todo en regiones que ya estaban hiperinsufladas; esos pacientes tenían un compartimento no aireado más grande, más citocinas pulmonares, menos días libres de ventilador y presiones meseta de 28 a 30 cmH₂O, frente a 25 a 26 cmH₂O en los «más protegidos». Los autores concluyen que limitar el volumen a 6 mL/kg y la meseta a 30 cmH₂O puede no bastar en pacientes con mucho pulmón colapsado (Terragni et al., 2007).

<!-- block: THEORY | P-SILI: el esfuerzo del propio paciente -->
La evidencia de P-SILI procede sobre todo de modelos animales y de estudios fisiológicos. El argumento es que un esfuerzo inspiratorio vigoroso genera presiones pleurales muy negativas: la presión transpulmonar puede ser alta aunque la presión en la vía aérea sea modesta, y en un pulmón heterogéneo el aire puede desplazarse entre regiones dentro del mismo ciclo, sobredistendiendo zonas dependientes. Además, la presión negativa aumenta la presión transmural de los capilares y favorece el edema (Brochard et al., 2017). La implicación clínica, todavía en debate, es que un paciente con impulso respiratorio muy alto y volúmenes grandes, intubado o no, merece vigilancia estrecha: lo que ves en la presión de la vía aérea puede subestimar el stress real.

<!-- block: CALLOUT:info | Qué es firme y qué es hipótesis -->
Son firmes: el daño por sobredistensión, el papel protector de evitar el colapso cíclico y el beneficio clínico de limitar volumen y presión. Son hipótesis con apoyo fisiológico pero sin umbrales clínicos validados: el strain seguro en humanos, el límite de potencia mecánica y el alcance clínico de la P-SILI.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 58 años, talla 160 cm, peso real 85 kg, con neumonía neumocócica bilateral. Lleva 6 horas intubada. Programación en VCV: volumen corriente 560 mL, FR 18/min, PEEP 5 cmH₂O, FiO₂ 0,7. En la pausa inspiratoria observas presión pico 36 cmH₂O y presión meseta 31 cmH₂O. Radiografía con opacidades bilaterales; PaO₂/FiO₂ 140 mmHg.

**Paso 1. ¿Cuánto pulmón hay?** La compliance estática es $560 / (31 - 5) \approx 21{,}5\,\text{mL/cmH}_2\text{O}$. Recordando que la compliance refleja el tamaño del baby lung (Gattinoni & Pesenti, 2005), este valor sugiere que queda poco pulmón aireado.

**Paso 2. ¿Qué mecanismo predomina?** El volumen de 560 mL se calculó con el peso real. La meseta de 31 cmH₂O indica que el pulmón aireado trabaja cerca de la zona alta de la curva presión-volumen: riesgo de **volutrauma**. La PEEP de 5 cmH₂O en un pulmón con mucho tejido colapsado deja regiones que pueden abrirse y cerrarse en cada ciclo: riesgo de **atelectrauma**. Ambos alimentan el **biotrauma** (Ranieri et al., 1999).

**Paso 3. Estimación del strain.** Supón, solo para el razonamiento, que el volumen aireado al final de la espiración fuera de unos 700 mL. El strain corriente sería $560/700 = 0{,}8$, cuatro veces mayor que el de un pulmón sano que recibe un volumen similar. Si añades el volumen retenido por la PEEP, el strain total es aún mayor.

**Paso 4. Dirección de los cambios.** Reducir el volumen corriente disminuye directamente el strain y la meseta. Ajustar la PEEP puede reducir el colapso cíclico, pero también puede sobredistender si el pulmón es poco reclutable: cada cambio de PEEP debe acompañarse de una nueva medición de la meseta y de la driving pressure. Los objetivos numéricos y cómo calcular el volumen por peso predicho se tratan en la lección siguiente.

**Paso 5. Vigila la P-SILI.** Si más adelante la paciente se despierta con esfuerzos muy intensos y volúmenes que superan lo programado, el stress real puede ser mayor de lo que muestra el monitor (Brochard et al., 2017).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y prueba lo siguiente:

1. En VCV, aumenta el volumen corriente en pasos y observa cómo la presión meseta sube de forma desproporcionada: en el bucle presión-volumen la curva se aplana al final de la inspiración, señal de sobredistensión.
2. Vuelve al volumen inicial y reduce la PEEP: observa que la compliance empeora y que la oxigenación cae, reflejo de más colapso.
3. Compara la diferencia entre presión pico y meseta con la diferencia entre meseta y PEEP para separar el componente resistivo del elástico.

<!-- block: EXERCISE | Comprueba lo aprendido -->
**1.** Dos pacientes reciben 450 mL. El paciente A tiene 2000 mL aireados al final de la espiración y el B, 600 mL. Calcula el strain de cada uno.

*Respuesta:* A: $450/2000 = 0{,}23$. B: $450/600 = 0{,}75$. El mismo volumen deforma más de tres veces más el pulmón de B.

**2.** ¿Por qué un neumotórax en un paciente con presión meseta «aceptable» no descarta que la programación haya contribuido?

*Respuesta:* Porque la lesión depende del stress regional y del strain, no de la presión media de la vía aérea. En un pulmón heterogéneo, las zonas de transición concentran fuerzas, y los esfuerzos del paciente pueden aumentar la presión transpulmonar sin que suba la presión en la vía aérea (Brochard et al., 2017; Terragni et al., 2007).

**3.** Según el modelo de potencia mecánica, ¿qué tiene más efecto sobre la energía entregada: duplicar el volumen corriente o duplicar la PEEP?

*Respuesta:* Duplicar el volumen corriente, porque la potencia crece con su cuadrado, mientras que con la PEEP lo hace de forma lineal (Gattinoni et al., 2016).

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La VILI es una lesión real, parecida al propio SDRA, que la programación del ventilador puede causar o agravar.
- El volumen (estiramiento) daña más que la presión aislada; la PEEP puede proteger frente al colapso cíclico (Dreyfuss et al., 1988).
- Volutrauma, atelectrauma, barotrauma y biotrauma coexisten en el mismo pulmón; el ergotrauma los integra como energía entregada por minuto (Gattinoni et al., 2016).
- Stress es la presión transpulmonar y strain, el volumen insuflado dividido por la CRF; la elastancia específica que los une es parecida entre personas (Chiumello et al., 2008).
- En el SDRA el pulmón es pequeño, no rígido: lo que importa es el volumen respecto del baby lung (Gattinoni & Pesenti, 2005).
- Cumplir 6 mL/kg y meseta ≤ 30 cmH₂O no garantiza protección si hay mucho pulmón no aireado (Terragni et al., 2007).
- Los esfuerzos intensos del paciente pueden lesionar el pulmón (P-SILI), un concepto con base fisiológica aún en debate (Brochard et al., 2017).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Pensar que el barotrauma depende solo de la presión pico** → la pico incluye el componente resistivo, que se disipa en la vía aérea y no distiende el alvéolo → evalúa la presión meseta y la driving pressure con pausa inspiratoria.
- **Calcular el volumen con el peso real** → el pulmón no crece con la grasa ni con el edema → usa el peso predicho por talla y sexo.
- **Interpretar la compliance baja como «pulmón duro»** → en el SDRA suele indicar poco pulmón aireado con elasticidad casi normal → piensa en volumen disponible y reduce el volumen corriente en proporción.
- **Dar por segura una meseta por debajo del límite** → la protección es relativa al tamaño del baby lung → revisa también la driving pressure y la tendencia de la compliance.
- **Ignorar los esfuerzos del paciente en modos asistidos** → la presión pleural negativa aumenta la presión transpulmonar sin reflejarse en la vía aérea → vigila volúmenes reales, frecuencia y signos de impulso respiratorio excesivo.

<!-- block: REFERENCES | Referencias -->
- Brochard, L., Slutsky, A., & Pesenti, A. (2017). Mechanical ventilation to minimize progression of lung injury in acute respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 195*(4), 438-442. [https://doi.org/10.1164/rccm.201605-1081CP](https://doi.org/10.1164/rccm.201605-1081CP)
- Chiumello, D., Carlesso, E., Cadringher, P., Caironi, P., Valenza, F., Polli, F., Tallarini, F., Cozzi, P., Cressoni, M., Colombo, A., Marini, J. J., & Gattinoni, L. (2008). Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 178*(4), 346-355. [https://doi.org/10.1164/rccm.200710-1589OC](https://doi.org/10.1164/rccm.200710-1589OC)
- Dreyfuss, D., Soler, P., Basset, G., & Saumon, G. (1988). High inflation pressure pulmonary edema: Respective effects of high airway pressure, high tidal volume, and positive end-expiratory pressure. *American Review of Respiratory Disease, 137*(5), 1159-1164. [https://doi.org/10.1164/ajrccm/137.5.1159](https://doi.org/10.1164/ajrccm/137.5.1159)
- Gattinoni, L., & Pesenti, A. (2005). The concept of "baby lung". *Intensive Care Medicine, 31*(6), 776-784. [https://doi.org/10.1007/s00134-005-2627-z](https://doi.org/10.1007/s00134-005-2627-z)
- Gattinoni, L., Tonetti, T., Cressoni, M., Cadringher, P., Herrmann, P., Moerer, O., Protti, A., Gotti, M., Chiurazzi, C., Carlesso, E., Chiumello, D., & Quintel, M. (2016). Ventilator-related causes of lung injury: The mechanical power. *Intensive Care Medicine, 42*(10), 1567-1575. [https://doi.org/10.1007/s00134-016-4505-2](https://doi.org/10.1007/s00134-016-4505-2)
- Protti, A., Cressoni, M., Santini, A., Langer, T., Mietto, C., Febres, D., Chierichetti, M., Coppola, S., Conte, G., Gatti, S., Leopardi, O., Masson, S., Lombardi, L., Lazzerini, M., Rampoldi, E., Cadringher, P., & Gattinoni, L. (2011). Lung stress and strain during mechanical ventilation: Any safe threshold? *American Journal of Respiratory and Critical Care Medicine, 183*(10), 1354-1362. [https://doi.org/10.1164/rccm.201010-1757OC](https://doi.org/10.1164/rccm.201010-1757OC)
- Ranieri, V. M., Suter, P. M., Tortorella, C., De Tullio, R., Dayer, J. M., Brienza, A., Bruno, F., & Slutsky, A. S. (1999). Effect of mechanical ventilation on inflammatory mediators in patients with acute respiratory distress syndrome: A randomized controlled trial. *JAMA, 282*(1), 54-61. [https://doi.org/10.1001/jama.282.1.54](https://doi.org/10.1001/jama.282.1.54)
- Terragni, P. P., Rosboch, G., Tealdi, A., Corno, E., Menaldo, E., Davini, O., Gandini, G., Herrmann, P., Mascia, L., Quintel, M., Slutsky, A. S., Gattinoni, L., & Ranieri, V. M. (2007). Tidal hyperinflation during low tidal volume ventilation in acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 175*(2), 160-166. [https://doi.org/10.1164/rccm.200607-915OC](https://doi.org/10.1164/rccm.200607-915OC)
