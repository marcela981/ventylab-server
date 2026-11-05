<!-- page: conceptos-obstruccion | THEORY | La obstrucción al flujo aéreo: qué falla y dónde -->
<!-- block: INTRODUCTION | Por qué importa en la UCI -->
Cuando ventilas a un paciente con EPOC o con asma grave, el principal enemigo no suele ser el pulmón rígido, sino la dificultad para **sacar el aire**. La presión positiva introduce el volumen sin problema, pero la espiración sigue siendo pasiva y depende de que el gas pueda salir por unas vías aéreas estrechas en el tiempo que el ventilador le concede. Si ese tiempo no alcanza, el aire se acumula, sube la presión alveolar al final de la espiración (auto-PEEP) y aparecen las complicaciones típicas de estos pacientes: hipotensión, barotrauma, esfuerzos inefectivos y fracaso del destete.

Entender **dónde** está la obstrucción y **por qué** el flujo espiratorio se limita te permite anticipar cómo responderá el paciente a cada cambio de frecuencia, volumen corriente, flujo o PEEP. Esta lección es la base fisiopatológica de las dos siguientes: la ventilación en la exacerbación de EPOC y la ventilación en el asma grave.

<!-- block: THEORY | Dos enfermedades, un mismo problema mecánico -->
### Definiciones actuales

La iniciativa GOLD define la EPOC como una afección pulmonar heterogénea caracterizada por síntomas respiratorios crónicos (disnea, tos, expectoración o exacerbaciones) debidos a alteraciones de las vías aéreas (bronquitis, bronquiolitis) o de los alvéolos (enfisema), que causan una obstrucción al flujo aéreo **persistente y a menudo progresiva**. El diagnóstico exige una espirometría con un cociente FEV₁/FVC posbroncodilatador menor de 0,7 (Agustí et al., 2023).

La estrategia GINA define el asma como una enfermedad heterogénea con síntomas respiratorios (sibilancias, disnea, opresión torácica, tos) que **varían en el tiempo y en intensidad**, junto con una limitación **variable** del flujo espiratorio, que con los años puede volverse persistente (Reddel et al., 2022).

La palabra clave que separa ambas es la variabilidad: en la EPOC la obstrucción es estructural y poco reversible; en el asma es dinámica y, en gran parte, reversible con tratamiento. En la crisis grave ambas convergen en el mismo problema para quien maneja el ventilador.

### Tres mecanismos que estrechan la vía aérea

1. **Engrosamiento y ocupación de la luz.** En la EPOC, la progresión de la enfermedad se asocia a un aumento del tejido de la pared de las vías aéreas pequeñas y a la acumulación de exudado mucoso inflamatorio en su luz (Hogg et al., 2004). En el asma en crisis, el edema de la pared y los tapones de moco cumplen un papel equivalente.
2. **Contracción del músculo liso.** Es el mecanismo dominante del broncoespasmo asmático y explica por qué la obstrucción puede cambiar en minutos con broncodilatadores.
3. **Pérdida de la tracción radial.** Los tabiques alveolares que rodean a una vía aérea pequeña tiran de su pared hacia fuera y la mantienen abierta. En el enfisema esos tabiques se destruyen: la vía aérea pierde su soporte y el pulmón pierde retracción elástica, que es precisamente la fuerza que impulsa la espiración pasiva.

![Tres cortes transversales esquemáticos de una vía aérea pequeña: normal con pared delgada y fijaciones alveolares; EPOC con pared engrosada, moco y fijaciones perdidas; asma con músculo liso contraído, edema y tapón de moco](/learning/diagrams/a6-fisio-mecanismos-obstruccion.svg "Figura: mecanismos de estrechamiento de la vía aérea pequeña en EPOC y asma")

<!-- block: THEORY | Limitación del flujo espiratorio e hiperinflación dinámica -->
Hay **limitación del flujo espiratorio** cuando el flujo deja de aumentar aunque aumente la presión que impulsa la espiración (Junhasavasdikul et al., 2018). El mecanismo se relaciona con el colapso de las vías aéreas pequeñas: cuando el paciente empuja más fuerte con los músculos espiratorios, también comprime las vías aéreas y el flujo no sube. En el paciente ventilado esto tiene una consecuencia práctica inmediata: la única forma eficaz de vaciar el pulmón es **darle más tiempo**, no más fuerza.

Si la siguiente inspiración llega antes de que termine el vaciado, cada respiración deja un pequeño volumen residual adicional. El volumen de fin de espiración sube ciclo a ciclo hasta que se alcanza un nuevo equilibrio: es la **hiperinflación dinámica**, y la presión alveolar positiva que deja al final de la espiración es la **auto-PEEP** o PEEP intrínseca (Calverley y Koulouris, 2005). La limitación del flujo no es exclusiva de la EPOC: también aparece en obesidad, insuficiencia cardíaca y SDRA con PEEP baja, y se asocia a peores resultados, aunque con frecuencia pasa desapercibida (Junhasavasdikul et al., 2018).

La hiperinflación tiene un componente adaptativo: a mayor volumen, las vías aéreas se ensanchan y la retracción elástica aumenta, lo que mejora el flujo espiratorio. El problema es que este "equilibrio" se consigue a costa de trabajar en la parte alta y rígida de la curva presión-volumen, con un diafragma aplanado que pierde capacidad de generar fuerza, y con presiones intratorácicas que dificultan el retorno venoso.

<!-- page: constante-tiempo-atrapamiento | THEORY | Constante de tiempo y cálculo del atrapamiento -->
<!-- block: THEORY | La espiración pasiva es un vaciado exponencial -->
En la lección "Resistencia de la vía aérea y constante de tiempo" viste que el pulmón se vacía de forma exponencial, con una velocidad que depende del producto de la resistencia y la compliance. Aquí aplicamos esa idea al paciente obstructivo para estimar cuánto aire queda atrapado.

$$
\tau = R_{aw}\cdot C_{rs}
$$

- $\tau$: constante de tiempo espiratoria (s).
- $R_{aw}$: resistencia de la vía aérea (cmH₂O·L⁻¹·s).
- $C_{rs}$: compliance del sistema respiratorio (L/cmH₂O; ojo, en litros para que la unidad resultante sea segundos).

El volumen que queda por encima de la CRF a un tiempo $t$ desde el inicio de la espiración es:

$$
V(t) = V_{0}\cdot e^{-t/\tau}
$$

Después de $1\tau$ queda el 37 % del volumen inicial; después de $3\tau$, el 5 %; después de $5\tau$, menos del 1 %. Son propiedades matemáticas de la función exponencial, no umbrales clínicos.

En la EPOC y el asma la resistencia está muy aumentada y, en el enfisema, la compliance puede ser normal o alta: ambos factores alargan $\tau$. Si el tiempo espiratorio ($T_e$) es menor que unas $3\tau$, el vaciado queda incompleto.

<!-- block: EQUATION | Volumen atrapado en equilibrio (modelo unicompartimental) -->
V_{trap} = V_T\cdot\frac{e^{-T_e/\tau}}{1-e^{-T_e/\tau}}

<!-- block: THEORY | Del volumen atrapado a la auto-PEEP -->
La fórmula anterior sale de imponer que, en equilibrio, el volumen de fin de espiración sea igual en ciclos consecutivos. Ese volumen atrapado distiende el sistema respiratorio y genera una presión elástica al final de la espiración:

$$
PEEP_{i} \approx \frac{V_{trap}}{C_{rs}}
$$

Y el tiempo espiratorio disponible depende de lo que programas:

$$
T_e = \frac{60}{FR} - T_i \qquad T_i = \frac{V_T}{\dot{V}_{insp}}\;(\text{en VCV con flujo constante, sin pausa})
$$

![Dos gráficas de volumen frente al tiempo: con constante de tiempo corta el volumen vuelve a la línea de base en cada ciclo; con constante de tiempo larga el volumen de fin de espiración sube ciclo a ciclo hasta un nuevo nivel, y la diferencia es el volumen atrapado](/learning/diagrams/a6-fisio-vaciado-atrapamiento.svg "Figura: vaciado completo frente a atrapamiento progresivo")

<!-- block: EXERCISE | Ejemplo resuelto: ¿cuánto aire queda atrapado? -->
Un paciente con EPOC tiene $R_{aw} = 30\,\text{cmH}_2\text{O/L/s}$ y $C_{rs} = 0{,}07\,\text{L/cmH}_2\text{O}$. Recibe $V_T = 450\,\text{mL}$.

**1. Constante de tiempo.** $\tau = 30 \times 0{,}07 = 2{,}1\,\text{s}$. Vaciar el 95 % requeriría unas $3\tau = 6{,}3\,\text{s}$.

**2. Escenario A: FR 20/min, Ti 1,0 s.** Ciclo = 3 s, $T_e = 2{,}0\,\text{s}$. $e^{-2{,}0/2{,}1} = e^{-0{,}952} \approx 0{,}386$.
$V_{trap} = 450 \times 0{,}386 / 0{,}614 \approx 283\,\text{mL}$; $PEEP_i \approx 0{,}283 / 0{,}07 \approx 4{,}0\,\text{cmH}_2\text{O}$.

**3. Escenario B: FR 12/min, Ti 1,0 s.** Ciclo = 5 s, $T_e = 4{,}0\,\text{s}$. $e^{-4{,}0/2{,}1} = e^{-1{,}905} \approx 0{,}149$.
$V_{trap} = 450 \times 0{,}149 / 0{,}851 \approx 79\,\text{mL}$; $PEEP_i \approx 1{,}1\,\text{cmH}_2\text{O}$.

**Interpretación.** Bajar la frecuencia duplica el tiempo espiratorio y reduce el atrapamiento a menos de un tercio, sin tocar el volumen corriente. Observa que el beneficio no es lineal: pasar de 2 a 4 s de $T_e$ ayuda mucho; pasar de 6 a 8 s ayudaría bastante menos, porque la curva exponencial ya está casi plana.

<!-- block: CALLOUT:warning | Límites del modelo -->
El modelo de un solo compartimento **subestima** el problema real. Con limitación del flujo espiratorio, el vaciado no es una exponencial simple y las regiones del pulmón tienen constantes de tiempo distintas; algunas vías aéreas pueden cerrarse por completo y esconder auto-PEEP que no se mide en la vía aérea proximal. Usa el cálculo para entender la dirección y la magnitud relativa de los cambios, y confirma siempre con la curva de flujo y con la pausa espiratoria.

<!-- page: epoc-asma-tabaquismo | THEORY | EPOC frente a asma y el papel del tabaquismo -->
<!-- block: THEORY | Inflamación distinta, consecuencias mecánicas distintas -->
EPOC y asma son enfermedades inflamatorias crónicas de la vía aérea, pero el tipo de inflamación es claramente diferente, con patrones de células y mediadores distintos que explican sus cambios estructurales característicos. Esa distinción se desdibuja en el asma grave, en los asmáticos fumadores y durante las exacerbaciones (Barnes, 2008). Para el clínico que ventila, las diferencias que más importan son mecánicas:

| Aspecto | EPOC | Asma grave en crisis |
|---|---|---|
| Sitio principal | Vías aéreas pequeñas y parénquima (enfisema) | Vías aéreas de calibre medio y pequeño |
| Mecanismo dominante | Remodelado, moco, pérdida de retracción elástica | Broncoespasmo, edema, tapones de moco |
| Reversibilidad | Escasa; la obstrucción persiste | Alta; cambia en horas con tratamiento |
| Compliance | Normal o aumentada en el enfisema | Habitualmente normal; baja "aparente" por hiperinflación |
| PaCO₂ basal | Puede ser crónicamente alta, con bicarbonato compensador | Habitualmente normal o baja fuera de la crisis |
| Implicación ventilatoria | Volver a la PaCO₂ **basal** del paciente, no a 40 mmHg | Hipoventilación controlada mientras cede el broncoespasmo |

Dos consecuencias prácticas se derivan de la tabla. Primera: en la EPOC con hipercapnia crónica, el riñón ha retenido bicarbonato; si corriges la PaCO₂ hasta valores "normales", provocas una alcalosis. Segunda: en el asma la resistencia puede caer rápidamente con el tratamiento, así que los ajustes que eran correctos al ingreso pueden quedar obsoletos en pocas horas.

<!-- block: THEORY | El tabaquismo: causa, agravante y oportunidad -->
### En la EPOC

El tabaquismo es un factor de riesgo ambiental clave: los fumadores tienen más síntomas, más alteraciones de la función pulmonar, una caída anual del FEV₁ más rápida y mayor mortalidad por EPOC. Sin embargo, GOLD insiste en que la EPOC resulta de interacciones repetidas entre genes y ambiente a lo largo de la vida, y que otros factores (biomasa, contaminación, alteraciones del desarrollo pulmonar) también contribuyen (Agustí et al., 2023).

El estudio clásico de Fletcher y Peto, en trabajadores londinenses, mostró que el FEV₁ desciende de forma gradual durante toda la vida y que solo una parte de los fumadores, los **susceptibles**, desarrolla una obstrucción clínicamente significativa. Cuando un fumador susceptible deja de fumar no recupera la función perdida, pero su velocidad de pérdida del FEV₁ vuelve a la de un no fumador (Fletcher y Peto, 1977). Por eso la cesación tiene sentido en cualquier etapa: no repara, pero frena.

### En el asma

En los países desarrollados, aproximadamente uno de cada cuatro adultos con asma fuma. La interacción entre asma y tabaquismo produce síntomas más graves, una caída acelerada de la función pulmonar y una peor respuesta a corto plazo a los corticoides; el mecanismo de esta resistencia no está totalmente aclarado (Thomson et al., 2004). Clínicamente, un asmático fumador puede comportarse como un paciente con obstrucción mixta, con menor reversibilidad de lo esperado.

### Qué significa para ti en la UCI

- Pregunta siempre por el consumo de tabaco y documenta el índice paquetes-año: orienta hacia un componente fijo de la obstrucción.
- No asumas que un paciente "asmático" tendrá una respuesta completa a broncodilatadores si fuma o fumó intensamente.
- Antes del alta, el episodio crítico es una oportunidad: la cesación tabáquica es una de las intervenciones que cambian la historia natural de la enfermedad (Fletcher y Peto, 1977; Agustí et al., 2023).

<!-- page: aplicacion-clinica | CASE_STUDY | Aplicación clínica: reconocer la obstrucción en el ventilador -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 64 años, exfumador de 45 paquetes-año, con diagnóstico previo de EPOC. Ingresa por neumonía y se intuba en urgencias por deterioro del nivel de conciencia. Talla 172 cm.

**Ajustes recibidos de urgencias.** VCV, $V_T$ 500 mL, FR 22/min, flujo inspiratorio constante 40 L/min, sin pausa, PEEP 5 cmH₂O, FiO₂ 0,5.

**Lo que observas.** Presión pico 38 cmH₂O, presión meseta (pausa de 0,5 s) 22 cmH₂O, presión arterial media en descenso. En la curva de flujo, el flujo espiratorio no llega a cero antes de cada inspiración. Pausa espiratoria: PEEP total 13 cmH₂O.

**Razonamiento paso a paso.**

1. **¿Problema resistivo o elástico?** Ppico − Pplat = 16 cmH₂O, con un flujo de 40 L/min (0,67 L/s): $R_{aw} \approx 16/0{,}67 \approx 24\,\text{cmH}_2\text{O/L/s}$, muy alta. La diferencia Pplat − PEEP total = 22 − 13 = 9 cmH₂O, con 0,5 L: $C_{rs} \approx 0{,}5/9 \approx 0{,}056\,\text{L/cmH}_2\text{O}$. El problema dominante es la **resistencia**.
2. **¿Hay atrapamiento?** Sí: el flujo no vuelve a cero y la auto-PEEP es 13 − 5 = 8 cmH₂O.
3. **¿Cuánto tiempo espiratorio tiene?** $T_i = 0{,}5 / 0{,}67 \approx 0{,}75\,\text{s}$; ciclo $= 60/22 \approx 2{,}73\,\text{s}$; $T_e \approx 1{,}98\,\text{s}$. Con $\tau \approx 24 \times 0{,}056 \approx 1{,}3\,\text{s}$, el $T_e$ equivale a solo $1{,}5\tau$: el vaciado es claramente incompleto.
4. **¿Por qué baja la presión arterial?** La presión intratorácica sostenida por la hiperinflación reduce el retorno venoso. Es una causa mecánica que debes descartar antes de atribuir la hipotensión solo a la sepsis.
5. **¿Qué palancas tienes?** Aumentar $T_e$: bajar la FR (la más potente), acortar $T_i$ con más flujo inspiratorio, y no aumentar el volumen corriente. Al mismo tiempo, tratar la causa de la resistencia (broncodilatadores, aspiración de secreciones). La lección "Ventilación en la exacerbación de EPOC" detalla cómo hacerlo y cómo ajustar la PEEP externa.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y:

- Observa la curva de flujo-tiempo con los ajustes iniciales: identifica si el flujo espiratorio regresa a cero antes de la siguiente inspiración.
- Sube la frecuencia respiratoria unos pocos ciclos por minuto y observa cómo el flujo espiratorio se interrumpe antes y la presión meseta tiende a subir.
- Después baja la frecuencia y aumenta el flujo inspiratorio: el tiempo espiratorio se alarga y el flujo espiratorio se acerca más a cero al final de cada ciclo.
- Compara la diferencia entre presión pico y meseta con la de un pulmón normal en el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung).

<!-- block: EXERCISE | Comprueba lo aprendido -->
**1.** En el ejemplo, si bajas la FR a 14/min y subes el flujo a 60 L/min (1 L/s) con el mismo $V_T$, ¿cuál es el nuevo $T_e$?

*Respuesta:* $T_i = 0{,}5\,\text{s}$; ciclo $= 60/14 \approx 4{,}29\,\text{s}$; $T_e \approx 3{,}79\,\text{s}$, unas $2{,}9\tau$. Casi duplicas el tiempo de vaciado.

**2.** ¿Por qué el aumento del flujo inspiratorio eleva la presión pico, pero no empeora la hiperinflación?

*Respuesta:* La presión pico incluye el componente resistivo ($R\cdot\dot{V}$), que crece con el flujo. La hiperinflación depende del volumen que queda al final de la espiración, que mejora porque el $T_i$ se acorta y el $T_e$ se alarga. Por eso la presión pico es mal indicador de hiperinflación en estos pacientes; vigila la presión meseta y la auto-PEEP.

**3.** Un paciente con asma y otro con EPOC tienen la misma auto-PEEP al ingreso. ¿En cuál esperas que cambie más rápido con el tratamiento?

*Respuesta:* En el asmático, porque su obstrucción es predominantemente variable y reversible (broncoespasmo y edema), mientras que en la EPOC predomina un componente estructural fijo.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- EPOC y asma comparten el problema mecánico central del paciente ventilado: la espiración pasiva es lenta y puede quedar incompleta.
- La EPOC se caracteriza por obstrucción persistente (FEV₁/FVC posbroncodilatador < 0,7); el asma, por obstrucción variable y en gran parte reversible.
- La obstrucción proviene del engrosamiento y la ocupación de la luz, de la contracción del músculo liso y, en el enfisema, de la pérdida de tracción radial y retracción elástica.
- Con limitación del flujo espiratorio, empujar más no aumenta el flujo: lo único que vacía el pulmón es el tiempo.
- La constante de tiempo ($\tau = R \cdot C$) permite estimar si el $T_e$ programado es suficiente; menos de unas $3\tau$ implica vaciado incompleto.
- La hiperinflación dinámica genera auto-PEEP, compromete el retorno venoso y aplana el diafragma.
- El tabaquismo acelera la pérdida de función en los susceptibles y empeora el asma; dejar de fumar no recupera lo perdido, pero normaliza la velocidad de declive.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Interpretar una presión pico alta como hiperinflación** → la presión pico depende sobre todo del flujo y la resistencia → mide la presión meseta y la auto-PEEP con pausas.
- **Asumir que la EPOC es siempre un pulmón rígido** → en el enfisema la compliance puede estar aumentada; el problema es la resistencia y la retracción elástica → separa los componentes resistivo y elástico con la ecuación del movimiento.
- **Corregir la PaCO₂ de un EPOC hipercápnico crónico hasta 40 mmHg** → el bicarbonato retenido produce alcalosis → apunta a la PaCO₂ basal estimada del paciente.
- **Fiarse solo del cálculo unicompartimental** → subestima el atrapamiento real y no detecta la auto-PEEP oculta → confirma con la curva de flujo y la pausa espiratoria.
- **Tratar al asmático fumador como un asmático "puro"** → el tabaco reduce la respuesta a corticoides y añade obstrucción fija → ajusta las expectativas de reversibilidad y refuerza la cesación.

<!-- block: REFERENCES | Referencias -->
- Agustí, A., Celli, B. R., Criner, G. J., Halpin, D., Anzueto, A., Barnes, P., Bourbeau, J., Han, M. K., Martinez, F. J., Montes de Oca, M., Mortimer, K., Papi, A., Pavord, I., Roche, N., Salvi, S., Sin, D. D., Singh, D., Stockley, R., López Varela, M. V., ... Vogelmeier, C. F. (2023). Global Initiative for Chronic Obstructive Lung Disease 2023 report: GOLD executive summary. *European Respiratory Journal, 61*(4), 2300239. [https://doi.org/10.1183/13993003.00239-2023](https://doi.org/10.1183/13993003.00239-2023)
- Barnes, P. J. (2008). Immunology of asthma and chronic obstructive pulmonary disease. *Nature Reviews Immunology, 8*(3), 183-192. [https://doi.org/10.1038/nri2254](https://doi.org/10.1038/nri2254)
- Calverley, P. M. A., & Koulouris, N. G. (2005). Flow limitation and dynamic hyperinflation: Key concepts in modern respiratory physiology. *European Respiratory Journal, 25*(1), 186-199. [https://doi.org/10.1183/09031936.04.00113204](https://doi.org/10.1183/09031936.04.00113204)
- Fletcher, C., & Peto, R. (1977). The natural history of chronic airflow obstruction. *British Medical Journal, 1*(6077), 1645-1648. [https://doi.org/10.1136/bmj.1.6077.1645](https://doi.org/10.1136/bmj.1.6077.1645)
- Hogg, J. C., Chu, F., Utokaparch, S., Woods, R., Elliott, W. M., Buzatu, L., Cherniack, R. M., Rogers, R. M., Sciurba, F. C., Coxson, H. O., & Paré, P. D. (2004). The nature of small-airway obstruction in chronic obstructive pulmonary disease. *New England Journal of Medicine, 350*(26), 2645-2653. [https://doi.org/10.1056/NEJMoa032158](https://doi.org/10.1056/NEJMoa032158)
- Junhasavasdikul, D., Telias, I., Grieco, D. L., Chen, L., Gutierrez, C. M., Piraino, T., & Brochard, L. (2018). Expiratory flow limitation during mechanical ventilation. *Chest, 154*(4), 948-962. [https://doi.org/10.1016/j.chest.2018.01.046](https://doi.org/10.1016/j.chest.2018.01.046)
- Reddel, H. K., Bacharier, L. B., Bateman, E. D., Brightling, C. E., Brusselle, G. G., Buhl, R., Cruz, A. A., Duijts, L., Drazen, J. M., FitzGerald, J. M., Fleming, L. J., Inoue, H., Ko, F. W., Krishnan, J. A., Levy, M. L., Lin, J., Mortimer, K., Pitrez, P. M., Sheikh, A., ... Boulet, L.-P. (2022). Global Initiative for Asthma Strategy 2021: Executive summary and rationale for key changes. *European Respiratory Journal, 59*(1), 2102730. [https://doi.org/10.1183/13993003.02730-2021](https://doi.org/10.1183/13993003.02730-2021)
- Thomson, N. C., Chaudhuri, R., & Livingston, E. (2004). Asthma and cigarette smoking. *European Respiratory Journal, 24*(5), 822-833. [https://doi.org/10.1183/09031936.04.00039004](https://doi.org/10.1183/09031936.04.00039004)
