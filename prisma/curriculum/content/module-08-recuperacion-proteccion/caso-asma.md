<!-- page: llegada-intubacion | CASE_STUDY | Etapa 1: crisis asmática grave e intubación -->
<!-- block: INTRODUCTION | Cómo usar este caso -->
La crisis asmática que llega a la intubación es poco frecuente, pero cuando ocurre los primeros minutos de ventilación son los más peligrosos. El enfoque que hoy se considera de elección prioriza evitar las complicaciones del ventilador (hipotensión y barotrauma por hiperinflación) por encima de corregir la hipercapnia (Leatherman, 2015). Este caso te obliga a aplicar esa idea, que va en contra del reflejo de "normalizar la gasometría". Responde cada pregunta antes de leer la explicación.

<!-- block: CASE_STUDY | Ejemplo clínico: presentación -->
**Paciente (ficticia):** mujer de 28 años, talla 165 cm, peso 60 kg, asma desde la infancia con mal control y un ingreso previo en UCI. Llega tras 12 horas de disnea progresiva que no cedió con su inhalador de rescate.

**En urgencias:** FR 34/min, habla con palabras sueltas, uso de músculos accesorios, sibilancias casi ausentes ("tórax silencioso"), SpO₂ 89 % con mascarilla. Recibe broncodilatadores nebulizados continuos, corticoide sistémico y sulfato de magnesio.

**Una hora después:** somnolienta, FR 14/min y superficial. Gasometría: pH 7,18, PaCO₂ 68 mmHg, PaO₂ 64 mmHg con FiO₂ 0,5. Se decide intubar.

<!-- block: EQUATION | Peso corporal predicho (mujer) -->
PBW = 45{,}5 + 0{,}91\,(T_{\text{cm}} - 152{,}4)

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Qué indica la caída de la frecuencia respiratoria con somnolencia?
2. ¿Qué riesgo principal anticipas en los minutos posteriores a la intubación?
3. Calcula el PBW y propón cómo ventilarás con bolsa y en la conexión al ventilador.

<!-- block: THEORY | Respuesta razonada -->
**1. Agotamiento.** Una frecuencia que baja con somnolencia e hipercapnia creciente no es mejoría: es fatiga muscular y narcosis por CO₂. El "tórax silencioso" indica que el flujo de aire es tan escaso que ni siquiera genera sibilancias. Es una paciente en riesgo de paro respiratorio. Leatherman señala que la mortalidad inmediata de los pacientes ventilados por asma grave es muy baja y que suele asociarse a paro cardiorrespiratorio antes de la intubación (Leatherman, 2015): el momento de decidir es ahora.

**2. Hiperinflación dinámica y colapso hemodinámico.** La obstrucción grave limita el flujo espiratorio. Si tras la intubación se ventila con frecuencia o volumen altos, cada respiración atrapa más aire; la presión intratorácica sube, el retorno venoso cae y aparece hipotensión, que puede llegar al paro. La hiperinflación excesiva es una causa mayor de hipotensión y barotrauma en estos pacientes (Leatherman, 2015). Tuxen y Lane observaron que el volumen atrapado aumentaba con el Vt y al acortar el tiempo espiratorio, y que con los niveles de ventilación que habían necesitado los pacientes para mantener la normocapnia antes de la parálisis la mayoría presentó hipotensión (Tuxen y Lane, 1987).

**3. Plan.** $PBW = 45{,}5 + 0{,}91 \times (165 - 152{,}4) = 45{,}5 + 11{,}5 = 57{,}0\,\text{kg}$.

- Con bolsa: pocas respiraciones por minuto, volúmenes pequeños y espiración completa (observa que el tórax descienda antes de la siguiente compresión).
- Ten preparados líquidos y vasopresor para la hipotensión posintubación.
- Si la presión arterial cae tras conectar, **desconecta** el circuito durante unos segundos: si la presión se recupera al vaciarse el pulmón, la causa es la hiperinflación.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Crisis asmática grave»](/simulador?tab=simular&case=engine-asthma-crisis) y:

1. Comienza con una frecuencia alta y observa que el flujo espiratorio no llega a cero y que la presión meseta y la auto-PEEP aumentan respiración tras respiración.
2. Reduce la frecuencia de forma marcada: el flujo espiratorio se acerca a cero, la meseta baja y la presión arterial media tiende a recuperarse.
3. Aumenta el flujo inspiratorio: observa que la presión pico sube mientras la meseta cambia poco.
4. Acepta la subida de la PaCO₂ y vigila el pH, sin perseguir valores normales.

<!-- page: ajustes-hiperinflacion | CASE_STUDY | Etapa 2: hipoventilación controlada y vigilancia de la hiperinflación -->
<!-- block: CASE_STUDY | Ejemplo clínico: primera hora en el ventilador -->
Intubada, sedada y adaptada. VCV con Vt 400 mL (7,0 mL/kg PBW), flujo inspiratorio 80 L/min con onda cuadrada, FR 16/min, PEEP 5, FiO₂ 0,5. Presión arterial 92/55 mmHg.

Mediciones con FR 16: Ppico 52 cmH₂O, Pplat 29 cmH₂O, PEEP total 13 cmH₂O. Volumen espirado total durante una apnea prolongada bajo sedación profunda (volumen al final de la inspiración por encima de la CRF, $V_{EI}$): 1400 mL. Gasometría: pH 7,16, PaCO₂ 72 mmHg.

![Curva de presión frente a tiempo en VCV con flujo constante: rampa hasta una presión pico alta, caída en la pausa inspiratoria a una presión meseta mucho menor, espiración y pausa espiratoria en la que la presión se eleva por encima de la PEEP programada, mostrando la auto-PEEP](/learning/diagrams/a10-asma-presion-pausas.svg "Figura: lectura de las pausas en la obstrucción grave")

<!-- block: EXERCISE | ¿Qué harías? -->
1. Calcula el tiempo espiratorio, la resistencia y la auto-PEEP.
2. ¿Qué medición te indica mejor el grado de hiperinflación? ¿Cómo la usas?
3. ¿Aumentas la frecuencia para corregir la acidosis?

<!-- block: THEORY | Respuesta razonada -->
**1. Cálculos.** Con $\dot{V} = 80\,\text{L/min} = 1{,}33\,\text{L/s}$:

$$
T_i = \frac{0{,}40}{1{,}33} = 0{,}30\,\text{s} \qquad T_e = \frac{60}{16} - 0{,}30 = 3{,}45\,\text{s}
$$

$$
R_{aw} = \frac{P_{pico} - P_{plat}}{\dot{V}} = \frac{52 - 29}{1{,}33} \approx 17\,\text{cmH}_2\text{O/L/s}
$$

$$
\text{auto-PEEP} = 13 - 5 = 8\,\text{cmH}_2\text{O}
$$

Aunque el tiempo espiratorio supera los 3 segundos, el pulmón no se vacía: la constante de tiempo está muy prolongada por la resistencia.

**2. Medir la hiperinflación.** La presión pico es alta, pero refleja sobre todo el flujo y la resistencia de la vía aérea, no el volumen atrapado (Tuxen y Lane, 1987). Lo que importa es cuánto aire queda dentro:

- **$V_{EI}$:** volumen exhalado durante una apnea prolongada en el paciente paralizado o profundamente sedado. Tuxen y colaboradores ajustaron la ventilación minuto según este volumen, reduciendo la frecuencia cuando superaba 20 mL/kg e independientemente de la PaCO₂ (Tuxen et al., 1992). Aquí: $1400/57 \approx 24{,}6\,\text{mL/kg}$, por encima de ese umbral.
- **Pplat y auto-PEEP:** son estimaciones de cabecera más sencillas de la presión alveolar al final de la inspiración y de la espiración. Ambas aumentan cuando aumenta el atrapamiento, y sus cambios tras cada ajuste te indican si vas en la dirección correcta. Ten en cuenta que dependen también de la compliance y que, en vías aéreas cerradas, la pausa espiratoria puede infraestimar la auto-PEEP.

**3. No aumentes la frecuencia.** Subir la FR acorta el tiempo espiratorio y empeora la hiperinflación. La estrategia es la **hipoventilación controlada**: se acepta la hipercapnia para evitar la hiperinflación, que es la que causa hipotensión y barotrauma (Leatherman, 2015). Decisión: FR 10/min manteniendo Vt 400 mL.

**Nuevas mediciones (FR 10):** $T_e = 6 - 0{,}30 = 5{,}7\,\text{s}$, Pplat 25, PEEP total 9, $V_{EI} = 1050\,\text{mL}$ ($\approx 18{,}4\,\text{mL/kg}$). Presión arterial 108/64 mmHg. pH 7,12, PaCO₂ 80 mmHg. La paciente está mejor protegida aunque la gasometría "parezca peor". Evita la hipercapnia permisiva si hay hipertensión intracraneal, y vigila la acidosis grave con disfunción ventricular: son las situaciones en las que el balance cambia.

<!-- block: CALLOUT:info | ¿Y la PEEP externa? -->
En una paciente paralizada sin esfuerzos inspiratorios, añadir PEEP externa no facilita el disparo (no hay disparo) y puede aumentar el volumen pulmonar si la obstrucción no se comporta como un "punto de cierre" fijo. Si decides probarla, mide de nuevo la PEEP total y la Pplat: si suben, retírala. Cuando la paciente empiece a respirar en modo asistido, la PEEP externa por debajo de la auto-PEEP vuelve a ser útil para reducir el esfuerzo de disparo.

<!-- page: complicacion-destete | CASE_STUDY | Etapa 3: deterioro súbito y liberación del ventilador -->
<!-- block: CASE_STUDY | Ejemplo clínico: hora 14 -->
Tras una aspiración de secreciones con ventilación manual vigorosa, la presión arterial cae a 70/40 mmHg, la SpO₂ a 82 % y la Pplat sube a 36 cmH₂O. Murmullo vesicular disminuido en el hemitórax derecho.

<!-- block: EXERCISE | ¿Qué harías? -->
1. ¿Qué dos causas principales consideras y cómo las distingues de inmediato?
2. Al día 2, la paciente mejora: con la misma FR la PaCO₂ baja y el $V_{EI}$ disminuye. ¿Cuándo empiezas el destete?

<!-- block: THEORY | Respuesta razonada -->
**1. Hiperinflación frente a neumotórax.** La ventilación manual rápida pudo reproducir la hiperinflación dinámica; pero la asimetría auscultatoria sugiere un neumotórax a tensión, la forma más grave de barotrauma en estos pacientes (Leatherman, 2015). La secuencia práctica:

1. Desconecta del ventilador durante unos segundos. Si la presión arterial y la Pplat mejoran claramente al vaciarse el pulmón, predomina la hiperinflación: reconecta con frecuencia baja.
2. Si no mejora, trata como neumotórax a tensión: descompresión inmediata y drenaje, confirmando con ecografía si no retrasa el tratamiento.
3. Revisa también el tubo (desplazamiento, intubación selectiva, obstrucción por tapón mucoso) y el equipo: pasa una sonda de aspiración para comprobar la permeabilidad y verifica la posición del tubo.

En este caso la presión no se recuperó al desconectar y la ecografía mostró ausencia de deslizamiento pleural derecho: se descomprimió y se colocó un drenaje, con recuperación hemodinámica.

**2. Destete.** La mejoría de la obstrucción se refleja en que el mismo nivel de ventilación produce menos atrapamiento y elimina más CO₂. Tuxen y colaboradores observaron que el punto de destete llegaba cuando la ventilación minuto "segura" (la que mantenía el $V_{EI}$ dentro del límite) bastaba para lograr una PaCO₂ ≤ 40 mmHg, y que casi todos los pacientes se destetaron en las 24 horas siguientes a ese punto (Tuxen et al., 1992). En la práctica:

- Reduce la sedación y suspende el bloqueo neuromuscular lo antes posible, porque la inmovilidad prolongada favorece la debilidad muscular y retrasa el destete.
- Pasa a presión de soporte vigilando auto-PEEP, esfuerzos ineficaces y frecuencia.
- Realiza la PVE cuando esté despierta, con broncoespasmo controlado y sin acidosis relevante.

Durante la PVE de una paciente asmática presta atención a la reaparición de sibilancias, al uso de músculos accesorios y a la frecuencia respiratoria; tras la extubación mantén los broncodilatadores y el corticoide, y vigila el estridor y el broncoespasmo de rebote. Tras la extubación, recuerda que estas pacientes tienen mayor riesgo de muerte en exacerbaciones posteriores y necesitan un seguimiento ambulatorio estrecho (Leatherman, 2015).

<!-- page: sintesis | THEORY | Síntesis del caso -->
<!-- block: SUMMARY | Puntos clave -->
- En el asma grave ventilada, la prioridad es evitar la hiperinflación (causa de hipotensión y barotrauma), no normalizar la PaCO₂ (Leatherman, 2015).
- La hiperinflación aumenta con el Vt y al acortar el tiempo espiratorio; la frecuencia baja es la herramienta más eficaz (Tuxen y Lane, 1987).
- La presión pico refleja flujo y resistencia; la Pplat, la auto-PEEP y el $V_{EI}$ reflejan el volumen atrapado (Tuxen y Lane, 1987; Tuxen et al., 1992).
- Un $V_{EI}$ por encima de 20 mL/kg se usó como señal para reducir la ventilación minuto (Tuxen et al., 1992).
- La hipotensión tras la intubación o tras ventilación manual se prueba con una desconexión breve; si no mejora, piensa en neumotórax a tensión.
- El destete comienza cuando la ventilación "segura" ya basta para eliminar el CO₂, y suele ser rápido una vez que la obstrucción cede (Tuxen et al., 1992).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Ventilar con bolsa a frecuencia alta tras la intubación** → hiperinflación, hipotensión y riesgo de paro → pocas respiraciones, volúmenes pequeños y espiración completa.
- **Subir la frecuencia para corregir la acidosis** → menos tiempo espiratorio y más atrapamiento → acepta la hipercapnia y vigila el pH y la hemodinamia.
- **Guiarse por la presión pico** → depende del flujo y la resistencia, no del volumen atrapado → usa Pplat, auto-PEEP y, si es posible, $V_{EI}$.
- **Atribuir toda hipotensión a la sedación** → puede ser hiperinflación o neumotórax a tensión → prueba de desconexión y exploración inmediata.
- **Mantener la parálisis más tiempo del necesario** → debilidad muscular y destete prolongado → retírala en cuanto la ventilación sea segura.

<!-- block: REFERENCES | Referencias -->
- Leatherman, J. (2015). Mechanical ventilation for severe asthma. *Chest, 147*(6), 1671-1680. [https://doi.org/10.1378/chest.14-1733](https://doi.org/10.1378/chest.14-1733)
- Tuxen, D. V., & Lane, S. (1987). The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *American Review of Respiratory Disease, 136*(4), 872-879. [https://doi.org/10.1164/ajrccm/136.4.872](https://doi.org/10.1164/ajrccm/136.4.872)
- Tuxen, D. V., Williams, T. J., Scheinkestel, C. D., Czarny, D., & Bowes, G. (1992). Use of a measurement of pulmonary hyperinflation to control the level of mechanical ventilation in patients with acute severe asthma. *American Review of Respiratory Disease, 146*(5 Pt 1), 1136-1142. [https://doi.org/10.1164/ajrccm/146.5_Pt_1.1136](https://doi.org/10.1164/ajrccm/146.5_Pt_1.1136)
