<!-- page: ingreso-intubacion | CASE_STUDY | Etapa 1: ingreso, diagnóstico y ventilación inicial -->
<!-- block: INTRODUCTION | Cómo usar este caso -->
Este caso integra lo que estudiaste en el nivel avanzado: ventilación protectora, SDRA, PEEP, prono y destete. Está dividido en cuatro etapas. En cada una encontrarás los datos del paciente, una pregunta de decisión ("¿qué harías?") y la respuesta razonada. Intenta responder antes de leer la solución: el valor del caso está en justificar cada decisión con fisiología y evidencia, no en memorizar números.

![Línea de tiempo con cuatro etapas del caso: ingreso con PaO2/FiO2 de 90 y ventilación a 6 mL/kg de peso predicho; primeras horas con PaO2/FiO2 de 110 y prono de al menos 16 horas; día 2 con PaO2/FiO2 de 210 en supino y descenso de FiO2 y PEEP; destete con PaO2/FiO2 de 260, prueba de ventilación espontánea de 30 minutos con presión de soporte y extubación](/learning/diagrams/a10-sdra-linea-tiempo.svg "Figura: evolución por etapas del caso")

<!-- block: CASE_STUDY | Ejemplo clínico: presentación -->
**Paciente (ficticio):** hombre de 46 años, talla 175 cm, peso 80 kg, sin enfermedades previas relevantes. Cuatro días de fiebre y tos; ingresa con neumonía neumocócica multilobar.

**En urgencias:** frecuencia respiratoria 38/min, uso de músculos accesorios, SpO₂ 86 % con cánula nasal de alto flujo a 60 L/min y FiO₂ 0,8. La ecografía y la radiografía muestran consolidaciones e infiltrados bilaterales no explicados por insuficiencia cardiaca (ecocardiograma con función ventricular normal). Lactato normal, PAM 75 mmHg.

**Decisión de intubar:** persiste el trabajo respiratorio excesivo y la hipoxemia pese al alto flujo. Se intuba con secuencia rápida.

**Primera gasometría en VCV** (Vt 500 mL, PEEP 8, FiO₂ 1,0, FR 20): pH 7,29, PaCO₂ 52 mmHg, PaO₂ 90 mmHg.

<!-- block: EQUATION | Peso corporal predicho (hombre) -->
PBW = 50 + 0{,}91\,(T_{\text{cm}} - 152{,}4)

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Cumple criterios de SDRA? ¿Con qué definición?
2. Calcula el PBW y el volumen corriente inicial adecuado.
3. ¿Qué metas de oxigenación y de presión te fijas?

<!-- block: THEORY | Respuesta razonada -->
**1. Diagnóstico.** Hay un desencadenante conocido (neumonía), inicio en menos de una semana, opacidades bilaterales y edema no explicado por causa cardiaca. La oxigenación: $PaO_2/FiO_2 = 90/1{,}0 = 90\,\text{mmHg}$ con PEEP ≥ 5 cmH₂O.

- Con la definición de Berlín (2012) sería un SDRA grave una vez intubado.
- La **definición global** propuesta en 2024 amplía el criterio: permite diagnosticar SDRA ya en urgencias en pacientes con alto flujo de al menos 30 L/min, acepta PaO₂/FiO₂ ≤ 300 mmHg o SpO₂/FiO₂ ≤ 315 cuando la SpO₂ es ≤ 97 %, y admite la ecografía como técnica de imagen (Matthay et al., 2024). Con ella, este paciente ya tenía SDRA antes de la intubación: $SpO_2/FiO_2 = 86/0{,}8 \approx 108$.
- La guía de la ESICM de 2023 trabaja aún con Berlín y analiza estas propuestas sin adoptarlas formalmente (Grasselli et al., 2023): es un campo en transición, y conviene que sepas reconocer ambas.

**2. Volumen corriente.** $PBW = 50 + 0{,}91 \times (175 - 152{,}4) = 50 + 20{,}6 = 70{,}6\,\text{kg}$. Los 500 mL programados equivalen a 7,1 mL/kg PBW. El objetivo inicial es $6\,\text{mL/kg} \times 70{,}6 \approx 424\,\text{mL}$, que redondeas a 420 mL (ARDS Network, 2000). Las guías recomiendan volúmenes de 4-8 mL/kg PBW como recomendación fuerte (Grasselli et al., 2023).

**3. Metas.** Presión meseta ≤ 30 cmH₂O y metas de oxigenación de PaO₂ 55-80 mmHg o SpO₂ 88-95 %, como en el protocolo ARDSNet (ARDS Network, 2000). Para compensar la reducción del Vt sube la frecuencia; acepta una PaCO₂ algo mayor si el pH es tolerable (hipercapnia permisiva), porque el objetivo prioritario es no lesionar el pulmón.

**Nuevos ajustes:** VCV, Vt 420 mL, FR 26/min, PEEP 10, FiO₂ 1,0. Pausa inspiratoria: Pplat 28 cmH₂O. Prepara la siguiente etapa calculando la driving pressure.

<!-- page: primeras-horas | CASE_STUDY | Etapa 2: primeras horas, driving pressure, PEEP y prono -->
<!-- block: CASE_STUDY | Ejemplo clínico: evolución en las primeras 6 horas -->
Con Vt 420 mL, PEEP 10, Pplat 28 cmH₂O, FiO₂ 0,9: PaO₂ 81 mmHg, PaCO₂ 55 mmHg, pH 7,27. PAM 70 mmHg con noradrenalina a dosis baja. El paciente está sedado y adaptado, sin esfuerzos visibles en las curvas.

<!-- block: EQUATION | Driving pressure y compliance -->
\Delta P = P_{plat} - PEEP_{total} = \frac{V_T}{C_{rs}}

<!-- block: EXERCISE | ¿Qué harías? -->
1. Calcula la ΔP y la compliance. ¿Te preocupa la ΔP aunque la Pplat sea menor de 30?
2. ¿Subirías la PEEP? ¿Harías una maniobra de reclutamiento?
3. Tras los ajustes, la PaO₂/FiO₂ sigue en 110 mmHg. ¿Cuál es el siguiente paso con mayor evidencia?

<!-- block: THEORY | Respuesta razonada -->
**1. Driving pressure.** $\Delta P = 28 - 10 = 18\,\text{cmH}_2\text{O}$ (comprueba con pausa espiratoria que no haya auto-PEEP) y $C_{rs} = 420/18 \approx 23\,\text{mL/cmH}_2\text{O}$. En el análisis de 3562 pacientes de nueve ensayos, la ΔP fue la variable ventilatoria más asociada a la supervivencia: cada aumento de una desviación estándar (unos 7 cmH₂O) se asoció a un riesgo relativo de muerte de 1,41, incluso en pacientes con Pplat y Vt "protectores" (Amato et al., 2015). Es un estudio de asociación, no un ensayo que pruebe una meta concreta, pero justifica intentar bajar la ΔP.

Opciones: reducir el Vt a 360 mL (5,1 mL/kg PBW, dentro del rango 4-8 que recomiendan las guías) compensando con FR 32/min, y observar la respuesta a la PEEP.

**2. PEEP y reclutamiento.** Aquí la evidencia está dividida, y conviene que lo sepas:

- La guía ESICM 2023 **no hace recomendación** a favor ni en contra de una estrategia de PEEP alta frente a baja, ni de titular la PEEP principalmente por mecánica (Grasselli et al., 2023).
- La actualización de la ATS de 2024 **sugiere** PEEP más alta sin maniobras de reclutamiento en el SDRA moderado a grave (recomendación condicional, certeza baja a moderada) (Qadir et al., 2024).
- Ambas coinciden en **no** usar maniobras de reclutamiento prolongadas a alta presión: la ESICM las define como al menos 35 cmH₂O mantenidos al menos un minuto y recomienda en contra con fuerza (Grasselli et al., 2023); la ATS también recomienda fuertemente en contra (Qadir et al., 2024).

Decisión del equipo: prueba de PEEP 14 con Vt 360 mL. Resultado: Pplat 29, $\Delta P = 15\,\text{cmH}_2\text{O}$, $C_{rs} = 360/15 = 24\,\text{mL/cmH}_2\text{O}$; la compliance no empeoró y la ΔP bajó, PAM estable. PaO₂ 88 mmHg con FiO₂ 0,8: $PaO_2/FiO_2 = 110\,\text{mmHg}$. PaCO₂ 60 mmHg, pH 7,24.

**3. Prono.** Con PaO₂/FiO₂ < 150 mmHg pese a ventilación optimizada, la guía ESICM recomienda con fuerza el decúbito prono precoz, en sesiones de 16 horas consecutivas o más (Grasselli et al., 2023). En el ensayo PROSEVA, con sesiones de al menos 16 horas en SDRA grave (PaO₂/FiO₂ < 150 mmHg con FiO₂ ≥ 0,6 y PEEP ≥ 5), la mortalidad a 28 días fue del 16,0 % frente al 32,8 % en supino (Guérin et al., 2013).

**Otras medidas que debes conocer:**

- **Bloqueo neuromuscular:** la ESICM recomienda en contra de la infusión continua rutinaria en el SDRA moderado-grave no COVID (Grasselli et al., 2023), mientras que la ATS sugiere usarlo en el SDRA grave precoz (condicional, certeza baja) (Qadir et al., 2024). Ante asincronías graves o un esfuerzo inspiratorio intenso que no se controla con sedación, se plantea caso a caso.
- **Corticoides:** la ATS sugiere usarlos en el SDRA (condicional, certeza moderada) (Qadir et al., 2024).
- **ECMO:** si a pesar de todo el paciente progresa a hipoxemia o hipercapnia refractarias, se considera en centros con experiencia; las dos guías la apoyan en casos seleccionados de SDRA grave (Grasselli et al., 2023; Qadir et al., 2024).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y luego [«SDRA por sepsis»](/simulador?tab=simular&case=july-sdra-sepsis):

1. Calcula el Vt por peso predicho y programa VCV; mide la presión meseta con la pausa inspiratoria y calcula la driving pressure.
2. Sube la PEEP en un paso de 2-4 cmH₂O: si la compliance mejora, la driving pressure baja; si empeora, la presión meseta sube sin ganar volumen.
3. Reduce el Vt y aumenta la frecuencia: observa cómo sube la PaCO₂ y baja el pH en la gasometría y decide si es tolerable.
4. Si no corriges la hipoxemia, observa cómo el paciente se deteriora con el tiempo.

<!-- page: dia-2 | CASE_STUDY | Etapa 3: día 2, vuelta a supino y reducción del soporte -->
<!-- block: CASE_STUDY | Ejemplo clínico: tras dos sesiones de prono -->
Tras dos sesiones de prono de 17 horas, el paciente permanece en supino desde hace 6 horas. Con Vt 360 mL, PEEP 12, FiO₂ 0,5: PaO₂ 105 mmHg, PaCO₂ 50 mmHg, pH 7,33. Pplat 24 cmH₂O. Fiebre en descenso, noradrenalina retirada. Se reduce la sedación y aparecen esfuerzos que disparan el ventilador.

<!-- block: EXERCISE | ¿Qué harías? -->
1. Calcula PaO₂/FiO₂, ΔP y compliance. ¿Qué significan los cambios respecto a la etapa 2?
2. ¿Qué reduces primero, la FiO₂ o la PEEP? ¿Por qué?
3. El paciente empieza a respirar. ¿Qué vigilas al pasar a un modo asistido?

<!-- block: THEORY | Respuesta razonada -->
**1. Cálculos.** $PaO_2/FiO_2 = 105/0{,}5 = 210\,\text{mmHg}$; $\Delta P = 24 - 12 = 12\,\text{cmH}_2\text{O}$; $C_{rs} = 360/12 = 30\,\text{mL/cmH}_2\text{O}$. La compliance pasó de 24 a 30 mL/cmH₂O: hay más pulmón aireado disponible para el mismo volumen. Esa es la razón fisiológica por la que puedes volver a 6 mL/kg PBW (420 mL), con una ΔP esperada de $420/30 = 14\,\text{cmH}_2\text{O}$, y reducir la frecuencia.

**2. Orden del descenso.** Primero la FiO₂, hasta valores que reduzcan el riesgo de toxicidad por oxígeno manteniendo las metas de oxigenación (PaO₂ 55-80 mmHg o SpO₂ 88-95 %) (ARDS Network, 2000). Después, la PEEP en pasos pequeños, comprobando tras cada paso que la oxigenación y la compliance se mantienen: una caída brusca de PEEP en un pulmón todavía reclutable provoca desreclutamiento rápido, que luego cuesta horas recuperar.

**3. Transición a modo asistido.** Cuando el paciente dispara, el volumen corriente ya no lo decide solo el ventilador: un esfuerzo intenso puede generar presiones transpulmonares altas aunque la presión de la vía aérea parezca baja. Vigila:

- El volumen corriente espirado real (no solo el programado) y la frecuencia.
- Las curvas: doble disparo, esfuerzos ineficaces o caída de la presión al inicio de la inspiración por esfuerzo intenso.
- La oclusión espiratoria o inspiratoria breve, si tu ventilador lo permite, para estimar el esfuerzo.

Si aparecen esfuerzos excesivos, ajusta la sedación y la analgesia antes de aceptar volúmenes grandes. Las asincronías complejas se estudian en su propio módulo.

**Ajustes al final del día 2:** PSV 12 cmH₂O, PEEP 10, FiO₂ 0,45. Vte 430-480 mL, FR 22/min, curvas sin asincronías relevantes.

<!-- block: CALLOUT:info | Por qué el prono ayuda aunque luego vuelvas a supino -->
En prono, el peso del corazón y del contenido abdominal deja de comprimir las regiones dorsales, que son las más extensas, y la distribución del estrés pulmonar se vuelve más homogénea. El beneficio se mide en desenlaces (Guérin et al., 2013), no solo en la oxigenación del momento: por eso no basta con que la PaO₂ suba durante la sesión, sino que se mantiene el prono mientras persiste el criterio de gravedad.

<!-- page: destete-extubacion | CASE_STUDY | Etapa 4: preparación para el destete y extubación -->
<!-- block: CASE_STUDY | Ejemplo clínico: día 5 -->
Día 5. Despierto, obedece órdenes, tos eficaz, secreciones moderadas. Sin vasopresores. PSV 8 cmH₂O, PEEP 6, FiO₂ 0,35: PaO₂ 91 mmHg, PaCO₂ 42 mmHg, pH 7,40. FR 24/min, Vte 400 mL.

<!-- block: EQUATION | Índice de respiración rápida y superficial -->
f/V_T = \frac{\text{FR}\ (\text{resp/min})}{V_T\ (\text{L})}

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Está preparado para una prueba de ventilación espontánea (PVE)?
2. ¿Qué tipo de PVE eliges y cuánto dura?
3. Supera la prueba. ¿Qué soporte planificas tras la extubación?

<!-- block: THEORY | Respuesta razonada -->
**1. Preparación.** La causa (neumonía) está en resolución, $PaO_2/FiO_2 = 91/0{,}35 = 260\,\text{mmHg}$ con PEEP baja, hemodinamia estable sin vasopresores, despierto y con tos eficaz. $f/V_T = 24/0{,}40 = 60\,\text{resp/min/L}$: no hay patrón de respiración rápida y superficial. Las guías de liberación de la ventilación recomiendan además protocolos que minimicen la sedación en pacientes ventilados más de 24 horas, que es lo que permitió llegar a este punto (Ouellette et al., 2017).

**2. Tipo de prueba.** La guía CHEST/ATS sugiere que la PVE inicial se haga con aumento de presión inspiratoria (presión de soporte o CPAP) en lugar de tubo en T (Ouellette et al., 2017). En un ensayo con 1153 pacientes, una PVE de 30 minutos con presión de soporte de 8 cmH₂O logró más extubaciones exitosas que una PVE de 2 horas con tubo en T (82,3 % frente a 74,0 %), sin diferencia en la tasa de reintubación (Subirà et al., 2019). Durante la prueba vigila frecuencia, SpO₂, trabajo respiratorio, frecuencia cardiaca, presión arterial y estado de conciencia. Antes de extubar, valora también la vía aérea: capacidad de toser con fuerza, cantidad de secreciones y nivel de alerta suficiente para protegerla. Una prueba superada con secreciones abundantes y tos débil sigue siendo una extubación de riesgo.

**3. Tras la extubación.** Ha estado ventilado más de 24 horas. Si cumple los criterios de alto riesgo de fracaso de tu protocolo, la guía CHEST/ATS recomienda con fuerza la VNI preventiva inmediatamente después de la extubación (Ouellette et al., 2017). Si no es de alto riesgo, planifica oxigenoterapia con metas claras, fisioterapia respiratoria, movilización precoz y reevaluación frecuente. Define de antemano los criterios de fracaso para no retrasar una reintubación necesaria.

<!-- block: CALLOUT:info | Más allá de la UCI -->
Tras una ventilación prolongada por SDRA son frecuentes la debilidad adquirida en la UCI, el delirium y las secuelas psicológicas. La planificación del alta incluye rehabilitación física, valoración cognitiva y emocional y seguimiento: proteger el pulmón es solo una parte de proteger al paciente.

<!-- page: sintesis | THEORY | Síntesis del caso -->
<!-- block: SUMMARY | Puntos clave -->
- La definición global de SDRA de 2024 permite el diagnóstico con alto flujo ≥ 30 L/min, con SpO₂/FiO₂ y con ecografía; la guía ESICM 2023 aún trabaja con Berlín (Matthay et al., 2024; Grasselli et al., 2023).
- El Vt se calcula con el peso predicho: 6 mL/kg como punto de partida, dentro del rango 4-8 mL/kg, con Pplat ≤ 30 cmH₂O (ARDS Network, 2000; Grasselli et al., 2023).
- La driving pressure es la variable ventilatoria más asociada a la supervivencia; intentar reducirla ajustando Vt y PEEP es razonable (Amato et al., 2015).
- PEEP alta frente a baja: la ESICM no recomienda ninguna estrategia y la ATS sugiere PEEP más alta sin reclutamiento; ambas desaconsejan las maniobras de reclutamiento prolongadas (Grasselli et al., 2023; Qadir et al., 2024).
- Con PaO₂/FiO₂ < 150 mmHg, el prono precoz en sesiones de 16 h o más reduce la mortalidad (Guérin et al., 2013; Grasselli et al., 2023).
- Al mejorar la compliance, primero se reduce la FiO₂ y luego la PEEP, en pasos pequeños; en modo asistido hay que vigilar los esfuerzos intensos.
- La PVE inicial con presión de soporte, los protocolos de sedación mínima y la VNI preventiva en pacientes de alto riesgo forman la estrategia de liberación (Ouellette et al., 2017; Subirà et al., 2019).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Programar el Vt con el peso real o "a ojo"** → sobredistensión en pacientes altos o con obesidad → calcula el PBW con la talla medida.
- **Darse por satisfecho con una Pplat < 30 cmH₂O** → la ΔP puede seguir siendo alta si la compliance es baja → calcula siempre la ΔP y busca reducirla.
- **Hacer maniobras de reclutamiento prolongadas para "abrir" el pulmón** → aumentan el riesgo sin beneficio demostrado → evítalas; ajusta la PEEP según la respuesta de la mecánica y la hemodinamia.
- **Retrasar el prono hasta agotar otras medidas** → el beneficio se demostró con aplicación precoz → indícalo cuando la PaO₂/FiO₂ siga < 150 mmHg tras optimizar la ventilación.
- **Extubar sin plan para las siguientes 48 horas** → fracaso no anticipado y reintubación tardía → define riesgo, soporte (VNI preventiva si alto riesgo) y criterios de fracaso.

<!-- block: REFERENCES | Referencias -->
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Guérin, C., Reignier, J., Richard, J.-C., Beuret, P., Gacouin, A., Boulain, T., Mercier, E., Badet, M., Mercat, A., Baudin, O., Clavel, M., Chatellier, D., Jaber, S., Rosselli, S., Mancebo, J., Sirodot, M., Hilbert, G., Bengler, C., Richecoeur, J., ... Ayzac, L. (2013). Prone positioning in severe acute respiratory distress syndrome. *New England Journal of Medicine, 368*(23), 2159-2168. [https://doi.org/10.1056/NEJMoa1214103](https://doi.org/10.1056/NEJMoa1214103)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., Calfee, C. S., Combes, A., Daniel, B. M., Ferguson, N. D., Gong, M. N., Gotts, J. E., Herridge, M. S., Laffey, J. G., Liu, K. D., Machado, F. R., Martin, T. R., McAuley, D. F., Mercat, A., ... Wick, K. D. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37-47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- Ouellette, D. R., Patel, S., Girard, T. D., Morris, P. E., Schmidt, G. A., Truwit, J. D., Alhazzani, W., Burns, S. M., Epstein, S. K., Esteban, A., Fan, E., Ferrer, M., Fraser, G. L., Gong, M. N., Hough, C. L., Mehta, S., Nanchal, R., Pawlik, A. J., Schweickert, W. D., ... Kress, J. P. (2017). Liberation from mechanical ventilation in critically ill adults: An official American College of Chest Physicians/American Thoracic Society clinical practice guideline. *Chest, 151*(1), 166-180. [https://doi.org/10.1016/j.chest.2016.10.036](https://doi.org/10.1016/j.chest.2016.10.036)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., Bellani, G., Brower, R. G., Burry, L., Chen, J. T., Hodgson, C., Hough, C. L., Lamontagne, F., Law, A., Papazian, L., Pham, T., Rubin, E., Siuba, M., Telias, I., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Subirà, C., Hernández, G., Vázquez, A., Rodríguez-García, R., González-Castro, A., García, C., Rubio, O., Ventura, L., López, A., de la Torre, M. C., Keough, E., Arauzo, V., Hermosa, C., Sánchez, C., Tizón, A., Tenza, E., Laborda, C., Cabañes, S., Lacueva, V., ... Fernández, R. (2019). Effect of pressure support vs T-piece ventilation strategies during spontaneous breathing trials on successful extubation among patients receiving mechanical ventilation: A randomized clinical trial. *JAMA, 321*(22), 2175-2182. [https://doi.org/10.1001/jama.2019.7234](https://doi.org/10.1001/jama.2019.7234)
