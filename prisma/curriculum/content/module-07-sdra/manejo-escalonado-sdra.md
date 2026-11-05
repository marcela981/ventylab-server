<!-- page: principios | THEORY | La lógica del manejo escalonado -->
<!-- block: INTRODUCTION | Por qué un manejo escalonado -->
No todos los pacientes con SDRA necesitan lo mismo. Algunas medidas se aplican a todos porque su beneficio es amplio y su riesgo bajo (la ventilación protectora); otras se reservan para formas más graves porque requieren personal, tiempo o conllevan riesgos (el decúbito prono, el bloqueo neuromuscular), y unas pocas se limitan a pacientes muy seleccionados en centros expertos (la ECMO). Escalar con criterio significa aplicar cada medida cuando su balance beneficio-riesgo es favorable y en el momento oportuno: llegar tarde al prono o a la ECMO reduce su beneficio, y adelantarse expone al paciente a riesgos innecesarios.

<!-- block: THEORY | Cómo leer una recomendación -->
Las guías actuales usan el sistema GRADE, que separa dos cosas:

- **Fuerza de la recomendación:** fuerte («recomendamos») cuando el panel está seguro de que el beneficio supera al riesgo para casi todos los pacientes; condicional o débil («sugerimos») cuando el balance depende del paciente, de los valores o de los recursos.
- **Certeza o nivel de la evidencia:** alta, moderada, baja o muy baja, según la calidad de los estudios.

Una recomendación puede ser fuerte con evidencia moderada, y un panel puede declarar que **no puede recomendar** a favor ni en contra cuando la evidencia muestra ausencia de efecto o es contradictoria. Leer ambos componentes evita convertir una sugerencia en una obligación.

<!-- block: THEORY | Qué dicen las guías -->
| Intervención | ATS (2017 y actualización 2024) | ESICM (2023) |
|---|---|---|
| Vt 4-8 mL/kg PBW y Pplat < 30 cmH₂O | Fuerte a favor, certeza moderada | Fuerte a favor del Vt bajo |
| PEEP más alta | Condicional a favor en moderado-grave, sin reclutamiento (2024) | Sin recomendación |
| Reclutamiento prolongado (≥ 35 cmH₂O, > 1 min) | Fuerte en contra (2024) | Fuerte en contra |
| Reclutamiento breve | Sin consenso (2024) | Débil en contra del uso rutinario |
| Prono | Fuerte a favor en grave, > 12 h/día | Fuerte a favor si PaO₂/FiO₂ < 150, sesiones ≥ 16 h |
| Bloqueo neuromuscular | Condicional a favor en grave temprano (2024) | Fuerte en contra de la infusión continua rutinaria |
| ECMO venovenosa | Condicional a favor en grave seleccionado (2024) | Fuerte a favor con criterios EOLIA en centro experto |
| HFOV | Fuerte en contra del uso rutinario | — |
| ECCO₂R | — | Fuerte en contra fuera de ensayos |

Fuentes: Fan et al. (2017), Qadir et al. (2024) y Grasselli et al. (2023).

![Escalera de cuatro peldaños: 1, todo SDRA, volumen corriente 4 a 8 mL/kg y meseta menor de 30; 2, moderado o grave, PEEP más alta y prono de 16 horas o más si PaO2/FiO2 menor de 150; 3, grave y temprano, bloqueo neuromuscular según ATS; 4, refractario, ECMO venovenosa en centro experto; a la izquierda, un recuadro con medidas a evitar](/learning/diagrams/a2-manejo-escalera.svg "Figura: escalera terapéutica del SDRA según gravedad y respuesta")

<!-- block: CALLOUT:warning | Las guías no siempre coinciden -->
Las diferencias de la tabla son reales y recientes. ATS y ESICM analizaron casi los mismos ensayos, pero los agruparon y ponderaron de forma distinta (por ejemplo, en la PEEP alta y en el bloqueo neuromuscular). Donde discrepan, la decisión es condicional por definición: valora la respuesta fisiológica de tu paciente y sigue el protocolo de tu unidad.

<!-- page: ventilacion-peep | THEORY | Peldaños 1 y 2: ventilación protectora, PEEP y reclutamiento -->
<!-- block: THEORY | La base para todos -->
Todo paciente con SDRA debe recibir un volumen corriente de 4 a 8 mL/kg de peso predicho con una presión meseta menor de 30 cmH₂O; es una recomendación fuerte de las dos guías (Fan et al., 2017; Grasselli et al., 2023; Qadir et al., 2024). Los cálculos se detallan en la lección «Ventilación protectora: volumen corriente, presión meseta y driving pressure».

<!-- block: THEORY | PEEP: más alta, ¿para quién? -->
La PEEP mantiene abiertas unidades que colapsarían en la espiración, mejora la oxigenación y puede reducir el atelectrauma. Pero en un pulmón poco reclutable solo añade presión a las regiones ya aireadas, que se sobredistienden, y puede reducir el retorno venoso.

- La actualización ATS de 2024 **sugiere** una PEEP más alta, sin maniobras de reclutamiento, en el SDRA moderado o grave (recomendación condicional, certeza baja a moderada); no hace recomendación en el leve (Qadir et al., 2024).
- La ESICM **no puede recomendar** a favor ni en contra de una PEEP más alta de rutina, ni de titularla por mecánica frente a tablas PEEP/FiO₂ (Grasselli et al., 2023).

La respuesta a la PEEP se evalúa en cada paciente. Una forma práctica es observar qué ocurre con la driving pressure y la compliance al cambiar la PEEP con el mismo volumen:

$$
\Delta P = P_{plat} - PEEP \qquad C_{rs} = \frac{V_T}{\Delta P}
$$

- Si al subir la PEEP la ΔP **baja** (la compliance sube), parte del pulmón se ha reclutado: el mismo volumen se reparte en más unidades.
- Si la ΔP **sube** (la compliance baja), predomina la sobredistensión.

<!-- block: THEORY | Ejemplo resuelto -->
Paciente con $V_T = 420\,\text{mL}$:

| PEEP (cmH₂O) | Pplat (cmH₂O) | ΔP (cmH₂O) | Crs (mL/cmH₂O) |
|---|---|---|---|
| 10 | 24 | 14 | 30,0 |
| 14 | 27 | 13 | 32,3 |
| 18 | 32 | 14 | 30,0 |

1. De 10 a 14 cmH₂O: la ΔP baja de 14 a 13 y la compliance sube de 30,0 a 32,3 mL/cmH₂O ($420/13$): hay reclutamiento.
2. De 14 a 18 cmH₂O: la ΔP vuelve a 14 y la meseta supera 30 cmH₂O: el beneficio desaparece y se excede el límite de meseta.
3. Conclusión: en este paciente, la PEEP de 14 cmH₂O ofrece la mejor combinación, siempre que la oxigenación y la hemodinamia lo confirmen.

<!-- block: THEORY | Maniobras de reclutamiento -->
El ensayo ART comparó, en 1010 pacientes con SDRA moderado o grave, una estrategia de reclutamiento con titulación de PEEP por la mejor compliance frente a una PEEP baja. La mortalidad a 28 días fue mayor con la estrategia de reclutamiento (55,3 % frente a 49,3 %), con más neumotórax que requirió drenaje (3,2 % frente a 1,2 %) y más barotrauma (5,6 % frente a 1,6 %) (Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial [ART] Investigators, 2017).

Con esta y otras evidencias, la ATS **recomienda en contra** de las maniobras prolongadas, definidas como PEEP ≥ 35 cmH₂O durante más de 60 segundos (fuerte, certeza moderada) (Qadir et al., 2024). La ESICM recomienda en contra de las maniobras prolongadas de alta presión (fuerte) y sugiere no usar de rutina las maniobras breves de alta presión (débil) (Grasselli et al., 2023). Es un cambio respecto de 2017, cuando la ATS había sugerido las maniobras de reclutamiento con baja confianza (Fan et al., 2017). La técnica y los métodos de titulación se desarrollan en el módulo «Reclutamiento alveolar y titulación de PEEP».

<!-- page: prono-bnm-ecmo | THEORY | Peldaños 2 a 4: prono, bloqueo neuromuscular y ECMO -->
<!-- block: THEORY | Decúbito prono -->
En el ensayo PROSEVA, 466 pacientes con SDRA grave (PaO₂/FiO₂ < 150 mmHg con FiO₂ ≥ 0,6, PEEP ≥ 5 cmH₂O y volumen cercano a 6 mL/kg PBW) se asignaron a sesiones de prono de al menos 16 horas o a supino. La mortalidad a 28 días fue del 16,0 % con prono frente al 32,8 % en supino, y a 90 días, del 23,6 % frente al 41,0 %, sin diferencias en complicaciones salvo más paros cardíacos en supino (Guérin et al., 2013).

- La ESICM recomienda el prono cuando la PaO₂/FiO₂ es < 150 mmHg con PEEP ≥ 5 cmH₂O, iniciado de forma temprana tras la estabilización y en sesiones de 16 horas consecutivas o más (fuerte, evidencia alta) (Grasselli et al., 2023).
- La ATS lo recomienda en el SDRA grave durante más de 12 horas al día (fuerte, certeza moderada) (Fan et al., 2017; Qadir et al., 2024).

El prono homogeneiza la distribución del stress y de la ventilación y mejora la relación ventilación-perfusión; su fisiología y técnica se tratan en el módulo «Ventilación en decúbito prono».

<!-- block: THEORY | Bloqueo neuromuscular -->
El ensayo ACURASYS administró cisatracurio durante 48 horas o placebo a 340 pacientes con SDRA grave temprano (PaO₂/FiO₂ < 150). El riesgo de muerte a 90 días ajustado fue menor con cisatracurio (hazard ratio 0,68), aunque la diferencia cruda (31,6 % frente a 40,7 %) no alcanzó significación, y no aumentó la paresia adquirida en la UCI (Papazian et al., 2010).

El ensayo ROSE incluyó 1006 pacientes con PaO₂/FiO₂ < 150 y PEEP ≥ 8 cmH₂O, todos con una estrategia de PEEP alta. Comparó 48 horas de cisatracurio con sedación profunda frente a una atención habitual con sedación ligera. Se detuvo por futilidad: la mortalidad a 90 días fue del 42,5 % frente al 42,8 %, y el grupo con bloqueo tuvo menos actividad física y más eventos cardiovasculares (National Heart, Lung, and Blood Institute PETAL Clinical Trials Network, 2019).

Las guías interpretan estos datos de forma distinta:

- **ATS 2024:** sugiere el bloqueo en el SDRA grave temprano (menos de 48 horas desde el inicio y PaO₂/FiO₂ ≤ 100 mmHg), idealmente durante un máximo de 48 horas, en pacientes con sedación profunda o con asincronía importante que no se corrige con ajustes (condicional, certeza baja) (Qadir et al., 2024).
- **ESICM 2023:** recomienda en contra de la infusión continua rutinaria (fuerte, evidencia moderada) (Grasselli et al., 2023).

<!-- block: THEORY | ECMO venovenosa -->
El ensayo EOLIA incluyó pacientes con SDRA muy grave: PaO₂/FiO₂ < 50 mmHg durante más de 3 horas, < 80 mmHg durante más de 6 horas, o pH < 7,25 con PaCO₂ ≥ 60 mmHg durante más de 6 horas. La mortalidad a 60 días fue del 35 % con ECMO inmediata frente al 46 % en el grupo control (riesgo relativo 0,76; p = 0,09), pero el 28 % del grupo control recibió ECMO de rescate, lo que dificulta la interpretación (Combes et al., 2018).

- La ESICM recomienda la ECMO en el SDRA grave que cumple criterios tipo EOLIA, en un centro que cumpla estándares organizativos (fuerte, evidencia moderada) (Grasselli et al., 2023).
- La ATS sugiere la ECMO en pacientes seleccionados con SDRA grave: causa reversible, PaO₂/FiO₂ < 80 mmHg o pH < 7,25 con PaCO₂ ≥ 60 mmHg pese al manejo óptimo, menos de 7 días de evolución y pocos factores de futilidad, después de aplicar ventilación protectora, PEEP, bloqueo y prono (condicional, certeza baja) (Qadir et al., 2024).

<!-- block: THEORY | Lo que no se recomienda y otras medidas -->
- **Ventilación oscilatoria de alta frecuencia (HFOV):** fuerte en contra de su uso rutinario en SDRA moderado o grave (Fan et al., 2017).
- **Extracción extracorpórea de CO₂ (ECCO₂R):** fuerte en contra fuera de ensayos clínicos (Grasselli et al., 2023).
- **Corticoides:** la ATS sugiere usarlos (condicional, certeza moderada), sin un régimen único, y advierte que iniciarlos más de 2 semanas después del comienzo del SDRA puede ser perjudicial (Qadir et al., 2024).

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 52 años, 165 cm (PBW 57,0 kg), con SDRA por neumonía por influenza, intubada hace 4 horas. VCV con 340 mL (6 mL/kg PBW), FR 26/min, PEEP 10 cmH₂O, FiO₂ 0,8. Pplat 26 cmH₂O. Gasometría: pH 7,29; PaCO₂ 55 mmHg; PaO₂ 72 mmHg.

**Hora 4. Clasifica y revisa la base.** $PaO_2/FiO_2 = 72/0{,}8 = 90\,\text{mmHg}$: SDRA grave según los criterios vistos en la lección «SDRA: definición, fisiopatología y gravedad». $\Delta P = 26 - 10 = 16\,\text{cmH}_2\text{O}$; $C_{rs} = 340/16 \approx 21\,\text{mL/cmH}_2\text{O}$. El volumen y la meseta cumplen la recomendación (Fan et al., 2017).

**Hora 5. Prueba de PEEP.** Subes a 14 cmH₂O: la Pplat pasa a 28 cmH₂O, la ΔP baja a 14 y la compliance sube a unos 24 mL/cmH₂O; la PaO₂ mejora a 88 mmHg con FiO₂ 0,8 ($PaO_2/FiO_2 = 110$). Hay respuesta: mantienes 14 cmH₂O, en línea con la sugerencia de PEEP más alta en SDRA moderado-grave (Qadir et al., 2024). No haces maniobras de reclutamiento prolongadas.

**Hora 8. Prono.** La PaO₂/FiO₂ sigue por debajo de 150 mmHg con PEEP ≥ 5: indicas prono en sesiones de 16 horas o más (Grasselli et al., 2023; Guérin et al., 2013).

**Hora 10. Asincronía.** Pese a una sedación adecuada aparecen dobles disparos con volúmenes de casi el doble del programado. La PaO₂/FiO₂ es 95 mmHg y llevas menos de 48 horas. La ATS sugiere considerar el bloqueo neuromuscular en esta situación (Qadir et al., 2024); la ESICM recomienda no usar infusiones continuas de rutina (Grasselli et al., 2023). Una opción razonable es una pauta limitada en el tiempo, dirigida a la asincronía, con reevaluación diaria.

**Hora 30. Evolución.** Si tras prono y optimización la PaO₂/FiO₂ cayera por debajo de 80 mmHg durante más de 6 horas, o el pH por debajo de 7,25 con PaCO₂ ≥ 60 mmHg, contactarías con un centro de ECMO (Combes et al., 2018; Qadir et al., 2024). En este caso, la oxigenación mejora en prono y no es necesario.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y prueba lo siguiente:

1. Con el volumen fijo en VCV, realiza una prueba de PEEP escalonada y anota en cada paso la meseta: calcula la ΔP y la compliance y busca el punto en que la ΔP es menor.
2. Observa el bucle presión-volumen: cuando la PEEP es excesiva, la curva se aplana al final de la inspiración (sobredistensión).
3. Vigila la presión arterial media al subir la PEEP: puede descender por la reducción del retorno venoso.

<!-- block: EXERCISE | Comprueba lo aprendido -->
**1.** Un paciente con SDRA leve (PaO₂/FiO₂ 240) ¿es candidato a PEEP alta según la ATS 2024?

*Respuesta:* No hay recomendación en el SDRA leve; la sugerencia de PEEP más alta se limita al moderado-grave (Qadir et al., 2024).

**2.** ¿Por qué el resultado de EOLIA no fue concluyente pese a una mortalidad 11 puntos menor?

*Respuesta:* Porque la diferencia no alcanzó significación estadística (p = 0,09) y el 28 % del grupo control recibió ECMO de rescate, lo que diluye la diferencia entre grupos (Combes et al., 2018).

**3.** Al subir la PEEP de 8 a 12 cmH₂O con 400 mL, la meseta pasa de 24 a 30 cmH₂O. ¿Qué interpretas?

*Respuesta:* La ΔP sube de 16 a 18 cmH₂O y la compliance baja de 25 a 22,2 mL/cmH₂O: predomina la sobredistensión. Vuelve a la PEEP previa.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La base de todo SDRA es Vt 4-8 mL/kg PBW con meseta < 30 cmH₂O, recomendación fuerte en ambas guías (Fan et al., 2017; Grasselli et al., 2023).
- La PEEP más alta es una sugerencia condicional de la ATS para el SDRA moderado-grave; la ESICM no se pronuncia: evalúa la respuesta individual con la ΔP (Qadir et al., 2024; Grasselli et al., 2023).
- Las maniobras de reclutamiento prolongadas de alta presión están desaconsejadas tras el ensayo ART (Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial [ART] Investigators, 2017; Qadir et al., 2024).
- El prono temprano y prolongado (≥ 16 h) en PaO₂/FiO₂ < 150 redujo la mortalidad en PROSEVA y tiene recomendación fuerte (Guérin et al., 2013; Grasselli et al., 2023).
- El bloqueo neuromuscular es controvertido: ATS lo sugiere en el grave temprano y ESICM recomienda en contra de la infusión rutinaria (Qadir et al., 2024; Grasselli et al., 2023).
- La ECMO venovenosa se reserva para el SDRA grave refractario seleccionado, en centros expertos (Combes et al., 2018; Grasselli et al., 2023).
- HFOV rutinaria y ECCO₂R fuera de ensayos no se recomiendan (Fan et al., 2017; Grasselli et al., 2023).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Escalar sin asegurar la base** → ninguna medida avanzada compensa un volumen excesivo → revisa primero PBW, volumen, meseta y ΔP.
- **Subir la PEEP sin medir sus efectos** → puede sobredistender y bajar la presión arterial → registra meseta, ΔP, oxigenación y hemodinamia en cada paso.
- **Realizar maniobras de reclutamiento prolongadas a alta presión** → aumentaron barotrauma y mortalidad en ART → evítalas.
- **Retrasar el prono hasta que fallen otras medidas** → el beneficio se demostró con aplicación temprana y sesiones largas → indícalo en cuanto la PaO₂/FiO₂ siga < 150 tras la estabilización.
- **Mantener el bloqueo neuromuscular por inercia** → aumenta inmovilidad y riesgo de debilidad → limita la duración y reevalúa a diario.
- **Consultar ECMO cuando ya hay disfunción multiorgánica avanzada** → el beneficio esperado se reduce → contacta pronto con el centro de referencia si el paciente se acerca a los criterios.

<!-- block: REFERENCES | Referencias -->
- Combes, A., Hajage, D., Capellier, G., Demoule, A., Lavoué, S., Guervilly, C., ... Mercat, A. (2018). Extracorporeal membrane oxygenation for severe acute respiratory distress syndrome. *New England Journal of Medicine, 378*(21), 1965-1975. [https://doi.org/10.1056/NEJMoa1800385](https://doi.org/10.1056/NEJMoa1800385)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Guérin, C., Reignier, J., Richard, J. C., Beuret, P., Gacouin, A., Boulain, T., ... Ayzac, L. (2013). Prone positioning in severe acute respiratory distress syndrome. *New England Journal of Medicine, 368*(23), 2159-2168. [https://doi.org/10.1056/NEJMoa1214103](https://doi.org/10.1056/NEJMoa1214103)
- National Heart, Lung, and Blood Institute PETAL Clinical Trials Network, Moss, M., Huang, D. T., Brower, R. G., Ferguson, N. D., Ginde, A. A., ... Angus, D. C. (2019). Early neuromuscular blockade in the acute respiratory distress syndrome. *New England Journal of Medicine, 380*(21), 1997-2008. [https://doi.org/10.1056/NEJMoa1901686](https://doi.org/10.1056/NEJMoa1901686)
- Papazian, L., Forel, J. M., Gacouin, A., Penot-Ragon, C., Perrin, G., Loundou, A., ... Roch, A. (2010). Neuromuscular blockers in early acute respiratory distress syndrome. *New England Journal of Medicine, 363*(12), 1107-1116. [https://doi.org/10.1056/NEJMoa1005372](https://doi.org/10.1056/NEJMoa1005372)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial (ART) Investigators, Cavalcanti, A. B., Suzumura, É. A., Laranjeira, L. N., Paisani, D. M., Damiani, L. P., ... Ribeiro de Carvalho, C. R. (2017). Effect of lung recruitment and titrated positive end-expiratory pressure (PEEP) vs low PEEP on mortality in patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 318*(14), 1335-1345. [https://doi.org/10.1001/jama.2017.14171](https://doi.org/10.1001/jama.2017.14171)
