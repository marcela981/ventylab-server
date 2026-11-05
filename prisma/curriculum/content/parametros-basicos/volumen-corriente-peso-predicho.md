<!-- page: por-que-el-peso-predicho | THEORY | Conceptos: el volumen corriente se dosifica según el tamaño del pulmón -->
<!-- block: INTRODUCTION | Por qué importa -->
El volumen corriente (Vt) es el volumen de gas que entra en el sistema respiratorio en cada ciclo. Es el primer número que programas en un modo controlado por volumen y el que más directamente determina cuánto se estira el pulmón en cada respiración. Un Vt demasiado grande distiende en exceso los alvéolos que siguen abiertos; uno demasiado pequeño puede no eliminar el CO₂ producido o favorecer el colapso de zonas mal ventiladas si no se acompaña de una PEEP y una frecuencia adecuadas.

La pregunta práctica es: ¿cuánto volumen es "adecuado" para este paciente? La respuesta no se obtiene de la báscula. Se obtiene de la **talla** y el **sexo**, porque son los determinantes principales del tamaño de los pulmones. Esta lección explica por qué, cómo se calcula el **peso corporal predicho** (PBW, *predicted body weight*) y qué rango de mL/kg respalda la evidencia en cada situación.

<!-- block: THEORY | El pulmón no engorda -->
Imagina dos personas de 170 cm de altura y del mismo sexo: una pesa 60 kg y la otra 120 kg. El tejido adiposo adicional se deposita en la pared torácica, el abdomen y otros tejidos, pero la caja torácica de ambas tiene aproximadamente el mismo tamaño y sus pulmones contienen un número similar de alvéolos. Si programaras el Vt multiplicando mL por kg de peso real, la segunda persona recibiría el doble de volumen en un pulmón del mismo tamaño. El resultado sería una distensión mucho mayor de cada unidad alveolar.

Por la misma razón, el pulmón de una persona baja es más pequeño que el de una persona alta, aunque ambas pesen lo mismo. El volumen pulmonar escala con las dimensiones del tórax, y estas se relacionan con la estatura. Por eso, en el ensayo que cambió la práctica de la ventilación en el síndrome de dificultad respiratoria aguda (SDRA), el Vt se calculó sobre el peso predicho a partir de la talla y el sexo, no sobre el peso medido (ARDS Network, 2000).

#### Lo que realmente importa: deformación del pulmón aireado

El daño por estiramiento depende de cuánto se deforma el tejido respecto de su tamaño en reposo. Un mismo Vt absoluto (por ejemplo, 500 mL) es moderado para un pulmón grande y excesivo para uno pequeño. Expresar el Vt en mL/kg de PBW es una forma práctica de "normalizar" el volumen al tamaño esperado del pulmón. En pulmones enfermos, la parte que sigue aireada puede ser mucho menor que la esperada por la talla, de modo que incluso un Vt "correcto" por PBW puede resultar grande para ese pulmón funcional; este concepto se desarrolla en la lección sobre VILI y ventilación protectora.

![Nomograma con dos rectas paralelas que muestran el peso corporal predicho frente a la talla para hombres y mujeres, con los ejemplos de una mujer de 160 cm (unos 52 kg) y un hombre de 175 cm (unos 71 kg)](/learning/diagrams/b4-vt-nomograma-pbw.svg "Figura: el peso predicho depende solo de la talla y el sexo")

<!-- block: THEORY | Peso real, peso ideal, peso predicho y peso ajustado -->
En la literatura y en las historias clínicas aparecen varios "pesos". Conviene distinguirlos para no mezclarlos al programar el ventilador:

| Término | Qué representa | ¿Sirve para el Vt? |
|---|---|---|
| Peso real (medido) | Lo que marca la báscula, incluye grasa, edema y masa muscular | No |
| Peso predicho (PBW) | Estimación a partir de talla y sexo con la fórmula de ARDSNet | Sí, es el estándar |
| Peso ideal (IBW) | Término antiguo, a menudo usado como sinónimo del PBW | Solo si se calcula con la misma fórmula |
| Peso ajustado | Peso intermedio usado en farmacología | No |

Algunas revisiones usan "peso ideal" para referirse al mismo cálculo basado en talla y sexo (Walter et al., 2018). Lo importante no es el nombre, sino que la cifra provenga de la talla y no de la báscula. La guía de la ESICM señala precisamente que los ensayos antiguos calcularon el Vt con pesos distintos (ajustado, ideal o predicho), lo que dificulta compararlos (Grasselli et al., 2023).

#### La talla también hay que medirla

El cálculo es tan bueno como la talla que introduces. En el paciente crítico, la talla referida por la familia o estimada "a ojo" puede tener errores de varios centímetros, y cada centímetro cambia el PBW en casi 1 kg. Siempre que sea posible, mide la longitud del paciente en decúbito con una cinta métrica y anótala en un lugar visible de la historia y del ventilador.

<!-- page: formulas-pbw-vt | EXERCISE | Fórmulas y cálculo del volumen corriente -->
<!-- block: THEORY | Fórmulas del peso corporal predicho -->
El protocolo de la red ARDS del NHLBI define el PBW con la talla en pulgadas: 50 + 2,3 × (talla en pulgadas − 60) para hombres y 45,5 + 2,3 × (talla en pulgadas − 60) para mujeres (NHLBI ARDS Network, 2008). Como 1 pulgada son 2,54 cm, 60 pulgadas equivalen a 152,4 cm y 2,3 kg por pulgada equivalen a unos 0,91 kg por cm. La forma métrica es:

$$
PBW_{\text{hombre}} = 50 + 0{,}91\,\left(T - 152{,}4\right)
$$

$$
PBW_{\text{mujer}} = 45{,}5 + 0{,}91\,\left(T - 152{,}4\right)
$$

donde $T$ es la talla en cm y $PBW$ se expresa en kg. Observa que las dos rectas son paralelas: para la misma talla, el PBW de una mujer es 4,5 kg menor que el de un hombre.

Una vez calculado el PBW, el volumen corriente programado es:

$$
V_T = \text{mL/kg elegidos} \times PBW
$$

<!-- block: EQUATION | Conversión inversa: ¿cuántos mL/kg recibe ya el paciente? -->
\frac{V_T}{PBW} = \frac{V_T\,(\text{mL})}{PBW\,(\text{kg})}\;\;[\text{mL/kg de PBW}]

<!-- block: THEORY | Qué rango de mL/kg usar -->
- **SDRA.** El ensayo de ARDSNet comparó un Vt inicial de 6 mL/kg de PBW con presión meseta ≤ 30 cmH₂O frente a 12 mL/kg de PBW; la mortalidad fue 31,0 % frente a 39,8 % (ARDS Network, 2000). La guía ESICM 2023 recomienda Vt de 4 a 8 mL/kg de PBW en el SDRA no relacionado con COVID-19 (Grasselli et al., 2023). El protocolo de ARDSNet propone empezar con 8 mL/kg y reducir 1 mL/kg en intervalos de 2 horas o menos hasta llegar a 6 mL/kg (NHLBI ARDS Network, 2008).
- **Pacientes sin SDRA.** Un metaanálisis encontró que Vt más bajos se asociaban a menos lesión pulmonar y menor mortalidad (Serpa Neto et al., 2012), pero un ensayo aleatorizado posterior que comparó un Vt bajo (objetivo de 4 a 6 mL/kg de PBW) con uno intermedio (8 a 10 mL/kg de PBW) no encontró diferencias en días libres de ventilador ni en mortalidad (Simonis et al., 2015; Simonis et al., 2018). La evidencia, por tanto, no obliga a 6 mL/kg en todos los pacientes, pero sí desaconseja volver a los Vt grandes de épocas anteriores. Una revisión clínica propone 7 a 8 mL/kg como punto de partida razonable en adultos con ventilación minuto normal (Walter et al., 2018).

El Vt nunca se valida solo: después de programarlo debes comprobar la presión meseta y la gasometría, que se tratan en otras lecciones.

<!-- block: EXERCISE | Ejemplo resuelto -->
**Paciente:** hombre, talla medida 175 cm.

1. Diferencia con 152,4 cm: $175 - 152{,}4 = 22{,}6$ cm.
2. Producto: $0{,}91 \times 22{,}6 = 20{,}6$ kg.
3. PBW: $50 + 20{,}6 = 70{,}6$ kg.
4. Vt a 6 mL/kg: $6 \times 70{,}6 = 424$ mL. Vt a 8 mL/kg: $8 \times 70{,}6 = 565$ mL.

**Paciente:** mujer, talla 160 cm, peso real 110 kg.

1. $160 - 152{,}4 = 7{,}6$ cm; $0{,}91 \times 7{,}6 = 6{,}9$ kg.
2. PBW: $45{,}5 + 6{,}9 = 52{,}4$ kg.
3. Vt a 6 mL/kg de PBW: $6 \times 52{,}4 = 314$ mL; a 8 mL/kg: $419$ mL.
4. Si alguien hubiera usado el peso real: $6 \times 110 = 660$ mL, que equivale a $660 / 52{,}4 = 12{,}6$ mL/kg de PBW, el doble de lo pretendido.

![Barras horizontales que comparan, para una mujer de 160 cm y 110 kg, el volumen corriente con 6 mL/kg de peso real (660 mL, unos 12,6 mL/kg de peso predicho), con 8 mL/kg de peso predicho (419 mL) y con 6 mL/kg de peso predicho (314 mL)](/learning/diagrams/b4-vt-peso-real-vs-predicho.svg "Figura: usar el peso real duplica el volumen en esta paciente")

<!-- page: aplicacion-clinica-vt | CASE_STUDY | Aplicación clínica: elegir el volumen corriente -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Situación.** Mujer de 58 años, talla medida 158 cm, peso 104 kg, intubada en urgencias por neumonía con hipoxemia grave. La radiografía muestra opacidades bilaterales y la relación PaO₂/FiO₂ es de 140 mmHg con PEEP de 8 cmH₂O, por lo que el equipo sospecha un SDRA. En el traslado le programaron VCV con Vt de 600 mL "porque es una paciente grande".

**Paso 1: calcula el PBW.** $158 - 152{,}4 = 5{,}6$; $0{,}91 \times 5{,}6 = 5{,}1$; PBW $= 45{,}5 + 5{,}1 = 50{,}6$ kg.

**Paso 2: expresa el Vt actual en mL/kg de PBW.** $600 / 50{,}6 = 11{,}9$ mL/kg de PBW. Es prácticamente el Vt del grupo "tradicional" del ensayo de ARDSNet (ARDS Network, 2000).

**Paso 3: define el objetivo.** Con sospecha de SDRA, el objetivo es 6 mL/kg de PBW, dentro del rango de 4 a 8 mL/kg recomendado (Grasselli et al., 2023): $6 \times 50{,}6 = 304$ mL. El protocolo de ARDSNet permite descender de forma escalonada desde 8 mL/kg (405 mL) en pasos de 1 mL/kg (NHLBI ARDS Network, 2008).

**Paso 4: compensa la ventilación minuto.** Al pasar de 600 a unos 300 mL, la ventilación minuto caería a la mitad si no cambias nada más. Por eso, el protocolo aumenta la frecuencia respiratoria a la vez, sin superar 35 respiraciones por minuto, y acepta un pH de 7,30 o mayor (NHLBI ARDS Network, 2008). La lección «Frecuencia, tiempos y relación I:E» detalla este cálculo.

**Paso 5: verifica.** Mide la presión meseta con una pausa inspiratoria de 0,5 s; el objetivo es ≤ 30 cmH₂O (NHLBI ARDS Network, 2008). Comprueba en la pantalla que el Vt espirado coincide con el programado y deja anotados la talla y el PBW en la hoja de ventilación.

**Por qué importa el caso.** En una cohorte de pacientes con lesión pulmonar aguda por sepsis, las personas de menor talla recibieron ventilación protectora con menos frecuencia, y esa diferencia explicaba por qué las mujeres la recibían menos que los hombres (Han et al., 2011). El error de esta paciente (dosificar por "tamaño aparente") es exactamente el sesgo que describe ese estudio.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y prueba lo siguiente:

- Calcula el PBW con la talla del caso y compáralo con el peso real que aparece en la ficha.
- Programa primero un Vt basado en el peso real y observa cómo sube la presión meseta en la curva de presión con pausa.
- Reduce el Vt a 6 mL/kg de PBW: la meseta baja, pero si no ajustas la frecuencia verás que la PaCO₂ tiende a subir con el tiempo.
- Aumenta la frecuencia de forma gradual y observa cómo se recupera la ventilación minuto en el monitor.

<!-- block: EXERCISE | Preguntas de práctica -->
**1.** Hombre de 190 cm y 75 kg. ¿Cuál es su Vt a 6 mL/kg de PBW?

*Respuesta:* $190 - 152{,}4 = 37{,}6$; $0{,}91 \times 37{,}6 = 34{,}2$; PBW $= 84{,}2$ kg. Vt $= 6 \times 84{,}2 = 505$ mL. Fíjate en que el PBW es mayor que su peso real: en personas altas y delgadas, usar el peso real daría un Vt más pequeño que el pretendido.

**2.** Una mujer de 152 cm recibe 450 mL. ¿Cuántos mL/kg de PBW recibe?

*Respuesta:* $152 - 152{,}4 = -0{,}4$; $0{,}91 \times (-0{,}4) = -0{,}4$; PBW $\approx 45{,}1$ kg. $450 / 45{,}1 = 10{,}0$ mL/kg de PBW: muy por encima del rango protector.

**3.** ¿Por qué no basta con recordar "500 mL para todos los adultos"?

*Respuesta:* porque 500 mL equivalen a unos 7 mL/kg en un hombre de 175 cm, pero a unos 11 mL/kg en una mujer de 152 cm. La dosis fija castiga a las personas de menor talla, que son con más frecuencia mujeres (Han et al., 2011).

<!-- page: sintesis-vt | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El tamaño del pulmón depende de la talla y el sexo, no del peso corporal real; por eso el Vt se dosifica por peso corporal predicho (ARDS Network, 2000).
- Fórmula métrica: PBW = 50 (hombres) o 45,5 (mujeres) + 0,91 × (talla en cm − 152,4) (NHLBI ARDS Network, 2008).
- En el SDRA, el objetivo es un Vt de 4 a 8 mL/kg de PBW, típicamente 6 mL/kg, con presión meseta ≤ 30 cmH₂O (Grasselli et al., 2023; NHLBI ARDS Network, 2008).
- Sin SDRA, un Vt bajo no mejoró los días libres de ventilador frente a uno intermedio, pero los Vt grandes siguen siendo desaconsejables (Simonis et al., 2018; Serpa Neto et al., 2012).
- Mide la talla siempre que puedas: cada centímetro cambia el PBW en casi 1 kg.
- Expresa siempre el Vt actual en mL/kg de PBW para saber dónde está el paciente.
- Al reducir el Vt, compensa la ventilación minuto con la frecuencia y verifica meseta y gasometría.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Calcular el Vt con el peso real** → en personas con obesidad entrega volúmenes muy superiores al tamaño del pulmón → usa siempre el PBW calculado con la talla.
- **Usar una dosis fija ("500 mL")** → sobredistiende a pacientes bajos y a muchas mujeres (Han et al., 2011) → calcula el PBW de cada paciente.
- **Estimar la talla a ojo** → errores de varios centímetros cambian el PBW varios kilogramos → mide la longitud en decúbito y regístrala.
- **Bajar el Vt sin tocar la frecuencia** → cae la ventilación minuto y aparece acidosis respiratoria → aumenta la frecuencia en paralelo y controla el pH (NHLBI ARDS Network, 2008).
- **Considerar que 6 mL/kg es "seguro" en cualquier pulmón** → en un pulmón con poca zona aireada puede seguir siendo excesivo → comprueba siempre la presión meseta.

<!-- block: REFERENCES | Referencias -->
- The Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary* [Protocolo]. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., et al. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Serpa Neto, A., Cardoso, S. O., Manetta, J. A., Pereira, V. G., Espósito, D. C., Pasqualucci, M. de O., et al. (2012). Association between use of lung-protective ventilation with lower tidal volumes and clinical outcomes among patients without acute respiratory distress syndrome: A meta-analysis. *JAMA, 308*(16), 1651–1659. [https://doi.org/10.1001/jama.2012.13730](https://doi.org/10.1001/jama.2012.13730)
- Simonis, F. D., Binnekade, J. M., Braber, A., Gelissen, H. P., et al. (2015). PReVENT — protective ventilation in patients without ARDS at start of ventilation: Study protocol for a randomized controlled trial. *Trials, 16*, 226. [https://doi.org/10.1186/s13063-015-0759-1](https://doi.org/10.1186/s13063-015-0759-1)
- Writing Group for the PReVENT Investigators, Simonis, F. D., Serpa Neto, A., Binnekade, J. M., et al. (2018). Effect of a low vs intermediate tidal volume strategy on ventilator-free days in intensive care unit patients without ARDS: A randomized clinical trial. *JAMA, 320*(18), 1872–1880. [https://doi.org/10.1001/jama.2018.14280](https://doi.org/10.1001/jama.2018.14280)
- Han, S., Martin, G. S., Maloney, J. P., Shanholtz, C., Barnes, K. C., Murray, S., & Sevransky, J. E. (2011). Short women with severe sepsis-related acute lung injury receive lung protective ventilation less frequently: An observational cohort study. *Critical Care, 15*(6), R262. [https://doi.org/10.1186/cc10524](https://doi.org/10.1186/cc10524)
- Walter, J. M., Corbridge, T. C., & Singer, B. D. (2018). Invasive mechanical ventilation. *Southern Medical Journal, 111*(12), 746–753. [https://doi.org/10.14423/SMJ.0000000000000905](https://doi.org/10.14423/SMJ.0000000000000905)
