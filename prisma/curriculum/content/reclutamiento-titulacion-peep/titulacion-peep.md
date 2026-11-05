<!-- page: el-dilema-de-la-peep | THEORY | El dilema de la PEEP: colapso frente a sobredistensión -->
<!-- block: INTRODUCTION | Por qué importa -->
La PEEP es probablemente el parámetro más discutido de la ventilación en el SDRA. Un nivel insuficiente deja que las unidades inestables se colapsen al final de cada espiración y se reabran en la siguiente inspiración; un nivel excesivo distiende las zonas que ya estaban abiertas, aumenta la presión intratorácica y puede deprimir el gasto cardíaco. No existe una PEEP «correcta» universal: el mismo valor puede ser protector en un paciente con mucho pulmón reclutable y dañino en otro con poco.

Titular la PEEP significa buscar, para un paciente y un momento concretos, el nivel que mejor equilibra esos dos riesgos. En esta lección revisarás los métodos que más se usan (tablas FiO₂/PEEP, prueba decremental con mejor compliance, presión esofágica y tomografía de impedancia eléctrica), el razonamiento fisiológico de cada uno y, sobre todo, lo que la evidencia ha demostrado y lo que no.

<!-- block: THEORY | Dos fuerzas opuestas dentro del mismo pulmón -->
En el pulmón heterogéneo del SDRA, subir la PEEP produce dos efectos simultáneos en regiones distintas:

- **En las regiones dependientes (dorsales en supino)**, la PEEP contrarresta el peso del tejido superpuesto y mantiene abiertas unidades que de otro modo se cerrarían: disminuye el colapso cíclico y el cortocircuito.
- **En las regiones no dependientes (ventrales)**, las unidades ya abiertas reciben un volumen de fin de espiración mayor y trabajan más cerca de su límite elástico: aumenta la sobredistensión.

Lo que observas en el ventilador, la compliance del sistema respiratorio ($C_{rs}$), es la suma de ambos procesos. Mientras la PEEP gana más unidades de las que sobredistiende, el mismo volumen corriente se reparte en más alvéolos y la $C_{rs}$ aumenta. Cuando la sobredistensión empieza a dominar, la $C_{rs}$ cae aunque la oxigenación siga mejorando, porque la PEEP también desvía flujo sanguíneo de las zonas sobredistendidas hacia otras.

La guía de la ATS de 2024 resume el problema: la PEEP alta puede reclutar alvéolos y evitar la apertura y el cierre cíclicos, pero también puede causar sobredistensión y compromiso hemodinámico por aumento de la poscarga del ventrículo derecho y disminución del retorno venoso; el balance neto depende de la proporción entre reclutamiento y sobredistensión en cada paciente (Qadir et al., 2024).

![Gráfico de compliance del sistema respiratorio frente a PEEP en una prueba decremental: la compliance sube al bajar la PEEP desde 20 hasta un máximo en 14 cmH₂O y luego desciende; la zona de PEEP alta se rotula como sobredistensión y la de PEEP baja como colapso.](/learning/diagrams/a3-peep-compliance-decremental.svg "Figura: en una prueba decremental la compliance traza una curva con un máximo entre la zona de sobredistensión y la de colapso")

<!-- block: THEORY | Por qué la oxigenación sola engaña -->
Usar solo la PaO₂ para elegir la PEEP es tentador porque responde rápido. Pero la oxigenación puede mejorar por mecanismos que no protegen el pulmón: la redistribución del flujo sanguíneo, la caída del gasto cardíaco (que reduce la fracción de cortocircuito) o la apertura de una pequeña cantidad de tejido muy perfundido. Por eso los métodos de titulación se apoyan, en mayor o menor medida, en la **mecánica**: presión de distensión, compliance, presión transpulmonar o distribución regional de la ventilación.

<!-- page: metodos-y-calculos | EXERCISE | Métodos de titulación y cálculos -->
<!-- block: THEORY | 1. Tablas FiO₂/PEEP de la red ARDS -->
Las tablas de la red ARDS asignan una PEEP a cada FiO₂ necesaria para alcanzar la meta de oxigenación (PaO₂ 55-80 mmHg o SpO₂ 88-95 %), con una PEEP mínima de 5 cmH₂O. Existen dos versiones; cada FiO₂ admite uno o varios escalones de PEEP, que se recorren en orden (NHLBI ARDS Network, 2008):

| FiO₂ | PEEP baja / FiO₂ alta (cmH₂O) | PEEP alta / FiO₂ baja (cmH₂O) |
|---|---|---|
| 0,3 | 5 | 5, 8, 10, 12, 14 |
| 0,4 | 5, 8 | 14, 16 |
| 0,5 | 8, 10 | 16, 18 |
| 0,5-0,8 | — | 20 |
| 0,6 | 10 | (dentro del tramo 0,5-0,8) |
| 0,7 | 10, 12, 14 | (dentro del tramo 0,5-0,8) |
| 0,8 | 14 | 22 |
| 0,9 | 14, 16, 18 | 22 |
| 1,0 | 18-24 | 22, 24 |

Son sencillas y reproducibles, pero no miden la mecánica del paciente: dos pacientes con la misma FiO₂ reciben la misma PEEP aunque uno tenga mucho pulmón reclutable y el otro casi nada. Además, la tabla sube la PEEP cuando empeora la oxigenación, y la hipoxemia no siempre se debe a colapso reclutable (también la producen la consolidación, el cortocircuito intracardíaco o la caída del gasto cardíaco).

<!-- block: THEORY | 2. Prueba decremental con mejor compliance -->
Se parte de una PEEP alta y se baja en escalones (por ejemplo de 2 cmH₂O), manteniendo el volumen corriente. En cada escalón se mide la presión meseta con pausa inspiratoria y se calcula:

$$
\Delta P = P_{plat} - PEEP \qquad C_{rs} = \frac{V_T}{\Delta P}
$$

donde $V_T$ es el volumen corriente (mL), $P_{plat}$ la presión meseta (cmH₂O), $PEEP$ la presión de fin de espiración (cmH₂O), $\Delta P$ la presión de distensión (cmH₂O) y $C_{rs}$ la compliance del sistema respiratorio (mL/cmH₂O). La PEEP con la mayor $C_{rs}$ (menor $\Delta P$ para el mismo volumen) se interpreta como el mejor equilibrio entre colapso y sobredistensión. En el ensayo ART se fijó la PEEP 2 cmH₂O por encima del nivel de mejor compliance, tras una maniobra de reclutamiento (Cavalcanti et al., 2017).

<!-- block: EXERCISE | Ejemplo resuelto: prueba decremental -->
Paciente con SDRA, $V_T = 400\,\text{mL}$ constante. Resultados de cada escalón:

| PEEP (cmH₂O) | Pplat (cmH₂O) | ΔP (cmH₂O) | Crs (mL/cmH₂O) |
|---|---|---|---|
| 20 | 36 | 16 | 25,0 |
| 18 | 33 | 15 | 26,7 |
| 16 | 29 | 13 | 30,8 |
| 14 | 26,5 | 12,5 | 32,0 |
| 12 | 25 | 13 | 30,8 |
| 10 | 25 | 15 | 26,7 |

Cálculo del escalón de 14 cmH₂O: $\Delta P = 26{,}5 - 14 = 12{,}5$ y $C_{rs} = 400/12{,}5 = 32{,}0\,\text{mL/cmH}_2\text{O}$.

**Lectura.** Por encima de 14 cmH₂O la compliance cae por sobredistensión (la Pplat de 36 cmH₂O a PEEP 20 supera además el límite de 30 cmH₂O del protocolo de la red ARDS) (NHLBI ARDS Network, 2008). Por debajo de 14 cmH₂O la compliance cae porque se pierden unidades: la Pplat ya no baja aunque baje la PEEP. El máximo está en 14 cmH₂O. Recuerda que, una vez recorrida la fase decremental por debajo de ese nivel, parte del pulmón ya se ha cerrado; por eso los protocolos que usan este método vuelven a abrir el pulmón antes de fijar la PEEP final, con los riesgos ya comentados de las maniobras.

<!-- block: THEORY | 3. Presión esofágica y presión transpulmonar -->
La presión esofágica ($P_{es}$) estima la presión pleural. Restándola de la presión en la vía aérea se obtiene la presión transpulmonar, que es la que realmente distiende el pulmón:

$$
P_{L} = P_{aw} - P_{es}
$$

Al final de la espiración, una $P_{L}$ negativa sugiere que la presión pleural supera a la alveolar y que las regiones dependientes tienden al colapso; ese es el razonamiento para subir la PEEP en pacientes con pared torácica rígida o presión abdominal alta. Ejemplo: PEEP 10 cmH₂O y $P_{es}$ de fin de espiración 14 cmH₂O dan $P_{L} = 10 - 14 = -4\,\text{cmH}_2\text{O}$.

El ensayo piloto EPVent (61 pacientes) mostró que ajustar la PEEP según la $P_{es}$ mejoraba la PaO₂/FiO₂ a las 72 horas en 88 mmHg y la compliance frente a la tabla convencional (Talmor et al., 2008). El ensayo EPVent-2 (200 pacientes con PaO₂/FiO₂ ≤ 200 mmHg) no encontró diferencias en el resultado combinado de muerte y días libres de ventilación frente a una tabla de PEEP alta, aunque el grupo guiado por $P_{es}$ necesitó menos terapias de rescate (Beitler et al., 2019).

<!-- block: THEORY | 4. Tomografía de impedancia eléctrica (mención) -->
La tomografía de impedancia eléctrica (EIT) usa un cinturón de electrodos en el tórax para mostrar cómo se distribuye la ventilación en cada región. Durante una prueba decremental permite estimar, píxel a píxel, cuánto colapso aparece al bajar la PEEP y cuánta sobredistensión había al subirla; un método propuesto elige la PEEP cerca del cruce entre ambas curvas (Costa et al., 2009). Es una herramienta prometedora y no invasiva, pero su beneficio sobre resultados clínicos no está demostrado.

![Dos curvas frente a PEEP: el porcentaje de colapso aumenta al disminuir la PEEP y el porcentaje de sobredistensión aumenta al subirla; ambas se cruzan en un nivel intermedio.](/learning/diagrams/a3-peep-eit-colapso-sobredistension.svg "Figura: lógica de la titulación con EIT; el nivel de PEEP se elige cerca del cruce entre colapso y sobredistensión")

<!-- page: lo-que-dice-la-evidencia | THEORY | Lo que dice la evidencia -->
<!-- block: THEORY | Ensayos de PEEP alta frente a baja -->
Tres ensayos grandes de la década de 2000 (ALVEOLI, LOVS y ExPress) compararon estrategias de PEEP alta y baja, todas con volumen corriente bajo. Ninguno mostró por sí solo una reducción significativa de la mortalidad. Su metanálisis con datos individuales de 2299 pacientes ofrece la visión más útil (Briel et al., 2010):

| Población | Mortalidad hospitalaria con PEEP alta | Con PEEP baja | Riesgo relativo ajustado |
|---|---|---|---|
| Todos los pacientes | 32,9 % | 35,2 % | 0,94 (no significativo) |
| PaO₂/FiO₂ ≤ 200 mmHg | 34,1 % | 39,1 % | 0,90 (IC 95 % 0,81-1,00) |
| PaO₂/FiO₂ > 200 mmHg | 27,2 % | 19,4 % | 1,37 (IC 95 % 0,98-1,92) |

La interpretación fisiológica es coherente con la reclutabilidad: los pacientes más hipoxémicos suelen tener más pulmón colapsado que ganar, mientras que en los menos graves la PEEP alta añade sobre todo sobredistensión. Las tasas de neumotórax y de uso de vasopresores fueron similares entre grupos (Briel et al., 2010).

<!-- block: THEORY | Estrategias basadas en la mecánica -->
Las estrategias que individualizan la PEEP con mecánica respiratoria tampoco han demostrado reducir la mortalidad. El ART, que combinaba MR y PEEP titulada por mejor compliance, aumentó la mortalidad a 28 días (55,3 % frente a 49,3 %) (Cavalcanti et al., 2017), aunque en ese ensayo es difícil separar el efecto de la maniobra del de la titulación. EPVent-2 fue neutral (Beitler et al., 2019).

<!-- block: CALLOUT:info | Una controversia abierta: las guías no coinciden -->
- **ESICM 2023:** no emite recomendación a favor ni en contra de la PEEP alta frente a la baja, ni de la titulación guiada por mecánica frente a las tablas, por ausencia de efecto demostrado en mortalidad (Grasselli et al., 2023).
- **ATS 2024:** sugiere PEEP más alta **sin** maniobras de reclutamiento frente a PEEP más baja en SDRA moderado o grave (recomendación condicional, certeza baja a moderada) (Qadir et al., 2024).

#### Cómo trasladar esta evidencia a la cabecera

Los ensayos comparan estrategias aplicadas a grupos, no el ajuste fino en un paciente. Por eso su resultado neutro no significa que la PEEP sea indiferente, sino que ninguna regla única funciona para todos. En la práctica conviene:

1. Clasificar la gravedad con la PaO₂/FiO₂ ya estabilizada, porque el posible beneficio de la PEEP alta se concentra en los pacientes más hipoxémicos.
2. Elegir un método explícito (tabla o mecánica) y registrar en cada cambio la presión meseta, la presión de distensión y la presión arterial.
3. Reconocer a tiempo al paciente que no responde: si al subir la PEEP la presión de distensión aumenta y la hemodinamia empeora, el pulmón probablemente tiene poco tejido reclutable.

La lectura práctica es que la PEEP alta probablemente beneficia a los pacientes más graves y con pulmón reclutable, pero ningún método de titulación ha demostrado ser superior. Elige un método, aplícalo de forma sistemática y vigila siempre la presión meseta, la presión de distensión y la hemodinamia.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: titular la PEEP en un SDRA moderado -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Varón de 64 años, 175 cm (peso predicho 70,6 kg), SDRA moderado por sepsis abdominal, 24 horas de ventilación. VCV con $V_T = 420\,\text{mL}$ (6 mL/kg de peso predicho), FR 24/min, PEEP 8 cmH₂O, FiO₂ 0,7. Pplat 24 cmH₂O. PaO₂ 70 mmHg (PaO₂/FiO₂ = 100). Presión arterial media 70 mmHg con noradrenalina estable.

**Paso 1. ¿Qué indica la tabla?** Con FiO₂ 0,7, la tabla de PEEP baja propone 10-14 cmH₂O y la de PEEP alta aún más, hasta 20 cmH₂O (NHLBI ARDS Network, 2008). Con PEEP 8, el paciente está por debajo de ambas.

**Paso 2. Mecánica inicial.** $\Delta P = 24 - 8 = 16\,\text{cmH}_2\text{O}$; $C_{rs} = 420/16 = 26{,}3\,\text{mL/cmH}_2\text{O}$.

**Paso 3. Prueba de PEEP.** Subes la PEEP a 12 cmH₂O y, tras unos minutos, la Pplat es 26 cmH₂O: $\Delta P = 14$, $C_{rs} = 30\,\text{mL/cmH}_2\text{O}$. La compliance mejoró, la presión de distensión bajó y la Pplat sigue por debajo de 30 cmH₂O (NHLBI ARDS Network, 2008). Es una respuesta compatible con reclutamiento.

**Paso 4. Un escalón más.** A PEEP 14 la Pplat es 29 cmH₂O: $\Delta P = 15$, $C_{rs} = 28\,\text{mL/cmH}_2\text{O}$, y la presión arterial media cae a 63 mmHg. La compliance empeora y aparece repercusión hemodinámica: el beneficio marginal ya no compensa.

**Paso 5. Decisión.** Vuelves a PEEP 12 cmH₂O, compruebas que la presión arterial se recupera y bajas la FiO₂ según la SpO₂ objetivo de 88-95 % (NHLBI ARDS Network, 2008). Repites la medición de la mecánica tras cada cambio de PEEP o de volumen. Con PaO₂/FiO₂ todavía por debajo de 150 mmHg tras la estabilización, este paciente es candidato a decúbito prono (Grasselli et al., 2023).

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA por sepsis»](/simulador?tab=simular&case=july-sdra-sepsis) y realiza una prueba de PEEP:

1. En VCV, anota la presión meseta con pausa inspiratoria a la PEEP inicial y calcula la presión de distensión.
2. Sube la PEEP de 2 en 2 cmH₂O y repite el cálculo; observa si la presión de distensión baja (ganancia de pulmón) o sube (sobredistensión).
3. Vigila a la vez la presión arterial media y la SpO₂: identifica el nivel en que la mejoría de oxigenación se acompaña de deterioro hemodinámico.

<!-- block: EXERCISE | Preguntas -->
**1. En una prueba decremental con $V_T$ 450 mL, a PEEP 16 la Pplat es 31 y a PEEP 14 es 27 cmH₂O. ¿Cuál tiene mejor compliance?**
A PEEP 16: $\Delta P = 15$, $C_{rs} = 30$. A PEEP 14: $\Delta P = 13$, $C_{rs} \approx 34{,}6\,\text{mL/cmH}_2\text{O}$. Es mejor a PEEP 14, y además a 16 se supera la Pplat de 30 cmH₂O (NHLBI ARDS Network, 2008).

**2. Con PEEP 12 y $P_{es}$ de fin de espiración 9 cmH₂O, ¿cuál es la presión transpulmonar espiratoria?**
$P_{L} = 12 - 9 = +3\,\text{cmH}_2\text{O}$: positiva, sin tendencia teórica al colapso dependiente.

**3. ¿Qué recomienda la ESICM 2023 sobre PEEP alta frente a baja?**
No emite recomendación a favor ni en contra, porque los ensayos no muestran efecto en mortalidad (Grasselli et al., 2023).

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La PEEP equilibra dos riesgos opuestos: colapso cíclico en las zonas dependientes y sobredistensión en las no dependientes.
- Las tablas de la red ARDS ligan la PEEP a la FiO₂ para una meta de PaO₂ 55-80 mmHg o SpO₂ 88-95 % (NHLBI ARDS Network, 2008).
- En una prueba decremental, la PEEP con mayor compliance (menor ΔP para el mismo volumen) marca el mejor compromiso mecánico.
- La presión transpulmonar ($P_{aw} - P_{es}$) ayuda en pacientes con pared torácica rígida, pero EPVent-2 no mostró beneficio clínico (Beitler et al., 2019).
- Ningún ensayo individual de PEEP alta frente a baja redujo la mortalidad; el metanálisis sugiere beneficio con PaO₂/FiO₂ ≤ 200 mmHg (Briel et al., 2010).
- Las guías discrepan: la ATS 2024 sugiere PEEP alta sin MR y la ESICM 2023 no emite recomendación (Qadir et al., 2024; Grasselli et al., 2023).
- Cada cambio de PEEP exige medir de nuevo Pplat, ΔP y hemodinamia.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Elegir la PEEP solo por la SpO₂** → la oxigenación puede mejorar por caída del gasto cardíaco o redistribución del flujo → combina oxigenación con ΔP, compliance y presión arterial.
- **Aplicar la tabla de PEEP alta a un SDRA leve** → en pacientes sin SDRA moderado-grave la PEEP alta no mostró beneficio y la tendencia fue desfavorable (Briel et al., 2010) → ajusta la estrategia a la gravedad.
- **Subir la PEEP sin volver a medir la Pplat** → la presión meseta puede superar 30 cmH₂O sin que lo notes (NHLBI ARDS Network, 2008) → mide con pausa inspiratoria tras cada cambio.
- **Interpretar la $P_{es}$ como un valor exacto** → estima la presión pleural en la región media del tórax, no en todas las regiones → úsala como tendencia y dentro de un protocolo.
- **Confundir la prueba decremental con una maniobra de reclutamiento obligatoria** → la ATS 2024 sugiere PEEP alta sin maniobras prolongadas (Qadir et al., 2024) → separa la decisión de titular de la de reclutar.

<!-- block: REFERENCES | Referencias -->
- Beitler, J. R., Sarge, T., Banner-Goodspeed, V. M., Gong, M. N., Cook, D., Novack, V., Loring, S. H., Talmor, D., & EPVent-2 Study Group. (2019). Effect of titrating positive end-expiratory pressure (PEEP) with an esophageal pressure-guided strategy vs an empirical high PEEP-FiO₂ strategy on death and days free from mechanical ventilation among patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 321*(9), 846–857. [https://doi.org/10.1001/jama.2019.0555](https://doi.org/10.1001/jama.2019.0555)
- Briel, M., Meade, M., Mercat, A., Brower, R. G., Talmor, D., Walter, S. D., ... Guyatt, G. (2010). Higher vs lower positive end-expiratory pressure in patients with acute lung injury and acute respiratory distress syndrome: Systematic review and meta-analysis. *JAMA, 303*(9), 865–873. [https://doi.org/10.1001/jama.2010.218](https://doi.org/10.1001/jama.2010.218)
- Cavalcanti, A. B., Suzumura, É. A., Laranjeira, L. N., Paisani, D. M., Damiani, L. P., Guimarães, H. P., ... Ribeiro de Carvalho, C. R.; Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial (ART) Investigators. (2017). Effect of lung recruitment and titrated positive end-expiratory pressure (PEEP) vs low PEEP on mortality in patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 318*(14), 1335–1345. [https://doi.org/10.1001/jama.2017.14171](https://doi.org/10.1001/jama.2017.14171)
- Costa, E. L. V., Borges, J. B., Melo, A., Suarez-Sipmann, F., Toufen, C., Bohm, S. H., & Amato, M. B. P. (2009). Bedside estimation of recruitable alveolar collapse and hyperdistension by electrical impedance tomography. *Intensive Care Medicine, 35*(6), 1132–1137. [https://doi.org/10.1007/s00134-009-1447-y](https://doi.org/10.1007/s00134-009-1447-y)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... European Society of Intensive Care Medicine Taskforce on ARDS. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- NHLBI ARDS Network. (2008). *NIH NHLBI ARDS Clinical Network mechanical ventilation protocol summary* [Protocolo clínico]. National Heart, Lung, and Blood Institute. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24–36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Talmor, D., Sarge, T., Malhotra, A., O'Donnell, C. R., Ritz, R., Lisbon, A., Novack, V., & Loring, S. H. (2008). Mechanical ventilation guided by esophageal pressure in acute lung injury. *New England Journal of Medicine, 359*(20), 2095–2104. [https://doi.org/10.1056/NEJMoa0708638](https://doi.org/10.1056/NEJMoa0708638)
