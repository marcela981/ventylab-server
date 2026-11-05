<!-- page: ingreso-vni | CASE_STUDY | Etapa 1: exacerbación hipercápnica y ventilación no invasiva -->
<!-- block: INTRODUCTION | Cómo usar este caso -->
Este caso recorre la evolución de un paciente con exacerbación de EPOC desde urgencias hasta la extubación. En la EPOC el problema central no es la oxigenación sino la **espiración**: el aire entra y no termina de salir. Cada decisión del caso gira en torno a una pregunta: ¿le estás dando al pulmón tiempo suficiente para vaciarse? Responde las preguntas de cada etapa antes de leer la solución.

<!-- block: CASE_STUDY | Ejemplo clínico: presentación -->
**Paciente (ficticio):** hombre de 68 años, talla 170 cm, peso 62 kg. EPOC grave con dos ingresos el último año, exfumador. Tres días de aumento de disnea y de esputo purulento.

**En urgencias**, sin oxígeno: FR 32/min, tiraje, habla entrecortada, alerta. SpO₂ 82 %. Gasometría arterial: pH 7,28, PaCO₂ 70 mmHg, HCO₃⁻ 32 mmol/L, PaO₂ 46 mmHg. Radiografía: hiperinsuflación, sin neumotórax ni consolidación.

<!-- block: EQUATION | Relación entre ventilación alveolar y PaCO₂ -->
PaCO_2 \propto \frac{\dot{V}CO_2}{\dot{V}_A}

<!-- block: EXERCISE | ¿Qué harías? -->
1. Interpreta la gasometría: ¿acidosis aguda, crónica o crónica agudizada?
2. ¿Qué meta de SpO₂ te fijas y por qué no buscas 100 %?
3. ¿Está indicada la ventilación no invasiva (VNI)? ¿Qué beneficio esperas?

<!-- block: THEORY | Respuesta razonada -->
**1. Gasometría.** pH bajo con PaCO₂ alta: acidosis respiratoria. El bicarbonato elevado indica una compensación renal previa, propia de la hipercapnia crónica; el pH todavía ácido indica que hay un componente agudo que superó esa compensación. Es una acidosis respiratoria crónica agudizada. Como $PaCO_2$ es inversamente proporcional a la ventilación alveolar ($\dot{V}_A$), el paciente está hipoventilando para su producción de CO₂, a pesar de su frecuencia alta: respira rápido y superficial, con mucho espacio muerto.

**2. Oxígeno controlado.** La meta durante la exacerbación es una SpO₂ de 88-92 %, con control gasométrico frecuente para asegurar la oxigenación sin aumentar la retención de CO₂ ni la acidosis (GOLD, 2024). El exceso de oxígeno puede empeorar la hipercapnia en estos pacientes, entre otros mecanismos por aumento del espacio muerto al revertir la vasoconstricción hipóxica.

**3. VNI.** Sí. La guía ERS/ATS recomienda con fuerza la VNI binivelada en la insuficiencia respiratoria con acidosis respiratoria (pH ≤ 7,35) por exacerbación de EPOC, y señala que no hay un pH mínimo por debajo del cual el intento sea inapropiado, aunque el riesgo de fracaso aumenta cuanto más bajo es el pH (Rochwerg et al., 2017). GOLD la prefiere a la intubación como modo inicial y describe tasas de éxito del 80-85 % (GOLD, 2024). En el ensayo clásico de Brochard, la VNI redujo la intubación (26 % frente a 74 %) y la mortalidad hospitalaria (9 % frente a 29 %) (Brochard et al., 1995).

**Cómo actúa la VNI:** la presión inspiratoria descarga los músculos y aumenta el volumen corriente, y la presión espiratoria contrarresta la auto-PEEP, de modo que el paciente necesita menos esfuerzo para iniciar cada respiración.

**Ajustes elegidos en el caso:** mascarilla oronasal, IPAP 14 cmH₂O, EPAP 5 cmH₂O, FiO₂ titulada a SpO₂ 88-92 %. Reevaluación clínica y gasométrica en 1-2 horas.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y:

1. Observa la curva de flujo: el flujo espiratorio no regresa a cero antes de la siguiente respiración.
2. Reduce la frecuencia respiratoria y comprueba que el flujo espiratorio se acerca a cero y que la presión meseta baja.
3. Aumenta el flujo inspiratorio en VCV: el tiempo inspiratorio se acorta, el espiratorio se alarga y la presión pico sube aunque la meseta no lo haga.
4. Repite con [«EPOC descompensado»](/simulador?tab=simular&case=july-epoc-descompensado) y vigila la PaCO₂ y el pH: no intentes normalizarlos de golpe.

<!-- page: intubacion-ajustes | CASE_STUDY | Etapa 2: fracaso de la VNI, intubación y ajustes iniciales -->
<!-- block: CASE_STUDY | Ejemplo clínico: dos horas después -->
Pese a una buena adaptación a la mascarilla, a las 2 horas está somnoliento, no maneja secreciones y la gasometría empeora: pH 7,20, PaCO₂ 84 mmHg. Se decide intubar.

Tras la intubación, el residente ventila con bolsa a unas 30 respiraciones por minuto. La presión arterial cae a 72/40 mmHg y la saturación desciende. Al desconectar la bolsa durante unos 30 segundos, la presión arterial se recupera.

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Qué explica la hipotensión tras la intubación y por qué mejoró al desconectar?
2. Programas VCV con Vt 450 mL y flujo inspiratorio de 60 L/min. Calcula el tiempo espiratorio con FR 22/min y con FR 14/min.
3. Con FR 14: Ppico 42, Pplat 24, PEEP programada 5 y PEEP total 11 cmH₂O (pausa espiratoria). Calcula auto-PEEP, resistencia y compliance.

<!-- block: THEORY | Respuesta razonada -->
**1. Hiperinflación dinámica.** Ventilar rápido a un pulmón con limitación del flujo espiratorio no deja tiempo para exhalar: cada respiración atrapa un poco más de aire, el volumen pulmonar al final de la espiración sube y la presión intratorácica aumenta, lo que reduce el retorno venoso. Tuxen y Lane demostraron en pacientes con obstrucción grave que el volumen atrapado aumenta al subir el Vt o al acortar el tiempo espiratorio, y que la hipotensión aparecía con los volúmenes pulmonares más altos (Tuxen y Lane, 1987). La desconexión breve permite que el pulmón se vacíe: si la presión arterial mejora, has confirmado el mecanismo y, antes de otras medidas, tienes que bajar la frecuencia.

**2. Tiempos.**

$$
T_i = \frac{V_T}{\dot{V}} \qquad T_{\text{ciclo}} = \frac{60}{FR} \qquad T_e = T_{\text{ciclo}} - T_i
$$

Con $\dot{V} = 60\,\text{L/min} = 1\,\text{L/s}$ y $V_T = 0{,}45\,\text{L}$: $T_i = 0{,}45\,\text{s}$.

- FR 22: $T_{\text{ciclo}} = 2{,}73\,\text{s}$, $T_e = 2{,}28\,\text{s}$.
- FR 14: $T_{\text{ciclo}} = 4{,}29\,\text{s}$, $T_e = 3{,}84\,\text{s}$.

Bajar la frecuencia es la forma más eficaz de alargar el tiempo espiratorio. Aumentar el flujo inspiratorio también acorta el $T_i$, pero el beneficio es menor y la presión pico sube; en el estudio de Tuxen y Lane, la presión pico dependía sobre todo del flujo y no reflejaba los cambios de volumen pulmonar (Tuxen y Lane, 1987). Por eso la presión pico **no** sirve para vigilar la hiperinflación.

**3. Mecánica.**

$$
\text{auto-PEEP} = PEEP_{total} - PEEP_{e} = 11 - 5 = 6\,\text{cmH}_2\text{O}
$$

$$
R_{aw} = \frac{P_{pico} - P_{plat}}{\dot{V}} = \frac{42 - 24}{1\,\text{L/s}} = 18\,\text{cmH}_2\text{O/L/s}
$$

$$
C_{rs} = \frac{V_T}{P_{plat} - PEEP_{total}} = \frac{450}{24 - 11} \approx 35\,\text{mL/cmH}_2\text{O}
$$

La resistencia está muy elevada y la auto-PEEP persiste incluso con un tiempo espiratorio de casi 4 segundos. Observa que, si hubieras usado la PEEP programada en lugar de la total, habrías calculado una compliance falsamente baja (450/19 ≈ 24 mL/cmH₂O).

**PBW para referencia:** $50 + 0{,}91 \times (170 - 152{,}4) = 66\,\text{kg}$; 450 mL equivalen a 6,8 mL/kg PBW. Aunque su peso real es menor que el predicho, el cálculo se sigue haciendo con el PBW.

![Dos curvas de flujo frente a tiempo en VCV: arriba, con frecuencia de 30 por minuto y tiempo espiratorio de 1,2 segundos, el flujo espiratorio no llega a cero antes de la siguiente inspiración; abajo, con frecuencia de 15 por minuto y tiempo espiratorio de 3,2 segundos, el flujo regresa a cero](/learning/diagrams/a10-epoc-flujo-autopeep.svg "Figura: el flujo espiratorio que no llega a cero indica atrapamiento aéreo")

<!-- page: auto-peep-monitoreo | CASE_STUDY | Etapa 3: gasometría, auto-PEEP y paso a modo asistido -->
<!-- block: CASE_STUDY | Ejemplo clínico: día 2 -->
Con VCV, Vt 450 mL, FR 14, PEEP 5, FiO₂ 0,35: pH 7,32, PaCO₂ 62 mmHg, HCO₃⁻ 31 mmol/L, SpO₂ 90 %. PEEP total 9 cmH₂O. Se reduce la sedación y se cambia a presión de soporte (PS 14 cmH₂O, PEEP 5). Una hora después la enfermera observa que el paciente mueve el abdomen y el tórax con más frecuencia de la que cuenta el ventilador: FR del paciente 30/min, FR del ventilador 18/min, Vte 650 mL.

<!-- block: EQUATION | Ajuste aproximado de la ventilación minuto -->
PaCO_{2,\text{nueva}} \approx PaCO_{2,\text{actual}} \cdot \frac{\dot{V}_{E,\text{actual}}}{\dot{V}_{E,\text{nueva}}}

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Buscas una PaCO₂ de 40 mmHg? ¿Qué meta es razonable?
2. ¿Qué está pasando con los esfuerzos que no disparan el ventilador?
3. ¿Qué ajustes corrigen el problema?

<!-- block: THEORY | Respuesta razonada -->
**1. Meta de PaCO₂.** No. El bicarbonato de 31-32 mmol/L indica que su "normalidad" es una PaCO₂ crónicamente elevada. Si aumentaras la ventilación minuto para llevar la PaCO₂ a 40 mmHg, aparecería una alcalosis metabólica (los riñones tardan días en eliminar el bicarbonato retenido), y además necesitarías más frecuencia o más volumen, que es justo lo que aumenta el atrapamiento. La meta razonable es un pH cercano a la normalidad con la PaCO₂ habitual del paciente. La fórmula de ajuste te ayuda a estimar el efecto de un cambio: si la ventilación minuto pasa de 6,3 a 7,0 L/min, $62 \times 6{,}3/7{,}0 \approx 56\,\text{mmHg}$ (aproximación que asume espacio muerto y producción de CO₂ constantes).

**2. Esfuerzos ineficaces.** Con auto-PEEP, el paciente primero tiene que generar una presión igual a la auto-PEEP solo para que la presión alveolar baje por debajo de la del circuito; solo entonces el ventilador detecta el esfuerzo. Muchos esfuerzos no lo logran. Además, una presión de soporte alta produce volúmenes grandes (650 mL) y ciclos largos, que acortan el tiempo espiratorio y aumentan el atrapamiento: el exceso de asistencia empeora el problema.

**3. Ajustes.**

- **Reducir la presión de soporte** para disminuir el Vt y el tiempo inspiratorio; vigila que la FR del paciente no se dispare.
- **Adelantar el ciclado:** un porcentaje de ciclado espiratorio más alto termina antes la inspiración y deja más tiempo para espirar, útil en pacientes obstructivos cuya curva de flujo desacelera lentamente.
- **PEEP externa por debajo de la auto-PEEP medida:** en la limitación del flujo espiratorio, una PEEP externa moderada reduce la diferencia de presión que el paciente debe vencer para disparar, sin aumentar el atrapamiento mientras se mantenga por debajo de la auto-PEEP. Mide de nuevo la PEEP total tras el cambio; si sube, retrocede.
- **Tratar la causa:** broncodilatadores, corticoides, antibiótico si está indicado y aspiración de secreciones, que reducen la resistencia y el atrapamiento.

**Ajustes tras la corrección:** PS 10 cmH₂O, PEEP 6, ciclado al 40 % del flujo pico. FR del paciente igual a la del ventilador (20/min), Vte 480 mL, sin esfuerzos ineficaces visibles.

<!-- page: destete-extubacion | CASE_STUDY | Etapa 4: prueba de ventilación espontánea y extubación -->
<!-- block: CASE_STUDY | Ejemplo clínico: día 4 -->
Despierto, colaborador, secreciones escasas, sin vasopresores. PS 8 cmH₂O, PEEP 5, FiO₂ 0,30: pH 7,38, PaCO₂ 58 mmHg, SpO₂ 91 %, FR 20/min, Vte 420 mL.

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Qué prueba de ventilación espontánea eliges?
2. Supera la prueba. ¿Lo extubas a oxígeno convencional o a VNI?
3. A las 10 horas de la extubación, con VNI intermitente, aparece de nuevo trabajo respiratorio y acidosis. ¿Insistes con la VNI?

<!-- block: THEORY | Respuesta razonada -->
**1. PVE.** La guía CHEST/ATS sugiere hacer la PVE inicial con aumento de presión inspiratoria (Ouellette et al., 2017). Una prueba de 30 minutos con presión de soporte de 8 cmH₂O se asoció a más extubaciones exitosas que 2 horas con tubo en T (82,3 % frente a 74,0 %) (Subirà et al., 2019). Durante la prueba, en un paciente obstructivo, vigila sobre todo la frecuencia, el uso de músculos accesorios, la sudoración, la taquicardia y los cambios del estado de conciencia. Antes de empezar, define con el equipo qué hallazgos detienen la prueba, para que la decisión no dependa de quién esté de guardia. Si la prueba fracasa, vuelve al soporte previo, busca una causa corregible (broncoespasmo, secreciones, sobrecarga de líquidos, alcalosis o sedación residual) y repítela al día siguiente en lugar de prolongar una prueba fallida.

**2. VNI preventiva.** Este paciente tiene EPOC con hipercapnia y lleva más de 24 horas ventilado, un perfil de alto riesgo de fracaso tras la extubación. La guía CHEST/ATS recomienda con fuerza la VNI preventiva inmediatamente después de la extubación en pacientes de alto riesgo ventilados más de 24 horas (Ouellette et al., 2017), y la guía ERS/ATS sugiere la VNI para prevenir la insuficiencia respiratoria posextubación en este grupo (Rochwerg et al., 2017). Se extuba directamente a VNI, con el tronco elevado, la mascarilla ya ajustada y la gasometría de control programada. Durante las primeras horas vigila la tolerancia a la interfaz, la frecuencia respiratoria, el pH y la PaCO₂, la capacidad de toser y la presencia de distensión gástrica.

Cuando tolere al menos 4 horas sin asistencia, la VNI puede retirarse directamente, sin un "destete" progresivo (GOLD, 2024).

**3. Fracaso establecido.** Distingue prevención de rescate. La guía ERS/ATS sugiere **no** usar la VNI para tratar la insuficiencia respiratoria posextubación ya establecida (Rochwerg et al., 2017): insistir puede retrasar una reintubación necesaria. Reevalúa la causa (secreciones, broncoespasmo, edema, sobrecarga) y, si no hay respuesta rápida, reintuba de forma programada y no en situación de paro.

<!-- page: sintesis | THEORY | Síntesis del caso -->
<!-- block: SUMMARY | Puntos clave -->
- En la exacerbación de EPOC con acidosis respiratoria (pH ≤ 7,35), la VNI binivelada es la primera línea y reduce intubación y mortalidad (Rochwerg et al., 2017; Brochard et al., 1995).
- La meta de SpO₂ es 88-92 %, con control gasométrico de CO₂ y pH (GOLD, 2024).
- La hiperinflación dinámica aumenta con el Vt y al acortar el tiempo espiratorio, y puede causar hipotensión grave tras la intubación; la desconexión breve es diagnóstica y terapéutica (Tuxen y Lane, 1987).
- La herramienta principal para alargar el tiempo espiratorio es bajar la frecuencia; la presión pico no refleja la hiperinflación, la meseta y la auto-PEEP sí (Tuxen y Lane, 1987).
- La PaCO₂ objetivo es la habitual del paciente con un pH aceptable, no 40 mmHg.
- En modo asistido, la auto-PEEP causa esfuerzos ineficaces; se corrige reduciendo la asistencia, adelantando el ciclado y con PEEP externa inferior a la auto-PEEP.
- La VNI preventiva tras la extubación en pacientes de alto riesgo es útil; como rescate de un fracaso ya establecido, no (Ouellette et al., 2017; Rochwerg et al., 2017).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Ventilar con bolsa a frecuencia alta tras la intubación** → hiperinflación y colapso hemodinámico → ventila lento y, si cae la presión, desconecta brevemente.
- **Buscar normocapnia** → requiere más ventilación minuto, más atrapamiento y alcalosis posthipercápnica → apunta a un pH aceptable con la PaCO₂ basal del paciente.
- **Vigilar la hiperinflación con la presión pico** → depende del flujo y de la resistencia, no del volumen atrapado → mide meseta y auto-PEEP con pausas.
- **Calcular la compliance con la PEEP programada** → infravaloras la compliance y no ves la auto-PEEP → usa la PEEP total.
- **Subir la presión de soporte ante una FR alta con esfuerzos ineficaces** → más volumen, menos tiempo espiratorio y más esfuerzos perdidos → reduce la asistencia, adelanta el ciclado y ajusta la PEEP externa.
- **Mantener la VNI como rescate de un fracaso posextubación** → retrasa la reintubación → úsala para prevenir en alto riesgo; ante un fracaso establecido, reintuba a tiempo.

<!-- block: REFERENCES | Referencias -->
- Brochard, L., Mancebo, J., Wysocki, M., Lofaso, F., Conti, G., Rauss, A., Simonneau, G., Benito, S., Gasparetto, A., Lemaire, F., Isabey, D., & Harf, A. (1995). Noninvasive ventilation for acute exacerbations of chronic obstructive pulmonary disease. *New England Journal of Medicine, 333*(13), 817-822. [https://doi.org/10.1056/NEJM199509283331301](https://doi.org/10.1056/NEJM199509283331301)
- Global Initiative for Chronic Obstructive Lung Disease [GOLD]. (2024). *Global strategy for the prevention, diagnosis and management of chronic obstructive pulmonary disease: 2025 report*. [https://goldcopd.org/2025-gold-report/](https://goldcopd.org/2025-gold-report/)
- Ouellette, D. R., Patel, S., Girard, T. D., Morris, P. E., Schmidt, G. A., Truwit, J. D., Alhazzani, W., Burns, S. M., Epstein, S. K., Esteban, A., Fan, E., Ferrer, M., Fraser, G. L., Gong, M. N., Hough, C. L., Mehta, S., Nanchal, R., Pawlik, A. J., Schweickert, W. D., ... Kress, J. P. (2017). Liberation from mechanical ventilation in critically ill adults: An official American College of Chest Physicians/American Thoracic Society clinical practice guideline. *Chest, 151*(1), 166-180. [https://doi.org/10.1016/j.chest.2016.10.036](https://doi.org/10.1016/j.chest.2016.10.036)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., & Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Subirà, C., Hernández, G., Vázquez, A., Rodríguez-García, R., González-Castro, A., García, C., Rubio, O., Ventura, L., López, A., de la Torre, M. C., Keough, E., Arauzo, V., Hermosa, C., Sánchez, C., Tizón, A., Tenza, E., Laborda, C., Cabañes, S., Lacueva, V., ... Fernández, R. (2019). Effect of pressure support vs T-piece ventilation strategies during spontaneous breathing trials on successful extubation among patients receiving mechanical ventilation: A randomized clinical trial. *JAMA, 321*(22), 2175-2182. [https://doi.org/10.1001/jama.2019.7234](https://doi.org/10.1001/jama.2019.7234)
- Tuxen, D. V., & Lane, S. (1987). The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *American Review of Respiratory Disease, 136*(4), 872-879. [https://doi.org/10.1164/ajrccm/136.4.872](https://doi.org/10.1164/ajrccm/136.4.872)
