<!-- page: fundamentos | THEORY | Fundamentos de la ventilación protectora -->
<!-- block: INTRODUCTION | Por qué importa -->
La ventilación protectora es una de las pocas intervenciones de la medicina intensiva que ha demostrado reducir la mortalidad en un ensayo grande. No consiste en un modo especial ni en un equipo costoso: consiste en programar un volumen corriente acorde con el tamaño del pulmón, vigilar la presión que alcanza el alvéolo y aceptar, cuando hace falta, valores de gases que antes se consideraban inaceptables. Aplicarla bien exige saber calcular, medir e interpretar tres magnitudes: el **volumen corriente por peso predicho**, la **presión meseta** y la **driving pressure**.

<!-- block: THEORY | El ensayo que cambió la práctica -->
Antes del año 2000 era habitual ventilar con 10 a 15 mL/kg de peso para normalizar la PaCO₂. La red ARDSNet comparó, en pacientes con lesión pulmonar aguda y SDRA, una estrategia tradicional (volumen inicial de 12 mL/kg de peso predicho y presión meseta de hasta 50 cmH₂O) con una estrategia de volumen bajo (6 mL/kg de peso predicho y meseta de hasta 30 cmH₂O). El ensayo se detuvo tras incluir 861 pacientes porque la mortalidad fue menor con volumen bajo: 31,0 % frente a 39,8 %. El grupo protector también tuvo más días sin ventilador en los primeros 28 días (Acute Respiratory Distress Syndrome Network, 2000).

Dos detalles de ese ensayo se olvidan con frecuencia:

- El volumen se calculó con el **peso corporal predicho** (PBW), que depende de la talla y el sexo, no del peso real.
- La presión meseta se midió con una pausa al final de la inspiración de 0,5 segundos (Acute Respiratory Distress Syndrome Network, 2000).

<!-- block: THEORY | Por qué el peso predicho y no el peso real -->
El tamaño de los pulmones depende de la talla y del sexo, no del tejido adiposo, del edema ni de la masa muscular. Un paciente de 160 cm y 110 kg tiene unos pulmones del tamaño correspondiente a 160 cm. Si calculas el volumen con el peso real, entregas un volumen excesivo justo a los pacientes con obesidad, en quienes la pared torácica y el abdomen ya reducen el volumen aireado. Por la misma razón, las personas de talla baja, y en particular las mujeres, son las que más se alejan del objetivo cuando el volumen se elige «a ojo».

<!-- block: THEORY | Presión pico, meseta y driving pressure -->
En VCV con flujo constante, la presión de la vía aérea tiene dos componentes: uno resistivo, que depende del flujo y de la resistencia del tubo y la vía aérea, y otro elástico, que depende del volumen y de la compliance. Al aplicar una pausa inspiratoria, el flujo se detiene, el componente resistivo desaparece y la presión cae a la **meseta**, que se aproxima a la presión alveolar al final de la inspiración.

- **Presión pico − presión meseta:** componente resistivo. Si sube, piensa en el tubo, las secreciones o el broncoespasmo.
- **Presión meseta:** presión alveolar al final de la inspiración; refleja el riesgo de sobredistensión.
- **Presión meseta − PEEP = driving pressure (ΔP):** presión necesaria para entregar el volumen corriente al pulmón disponible.

![Curvas de presión y flujo en el tiempo en VCV con pausa: la presión sube desde una PEEP de 10 hasta un pico de 30 cmH2O, cae a una meseta de 24 durante la pausa y vuelve a la PEEP; se señalan el componente resistivo de 6 y la driving pressure de 14 cmH2O; el flujo es cuadrado en la inspiración, cero en la pausa y exponencial negativo en la espiración](/learning/diagrams/a1-protectora-presiones-vcv.svg "Figura: lectura de presión pico, meseta, PEEP y driving pressure en VCV")

<!-- block: CALLOUT:info | La meseta solo es válida si el paciente está pasivo -->
Si el paciente hace esfuerzo durante la pausa, la presión no se estabiliza o se deforma y la medición no es fiable. Repite la maniobra con el paciente relajado y fíjate en que la meseta sea plana.

<!-- page: calculo | EXERCISE | Fórmulas y cálculo -->
<!-- block: THEORY | Peso corporal predicho -->
El protocolo de ARDSNet expresa el peso predicho en función de la talla en pulgadas (ARDS Network, 2008). Su equivalente con la talla en centímetros es:

$$
PBW_{\text{hombre}} = 50 + 0{,}91\,(\text{talla}_{cm} - 152{,}4)
$$

$$
PBW_{\text{mujer}} = 45{,}5 + 0{,}91\,(\text{talla}_{cm} - 152{,}4)
$$

- $PBW$: peso corporal predicho, en kg.
- $\text{talla}_{cm}$: talla medida, en cm (mídela o estímala con cuidado: un error de 10 cm cambia el volumen en unos 55 mL a 6 mL/kg).

<!-- block: THEORY | Volumen, compliance y driving pressure -->
$$
V_T = \text{mL/kg objetivo} \times PBW
$$

$$
C_{rs} = \frac{V_T}{P_{plat} - PEEP_{total}}
$$

$$
\Delta P = P_{plat} - PEEP_{total} = \frac{V_T}{C_{rs}}
$$

- $V_T$: volumen corriente, en mL.
- $C_{rs}$: compliance estática del sistema respiratorio, en mL/cmH₂O.
- $P_{plat}$: presión meseta, en cmH₂O.
- $PEEP_{total}$: PEEP programada más la auto-PEEP medida con pausa espiratoria, en cmH₂O.
- $\Delta P$: driving pressure, en cmH₂O.

La última igualdad es la más útil para razonar: la driving pressure es el volumen corriente dividido por la compliance, y como la compliance refleja el tamaño del pulmón aireado, la ΔP es en la práctica un volumen corriente «corregido» por el tamaño del pulmón (Amato et al., 2015).

<!-- block: THEORY | El protocolo paso a paso -->
El protocolo de la red ARDSNet (ARDS Network, 2008):

1. Calcula el PBW y empieza con 8 mL/kg PBW.
2. Reduce 1 mL/kg a intervalos de 2 horas o menos hasta llegar a 6 mL/kg PBW.
3. Programa una frecuencia que aproxime la ventilación minuto basal, sin superar 35/min.
4. Mide la meseta con pausa de 0,5 s al menos cada 4 horas y tras cada cambio de PEEP o de volumen.
5. Si la meseta supera 30 cmH₂O, reduce el volumen en pasos de 1 mL/kg hasta un mínimo de 4 mL/kg. Si es menor de 25 cmH₂O con un volumen menor de 6 mL/kg, súbelo en pasos de 1 mL/kg hasta que la meseta supere 25 cmH₂O o el volumen llegue a 6 mL/kg.
6. Mantén el pH entre 7,30 y 7,45: si está entre 7,15 y 7,30, aumenta la frecuencia (máximo 35/min); si queda por debajo de 7,15 con frecuencia 35, se permite aumentar el volumen aunque la meseta supere 30 cmH₂O.

![Diagrama de flujo del protocolo ARDSNet: calcular el peso predicho, iniciar con 8 mL/kg y bajar a 6, frecuencia hasta 35 por minuto, medir la meseta y ramificar según sea mayor de 30, menor o igual a 30, o menor de 25 con volumen menor de 6, y finalmente meta de pH entre 7,30 y 7,45](/learning/diagrams/a1-protectora-algoritmo-ardsnet.svg "Figura: algoritmo de ajuste de volumen y presión meseta del protocolo ARDSNet")

<!-- block: EXERCISE | Ejemplo resuelto -->
**Paciente:** hombre de 175 cm, 98 kg de peso real, con SDRA.

1. $PBW = 50 + 0{,}91\,(175 - 152{,}4) = 50 + 0{,}91 \times 22{,}6 = 50 + 20{,}6 = 70{,}6\,\text{kg}$.
2. A 6 mL/kg: $V_T = 6 \times 70{,}6 \approx 424\,\text{mL}$; programa unos 420 mL.
3. Con el peso real se habrían programado $6 \times 98 = 588\,\text{mL}$, es decir, $588/70{,}6 \approx 8{,}3\,\text{mL/kg PBW}$.
4. Con 420 mL mides Pplat 24 cmH₂O y PEEP 10 cmH₂O sin auto-PEEP: $\Delta P = 24 - 10 = 14\,\text{cmH}_2\text{O}$ y $C_{rs} = 420/14 = 30\,\text{mL/cmH}_2\text{O}$.
5. Si con 588 mL la compliance siguiera siendo 30 mL/cmH₂O, la ΔP sería $588/30 = 19{,}6\,\text{cmH}_2\text{O}$ y la meseta, $10 + 19{,}6 \approx 29{,}6\,\text{cmH}_2\text{O}$: casi en el límite, y con una ΔP mucho mayor.

**Mujer de 155 cm:** $PBW = 45{,}5 + 0{,}91 \times 2{,}6 = 45{,}5 + 2{,}4 = 47{,}9\,\text{kg}$; a 6 mL/kg, unos 290 mL.

<!-- page: driving-pressure-guias | THEORY | Driving pressure y recomendaciones actuales -->
<!-- block: INTRODUCTION | Más allá de la meseta -->
En el ensayo ARDSNet, 30 cmH₂O fue el límite superior permitido para el grupo protector, no un umbral de seguridad demostrado (Acute Respiratory Distress Syndrome Network, 2000): nada garantiza que una meseta de 28 cmH₂O sea inocua en un pulmón muy pequeño. Esto llevó a buscar una variable que reflejara mejor el estiramiento del pulmón disponible: la driving pressure.

<!-- block: THEORY | La evidencia sobre la driving pressure -->
Amato et al. (2015) analizaron datos individuales de 3562 pacientes con SDRA incluidos en nueve ensayos aleatorizados. Entre todas las variables del ventilador, la ΔP fue la que mejor se asoció con la supervivencia: cada aumento de una desviación estándar (unos 7 cmH₂O) se asoció con un riesgo relativo de muerte de 1,41, incluso en pacientes que ya recibían mesetas y volúmenes considerados protectores (riesgo relativo 1,36). Los cambios de volumen o de PEEP solo se asociaron con la supervivencia cuando reducían la ΔP.

Interpreta este resultado con prudencia:

- Es un **análisis de asociación** sobre ensayos que no aleatorizaron la ΔP. No demuestra que bajar la ΔP de forma dirigida reduzca la mortalidad.
- La ΔP solo es interpretable en pacientes **pasivos**; con esfuerzo inspiratorio la presión transpulmonar real es mayor.
- **No existe un umbral de ΔP validado** por un ensayo clínico. La guía de la ESICM de 2023 menciona la driving pressure como una línea de investigación futura, no como una meta con recomendación graduada (Grasselli et al., 2023).

<!-- block: THEORY | Qué recomiendan las guías -->
| Aspecto | ATS (2017, ratificado en 2024) | ESICM (2023) |
|---|---|---|
| Volumen corriente | 4-8 mL/kg PBW, recomendación fuerte, certeza moderada | 4-8 mL/kg PBW, recomendación fuerte |
| Presión meseta | < 30 cmH₂O, junto con el volumen | < 30 cmH₂O como opinión de expertos |
| Driving pressure | Sin recomendación | Sin recomendación; tema de investigación |

Fuentes: Qadir et al. (2024) y Grasselli et al. (2023).

La ESICM aclara que su recomendación fuerte para el volumen bajo se apoya en el juicio de expertos, porque el metaanálisis de los ensayos no mostró una reducción de mortalidad estadísticamente significativa de forma aislada (Grasselli et al., 2023). Es un ejemplo de cómo una recomendación puede ser fuerte aunque la estimación numérica tenga incertidumbre: el beneficio fisiológico es coherente y el riesgo de aplicarla es bajo.

<!-- block: THEORY | Hipercapnia permisiva -->
Reducir el volumen disminuye la ventilación alveolar y eleva la PaCO₂. El protocolo ARDSNet compensa primero con frecuencia (hasta 35/min) y tolera un pH de hasta 7,30 sin intervenir; por debajo de 7,15, prioriza corregir la acidemia aunque la meseta supere 30 cmH₂O (ARDS Network, 2008). Antes de subir el volumen, revisa el espacio muerto instrumental (filtros y conexiones entre la pieza en Y y el tubo) y la auto-PEEP que pueda generar una frecuencia alta.

<!-- block: CALLOUT:warning | Hipercapnia: no en todos -->
La hipercapnia aumenta la presión intracraneal y la resistencia vascular pulmonar. En pacientes con hipertensión intracraneal, disfunción grave del ventrículo derecho o acidosis metabólica grave, la tolerancia debe individualizarse con el equipo tratante.

<!-- page: pulmones-sanos | THEORY | Protección en pulmones sin SDRA -->
<!-- block: INTRODUCTION | ¿Solo para el SDRA? -->
Si el volumen alto lesiona un pulmón enfermo, cabe preguntarse si también daña un pulmón sano. La respuesta depende del contexto: en el quirófano y en la UCI la evidencia es diferente, y conviene conocer ambas.

<!-- block: THEORY | Anestesia y cirugía -->
En el ensayo IMPROVE, 400 adultos con riesgo intermedio o alto de complicaciones pulmonares sometidos a cirugía abdominal mayor se asignaron a ventilación no protectora o a una estrategia protectora completa, que combinaba volumen bajo, PEEP y maniobras de reclutamiento. El desenlace compuesto de complicaciones mayores pulmonares y extrapulmonares en 7 días ocurrió en el 10,5 % del grupo protector frente al 27,5 % del no protector (riesgo relativo 0,40), con menos necesidad de VNI o intubación por insuficiencia respiratoria y estancia hospitalaria más corta (Futier et al., 2013).

Una conferencia de consenso internacional para el paciente quirúrgico recomienda programar inicialmente 6-8 mL/kg PBW con PEEP de 5 cmH₂O, individualizar después la PEEP y, si se realizan maniobras de reclutamiento, usar la menor presión eficaz y el menor tiempo o número de ciclos eficaz (Young et al., 2019).

<!-- block: THEORY | Pacientes de UCI sin SDRA -->
En el ensayo PReVENT, 961 pacientes de UCI sin SDRA y con ventilación prevista de más de 24 horas se asignaron a una estrategia de volumen bajo o a una de volumen intermedio. No hubo diferencia en los días libres de ventilador a los 28 días (mediana de 21 en ambos grupos), ni en mortalidad, estancia o aparición de SDRA, neumonía, atelectasia grave o neumotórax (Writing Group for the PReVENT Investigators, 2018).

¿Cómo conciliar ambos resultados? En el quirófano se comparó contra volúmenes altos sin PEEP, una práctica claramente no protectora; en PReVENT se comparó contra volúmenes intermedios, ya dentro del rango que hoy se usa. Una lectura razonable es que en el pulmón sano conviene evitar volúmenes altos y basar el cálculo en el PBW, sin que sea necesario forzar volúmenes muy bajos que puedan aumentar la asincronía o la necesidad de sedación.

<!-- block: CALLOUT:info | Lo que comparten todos los contextos -->
En cualquier paciente ventilado: calcula el volumen con el peso predicho, mide la meseta, calcula la ΔP y observa su tendencia. Un aumento de la ΔP con el mismo volumen significa que el pulmón disponible se está reduciendo (colapso, edema, neumotórax o intubación selectiva) y obliga a buscar la causa.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 64 años, 158 cm, 92 kg, con SDRA por sepsis de origen urinario, intubada hace 2 horas. Programación en VCV: 550 mL, FR 16/min, PEEP 8 cmH₂O, FiO₂ 0,8. Mediciones: Ppico 35 cmH₂O, Pplat 32 cmH₂O, sin auto-PEEP. Gasometría: pH 7,34; PaCO₂ 44 mmHg.

**Paso 1. Peso predicho.** $PBW = 45{,}5 + 0{,}91\,(158 - 152{,}4) = 45{,}5 + 5{,}1 = 50{,}6\,\text{kg}$.

**Paso 2. Volumen actual por kg.** $550 / 50{,}6 \approx 10{,}9\,\text{mL/kg PBW}$: casi el doble del objetivo de 6 mL/kg (Acute Respiratory Distress Syndrome Network, 2000).

**Paso 3. Mecánica.** $\Delta P = 32 - 8 = 24\,\text{cmH}_2\text{O}$; $C_{rs} = 550/24 \approx 23\,\text{mL/cmH}_2\text{O}$. Ppico − Pplat = 3 cmH₂O: el componente resistivo es pequeño, el problema es elástico.

**Paso 4. Ajuste según el protocolo.** Siguiendo el protocolo de ARDSNet, empezarías en 8 mL/kg (unos 405 mL) y bajarías 1 mL/kg cada 2 horas o menos hasta 6 mL/kg, unos 300 mL (ARDS Network, 2008). Con la compliance de 23 mL/cmH₂O, 300 mL producirían una ΔP de unos 13 cmH₂O y una meseta de unos 21 cmH₂O.

**Paso 5. Compensar la ventilación.** Pasar de 550 a 300 mL reduce mucho la ventilación minuto. Aumenta la frecuencia de forma progresiva (sin superar 35/min) y acepta una PaCO₂ más alta mientras el pH se mantenga en 7,30 o más (ARDS Network, 2008). Comprueba en la curva de flujo que la espiración termina antes del siguiente ciclo.

**Paso 6. Reevaluar.** Repite meseta, ΔP y gasometría tras cada cambio. Si la ΔP sube sin cambiar el volumen, busca una causa (atelectasia, neumotórax, desplazamiento del tubo).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA por sepsis»](/simulador?tab=simular&case=july-sdra-sepsis) y prueba lo siguiente:

1. Calcula el PBW del paciente del caso y programa el volumen a 6 mL/kg en VCV con pausa inspiratoria: observa que la presión meseta y la driving pressure bajan respecto de un volumen mayor.
2. Sube la frecuencia para compensar y observa la curva de flujo: si el flujo espiratorio no llega a cero antes del siguiente ciclo, estás generando auto-PEEP.
3. Sigue la evolución de la PaCO₂ y del pH en el monitor y decide si la hipercapnia es tolerable según la meta de pH.

<!-- block: EXERCISE | Comprueba lo aprendido -->
**1.** Hombre de 182 cm. Calcula el PBW y el volumen a 6 mL/kg.

*Respuesta:* $50 + 0{,}91 \times 29{,}6 = 50 + 26{,}9 = 76{,}9\,\text{kg}$; $6 \times 76{,}9 \approx 461\,\text{mL}$.

**2.** Con 400 mL, Pplat 27 y PEEP 12 cmH₂O, ¿cuál es la ΔP y la compliance?

*Respuesta:* $\Delta P = 15\,\text{cmH}_2\text{O}$; $C_{rs} = 400/15 \approx 26{,}7\,\text{mL/cmH}_2\text{O}$.

**3.** Un paciente con 6 mL/kg tiene meseta de 33 cmH₂O. ¿Qué indica el protocolo?

*Respuesta:* Reducir el volumen en pasos de 1 mL/kg, hasta un mínimo de 4 mL/kg, y compensar con frecuencia vigilando el pH (ARDS Network, 2008).

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Limitar el volumen a 6 mL/kg PBW y la meseta a 30 cmH₂O redujo la mortalidad del SDRA del 39,8 % al 31,0 % en el ensayo ARDSNet (Acute Respiratory Distress Syndrome Network, 2000).
- Calcula siempre el volumen con el peso predicho por talla y sexo; el peso real sobreestima el tamaño del pulmón.
- Las guías actuales recomiendan 4-8 mL/kg PBW y meseta < 30 cmH₂O en todo SDRA (Qadir et al., 2024; Grasselli et al., 2023).
- La ΔP (Pplat − PEEP = Vt/Crs) es la variable del ventilador más asociada con la supervivencia, pero no tiene un umbral validado por ensayos (Amato et al., 2015).
- La meseta de 30 cmH₂O es el límite superior usado en el ensayo, no un umbral de seguridad demostrado (Acute Respiratory Distress Syndrome Network, 2000).
- La hipercapnia permisiva es parte de la estrategia: el protocolo tolera pH ≥ 7,30 y frecuencia hasta 35/min (ARDS Network, 2008).
- En cirugía de riesgo, una estrategia protectora reduce complicaciones (Futier et al., 2013); en UCI sin SDRA, volumen bajo e intermedio dieron resultados similares (Writing Group for the PReVENT Investigators, 2018).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Usar el peso real** → sobredosifica el volumen en obesidad y en tallas bajas → calcula el PBW con la talla medida.
- **Vigilar solo la presión pico** → incluye el componente resistivo y no refleja la presión alveolar → mide la meseta con pausa de 0,5 s y calcula la ΔP.
- **Medir la meseta con el paciente activo** → el esfuerzo la falsea → repite la maniobra con el paciente pasivo y comprueba que la meseta sea plana.
- **Subir el volumen para corregir la PaCO₂ sin revisar la frecuencia** → aumenta el strain → primero ajusta la frecuencia y el espacio muerto instrumental, dentro de la meta de pH.
- **Tratar 30 cmH₂O como un objetivo** → es un límite superior, no una meta → busca la menor meseta y ΔP compatibles con el intercambio de gases.
- **Olvidar la auto-PEEP al calcular la ΔP** → subestima la PEEP total y sobreestima la ΔP → mide la PEEP total con pausa espiratoria.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network, Brower, R. G., Matthay, M. A., Morris, A., Schoenfeld, D., Thompson, B. T., & Wheeler, A. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- ARDS Network. (2008). *NIH NHLBI ARDS Clinical Network mechanical ventilation protocol summary*. National Heart, Lung, and Blood Institute. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Amato, M. B., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J. C., Carvalho, C. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Futier, E., Constantin, J. M., Paugam-Burtz, C., Pascal, J., Eurin, M., Neuschwander, A., ... Jaber, S. (2013). A trial of intraoperative low-tidal-volume ventilation in abdominal surgery. *New England Journal of Medicine, 369*(5), 428-437. [https://doi.org/10.1056/NEJMoa1301082](https://doi.org/10.1056/NEJMoa1301082)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Writing Group for the PReVENT Investigators, Simonis, F. D., Serpa Neto, A., Binnekade, J. M., Braber, A., Bruin, K. C. M., ... Schultz, M. J. (2018). Effect of a low vs intermediate tidal volume strategy on ventilator-free days in intensive care unit patients without ARDS: A randomized clinical trial. *JAMA, 320*(18), 1872-1880. [https://doi.org/10.1001/jama.2018.14280](https://doi.org/10.1001/jama.2018.14280)
- Young, C. C., Harris, E. M., Vacchiano, C., Bodnar, S., Bukowy, B., Elliott, R. R. D., ... Sprung, J. (2019). Lung-protective ventilation for the surgical patient: International expert panel-based consensus recommendations. *British Journal of Anaesthesia, 123*(6), 898-913. [https://doi.org/10.1016/j.bja.2019.08.017](https://doi.org/10.1016/j.bja.2019.08.017)
