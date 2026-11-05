<!-- page: pulmon-y-pared | THEORY | Pulmón y pared torácica: dos resortes en serie -->
<!-- block: INTRODUCTION | Por qué importa -->
La presión que lees en el ventilador se reparte entre dos estructuras: el **pulmón**, que es lo que queremos proteger, y la **pared torácica** (caja costal, diafragma y abdomen), que hay que desplazar para que el pulmón se expanda. En la mayoría de los pacientes no sabes qué parte de la presión meseta distiende realmente el pulmón. En un paciente con obesidad grave, distensión abdominal o edema de la pared, una presión meseta de 30 cmH₂O puede corresponder a una distensión pulmonar moderada; en otro con pared normal, la misma cifra puede ser lesiva.

La **presión esofágica** ($P_{es}$) es el método disponible al pie de cama para estimar la presión pleural y, con ella, la **presión transpulmonar** ($P_{tp}$ o $P_L$), que es la presión que de verdad distiende el pulmón. Un documento de expertos de la ESICM resume sus fundamentos: los cambios de $P_{es}$ representan los cambios de presión pleural, y la diferencia entre la presión de la vía aérea y la $P_{es}$ es una estimación válida de la presión transpulmonar (Akoumianaki et al., 2014). En esta lección aprenderás a medirla, calcularla, interpretarla y situarla frente a la evidencia.

<!-- block: THEORY | Partición de presiones -->
Piensa en el sistema respiratorio como dos resortes en serie. La presión en la vía aérea en condiciones estáticas ($P_{aw}$) se divide en:

- La presión que distiende el pulmón: $P_{tp} = P_{aw} - P_{pl}$, donde $P_{pl}$ es la presión pleural.
- La presión que distiende la pared torácica: $P_{pl}$ respecto a la atmósfera.

Como la presión pleural no se mide de forma directa en la práctica, se usa la presión en el tercio inferior del esófago, que es un órgano blando situado en el mediastino y transmite la presión que lo rodea. Del mismo modo, la elastancia del sistema respiratorio ($E_{rs}$, inversa de la compliance) es la suma de la del pulmón ($E_L$) y la de la pared ($E_{cw}$):

$$
E_{rs} = E_L + E_{cw}
$$

La proporción $E_L/E_{rs}$ indica qué fracción de la presión aplicada en cada respiración distiende el pulmón. Esa fracción varía mucho entre pacientes, y por eso la $P_{plat}$ y la driving pressure de la vía aérea pueden sobrestimar o subestimar el estrés pulmonar.

![Esquema del sistema respiratorio como dos compartimentos en serie: la vía aérea con su presión, el pulmón entre la vía aérea y el espacio pleural, y la pared torácica entre el espacio pleural y el exterior. Un catéter con balón en el esófago estima la presión pleural, y la presión transpulmonar es la presión de la vía aérea menos la esofágica.](/learning/diagrams/a5-pes-modelo-pulmon-pared.svg "Figura: la presión esofágica estima la presión pleural y permite separar la presión transpulmonar de la que se gasta en la pared torácica")

<!-- block: THEORY | Qué región representa la presión esofágica -->
La presión pleural no es uniforme: por el peso del pulmón y del corazón, en decúbito supino es más alta en las regiones dependientes (dorsales) que en las no dependientes (ventrales). Durante años se discutió si el valor absoluto de la $P_{es}$ era interpretable o solo sus cambios. Yoshida y colaboradores compararon la $P_{es}$ con sensores pleurales directos en cerdos con lesión pulmonar y en cadáveres humanos. La presión transpulmonar calculada con la $P_{es}$ reflejó bien la de las regiones medias a dependientes, cercanas al esófago, donde suele predominar la atelectasia. En cambio, la presión transpulmonar inspiratoria estimada a partir del cociente de elastancias reflejó la de las regiones no dependientes, el *baby lung*, donde el riesgo de sobredistensión es mayor (Yoshida et al., 2018).

Esta distinción es la base del uso actual:

- La $P_{tp}$ **espiratoria** calculada directamente sirve para valorar si las regiones dependientes tienden a colapsarse al final de la espiración.
- La $P_{tp}$ **inspiratoria** derivada de elastancias sirve para estimar el estrés máximo en las regiones ventrales.

<!-- page: tecnica-y-calculo | EXERCISE | Técnica de medición y cálculos -->
<!-- block: THEORY | El catéter con balón -->
La $P_{es}$ se mide habitualmente con un catéter con un balón de látex de pared fina lleno de aire, introducido por vía nasal u oral hasta el tercio inferior del esófago y conectado a un transductor; algunos ventiladores tienen un puerto auxiliar para ello (Akoumianaki et al., 2014). Pasos generales:

1. **Inserción** hasta el estómago y comprobación de la presión gástrica (aumenta con la compresión abdominal suave).
2. **Retirada** hasta el esófago: aparecen oscilaciones cardíacas y la presión cambia con la respiración en el mismo sentido que la presión pleural.
3. **Llenado del balón** con el volumen recomendado por el fabricante: un balón demasiado vacío no transmite la presión y uno demasiado lleno añade la presión de su propia pared.
4. **Prueba de oclusión** para validar la posición.

<!-- block: THEORY | La prueba de oclusión -->
Baydur y colaboradores propusieron un método sencillo: ocluir la vía aérea al final de la espiración y comparar los cambios de $P_{es}$ con los cambios de presión en la boca (o la vía aérea) durante los esfuerzos inspiratorios contra la oclusión. Con la vía aérea cerrada no hay flujo, y los cambios de presión pleural se transmiten íntegros a la vía aérea; si el balón está bien colocado, el cociente $\Delta P_{es}/\Delta P_{aw}$ es cercano a 1. Si no lo es, recolocar el balón a otra altura permite encontrar una posición válida (Baydur et al., 1982).

<!-- block: THEORY | Fórmulas -->
Todas las mediciones se hacen con el paciente pasivo, durante una pausa inspiratoria y una pausa espiratoria.

**Presión transpulmonar espiratoria** (método directo):

$$
P_{tp,esp} = PEEP_{total} - P_{es,esp}
$$

**Presión transpulmonar inspiratoria** (método directo):

$$
P_{tp,insp} = P_{plat} - P_{es,insp}
$$

**Elastancias** a partir de los cambios en el ciclo ($V_T$ en litros):

$$
E_{rs} = \frac{P_{plat} - PEEP_{total}}{V_T} \qquad E_{cw} = \frac{P_{es,insp} - P_{es,esp}}{V_T} \qquad E_L = E_{rs} - E_{cw}
$$

**Presión transpulmonar inspiratoria derivada de elastancias**:

$$
P_{tp,insp}^{E} = P_{plat} \cdot \frac{E_L}{E_{rs}}
$$

**Driving pressure transpulmonar**:

$$
\Delta P_L = \Delta P - \Delta P_{es} = (P_{plat} - PEEP_{total}) - (P_{es,insp} - P_{es,esp})
$$

![Curvas superpuestas de presión en la vía aérea y presión esofágica frente al tiempo con una pausa inspiratoria y otra espiratoria. En la pausa inspiratoria la meseta es 30 y la esofágica 23 cmH₂O (presión transpulmonar inspiratoria 7); en la pausa espiratoria la PEEP total es 10 y la esofágica 16 cmH₂O (presión transpulmonar espiratoria −6).](/learning/diagrams/a5-pes-curvas-paw-pes.svg "Figura: las pausas inspiratoria y espiratoria permiten restar la presión esofágica de la presión de la vía aérea")

Símbolos: $P_{es,esp}$ y $P_{es,insp}$ son las presiones esofágicas durante las pausas espiratoria e inspiratoria (cmH₂O); $E$ se expresa en cmH₂O/L.

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente pasivo con obesidad grave. $V_T = 0{,}4\,\text{L}$, $PEEP_{total} = 10$, $P_{plat} = 30$, $P_{es,esp} = 16$, $P_{es,insp} = 23\,\text{cmH}_2\text{O}$.

1. $P_{tp,esp} = 10 - 16 = -6\,\text{cmH}_2\text{O}$: negativa. La presión pleural supera a la alveolar al final de la espiración, lo que sugiere colapso de las regiones dependientes.
2. $P_{tp,insp} = 30 - 23 = 7\,\text{cmH}_2\text{O}$ (directa).
3. $E_{rs} = 20/0{,}4 = 50$; $E_{cw} = 7/0{,}4 = 17{,}5$; $E_L = 32{,}5\,\text{cmH}_2\text{O/L}$; $E_L/E_{rs} = 0{,}65$.
4. $P_{tp,insp}^{E} = 30 \cdot 0{,}65 = 19{,}5\,\text{cmH}_2\text{O}$.
5. $\Delta P_L = 20 - 7 = 13\,\text{cmH}_2\text{O}$.

Observa que los dos métodos inspiratorios dan valores distintos (7 frente a 19,5). No es un error: según los datos de Yoshida y colaboradores, el primero se aproxima a lo que sucede cerca del esófago y el segundo a las regiones ventrales, que son las que más se distienden (Yoshida et al., 2018). La meseta de 30 cmH₂O no se traduce en un estrés pulmonar tan alto como parecería, pero el pulmón dependiente se está colapsando en cada espiración.

<!-- page: aplicacion-clinica-pes | CASE_STUDY | Aplicación clínica: titulación de PEEP en un paciente con obesidad -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente**: mujer de 52 años, índice de masa corporal 48 kg/m², peso predicho 60 kg, insuficiencia respiratoria hipoxémica por neumonía, intubada hace 12 horas, sedada y con bloqueo neuromuscular.

**Programación**: VCV, $V_T = 400\,\text{mL}$ (6,7 mL/kg), $FR = 22$, PEEP 10 (sin auto-PEEP), FiO₂ 0,8. SpO₂ 89 %, presión arterial media 74 mmHg.

**Mediciones**: $P_{plat} = 30$, $P_{es,esp} = 16$, $P_{es,insp} = 23\,\text{cmH}_2\text{O}$ (los datos del ejemplo resuelto). Prueba de oclusión con cociente cercano a 1.

**Paso 1. Interpretar.** La driving pressure de la vía aérea es 20 cmH₂O, pero 7 corresponden a la pared torácica: $\Delta P_L = 13$. La $P_{tp,esp}$ es de −6 cmH₂O: con esta PEEP, las regiones dependientes se cierran al final de cada espiración.

**Paso 2. Plantear el objetivo.** Subir la PEEP para llevar la $P_{tp,esp}$ hacia valores cercanos a 0. En el análisis secundario del ensayo EPVent-2, la mortalidad fue menor cuando la PEEP alcanzó una $P_{tp,esp}$ cercana a 0 cmH₂O que con valores más positivos o más negativos; es un hallazgo *post hoc* que requiere confirmación prospectiva (Sarge et al., 2021). En pacientes con obesidad mórbida, Pirrone y colaboradores encontraron que la PEEP elegida por los clínicos (11,6 ± 2,9 cmH₂O) era inferior a la identificada con presión esofágica o con una prueba decremental (alrededor de 21 cmH₂O con ambos métodos), y que la titulación mejoró el volumen pulmonar, la elastancia y la oxigenación (Pirrone et al., 2016).

**Paso 3. Ajustar y medir.** Subes la PEEP en escalones de 2 cmH₂O vigilando la presión arterial. Con PEEP 16: $P_{es,esp} = 16$ ($P_{tp,esp} = 0$), $P_{plat} = 31$, $P_{es,insp} = 21$.

- $\Delta P = 15$, $\Delta P_{es} = 5$, $\Delta P_L = 10\,\text{cmH}_2\text{O}$: la carga pulmonar por ciclo **disminuyó** y la compliance mejoró.
- $E_{rs} = 15/0{,}4 = 37{,}5$; $E_{cw} = 5/0{,}4 = 12{,}5$; $E_L/E_{rs} = 25/37{,}5 \approx 0{,}67$; $P_{tp,insp}^{E} \approx 31 \cdot 0{,}67 \approx 20{,}7\,\text{cmH}_2\text{O}$.
- SpO₂ 95 % con FiO₂ 0,6; presión arterial media 70 mmHg.

**Paso 4. Razonar el resultado.** La presión meseta supera ligeramente los 30 cmH₂O, pero buena parte se emplea en desplazar una pared torácica muy rígida: el estrés pulmonar estimado apenas cambió, mientras se eliminó el colapso espiratorio. Esta es la situación en la que la presión esofágica aporta más información: cuando la pared torácica es anormal y los límites de la vía aérea podrían llevar a una PEEP insuficiente. Mantén la vigilancia hemodinámica, porque la PEEP alta transmitida al tórax puede reducir el retorno venoso.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
El simulador no muestra la presión esofágica, pero puedes practicar el razonamiento de la mecánica. Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y:

1. Mide la presión meseta con pausa inspiratoria y calcula la driving pressure y la compliance con la PEEP inicial.
2. Sube la PEEP en escalones de 2 cmH₂O con el mismo volumen: observa si la compliance mejora (la meseta sube menos que la PEEP) y cómo cambian la SpO₂ y la presión arterial media.
3. Identifica a partir de qué escalón la driving pressure vuelve a subir o la presión arterial cae: es el punto en el que deberías detenerte.

<!-- block: EXERCISE | Preguntas -->
**1.** Con PEEP 8, la $P_{es,esp}$ es 14 cmH₂O. ¿Cuánto vale la $P_{tp,esp}$ y qué sugiere?

*Respuesta*: $8 - 14 = -6\,\text{cmH}_2\text{O}$; la presión pleural supera a la alveolar al final de la espiración, lo que favorece el cierre de las regiones dependientes.

**2.** La prueba de oclusión da un cociente $\Delta P_{es}/\Delta P_{aw}$ de 0,5. ¿Qué haces?

*Respuesta*: la medida no es válida; revisa el llenado del balón y recoloca el catéter a otra altura hasta obtener un cociente cercano a 1 antes de usar los valores (Baydur et al., 1982).

**3.** ¿Por qué el valor absoluto de la $P_{es}$ es menos fiable que sus cambios?

*Respuesta*: porque la presión pleural varía entre regiones y el valor absoluto puede alterarse por el peso del mediastino, el llenado del balón y la posición; los cambios durante el ciclo, en cambio, se validan con la prueba de oclusión (Akoumianaki et al., 2014; Yoshida et al., 2018).

<!-- page: evidencia-clinica | THEORY | Evidencia clínica y errores frecuentes -->
<!-- block: THEORY | Lo que dicen los ensayos -->
- **EPVent (2008)**: ensayo piloto en lesión pulmonar aguda y SDRA que comparó la PEEP ajustada según la presión esofágica con la tabla de la red ARDS. Se detuvo al alcanzar su criterio de parada tras incluir 61 pacientes; a las 72 horas la PaO₂/FiO₂ fue 88 mmHg mayor en el grupo guiado por presión esofágica, con mejor compliance (Talmor et al., 2008). El objetivo principal era la oxigenación, no la mortalidad.
- **EPVent-2 (2019)**: ensayo de fase 2 en 200 pacientes con SDRA moderado a grave (PaO₂/FiO₂ ≤ 200 mmHg) que comparó la PEEP guiada por presión esofágica con una tabla empírica de PEEP alta. No hubo diferencias en el resultado combinado de muerte y días libres de ventilación ni en la mortalidad a 28 días (32,4 % frente a 30,6 %); el grupo guiado por presión esofágica necesitó menos terapias de rescate (3,9 % frente a 12,2 %) (Beitler et al., 2019).
- **Reanálisis de EPVent-2**: el efecto pareció variar según la gravedad de la disfunción multiorgánica, y la supervivencia fue mayor cuando la $P_{tp,esp}$ quedó cerca de 0 cmH₂O (Sarge et al., 2021). Son resultados exploratorios.
- **Guías de la ESICM (2023)**: no emiten recomendación a favor ni en contra de titular la PEEP guiándose principalmente por la mecánica respiratoria frente a las tablas PEEP/FiO₂, y señalan que la PEEP guiada por presión esofágica necesita más estudios (Grasselli et al., 2023).

En resumen, la presión esofágica es una herramienta fisiológica sólida para entender al paciente, sobre todo con pared torácica anormal o esfuerzo espontáneo, pero su uso sistemático para titular la PEEP no ha demostrado reducir la mortalidad.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Usar los valores sin prueba de oclusión** → un balón mal colocado o mal llenado da presiones erróneas → valida la posición antes de interpretar.
- **Medir con el paciente haciendo esfuerzos** → las pausas no son estáticas y las presiones no se pueden restar → mide con el paciente pasivo o interpreta solo los cambios dinámicos con cautela.
- **Interpretar una meseta alta como estrés pulmonar alto en el paciente con obesidad** → parte de la presión se emplea en la pared torácica → estima la presión transpulmonar o la driving pressure transpulmonar.
- **Usar el mismo método para todo** → la $P_{tp}$ directa y la derivada de elastancias representan regiones distintas → usa la espiratoria directa para el colapso y la inspiratoria derivada para la sobredistensión.
- **Subir la PEEP sin vigilar la hemodinamia** → la PEEP alta puede reducir el retorno venoso → cambia en escalones y controla la presión arterial en cada uno.
- **Presentar la titulación por presión esofágica como estándar con beneficio demostrado** → los ensayos no mostraron reducción de mortalidad → úsala como herramienta fisiológica en pacientes seleccionados.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La presión transpulmonar ($P_{aw} - P_{es}$) es la presión que distiende el pulmón; la presión esofágica estima la presión pleural (Akoumianaki et al., 2014).
- La elastancia del sistema es la suma de la pulmonar y la de la pared; el cociente $E_L/E_{rs}$ indica qué fracción de la presión llega al pulmón.
- La posición del balón se valida con la prueba de oclusión: el cociente $\Delta P_{es}/\Delta P_{aw}$ debe ser cercano a 1 (Baydur et al., 1982).
- La $P_{tp,esp}$ directa refleja las regiones medias a dependientes; la $P_{tp,insp}$ derivada de elastancias, las regiones no dependientes (Yoshida et al., 2018).
- Una $P_{tp,esp}$ negativa sugiere colapso espiratorio; llevarla cerca de 0 se asoció con mayor supervivencia en un análisis *post hoc* (Sarge et al., 2021).
- En la obesidad, la pared torácica absorbe parte de la presión y la PEEP habitual suele ser insuficiente (Pirrone et al., 2016).
- EPVent-2 no mostró beneficio en mortalidad y las guías de la ESICM no recomiendan su uso sistemático (Beitler et al., 2019; Grasselli et al., 2023).

<!-- block: REFERENCES | Referencias -->
- Akoumianaki, E., Maggiore, S. M., Valenza, F., Bellani, G., Jubran, A., Loring, S. H., Pelosi, P., Talmor, D., Grasso, S., Chiumello, D., Guérin, C., Patroniti, N., Ranieri, V. M., Gattinoni, L., Nava, S., Terragni, P.-P., Pesenti, A., Tobin, M., Mancebo, J., & Brochard, L. (2014). The application of esophageal pressure measurement in patients with respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 189*(5), 520-531. [https://doi.org/10.1164/rccm.201312-2193CI](https://doi.org/10.1164/rccm.201312-2193CI)
- Baydur, A., Behrakis, P. K., Zin, W. A., Jaeger, M., & Milic-Emili, J. (1982). A simple method for assessing the validity of the esophageal balloon technique. *American Review of Respiratory Disease, 126*(5), 788-791. [https://doi.org/10.1164/arrd.1982.126.5.788](https://doi.org/10.1164/arrd.1982.126.5.788)
- Beitler, J. R., Sarge, T., Banner-Goodspeed, V. M., Gong, M. N., Cook, D., Novack, V., Loring, S. H., & Talmor, D. (2019). Effect of titrating positive end-expiratory pressure (PEEP) with an esophageal pressure-guided strategy vs an empirical high PEEP-FiO₂ strategy on death and days free from mechanical ventilation among patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 321*(9), 846-857. [https://doi.org/10.1001/jama.2019.0555](https://doi.org/10.1001/jama.2019.0555)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Pirrone, M., Fisher, D., Chipman, D., Imber, D. A., Corona, J., Mietto, C., Kacmarek, R. M., & Berra, L. (2016). Recruitment maneuvers and positive end-expiratory pressure titration in morbidly obese ICU patients. *Critical Care Medicine, 44*(2), 300-307. [https://doi.org/10.1097/CCM.0000000000001387](https://doi.org/10.1097/CCM.0000000000001387)
- Sarge, T., Baedorf-Kassis, E., Banner-Goodspeed, V., Novack, V., Loring, S. H., Gong, M. N., Cook, D., Talmor, D., & Beitler, J. R. (2021). Effect of esophageal pressure-guided positive end-expiratory pressure on survival from acute respiratory distress syndrome: A risk-based and mechanistic reanalysis of the EPVent-2 trial. *American Journal of Respiratory and Critical Care Medicine, 204*(10), 1153-1163. [https://doi.org/10.1164/rccm.202009-3539OC](https://doi.org/10.1164/rccm.202009-3539OC)
- Talmor, D., Sarge, T., Malhotra, A., O'Donnell, C. R., Ritz, R., Lisbon, A., Novack, V., & Loring, S. H. (2008). Mechanical ventilation guided by esophageal pressure in acute lung injury. *New England Journal of Medicine, 359*(20), 2095-2104. [https://doi.org/10.1056/NEJMoa0708638](https://doi.org/10.1056/NEJMoa0708638)
- Yoshida, T., Amato, M. B. P., Grieco, D. L., Chen, L., Lima, C. A. S., Roldan, R., Morais, C. C. A., Gomes, S., Costa, E. L. V., Cardoso, P. F. G., Charbonney, E., Richard, J. M., Brochard, L., & Kavanagh, B. P. (2018). Esophageal manometry and regional transpulmonary pressure in lung injury. *American Journal of Respiratory and Critical Care Medicine, 197*(8), 1018-1026. [https://doi.org/10.1164/rccm.201709-1806OC](https://doi.org/10.1164/rccm.201709-1806OC)
