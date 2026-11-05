<!-- page: fisiologia-del-reclutamiento | THEORY | Fisiología del colapso y del reclutamiento -->
<!-- block: INTRODUCTION | Por qué importa -->
En el síndrome de dificultad respiratoria aguda (SDRA) una parte del pulmón deja de recibir gas: los alvéolos se llenan de edema o se colapsan bajo el peso del tejido que tienen encima. Ese tejido sin aire sigue recibiendo sangre, y la sangre que lo atraviesa vuelve al corazón izquierdo sin oxigenarse (cortocircuito o *shunt*). Además, el volumen corriente que programas se reparte solo entre las unidades que permanecen abiertas, de modo que un pulmón con mucho colapso se comporta como un pulmón pequeño sometido a más estrés por cada mililitro.

Reclutar significa volver a airear unidades colapsadas aplicando una presión transpulmonar suficiente. La idea es atractiva: más pulmón abierto implicaría mejor oxigenación y una distribución más uniforme del volumen corriente. Sin embargo, la presión necesaria para abrir también distiende las zonas que ya estaban abiertas y aumenta la presión intratorácica, con efectos sobre el retorno venoso y el ventrículo derecho. Esta lección explica la fisiología que justifica las maniobras de reclutamiento (MR), cómo estimar si un paciente concreto tiene pulmón reclutable y por qué la evidencia actual desaconseja las maniobras prolongadas a alta presión.

<!-- block: THEORY | Presión de apertura, presión de cierre e histéresis -->
Una unidad alveolar colapsada no se abre a la misma presión a la que se cierra. Para abrirla hay que vencer la tensión superficial de un alvéolo pequeño o despegar una vía aérea distal ocluida; esa **presión de apertura** es mayor que la **presión de cierre**, es decir, la presión por debajo de la cual una unidad ya abierta vuelve a colapsarse. Esta asimetría produce la **histéresis** de la curva presión-volumen (P-V): con la misma presión, el pulmón contiene más volumen en la rama de desinsuflado que en la de insuflado.

La histéresis es la base fisiológica de toda estrategia de reclutamiento seguida de PEEP:

1. Una presión inspiratoria alta (la maniobra) abre unidades.
2. Una PEEP por encima de la presión de cierre de esas unidades evita que vuelvan a colapsarse al final de cada espiración.
3. Si la PEEP queda por debajo de la presión de cierre, el beneficio se pierde en minutos y las unidades se abren y cierran con cada ciclo (atelectrauma).

![Curva presión-volumen con rama de insuflado en forma de S y rama de desinsuflado por encima de ella; una línea vertical a la misma PEEP corta la rama de desinsuflado a un volumen mayor que la de insuflado.](/learning/diagrams/a3-mr-histeresis.svg "Figura: histéresis de la curva P-V; a igual PEEP, el pulmón previamente reclutado conserva más volumen")

#### El pulmón del SDRA no es homogéneo

En decúbito supino, el peso del pulmón edematoso comprime las regiones dorsales (dependientes). Coexisten tres tipos de tejido: zonas ventrales normalmente aireadas o incluso sobredistendidas, zonas intermedias inestables que se abren y cierran con el ciclo respiratorio, y zonas dorsales consolidadas que no se abren con ninguna presión clínicamente razonable. Solo la segunda categoría es reclutable de verdad; la consolidación por exudado o neumonía no se «abre» con presión.

<!-- block: THEORY | La reclutabilidad varía mucho entre pacientes -->
En un estudio con tomografía computarizada de 68 pacientes ventilados a 5, 15 y 45 cmH₂O, el porcentaje de pulmón potencialmente reclutable fue en promedio del 13 % (desviación estándar 11 %) del peso pulmonar, con una mediana del 9 %, y en promedio un 24 % del pulmón no pudo reclutarse ni siquiera a 45 cmH₂O (Gattinoni et al., 2006). La consecuencia práctica es doble:

- Un mismo nivel de PEEP o una misma maniobra produce efectos opuestos según el paciente: en quien tiene mucho tejido reclutable mejora la aireación; en quien tiene poco, solo sobredistiende las zonas ya abiertas.
- Los pacientes con mayor reclutabilidad tenían pulmones más pesados, peor oxigenación, menor compliance y mayor mortalidad (Gattinoni et al., 2006). La mejoría de la PaO₂ durante una maniobra no garantiza que el pulmón se haya protegido.

Por eso, antes de pensar en una técnica concreta, la pregunta clínica es: **¿este pulmón tiene tejido que se pueda reclutar con un coste aceptable?** La siguiente página muestra una forma de estimarlo a la cabecera del paciente sin tomografía.

<!-- page: estimar-reclutabilidad | EXERCISE | Estimar la reclutabilidad: la relación R/I -->
<!-- block: THEORY | De qué se trata -->
Chen y colaboradores describieron un método de una sola respiración para estimar cuánto volumen recluta la PEEP (Chen et al., 2020). Se ventila al paciente con PEEP alta (15 cmH₂O en el estudio original) y se baja bruscamente a PEEP baja (5 cmH₂O) durante una espiración. El volumen que sale en esa espiración (por encima del volumen corriente) es la diferencia de volumen pulmonar al final de la espiración entre ambos niveles de PEEP ($\Delta EELV$). Parte de esa diferencia se explica solo por la compliance del pulmón ya abierto; lo que sobra corresponde al volumen **reclutado** por la PEEP alta.

La idea clave es comparar la compliance del tejido reclutado con la compliance del pulmón que ya estaba abierto a PEEP baja. Si el tejido que se abre al subir la PEEP se comporta casi como pulmón normal, la PEEP está ganando pulmón; si casi no se abre nada, la PEEP adicional se gasta en distender lo que ya estaba abierto.

<!-- block: EQUATION | Volumen reclutado -->
V_{rec} = \Delta EELV - C_{rs,baja}\cdot\left(PEEP_{alta} - PEEP_{baja}\right)

<!-- block: EQUATION | Compliance del pulmón reclutado -->
C_{rec} = \frac{V_{rec}}{PEEP_{alta} - PEEP_{baja}}

<!-- block: EQUATION | Relación reclutamiento/insuflación -->
\frac{R}{I} = \frac{C_{rec}}{C_{rs,baja}}

<!-- block: THEORY | Símbolos y unidades -->
| Símbolo | Significado | Unidad |
|---|---|---|
| $\Delta EELV$ | Volumen espirado extra al pasar de PEEP alta a PEEP baja en una sola espiración | mL |
| $C_{rs,baja}$ | Compliance del sistema respiratorio medida a PEEP baja: $V_T/(P_{plat}-PEEP)$ | mL/cmH₂O |
| $PEEP_{alta}$, $PEEP_{baja}$ | Niveles de PEEP comparados | cmH₂O |
| $V_{rec}$ | Volumen reclutado por la PEEP alta | mL |
| $C_{rec}$ | Compliance del tejido reclutado | mL/cmH₂O |
| $R/I$ | Relación reclutamiento/insuflación | adimensional |

Si el paciente tiene cierre completo de la vía aérea con una presión de apertura superior a la PEEP baja, en las fórmulas se sustituye $PEEP_{baja}$ por esa presión de apertura; en el estudio original, cuando el cierre de la vía aérea superaba la PEEP alta no fue posible calcular el reclutamiento (Chen et al., 2020).

En la cohorte original de 45 pacientes, la mediana de R/I fue 0,5 (rango 0 a 2,0) y se usó para separar reclutadores altos y bajos: con PEEP 15 cmH₂O los reclutadores altos oxigenaron mejor, mientras que los bajos tuvieron menor presión arterial sistólica (Chen et al., 2020). No es un umbral validado para decidir resultados clínicos, sino una herramienta fisiológica para orientar la PEEP.

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente con SDRA ventilado con $V_T = 420\,\text{mL}$. A PEEP 5 cmH₂O la presión meseta es 19 cmH₂O.

**Paso 1. Compliance a PEEP baja.**

$$
C_{rs,baja} = \frac{420}{19 - 5} = 30\,\text{mL/cmH}_2\text{O}
$$

**Paso 2. Volumen que explicaría solo la compliance.** Al pasar de 15 a 5 cmH₂O, el pulmón ya abierto devolvería $30 \times 10 = 300\,\text{mL}$.

**Paso 3. Volumen medido.** En la espiración de liberación se mide un $\Delta EELV$ de 540 mL.

$$
V_{rec} = 540 - 300 = 240\,\text{mL}
$$

**Paso 4. Compliance reclutada y relación R/I.**

$$
C_{rec} = \frac{240}{10} = 24\,\text{mL/cmH}_2\text{O} \qquad \frac{R}{I} = \frac{24}{30} = 0{,}8
$$

**Interpretación.** El tejido que abre la PEEP alta tiene una compliance cercana a la del pulmón ya aireado: este paciente se comporta como reclutador alto, y una PEEP más alta probablemente gane pulmón. Con un $\Delta EELV$ de 330 mL, el resultado habría sido $V_{rec} = 30\,\text{mL}$ y $R/I = 0{,}1$: subir la PEEP sobre todo distendería el pulmón ya abierto.

<!-- block: CALLOUT:info | Qué no mide la relación R/I -->
La R/I estima el reclutamiento entre dos niveles de PEEP, no el efecto de una maniobra a muy alta presión. Tampoco informa de la hemodinámica ni de la sobredistensión regional. Interprétala junto con la presión de distensión, la presión meseta, la oxigenación y la presión arterial.

<!-- page: tecnicas-y-evidencia | THEORY | Técnicas de reclutamiento y lo que dicen los ensayos -->
<!-- block: THEORY | Las técnicas clásicas -->
Se han usado básicamente dos familias de maniobras:

- **Insuflación sostenida.** Se mantiene una presión continua en la vía aérea durante un tiempo corto. El ensayo LOVS, por ejemplo, empleó una pausa a 40 cmH₂O durante 40 segundos (Grasselli et al., 2023).
- **Maniobra escalonada (en escalera).** En modo controlado por presión se va subiendo la PEEP por escalones con una presión de distensión fija, y después se baja de forma progresiva para buscar el nivel de PEEP que mantiene abierto el pulmón (titulación decremental). Una revisión clásica prefirió el abordaje escalonado sobre la insuflación sostenida (Hess, 2015).

![Esquema de presión en la vía aérea frente al tiempo: escalones de PEEP crecientes con ciclos de presión de amplitud constante, seguidos de escalones decrecientes hasta una PEEP final.](/learning/diagrams/a3-mr-escalera.svg "Figura: estructura de una maniobra escalonada con titulación decremental (esquema, no es un protocolo)")

Las guías actuales clasifican las maniobras por presión y duración. Una **MR prolongada a alta presión** es la que mantiene una presión en la vía aérea de al menos 35 cmH₂O durante un minuto o más; una **MR breve** mantiene al menos 35 cmH₂O durante menos de un minuto (Grasselli et al., 2023). La guía de la ATS de 2024 define la maniobra prolongada de forma equivalente: PEEP de al menos 35 cmH₂O durante más de 60 segundos (Qadir et al., 2024).

<!-- block: THEORY | El ensayo ART (2017): un punto de inflexión -->
El ensayo ART aleatorizó a 1010 pacientes con SDRA moderado o grave a una estrategia de MR escalonada con titulación de PEEP según la mejor compliance o a una estrategia de PEEP baja. La maniobra subía la PEEP por escalones hasta 45 cmH₂O y, tras varios paros cardíacos reanimados, el protocolo se modificó a una maniobra de menor presión y duración (Cavalcanti et al., 2017). Los resultados fueron contrarios a la hipótesis (Cavalcanti et al., 2017):

| Resultado | MR + PEEP titulada | PEEP baja |
|---|---|---|
| Mortalidad a 28 días | 55,3 % | 49,3 % |
| Mortalidad a 6 meses | 65,3 % | 59,9 % |
| Neumotórax con drenaje (7 días) | 3,2 % | 1,2 % |
| Barotrauma (7 días) | 5,6 % | 1,6 % |

El cociente de riesgos para la mortalidad a 28 días fue 1,20 (IC 95 % 1,01 a 1,42). En otras palabras, oxigenar mejor no se tradujo en sobrevivir más: la estrategia agresiva aumentó el daño.

<!-- block: THEORY | Recomendaciones vigentes -->
La evidencia ha cambiado en pocos años y las guías lo reflejan:

- **ATS/ESICM/SCCM 2017:** recomendación condicional a favor de las MR en SDRA moderado o grave, con confianza baja en la evidencia (Fan et al., 2017). Fue anterior al análisis completo del ART.
- **ESICM 2023:** recomendación **fuerte en contra** de las MR prolongadas a alta presión para reducir la mortalidad (evidencia moderada) y sugerencia **débil en contra** del uso rutinario de MR breves a alta presión (Grasselli et al., 2023).
- **ATS 2024:** recomendación **fuerte en contra** de las MR prolongadas en SDRA moderado o grave (certeza moderada); sugiere una PEEP más alta **sin** MR frente a una PEEP más baja (recomendación condicional) (Qadir et al., 2024).

La guía europea añade que la hipotensión y la desaturación son los efectos adversos más frecuentes durante o justo después de una maniobra, cada uno en torno al 10 % de los pacientes, y que puede aparecer bradicardia (Grasselli et al., 2023).

<!-- block: CALLOUT:warning | Lo que no cambió -->
Que las MR rutinarias estén desaconsejadas no significa que la reaireación pulmonar sea irrelevante. Significa que, en la población estudiada, aplicar presiones muy altas de forma sistemática hizo más daño que beneficio. Cualquier maniobra que se considere en un paciente concreto (por ejemplo, desaturación tras una desconexión) es una decisión individual, con monitorización hemodinámica continua, límites de presión acordados y criterios de interrupción definidos por el protocolo de tu unidad.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: ¿reclutar o no reclutar? -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Mujer de 58 años, 165 cm (peso corporal predicho 57 kg), con SDRA moderado por neumonía neumocócica, segundo día de ventilación mecánica. Recibe VCV con $V_T = 340\,\text{mL}$ (6 mL/kg de peso predicho), FR 26/min, PEEP 10 cmH₂O, FiO₂ 0,6. Presión meseta 25 cmH₂O, presión arterial media 72 mmHg con noradrenalina a dosis baja. PaO₂ 78 mmHg (PaO₂/FiO₂ 130).

**Evento.** Durante un cambio de filtro el circuito se desconecta unos segundos. Al reconectar, la SpO₂ baja de 93 % a 84 % y la presión meseta, con el mismo volumen, sube a 28 cmH₂O.

**Razonamiento paso a paso.**

1. **Descarta primero las causas que no son colapso.** Comprueba la posición del tubo, secreciones, neumotórax y el funcionamiento del circuito (lista de verificación del deterioro agudo). Un colapso por desconexión es probable, pero no es el único diagnóstico.
2. **Interpreta la mecánica.** Con el mismo volumen, la presión de distensión pasó de $25 - 10 = 15$ a $28 - 10 = 18\,\text{cmH}_2\text{O}$: la compliance cayó de $340/15 \approx 23$ a $340/18 \approx 19\,\text{mL/cmH}_2\text{O}$. Es coherente con pérdida de unidades ventiladas.
3. **Evita una maniobra prolongada a alta presión.** Las guías actuales la desaconsejan con recomendación fuerte (Grasselli et al., 2023; Qadir et al., 2024), y la paciente ya necesita vasopresor, lo que aumenta el riesgo de hipotensión.
4. **Prioriza medidas de bajo riesgo.** Aumenta temporalmente la FiO₂, revisa que la PEEP programada sea la correcta y deja pasar unos minutos de ventilación con la PEEP habitual: parte del pulmón se reairea con ventilación protectora sin picos de presión. Evita nuevas desconexiones (pinza el tubo si debes cambiar componentes y usa sistemas cerrados de aspiración si tu unidad lo indica).
5. **Si persiste la hipoxemia**, la decisión de cualquier maniobra breve corresponde al equipo responsable según el protocolo local, con límites de presión y criterios de interrupción definidos, presión arterial invasiva y tras comprobar la volemia. Paralelamente, valora si la paciente ya cumple criterios para decúbito prono, que sí tiene beneficio demostrado en mortalidad en SDRA con PaO₂/FiO₂ < 150 mmHg (Grasselli et al., 2023).
6. **Reevalúa.** Tras 15 a 30 minutos, recalcula la presión de distensión y la compliance. Si vuelven a los valores previos, la pérdida de aireación se recuperó sin recurrir a presiones altas.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y prueba lo siguiente:

1. En VCV con volumen fijo, sube la PEEP en pasos de 2 cmH₂O y observa cómo cambia la presión meseta: calcula en cada paso la presión de distensión y la compliance.
2. Fíjate si la SpO₂ mejora a la vez que la presión arterial media desciende; ese es el compromiso que debes vigilar en cualquier aumento de presión intratorácica.
3. Vuelve a la PEEP inicial y comprueba si la mecánica regresa al punto de partida.

<!-- block: EXERCISE | Preguntas -->
**1. Un paciente tiene R/I de 0,2 y otro de 0,9. ¿En cuál esperas más beneficio de subir la PEEP?**
En el de 0,9: el tejido que se abre con la PEEP alta tiene una compliance parecida a la del pulmón aireado, es decir, se gana pulmón. Con 0,2, la mayor parte del aumento de presión distiende tejido ya abierto, con más riesgo de sobredistensión y de efectos hemodinámicos (Chen et al., 2020).

**2. ¿Qué definición usan las guías para una MR prolongada a alta presión?**
Presión en la vía aérea de al menos 35 cmH₂O mantenida durante un minuto o más (Grasselli et al., 2023).

**3. En el ART, la estrategia experimental mejoró la oxigenación. ¿Por qué no basta ese dato?**
Porque la mortalidad a 28 días fue mayor (55,3 % frente a 49,3 %) y hubo más barotrauma (Cavalcanti et al., 2017). La oxigenación es una variable intermedia; lo que importa es el daño pulmonar y hemodinámico.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La histéresis de la curva P-V explica por qué una PEEP adecuada puede mantener abiertas unidades que una presión mayor abrió antes.
- La reclutabilidad es muy variable: en una cohorte con tomografía el pulmón reclutable promedió el 13 % del peso pulmonar, con gran dispersión (Gattinoni et al., 2006).
- La relación R/I estima a la cabecera si subir la PEEP gana pulmón o solo lo distiende (Chen et al., 2020).
- En el ART, la MR escalonada con PEEP titulada aumentó la mortalidad y el barotrauma frente a PEEP baja (Cavalcanti et al., 2017).
- ESICM 2023 y ATS 2024 recomiendan con fuerza no usar MR prolongadas a alta presión (Grasselli et al., 2023; Qadir et al., 2024).
- La ESICM sugiere además no usar de rutina las MR breves a alta presión (Grasselli et al., 2023).
- Mejorar la PaO₂ no equivale a proteger el pulmón: evalúa siempre mecánica y hemodinamia.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Hacer una MR «por protocolo» a todo SDRA** → la reclutabilidad varía y la estrategia sistemática aumentó la mortalidad en el ART → individualiza y sigue las guías actuales.
- **Juzgar el éxito solo por la SpO₂** → la oxigenación puede mejorar mientras aumenta la sobredistensión o cae el gasto cardíaco → mide presión de distensión, compliance y presión arterial.
- **Reclutar con bolsa manual** → no controla la presión ni el volumen y la desconexión posterior anula la PEEP → si el equipo decide una maniobra, hazla con el ventilador y con límites definidos.
- **Reclutar y luego dejar una PEEP baja** → las unidades vuelven a cerrarse en minutos → cualquier reclutamiento solo tiene sentido con una PEEP que lo mantenga.
- **Ignorar las causas no pulmonares de desaturación** → un tubo desplazado o un neumotórax no se tratan con presión → aplica primero la evaluación sistemática del deterioro agudo.

<!-- block: REFERENCES | Referencias -->
- Cavalcanti, A. B., Suzumura, É. A., Laranjeira, L. N., Paisani, D. M., Damiani, L. P., Guimarães, H. P., ... Ribeiro de Carvalho, C. R.; Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial (ART) Investigators. (2017). Effect of lung recruitment and titrated positive end-expiratory pressure (PEEP) vs low PEEP on mortality in patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 318*(14), 1335–1345. [https://doi.org/10.1001/jama.2017.14171](https://doi.org/10.1001/jama.2017.14171)
- Chen, L., Del Sorbo, L., Grieco, D. L., Junhasavasdikul, D., Rittayamai, N., Soliman, I., Sklar, M. C., Rauseo, M., Ferguson, N. D., Fan, E., Richard, J.-C. M., & Brochard, L. (2020). Potential for lung recruitment estimated by the recruitment-to-inflation ratio in acute respiratory distress syndrome: A clinical trial. *American Journal of Respiratory and Critical Care Medicine, 201*(2), 178–187. [https://doi.org/10.1164/rccm.201902-0334OC](https://doi.org/10.1164/rccm.201902-0334OC)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253–1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Gattinoni, L., Caironi, P., Cressoni, M., Chiumello, D., Ranieri, V. M., Quintel, M., Russo, S., Patroniti, N., Cornejo, R., & Bugedo, G. (2006). Lung recruitment in patients with the acute respiratory distress syndrome. *New England Journal of Medicine, 354*(17), 1775–1786. [https://doi.org/10.1056/NEJMoa052052](https://doi.org/10.1056/NEJMoa052052)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... European Society of Intensive Care Medicine Taskforce on ARDS. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Hess, D. R. (2015). Recruitment maneuvers and PEEP titration. *Respiratory Care, 60*(11), 1688–1704. [https://doi.org/10.4187/respcare.04409](https://doi.org/10.4187/respcare.04409)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24–36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
