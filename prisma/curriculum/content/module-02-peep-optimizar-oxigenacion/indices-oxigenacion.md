<!-- page: conceptos-indices | THEORY | Medir la oxigenación: por qué no basta con la PaO₂ -->
<!-- block: INTRODUCTION | Por qué importa -->
Una PaO₂ de 80 mmHg puede ser tranquilizadora o alarmante según cuánta ayuda necesita el paciente para conseguirla. Con aire ambiente indica un intercambio gaseoso aceptable; con FiO₂ de 0,8 y PEEP alta indica un pulmón gravemente enfermo. Los **índices de oxigenación** relacionan el resultado (PaO₂ o SpO₂) con el soporte que lo produce (FiO₂ y presión en la vía aérea). Sirven para clasificar la gravedad, seguir la evolución día a día, decidir si un ajuste funcionó y comunicarse con un lenguaje común.

En esta lección aprenderás a calcular e interpretar PaO₂/FiO₂, SpO₂/FiO₂ e índice de oxigenación, a relacionar la presión media de la vía aérea con la oxigenación, a leer las tablas FiO₂/PEEP de la red ARDS como punto de partida y a elegir metas de SpO₂ razonables. La fisiología de la PEEP se desarrolla en la lección «PEEP: fisiología, beneficios y riesgos».

<!-- block: THEORY | Las dos palancas de la oxigenación -->
En el paciente ventilado tienes dos palancas principales para mejorar la PaO₂:

- **FiO₂.** Aumenta la presión alveolar de O₂. Es muy eficaz cuando la hipoxemia se debe a alteración ventilación-perfusión o a hipoventilación, y poco eficaz cuando predomina el shunt, porque la sangre que pasa por alvéolos sin ventilación no ve el gas enriquecido.
- **Presión media de la vía aérea ($\bar{P}_{aw}$).** Es el promedio de la presión a lo largo de todo el ciclo. Depende de la PEEP, de la presión inspiratoria y de la fracción del ciclo que dura la inspiración. Una presión media mayor mantiene más volumen pulmonar aireado y reduce el shunt, a costa de mayor presión intratorácica y posible repercusión hemodinámica.

Ambas palancas tienen costos. La FiO₂ alta sostenida expone al tejido a concentraciones elevadas de O₂ y favorece atelectasias por reabsorción; la presión media alta puede sobredistender y reducir el retorno venoso. Por eso los índices que combinan ambas variables son más informativos que la PaO₂ aislada.

<!-- block: THEORY | PaO₂/FiO₂, SpO₂/FiO₂ e índice de oxigenación -->
**PaO₂/FiO₂ (P/F).** Es el índice más usado. Las definiciones de SDRA clasifican la gravedad en el paciente intubado, con PEEP de al menos 5 cmH₂O, como leve si $200 < P/F \le 300$ mmHg, moderada si $100 < P/F \le 200$ y grave si $P/F \le 100$ (Matthay et al., 2024). Su limitación principal es que ignora la presión: el mismo P/F con PEEP 5 y con PEEP 15 no describe el mismo pulmón, y el índice cambia cuando modificas la FiO₂ aunque el pulmón no cambie.

**SpO₂/FiO₂ (S/F).** Permite estimar la gravedad sin gasometría. En pacientes con lesión pulmonar aguda o SDRA, la relación observada fue $S/F = 64 + 0{,}84 \times P/F$, y valores de S/F de 235 y 315 correspondieron a P/F de 200 y 300 (Rice et al., 2007). La definición global de SDRA de 2024 aceptó el S/F como alternativa: $S/F \le 315$ identifica hipoxemia, con cortes de gravedad de 235 y 148, **siempre que la SpO₂ sea de 97 % o menos**, porque por encima de ese valor la curva de disociación se aplana y la SpO₂ deja de discriminar (Matthay et al., 2024).

**Índice de oxigenación (IO).** Incorpora la presión media de la vía aérea. Se usa sobre todo en pediatría y neonatología, donde las guías PALICC-2 lo emplean para clasificar el SDRA pediátrico en el paciente intubado: un IO menor de 16 corresponde a SDRA leve o moderado y un IO de 16 o más a grave; su equivalente con oximetría es el índice de saturación de oxígeno (ISO), con corte de 12 (Emeriaud et al., 2023). En adultos no forma parte de los criterios diagnósticos, pero es útil para seguir la evolución porque penaliza la oxigenación obtenida a costa de más presión.

![Tabla de categorías de gravedad del SDRA en el paciente intubado: grave, moderado, leve y sin criterio, con sus cortes de PaO₂/FiO₂ (100, 200 y 300 mmHg) y los cortes equivalentes de SpO₂/FiO₂ (148, 235 y 315), válidos solo con SpO₂ igual o menor a 97 %](/learning/diagrams/i7-indices-categorias.svg "Figura: cortes de gravedad con PaO₂/FiO₂ y su equivalente con SpO₂/FiO₂ según la definición global de 2024")

<!-- page: formulas-calculo | THEORY | Fórmulas y cálculo -->
<!-- block: THEORY | Fórmulas -->
Cociente PaO₂/FiO₂, con la FiO₂ expresada como fracción:

$$
\frac{P}{F} = \frac{PaO_2}{FiO_2}
$$

Cociente SpO₂/FiO₂, con la SpO₂ en porcentaje (válido si $SpO_2 \le 97\,\%$):

$$
\frac{S}{F} = \frac{SpO_2}{FiO_2}
$$

Índice de oxigenación e índice de saturación de oxígeno, con la FiO₂ como fracción (el factor 100 la convierte en porcentaje):

$$
IO = \frac{FiO_2 \cdot \bar{P}_{aw} \cdot 100}{PaO_2} \qquad ISO = \frac{FiO_2 \cdot \bar{P}_{aw} \cdot 100}{SpO_2}
$$

Corrección por altitud: cuando la altitud supera 1000 m, la definición global propone multiplicar el cociente por la presión barométrica relativa al nivel del mar (Matthay et al., 2024):

$$
\left(\frac{P}{F}\right)_{corr} = \frac{PaO_2}{FiO_2}\cdot\frac{P_B}{760}
$$

| Símbolo | Significado | Unidad |
|---|---|---|
| $PaO_2$ | presión arterial de O₂ | mmHg |
| $SpO_2$ | saturación por pulsioximetría | % |
| $FiO_2$ | fracción inspirada de O₂ | fracción (0,21 a 1,0) |
| $\bar{P}_{aw}$ | presión media de la vía aérea | cmH₂O |
| $P_B$ | presión barométrica local | mmHg |

Observa el sentido de cada índice: en P/F y S/F, **valores bajos indican peor oxigenación**; en IO e ISO, **valores altos indican peor oxigenación**, porque el soporte (FiO₂ y presión) está en el numerador.

<!-- block: EXERCISE | Ejemplo resuelto -->
Un paciente intubado tiene PaO₂ 64 mmHg, SpO₂ 91 %, FiO₂ 0,7, PEEP 10 cmH₂O y presión media de la vía aérea de 18 cmH₂O.

1. $P/F = 64 / 0{,}7 \approx 91\,\text{mmHg}$. Con los cortes descritos, corresponde a la categoría grave.
2. $S/F = 91 / 0{,}7 = 130$. También en la categoría grave (por debajo de 148), y la SpO₂ es menor de 97 %, por lo que el índice es válido.
3. $IO = (0{,}7 \times 18 \times 100) / 64 = 1260 / 64 \approx 19{,}7$.

Tras ajustar la PEEP a 14 cmH₂O y bajar la FiO₂ a 0,6, la nueva gasometría muestra PaO₂ 78 mmHg con presión media de 21 cmH₂O.

4. $P/F = 78 / 0{,}6 = 130\,\text{mmHg}$: mejoró.
5. $IO = (0{,}6 \times 21 \times 100)/78 = 1260/78 \approx 16{,}2$: también mejoró, aunque menos de lo que sugiere el P/F, porque parte de la mejoría se obtuvo con más presión.

**Corrección por altitud.** Si el mismo paciente estuviera en una ciudad con presión barométrica de 560 mmHg, el P/F inicial corregido sería $91 \times 560/760 \approx 67\,\text{mmHg}$. La corrección importa porque, a igual pulmón, la PaO₂ en altura es menor y el P/F sin corregir sobrestima la gravedad respecto a los cortes establecidos a nivel del mar.

<!-- block: CALLOUT:info | Cuidado con comparar P/F obtenidos con FiO₂ distintas -->
El P/F no es independiente de la FiO₂: en un pulmón con shunt importante, subir la FiO₂ cambia el cociente aunque la lesión sea la misma. Para seguir la evolución, compara índices obtenidos con un soporte parecido o registra siempre FiO₂, PEEP y presión media junto al índice.

<!-- page: tablas-y-metas | THEORY | Tablas FiO₂/PEEP y metas de oxigenación -->
<!-- block: THEORY | Las tablas FiO₂/PEEP de la red ARDS -->
Los protocolos de la red ARDS proponen combinaciones escalonadas de FiO₂ y PEEP para alcanzar la meta de oxigenación, aclarando que su uso es opcional y que la PEEP mínima es de 5 cmH₂O (NHLBI ARDS Clinical Network, 2008). Hay dos tablas: una de **PEEP baja/FiO₂ alta** y otra de **PEEP alta/FiO₂ baja**. Extracto de la primera:

| FiO₂ | 0,3 | 0,4 | 0,5 | 0,6 | 0,7 |
|---|---|---|---|---|---|
| PEEP (cmH₂O) | 5 | 5-8 | 8-10 | 10 | 10-14 |

| FiO₂ | 0,8 | 0,9 | 1,0 |
|---|---|---|---|
| PEEP (cmH₂O) | 14 | 14-18 | 18-24 |

La tabla de PEEP alta asigna, por ejemplo, PEEP de hasta 14 cmH₂O con FiO₂ de solo 0,3 y llega a 24 cmH₂O con FiO₂ 1,0 (NHLBI ARDS Clinical Network, 2008). Cuando ambas estrategias se compararon en el ensayo ALVEOLI, los resultados clínicos fueron similares (Brower et al., 2004), por lo que la elección y la titulación individual siguen siendo motivo de debate; se tratan en «Reclutamiento alveolar y titulación de PEEP».

La lógica de las tablas es útil para principiantes: **cuanto más FiO₂ necesita el paciente, más probable es que tenga pulmón colapsado y más PEEP se le asigna**. Su límite es que no miden la respuesta del paciente: dos pacientes con la misma FiO₂ pueden tener reclutabilidad muy distinta. Por eso, tras cada paso, revisa presión meseta, presión de distensión y hemodinamia.

![Diagrama de flujo para ajustar la oxigenación: medir SpO₂ o PaO₂; si está por debajo de la meta, descartar primero causas agudas como desplazamiento del tubo, obstrucción, neumotórax o fallo del equipo, luego subir FiO₂ o PEEP según la tabla y reevaluar mecánica y hemodinamia; si está por encima de la meta, bajar primero la FiO₂ y después la PEEP de forma gradual](/learning/diagrams/i7-indices-ajuste-oxigenacion.svg "Figura: ajuste escalonado de FiO₂ y PEEP hacia una meta de oxigenación")

<!-- block: THEORY | Metas de SpO₂ y PaO₂ -->
No existe una meta única para todos los pacientes. Las referencias más usadas son:

- **SDRA (protocolo de la red ARDS):** PaO₂ de 55 a 80 mmHg o SpO₂ de 88 a 95 % (NHLBI ARDS Clinical Network, 2008).
- **Paciente agudo en general (guía BTS):** SpO₂ de 94 a 98 %, y de 88 a 92 % en quienes tienen riesgo de insuficiencia respiratoria hipercápnica, como muchos pacientes con EPOC (O'Driscoll et al., 2017).
- **Insuficiencia respiratoria hipoxémica en UCI:** en el ensayo HOT-ICU, apuntar a una PaO₂ de 60 mmHg frente a 90 mmHg no cambió la mortalidad a 90 días (42,9 % frente a 42,4 %) (Schjørring et al., 2021). Es un tema activo de investigación, y la meta óptima puede variar según la población.

La lógica fisiológica es evitar los dos extremos: la hipoxemia, que compromete la entrega de O₂ a los tejidos, y la hiperoxemia innecesaria, que no añade O₂ útil una vez saturada la hemoglobina y exige más FiO₂ o más presión.

<!-- block: CALLOUT:warning | La pulsioximetría no es igual de exacta en todos los pacientes -->
En dos cohortes, la hipoxemia oculta (SaO₂ menor de 88 % con SpO₂ de 92 a 96 %) se presentó en el 11,7 % de las mediciones de pacientes de raza negra frente al 3,6 % de pacientes de raza blanca en una de ellas (Sjoding et al., 2020). La pigmentación cutánea, la mala perfusión periférica, la vasoconstricción y la carboxihemoglobina pueden falsear la SpO₂. Si la SpO₂ está en el límite inferior de la meta o no concuerda con la clínica, confirma con gasometría arterial.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 45 años, 160 cm, con neumonía grave e intubada hace 4 horas. Ventilación controlada por volumen con $V_T$ 6 mL/kg de peso predicho, FR 24/min, PEEP 8 cmH₂O, FiO₂ 0,8. Presión media de la vía aérea 15 cmH₂O, $P_{plat}$ 24 cmH₂O. Gasometría: PaO₂ 58 mmHg, SpO₂ 89 %. PAM 82 mmHg.

**Paso 1. Cuantifica la gravedad.** $P/F = 58/0{,}8 = 72{,}5$ mmHg, categoría grave. $IO = (0{,}8 \times 15 \times 100)/58 \approx 20{,}7$. $S/F = 89/0{,}8 \approx 111$.

**Paso 2. Descarta causas agudas tratables.** Confirmas posición del tubo, ausencia de secreciones que obstruyan, auscultación simétrica y curva de pletismografía adecuada. No hay neumotórax en la ecografía.

**Paso 3. Usa la tabla como punto de partida.** Con FiO₂ 0,8, la tabla de PEEP baja propone PEEP 14. La PEEP actual (8) está por debajo de lo esperable para esa FiO₂. Subes a 12 y luego a 14 cmH₂O, vigilando la presión meseta y la PAM tras cada paso.

**Paso 4. Reevalúa.** Con PEEP 14: $P_{plat}$ 28 cmH₂O ($\Delta P$ 14, antes 16), PAM 78 mmHg, SpO₂ 95 %. Bajas la FiO₂ a 0,6. Nueva gasometría: PaO₂ 76 mmHg con presión media de 20 cmH₂O. $P/F = 127$, $IO = (0{,}6 \times 20 \times 100)/76 \approx 15{,}8$.

**Paso 5. Ajusta a la meta.** La SpO₂ está dentro de 88-95 % y la PaO₂ dentro de 55-80 mmHg (NHLBI ARDS Clinical Network, 2008). El siguiente objetivo es reducir la FiO₂ manteniendo la meta. Con P/F persistentemente bajo, este paciente debe ser valorado para las estrategias de rescate del SDRA, como el decúbito prono, que verás en el módulo avanzado.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y prueba lo siguiente:

- Anota la SpO₂ y la PaO₂ iniciales con la FiO₂ programada y calcula P/F y S/F.
- Sube solo la FiO₂ y observa cuánto mejora la oxigenación; luego vuelve a la FiO₂ previa y sube la PEEP en pasos: compara qué palanca produce más efecto en este paciente.
- Tras subir la PEEP, revisa la presión media, la presión meseta y la presión arterial media, y recalcula el índice de oxigenación.

<!-- block: EXERCISE | Preguntas -->
**1.** PaO₂ 90 mmHg con FiO₂ 0,45 y presión media 12 cmH₂O. Calcula P/F e IO.

*Respuesta:* $P/F = 90/0{,}45 = 200$ mmHg; $IO = (0{,}45 \times 12 \times 100)/90 = 6$.

**2.** Un paciente tiene SpO₂ 99 % con FiO₂ 0,5. ¿Puedes usar el S/F para clasificar su gravedad?

*Respuesta:* no. Con SpO₂ por encima de 97 %, el S/F no es válido porque la curva de disociación está en su meseta (Matthay et al., 2024). Reduce la FiO₂ hasta una SpO₂ dentro de la meta y recalcula, o usa la gasometría.

**3.** Dos pacientes tienen P/F de 150 mmHg; uno con presión media de 10 cmH₂O y otro con 22 cmH₂O, ambos con FiO₂ 0,6. ¿Cuál está más grave?

*Respuesta:* el segundo. Sus PaO₂ son iguales (90 mmHg), pero el IO es $0{,}6 \times 22 \times 100/90 \approx 14{,}7$ frente a $0{,}6 \times 10 \times 100/90 \approx 6{,}7$: necesita más del doble de presión para el mismo resultado.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La PaO₂ aislada no describe la gravedad: siempre hay que relacionarla con la FiO₂ y con la presión que la produce.
- P/F y S/F bajan cuando empeora la oxigenación; IO e ISO suben, porque incluyen el soporte en el numerador.
- La definición global de 2024 mantiene los cortes de P/F de 300, 200 y 100 mmHg y acepta S/F de 315, 235 y 148 si la SpO₂ es de 97 % o menos (Matthay et al., 2024).
- Por encima de 1000 m de altitud, corrige el cociente por $P_B/760$.
- Las tablas FiO₂/PEEP asignan más PEEP a quien necesita más FiO₂; son un punto de partida, no una medida de la respuesta individual.
- En SDRA, la meta del protocolo de la red ARDS es PaO₂ de 55 a 80 mmHg o SpO₂ de 88 a 95 % (NHLBI ARDS Clinical Network, 2008).
- La SpO₂ puede sobrestimar la oxigenación real, en especial en piel oscura; ante dudas, confirma con gasometría (Sjoding et al., 2020).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Comparar P/F obtenidos con FiO₂ y PEEP muy diferentes como si fueran equivalentes** → el índice depende de la FiO₂ y no incluye la presión → registra siempre FiO₂, PEEP y presión media, y usa el IO para seguir la evolución.
- **Calcular S/F con SpO₂ de 98-100 %** → en esa zona la SpO₂ no discrimina y el índice subestima la gravedad → baja la FiO₂ hasta la meta o usa PaO₂.
- **Escribir la FiO₂ como porcentaje en el P/F** → 60/60 = 1 en lugar de 100 → expresa la FiO₂ como fracción (0,6).
- **Buscar SpO₂ de 100 % en el paciente con SDRA** → obliga a más FiO₂ o más presión sin añadir O₂ útil → usa una meta explícita y reduce primero la FiO₂ cuando la superes.
- **Subir la PEEP por tabla sin mirar la respuesta** → en un pulmón poco reclutable solo aumenta la presión meseta y el riesgo hemodinámico → reevalúa meseta, presión de distensión y PAM tras cada paso.
- **Ignorar la altitud** → el P/F sin corregir sobrestima la gravedad a gran altitud respecto a los cortes de referencia → aplica la corrección por presión barométrica.

<!-- block: REFERENCES | Referencias -->
- Brower, R. G., Lanken, P. N., MacIntyre, N., Matthay, M. A., Morris, A., Ancukiewicz, M., Schoenfeld, D., & Thompson, B. T. (2004). Higher versus lower positive end-expiratory pressures in patients with the acute respiratory distress syndrome. *New England Journal of Medicine, 351*(4), 327-336. [https://doi.org/10.1056/NEJMoa032193](https://doi.org/10.1056/NEJMoa032193)
- Emeriaud, G., López-Fernández, Y. M., Iyer, N. P., Bembea, M. M., Agulnik, A., Barbaro, R. P., et al. (2023). Executive summary of the Second International Guidelines for the Diagnosis and Management of Pediatric Acute Respiratory Distress Syndrome (PALICC-2). *Pediatric Critical Care Medicine, 24*(2), 143-168. [https://doi.org/10.1097/PCC.0000000000003147](https://doi.org/10.1097/PCC.0000000000003147)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., et al. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37-47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary*. [https://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](https://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- O'Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl. 1), ii1-ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Rice, T. W., Wheeler, A. P., Bernard, G. R., Hayden, D. L., Schoenfeld, D. A., & Ware, L. B. (2007). Comparison of the SpO₂/FiO₂ ratio and the PaO₂/FiO₂ ratio in patients with acute lung injury or ARDS. *Chest, 132*(2), 410-417. [https://doi.org/10.1378/chest.07-0617](https://doi.org/10.1378/chest.07-0617)
- Schjørring, O. L., Klitgaard, T. L., Perner, A., Wetterslev, J., Lange, T., Siegemund, M., et al. (2021). Lower or higher oxygenation targets for acute hypoxemic respiratory failure. *New England Journal of Medicine, 384*(14), 1301-1311. [https://doi.org/10.1056/NEJMoa2032510](https://doi.org/10.1056/NEJMoa2032510)
- Sjoding, M. W., Dickson, R. P., Iwashyna, T. J., Gay, S. E., & Valley, T. S. (2020). Racial bias in pulse oximetry measurement. *New England Journal of Medicine, 383*(25), 2477-2478. [https://doi.org/10.1056/NEJMc2029240](https://doi.org/10.1056/NEJMc2029240)
