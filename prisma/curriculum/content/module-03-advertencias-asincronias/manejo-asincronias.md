<!-- page: conceptos-abordaje-sistematico | THEORY | Un método para no perderse: detectar, clasificar, buscar la causa, corregir -->
<!-- block: INTRODUCTION | Por qué hace falta un método -->
Ante una asincronía, la tentación es tocar el primer parámetro que viene a la mente: subir la sedación, cambiar la sensibilidad, subir el soporte. Muchas veces eso empeora el problema, porque **la asincronía es un síntoma**: indica que el ventilador y el centro respiratorio no están de acuerdo en cuándo empezar, cuánto flujo dar o cuándo terminar. Para corregirla tienes que saber en qué sentido está el desacuerdo.

Todas las asincronías se pueden ordenar según dos direcciones opuestas:

- **Asistencia insuficiente o impulso alto:** el paciente quiere más flujo, más volumen o más tiempo del que recibe. Produce hambre de flujo, ciclado prematuro y doble disparo, con riesgo de esfuerzos lesivos.
- **Sobreasistencia o impulso bajo:** el ventilador entrega más de lo que el paciente pide. Produce esfuerzos ineficaces, ciclado tardío y, con sedación profunda, disparo reverso.

Un mismo paciente puede pasar de una dirección a otra en horas. Por eso necesitas un método que repitas cada vez, y una medida objetiva del esfuerzo para saber hacia dónde vas.

<!-- block: THEORY | Paso 0: descarta primero una urgencia -->
Una «asincronía» de aparición brusca con desaturación, hipotensión o agitación extrema puede ser la manifestación de un problema grave: desplazamiento u obstrucción del tubo, neumotórax, fallo del equipo. Antes de ajustar nada, asegura al paciente: si está inestable, desconéctalo y ventílalo con bolsa y oxígeno mientras descartas las causas del mnemotécnico DOPE (desplazamiento, obstrucción, neumotórax, fallo del equipo), como se explica en la lección «Seguridad del paciente ventilado». Solo con el paciente estable tiene sentido el análisis fino.

<!-- block: THEORY | Pasos 1 y 2: detectar y clasificar -->
**Detectar.** Mira a la vez la pantalla y al paciente. Compara la frecuencia del ventilador con la frecuencia de esfuerzos que ves en el tórax y el abdomen; observa la musculatura accesoria, la sudoración, la expresión de dolor. En las curvas, recorre cada ciclo por fases: inicio, inspiración y final.

**Clasificar.** Ubica la asincronía en la fase del ciclo donde ocurre y anota en qué dirección apunta:

| Fase | Asincronía | Signo en la curva | Dirección habitual |
|---|---|---|---|
| Disparo | Esfuerzo ineficaz | Muesca en flujo y presión espiratorios sin ciclo | Sobreasistencia, auto-PEEP |
| Disparo | Autodisparo | Ciclo sin caída previa de presión, sin esfuerzo | Fuga, agua, sensibilidad excesiva |
| Inspiración | Hambre de flujo | Presión cóncava hacia abajo en VCV | Asistencia insuficiente |
| Ciclado | Prematuro y doble disparo | Segundo ciclo casi sin espiración | Impulso alto, Ti corto |
| Ciclado | Tardío | Pico de presión al final de la inspiración | Sobreasistencia, Ti largo |
| Acoplamiento | Disparo reverso | Esfuerzo tras una insuflación disparada por tiempo | Sedación profunda |

<!-- block: THEORY | Paso 3: busca la causa -->
Las causas se agrupan en tres orígenes:

- **El paciente:** impulso alto por dolor, ansiedad, delirium, fiebre, acidosis metabólica, hipoxemia o hipercapnia; impulso bajo por sedación profunda, alcalosis o sobreasistencia.
- **La programación:** sensibilidad del trigger, flujo y forma de onda, tiempo inspiratorio, criterio de ciclado en presión de soporte, nivel de soporte, PEEP frente a auto-PEEP.
- **El equipo:** fugas, condensación en las tubuladuras, tubo estrecho o acodado, secreciones.

Una regla útil: si el problema es el impulso alto por una causa médica (acidosis, dolor), ningún ajuste del ventilador lo resolverá por completo; tienes que tratar la causa.

![Diagrama de flujo con los pasos: 0, descartar urgencia; 1, detectar; 2, clasificar; 3, buscar la causa en dos ramas, impulso alto o sobreasistencia; 4, corregir una variable a la vez; 5, reevaluar; y escalada si persiste](/learning/diagrams/a7-manejo-algoritmo.svg "Figura: algoritmo de abordaje sistemático de las asincronías")

<!-- page: formulas-medir-esfuerzo | EXERCISE | Medir el impulso y el esfuerzo: P0.1 y presión de oclusión -->
<!-- block: THEORY | P0.1: el impulso respiratorio en 100 milisegundos -->
La **P0.1** es la caída de presión en la vía aérea durante los primeros 100 ms de un esfuerzo inspiratorio realizado contra la vía aérea ocluida. En ese instante tan breve no hay flujo ni cambio de volumen, y el paciente todavía no percibe la oclusión, de modo que la caída refleja sobre todo la intensidad de la orden neural. Muchos ventiladores la muestran en pantalla.

En pacientes en ventilación asistida, una P0.1 medida mayor de 3,5 cmH₂O detectó un esfuerzo alto (producto presión-tiempo esofágico ≥ 200 cmH₂O·s/min) con una sensibilidad del 80 % y una especificidad del 77 %; una P0.1 de 1,0 cmH₂O o menos identificó un esfuerzo bajo con una sensibilidad del 100 % y una especificidad del 92 % (Telias et al., 2020). Los ventiladores que estiman la P0.1 sin una oclusión real pueden subestimarla (Telias et al., 2020); conoce cómo la calcula tu equipo.

<!-- block: THEORY | ΔPocc: estimar el esfuerzo y la presión transpulmonar sin catéter -->
La **presión de oclusión espiratoria** (ΔPocc) se mide ocluyendo la vía aérea al final de la espiración durante un ciclo completo: el paciente hace su esfuerzo contra un circuito cerrado y la presión cae. La caída máxima respecto de la PEEP es la ΔPocc (un número negativo). Como durante la oclusión el músculo trabaja sin acortarse, la ΔPocc es mayor que la presión que genera en un ciclo normal; por eso se aplican factores de conversión derivados frente a la presión esofágica (Bertoni et al., 2019):

$$
P_{mus} \approx -\tfrac{3}{4}\,\Delta P_{occ}
$$

$$
\Delta P_{L,dyn} \approx \left(P_{pico} - PEEP\right) - \tfrac{2}{3}\,\Delta P_{occ}
$$

- $P_{mus}$: presión que generan los músculos inspiratorios en un ciclo asistido (cmH₂O).
- $\Delta P_{L,dyn}$: presión transpulmonar de distensión dinámica, la diferencia entre la presión transpulmonar pico y la del final de la espiración (cmH₂O).
- $P_{pico}$ y $PEEP$: presiones en la vía aérea del ciclo asistido (cmH₂O).
- $\Delta P_{occ}$: caída máxima de presión durante la oclusión (cmH₂O, negativa).

En ese estudio, la ΔPocc identificó con buena exactitud un $P_{mus}$ mayor de 10 cmH₂O y una $\Delta P_{L,dyn}$ mayor de 15 cmH₂O (áreas bajo la curva de 0,92 y 0,93), umbrales que los autores eligieron como posiblemente excesivos (Bertoni et al., 2019). Son estimaciones poblacionales: úsalas para detectar extremos, no para afinar décimas.

![Curva de presión en la vía aérea con PEEP de 8 cmH2O. Tras un ciclo asistido se ocluye la vía aérea al final de la espiración; la caída en los primeros 100 ms es la P0.1 y la caída máxima, de menos 20 cmH2O, es la presión de oclusión](/learning/diagrams/a7-manejo-pocc.svg "Figura: P0.1 y presión de oclusión en una maniobra de oclusión espiratoria")

<!-- block: EXERCISE | Ejemplo resuelto -->
**Caso A.** Paciente en presión de soporte 10 cmH₂O con PEEP 8 cmH₂O, de modo que la presión pico es 18 cmH₂O. En la oclusión espiratoria mides $\Delta P_{occ} = -20\,\text{cmH}_2\text{O}$ y una P0.1 de 4,8 cmH₂O.

$$
P_{mus} \approx -\tfrac{3}{4}\times(-20) = 15\,\text{cmH}_2\text{O}
$$

$$
\Delta P_{L,dyn} \approx (18 - 8) - \tfrac{2}{3}\times(-20) = 10 + 13{,}3 \approx 23\,\text{cmH}_2\text{O}
$$

Con una presión de distensión en la vía aérea de solo 10 cmH₂O, el pulmón soporta una distensión dinámica de unos 23 cmH₂O porque el resto lo pone el músculo. La P0.1 confirma un impulso alto. Antes de tocar el soporte, busca la causa del impulso.

**Caso B.** Otro paciente en presión de soporte 20 cmH₂O, PEEP 5 cmH₂O, con esfuerzos ineficaces visibles. $\Delta P_{occ} = -4\,\text{cmH}_2\text{O}$ y P0.1 de 0,7 cmH₂O.

$$
P_{mus} \approx -\tfrac{3}{4}\times(-4) = 3\,\text{cmH}_2\text{O}
$$

El esfuerzo es mínimo y la P0.1 es compatible con esfuerzo bajo (Telias et al., 2020). Es un paciente sobreasistido: la corrección lógica es reducir el soporte, no aumentarlo.

<!-- page: corregir-asincronia | THEORY | Corregir: ajustes del ventilador, sedoanalgesia y bloqueo neuromuscular -->
<!-- block: THEORY | Ajustes del ventilador según el tipo -->
Cambia **una variable cada vez** y observa el efecto durante unos minutos antes de tocar otra.

- **Esfuerzos ineficaces por sobreasistencia.** Reduce el soporte o el tiempo de insuflación. En 12 pacientes con más del 10 % de esfuerzos ineficaces, bajar la presión de soporte de 20 a 13 cmH₂O redujo el volumen corriente de 10,2 a 5,9 mL/kg de peso predicho y los esfuerzos ineficaces del 45 % a 0 %, sin aumentar la frecuencia del paciente, su esfuerzo ni la PaCO₂ (Thille et al., 2008). En ese estudio, añadir PEEP no modificó la asincronía (Thille et al., 2008); la PEEP externa puede ayudar en casos de limitación al flujo espiratorio, como verás en la lección «Auto-PEEP e hiperinflación dinámica», pero no es la primera palanca.
- **Doble disparo por impulso alto.** Trata la causa del impulso y acerca el tiempo inspiratorio de la máquina al del paciente: en VCV, alarga el tiempo inspiratorio reduciendo el flujo o añadiendo pausa; en presión de soporte, baja el porcentaje de ciclado. Los ciclos apilados fueron menos frecuentes con volúmenes programados mayores (Pohlman et al., 2008), pero en el SDRA eso compite con la protección pulmonar: solo es aceptable si la meseta y la presión de distensión lo permiten.
- **Hambre de flujo en VCV.** Aumenta el flujo o pasa a un modo con flujo libre (control por presión o presión de soporte), en el que el paciente puede tomar el flujo que pide.
- **Ciclado tardío.** Sube el porcentaje de ciclado en presión de soporte o acorta el tiempo inspiratorio en modos controlados.
- **Disparo reverso.** No existe un tratamiento validado. Se suelen probar ajustes de la sedación o de la frecuencia, o el paso a un modo asistido, y se vigila si aparece apilamiento, que es la forma con mayor riesgo de volumen excesivo.

<!-- block: THEORY | Sedación y analgesia: herramienta, no solución universal -->
La guía PADIS recomienda priorizar la analgesia, mantener una sedación ligera cuando no hay una indicación de sedación profunda y preferir propofol o dexmedetomidina frente a las benzodiacepinas en el adulto ventilado (Devlin et al., 2018). Aplicado a las asincronías:

- **El dolor y la ansiedad elevan el impulso.** Trátalos primero; a menudo bastan para resolver un doble disparo.
- **La sedación no baja un impulso originado por acidosis o hipoxemia**, salvo a dosis que deprimen todo el sistema; corrige la causa metabólica.
- **La sedación profunda tiene su propio costo:** favorece esfuerzos ineficaces y disparo reverso, prolonga la ventilación y dificulta la vigilancia neurológica.

<!-- block: THEORY | Bloqueo neuromuscular: dónde está hoy la evidencia -->
En el SDRA con esfuerzos intensos que persisten pese a una sedoanalgesia adecuada, el bloqueo neuromuscular elimina el esfuerzo y, con él, el apilamiento. La evidencia sobre su efecto en la supervivencia **cambió con el tiempo**:

- **ACURASYS (2010):** en 340 pacientes con SDRA y PaO₂/FiO₂ < 150 mmHg, 48 h de cisatracurio redujeron la mortalidad ajustada a 90 días (cociente de riesgos 0,68), aunque la diferencia cruda (31,6 % frente a 40,7 %) no fue significativa; el grupo control recibió sedación profunda (Papazian et al., 2010).
- **ROSE (2019):** con un grupo control de sedación ligera y una estrategia de PEEP alta, el bloqueo continuo no cambió la mortalidad a 90 días (Grasselli et al., 2023).
- **Guías actuales, con posturas distintas:** la guía ESICM 2023 recomienda no usar de rutina la infusión continua de bloqueantes en el SDRA moderado o grave no debido a COVID-19 (recomendación fuerte, evidencia moderada) (Grasselli et al., 2023); la guía ATS 2024 sugiere usarlos en el SDRA grave temprano (recomendación condicional, certeza baja) (Qadir et al., 2024).

En la práctica, el bloqueo no es la respuesta a cualquier asincronía: se reserva para el SDRA grave temprano con esfuerzos o asincronías que no ceden, con sedación profunda asociada y una reevaluación diaria de su necesidad.

<!-- block: THEORY | Cambio de modo -->
Si tras corregir la causa y ajustar los parámetros la asincronía persiste, el cambio de modo puede ayudar: de VCV a un modo controlado por presión cuando hay hambre de flujo; de asistida-controlada a presión de soporte cuando el paciente tiene un impulso adecuado y estable. Algunos ventiladores ofrecen modos proporcionales que adaptan la asistencia al esfuerzo; su uso depende de la disponibilidad y de la experiencia del equipo. Cada cambio de modo cambia también qué variable queda protegida, como viste en la lección «VCV frente a PCV en el paciente complejo».

<!-- page: aplicacion-clinica-manejo | CASE_STUDY | Aplicación clínica: dos pacientes, dos direcciones -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente 1: sobreasistencia.** Mujer de 67 años, 1,60 m (PBW 52 kg), quinto día de ventilación por neumonía, en mejoría. Está en presión de soporte 18 cmH₂O, PEEP 6 cmH₂O, FiO₂ 0,35. La pantalla muestra FR 14/min y volumen corriente 500 mL (unos 9,6 mL/kg). Al mirar el abdomen cuentas 24 esfuerzos por minuto. Gasometría: pH 7,48, PaCO₂ 33 mmHg. P0.1 de 0,8 cmH₂O.

Razonamiento:

1. **Seguridad:** estable, SpO₂ 96 %. No hay urgencia.
2. **Detectar y clasificar:** diez esfuerzos por minuto no disparan: esfuerzos ineficaces. Volumen alto y alcalosis respiratoria.
3. **Causa:** sobreasistencia. El volumen grande prolonga la espiración, crea hiperinflación y apaga parcialmente el impulso (P0.1 baja).
4. **Corrección:** baja el soporte en pasos pequeños vigilando el volumen y el patrón; con un soporte de unos 12 cmH₂O el volumen cae cerca de 6-7 mL/kg y la frecuencia del ventilador sube hasta igualar la del paciente, como en los pacientes estudiados por Thille et al. (2008).
5. **Reevaluar:** recuenta la frecuencia real, repite la gasometría y valora si cumple criterios para una prueba de ventilación espontánea.

**Paciente 2: impulso alto.** Hombre de 50 años con SDRA moderado por pancreatitis, en VCV con 6 mL/kg. Tras reducir la sedación presenta dobles disparos frecuentes, P0.1 de 5,2 cmH₂O y ΔPocc de −22 cmH₂O. pH 7,26, temperatura 39 °C, CPOT alto.

1. Analgesia, antipiréticos y corrección de la acidosis en lo posible.
2. Ajuste del tiempo inspiratorio para acercarlo al neural, vigilando la meseta y la presión de distensión.
3. Reevaluación de la P0.1 y de la frecuencia de dobles disparos tras cada ajuste.
4. Si el SDRA progresa a grave y los esfuerzos persisten pese a todo, se discute el bloqueo neuromuscular a la luz de las guías, que no coinciden en su recomendación (Grasselli et al., 2023; Qadir et al., 2024).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation), que reproduce la carga umbral detrás de muchos esfuerzos ineficaces. Observa que el flujo espiratorio no llega a cero antes del siguiente ciclo. Prueba, cambiando una variable a la vez: reducir la frecuencia, reducir el volumen corriente y aumentar el flujo inspiratorio. Después de cada cambio, comprueba si el flujo espiratorio se acerca a cero y si baja la auto-PEEP medida con pausa espiratoria. Fíjate también en cómo responden la PaCO₂ y el pH del monitor: corregir la hiperinflación tiene un costo ventilatorio que debes aceptar o compensar.

<!-- block: EXERCISE | Preguntas -->
**1.** Un paciente en presión de soporte tiene una presión pico de 20 cmH₂O, PEEP 8 cmH₂O y ΔPocc de −15 cmH₂O. Estima $P_{mus}$ y $\Delta P_{L,dyn}$.

*Respuesta:* $P_{mus} \approx 0{,}75 \times 15 \approx 11\,\text{cmH}_2\text{O}$; $\Delta P_{L,dyn} \approx (20 - 8) + \tfrac{2}{3}\times 15 = 12 + 10 = 22\,\text{cmH}_2\text{O}$. Ambos superan los umbrales que Bertoni et al. (2019) consideraron posiblemente excesivos.

**2.** Ves esfuerzos ineficaces y piensas en subir la sensibilidad del trigger al máximo. ¿Qué riesgo tiene y qué revisarías antes?

*Respuesta:* una sensibilidad excesiva produce autodisparo. Antes revisa si hay sobreasistencia y auto-PEEP, que son la causa habitual; reducir el soporte o el tiempo inspiratorio suele ser más eficaz (Thille et al., 2008).

**3.** ¿Por qué el ensayo ROSE no contradice simplemente al ACURASYS?

*Respuesta:* porque compararon cosas distintas: el control de ACURASYS recibía sedación profunda, mientras que el de ROSE recibía sedación ligera y PEEP alta. El beneficio del bloqueo puede depender de con qué se compare, y por eso las guías actuales difieren (Papazian et al., 2010; Grasselli et al., 2023; Qadir et al., 2024).

<!-- page: sintesis-manejo-asincronias | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La asincronía es un síntoma: antes de corregirla, decide si el problema es de asistencia insuficiente (impulso alto) o de sobreasistencia (impulso bajo).
- El orden es siempre el mismo: descartar una urgencia, detectar, clasificar por fase, buscar la causa, corregir una variable a la vez y reevaluar.
- La P0.1 (mayor de 3,5 cmH₂O sugiere esfuerzo alto; 1,0 o menos, esfuerzo bajo) y la ΔPocc son mediciones simples para orientar la dirección del ajuste.
- Con la ΔPocc puedes estimar el esfuerzo muscular y la presión transpulmonar dinámica, que pueden ser altos aunque la presión en la vía aérea sea baja.
- Los esfuerzos ineficaces suelen corregirse reduciendo el soporte o el tiempo inspiratorio, no aumentándolos.
- La analgesia va primero; la sedación profunda no corrige un impulso de origen metabólico y favorece otras asincronías.
- El bloqueo neuromuscular en el SDRA tiene evidencia cambiante y guías que no coinciden: resérvalo para el SDRA grave temprano con esfuerzos refractarios.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Ajustar el ventilador con el paciente inestable** → una asincronía brusca puede ser un tubo obstruido o un neumotórax → asegura al paciente y descarta DOPE primero.
- **Cambiar varios parámetros a la vez** → no sabrás cuál funcionó ni cuál empeoró la situación → modifica una variable y observa unos minutos.
- **Sedar más ante cualquier asincronía** → no corrige un impulso causado por acidosis o dolor y favorece esfuerzos ineficaces y disparo reverso → trata la causa y prioriza la analgesia.
- **Subir el soporte cuando hay esfuerzos ineficaces** → aumenta la hiperinflación y la carga umbral → mide la P0.1 o la ΔPocc y reduce el soporte si el esfuerzo es bajo.
- **Fiarse de la P0.1 de la pantalla sin saber cómo se calcula** → algunos equipos la estiman sin oclusión real y la subestiman → confírmala con una oclusión cuando la decisión dependa de ella.
- **Usar el bloqueo neuromuscular como solución rutinaria** → la evidencia de beneficio no es consistente y tiene efectos adversos → resérvalo para el SDRA grave temprano y reevalúalo cada día.

<!-- block: REFERENCES | Referencias -->
- Bertoni, M., Telias, I., Urner, M., Long, M., Del Sorbo, L., Fan, E., Sinderby, C., Beck, J., Liu, L., Qiu, H., Wong, J., Slutsky, A. S., Ferguson, N. D., Brochard, L. J., & Goligher, E. C. (2019). A novel non-invasive method to detect excessively high respiratory effort and dynamic transpulmonary driving pressure during mechanical ventilation. *Critical Care, 23*(1), 346. [https://doi.org/10.1186/s13054-019-2617-0](https://doi.org/10.1186/s13054-019-2617-0)
- Devlin, J. W., Skrobik, Y., Gélinas, C., Needham, D. M., Slooter, A. J. C., Pandharipande, P. P., Watson, P. L., Weinhouse, G. L., Nunnally, M. E., Rochwerg, B., Balas, M. C., van den Boogaard, M., Bosma, K. J., Brummel, N. E., Chanques, G., Denehy, L., Drouot, X., Fraser, G. L., Harris, J. E., ... Alhazzani, W. (2018). Clinical practice guidelines for the prevention and management of pain, agitation/sedation, delirium, immobility, and sleep disruption in adult patients in the ICU. *Critical Care Medicine, 46*(9), e825-e873. [https://doi.org/10.1097/CCM.0000000000003299](https://doi.org/10.1097/CCM.0000000000003299)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Papazian, L., Forel, J.-M., Gacouin, A., Penot-Ragon, C., Perrin, G., Loundou, A., Jaber, S., Arnal, J.-M., Perez, D., Seghboyan, J.-M., Constantin, J.-M., Courant, P., Lefrant, J.-Y., Guérin, C., Prat, G., Morange, S., & Roch, A. (2010). Neuromuscular blockers in early acute respiratory distress syndrome. *New England Journal of Medicine, 363*(12), 1107-1116. [https://doi.org/10.1056/NEJMoa1005372](https://doi.org/10.1056/NEJMoa1005372)
- Pohlman, M. C., McCallister, K. E., Schweickert, W. D., Pohlman, A. S., Nigos, C. P., Krishnan, J. A., Charbeneau, J. T., Gehlbach, B. K., Kress, J. P., & Hall, J. B. (2008). Excessive tidal volume from breath stacking during lung-protective ventilation for acute lung injury. *Critical Care Medicine, 36*(11), 3019-3023. [https://doi.org/10.1097/CCM.0b013e31818b308b](https://doi.org/10.1097/CCM.0b013e31818b308b)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., Bellani, G., Brower, R. G., Burry, L., Chen, J.-T., Hodgson, C., Hough, C. L., Lamontagne, F., Law, A., Papazian, L., Pham, T., Rubin, E., Siuba, M., Telias, I., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Telias, I., Junhasavasdikul, D., Rittayamai, N., Piquilloud, L., Chen, L., Ferguson, N. D., Goligher, E. C., & Brochard, L. (2020). Airway occlusion pressure as an estimate of respiratory drive and inspiratory effort during assisted ventilation. *American Journal of Respiratory and Critical Care Medicine, 201*(9), 1086-1098. [https://doi.org/10.1164/rccm.201907-1425OC](https://doi.org/10.1164/rccm.201907-1425OC)
- Thille, A. W., Cabello, B., Galia, F., Lyazidi, A., & Brochard, L. (2008). Reduction of patient-ventilator asynchrony by reducing tidal volume during pressure-support ventilation. *Intensive Care Medicine, 34*(8), 1477-1486. [https://doi.org/10.1007/s00134-008-1121-9](https://doi.org/10.1007/s00134-008-1121-9)
