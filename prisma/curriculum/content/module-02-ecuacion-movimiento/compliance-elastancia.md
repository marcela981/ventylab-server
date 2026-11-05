<!-- page: conceptos-compliance | THEORY | Compliance y elastancia: conceptos -->
<!-- block: INTRODUCTION | Por qué importa medir la rigidez del sistema respiratorio -->
La compliance responde a una pregunta sencilla: ¿cuánto volumen entra en el sistema respiratorio por cada centímetro de agua de presión que aplicas? Un sistema distensible acepta mucho volumen con poca presión; uno rígido necesita mucha presión para el mismo volumen. Esa propiedad determina qué presión meseta y qué *driving pressure* genera un volumen corriente dado, y por tanto cuánta tensión soporta el pulmón en cada respiración.

En la práctica, la compliance es también un marcador de evolución. Una caída brusca obliga a buscar una complicación (neumotórax, intubación selectiva, atelectasia, edema); una mejoría progresiva acompaña muchas veces a la resolución del proceso pulmonar.

<!-- block: THEORY | Compliance y elastancia: dos caras de la misma propiedad -->
La **compliance** ($C$) es el cambio de volumen dividido por el cambio de presión que lo produce. La **elastancia** ($E$) es su inverso: el cambio de presión que produce cada unidad de volumen. Un pulmón rígido tiene compliance baja y elastancia alta (Grinnan y Truwit, 2005).

Ambas expresiones son útiles. La compliance es más intuitiva al pie de la cama («entran 40 mL por cada cmH₂O»). La elastancia es más cómoda cuando se analizan componentes que actúan uno detrás de otro, porque las elastancias del pulmón y de la pared torácica **se suman**: el ventilador tiene que distender a la vez el pulmón y la caja torácica que lo rodea. En cambio, las compliances se combinan como resistencias en paralelo, de modo que la compliance total es menor que la de cada componente por separado (Grinnan y Truwit, 2005).

Como referencia, en un adulto sin enfermedad pulmonar sometido a ventilación mecánica la compliance estática del sistema respiratorio se sitúa aproximadamente entre 50 y 100 mL/cmH₂O; en la enfermedad restrictiva del parénquima, como el SDRA, suele ser menor de 50 mL/cmH₂O, y valores por debajo de 25 mL/cmH₂O traducen una restricción grave (Grinnan y Truwit, 2005; Pérez-Nieto et al., 2023).

<!-- block: THEORY | Compliance estática y compliance dinámica -->
- **Compliance estática ($C_{st}$):** se calcula con la presión meseta, medida durante una pausa sin flujo al final de la inspiración. Al no haber flujo, la presión de la vía aérea se equilibra con la presión alveolar y el cálculo refleja solo las propiedades elásticas del pulmón y la pared (Grinnan y Truwit, 2005). En el ensayo de la ARDS Network, por ejemplo, la presión meseta se midió tras una pausa de 0,5 s al final de la inspiración (ARDS Network, 2000).
- **Compliance dinámica ($C_{dyn}$):** se calcula con la presión pico. Como la presión pico incluye el componente resistivo, la compliance dinámica no es una propiedad elástica pura: baja tanto si el pulmón se vuelve rígido como si aumenta la resistencia. Su ventaja es que se puede calcular en cada respiración sin pausa; su desventaja es que no permite saber cuál de los dos problemas existe. Si la dinámica cae y la estática se mantiene, el problema es resistivo.

<!-- block: THEORY | La curva presión-volumen estática -->
Si se inflara el sistema respiratorio en pasos y se midiera la presión estática en cada uno, se obtendría una curva con forma de S. En la parte inferior, a volúmenes bajos, la pendiente es escasa porque muchas unidades alveolares están colapsadas y hay que abrirlas. Después aparece un tramo casi lineal, empinado, donde la compliance es máxima. Al final, la curva se aplana: las unidades ya abiertas están sobredistendidas y cada cmH₂O adicional aporta poco volumen. Los cambios de pendiente se describen como punto de inflexión inferior y superior (Grinnan y Truwit, 2005).

![Dos curvas presión-volumen estáticas en forma de S. La curva de compliance conservada muestra un tramo inicial plano, un punto de inflexión inferior, una zona lineal empinada de máxima compliance, un punto de inflexión superior y un tramo final plano de sobredistensión. La curva de baja compliance es más plana y está desplazada a la derecha](/learning/diagrams/b2-compliance-curva-pv.svg "Figura: curva presión-volumen estática con compliance conservada y disminuida")

Esta curva explica dos ideas que retomarás en el nivel avanzado: el mismo volumen corriente puede caer en la zona lineal o invadir la zona de sobredistensión según dónde empiece (es decir, según la PEEP y el volumen pulmonar disponible), y la compliance medida no es una constante del paciente, sino que depende del volumen al que se mide.

<!-- block: THEORY | Pulmón frente a pared torácica -->
La compliance que calcula el ventilador es la del **sistema respiratorio** completo. Una compliance baja puede deberse a un pulmón rígido, a una pared torácica rígida o a ambos. Entre las causas de pared torácica poco distensible se incluyen la obesidad, la ascitis, el tórax inestable, la cifoescoliosis y el fibrotórax; entre las que reducen la compliance pulmonar medida, el edema pulmonar, el SDRA, la fibrosis pulmonar, el neumotórax a tensión, la intubación del bronquio principal y la hiperinflación dinámica (Grinnan y Truwit, 2005). La compliance alta, en cambio, es característica del enfisema, donde la pérdida de retracción elástica facilita el inflado pero dificulta el vaciado.

La distinción tiene consecuencias. En un estudio de pacientes con SDRA de origen extrapulmonar, la elastancia de la pared torácica estaba anormalmente elevada y se correlacionaba con la presión intraabdominal, mientras que en el SDRA de origen pulmonar predominaba la elastancia del pulmón (Gattinoni et al., 1998). Y en pacientes ventilados, la fracción de la presión que realmente distiende el pulmón (elastancia pulmonar dividida por elastancia del sistema) varió entre 0,33 y 0,95, de modo que una misma presión meseta puede representar tensiones pulmonares muy diferentes (Chiumello et al., 2008).

<!-- page: formulas-compliance | THEORY | Fórmulas y cálculo -->
<!-- block: THEORY | Fórmulas básicas -->
**Compliance estática del sistema respiratorio:**

$$
C_{st} = \frac{V_t}{P_{meseta} - PEEP_{total}}
$$

**Compliance dinámica:**

$$
C_{dyn} = \frac{V_t}{P_{pico} - PEEP_{total}}
$$

**Elastancia:**

$$
E_{rs} = \frac{1}{C_{rs}} = \frac{P_{meseta} - PEEP_{total}}{V_t}
$$

**Driving pressure (presión de distensión):**

$$
\Delta P = P_{meseta} - PEEP_{total} = \frac{V_t}{C_{rs}}
$$

| Símbolo | Significado | Unidades |
|---|---|---|
| $V_t$ | Volumen corriente espirado | mL o L |
| $P_{meseta}$ | Presión al final de una pausa inspiratoria sin flujo | cmH₂O |
| $P_{pico}$ | Presión máxima inspiratoria | cmH₂O |
| $PEEP_{total}$ | PEEP programada más auto-PEEP, medida con pausa espiratoria | cmH₂O |
| $C_{st}$, $C_{dyn}$ | Compliance estática y dinámica | mL/cmH₂O |
| $E_{rs}$ | Elastancia del sistema respiratorio | cmH₂O/L |

<!-- block: EQUATION | Las elastancias de pulmón y pared se suman -->
E_{rs} = E_{L} + E_{cw} \quad\Longleftrightarrow\quad \frac{1}{C_{rs}} = \frac{1}{C_{L}} + \frac{1}{C_{cw}}

<!-- block: THEORY | Ejemplo resuelto -->
Un paciente en VCV, relajado: $V_t = 420\,\text{mL}$, Ppico 34 cmH₂O, Pmeseta 26 cmH₂O, PEEP programada 8 cmH₂O. En la pausa espiratoria la presión sube a 10 cmH₂O, es decir, hay 2 cmH₂O de auto-PEEP.

**Paso 1, PEEP total:** $8 + 2 = 10\,\text{cmH}_2\text{O}$.

**Paso 2, compliance estática:**

$$
C_{st} = \frac{420}{26 - 10} = \frac{420}{16} \approx 26\,\text{mL/cmH}_2\text{O}
$$

**Paso 3, compliance dinámica:**

$$
C_{dyn} = \frac{420}{34 - 10} = \frac{420}{24} = 17{,}5\,\text{mL/cmH}_2\text{O}
$$

**Paso 4, elastancia y driving pressure:** $E_{rs} = 16/0{,}42 \approx 38\,\text{cmH}_2\text{O/L}$; $\Delta P = 16\,\text{cmH}_2\text{O}$.

**Error típico:** si hubieras usado la PEEP programada (8) en lugar de la total, habrías obtenido $420/18 \approx 23\,\text{mL/cmH}_2\text{O}$, subestimando la compliance y sobrestimando la *driving pressure*.

**Reparto entre pulmón y pared:** el ventilador no puede separar ambos componentes. Para hacerlo se necesita una estimación de la presión pleural, habitualmente con un catéter de presión esofágica; con ella se calcula la presión transpulmonar, que es la que realmente distiende el pulmón (Mauri et al., 2016). La figura muestra por qué importa: con la misma *driving pressure* del sistema, el pulmón puede recibir la mayor parte de la presión o solo una fracción.

![Dos barras apiladas con la misma driving pressure de 15 cmH2O. En el paciente A, con pulmón rígido, 12 cmH2O distienden el pulmón y 3 la pared. En el paciente B, con pared rígida por abdomen tenso, 6 cmH2O distienden el pulmón y 9 la pared](/learning/diagrams/b2-compliance-pulmon-pared.svg "Figura: reparto ilustrativo de la driving pressure entre pulmón y pared torácica")

<!-- page: aplicacion-clinica-compliance | CASE_STUDY | Aplicación clínica: compliance en el SDRA con obesidad -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 47 años con obesidad grave (índice de masa corporal 41 kg/m²), ingresada por neumonía bilateral que evoluciona a SDRA moderado. Intubada, sedada y sin esfuerzo inspiratorio. VCV con $V_t = 400\,\text{mL}$, flujo constante 50 L/min, PEEP 12 cmH₂O, FiO₂ 0,6.

**Mediciones:** Ppico 36 cmH₂O; pausa inspiratoria de 0,5 s con Pmeseta 30 cmH₂O, estable durante la pausa; pausa espiratoria con PEEP total 13 cmH₂O.

**Paso 1, calcular.**
- $C_{st} = 400/(30 - 13) = 400/17 \approx 23{,}5\,\text{mL/cmH}_2\text{O}$.
- $\Delta P = 30 - 13 = 17\,\text{cmH}_2\text{O}$.
- $C_{dyn} = 400/(36 - 13) \approx 17\,\text{mL/cmH}_2\text{O}$. La diferencia pico menos meseta (6 cmH₂O) es moderada: el problema dominante es elástico.

**Paso 2, interpretar la cifra.** Una compliance estática por debajo de 25 mL/cmH₂O indica una restricción grave (Pérez-Nieto et al., 2023). La meseta está en el límite de 30 cmH₂O usado en el ensayo de la ARDS Network (ARDS Network, 2000), y las guías de la ESICM describen el abordaje actual del SDRA como limitar el volumen corriente a 4-8 mL/kg de peso predicho y mantener la presión meseta por debajo de 30 cmH₂O (Grasselli et al., 2023).

**Paso 3, preguntarse de dónde viene la rigidez.** En esta paciente concurren un pulmón enfermo y una pared torácica y un abdomen que pesan sobre el tórax. La obesidad es causa reconocida de baja compliance de la pared (Grinnan y Truwit, 2005), y la presión meseta no distingue cuánto de esos 30 cmH₂O distiende realmente el pulmón (Chiumello et al., 2008). Si el equipo dispone de presión esofágica, la presión transpulmonar ayudaría a precisarlo (Mauri et al., 2016).

**Paso 4, reconocer los límites de la evidencia.** La *driving pressure* se asoció con la supervivencia en un análisis de nueve ensayos (Amato et al., 2015), pero las guías de la ESICM 2023 señalan que las estrategias basadas en limitar la *driving pressure* todavía deben evaluarse en ensayos clínicos (Grasselli et al., 2023). Úsala como señal de alerta y para comparar respuestas a cambios, no como un objetivo aislado. Las decisiones concretas (volumen corriente, PEEP, prono) se desarrollan en los módulos de ventilación protectora y SDRA.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) en VCV y prueba lo siguiente:

1. Lee la presión pico y la meseta y calcula la compliance estática con el volumen corriente espirado. Compárala con el rango de referencia de esta lección.
2. Reduce el volumen corriente en pasos pequeños: la presión meseta y la *driving pressure* bajan; observa cómo cambia la ventilación minuto y, con el tiempo, la PaCO₂.
3. Modifica la PEEP y vuelve a medir: si la compliance mejora, el cambio de PEEP probablemente aumentó el pulmón aireado; si empeora, piensa en sobredistensión.
4. Observa en el bucle presión-volumen que la pendiente es menor que en el caso de pulmón normal.

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** En la paciente del caso, ¿qué presión meseta esperarías si el volumen corriente se redujera a 340 mL y la compliance no cambiara?

*Respuesta:* $\Delta P = 340/23{,}5 \approx 14{,}5\,\text{cmH}_2\text{O}$; Pmeseta $\approx 14{,}5 + 13 = 27{,}5\,\text{cmH}_2\text{O}$.

**2.** Un paciente pasa en una hora de $C_{st}$ 45 a 25 mL/cmH₂O; su presión pico y su meseta suben en paralelo. Nombra tres causas que debes descartar al pie de la cama.

*Respuesta:* neumotórax (sobre todo a tensión), intubación selectiva del bronquio principal y atelectasia u obstrucción de un bronquio con colapso; también edema pulmonar o distensión abdominal aguda.

**3.** ¿Por qué la compliance dinámica no basta para diagnosticar un pulmón rígido?

*Respuesta:* porque se calcula con la presión pico, que incluye el componente resistivo; un broncoespasmo o un tubo obstruido la reducen sin que cambie la elasticidad.

<!-- page: sintesis-compliance | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La compliance es volumen dividido por presión; la elastancia, su inverso. Las elastancias de pulmón y pared se suman.
- La compliance estática se calcula con la presión meseta y la PEEP total; la dinámica, con la presión pico, e incluye efecto resistivo.
- Como referencia, la compliance estática en adultos ventilados sin enfermedad pulmonar está entre 50 y 100 mL/cmH₂O; menos de 25 mL/cmH₂O indica restricción grave (Grinnan y Truwit, 2005; Pérez-Nieto et al., 2023).
- La curva presión-volumen estática tiene forma de S: la compliance depende del volumen al que se mide, y hay zonas de colapso y de sobredistensión.
- La compliance del ventilador es la del sistema respiratorio; una pared rígida (obesidad, abdomen tenso) puede reducirla sin que el pulmón sea el único responsable.
- La misma presión meseta puede implicar tensiones pulmonares distintas; la presión esofágica permite estimar la presión transpulmonar.
- Un descenso brusco de compliance es una alarma clínica: busca neumotórax, intubación selectiva, atelectasia o edema.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Calcular la compliance con la PEEP programada** → ignora la auto-PEEP y subestima la compliance → mide la PEEP total con una pausa espiratoria.
- **Usar una meseta inestable o con esfuerzo del paciente** → la presión no se equilibra o incluye $P_{mus}$, y el cálculo pierde validez → asegúrate de que el paciente esté pasivo y la presión se mantenga plana durante la pausa.
- **Atribuir toda la rigidez al pulmón** → en obesidad o hipertensión abdominal una parte importante de la presión se gasta en la pared → considera la pared torácica y, si está disponible, la presión esofágica.
- **Confundir compliance dinámica con estática** → la dinámica baja también por aumento de resistencia → interpreta siempre ambas, o mejor, pico y meseta por separado.
- **Tratar la compliance como un valor fijo** → cambia con el volumen, la PEEP y la evolución de la enfermedad → mídela en condiciones comparables y registra la tendencia.
- **Fijar la driving pressure como objetivo único** → la evidencia proviene de análisis observacionales y su uso como meta no está validado en ensayos → intégrala con la presión meseta, el volumen corriente y la clínica.

<!-- block: REFERENCES | Referencias -->
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., et al. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747–755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network [Acute Respiratory Distress Syndrome Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Chiumello, D., Carlesso, E., Cadringher, P., Caironi, P., Valenza, F., Polli, F., Tallarini, F., Cozzi, P., Cressoni, M., Colombo, A., Marini, J. J., & Gattinoni, L. (2008). Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 178*(4), 346–355. [https://doi.org/10.1164/rccm.200710-1589OC](https://doi.org/10.1164/rccm.200710-1589OC)
- Gattinoni, L., Pelosi, P., Suter, P. M., Pedoto, A., Vercesi, P., & Lissoni, A. (1998). Acute respiratory distress syndrome caused by pulmonary and extrapulmonary disease: Different syndromes? *American Journal of Respiratory and Critical Care Medicine, 158*(1), 3–11. [https://doi.org/10.1164/ajrccm.158.1.9708031](https://doi.org/10.1164/ajrccm.158.1.9708031)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., et al. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Grinnan, D. C., & Truwit, J. D. (2005). Clinical review: Respiratory mechanics in spontaneous and assisted ventilation. *Critical Care, 9*(5), 472–484. [https://doi.org/10.1186/cc3516](https://doi.org/10.1186/cc3516)
- Mauri, T., Yoshida, T., Bellani, G., Goligher, E. C., Carteaux, G., Rittayamai, N., Mojoli, F., Chiumello, D., Piquilloud, L., Grasso, S., et al. (2016). Esophageal and transpulmonary pressure in the clinical setting: Meaning, usefulness and perspectives. *Intensive Care Medicine, 42*(9), 1360–1373. [https://doi.org/10.1007/s00134-016-4400-x](https://doi.org/10.1007/s00134-016-4400-x)
- Pérez-Nieto, O. R., Mancilla-Galindo, J., Mendiola-Villalobos, C., Carrión-Moya, J. D., Zamarrón-López, E. I., Guerrero-Gutiérrez, M. A., et al. (2023). Aplicaciones clínicas de la ecuación del movimiento del sistema respiratorio para la toma de decisiones en el paciente bajo ventilación mecánica invasiva: artículo de reflexión. *Iatreia, 36*(1), 112–127. [https://doi.org/10.17533/udea.iatreia.179](https://doi.org/10.17533/udea.iatreia.179)
