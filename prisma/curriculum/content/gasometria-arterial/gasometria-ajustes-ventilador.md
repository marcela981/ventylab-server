<!-- page: oxigenacion-y-metas | THEORY | Oxigenación: PaO₂/FiO₂ y metas -->
<!-- block: INTRODUCTION | Del diagnóstico a la decisión -->
En la lección «Interpretación sistemática del equilibrio ácido-base» aprendiste a leer una gasometría. Ahora toca usarla para decidir. En el paciente ventilado, la gasometría responde a dos preguntas independientes: ¿la oxigenación es suficiente y segura?, y ¿la ventilación alveolar elimina el CO₂ que el paciente produce? Separarlas es esencial, porque cada una se corrige con palancas distintas del ventilador. Confundirlas lleva a errores típicos, como aumentar la frecuencia respiratoria para corregir una hipoxemia o subir la FiO₂ ante una hipercapnia.

![Esquema de dos columnas: a la izquierda la oxigenación (PaO₂) depende de FiO₂, PEEP y presión media de la vía aérea; a la derecha la ventilación (PaCO₂) depende de la ventilación alveolar, es decir de frecuencia y volumen corriente menos espacio muerto](/learning/diagrams/i6-ajustes-palancas.svg "Figura: palancas de la oxigenación y de la ventilación")

<!-- block: THEORY | Qué determina la PaO₂ -->
La PaO₂ depende sobre todo de la fracción inspirada de oxígeno y de cuánto pulmón participa en el intercambio. En el pulmón enfermo, el problema dominante es el shunt y las zonas de baja relación ventilación/perfusión: alvéolos colapsados u ocupados que reciben sangre pero no ventilan. Aumentar la FiO₂ ayuda poco en un shunt verdadero, porque la sangre que atraviesa esas zonas nunca entra en contacto con el gas. Lo que sí mejora la oxigenación en ese escenario es abrir y mantener abiertas unidades alveolares, y eso se consigue con la PEEP y, en general, con la presión media de la vía aérea. El tiempo inspiratorio también aumenta la presión media, pero acorta el espiratorio.

<!-- block: THEORY | El cociente PaO₂/FiO₂ -->
La PaO₂ aislada no sirve para comparar: una PaO₂ de 80 mmHg es normal con aire ambiente y muy preocupante con FiO₂ 0,8. Por eso se usa el cociente PaO₂/FiO₂, con la FiO₂ expresada como fracción:

$$
\frac{PaO_2}{FiO_2} = \frac{80\,\text{mmHg}}{0{,}8} = 100\,\text{mmHg}
$$

La definición de Berlín del síndrome de dificultad respiratoria aguda (SDRA) clasifica la gravedad con este cociente, medido con PEEP de al menos 5 cmH₂O: leve entre 200 y 300 mmHg, moderado entre 100 y 200 mmHg, y grave por debajo de 100 mmHg (ARDS Definition Task Force, 2012). La definición global de 2024 amplió el criterio y acepta también el cociente SpO₂/FiO₂ ≤ 315 cuando la SpO₂ es ≤ 97 %, lo que permite diagnosticar sin gasometría arterial en entornos con pocos recursos (Matthay et al., 2024). El cociente tiene límites: cambia con la PEEP y con la propia FiO₂, así que compara siempre valores obtenidos en condiciones similares.

<!-- block: THEORY | Metas de oxigenación -->
Tanto la hipoxemia como la hiperoxia son perjudiciales, y la meta adecuada depende del paciente:

- En el SDRA, el protocolo de la red ARDS fijó como meta una PaO₂ de 55 a 80 mmHg o una SpO₂ de 88 a 95 % (Acute Respiratory Distress Syndrome Network, 2000).
- En pacientes adultos con insuficiencia respiratoria hipoxémica aguda en la UCI, el ensayo HOT-ICU comparó una meta de PaO₂ de 60 mmHg frente a 90 mmHg y no encontró diferencias en la mortalidad a 90 días (Schjørring et al., 2021).
- En el paciente con lesión cerebral aguda, el consenso de la ESICM recomienda una PaO₂ de 80 a 120 mmHg (Robba et al., 2020).

La evidencia sobre metas de oxígeno sigue evolucionando y los ensayos no siempre coinciden; lo constante es evitar tanto valores bajos sostenidos como la hiperoxia innecesaria. Cuando la PaO₂ está por encima de la meta, baja primero la FiO₂: reduce la exposición a oxígeno sin perder reclutamiento.

<!-- block: CALLOUT:info | Oxigenación y ventilación son problemas distintos -->
Un paciente puede tener una PaO₂ excelente y una PaCO₂ de 70 mmHg, o una PaCO₂ normal con hipoxemia grave. Antes de tocar el ventilador, decide cuál de los dos problemas estás tratando y elige la palanca correspondiente.

<!-- page: correccion-paco2 | EXERCISE | Fórmulas: cómo corregir la PaCO₂ con la ventilación -->
<!-- block: THEORY | La ecuación de la ventilación alveolar -->
La PaCO₂ refleja el equilibrio entre el CO₂ que produce el metabolismo y el que elimina la ventilación alveolar (West y Luks, 2021):

$$
PaCO_2 = \frac{\dot{V}CO_2 \cdot 0{,}863}{\dot{V}_A}
$$

- $PaCO_2$: presión arterial de CO₂, en mmHg.
- $\dot{V}CO_2$: producción de CO₂, en mL/min.
- $\dot{V}_A$: ventilación alveolar, en L/min.
- $0{,}863$: constante que ajusta unidades y condiciones de medición.

La ventilación alveolar es la parte de la ventilación minuto que llega a alvéolos perfundidos:

$$
\dot{V}_A = (V_T - V_D) \cdot FR
$$

donde $V_T$ es el volumen corriente, $V_D$ el espacio muerto (anatómico, alveolar e instrumental, incluido el que añaden filtros y conexiones) y $FR$ la frecuencia respiratoria. La relación entre PaCO₂ y ventilación alveolar es hiperbólica: si duplicas $\dot{V}_A$, la PaCO₂ se reduce a la mitad. Cuando la PaCO₂ es alta, un pequeño aumento de ventilación produce un gran descenso; cuando es baja, hace falta mucha ventilación para seguir bajándola.

![Gráfica hiperbólica de PaCO₂ frente a ventilación alveolar para una producción de CO₂ constante: la PaCO₂ cae bruscamente al aumentar una ventilación alveolar baja y se aplana a ventilaciones altas; se marca la banda normal de 35 a 45 mmHg](/learning/diagrams/i6-ajustes-paco2-ventilacion-alveolar.svg "Figura: relación hiperbólica entre PaCO₂ y ventilación alveolar")

<!-- block: EQUATION | Ajuste de la ventilación para una PaCO₂ objetivo -->
\dot{V}_{A\,\text{nueva}} = \dot{V}_{A\,\text{actual}} \cdot \frac{PaCO_{2\,\text{actual}}}{PaCO_{2\,\text{deseada}}}

<!-- block: THEORY | De dónde sale la fórmula y cuándo falla -->
Si la producción de CO₂ no cambia, el producto $PaCO_2 \cdot \dot{V}_A$ es constante, y de ahí sale la fórmula de ajuste. Cuando solo cambias la frecuencia y mantienes el volumen corriente, puedes usar la ventilación minuto en lugar de la alveolar, porque el espacio muerto por respiración no varía:

$$
FR_{\text{nueva}} = FR_{\text{actual}} \cdot \frac{PaCO_{2\,\text{actual}}}{PaCO_{2\,\text{deseada}}}
$$

La fórmula es una estimación y falla cuando cambian sus supuestos: fiebre, escalofríos, agitación o nutrición excesiva aumentan $\dot{V}CO_2$; la hipovolemia, la PEEP excesiva o la embolia pulmonar aumentan el espacio muerto alveolar; y al subir mucho la frecuencia puede aparecer auto-PEEP, que reduce el volumen efectivo. Por eso cualquier ajuste se confirma con una gasometría de control.

<!-- block: EXERCISE | Ejemplo resuelto -->
Un paciente con PBW de 70 kg está en VCV con $V_T = 420\,\text{mL}$ y $FR = 20\,\text{resp/min}$. Su PaCO₂ es de 60 mmHg y quieres llevarla a 50 mmHg. Supón un espacio muerto total de 150 mL.

**Opción A: cambiar solo la frecuencia.**
$FR_{\text{nueva}} = 20 \cdot \frac{60}{50} = 24\,\text{resp/min}$.

**Opción B: cambiar solo el volumen corriente.**
Ventilación alveolar actual: $(0{,}420 - 0{,}150) \cdot 20 = 5{,}4\,\text{L/min}$.
Ventilación alveolar necesaria: $5{,}4 \cdot \frac{60}{50} = 6{,}48\,\text{L/min}$.
Volumen alveolar por respiración: $\frac{6{,}48}{20} = 0{,}324\,\text{L}$.
$V_T$ necesario: $0{,}324 + 0{,}150 = 0{,}474\,\text{L} \approx 475\,\text{mL}$.

Si hubieras usado la ventilación minuto en lugar de la alveolar, habrías calculado $\frac{8{,}4 \cdot 60/50}{20} = 504\,\text{mL}$, casi 30 mL de más. La razón es que el espacio muerto se «paga» en cada respiración: por eso, a igual ventilación minuto, aumentar el volumen corriente es más eficaz para eliminar CO₂ que aumentar la frecuencia. Sin embargo, en el pulmón enfermo el volumen corriente está limitado por la protección pulmonar, y casi siempre la palanca disponible será la frecuencia.

<!-- page: hipercapnia-permisiva-y-muestra | THEORY | Hipercapnia permisiva y gasometría venosa -->
<!-- block: THEORY | Hipercapnia permisiva: aceptar CO₂ para proteger el pulmón -->
En el SDRA, la ventilación con volumen corriente bajo reduce la mortalidad (Acute Respiratory Distress Syndrome Network, 2000). El precio de ese volumen bajo es, con frecuencia, una PaCO₂ más alta. La hipercapnia permisiva consiste en aceptar esa elevación del CO₂ y la acidosis respiratoria que provoca, en lugar de aumentar el volumen corriente y la presión meseta hasta valores lesivos. La idea de fondo es que el daño por sobredistensión es más grave que una acidosis respiratoria moderada y controlada.

El protocolo de la red ARDS define con precisión cuánto se tolera (Acute Respiratory Distress Syndrome Network, 2000):

- Meta de pH entre 7,30 y 7,45.
- Si el pH está entre 7,15 y 7,30, se aumenta la frecuencia hasta que el pH supere 7,30 o la PaCO₂ baje de 25 mmHg, con un máximo de 35 resp/min.
- Si el pH es menor de 7,15 con frecuencia de 35, se permite aumentar el volumen corriente en pasos de 1 mL/kg aunque se supere la meta de presión meseta, y se puede administrar bicarbonato.
- Si hay alcalosis (pH > 7,45), se reduce la frecuencia si es posible.

<!-- block: CALLOUT:warning | La hipercapnia no es inocua -->
Que una acidosis respiratoria moderada se tolere no significa que la hipercapnia sea beneficiosa. En un análisis de cohortes internacionales de pacientes con SDRA moderado o grave, una PaCO₂ máxima ≥ 50 mmHg en las primeras 48 horas se asoció de forma independiente con mayor mortalidad en la UCI (Nin et al., 2017). Se trata de una asociación observacional, no de una relación causal demostrada, pero refuerza que la hipercapnia permisiva es un compromiso que se acepta, no una meta. Antes de aceptarla, reduce el espacio muerto instrumental y optimiza la frecuencia.

<!-- block: THEORY | Cuándo no permitir la hipercapnia -->
El CO₂ es un potente vasodilatador cerebral: su aumento incrementa el flujo y el volumen sanguíneo cerebral y puede elevar la presión intracraneal. Por eso, en el paciente con lesión cerebral aguda sin hipertensión intracraneal significativa, el consenso de la ESICM recomienda una PaCO₂ de 35 a 45 mmHg (Robba et al., 2020). También se debe ser muy cauteloso con la acidosis en pacientes con hipertensión pulmonar o disfunción del ventrículo derecho, porque la acidosis y la hipercapnia aumentan la resistencia vascular pulmonar. En estos casos hay un conflicto real entre proteger el pulmón y proteger otro órgano, y la decisión debe individualizarse.

<!-- block: THEORY | Gasometría arterial frente a venosa -->
La gasometría venosa periférica es más fácil de obtener y tiene menos complicaciones, pero no es intercambiable con la arterial. Un metaanálisis encontró que el pH arterial es en promedio unas 0,03 unidades mayor que el venoso, con buena concordancia; en cambio, la PCO₂ venosa no fue comparable con la arterial porque el intervalo de predicción de la diferencia fue demasiado amplio (de −10,7 a +2,4 mmHg), y la PO₂ venosa fue en promedio 36,9 mmHg menor que la arterial (Byrne et al., 2014).

En la práctica:
- La gasometría venosa puede servir para vigilar el pH y como cribado, pero no para evaluar la oxigenación.
- Para decidir ajustes finos de ventilación y oxigenación en el paciente ventilado, usa sangre arterial.
- En el paciente con mala perfusión, la diferencia venoarterial de CO₂ aumenta, por lo que la PCO₂ venosa es todavía menos fiable para estimar la arterial.

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: SDRA con acidosis respiratoria -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** mujer de 52 años, talla de 160 cm, con neumonía grave y SDRA. PBW: $45{,}5 + 0{,}91 \cdot (160 - 152{,}4) \approx 52{,}4\,\text{kg}$, según la fórmula del protocolo de la red ARDS (Acute Respiratory Distress Syndrome Network, 2000).

**Ajustes:** VCV, $V_T = 315\,\text{mL}$ (6 mL/kg de PBW, el volumen objetivo del protocolo), $FR = 22\,\text{resp/min}$, PEEP 12 cmH₂O, FiO₂ 0,6. Presión meseta de 27 cmH₂O.

**Gasometría arterial:** pH 7,24; PaCO₂ 58 mmHg; HCO₃⁻ 24 mmol/L; PaO₂ 72 mmHg.

#### 1. Separa los dos problemas
**Oxigenación:** $\frac{72}{0{,}6} = 120\,\text{mmHg}$, que corresponde a SDRA moderado (ARDS Definition Task Force, 2012). La PaO₂ de 72 mmHg está dentro de la meta de 55 a 80 mmHg (Acute Respiratory Distress Syndrome Network, 2000): no necesitas cambiar FiO₂ ni PEEP por la oxigenación en este momento.

**Ventilación:** pH bajo con PaCO₂ alta: acidosis respiratoria. Bicarbonato esperado si es aguda: $24 + 0{,}1 \cdot 18 \approx 25{,}8$. El medido (24) es compatible con un proceso agudo, sin trastorno metabólico relevante.

#### 2. Decide la meta
El pH está entre 7,15 y 7,30, así que el protocolo indica aumentar la frecuencia hasta un pH > 7,30, con máximo de 35 resp/min (Acute Respiratory Distress Syndrome Network, 2000). ¿Qué PaCO₂ dará pH 7,30 con un bicarbonato de 24? Despejando Henderson-Hasselbalch:

$$
PaCO_2 = \frac{24}{0{,}03 \cdot 10^{(7{,}30 - 6{,}1)}} = \frac{24}{0{,}03 \cdot 15{,}85} \approx 50\,\text{mmHg}
$$

#### 3. Calcula el ajuste
No conviene aumentar el volumen corriente: ya está en 6 mL/kg y la presión meseta es 27 cmH₂O. Usa la frecuencia:

$$
FR_{\text{nueva}} = 22 \cdot \frac{58}{50} \approx 25{,}5 \rightarrow 26\,\text{resp/min}
$$

#### 4. Comprueba la seguridad
Con 26 resp/min, cada ciclo dura unos 2,3 s. Revisa la curva de flujo: el flujo espiratorio debe llegar a cero antes de la siguiente inspiración. Si no lo hace, hay auto-PEEP; acorta el tiempo inspiratorio o acepta una PaCO₂ algo mayor. Reduce también el espacio muerto instrumental si hay conexiones innecesarias entre la pieza en Y y el tubo.

#### 5. Verifica
Repite la gasometría arterial cuando se haya alcanzado el nuevo equilibrio para confirmar que el pH supera 7,30. Si no lo logras con frecuencias razonables, la hipercapnia permisiva es aceptable mientras el pH se mantenga por encima de los umbrales del protocolo y no haya contraindicación neurológica.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y revisa primero la gasometría: separa el problema de oxigenación del de ventilación.

- Sube la FiO₂ y observa que la SpO₂ y la PaO₂ mejoran mientras la PaCO₂ apenas cambia.
- Aumenta la frecuencia respiratoria y observa que la PaCO₂ baja y el pH sube, sin un efecto comparable sobre la oxigenación.
- Con frecuencias altas, vigila la curva de flujo: si el flujo espiratorio no llega a cero, estás generando auto-PEEP.

<!-- block: EXERCISE | Preguntas de práctica -->
**1.** Paciente con PaCO₂ de 70 mmHg y FR de 14 resp/min. Quieres una PaCO₂ de 50 mmHg sin cambiar el volumen corriente. ¿Qué frecuencia necesitas?

*Respuesta:* $14 \cdot \frac{70}{50} = 19{,}6 \approx 20\,\text{resp/min}$. Confírmalo con una gasometría de control y vigila la curva de flujo.

**2.** Un paciente con SDRA tiene pH 7,12 con FR de 35 resp/min y $V_T$ de 6 mL/kg. ¿Qué permite el protocolo de la red ARDS?

*Respuesta:* Con pH < 7,15 y la frecuencia ya en el máximo, permite aumentar el volumen corriente en pasos de 1 mL/kg aunque se supere la meta de presión meseta, y considerar bicarbonato (Acute Respiratory Distress Syndrome Network, 2000).

**3.** Un paciente con traumatismo craneoencefálico y SDRA tiene PaCO₂ de 55 mmHg. ¿Aplicarías hipercapnia permisiva?

*Respuesta:* No sin valorar el riesgo cerebral: el consenso de la ESICM recomienda PaCO₂ de 35 a 45 mmHg en lesión cerebral aguda sin hipertensión intracraneal significativa (Robba et al., 2020). Es un conflicto entre protección pulmonar y cerebral que requiere individualizar y, a menudo, monitorizar la presión intracraneal.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La oxigenación (PaO₂) depende de FiO₂, PEEP y presión media; la ventilación (PaCO₂) depende de la ventilación alveolar.
- El cociente PaO₂/FiO₂ clasifica la gravedad del SDRA; la definición global de 2024 acepta también SpO₂/FiO₂ (ARDS Definition Task Force, 2012; Matthay et al., 2024).
- Las metas de oxigenación dependen del paciente; en el SDRA, el protocolo de la red ARDS usó PaO₂ de 55 a 80 mmHg o SpO₂ de 88 a 95 % (Acute Respiratory Distress Syndrome Network, 2000).
- Con producción de CO₂ constante, $PaCO_2 \cdot \dot{V}_A$ es constante: úsalo para estimar la nueva frecuencia o el nuevo volumen.
- El espacio muerto se paga en cada respiración: a igual ventilación minuto, el volumen corriente elimina más CO₂ que la frecuencia, pero está limitado por la protección pulmonar.
- La hipercapnia permisiva es un compromiso aceptado con límites de pH definidos, no una meta; evítala en la lesión cerebral aguda (Robba et al., 2020).
- La gasometría venosa estima bien el pH, pero no la PaCO₂ ni la PaO₂ (Byrne et al., 2014).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Subir la frecuencia para corregir una hipoxemia** → la frecuencia actúa sobre el CO₂, no sobre el shunt → ajusta FiO₂ y PEEP para la oxigenación.
- **Aumentar el volumen corriente para normalizar la PaCO₂ en el SDRA** → expone el pulmón a sobredistensión y presión meseta alta → usa la frecuencia y acepta hipercapnia permisiva dentro de los límites del protocolo.
- **Aplicar la fórmula de ajuste sin pensar en sus supuestos** → fiebre, agitación o cambios de espacio muerto alteran la producción y la eliminación de CO₂ → confirma siempre con una gasometría de control.
- **Subir la frecuencia sin mirar la curva de flujo** → el tiempo espiratorio se acorta y aparece auto-PEEP → verifica que el flujo espiratorio llega a cero.
- **Usar la PCO₂ venosa para afinar la ventilación** → su diferencia con la arterial es amplia e impredecible → usa gasometría arterial para decisiones finas.
- **Tolerar hipercapnia en un paciente neurocrítico** → el CO₂ aumenta el flujo sanguíneo cerebral y puede elevar la presión intracraneal → mantén la PaCO₂ en el rango recomendado.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- ARDS Definition Task Force. (2012). Acute respiratory distress syndrome: The Berlin Definition. *JAMA, 307*(23), 2526–2533. [https://doi.org/10.1001/jama.2012.5669](https://doi.org/10.1001/jama.2012.5669)
- Byrne, A. L., Bennett, M., Chatterji, R., Symons, R., Pace, N. L., & Thomas, P. S. (2014). Peripheral venous and arterial blood gas analysis in adults: Are they comparable? A systematic review and meta-analysis. *Respirology, 19*(2), 168–175. [https://doi.org/10.1111/resp.12225](https://doi.org/10.1111/resp.12225)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., Calfee, C. S., Combes, A., et al. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37–47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- Nin, N., Muriel, A., Peñuelas, O., Brochard, L., Lorente, J. A., Ferguson, N. D., Raymondos, K., Ríos, F., et al. (2017). Severe hypercapnia and outcome of mechanically ventilated patients with moderate or severe acute respiratory distress syndrome. *Intensive Care Medicine, 43*(2), 200–208. [https://doi.org/10.1007/s00134-016-4611-1](https://doi.org/10.1007/s00134-016-4611-1)
- Robba, C., Poole, D., McNett, M., Asehnoune, K., Bösel, J., Bruder, N., Chieregato, A., Cinotti, R., et al. (2020). Mechanical ventilation in patients with acute brain injury: Recommendations of the European Society of Intensive Care Medicine consensus. *Intensive Care Medicine, 46*(12), 2397–2410. [https://doi.org/10.1007/s00134-020-06283-0](https://doi.org/10.1007/s00134-020-06283-0)
- Schjørring, O. L., Klitgaard, T. L., Perner, A., Wetterslev, J., Lange, T., Siegemund, M., Bäcklund, M., Keus, F., et al. (2021). Lower or higher oxygenation targets for acute hypoxemic respiratory failure. *New England Journal of Medicine, 384*(14), 1301–1311. [https://doi.org/10.1056/NEJMoa2032510](https://doi.org/10.1056/NEJMoa2032510)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.
