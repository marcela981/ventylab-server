<!-- page: conceptos-dos-objetivos | THEORY | Oxigenación y ventilación: dos problemas, dos grupos de controles -->
<!-- block: INTRODUCTION | Por qué separar los dos objetivos -->
"Ventilar" a un paciente no significa lo mismo que "oxigenarlo". La **ventilación**, en sentido fisiológico, es la renovación del gas alveolar, y su resultado medible es la eliminación de CO₂ (la PaCO₂). La **oxigenación** es la transferencia de oxígeno desde el alvéolo a la sangre, y su resultado medible es la PaO₂ (y la SpO₂). Ambas dependen del pulmón, pero responden a controles distintos del ventilador.

Separar los dos objetivos evita errores frecuentes: aumentar la frecuencia para tratar una hipoxemia por shunt (no ayuda y puede generar atrapamiento), o subir la FiO₂ para "corregir" una hipercapnia (no la corrige y puede ocultar una hipoventilación grave al mantener la SpO₂ normal). Cuando revises una gasometría, pregúntate siempre por separado: ¿cómo está la oxigenación? ¿cómo está la ventilación?

<!-- block: THEORY | Qué determina la PaCO₂ -->
Como viste en la lección "Volúmenes pulmonares, espacio muerto y ventilación alveolar", la PaCO₂ depende de la producción de CO₂ y, de forma inversa, de la ventilación alveolar (West & Luks, 2021). En el ventilador, los controles que modifican la ventilación alveolar son:

- **Frecuencia respiratoria** y **volumen corriente** (o la presión inspiratoria en los modos por presión, que determina el volumen).
- **Espacio muerto**: instrumental (circuito) y fisiológico (desajuste V/Q).

El CO₂ difunde con mucha facilidad y su curva de disociación en sangre es casi lineal en el rango fisiológico, por lo que las zonas bien ventiladas pueden compensar en parte a las mal ventiladas. Por eso la PaCO₂ responde de forma bastante predecible a los cambios de ventilación alveolar.

<!-- block: THEORY | Qué determina la PaO₂ -->
La oxigenación depende sobre todo de cuánto oxígeno llega al alvéolo y de cuántas unidades alveolares están abiertas y perfundidas. Los controles principales son:

- **FiO₂:** aumenta la PO₂ alveolar. Es muy eficaz cuando la hipoxemia se debe a hipoventilación o a desajuste V/Q, y poco eficaz cuando hay shunt, porque la sangre que pasa por alvéolos cerrados nunca entra en contacto con el gas enriquecido (Sarkar et al., 2017).
- **PEEP:** mantiene abiertos al final de la espiración alvéolos que tienden a colapsarse, aumenta la CRF y reduce el shunt cuando el pulmón es reclutable.
- **Presión media de la vía aérea:** es el promedio de la presión aplicada a lo largo de todo el ciclo. En inflación pasiva se relaciona con la oxigenación arterial, pero también con los efectos hemodinámicos y el barotrauma (Marini & Ravenscraft, 1992). Se eleva con la PEEP, con la presión inspiratoria y con un tiempo inspiratorio más largo.

La PEEP y la presión media actúan sobre la oxigenación de forma indirecta, a través del volumen pulmonar aireado. Si el pulmón no es reclutable, subirlas puede sobredistender zonas sanas, aumentar el espacio muerto y empeorar la hemodinamia sin mejorar la PaO₂.

![Diagrama de dos columnas. A la izquierda, oxigenación: FiO₂, PEEP, presión media y tiempo inspiratorio conducen a la PaO₂ y la SpO₂. A la derecha, ventilación: frecuencia, volumen corriente y espacio muerto conducen a la ventilación alveolar y la PaCO₂. Una flecha discontinua entre ambas columnas recuerda que los dos procesos interactúan, por ejemplo cuando la PEEP recluta o sobredistiende.](/learning/diagrams/b1-oxigenacion-dos-objetivos.svg "Figura: controles de la oxigenación y de la ventilación")

<!-- block: THEORY | Los cinco mecanismos de hipoxemia -->
Sarkar et al. (2017) agrupan las causas de hipoxemia en cinco mecanismos, y el desajuste V/Q es el más frecuente:

| Mecanismo | Gradiente A-a | Respuesta al aumentar la FiO₂ |
|---|---|---|
| PO₂ inspirada baja (altitud) | Normal | Buena |
| Hipoventilación alveolar | Normal | Buena |
| Desajuste V/Q | Aumentado | Buena |
| Shunt | Aumentado | Pobre |
| Limitación de la difusión | Aumentado | Buena |

El gradiente alveolo-arterial, que calcularás en la página siguiente, es la herramienta que separa las causas "extrapulmonares" (aire pobre en O₂, ventilación insuficiente) de las causas por enfermedad del parénquima.

<!-- page: formulas-gas-alveolar | EXERCISE | Fórmulas y cálculo: gas alveolar, gradiente A-a y presión media -->
<!-- block: EQUATION | Ecuación del gas alveolar (forma simplificada) -->
P_AO_2 = F_iO_2\,(P_{atm} - P_{H_2O}) - \frac{P_aCO_2}{R}

<!-- block: THEORY | Qué significa cada término -->
- $P_AO_2$: presión parcial de O₂ en el alvéolo (mmHg). No se mide directamente; se estima con esta ecuación.
- $F_iO_2$: fracción inspirada de oxígeno (0,21 a 1,0).
- $P_{atm}$: presión barométrica (mmHg); 760 mmHg a nivel del mar. Disminuye con la altitud.
- $P_{H_2O}$: presión de vapor de agua a 37 °C, 47 mmHg. El gas que llega al alvéolo está saturado de vapor.
- $P_aCO_2$: PaCO₂ arterial (mmHg), que sustituye a la PCO₂ alveolar.
- $R$: cociente respiratorio, habitualmente 0,8.

La ecuación muestra con claridad la interacción entre los dos objetivos: **la PaCO₂ "desplaza" al oxígeno alveolar**. Un paciente que hipoventila respirando aire ambiente se vuelve hipoxémico aunque su pulmón sea normal (West & Luks, 2021).

El **gradiente alveolo-arterial** compara lo que hay en el alvéolo con lo que llega a la sangre:

$$
\text{Gradiente A-a} = P_AO_2 - P_aO_2
$$

Incluso en un pulmón sano existe un gradiente pequeño, por la heterogeneidad V/Q fisiológica, que aumenta con la edad; una estimación del valor esperado respirando aire ambiente es $(\text{edad} + 10)/4$ (Hantzidiamantis & Amaro, 2023). El gradiente aumenta también con la FiO₂, por lo que su valor de referencia solo es aplicable con aire ambiente.

<!-- block: THEORY | Ejemplo resuelto 1: aire ambiente a nivel del mar -->
Paciente de 60 años, $F_iO_2 = 0{,}21$, $P_{atm} = 760$ mmHg, $P_aCO_2 = 40$ mmHg, $P_aO_2 = 75$ mmHg.

1. Presión inspirada de O₂: $0{,}21 \times (760 - 47) = 0{,}21 \times 713 \approx 150\,\text{mmHg}$.
2. PO₂ alveolar: $150 - 40/0{,}8 = 150 - 50 = 100\,\text{mmHg}$.
3. Gradiente A-a: $100 - 75 = 25\,\text{mmHg}$.
4. Gradiente esperado para la edad: $(60 + 10)/4 = 17{,}5\,\text{mmHg}$.

El gradiente está aumentado: la hipoxemia no se explica solo por la PaCO₂ ni por el aire inspirado; hay un problema de intercambio en el pulmón.

**Variación (hipoventilación pura).** Mismo paciente con PaCO₂ de 70 mmHg por sobredosis de opioides y PaO₂ de 50 mmHg: $P_AO_2 = 150 - 70/0{,}8 = 62{,}5$ mmHg, gradiente $= 12{,}5$ mmHg. El gradiente es normal: la hipoxemia se debe a la hipoventilación y el tratamiento es restablecer la ventilación.

**Variación (altitud).** Si la presión barométrica fuera de 560 mmHg, la presión inspirada de O₂ con aire ambiente sería $0{,}21 \times (560 - 47) \approx 108$ mmHg: el punto de partida de toda la cascada del oxígeno es más bajo.

![Gráfico de barras escalonado que representa la cascada del oxígeno a nivel del mar con aire ambiente: presión inspirada de unos 150 mmHg, alveolar de unos 100 mmHg y arterial menor, con el gradiente alveolo-arterial señalado entre las dos últimas barras.](/learning/diagrams/b1-oxigenacion-cascada-o2.svg "Figura: cascada del oxígeno y gradiente A-a")

<!-- block: EQUATION | Presión media de la vía aérea con onda de presión cuadrada (aproximación) -->
\bar{P}_{aw} \approx (P_{insp} - PEEP)\cdot\frac{T_i}{T_{tot}} + PEEP

<!-- block: THEORY | Ejemplo resuelto 2: presión media -->
La expresión anterior aproxima la presión media cuando la onda de presión es cuadrada, como en ventilación controlada por presión (Marini & Ravenscraft, 1992). $P_{insp}$ es la presión total en la vía aérea durante la inspiración (cmH₂O), $T_i$ el tiempo inspiratorio (s) y $T_{tot}$ la duración del ciclo (s), igual a $60/FR$.

Con $P_{insp} = 25$ cmH₂O, PEEP $= 10$ cmH₂O, $FR = 20$/min ($T_{tot} = 3$ s) y $T_i = 1$ s: $\bar{P}_{aw} \approx 15 \times 1/3 + 10 = 15\,\text{cmH}_2\text{O}$. Si subes la PEEP a 12 cmH₂O manteniendo la misma presión inspiratoria total, la presión media apenas cambia ($13 \times 1/3 + 12 \approx 16{,}3$), pero el volumen corriente se reduce porque la diferencia de presión que lo genera es menor. Cada control afecta más de una variable.

<!-- page: aplicacion-clinica-oxigenacion | CASE_STUDY | Aplicación clínica: hipoxemia e hipercapnia en el mismo paciente -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Hombre de 58 años con neumonía multilobar, intubado hace 6 horas. Modo controlado por volumen: volumen corriente de 6 mL/kg de peso corporal predicho, frecuencia 18/min, PEEP 8 cmH₂O, FiO₂ 0,6. Ciudad a nivel del mar.

**Gasometría arterial.** pH 7,28; PaCO₂ 52 mmHg; PaO₂ 64 mmHg; SpO₂ 91 %.

**Razonamiento paso a paso.**

1. **Separa los dos problemas.** Hay una alteración de la ventilación (PaCO₂ elevada con pH ácido: acidosis respiratoria) y una alteración de la oxigenación (PaO₂ de 64 mmHg pese a una FiO₂ de 0,6).
2. **Cuantifica la oxigenación.** $P_AO_2 = 0{,}6 \times 713 - 52/0{,}8 = 427{,}8 - 65 \approx 363$ mmHg. Gradiente A-a $\approx 363 - 64 = 299$ mmHg. La relación PaO₂/FiO₂ es $64/0{,}6 \approx 107$ mmHg. Hay una gran diferencia entre el oxígeno disponible en el alvéolo y el que llega a la sangre, compatible con shunt por alvéolos ocupados o colapsados.
3. **Elige el control adecuado para la oxigenación.** Con un mecanismo de shunt, seguir subiendo la FiO₂ rinde poco (Sarkar et al., 2017) y expone a hiperoxia. La herramienta lógica es valorar con el equipo si un aumento de PEEP recluta alvéolos, vigilando la presión meseta, la compliance y la hemodinamia. En pacientes con SDRA, la red ARDS usó como meta una PaO₂ de 55 a 80 mmHg o una SpO₂ de 88 % a 95 % (ARDS Network, 2000), y la exposición a oxígeno con PaO₂ por encima de esa meta se ha asociado con peores resultados (Aggarwal et al., 2018).
4. **Elige el control adecuado para la ventilación.** La PaCO₂ alta responde a la ventilación alveolar: un aumento de la frecuencia es la opción habitual cuando el volumen corriente ya está en un rango protector, comprobando que el flujo espiratorio llegue a cero antes de la siguiente respiración.
5. **Anticipa la interacción.** Si la PEEP recluta, puede mejorar la oxigenación y también reducir el espacio muerto; si sobredistiende, puede mejorar poco la PaO₂ y aumentar la PaCO₂. Repite la gasometría tras cada cambio relevante.

<!-- block: CALLOUT:info | Metas de oxigenación según el contexto -->
Las metas no son universales. En pacientes hospitalizados en general, la guía de la British Thoracic Society propone una SpO₂ de 94 % a 98 %, y de 88 % a 92 % en quienes tienen riesgo de insuficiencia respiratoria hipercápnica (O'Driscoll et al., 2017). En el SDRA, los ensayos de la red ARDS emplearon una SpO₂ de 88 % a 95 % (ARDS Network, 2000). Usa siempre el protocolo de tu unidad.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y:

1. Aumenta solo la FiO₂ y observa la SpO₂ y la PaO₂; luego observa que la PaCO₂ prácticamente no se modifica.
2. Vuelve a la FiO₂ inicial y aumenta la frecuencia respiratoria: ahora la PaCO₂ y el pH cambian, mientras que la oxigenación varía poco.
3. Aumenta la PEEP en un paso y revisa la oxigenación, la presión meseta y la presión arterial media: comprueba que un mismo control afecta al pulmón y a la circulación.

<!-- block: EXERCISE | Comprueba lo aprendido -->
**1.** FiO₂ 0,21 a nivel del mar, PaCO₂ 30 mmHg, PaO₂ 60 mmHg, paciente de 30 años. ¿Está aumentado el gradiente A-a?

*Respuesta:* $P_AO_2 = 150 - 30/0{,}8 = 112{,}5$ mmHg; gradiente $= 52{,}5$ mmHg. El esperado para 30 años es $(30 + 10)/4 = 10$ mmHg: está claramente aumentado.

**2.** ¿Qué control modificarías primero ante una PaCO₂ de 60 mmHg con SpO₂ de 96 % en un paciente en ventilación controlada sin atrapamiento?

*Respuesta:* la ventilación alveolar (frecuencia o volumen corriente dentro de rangos protectores). La FiO₂ no corrige la hipercapnia.

**3.** ¿Por qué la hipoventilación produce hipoxemia con gradiente A-a normal?

*Respuesta:* porque la PaCO₂ elevada reduce la PO₂ alveolar según la ecuación del gas alveolar; la sangre se equilibra con ese alvéolo "pobre" en oxígeno, sin un defecto de intercambio.

<!-- page: sintesis-oxigenacion | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La ventilación (eliminación de CO₂, PaCO₂) y la oxigenación (PaO₂, SpO₂) son objetivos distintos, con controles distintos en el ventilador.
- La PaCO₂ depende de la ventilación alveolar: frecuencia, volumen corriente y espacio muerto.
- La PaO₂ depende de la FiO₂ y del volumen pulmonar aireado y perfundido, sobre el que actúan la PEEP y la presión media de la vía aérea.
- La ecuación del gas alveolar estima la $P_AO_2$ y muestra que una PaCO₂ alta reduce el oxígeno alveolar.
- El gradiente A-a distingue la hipoxemia por hipoventilación o por baja PO₂ inspirada (gradiente normal) de la causada por enfermedad pulmonar (gradiente aumentado).
- El shunt responde mal a la FiO₂; su corrección requiere abrir alvéolos, si son reclutables.
- Las metas de oxigenación dependen del contexto clínico; evita la hiperoxia innecesaria.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Subir la FiO₂ ante una hipercapnia.** No mejora la eliminación de CO₂ y puede enmascarar una hipoventilación al mantener la SpO₂ normal. En su lugar, aumenta la ventilación alveolar y busca la causa.
- **Subir la frecuencia ante una hipoxemia por shunt.** No abre alvéolos y puede acortar el tiempo espiratorio hasta generar atrapamiento. En su lugar, valora la FiO₂ y la PEEP según la fisiología.
- **Interpretar el gradiente A-a con FiO₂ alta usando la fórmula de la edad.** El gradiente normal crece con la FiO₂ y el valor esperado solo aplica con aire ambiente. En su lugar, usa la relación PaO₂/FiO₂ para seguir la evolución en pacientes con oxígeno suplementario.
- **Olvidar la presión barométrica.** En altitud la presión inspirada de O₂ es menor y la PaO₂ "normal" también. En su lugar, introduce la presión barométrica local en la ecuación del gas alveolar.
- **Tratar la SpO₂ alta como un objetivo en sí mismo.** La hiperoxia no es inocua y en el SDRA se asocia con peores resultados. En su lugar, ajusta la FiO₂ a la meta establecida y redúcela en cuanto sea posible.

<!-- block: REFERENCES | Referencias -->
- Aggarwal, N. R., Brower, R. G., Hager, D. N., Thompson, B. T., Netzer, G., Shanholtz, C., Lagakos, A., & Checkley, W. (2018). Oxygen exposure resulting in arterial oxygen tensions above the protocol goal was associated with worse clinical outcomes in acute respiratory distress syndrome. *Critical Care Medicine, 46*(4), 517–524. [https://doi.org/10.1097/CCM.0000000000002886](https://doi.org/10.1097/CCM.0000000000002886)
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Hantzidiamantis, P. J., & Amaro, E. (2023). Physiology, alveolar to arterial oxygen gradient. En *StatPearls*. StatPearls Publishing. [https://www.ncbi.nlm.nih.gov/books/NBK545153/](https://www.ncbi.nlm.nih.gov/books/NBK545153/)
- Marini, J. J., & Ravenscraft, S. A. (1992). Mean airway pressure: Physiologic determinants and clinical importance—Part 1: Physiologic determinants and measurements. *Critical Care Medicine, 20*(10), 1461–1472. [https://doi.org/10.1097/00003246-199210000-00017](https://doi.org/10.1097/00003246-199210000-00017)
- O'Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl. 1), ii1–ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Sarkar, M., Niranjan, N., & Banyal, P. K. (2017). Mechanisms of hypoxemia. *Lung India, 34*(1), 47–60. [https://doi.org/10.4103/0970-2113.197116](https://doi.org/10.4103/0970-2113.197116)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.
