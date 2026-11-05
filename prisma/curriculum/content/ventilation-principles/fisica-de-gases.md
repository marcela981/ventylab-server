<!-- page: presion-volumen-flujo | THEORY | Presión, volumen y flujo: las tres magnitudes del ventilador -->
<!-- block: INTRODUCTION | Por qué empezar por la física -->
Cada número que aparece en la pantalla de un ventilador es una magnitud física: una presión medida en la vía aérea, un volumen que entra o sale, un flujo que cambia de un instante a otro. Si no tienes claro qué representa cada una, es fácil confundir causa con efecto: pensar, por ejemplo, que una presión pico alta significa siempre un pulmón rígido, cuando puede deberse a un tubo acodado. Esta lección te da el vocabulario físico mínimo para leer el ventilador con criterio: qué es la presión y respecto de qué se mide, cómo se relacionan volumen y flujo, qué leyes de los gases explican lo que ocurre en el alvéolo y cómo pasar de una unidad a otra sin errores.

<!-- block: THEORY | Presión: fuerza repartida en una superficie -->
La **presión** es la fuerza que actúa sobre cada unidad de superficie. En el sistema internacional se mide en pascales (1 Pa = 1 N/m²), una unidad muy pequeña para la clínica; por eso en ventilación se usan el centímetro de agua (cmH₂O) para las presiones de la vía aérea y el milímetro de mercurio (mmHg) o el kilopascal (kPa) para los gases en sangre.

Un detalle decisivo: **el ventilador muestra presiones relativas a la atmósfera** (presión manométrica). Cuando la pantalla indica PEEP = 5 cmH₂O, significa que al final de la espiración la presión en la vía aérea está 5 cmH₂O por encima de la presión atmosférica del lugar, no que la presión absoluta sea 5. En cambio, cuando hablamos de presiones parciales de gases (PaO₂, PaCO₂) usamos presiones absolutas, que dependen de la presión barométrica.

Las presiones que más usarás en el ventilador son:

- **Presión en la vía aérea** ($P_{aw}$): la que mide el equipo en el circuito, cerca del paciente o dentro del propio ventilador.
- **Presión alveolar** ($P_{alv}$): la que existe dentro del alvéolo. Solo se iguala con $P_{aw}$ cuando no hay flujo (por ejemplo, durante una pausa).
- **Presión pleural** ($P_{pl}$): la que rodea al pulmón dentro del tórax.
- **Presión transpulmonar** ($P_{L} = P_{alv} - P_{pl}$): la que realmente distiende el pulmón.

La idea central es que **el gas solo se mueve si hay una diferencia de presión** entre dos puntos. En la respiración espontánea los músculos hacen que la presión alveolar caiga por debajo de la atmosférica; en ventilación con presión positiva el ventilador eleva la presión en la entrada de la vía aérea por encima de la alveolar. El mecanismo de esa inversión se estudia en la lección «De la presión negativa a la presión positiva».

<!-- block: THEORY | Volumen y flujo: cantidad y velocidad -->
El **volumen** es la cantidad de gas, en mililitros (mL) o litros (L). El volumen corriente ($V_T$) es el que entra en cada ciclo; el volumen minuto ($\dot{V}_E$) es el total movilizado en un minuto.

El **flujo** ($\dot{V}$) es la velocidad a la que cambia el volumen, en litros por minuto (L/min) o litros por segundo (L/s). El punto sobre la V indica precisamente eso: una derivada respecto del tiempo. Flujo y volumen están unidos de forma exacta:

$$
\dot{V} = \frac{dV}{dt} \qquad\Longleftrightarrow\qquad V(t) = \int_0^{t} \dot{V}\,dt
$$

Dicho en palabras: el volumen es el área bajo la curva de flujo. Si el ventilador entrega un flujo constante de 60 L/min (1 L/s) durante 0,5 s, el volumen entregado es 0,5 L. Por convención, el flujo inspiratorio se dibuja positivo (por encima de cero) y el espiratorio negativo.

<!-- block: THEORY | Qué genera la presión en la vía aérea -->
Para mover gas hacia un pulmón hay que vencer dos oposiciones: la **elástica**, que depende de cuánto volumen ya se metió y de la rigidez del sistema (compliance), y la **resistiva**, que depende del flujo y del calibre de las vías aéreas. Por eso la presión en la vía aérea sube con el volumen y también con el flujo. Esta relación se formaliza en la ecuación del movimiento, que estudiarás en el nivel Principiante («La ecuación del movimiento»); por ahora basta con retener que **presión, volumen y flujo no son independientes**: si el ventilador controla uno de ellos, los otros dos resultan de la mecánica del paciente (Cairo, 2020; Hess y Kacmarek, 2019).

![Modelo de un pulmón como un tubo estrecho que conduce a un globo elástico. Una flecha indica el flujo que atraviesa el tubo (componente resistivo) y el globo se infla con volumen (componente elástico); un manómetro mide la presión a la entrada.](/learning/diagrams/pr2-gases-modelo-tubo-globo.svg "Figura: modelo del sistema respiratorio como resistencia más globo elástico")

<!-- block: CALLOUT:info | Presión manométrica frente a presión absoluta -->
Todas las presiones del ventilador (PEEP, presión pico, presión meseta) son manométricas: se miden respecto a la atmósfera, que vale cero en la pantalla. Las presiones parciales de los gases sanguíneos son absolutas y cambian con la altitud. No mezcles ambas referencias en un mismo cálculo.

<!-- page: leyes-de-los-gases | THEORY | Leyes de los gases aplicadas a la respiración -->
<!-- block: INTRODUCTION | Cuatro leyes, muchas consecuencias clínicas -->
Las leyes de los gases ideales describen bien el comportamiento del aire y del oxígeno en las condiciones del cuerpo. No necesitas memorizarlas como enunciados de física: necesitas reconocer dónde aparecen junto a la cama del paciente. Boyle explica por qué el gas entra al pulmón; Dalton, por qué el oxígeno inspirado no llega entero al alvéolo; Henry, por qué el oxígeno disuelto en plasma es tan poco; y la ley de Charles, por qué un volumen medido en el ventilador no es el mismo que ocupa en el pulmón caliente y húmedo.

<!-- block: THEORY | Ley de Boyle: presión y volumen -->
A temperatura constante, el producto de la presión absoluta por el volumen de una cantidad fija de gas se mantiene constante:

$$
P_1 \cdot V_1 = P_2 \cdot V_2
$$

Si el volumen aumenta, la presión disminuye en la misma proporción. En la inspiración espontánea el diafragma agranda el tórax, el volumen alveolar aumenta, la presión alveolar cae unos pocos cmH₂O por debajo de la atmosférica y el aire entra hasta que las presiones se igualan (West y Luks, 2021). Boyle también explica que una pequeña diferencia de presión basta para mover volúmenes grandes: la presión atmosférica equivale a más de 1000 cmH₂O, y unos pocos cmH₂O de gradiente son suficientes para ventilar.

<!-- block: THEORY | Ley de Dalton: presiones parciales -->
En una mezcla de gases, la presión total es la suma de las presiones que ejercería cada gas por separado (presiones parciales), y cada presión parcial es proporcional a la fracción de ese gas en la mezcla:

$$
P_{\text{total}} = P_{O_2} + P_{N_2} + P_{CO_2} + P_{H_2O} \qquad P_{gas} = F_{gas}\cdot P_{\text{total}}
$$

Al entrar en la vía aérea, el aire se calienta a 37 °C y se satura de vapor de agua, cuya presión a esa temperatura es de 47 mmHg (West y Luks, 2021). Ese vapor «ocupa sitio» y diluye a los demás gases, así que la presión inspirada de oxígeno se calcula sobre la presión barométrica menos la del vapor de agua:

$$
P_{IO_2} = F_{IO_2}\cdot\left(P_B - P_{H_2O}\right)
$$

donde $P_{IO_2}$ es la presión inspirada de O₂ en la tráquea (mmHg), $F_{IO_2}$ la fracción inspirada de O₂ (sin unidades; 0,21 en aire ambiente, con más exactitud 0,2093), $P_B$ la presión barométrica (mmHg) y $P_{H_2O}$ la presión de vapor de agua a 37 °C (mmHg). Esta ecuación es el primer peldaño de la ecuación del gas alveolar, que verás en «Oxigenación y ventilación: dos objetivos distintos».

![Gráfico de barras que compara la presión inspirada de oxígeno respirando aire a nivel del mar y a 2600 m de altitud: la presión barométrica baja de 760 a unos 563 mmHg y la presión inspirada de oxígeno baja de unos 149 a unos 108 mmHg, aunque la fracción de oxígeno sigue siendo 21 %.](/learning/diagrams/pr2-gases-presiones-parciales.svg "Figura: la FiO₂ es la misma, pero la presión inspirada de O₂ cae con la altitud")

<!-- block: THEORY | Ley de Henry: gas disuelto en un líquido -->
La cantidad de un gas que se disuelve en un líquido es proporcional a su presión parcial sobre ese líquido y a un coeficiente de solubilidad propio de cada gas. Para el oxígeno en sangre, cada mmHg de PO₂ disuelve 0,003 mL de O₂ por cada 100 mL de sangre (West y Luks, 2021):

$$
O_{2\,\text{disuelto}} = 0{,}003 \cdot P_aO_2 \quad (\text{mL O}_2/\text{dL})
$$

Con una PaO₂ de 100 mmHg, el oxígeno disuelto es apenas 0,3 mL/dL; la mayor parte del oxígeno viaja unido a la hemoglobina (lo estudias en «Intercambio gaseoso y transporte de O₂ y CO₂»). El CO₂ es unas 20 veces más soluble que el O₂ (West y Luks, 2021), una de las razones por las que difunde con más facilidad a través de la membrana alveolocapilar.

<!-- block: THEORY | Ley de Charles y condiciones BTPS -->
A presión constante, el volumen de un gas es proporcional a su temperatura absoluta ($V_1/T_1 = V_2/T_2$, con T en kelvin). Combinada con Dalton, esta ley explica que el mismo número de moléculas ocupe más volumen en el pulmón (37 °C, saturado de agua: condiciones **BTPS**) que en el ambiente (condiciones **ATPS**). La corrección es:

$$
V_{BTPS} = V_{ATPS}\cdot\frac{310}{273 + T_{amb}}\cdot\frac{P_B - P_{H_2O,\,amb}}{P_B - 47}
$$

A 24 °C y nivel del mar (presión de vapor del agua a 24 °C ≈ 22,4 mmHg), el factor vale aproximadamente 1,08: un volumen medido como 500 mL en condiciones ambientales ocupa unos 540 mL en el pulmón. Muchos ventiladores informan los volúmenes ya corregidos; consulta el manual de tu equipo antes de comparar mediciones de dispositivos distintos (Hess y Kacmarek, 2019).

<!-- page: unidades-y-conversiones | EXERCISE | Unidades de medida y conversiones -->
<!-- block: INTRODUCTION | Un mismo valor, varios nombres -->
En una misma guardia puedes encontrar presiones de la vía aérea en cmH₂O, gases arteriales en mmHg o en kPa (según el país o el laboratorio), flujos en L/min y volúmenes en mL. Un error de unidades no es un detalle formal: confundir 8 kPa con 8 mmHg, o 60 L/min con 60 L/s, conduce a decisiones equivocadas. Esta página reúne los factores de conversión exactos y te propone ejercicios resueltos.

<!-- block: THEORY | Factores de conversión de presión -->
Los factores siguientes proceden de las tablas de conversión del NIST; el centímetro de agua «convencional» y la atmósfera estándar son valores definidos exactamente (Thompson y Taylor, 2008).

| Unidad | Equivalencia en Pa | Equivalencias prácticas |
|---|---|---|
| 1 cmH₂O | 98,0665 Pa | 0,098 kPa; 0,736 mmHg |
| 1 mmHg (≈ 1 Torr) | 133,322 Pa | 1,36 cmH₂O; 0,133 kPa |
| 1 kPa | 1000 Pa | 7,50 mmHg; 10,2 cmH₂O |
| 1 atm | 101 325 Pa | 760 mmHg; 1033 cmH₂O |

Dos reglas mentales útiles: **1 mmHg ≈ 1,36 cmH₂O** (el mercurio es unas 13,6 veces más denso que el agua, y un mm es la décima parte de un cm) y **1 kPa ≈ 7,5 mmHg**.

<!-- block: EQUATION | Conversión entre cmH₂O y mmHg -->
P_{\text{mmHg}} = \frac{P_{\text{cmH}_2\text{O}}}{1{,}36} \qquad P_{\text{kPa}} = \frac{P_{\text{mmHg}}}{7{,}50}

<!-- block: THEORY | Flujo, volumen y tiempo -->
- **Flujo**: 1 L/s = 60 L/min. Los ventiladores suelen programar el flujo inspiratorio en L/min, mientras que los cálculos de resistencia ($R = \Delta P/\dot{V}$) se expresan en cmH₂O/(L/s). Convierte siempre a L/s antes de calcular.
- **Volumen**: 1 L = 1000 mL. El volumen corriente se expresa en mL, el volumen minuto en L/min.
- **Volumen minuto**: $\dot{V}_E = V_T \cdot FR$. Con $V_T$ en litros y FR en respiraciones por minuto, el resultado sale en L/min.

<!-- block: EXERCISE | Ejercicios resueltos -->
**1. Una presión meseta de 28 cmH₂O, ¿cuántos mmHg y kPa son?**
$28 / 1{,}36 \approx 20{,}6\,\text{mmHg}$; $28 \times 0{,}098 \approx 2{,}75\,\text{kPa}$. Observa que las presiones de la vía aérea, expresadas en mmHg, parecen menores; por eso nunca se comparan directamente con una presión arterial sin convertir.

**2. Un informe de gasometría indica PaCO₂ = 6,5 kPa. ¿Cuánto es en mmHg?**
$6{,}5 \times 7{,}50 \approx 48{,}8\,\text{mmHg}$.

**3. El ventilador entrega un flujo constante de 48 L/min con un tiempo inspiratorio (sin pausa) de 0,6 s. ¿Qué volumen entra?**
Primero, $48\,\text{L/min} = 0{,}8\,\text{L/s}$. Luego, $V = \dot{V}\cdot t = 0{,}8 \times 0{,}6 = 0{,}48\,\text{L} = 480\,\text{mL}$.

**4. Con VT = 450 mL y FR = 16/min, ¿cuál es el volumen minuto?**
$\dot{V}_E = 0{,}45 \times 16 = 7{,}2\,\text{L/min}$.

**5. Calcula la resistencia si la diferencia entre presión pico y meseta es de 12 cmH₂O con un flujo de 60 L/min.**
$60\,\text{L/min} = 1\,\text{L/s}$; $R = 12/1 = 12\,\text{cmH}_2\text{O/(L/s)}$. Si hubieras dividido entre 60, habrías obtenido 0,2, un valor sin sentido fisiológico.

<!-- block: CALLOUT:tip | Comprueba el orden de magnitud -->
Antes de aceptar un resultado, pregúntate si es plausible: un volumen corriente de 4800 mL o una resistencia de 0,2 cmH₂O/(L/s) indican casi siempre un error de unidades, no un paciente extraordinario.

<!-- page: lectura-graficas | THEORY | Lectura de gráficas magnitud-tiempo -->
<!-- block: INTRODUCTION | La pantalla como gráfico de funciones -->
Las curvas del ventilador (presión, flujo y volumen frente al tiempo, llamadas «escalares») son gráficos de funciones: en el eje horizontal está el tiempo, en el vertical la magnitud. Leerlas bien exige el mismo método que cualquier gráfico científico: identificar ejes y unidades, localizar el cero, distinguir las fases y relacionar unas curvas con otras. Aquí aprendes ese método general; la interpretación clínica detallada se desarrolla en «Monitoreo básico: presiones, volúmenes y curvas escalares» y en «Curvas de presión, flujo y volumen en el tiempo».

<!-- block: THEORY | Método en cuatro pasos -->
1. **Ejes y escalas.** Comprueba qué magnitud muestra cada curva y en qué unidades (cmH₂O, L/min, mL). Fíjate en si la escala es automática: un cambio de escala puede hacer parecer enorme una variación mínima.
2. **La línea de base.** En la curva de presión, la línea de base no es cero sino la PEEP. En la de flujo, el cero separa inspiración (arriba) de espiración (abajo). En la de volumen, cada ciclo debería volver a cero.
3. **Fases del ciclo.** Localiza el inicio de la inspiración (el flujo se hace positivo), el final de la inspiración (el flujo cae o se invierte) y la espiración (flujo negativo que regresa hacia cero).
4. **Relación entre curvas.** Las tres curvas están alineadas en el tiempo. Una pendiente en la curva de volumen corresponde a flujo; una meseta en volumen corresponde a flujo cero.

<!-- block: THEORY | Pendiente y área: las dos herramientas de lectura -->
Dos operaciones geométricas bastan para extraer información de las curvas:

- **La pendiente** de una curva indica la velocidad de cambio. La pendiente de la curva de volumen es el flujo: si el volumen sube en línea recta, el flujo es constante; si la subida se aplana, el flujo está disminuyendo.
- **El área bajo la curva** de flujo es el volumen. El área positiva (inspiración) debe ser igual al área negativa (espiración) en un sistema sin fugas. Si el área espiratoria es claramente menor, falta volumen: piensa en una fuga.

![Tres curvas apiladas frente al tiempo en ventilación controlada por volumen con flujo constante y pausa inspiratoria. Arriba, la presión sube en rampa desde la PEEP hasta un pico, cae a una meseta durante la pausa y vuelve a la PEEP en la espiración. En medio, el flujo inspiratorio es un rectángulo positivo, es cero en la pausa y el espiratorio es negativo con descenso exponencial hacia cero. Abajo, el volumen sube en línea recta, se mantiene en la pausa y desciende de forma exponencial.](/learning/diagrams/pr2-gases-curvas-escalares.svg "Figura: curvas escalares de presión, flujo y volumen en un ciclo con flujo constante")

<!-- block: THEORY | Qué te enseña la figura -->
Observa la figura con el método anterior. Durante la inspiración con flujo constante, la curva de flujo es un rectángulo y la de volumen una recta ascendente: pendiente constante, flujo constante. La presión sube en rampa porque el componente elástico crece a medida que entra volumen. Al iniciar la pausa el flujo cae a cero: desaparece el componente resistivo y la presión baja del pico a la meseta. En la espiración, que es pasiva, el flujo se vuelve negativo, alcanza un máximo y decae hacia cero de forma exponencial; el volumen desciende con la misma forma. Si el flujo espiratorio no llegara a cero antes del siguiente ciclo, el pulmón no habría terminado de vaciarse, un hallazgo que estudiarás como auto-PEEP (Cairo, 2020).

<!-- block: CALLOUT:warning | Cuidado con la escala automática -->
Muchos monitores reajustan la escala vertical según los valores recientes. Antes de concluir que «la presión subió mucho», lee el valor numérico y revisa la escala.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: física de los gases junto a la cama -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 58 años, 62 kg, en el postoperatorio inmediato de una colecistectomía laparoscópica, ventilada en una unidad de recuperación de un hospital situado a 2600 m de altitud. Pulmones sanos. Ventilación controlada por volumen: VT 420 mL, FR 14/min, flujo inspiratorio constante 42 L/min, PEEP 5 cmH₂O, FiO₂ 0,35. El monitor muestra presión pico 19 cmH₂O y presión meseta 14 cmH₂O.

**Paso 1. Presión inspirada de oxígeno según la altitud.** El modelo de West estima la presión barométrica a partir de la altitud: $P_B = e^{(6{,}63268 - 0{,}1112h - 0{,}00149h^2)}$, con $h$ en km (West, 1996). Para $h = 2{,}6$ km, $P_B \approx 563\,\text{mmHg}$. Entonces:
$P_{IO_2} = 0{,}35 \times (563 - 47) \approx 181\,\text{mmHg}$. A nivel del mar, con la misma FiO₂, sería $0{,}35 \times (760 - 47) \approx 250\,\text{mmHg}$. La misma FiO₂ ofrece casi un 28 % menos de presión inspirada de O₂ en altura; por eso los valores «normales» de PaO₂ del laboratorio local son más bajos que los publicados para nivel del mar.

**Paso 2. Convertir las presiones del ventilador.** La enfermera pregunta si una presión pico de 19 cmH₂O «es mucho». En mmHg: $19 / 1{,}36 \approx 14\,\text{mmHg}$. Sirve para dimensionar, pero el razonamiento clínico se hace en cmH₂O, que es la unidad de las referencias de ventilación.

**Paso 3. Comprobar coherencia flujo-volumen.** $42\,\text{L/min} = 0{,}7\,\text{L/s}$. Para entregar 0,42 L hacen falta $0{,}42 / 0{,}7 = 0{,}6\,\text{s}$ de flujo. Si el ventilador mostrara un tiempo inspiratorio de 0,6 s sin pausa, los números son coherentes.

**Paso 4. Separar componente resistivo y elástico.** La diferencia pico-meseta es $19 - 14 = 5\,\text{cmH}_2\text{O}$; con 0,7 L/s, la resistencia es $5/0{,}7 \approx 7\,\text{cmH}_2\text{O/(L/s)}$. La diferencia meseta-PEEP es $14 - 5 = 9\,\text{cmH}_2\text{O}$ para 0,42 L. El significado clínico de estos valores se trabaja en el módulo de mecánica respiratoria; aquí lo importante es que todos los cálculos se hicieron con unidades homogéneas.

**Paso 5. Oxígeno disuelto.** Si la PaO₂ fuera 90 mmHg, el O₂ disuelto sería $0{,}003 \times 90 = 0{,}27\,\text{mL/dL}$ (West y Luks, 2021): una fracción pequeña del contenido total, recordatorio de que la oxigenación depende sobre todo de la hemoglobina.

<!-- block: EXERCISE | Preguntas -->
**1. Un paciente con EPOC tiene PaCO₂ = 8 kPa. ¿Cuánto es en mmHg?**
$8 \times 7{,}50 = 60\,\text{mmHg}$.

**2. ¿Por qué el área bajo la curva de flujo espiratorio podría ser menor que la inspiratoria?**
Porque parte del volumen entregado no regresa por el sensor espiratorio: lo más frecuente es una fuga (manguito del tubo, circuito, fístula). En un sistema estanco ambas áreas deben coincidir.

**3. En la misma paciente, la FiO₂ sube a 0,50. ¿Qué PIO₂ tendrá?**
$0{,}50 \times (563 - 47) = 258\,\text{mmHg}$, similar a la que daba una FiO₂ de 0,35 a nivel del mar.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y prueba lo siguiente:

- En VCV, cambia el flujo inspiratorio sin tocar el volumen corriente: observa que la curva de volumen sube con distinta pendiente y que el tiempo inspiratorio cambia, mientras el volumen final es el mismo.
- Compara las áreas de flujo inspiratorio y espiratorio: en un pulmón normal sin fugas deberían ser equivalentes.
- Aumenta la PEEP y comprueba que la línea de base de la curva de presión se desplaza hacia arriba, mientras la curva de flujo sigue cruzando el cero.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Presión, volumen y flujo están relacionados: el volumen es la integral del flujo y la presión en la vía aérea depende del volumen (componente elástico) y del flujo (componente resistivo).
- Las presiones del ventilador son manométricas (relativas a la atmósfera); las presiones parciales de los gases son absolutas y dependen de la presión barométrica.
- Boyle explica el movimiento del gas por cambios de volumen y presión; Dalton, por qué la presión inspirada de O₂ es $F_{IO_2}(P_B - 47)$; Henry, por qué el O₂ disuelto es escaso (0,003 mL/dL por mmHg).
- Con la altitud cae la presión barométrica: la misma FiO₂ entrega menos presión inspirada de O₂.
- Conversiones clave: 1 mmHg ≈ 1,36 cmH₂O; 1 kPa ≈ 7,5 mmHg ≈ 10,2 cmH₂O; 1 L/s = 60 L/min.
- Para leer una curva escalar: ejes y escalas, línea de base, fases del ciclo y relación entre curvas (pendiente = flujo, área = volumen).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Calcular resistencias con el flujo en L/min** → el resultado sale 60 veces menor y pierde sentido → convierte siempre el flujo a L/s.
- **Tratar la PEEP o la presión meseta como presiones absolutas** → son relativas a la atmósfera y no se suman a la presión barométrica → reserva las presiones absolutas para los gases y sus presiones parciales.
- **Olvidar el vapor de agua al calcular la PIO₂** → sobrestima el O₂ disponible → resta 47 mmHg a la presión barométrica antes de multiplicar por la FiO₂.
- **Comparar PaO₂ de un paciente en altura con valores de referencia a nivel del mar** → la PIO₂ es menor y la PaO₂ esperada también → usa referencias locales o ajusta por presión barométrica.
- **Interpretar la forma de una curva sin mirar la escala** → la escala automática exagera o aplana cambios → lee el valor numérico y la escala antes de concluir.
- **Confundir kPa y mmHg en una gasometría** → 8 kPa son 60 mmHg, no 8 → confirma la unidad del informe antes de actuar.

<!-- block: REFERENCES | Referencias -->
- Cairo, J. M. (2020). *Pilbeam's mechanical ventilation: Physiological and clinical applications* (7.ª ed.). Elsevier.
- Hess, D. R., y Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4.ª ed.). McGraw-Hill Education.
- Thompson, A., y Taylor, B. N. (2008). *Guide for the use of the International System of Units (SI)* (NIST Special Publication 811). National Institute of Standards and Technology. [https://doi.org/10.6028/NIST.SP.811e2008](https://doi.org/10.6028/NIST.SP.811e2008)
- West, J. B. (1996). Prediction of barometric pressures at high altitude with the use of model atmospheres. *Journal of Applied Physiology, 81*(4), 1850-1854. [https://doi.org/10.1152/jappl.1996.81.4.1850](https://doi.org/10.1152/jappl.1996.81.4.1850)
- West, J. B., y Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11.ª ed.). Wolters Kluwer.
