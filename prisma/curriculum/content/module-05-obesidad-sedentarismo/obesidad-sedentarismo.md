<!-- page: fisiopatologia-obesidad | THEORY | Qué cambia en la mecánica respiratoria con la obesidad -->
<!-- block: INTRODUCTION | Por qué importa -->
Cada vez más pacientes que llegan al quirófano o a la UCI tienen obesidad, y muchos de ellos combinan además sedentarismo, apnea obstructiva del sueño e hipoventilación. En ellos, los ajustes "estándar" del ventilador fallan de dos maneras opuestas: si calculas el volumen corriente con el peso real, sobredistiendes un pulmón que no es más grande que el de una persona delgada de la misma talla; si mantienes una PEEP baja por costumbre, dejas que las regiones dorsales se colapsen en pocos minutos y aparece una hipoxemia que no se corrige solo con oxígeno.

La revisión de De Jong y colaboradores resume el problema: la caída de la capacidad residual funcional (CRF) favorece el cierre de la vía aérea pequeña y la formación de atelectasias, y eso condiciona la intubación, la ventilación y la extubación (De Jong et al., 2020). Esta lección te enseña a razonar desde esa fisiología, no desde una tabla de valores fijos.

<!-- block: THEORY | Volúmenes pulmonares: la CRF es la primera víctima -->
El tejido adiposo de la pared torácica y, sobre todo, del abdomen actúa como una carga que el sistema respiratorio tiene que desplazar en cada inspiración y que, en reposo, empuja el diafragma hacia el tórax. El resultado es que el punto de equilibrio entre la retracción elástica del pulmón y la de la pared se desplaza a volúmenes más bajos.

En un estudio con 373 adultos sin obstrucción de la vía aérea, la capacidad vital y la capacidad pulmonar total disminuyeron de forma lineal y modesta con el índice de masa corporal (IMC), pero la CRF y el volumen de reserva espiratorio cayeron de forma exponencial; con un IMC de 30 kg/m², la CRF era solo el 75 % y el volumen de reserva espiratorio el 47 % de los valores de una persona con IMC de 20 kg/m² (Jones y Nzekwu, 2006). Un detalle importante del mismo trabajo es que los cambios más rápidos ocurren ya en el sobrepeso y la obesidad leve: no hace falta una obesidad extrema para que el paciente respire cerca de su volumen de cierre.

Cuando además el paciente está en decúbito supino, sedado y paralizado, se pierde el tono del diafragma que en vigilia contrarresta parcialmente el empuje abdominal. Pelosi y colaboradores midieron durante la anestesia general que, a medida que aumenta el IMC, la CRF y la compliance del sistema respiratorio disminuyen de forma exponencial, y que la oxigenación empeora en paralelo con la caída de la CRF, mientras que la PaCO₂ no se modificaba (Pelosi et al., 1998). Es decir: el problema dominante es el colapso y el shunt, no la ventilación alveolar.

<!-- block: THEORY | Presión pleural alta: el pulmón comprimido desde fuera -->
La explicación mecánica más útil para la cabecera es la presión pleural. Behazin y colaboradores colocaron catéteres esofágicos en pacientes con obesidad grave anestesiados y relajados y encontraron que, a volumen de relajación, la presión esofágica era claramente mayor que en controles sin obesidad (12,5 ± 3,9 frente a 6,9 ± 3,1 cmH₂O) (Behazin et al., 2010). Muchos de estos pacientes tienen una presión pleural positiva en todo el tórax incluso antes de recibir presión positiva.

Recuerda la definición de presión transpulmonar (Ptp): la diferencia entre la presión alveolar y la pleural, que es la presión que realmente distiende el pulmón. Si la presión pleural al final de la espiración es de 12 cmH₂O y programas una PEEP de 5 cmH₂O, la Ptp espiratoria es negativa: los alvéolos dependientes tienden a cerrarse en cada espiración y a reabrirse en cada inspiración, que es el mecanismo del atelectrauma.

![Esquema comparativo de dos tórax en decúbito supino: con peso normal la presión pleural espiratoria es baja y la presión transpulmonar con PEEP de 5 es positiva; con obesidad el abdomen desplaza el diafragma, la presión pleural es alta, la presión transpulmonar espiratoria es cercana a cero o negativa y las zonas dorsales se colapsan](/learning/diagrams/a9-obesidad-presiones.svg "Figura: presión pleural y transpulmonar en peso normal frente a obesidad")

<!-- block: CALLOUT:info | ¿Pulmón rígido o pared rígida? -->
Es frecuente leer que la compliance baja del obeso se debe a una pared torácica "pesada". Los datos con catéter esofágico matizan esa idea: en el estudio de Behazin, la compliance del sistema respiratorio era menor en los pacientes con obesidad (0,032 frente a 0,053 L/cmH₂O) sobre todo porque la compliance **pulmonar** era menor (0,043 frente a 0,084 L/cmH₂O), mientras que la de la pared torácica era similar entre grupos (Behazin et al., 2010). Pelosi y colaboradores describieron lo mismo: la compliance pulmonar cae y la de la pared apenas cambia (Pelosi et al., 1998). La interpretación es que el pulmón está "rígido" porque trabaja a un volumen anormalmente bajo, con unidades colapsadas; si recuperas volumen pulmonar con PEEP, mejora la compliance.

<!-- block: THEORY | Vía aérea, resistencia y trabajo respiratorio -->
Al respirar a volúmenes bajos, el calibre de la vía aérea pequeña disminuye: la resistencia del sistema respiratorio y del pulmón aumenta con el IMC, y el trabajo respiratorio crece principalmente por el componente pulmonar (Pelosi et al., 1998). En el paciente que respira espontáneamente, el cierre de la vía aérea al final de la espiración puede generar una PEEP intrínseca que obliga a un esfuerzo adicional antes de disparar el ventilador. Por eso la PEEP externa cumple aquí dos funciones: mantener abiertos los alvéolos y reducir la carga umbral del disparo.

<!-- page: calculo-pbw-ptp | EXERCISE | Fórmulas y cálculo: peso predicho, driving pressure y presión transpulmonar -->
<!-- block: THEORY | Peso corporal predicho: el pulmón depende de la talla -->
El tamaño de los pulmones está determinado por la talla y el sexo, no por la masa grasa. Por eso el volumen corriente se programa por kilogramo de peso corporal predicho (PBW), con las fórmulas utilizadas en el ensayo ARDSNet (ARDS Network, 2000):

$$
PBW_{\text{hombre}} = 50 + 0{,}91\,(T - 152{,}4)
$$

$$
PBW_{\text{mujer}} = 45{,}5 + 0{,}91\,(T - 152{,}4)
$$

donde $T$ es la talla en centímetros y $PBW$ se expresa en kilogramos. El volumen corriente se obtiene multiplicando: $V_T = k \cdot PBW$, con $k$ en mL/kg. En el SDRA, el punto de partida es $6\,\text{mL/kg}$ de PBW con presión meseta ≤ 30 cmH₂O (ARDS Network, 2000), y la revisión específica sobre obesidad recomienda el mismo volumen de 6 mL/kg de PBW tanto con SDRA como sin él (De Jong et al., 2020).

Mide la talla siempre que puedas: en pacientes con obesidad la estimación visual de la talla es poco fiable, y un error de 10 cm cambia el PBW en unos 9 kg.

![Gráfico de barras para un hombre de 170 cm y 130 kg: 6 mL/kg con peso real darían 780 mL, mientras que 6 mL/kg con peso predicho de 66 kg dan unos 396 mL](/learning/diagrams/a9-obesidad-vt-pbw.svg "Figura: el peso real casi duplica el volumen corriente correcto")

<!-- block: THEORY | Driving pressure y compliance -->
La driving pressure ($\Delta P$) es la presión que se usa para insuflar el volumen corriente por encima de la PEEP total:

$$
\Delta P = P_{plat} - PEEP_{total} = \frac{V_T}{C_{rs}}
$$

- $P_{plat}$: presión meseta medida con pausa inspiratoria, en cmH₂O.
- $PEEP_{total}$: PEEP programada más auto-PEEP, en cmH₂O (mídela con pausa espiratoria).
- $V_T$: volumen corriente en mL; $C_{rs}$: compliance estática del sistema respiratorio en mL/cmH₂O.

En el obeso, tanto la Pplat como la ΔP incluyen la presión necesaria para mover la pared toracoabdominal. Por eso una Pplat alta no siempre significa que el pulmón esté sobredistendido; para separar ambos componentes necesitas la presión esofágica.

<!-- block: THEORY | Presión transpulmonar con catéter esofágico -->
La presión esofágica ($P_{es}$) es una estimación de la presión pleural en la región media del tórax. Con ella calculas:

$$
P_{tp,\,ee} = PEEP_{total} - P_{es,\,ee}
$$

$$
P_{tp,\,ins} = P_{plat} - P_{es,\,ins}
$$

- $P_{tp,ee}$: presión transpulmonar al final de la espiración. Si es negativa, el pulmón dependiente tiende a colapsarse.
- $P_{tp,ins}$: presión transpulmonar al final de la inspiración, que refleja el estrés al que se somete el pulmón.

En pacientes críticos con obesidad, la PEEP que obtuvo la menor elastancia tras una maniobra de reclutamiento y un descenso escalonado de PEEP correspondía a una Ptp espiratoria ligeramente positiva (2,1 ± 2,2 cmH₂O); en un modelo animal de obesidad, el colapso y la apertura y cierre cíclicos aparecían cuando la Ptp espiratoria caía por debajo de 2-4 cmH₂O (Fumagalli et al., 2017). Esto apoya una regla fisiológica sencilla: busca una Ptp espiratoria igual o algo superior a cero.

<!-- block: EXERCISE | Ejemplo resuelto -->
Mujer de 160 cm y 120 kg, intubada por neumonía, en VCV.

1. **PBW:** $45{,}5 + 0{,}91 \times (160 - 152{,}4) = 45{,}5 + 6{,}9 = 52{,}4\,\text{kg}$.
2. **Vt a 6 mL/kg PBW:** $6 \times 52{,}4 \approx 314\,\text{mL}$. Si hubieras usado el peso real, $6 \times 120 = 720\,\text{mL}$: más del doble.
3. **Mecánica con PEEP 8 cmH₂O:** Pplat 26 cmH₂O. $\Delta P = 26 - 8 = 18\,\text{cmH}_2\text{O}$ y $C_{rs} = 314 / 18 \approx 17{,}4\,\text{mL/cmH}_2\text{O}$.
4. **Catéter esofágico:** $P_{es,ee} = 14\,\text{cmH}_2\text{O}$. Entonces $P_{tp,ee} = 8 - 14 = -6\,\text{cmH}_2\text{O}$: hay colapso espiratorio.
5. **Con PEEP 16 cmH₂O:** Pplat 30, $P_{es,ee} = 15$, $P_{es,ins} = 18$. $\Delta P = 14\,\text{cmH}_2\text{O}$, $C_{rs} = 314/14 \approx 22{,}4\,\text{mL/cmH}_2\text{O}$, $P_{tp,ee} = +1$ y $P_{tp,ins} = 12\,\text{cmH}_2\text{O}$.

**Interpretación:** al subir la PEEP, la ΔP bajó y la compliance subió; eso solo ocurre si se reclutó pulmón. Al mismo tiempo, la Ptp inspiratoria se mantiene moderada aunque la Pplat haya llegado a 30. Si en cambio la ΔP hubiera subido, la PEEP adicional estaría sobredistendiendo.

<!-- page: manejo-perioperatorio-uci | THEORY | De la inducción a la extubación: estrategia ventilatoria -->
<!-- block: INTRODUCTION | Un plan que empieza antes de intubar -->
Las decisiones que protegen el pulmón del paciente con obesidad empiezan antes de la intubación y siguen después de retirar el tubo. Si las piensas como una secuencia, es más difícil olvidar un paso cuando la situación se complica.

![Diagrama de flujo de seis pasos: posición con tronco elevado, preoxigenación con presión positiva, intubación con plan de vía aérea difícil, volumen corriente de 6 mL/kg de peso predicho, PEEP individualizada vigilando driving pressure y hemodinamia, y extubación semisentado con VNI o CPAP preventiva; recuadros laterales sobre monitorización y sobre el uso selectivo del reclutamiento](/learning/diagrams/a9-obesidad-algoritmo.svg "Figura: secuencia de protección pulmonar en la obesidad")

<!-- block: THEORY | Posición, preoxigenación e intubación -->
**Posición.** Elevar el tronco (sedestación o Trendelenburg invertido) descarga el diafragma del peso abdominal y aumenta la CRF; es la primera medida no invasiva recomendada en estos pacientes (De Jong et al., 2020). Mantenla durante la preoxigenación, la ventilación y después de la extubación.

**Preoxigenación.** Con una CRF pequeña, la reserva de oxígeno es baja y la desaturación durante la apnea es rápida. La preoxigenación con presión positiva es el método de referencia en la UCI para estos pacientes (De Jong et al., 2020): la presión mantiene abiertos los alvéolos mientras se sustituye el nitrógeno por oxígeno.

**Intubación.** Planifica una vía aérea potencialmente difícil, con operador entrenado y videolaringoscopio disponible cuando hay varios factores de riesgo (De Jong et al., 2020). Inmediatamente después de intubar, la pérdida de tono muscular produce colapso: no dejes al paciente con PEEP cero.

<!-- block: THEORY | Modo, volumen corriente y PEEP -->
**Modo.** Puedes usar VCV o PCV; lo esencial es controlar el volumen entregado y medir la mecánica. En el ensayo PROBESE ambos grupos se ventilaron en VCV con 7 mL/kg de PBW (Bluth et al., 2019). Si usas PCV, recuerda que un cambio de posición o de presión abdominal (laparoscopia) cambia el Vt sin que cambie la presión programada.

**Volumen corriente.** 6 mL/kg de PBW en UCI, con o sin SDRA (De Jong et al., 2020). La frecuencia se ajusta para controlar el pH, aceptando cierta hipercapnia si mantener la ventilación minuto exigiría volúmenes mayores.

**PEEP.** Aquí la evidencia exige matices:

- En la UCI, la PEEP que suelen elegir los clínicos es insuficiente para muchos pacientes con obesidad mórbida. En 14 pacientes con IMC medio de 50,7 kg/m², la PEEP elegida por el equipo (11,6 ± 2,9 cmH₂O) se asociaba a menores volúmenes pulmonares y peor oxigenación, mientras que dos métodos de titulación distintos (Ptp espiratoria y prueba decremental de mejor compliance) coincidían en una PEEP óptima alrededor de 21 cmH₂O (Pirrone et al., 2016). Fumagalli y colaboradores encontraron un valor similar (21,7 ± 3,7 cmH₂O) para la menor elastancia (Fumagalli et al., 2017). Son estudios fisiológicos pequeños: muestran que la PEEP debe individualizarse y que puede ser alta, no que haya que aplicar 20 cmH₂O a todos.
- En el quirófano, el ensayo PROBESE comparó en 2013 pacientes con IMC ≥ 35 kg/m² una PEEP de 12 cmH₂O con maniobras de reclutamiento frente a una PEEP de 4 cmH₂O: las complicaciones pulmonares posoperatorias no difirieron (21,3 % frente a 23,6 %), aunque la hipoxemia intraoperatoria fue menos frecuente con PEEP alta (5,0 % frente a 13,6 %) (Bluth et al., 2019). Una PEEP alta mejora la oxigenación, pero no ha demostrado cambiar los desenlaces clínicos en cirugía.

**Cómo titular en la práctica.** Si dispones de catéter esofágico, ajusta la PEEP para lograr una Ptp espiratoria cercana a cero o ligeramente positiva. Si no, observa la respuesta de la ΔP y de la compliance a cambios escalonados de PEEP: si al subir la PEEP la ΔP baja, estás reclutando; si sube, estás sobredistendiendo. Vigila siempre la presión arterial, porque la presión intratorácica alta reduce el retorno venoso.

<!-- block: CALLOUT:warning | Maniobras de reclutamiento: selectivas, no rutinarias -->
La revisión de expertos aconseja reclutamiento cuidadoso solo en pacientes seleccionados (De Jong et al., 2020). Hazlo con el ventilador (no con bolsa manual, que pierde la PEEP al reconectar), con vigilancia hemodinámica continua y deteniéndote ante hipotensión o desaturación. En el SDRA en general, las guías desaconsejan las maniobras prolongadas a alta presión; lo verás en la lección de reclutamiento y titulación de PEEP.

<!-- block: THEORY | Prono y extubación -->
**Prono.** La obesidad no es una contraindicación: el decúbito prono es una opción terapéutica en el SDRA grave con obesidad (De Jong et al., 2020). Requiere más personal, protección de puntos de apoyo y atención al abdomen.

**Extubación.** Extuba con el tronco elevado y planifica el soporte posterior: la VNI es la primera línea en la insuficiencia respiratoria posoperatoria de estos pacientes y la VNI profiláctica tras la extubación debe considerarse para prevenir la reintubación (De Jong et al., 2020). Si el paciente tiene apnea obstructiva del sueño con CPAP domiciliaria, asegúrate de que la recupere tras la extubación, y vigila especialmente el efecto de los opioides.

<!-- page: caso-obesidad | CASE_STUDY | Aplicación clínica: SDRA en una paciente con obesidad -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente (ficticia):** mujer de 52 años, talla medida 158 cm, peso 118 kg (IMC 47,3 kg/m²), apnea obstructiva del sueño con CPAP domiciliaria. Ingresa por neumonía grave y se intuba tras fracasar la oxigenación de alto flujo. Infiltrados bilaterales.

**Primera hora tras la intubación** (VCV, Vt 450 mL programado en urgencias, PEEP 8, FiO₂ 0,8): Pplat 32 cmH₂O, PaO₂ 64 mmHg, PAM 72 mmHg.

**Paso 1: corrige el volumen corriente.** PBW $= 45{,}5 + 0{,}91 \times (158 - 152{,}4) = 45{,}5 + 5{,}1 = 50{,}6\,\text{kg}$. Los 450 mL equivalen a casi 9 mL/kg de PBW. Programa $6 \times 50{,}6 \approx 300\,\text{mL}$ (ARDS Network, 2000; De Jong et al., 2020) y sube la frecuencia para compensar parcialmente la ventilación minuto.

**Paso 2: mide la mecánica.** Con Vt 300 mL, PEEP 10 y FiO₂ 0,8: Pplat 31, $\Delta P = 21\,\text{cmH}_2\text{O}$, $C_{rs} = 300/21 \approx 14{,}3\,\text{mL/cmH}_2\text{O}$. PaO₂ 68 mmHg: $PaO_2/FiO_2 = 68/0{,}8 = 85\,\text{mmHg}$.

**Paso 3: pregunta qué parte de la presión es pared.** Se coloca un catéter esofágico: $P_{es,ee} = 17\,\text{cmH}_2\text{O}$. Con PEEP 10, $P_{tp,ee} = 10 - 17 = -7\,\text{cmH}_2\text{O}$: el pulmón dependiente se colapsa en cada espiración, lo que explica la compliance baja y el shunt.

**Paso 4: titula la PEEP.** Se sube la PEEP por pasos de 2 cmH₂O vigilando PAM y SpO₂. Con PEEP 18: Pplat 33, $\Delta P = 15$, $C_{rs} = 20\,\text{mL/cmH}_2\text{O}$, $P_{es,ee} = 16$ ($P_{tp,ee} = +2$) y $P_{es,ins} = 22$ ($P_{tp,ins} = 11\,\text{cmH}_2\text{O}$). PAM 68 mmHg, estable tras un bolo de cristaloide. A las 2 horas, con FiO₂ 0,6, PaO₂ 96 mmHg: $PaO_2/FiO_2 = 160$.

**Razonamiento:** la ΔP bajó 6 cmH₂O y la compliance subió al aumentar la PEEP: hubo reclutamiento. La Pplat de 33 cmH₂O supera el límite clásico, pero la Ptp inspiratoria indica que gran parte de esa presión se disipa en la pared toracoabdominal. Esta interpretación depende de una medición esofágica fiable (verifica la calidad de la señal con una maniobra de oclusión) y es un terreno donde la evidencia es fisiológica, no de ensayos clínicos (Fumagalli et al., 2017; Pirrone et al., 2016).

**Paso 5: siguiente decisión.** Si la PaO₂/FiO₂ vuelve a caer por debajo de 150 mmHg, el prono es una opción también en obesidad (De Jong et al., 2020). Cuando se planifique la extubación: tronco elevado, reinicio de su CPAP y VNI preventiva según riesgo.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) y:

1. Revisa el volumen corriente inicial y recalcúlalo con la talla: al reducirlo, observa cómo bajan la presión meseta y la driving pressure.
2. Sube la PEEP en pasos pequeños y mira la compliance que muestra el monitor: si mejora y la driving pressure baja, estás reclutando; si la presión meseta sube sin mejorar la compliance, retrocede.
3. Vigila la presión arterial media al subir la PEEP: puede descender por menor retorno venoso.
4. Ajusta la frecuencia para controlar el pH y observa la evolución de la PaCO₂ en la gasometría.

<!-- block: EXERCISE | Preguntas -->
1. **Un hombre de 182 cm y 140 kg. ¿Qué Vt programas a 6 mL/kg de PBW?**
   PBW $= 50 + 0{,}91 \times (182 - 152{,}4) = 50 + 26{,}9 = 76{,}9\,\text{kg}$; Vt $\approx 460\,\text{mL}$. Con peso real serían 840 mL.

2. **Subes la PEEP de 10 a 14 cmH₂O con el mismo Vt y la Pplat pasa de 28 a 34 cmH₂O. ¿Qué interpretas?**
   La ΔP pasó de 18 a 20 cmH₂O: la compliance empeoró. La PEEP adicional está sobredistendiendo unidades ya abiertas más que reclutando. Vuelve a la PEEP previa o busca otra estrategia.

3. **¿Por qué la PaCO₂ puede ser normal en un obeso intubado con hipoxemia grave?**
   Porque el problema dominante es el colapso alveolar y el shunt; durante la anestesia, la oxigenación cae con la CRF mientras la PaCO₂ no cambia con el IMC (Pelosi et al., 1998).

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La obesidad reduce sobre todo la CRF y el volumen de reserva espiratorio, y lo hace ya en rangos de sobrepeso y obesidad leve (Jones y Nzekwu, 2006).
- En decúbito supino y bajo sedación, la presión pleural es alta y puede ser positiva en todo el tórax; con PEEP baja, la presión transpulmonar espiratoria se vuelve negativa y aparecen atelectasias y atelectrauma (Behazin et al., 2010).
- La compliance baja refleja sobre todo un pulmón que trabaja a volumen bajo, no solo una pared rígida (Pelosi et al., 1998; Behazin et al., 2010).
- El volumen corriente se calcula con el peso corporal predicho a partir de la talla medida: 6 mL/kg de PBW en la UCI (ARDS Network, 2000; De Jong et al., 2020).
- La PEEP debe individualizarse: la respuesta de la driving pressure y de la compliance, o la Ptp espiratoria medida con catéter esofágico, guían el ajuste (Pirrone et al., 2016; Fumagalli et al., 2017).
- En cirugía, una PEEP alta con reclutamiento mejora la oxigenación pero no reduce las complicaciones pulmonares posoperatorias (Bluth et al., 2019).
- Posición con tronco elevado, preoxigenación con presión positiva, prono si hay SDRA grave y VNI tras la extubación completan la estrategia (De Jong et al., 2020).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Calcular el Vt con el peso real** → el pulmón no crece con la grasa y recibes casi el doble del volumen adecuado → usa el PBW con la talla medida.
- **Mantener una PEEP de 5 cmH₂O "por protocolo"** → con presión pleural alta la Ptp espiratoria es negativa y el pulmón se colapsa → titula la PEEP según mecánica o Pes.
- **Interpretar una Pplat de 32 cmH₂O igual que en un paciente delgado** → parte de la presión se disipa en la pared → si puedes, mide la Ptp; si no, guíate por la ΔP y la compliance, y documenta tu razonamiento.
- **Aplicar maniobras de reclutamiento de rutina o con bolsa manual** → riesgo hemodinámico y pérdida inmediata de PEEP → reclutamiento selectivo, con el ventilador y vigilancia de la presión arterial.
- **Extubar en decúbito supino y sin plan de soporte** → la CRF cae de nuevo y reaparecen las atelectasias → extuba semisentado y considera VNI o CPAP preventiva.

<!-- block: REFERENCES | Referencias -->
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Behazin, N., Jones, S. B., Cohen, R. I., & Loring, S. H. (2010). Respiratory restriction and elevated pleural and esophageal pressures in morbid obesity. *Journal of Applied Physiology, 108*(1), 212-218. [https://doi.org/10.1152/japplphysiol.91356.2008](https://doi.org/10.1152/japplphysiol.91356.2008)
- Bluth, T., Serpa Neto, A., Schultz, M. J., Pelosi, P., Gama de Abreu, M., & Writing Committee for the PROBESE Collaborative Group of the PROtective VEntilation Network (PROVEnet) for the Clinical Trial Network of the European Society of Anaesthesiology. (2019). Effect of intraoperative high positive end-expiratory pressure (PEEP) with recruitment maneuvers vs low PEEP on postoperative pulmonary complications in obese patients: A randomized clinical trial. *JAMA, 321*(23), 2292-2305. [https://doi.org/10.1001/jama.2019.7505](https://doi.org/10.1001/jama.2019.7505)
- De Jong, A., Wrigge, H., Hedenstierna, G., Gattinoni, L., Chiumello, D., Frat, J. P., Ball, L., Schetz, M., Pickkers, P., & Jaber, S. (2020). How to ventilate obese patients in the ICU. *Intensive Care Medicine, 46*(12), 2423-2435. [https://doi.org/10.1007/s00134-020-06286-x](https://doi.org/10.1007/s00134-020-06286-x)
- Fumagalli, J., Berra, L., Zhang, C., Pirrone, M., Santiago, R. R. S., Gomes, S., Magni, F., Dos Santos, G. A. B., Bennett, D., Torsani, V., Fisher, D., Morais, C., Amato, M. B. P., & Kacmarek, R. M. (2017). Transpulmonary pressure describes lung morphology during decremental positive end-expiratory pressure trials in obesity. *Critical Care Medicine, 45*(8), 1374-1381. [https://doi.org/10.1097/CCM.0000000000002460](https://doi.org/10.1097/CCM.0000000000002460)
- Jones, R. L., & Nzekwu, M. M. (2006). The effects of body mass index on lung volumes. *Chest, 130*(3), 827-833. [https://doi.org/10.1378/chest.130.3.827](https://doi.org/10.1378/chest.130.3.827)
- Pelosi, P., Croci, M., Ravagnan, I., Tredici, S., Pedoto, A., Lissoni, A., & Gattinoni, L. (1998). The effects of body mass on lung volumes, respiratory mechanics, and gas exchange during general anesthesia. *Anesthesia & Analgesia, 87*(3), 654-660. [https://doi.org/10.1097/00000539-199809000-00031](https://doi.org/10.1097/00000539-199809000-00031)
- Pirrone, M., Fisher, D., Chipman, D., Imber, D. A., Corona, J., Mietto, C., Kacmarek, R. M., & Berra, L. (2016). Recruitment maneuvers and positive end-expiratory pressure titration in morbidly obese ICU patients. *Critical Care Medicine, 44*(2), 300-307. [https://doi.org/10.1097/CCM.0000000000001387](https://doi.org/10.1097/CCM.0000000000001387)
