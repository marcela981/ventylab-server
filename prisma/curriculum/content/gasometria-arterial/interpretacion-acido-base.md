<!-- page: conceptos-acido-base | THEORY | El equilibrio ácido-base y sus dos reguladores -->
<!-- block: INTRODUCTION | Por qué importa en el paciente ventilado -->
La gasometría arterial es, junto con las curvas del ventilador, la herramienta que más decisiones mueve en una unidad de cuidados intensivos. Cada vez que cambias la frecuencia respiratoria o el volumen corriente modificas la eliminación de CO₂ y, con ella, el pH del paciente. Por eso el ventilador no es solo un aparato de oxigenación: es también un regulador ácido-base que tú controlas directamente.

Interpretar bien una gasometría te permite responder tres preguntas: ¿el pH está alterado?, ¿quién lo está alterando, el pulmón o el metabolismo?, y ¿la respuesta compensadora es la esperada o hay un segundo trastorno escondido? Esta lección te da un método ordenado para contestarlas. En la lección siguiente, «Gasometría y ajustes del ventilador», usarás ese método para decidir cambios concretos en el ventilador.

<!-- block: THEORY | El pH y el sistema bicarbonato-ácido carbónico -->
El pH expresa la concentración de iones hidrógeno en escala logarítmica negativa: cuando el pH baja, la concentración de H⁺ aumenta, y viceversa. Como la escala es logarítmica, una caída de pH que parece pequeña (por ejemplo de 7,40 a 7,10) corresponde a casi duplicar la concentración de H⁺. Las proteínas, las enzimas y los canales iónicos son muy sensibles a ese cambio, y de ahí la importancia clínica de la acidemia y la alcalemia graves.

El organismo produce ácido continuamente. Una parte es ácido volátil, el CO₂ que generan las células al oxidar sustratos, y se elimina por el pulmón; otra parte son ácidos no volátiles (fijos), que el riñón debe excretar. El principal amortiguador del líquido extracelular es el sistema bicarbonato-ácido carbónico:

$$
CO_2 + H_2O \rightleftharpoons H_2CO_3 \rightleftharpoons H^+ + HCO_3^-
$$

Lo valioso de este sistema es que sus dos extremos están regulados por órganos distintos. El CO₂ lo controla la ventilación alveolar, en minutos. El bicarbonato lo controla el riñón, que lo reabsorbe o lo genera en un proceso que tarda días en completarse (Tucker y Johnson, 2025). Esta diferencia de velocidad explica por qué los trastornos respiratorios se clasifican en agudos y crónicos.

![Esquema del sistema bicarbonato-ácido carbónico: a la izquierda el pulmón regula el CO₂ en minutos mediante la ventilación alveolar; a la derecha el riñón regula el bicarbonato en días; en el centro el pH depende del cociente entre bicarbonato y CO₂](/learning/diagrams/i6-acidobase-sistema-tampon.svg "Figura: el pH depende del cociente bicarbonato/CO₂, regulado por el pulmón y el riñón")

<!-- block: THEORY | El pH depende de un cociente, no de un valor aislado -->
La ecuación de Henderson-Hasselbalch muestra que el pH no depende del bicarbonato ni del CO₂ por separado, sino de su cociente. Esto tiene una consecuencia práctica enorme: si uno de los dos términos cambia, el organismo intenta mover el otro en la misma dirección para acercar el cociente a su valor normal. A ese movimiento secundario se le llama compensación, y es direccional y proporcional al cambio primario (Adrogué y Madias, 2010).

- Si el bicarbonato cae (acidosis metabólica), el centro respiratorio aumenta la ventilación y baja la PaCO₂.
- Si la PaCO₂ sube (acidosis respiratoria), el riñón retiene bicarbonato.
- La compensación atenúa el cambio de pH pero no lo devuelve por completo a la normalidad; si la respuesta secundaria falta o es excesiva, debes sospechar un segundo trastorno (Adrogué y Madias, 2010).

En el paciente sedado y en modo controlado hay un matiz clave: la compensación respiratoria ya no la decide su centro respiratorio, sino la ventilación minuto que tú programaste. Un paciente con acidosis metabólica grave al que mantienes con una ventilación minuto «normal» queda, de hecho, con una compensación insuficiente.

<!-- block: THEORY | Valores de referencia -->
Los valores arteriales de referencia en el adulto más usados son los siguientes (Tucker y Johnson, 2025):

| Variable | Valor central | Rango de referencia |
|---|---|---|
| pH | 7,40 | 7,35 – 7,45 |
| PaCO₂ | 40 mmHg | 35 – 45 mmHg |
| HCO₃⁻ | 24 mmol/L | 22 – 26 mmol/L |
| Exceso de base | 0 | −2 a +2 mmol/L |

El **exceso de base** estima cuánto ácido o base fuerte habría que añadir a la sangre para llevarla a pH 7,40 con una PaCO₂ de 40 mmHg. Al corregir por la PaCO₂, intenta aislar el componente metabólico: un exceso de base negativo indica acidosis metabólica y uno positivo, alcalosis metabólica. Recuerda que el bicarbonato de la gasometría es un valor calculado por el analizador a partir del pH y la PaCO₂; conviene compararlo con el bicarbonato medido en la bioquímica (Tucker y Johnson, 2025).

Existe un enfoque alternativo, el fisicoquímico de Stewart, que explica el pH a partir de la diferencia de iones fuertes, la PaCO₂ y los ácidos débiles (sobre todo la albúmina). En esta lección usamos el enfoque fisiológico basado en el bicarbonato y las reglas de compensación, que es el más extendido en la práctica clínica (Berend et al., 2014).

<!-- page: metodo-sistematico | THEORY | Un método sistemático en seis pasos -->
<!-- block: INTRODUCTION | Por qué necesitas un método -->
Leer una gasometría «a ojo» funciona en los casos simples y falla justo en los casos que importan: los trastornos mixtos, frecuentes en el paciente crítico. Un paciente séptico puede tener a la vez acidosis láctica, acidosis respiratoria por una ventilación minuto insuficiente y alcalosis metabólica por diuréticos o sonda nasogástrica. Un método ordenado evita que un trastorno oculte a otro.

<!-- block: THEORY | Paso 0: comprueba que la muestra es coherente -->
Antes de interpretar, verifica tres cosas:

1. **Contexto clínico**: anota la FiO₂, los ajustes del ventilador y la hora del último cambio. Una gasometría sin estos datos es difícil de interpretar.
2. **Tipo de muestra**: arterial o venosa (las diferencias se tratan en la lección siguiente).
3. **Coherencia interna**: el bicarbonato calculado de la gasometría y el bicarbonato medido en la bioquímica no deberían diferir en más de 2 mmol/L; si la diferencia es mayor, sospecha un error de toma, conservación o calibración y repite la muestra (Tucker y Johnson, 2025).

<!-- block: THEORY | Pasos 1 a 6 -->
#### 1. Mira el pH
Por debajo de 7,35 hay acidemia; por encima de 7,45, alcalemia (Tucker y Johnson, 2025). Un pH normal no descarta un trastorno: puede haber dos trastornos opuestos que se neutralizan.

#### 2. Identifica el trastorno primario
Pregúntate qué variable explica la dirección del pH:
- pH bajo con PaCO₂ alta: acidosis respiratoria.
- pH bajo con HCO₃⁻ bajo: acidosis metabólica.
- pH alto con PaCO₂ baja: alcalosis respiratoria.
- pH alto con HCO₃⁻ alto: alcalosis metabólica.

#### 3. Si es respiratorio, decide si es agudo o crónico
Los trastornos respiratorios agudos se instauran en minutos u horas; los crónicos, en días, el tiempo que necesita el riñón para ajustar el bicarbonato (Tucker y Johnson, 2025). La historia clínica (por ejemplo, EPOC con retención crónica de CO₂) y la magnitud del cambio del bicarbonato te ayudan a distinguirlos.

#### 4. Calcula la compensación esperada
Usa las reglas de la página siguiente. Si el valor medido de la variable compensadora cae fuera del rango esperado, hay un segundo trastorno (Adrogué y Madias, 2010).

#### 5. Si hay acidosis metabólica, calcula el anión gap
El anión gap separa las acidosis con aniones no medidos (lactato, cetoácidos, tóxicos, retención renal) de las hiperclorémicas. Corrígelo por la albúmina (Figge et al., 1998).

#### 6. Si el anión gap está elevado, calcula el delta ratio
Compara cuánto subió el anión gap con cuánto bajó el bicarbonato para descubrir un trastorno metabólico adicional (Tucker y Johnson, 2025).

Termina siempre integrando el resultado con la clínica: la gasometría orienta, pero el diagnóstico de la causa lo da el paciente.

![Diagrama de flujo de seis pasos para interpretar una gasometría: verificar coherencia, valorar el pH, identificar el trastorno primario, decidir agudo o crónico, calcular la compensación esperada y, en acidosis metabólica, calcular anión gap y delta ratio](/learning/diagrams/i6-acidobase-algoritmo.svg "Figura: algoritmo de interpretación ácido-base")

<!-- block: CALLOUT:info | Acidemia frente a acidosis -->
**Acidemia** y **alcalemia** describen el pH de la sangre. **Acidosis** y **alcalosis** describen procesos que tienden a bajar o subir el pH. Un paciente puede tener una acidosis metabólica y una alcalosis respiratoria simultáneas con un pH cercano a la normalidad. Usar bien estos términos te obliga a pensar en procesos, no solo en números.

<!-- page: compensacion-y-anion-gap | EXERCISE | Fórmulas: compensación esperada, anión gap y delta ratio -->
<!-- block: THEORY | Henderson-Hasselbalch en la práctica -->
La forma clínica de la ecuación de Henderson-Hasselbalch es (Tucker y Johnson, 2025):

$$
pH = 6{,}1 + \log\left(\frac{[HCO_3^-]}{0{,}03 \cdot PaCO_2}\right)
$$

donde $6{,}1$ es el pK del sistema, $[HCO_3^-]$ se expresa en mmol/L, $PaCO_2$ en mmHg y $0{,}03$ es el coeficiente de solubilidad del CO₂ en plasma (mmol/L por mmHg). El producto $0{,}03 \cdot PaCO_2$ representa el CO₂ disuelto. Úsala para comprobar la coherencia de una gasometría o para estimar qué PaCO₂ produciría un pH determinado con un bicarbonato dado.

<!-- block: EQUATION | Fórmula de Winter (acidosis metabólica) -->
PaCO_{2\,\text{esperada}} = 1{,}5 \cdot [HCO_3^-] + 8 \pm 2

<!-- block: THEORY | Reglas de compensación esperada -->
La fórmula de Winter procede del estudio de Albert, Dell y Winters en pacientes con acidosis metabólica (Albert et al., 1967). Si la PaCO₂ medida es mayor que el límite superior, hay además una acidosis respiratoria; si es menor, una alcalosis respiratoria.

Para el resto de los trastornos se usan reglas proporcionales, con valores normales de referencia $HCO_3^- = 24\,\text{mmol/L}$ y $PaCO_2 = 40\,\text{mmHg}$ (Tucker y Johnson, 2025; Adrogué y Madias, 2010):

| Trastorno primario | Respuesta esperada |
|---|---|
| Acidosis metabólica | La PaCO₂ baja unas 1,25 veces la caída del HCO₃⁻ (o fórmula de Winter) |
| Alcalosis metabólica | La PaCO₂ sube unas 0,6 veces el aumento del HCO₃⁻ |
| Acidosis respiratoria aguda | El HCO₃⁻ sube 0,1 mmol/L por cada mmHg de aumento de PaCO₂ |
| Acidosis respiratoria crónica | El HCO₃⁻ sube 0,4 mmol/L por cada mmHg de aumento de PaCO₂ |
| Alcalosis respiratoria aguda | El HCO₃⁻ baja 0,2 mmol/L por mmHg de descenso de PaCO₂ (rara vez por debajo de 18) |
| Alcalosis respiratoria crónica | El HCO₃⁻ baja 0,4 mmol/L por mmHg de descenso de PaCO₂ (rara vez por debajo de 14) |

Las cifras exactas varían ligeramente entre autores; lo importante es que sabes cuánto debería moverse la variable compensadora y que una desviación clara señala un trastorno mixto.

<!-- block: THEORY | Anión gap, corrección por albúmina y delta ratio -->
$$
AG = [Na^+] - \left([Cl^-] + [HCO_3^-]\right)
$$

Con los analizadores actuales, el valor de referencia se sitúa alrededor de 10 mmol/L, con un rango aproximado de 8 a 12 mmol/L, aunque cada laboratorio debe establecer el suyo (Tucker y Johnson, 2025; Kraut y Madias, 2007). La albúmina es el principal anión no medido, de modo que la hipoalbuminemia, muy frecuente en la UCI, reduce el anión gap y puede ocultar una acidosis por aniones no medidos. Por eso se corrige (Figge et al., 1998; Tucker y Johnson, 2025):

$$
AG_{\text{corregido}} = AG + 2{,}5 \cdot \left(4{,}5 - \text{albúmina}\,[\text{g/dL}]\right)
$$

Cuando el anión gap está elevado, el delta ratio compara el exceso de anión gap con el déficit de bicarbonato (Tucker y Johnson, 2025):

$$
\text{Delta ratio} = \frac{AG - 12}{24 - [HCO_3^-]}
$$

Un valor menor de 0,8 sugiere que coexiste una acidosis con anión gap normal; entre 0,8 y 1,2, una acidosis con anión gap elevado pura; y mayor de 1,2, una alcalosis metabólica asociada (Tucker y Johnson, 2025).

<!-- block: EXERCISE | Ejemplo resuelto: paciente con EPOC -->
Un paciente con EPOC conocida ingresa con disnea. Gasometría arterial: pH 7,34; PaCO₂ 60 mmHg; HCO₃⁻ 31 mmol/L.

**1. Coherencia.** $6{,}1 + \log\left(\frac{31}{0{,}03 \cdot 60}\right) = 6{,}1 + \log(17{,}2) = 6{,}1 + 1{,}24 = 7{,}34$. Coincide con el pH medido.

**2. Trastorno primario.** pH bajo con PaCO₂ alta: acidosis respiratoria.

**3. ¿Aguda o crónica?** El aumento de PaCO₂ es de $60 - 40 = 20\,\text{mmHg}$.
- Si fuera aguda: $HCO_3^- = 24 + 0{,}1 \cdot 20 = 26\,\text{mmol/L}$.
- Si fuera crónica: $HCO_3^- = 24 + 0{,}4 \cdot 20 = 32\,\text{mmol/L}$.

El bicarbonato medido (31) está muy cerca del esperado para un proceso crónico. Conclusión: acidosis respiratoria crónica con compensación renal adecuada. El pH apenas bajo te dice que el riñón ha tenido días para adaptarse; si ventilas a este paciente buscando una PaCO₂ de 40 mmHg, el bicarbonato elevado quedará sin contrapeso y provocarás una alcalosis metabólica posthipercápnica. La meta razonable es su PaCO₂ habitual, no la normal de un sujeto sano.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: acidosis en el shock séptico -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** hombre de 64 años, 78 kg, intubado por neumonía grave con shock séptico. Está sedado en VCV con volumen corriente de 450 mL, frecuencia de 16 resp/min, PEEP de 10 cmH₂O y FiO₂ de 0,5. Recibe noradrenalina.

**Gasometría arterial:** pH 7,22; PaCO₂ 30 mmHg; HCO₃⁻ 12 mmol/L; PaO₂ 85 mmHg.
**Bioquímica:** Na⁺ 138 mmol/L; Cl⁻ 104 mmol/L; HCO₃⁻ 13 mmol/L; albúmina 3,5 g/dL; lactato elevado.

#### Paso 0: coherencia
$6{,}1 + \log\left(\frac{12}{0{,}03 \cdot 30}\right) = 6{,}1 + \log(13{,}3) = 6{,}1 + 1{,}12 = 7{,}22$. Coherente. El bicarbonato de la bioquímica (13) difiere en 1 mmol/L del calculado: aceptable.

#### Pasos 1 y 2: pH y trastorno primario
pH 7,22: acidemia. El bicarbonato está bajo y la PaCO₂ también baja, de modo que el pulmón no es la causa: **acidosis metabólica primaria**.

#### Paso 4: ¿la compensación respiratoria es suficiente?
Fórmula de Winter: $1{,}5 \cdot 12 + 8 = 26 \pm 2$, es decir, PaCO₂ esperada entre 24 y 28 mmHg (Albert et al., 1967). La PaCO₂ medida es 30 mmHg, por encima del rango: **coexiste una acidosis respiratoria**. En un paciente sedado y en modo controlado, esto significa que la ventilación minuto programada (450 mL × 16 = 7,2 L/min) no basta para compensar la carga ácida.

#### Pasos 5 y 6: anión gap y delta ratio
$AG = 138 - (104 + 12) = 22\,\text{mmol/L}$, elevado.
Corrección por albúmina: $22 + 2{,}5 \cdot (4{,}5 - 3{,}5) = 24{,}5\,\text{mmol/L}$ (Figge et al., 1998).
Delta ratio con el anión gap corregido: $\frac{24{,}5 - 12}{24 - 12} = \frac{12{,}5}{12} \approx 1{,}04$, compatible con una acidosis con anión gap elevado pura, sin otro trastorno metabólico asociado (Tucker y Johnson, 2025). Con el lactato elevado, la causa más probable es la acidosis láctica del shock.

#### Diagnóstico integrado
Acidosis metabólica con anión gap elevado (láctica) más acidosis respiratoria por compensación ventilatoria insuficiente.

#### Qué haces
El tratamiento de fondo es el del shock: control del foco, antibióticos, reanimación hemodinámica. En el ventilador, puedes aumentar la ventilación minuto para acercar la PaCO₂ al rango esperado, pero siempre dentro de los límites de protección pulmonar: vigila la presión meseta si aumentas el volumen y la aparición de auto-PEEP si aumentas la frecuencia. Cómo calcular ese ajuste se explica en la lección «Gasometría y ajustes del ventilador».

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA por sepsis»](/simulador?tab=simular&case=july-sdra-sepsis) y observa la gasometría inicial: identifica el trastorno primario con el método de seis pasos antes de tocar ningún parámetro.

- Aumenta la frecuencia respiratoria de forma gradual y observa cómo la PaCO₂ desciende y el pH mejora en el monitor.
- Mira la curva de flujo tras cada aumento: si el flujo espiratorio deja de llegar a cero antes de la siguiente respiración, estás generando atrapamiento aéreo.
- Si no tratas al paciente, observa cómo la situación se deteriora con el tiempo: la gasometría refleja que el problema de fondo no se corrige solo con el ventilador.

<!-- block: EXERCISE | Preguntas de práctica -->
**1.** Gasometría: pH 7,50; PaCO₂ 48 mmHg; HCO₃⁻ 36 mmol/L. ¿Trastorno primario y compensación?

*Respuesta:* pH alto con bicarbonato alto: alcalosis metabólica. PaCO₂ esperada: $40 + 0{,}6 \cdot (36 - 24) = 47{,}2\,\text{mmHg}$ (Tucker y Johnson, 2025). La medida (48) coincide: compensación respiratoria adecuada. En el paciente ventilado, la hipoventilación compensadora puede dificultar el destete.

**2.** Paciente con anión gap de 8 mmol/L y albúmina de 2,0 g/dL. ¿Es normal?

*Respuesta:* Corregido: $8 + 2{,}5 \cdot (4{,}5 - 2{,}0) = 14{,}25\,\text{mmol/L}$ (Figge et al., 1998). Un valor aparentemente normal pasa a estar elevado: sin corrección habrías pasado por alto la acumulación de aniones no medidos.

**3.** pH 7,26; PaCO₂ 60 mmHg; HCO₃⁻ 26 mmol/L, en un paciente sin antecedentes respiratorios que se deterioró en la última hora. ¿Agudo o crónico?

*Respuesta:* Aumento de PaCO₂ de 20 mmHg. Esperado agudo: $24 + 0{,}1 \cdot 20 = 26$; esperado crónico: 32 (Tucker y Johnson, 2025). El bicarbonato medido (26) indica una acidosis respiratoria aguda: el riñón aún no ha tenido tiempo de compensar.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El pH depende del cociente entre bicarbonato y PaCO₂; el pulmón regula el CO₂ en minutos y el riñón el bicarbonato en días.
- En el paciente sedado y en modo controlado, la compensación respiratoria depende de la ventilación minuto que tú programas.
- Sigue siempre el mismo orden: coherencia de la muestra, pH, trastorno primario, agudo o crónico, compensación esperada, anión gap y delta ratio.
- Una compensación fuera del rango esperado no es «compensación parcial»: indica un segundo trastorno (Adrogué y Madias, 2010).
- La fórmula de Winter estima la PaCO₂ esperada en la acidosis metabólica: $1{,}5 \cdot HCO_3^- + 8 \pm 2$ (Albert et al., 1967).
- Corrige el anión gap por la albúmina; la hipoalbuminemia puede ocultar una acidosis con anión gap elevado (Figge et al., 1998).
- En la hipercapnia crónica compensada, la meta de PaCO₂ es la habitual del paciente, no 40 mmHg.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Interpretar la gasometría sin conocer FiO₂ ni ajustes del ventilador** → los números no tienen contexto y puedes atribuir a la enfermedad un efecto del ventilador → registra siempre FiO₂, modo, Vt, FR, PEEP y hora del último cambio.
- **Considerar «compensado» cualquier cambio en la dirección correcta** → una compensación insuficiente o excesiva señala un segundo trastorno → calcula el valor esperado con la regla correspondiente y compáralo.
- **Usar el anión gap sin corregir por albúmina** → en la UCI la hipoalbuminemia es común y baja el anión gap → aplica la corrección antes de concluir que es normal.
- **Normalizar la PaCO₂ de un paciente con retención crónica de CO₂** → el bicarbonato elevado queda sin contrapeso y aparece alcalosis → ajusta la ventilación a su PaCO₂ basal.
- **Aceptar un pH normal como prueba de ausencia de trastorno** → dos trastornos opuestos pueden neutralizarse → revisa PaCO₂, bicarbonato y anión gap aunque el pH sea normal.
- **No comprobar la coherencia de la muestra** → una muestra mal tomada o conservada lleva a decisiones erróneas → compara el bicarbonato calculado con el medido y verifica con Henderson-Hasselbalch.

<!-- block: REFERENCES | Referencias -->
- Adrogué, H. J., & Madias, N. E. (2010). Secondary responses to altered acid-base status: The rules of engagement. *Journal of the American Society of Nephrology, 21*(6), 920–923. [https://doi.org/10.1681/ASN.2009121211](https://doi.org/10.1681/ASN.2009121211)
- Albert, M. S., Dell, R. B., & Winters, R. W. (1967). Quantitative displacement of acid-base equilibrium in metabolic acidosis. *Annals of Internal Medicine, 66*(2), 312–322. [https://doi.org/10.7326/0003-4819-66-2-312](https://doi.org/10.7326/0003-4819-66-2-312)
- Berend, K., de Vries, A. P. J., & Gans, R. O. B. (2014). Physiological approach to assessment of acid–base disturbances. *New England Journal of Medicine, 371*(15), 1434–1445. [https://doi.org/10.1056/NEJMra1003327](https://doi.org/10.1056/NEJMra1003327)
- Figge, J., Jabor, A., Kazda, A., & Fencl, V. (1998). Anion gap and hypoalbuminemia. *Critical Care Medicine, 26*(11), 1807–1810. [https://doi.org/10.1097/00003246-199811000-00019](https://doi.org/10.1097/00003246-199811000-00019)
- Kraut, J. A., & Madias, N. E. (2007). Serum anion gap: Its uses and limitations in clinical medicine. *Clinical Journal of the American Society of Nephrology, 2*(1), 162–174. [https://doi.org/10.2215/CJN.03020906](https://doi.org/10.2215/CJN.03020906)
- Tucker, A. M., & Johnson, T. N. (2025). Breathing and balance: Clinical insights and management strategies of respiratory acid-base disorders. *Nutrition in Clinical Practice, 40*(4), 774–792. [https://doi.org/10.1002/ncp.11328](https://doi.org/10.1002/ncp.11328)
