<!-- page: conceptos-difusion-vq | THEORY | Conceptos: difusión y relación ventilación-perfusión -->
<!-- block: INTRODUCTION | Por qué el intercambio gaseoso guía el ventilador -->
Ventilar no es lo mismo que oxigenar. El ventilador puede mover mucho gas y aun así el paciente puede seguir hipoxémico, porque el oxígeno solo pasa a la sangre donde el gas alveolar y la sangre capilar se encuentran en proporciones adecuadas. Al revés, un paciente puede tener una saturación aceptable mientras retiene CO₂. Para saber qué ajuste corregirá cada problema (FiO₂, PEEP, volumen minuto o la causa de base) necesitas entender cómo atraviesan los gases la barrera alveolocapilar, cómo se reparten la ventilación y la perfusión, y cómo transporta la sangre el O₂ y el CO₂.

<!-- block: THEORY | Difusión a través de la barrera: ley de Fick -->
Los gases atraviesan la barrera alveolocapilar por difusión pasiva, desde la presión parcial mayor hacia la menor. La ley de Fick establece que la cantidad de gas transferida por unidad de tiempo es proporcional al área de la barrera, a la diferencia de presión parcial y a una constante de difusión, e inversamente proporcional al espesor (West & Luks, 2021). La constante depende de la solubilidad del gas y, en sentido inverso, de la raíz cuadrada de su peso molecular. El CO₂ es mucho más soluble que el O₂, unas 20 veces (Mallat et al., 2025), y por eso difunde con mucha más facilidad: en clínica, la hipercapnia casi nunca se debe a un problema de difusión.

En reposo, un eritrocito permanece en el capilar pulmonar alrededor de 0,75 s, y la PO₂ de la sangre alcanza la del gas alveolar en aproximadamente un tercio de ese tiempo (West & Luks, 2021). Esa reserva explica por qué el engrosamiento de la barrera suele manifestarse primero con el ejercicio, cuando el tiempo de tránsito se acorta, o al respirar una mezcla con poco oxígeno.

<!-- block: THEORY | La relación ventilación-perfusión -->
Cada unidad alveolar recibe una ventilación alveolar ($\dot{V}_A$) y un flujo sanguíneo ($\dot{Q}$). Su cociente $\dot{V}_A/\dot{Q}$ determina la PO₂ y la PCO₂ del gas alveolar y de la sangre que sale de esa unidad (Petersson & Glenny, 2014). El espectro va de un extremo al otro:

- **$\dot{V}_A/\dot{Q} = 0$ (cortocircuito o shunt):** la unidad está perfundida pero no ventilada (alvéolos colapsados o llenos de líquido). La sangre sale con la composición de la sangre venosa mixta.
- **Unidades con relación baja:** ventilación escasa respecto al flujo; la sangre sale con PO₂ baja. Junto con el shunt son las causas más frecuentes de hipoxemia (Petersson & Glenny, 2014).
- **Unidades equilibradas:** el gas alveolar y la sangre capilar terminal alcanzan valores cercanos a los ideales.
- **Unidades con relación alta y $\dot{V}_A/\dot{Q} = \infty$ (espacio muerto alveolar):** hay ventilación con poca o ninguna perfusión; el gas conserva la composición del aire inspirado y esa ventilación se desperdicia.

![Tres unidades alveolocapilares: a la izquierda, sin ventilación (cortocircuito, PO₂ ≈ 40 y PCO₂ ≈ 45 mmHg); en el centro, equilibrada (PO₂ ≈ 100 y PCO₂ ≈ 40); a la derecha, sin perfusión (espacio muerto, PO₂ ≈ 150 y PCO₂ ≈ 0). Una flecha indica que al aumentar V/Q la PO₂ sube y la PCO₂ baja](/learning/diagrams/pr1-intercambio-espectro-vq.svg "Figura: espectro de la relación ventilación-perfusión (valores aproximados con aire a nivel del mar)")

Incluso en el pulmón sano la relación varía con la gravedad: de pie, la ventilación y sobre todo la perfusión aumentan hacia las bases, de modo que los vértices tienen relaciones altas y las bases relaciones bajas (West & Luks, 2021).

<!-- block: THEORY | Shunt y espacio muerto: dos problemas con respuestas distintas -->
La distinción tiene consecuencias directas:

- La hipoxemia por shunt responde mal al oxígeno suplementario, porque la sangre que atraviesa unidades no ventiladas nunca entra en contacto con el gas enriquecido (Petersson & Glenny, 2014). Lo que corrige el shunt es reabrir esas unidades o tratar la causa.
- La hipoxemia por relaciones bajas, por hipoventilación o por difusión sí mejora al subir la FiO₂.
- El aumento de la ventilación desperdiciada suele traducirse en más volumen minuto y más trabajo respiratorio, no necesariamente en hipercapnia, porque el centro respiratorio intenta mantener la PaCO₂ (Petersson & Glenny, 2014).
- Un espacio muerto fisiológico elevado tiene valor pronóstico en el SDRA. Su mecanismo principal no suele ser la existencia de alvéolos sin perfusión, sino la heterogeneidad de las relaciones ventilación-perfusión (Robertson, 2015).

<!-- page: transporte-o2-co2 | THEORY | Transporte de O₂ y CO₂ en la sangre -->
<!-- block: THEORY | Hemoglobina y curva de disociación -->
El oxígeno viaja en la sangre de dos formas: una fracción muy pequeña disuelta en el plasma y la gran mayoría unida de forma reversible a la hemoglobina (Collins et al., 2015). Con una hemoglobina normal, la capacidad máxima de transporte ronda los 20 mL de O₂ por cada 100 mL de sangre (Collins et al., 2015).

La relación entre la PO₂ y la saturación de la hemoglobina no es lineal: tiene forma sigmoidea. Una ecuación sencilla y precisa permite calcular la curva estándar (Severinghaus, 1979):

$$
S_{O_2} = \left(\frac{23\,400}{P_{O_2}^{3} + 150\,P_{O_2}} + 1\right)^{-1}
$$

- $S_{O_2}$: saturación como fracción (0 a 1); $P_{O_2}$: presión parcial de oxígeno en mmHg. Es válida para la curva estándar (pH 7,40, 37 °C) y su precisión clínica se ha comprobado en más de 3500 muestras clínicas con pH normal y saturación superior al 70 % (Collins et al., 2015).

![Curva sigmoidea de saturación de la hemoglobina frente a la PO₂ de 0 a 120 mmHg, con la P50 cerca de 27 mmHg, la sangre venosa mixta cerca del 75 % a 40 mmHg, unos 90 % a 60 mmHg y unos 97 % a 100 mmHg; se muestran curvas desplazadas a la derecha y a la izquierda con sus causas](/learning/diagrams/pr1-intercambio-curva-disociacion.svg "Figura: curva de disociación de la oxihemoglobina")

Tres zonas de la curva tienen interpretación clínica:

- **Meseta superior.** Por encima de unos 60 mmHg, subir mucho la PO₂ apenas añade saturación. Esto protege la carga de oxígeno cuando la PO₂ alveolar baja algo, pero también significa que una PaO₂ alta no aporta reservas importantes.
- **Pendiente.** Por debajo de 60 mmHg la saturación cae de forma brusca: pequeñas reducciones de PaO₂ producen grandes caídas de saturación (Collins et al., 2015).
- **P50.** Es la PO₂ a la que la hemoglobina está saturada al 50 %. Con la ecuación anterior resulta cercana a 27 mmHg.

En reposo, la saturación de la sangre venosa mixta ronda el 75 %, lo que indica que los tejidos extraen solo una parte del oxígeno disponible (Collins et al., 2015).

#### Desplazamientos de la curva

El aumento de PCO₂, la acidosis y el aumento de temperatura desplazan la curva a la derecha: menor afinidad, más liberación de O₂ en los tejidos (efecto Bohr). El aumento de 2,3-difosfoglicerato, por ejemplo en la hipoxia crónica, también la desplaza a la derecha. Los cambios opuestos la desplazan a la izquierda (Collins et al., 2015).

<!-- block: THEORY | Transporte de CO₂ -->
El CO₂ se transporta en tres formas (Ltaief et al., 2021):

- **Disuelto** en plasma, en equilibrio con la PCO₂ según la ley de Henry: alrededor del 5 % del CO₂ total de la sangre arterial.
- **Como bicarbonato**, alrededor del 90 % del total arterial. En el eritrocito la anhidrasa carbónica acelera la hidratación del CO₂; el bicarbonato formado sale al plasma a cambio de cloro (desplazamiento de cloruro).
- **Como compuestos carbamínicos**, unido a grupos amino de la hemoglobina: alrededor del 5 % del total arterial.

La **desoxigenación de la hemoglobina aumenta su capacidad de transportar CO₂** (efecto Haldane). En los tejidos, al ceder oxígeno, la sangre capta más CO₂; en el pulmón, al oxigenarse, lo libera (Ltaief et al., 2021). Por eso la curva de disociación del CO₂ es mucho más empinada que la del O₂ en el rango fisiológico y casi lineal (Mallat et al., 2025): cambios de ventilación alveolar se traducen de forma bastante proporcional en cambios de PaCO₂.

<!-- page: formulas-intercambio | EXERCISE | Fórmulas y cálculo: contenido, aporte y shunt -->
<!-- block: THEORY | Contenido arterial de oxígeno y aporte -->
El **contenido arterial de oxígeno** suma la fracción unida a la hemoglobina y la disuelta; cada gramo de hemoglobina saturada transporta 1,34 mL de O₂ y el coeficiente de solubilidad es 0,003 mL/dL por mmHg (Tymen et al., 2026):

$$
C_aO_2 = 1{,}34 \cdot Hb \cdot S_aO_2 + 0{,}003 \cdot P_aO_2
$$

- $C_aO_2$: mL de O₂ por dL de sangre; $Hb$: g/dL; $S_aO_2$: fracción (0 a 1); $P_aO_2$: mmHg.

El **aporte de oxígeno** a los tejidos es el producto del contenido por el gasto cardíaco; el factor 10 convierte dL a L:

$$
DO_2 = C_aO_2 \cdot GC \cdot 10
$$

- $DO_2$: mL de O₂/min; $GC$: gasto cardíaco en L/min.

El aporte depende tanto de la hemoglobina y del gasto cardíaco como de la saturación (Collins et al., 2015).

<!-- block: EQUATION | Ecuación del shunt (mezcla venosa) -->
\frac{\dot{Q}_s}{\dot{Q}_t} = \frac{C_cO_2 - C_aO_2}{C_cO_2 - C_{\bar{v}}O_2}

<!-- block: THEORY | Símbolos de la ecuación del shunt -->
- $\dot{Q}_s/\dot{Q}_t$: fracción del gasto cardíaco que se comporta como cortocircuito.
- $C_cO_2$: contenido de O₂ en la sangre capilar terminal ideal, calculado con la PO₂ alveolar y saturación cercana a 1.
- $C_aO_2$: contenido arterial; $C_{\bar{v}}O_2$: contenido de la sangre venosa mixta (arteria pulmonar).

La ecuación da una estimación global de la mezcla venosa: incluye el shunt verdadero y el efecto de las unidades con relación baja (Petersson & Glenny, 2014). Si se mide respirando oxígeno al 100 %, el componente de relaciones bajas casi desaparece y queda sobre todo el shunt verdadero (West & Luks, 2021).

<!-- block: EXERCISE | Ejemplo resuelto -->
**1. Contenido y aporte normales.** Hb 14 g/dL, SaO₂ 0,97, PaO₂ 95 mmHg, GC 5 L/min.

- Unido: $1{,}34 \times 14 \times 0{,}97 = 18{,}20\,\text{mL/dL}$.
- Disuelto: $0{,}003 \times 95 = 0{,}29\,\text{mL/dL}$.
- $C_aO_2 = 18{,}49\,\text{mL/dL}$; $DO_2 = 18{,}49 \times 5 \times 10 \approx 925\,\text{mL/min}$.

**2. Anemia.** Mismos datos con Hb 7 g/dL: unido $= 9{,}10$; $C_aO_2 = 9{,}39\,\text{mL/dL}$; $DO_2 \approx 470\,\text{mL/min}$. La PaO₂ y la SaO₂ son normales y, sin embargo, el aporte se ha reducido a la mitad.

**3. Hiperoxia.** Con Hb 14 g/dL, subir la PaO₂ a 300 mmHg (SaO₂ 1,00) da $18{,}76 + 0{,}90 = 19{,}66\,\text{mL/dL}$: apenas un 6 % más que en el punto 1, a pesar de triplicar la PaO₂.

**4. Shunt.** Hb 14 g/dL. PO₂ alveolar 100 mmHg (capilar terminal saturado al 100 %), PaO₂ 56 mmHg con SaO₂ 0,89, PvO₂ 35 mmHg con SvO₂ 0,67.

- $C_cO_2 = 1{,}34 \times 14 \times 1{,}00 + 0{,}003 \times 100 = 19{,}06$.
- $C_aO_2 = 1{,}34 \times 14 \times 0{,}89 + 0{,}003 \times 56 = 16{,}86$.
- $C_{\bar{v}}O_2 = 1{,}34 \times 14 \times 0{,}67 + 0{,}003 \times 35 = 12{,}67$.
- $\dot{Q}_s/\dot{Q}_t = (19{,}06 - 16{,}86)/(19{,}06 - 12{,}67) = 2{,}20/6{,}39 \approx 0{,}34$.

Alrededor de un tercio del gasto cardíaco atraviesa el pulmón sin oxigenarse de forma efectiva.

**5. Comprobación con la curva.** Aplica la ecuación de Severinghaus a 60 mmHg: $60^3 + 150 \cdot 60 = 225\,000$; $23\,400/225\,000 = 0{,}104$; $S = 1/1{,}104 \approx 0{,}906$. Resulta una saturación cercana al 90 %, como se ve en la figura.

<!-- page: aplicacion-clinica-intercambio | CASE_STUDY | Aplicación clínica: hipoxemia por neumonía -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 63 años con neumonía del lóbulo inferior derecho, intubada hace 2 horas por hipoxemia. Es una paciente ficticia con valores coherentes para el ejercicio.

**Datos:** Hb 11 g/dL, gasto cardíaco estimado 6 L/min. Con FiO₂ 0,60: PaO₂ 62 mmHg, SaO₂ 0,91, PaCO₂ 44 mmHg. Se sube la FiO₂ a 0,80 y la PaO₂ solo llega a 66 mmHg. La radiografía muestra consolidación densa del lóbulo afectado.

**Razonamiento paso a paso:**

1. **¿Qué mecanismo domina?** La respuesta pobre al aumento de FiO₂ apunta a shunt: los alvéolos consolidados reciben sangre pero no gas (Petersson & Glenny, 2014).
2. **¿Por qué la PaCO₂ es casi normal?** El CO₂ difunde con facilidad y las unidades sanas pueden eliminar más si aumenta la ventilación; además, su curva de disociación es casi lineal. El O₂ no se compensa del mismo modo, porque las unidades sanas ya están en la meseta de la curva y no pueden cargar más oxígeno para compensar la sangre desaturada.
3. **¿Cuánto oxígeno llega a los tejidos?** $C_aO_2 = 1{,}34 \times 11 \times 0{,}91 + 0{,}003 \times 62 = 13{,}41 + 0{,}19 = 13{,}60\,\text{mL/dL}$; $DO_2 = 13{,}60 \times 6 \times 10 \approx 816\,\text{mL/min}$. La anemia moderada contribuye tanto como la saturación a reducir el aporte.
4. **¿Qué ajustes tienen sentido fisiológico?** Las medidas que reabren unidades (PEEP, posición) o tratan la consolidación actúan sobre el shunt; seguir subiendo la FiO₂ tiene poco rendimiento. La vasoconstricción pulmonar hipóxica, que desvía flujo hacia unidades ventiladas, limita en parte el shunt (West & Luks, 2021).
5. **¿Qué vigilar?** Saturación, gases arteriales tras cada cambio, hemodinamia (la PEEP puede reducir el gasto cardíaco) y lactato como indicador del balance entre aporte y consumo.

Los criterios para elegir PEEP y metas de oxigenación se desarrollan en «Oxigenación y PEEP» y en «Gasometría y ajustes del ventilador».

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y:

- Sube solo la FiO₂ y observa cuánto mejoran la SpO₂ y la PaO₂: en un patrón de shunt la mejora es limitada.
- Devuelve la FiO₂ a su valor y aumenta la PEEP de forma escalonada; compara la respuesta de la PaO₂ y vigila la presión arterial media.
- Aumenta la frecuencia respiratoria y comprueba que la PaCO₂ baja, mientras la PaO₂ cambia poco: ventilación y oxigenación responden a ajustes distintos.

<!-- block: EXERCISE | Preguntas de comprobación -->
**1. Un paciente con PaO₂ 95 mmHg, SaO₂ 0,97 y Hb 6 g/dL, ¿tiene un aporte de O₂ adecuado?**

No necesariamente. $C_aO_2 = 1{,}34 \times 6 \times 0{,}97 + 0{,}29 \approx 8{,}08\,\text{mL/dL}$, menos de la mitad de lo normal. La gasometría «normal» no garantiza el aporte.

**2. ¿Por qué un tromboembolismo pulmonar extenso aumenta el espacio muerto pero no siempre la PaCO₂?**

Porque las unidades sin perfusión desperdician ventilación, y el centro respiratorio compensa aumentando el volumen minuto (Petersson & Glenny, 2014). La hipercapnia aparece si el paciente no puede sostener esa ventilación.

**3. En la acidosis con fiebre, ¿la hemoglobina libera más o menos O₂ en los tejidos?**

Más: la acidosis y la temperatura alta desplazan la curva a la derecha y reducen la afinidad (Collins et al., 2015).

<!-- page: sintesis-intercambio | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La difusión sigue la ley de Fick: depende del área, del espesor, del gradiente de presión parcial y de la solubilidad del gas; el CO₂ difunde mucho más fácilmente que el O₂.
- La relación $\dot{V}_A/\dot{Q}$ de cada unidad determina su PO₂ y su PCO₂; el shunt y las relaciones bajas son las causas más frecuentes de hipoxemia (Petersson & Glenny, 2014).
- El shunt responde mal al aumento de FiO₂; se corrige reabriendo unidades o tratando la causa.
- La curva de disociación es sigmoidea: meseta por encima de unos 60 mmHg, caída brusca por debajo, P50 cercana a 27 mmHg (Severinghaus, 1979; Collins et al., 2015).
- $C_aO_2 = 1{,}34 \cdot Hb \cdot S_aO_2 + 0{,}003 \cdot P_aO_2$; el aporte depende también de la hemoglobina y del gasto cardíaco (Tymen et al., 2026).
- El CO₂ viaja sobre todo como bicarbonato (≈ 90 % del total arterial); el efecto Haldane facilita su carga en los tejidos y su liberación en el pulmón (Ltaief et al., 2021).
- El aumento del espacio muerto suele traducirse en más volumen minuto antes que en hipercapnia, y en el SDRA refleja sobre todo heterogeneidad V/Q (Robertson, 2015).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Subir la FiO₂ indefinidamente ante una hipoxemia refractaria** → si el mecanismo es shunt, el oxígeno no llega a la sangre que no ve gas → busca reabrir unidades o tratar la causa y reevalúa el mecanismo.
- **Tomar la PaO₂ como medida del oxígeno disponible** → la mayor parte del O₂ va unida a la hemoglobina → calcula el contenido y considera la Hb y el gasto cardíaco.
- **Perseguir una PaO₂ muy alta como reserva de seguridad** → en la meseta de la curva el contenido apenas aumenta → fija metas de oxigenación según las guías que verás en lecciones posteriores.
- **Atribuir la hipercapnia a un problema de difusión** → el CO₂ difunde con gran facilidad → piensa en hipoventilación alveolar o en aumento de espacio muerto no compensado.
- **Confundir la saturación venosa con la arterial** → la venosa mixta normal ronda el 75 % y refleja el balance entre aporte y consumo → interpreta cada una con su significado.

<!-- block: REFERENCES | Referencias -->
- Collins, J.-A., Rudenski, A., Gibson, J., Howard, L., & O'Driscoll, R. (2015). Relating oxygen partial pressure, saturation and content: The haemoglobin–oxygen dissociation curve. *Breathe, 11*(3), 194–201. [https://doi.org/10.1183/20734735.001415](https://doi.org/10.1183/20734735.001415)
- Ltaief, Z., Schneider, A. G., & Liaudet, L. (2021). Pathophysiology and clinical implications of the veno-arterial PCO₂ gap. *Critical Care, 25*(1), 318. [https://doi.org/10.1186/s13054-021-03671-w](https://doi.org/10.1186/s13054-021-03671-w)
- Mallat, J., Jozwiak, M., Orozco, N., Hamzaoui, O., Monnet, X., Teboul, J.-L., De Backer, D., & Ospina-Tascón, G. A. (2025). Use of CO₂-derived variables in critically ill patients. *Annals of Intensive Care, 15*(1), 142. [https://doi.org/10.1186/s13613-025-01569-2](https://doi.org/10.1186/s13613-025-01569-2)
- Petersson, J., & Glenny, R. W. (2014). Gas exchange and ventilation–perfusion relationships in the lung. *European Respiratory Journal, 44*(4), 1023–1041. [https://doi.org/10.1183/09031936.00037014](https://doi.org/10.1183/09031936.00037014)
- Robertson, H. T. (2015). Dead space: The physiology of wasted ventilation. *European Respiratory Journal, 45*(6), 1704–1716. [https://doi.org/10.1183/09031936.00137614](https://doi.org/10.1183/09031936.00137614)
- Severinghaus, J. W. (1979). Simple, accurate equations for human blood O₂ dissociation computations. *Journal of Applied Physiology, 46*(3), 599–602. [https://doi.org/10.1152/jappl.1979.46.3.599](https://doi.org/10.1152/jappl.1979.46.3.599)
- Tymen, R., dos Santos, E. C., Taccone, F. S., & Aubron, C. (2026). Physiological determinants and the red blood cells transfusion decision-making process in non-bleeding critically ill patients: A comprehensive narrative review. *Intensive Care Medicine, 52*(2), 309–323. [https://doi.org/10.1007/s00134-026-08304-w](https://doi.org/10.1007/s00134-026-08304-w)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.
