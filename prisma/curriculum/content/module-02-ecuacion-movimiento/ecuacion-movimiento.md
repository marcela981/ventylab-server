<!-- page: conceptos-ecuacion-movimiento | THEORY | La ecuación del movimiento: de qué se compone la presión -->
<!-- block: INTRODUCTION | Por qué importa en la cabecera del paciente -->
Cada vez que el ventilador entrega una respiración, la pantalla muestra una presión. Esa cifra no es una propiedad del ventilador ni del pulmón por separado: es el resultado de cuánto volumen se introduce, a qué velocidad se introduce y de cómo responde el sistema respiratorio del paciente. La **ecuación del movimiento** es la herramienta que permite descomponer esa presión en sus partes y preguntarse, ante una alarma o un cambio brusco, cuál de ellas cambió.

Su valor práctico es enorme. Con los datos que ofrece cualquier ventilador moderno (volumen, flujo, presión pico, presión meseta y PEEP) puedes saber si una presión elevada se debe a que el aire encuentra dificultad para pasar por la vía aérea o a que el pulmón y la pared torácica se han vuelto más rígidos. Esa distinción orienta decisiones muy distintas: aspirar secreciones o tratar un broncoespasmo en un caso, buscar un neumotórax, una intubación selectiva o un empeoramiento del parénquima en el otro (Grinnan y Truwit, 2005; Pérez-Nieto et al., 2023).

<!-- block: THEORY | Un modelo sencillo: un tubo y un globo -->
Para razonar sobre la mecánica respiratoria se usa un modelo de un solo compartimento: el sistema respiratorio se representa como un **tubo con resistencia** (la vía aérea más el tubo endotraqueal) conectado a un **globo elástico** (el conjunto de pulmones y pared torácica). Es una simplificación, porque un pulmón real tiene millones de unidades con propiedades diferentes, pero describe con precisión suficiente lo que ocurre en la mayoría de los pacientes en condiciones pasivas y es la base de los cálculos que hacen los propios ventiladores (Marini y Crooke, 1993; Lucangelo et al., 2005).

![Esquema de un ventilador conectado a un tubo con una resistencia en zigzag y a un globo elástico; flechas moradas representan la presión muscular del paciente actuando sobre el globo. Debajo se lee la ecuación presión aplicada más presión muscular igual a volumen sobre compliance más resistencia por flujo más PEEP total](/learning/diagrams/b2-ecuacion-modelo-globo.svg "Figura: modelo unicompartimental del sistema respiratorio")

En este modelo, la presión que hay que aplicar en la entrada del tubo tiene que cubrir tres cosas a la vez:

1. **Distender el globo.** Cuanto más volumen haya dentro y más rígido sea, más presión hace falta. Esta es la **presión elástica**, igual al volumen dividido por la compliance (o el volumen multiplicado por la elastancia).
2. **Mover el gas a través del tubo.** Mientras haya flujo, una parte de la presión se disipa venciendo la fricción. Esta es la **presión resistiva**, igual a la resistencia multiplicada por el flujo. Si el flujo es cero, este componente desaparece.
3. **Partir de la presión que ya había.** Al final de la espiración el globo no está a cero: conserva la PEEP programada y, si no ha terminado de vaciarse, una PEEP adicional (auto-PEEP o PEEP intrínseca). La suma de ambas es la **PEEP total**.

<!-- block: THEORY | Quién genera la presión: ventilador, paciente o ambos -->
La fuerza que vence esas cargas puede venir de dos fuentes. En un paciente sedado y sin esfuerzo, toda la presión la aporta el ventilador y se mide en la vía aérea ($P_{aw}$). En un paciente que respira, sus músculos generan una presión adicional ($P_{mus}$) que se suma a la del ventilador. Por eso la versión completa de la ecuación incluye ambos términos: el ventilador y los músculos trabajan juntos contra la misma carga elástica y resistiva (Pérez-Nieto et al., 2023).

Esto tiene una consecuencia importante: **la presión de la vía aérea solo refleja fielmente la mecánica del paciente cuando $P_{mus}$ es cero**. Si el paciente hace esfuerzos, la presión medida puede ser baja aunque el pulmón reciba una distensión importante, porque parte de la fuerza la ponen sus músculos. La presión muscular no se ve en la pantalla habitual; estimarla requiere monitorización adicional, como la presión esofágica (Mauri et al., 2016). Por la misma razón, las mediciones de compliance y resistencia que verás en las lecciones siguientes deben hacerse con el paciente relajado.

<!-- block: THEORY | Presión pico y presión meseta -->
Dos lecturas del ventilador permiten separar los componentes en la práctica:

- **Presión pico (Ppico):** la máxima presión durante la inspiración. En ventilación controlada por volumen con flujo constante coincide con el final del flujo, cuando el volumen es máximo y además sigue habiendo flujo. Incluye los tres componentes.
- **Presión meseta (Pmeseta):** la presión que queda cuando, al final de la inspiración, se cierra el circuito durante una breve pausa sin flujo. Al no haber flujo, el componente resistivo desaparece y la presión de la vía aérea se equilibra con la presión alveolar (Grinnan y Truwit, 2005). La meseta refleja el componente elástico más la PEEP total.

De ahí salen dos diferencias que usarás constantemente: **Ppico − Pmeseta** corresponde al componente resistivo, y **Pmeseta − PEEP total** corresponde al componente elástico, conocido como presión de distensión o *driving pressure* ($\Delta P$).

<!-- page: formulas-y-calculo | THEORY | Fórmulas y cálculo -->
<!-- block: THEORY | La ecuación y sus términos -->
La ecuación del movimiento del sistema respiratorio, en su forma clínica habitual, se escribe así:

$$
P_{aw} + P_{mus} = \frac{V}{C_{rs}} + R_{aw}\cdot\dot{V} + PEEP_{total}
$$

| Símbolo | Significado | Unidades habituales |
|---|---|---|
| $P_{aw}$ | Presión aplicada por el ventilador en la vía aérea proximal | cmH₂O |
| $P_{mus}$ | Presión generada por los músculos respiratorios | cmH₂O |
| $V$ | Volumen introducido por encima del volumen de fin de espiración | L |
| $C_{rs}$ | Compliance del sistema respiratorio (pulmón y pared) | L/cmH₂O (o mL/cmH₂O) |
| $R_{aw}$ | Resistencia de la vía aérea, incluido el tubo endotraqueal | cmH₂O/L/s |
| $\dot{V}$ | Flujo en ese instante | L/s |
| $PEEP_{total}$ | PEEP programada más auto-PEEP | cmH₂O |

Cuida las unidades: si el flujo está en L/min, divídelo entre 60 para pasarlo a L/s; si la compliance está en mL/cmH₂O, divide el volumen en mililitros entre ella o convierte ambos a litros. La ecuación se puede escribir también con la elastancia, que es el inverso de la compliance ($E_{rs} = 1/C_{rs}$), de modo que el término elástico queda como $E_{rs}\cdot V$ (Grinnan y Truwit, 2005).

<!-- block: EQUATION | Ecuación en un paciente pasivo -->
P_{aw} = \frac{V}{C_{rs}} + R_{aw}\cdot\dot{V} + PEEP_{total}

<!-- block: THEORY | Qué controla el ventilador y qué depende del paciente -->
La ecuación tiene cinco magnitudes, y el ventilador solo puede fijar una parte. La otra parte la determina el paciente. Por eso la ecuación explica de forma directa la diferencia entre los dos modos básicos (Lucangelo et al., 2005):

- **Ventilación controlada por volumen (VCV):** programas el volumen y el patrón de flujo. Con $V$ y $\dot{V}$ fijos, la presión es la variable dependiente: si la compliance cae o la resistencia sube, la presión sube. Por eso, en VCV, vigilas presiones.
- **Ventilación controlada por presión (PCV):** programas la presión por encima de la PEEP y el tiempo inspiratorio. Con $P_{aw}$ fijo, el flujo y el volumen son las variables dependientes: si la compliance cae o la resistencia sube, el volumen entregado baja. Por eso, en PCV, vigilas volúmenes.

En PCV, al inicio de la inspiración la presión aplicada se gasta casi toda en el componente resistivo (el globo aún está vacío y el flujo es máximo); conforme el volumen aumenta, crece el componente elástico y el gradiente para el flujo se reduce, de ahí el flujo desacelerado. Si el tiempo inspiratorio es suficiente, el flujo llega a cero y la presión alveolar alcanza la presión programada.

<!-- block: THEORY | Ejemplo resuelto en VCV -->
Un paciente sedado, sin esfuerzo, ventilado en VCV con flujo constante:

- Volumen corriente: $V_t = 450\,\text{mL} = 0{,}45\,\text{L}$
- Flujo inspiratorio: $60\,\text{L/min} = 1\,\text{L/s}$
- Compliance: $C_{rs} = 45\,\text{mL/cmH}_2\text{O} = 0{,}045\,\text{L/cmH}_2\text{O}$
- Resistencia: $R_{aw} = 10\,\text{cmH}_2\text{O/L/s}$
- PEEP programada $5\,\text{cmH}_2\text{O}$, sin auto-PEEP

**Paso 1, componente elástico al final de la inspiración:**

$$
\frac{V_t}{C_{rs}} = \frac{0{,}45}{0{,}045} = 10\,\text{cmH}_2\text{O}
$$

**Paso 2, componente resistivo (mientras hay flujo):**

$$
R_{aw}\cdot\dot{V} = 10 \cdot 1 = 10\,\text{cmH}_2\text{O}
$$

**Paso 3, presiones esperadas:**

$$
P_{pico} = 10 + 10 + 5 = 25\,\text{cmH}_2\text{O} \qquad P_{meseta} = 10 + 5 = 15\,\text{cmH}_2\text{O}
$$

La *driving pressure* es $15 - 5 = 10\,\text{cmH}_2\text{O}$, y la diferencia pico menos meseta, $10\,\text{cmH}_2\text{O}$, corresponde íntegramente a la resistencia. Observa que si duplicas el flujo a $2\,\text{L/s}$ la presión pico sube a $35\,\text{cmH}_2\text{O}$, pero la meseta no cambia: el pulmón recibe el mismo volumen, solo que más rápido.

![Curvas de flujo y presión en el tiempo en VCV. El flujo es cuadrado durante la inspiración, cero en la pausa y negativo y decreciente en la espiración. La presión parte de la PEEP de 5, salta a 15 al iniciarse el flujo, sube en rampa hasta un pico de 25 y cae a una meseta de 15 durante la pausa](/learning/diagrams/b2-ecuacion-vcv-componentes.svg "Figura: descomposición de la presión en VCV con pausa inspiratoria")

<!-- block: THEORY | Ejemplo resuelto en PCV -->
En PCV, el volumen que entra depende de la presión aplicada, de la compliance y de la constante de tiempo ($\tau = R\cdot C$), un concepto que se desarrolla en la lección «Resistencia de la vía aérea y constante de tiempo». Con una presión de $15\,\text{cmH}_2\text{O}$ sobre la PEEP, $C_{rs} = 0{,}03\,\text{L/cmH}_2\text{O}$ y $R_{aw} = 10\,\text{cmH}_2\text{O/L/s}$, la constante de tiempo es $0{,}3\,\text{s}$. El flujo máximo al inicio es $15/10 = 1{,}5\,\text{L/s}$ (90 L/min). Si el tiempo inspiratorio es de $1\,\text{s}$ (algo más de tres constantes de tiempo), el volumen se acerca a su máximo teórico:

$$
V_t = C_{rs}\cdot \Delta P \cdot \left(1 - e^{-T_i/\tau}\right) = 0{,}03 \cdot 15 \cdot \left(1 - e^{-1/0{,}3}\right) \approx 0{,}43\,\text{L}
$$

Si la compliance cayera a la mitad, con la misma presión entrarían alrededor de 0,22 L: en PCV el deterioro mecánico se manifiesta como pérdida de volumen, no como alarma de presión.

<!-- page: aplicacion-clinica-ecuacion | CASE_STUDY | Aplicación clínica: leer una alarma de presión alta -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** hombre de 58 años, en el postoperatorio inmediato de una laparotomía, intubado con tubo de 7,5 mm, sedado y sin esfuerzo inspiratorio. Ventilado en VCV con $V_t = 450\,\text{mL}$, flujo constante de 60 L/min, frecuencia 16/min y PEEP 5 cmH₂O.

**Situación basal (hora 0):** Ppico 24 cmH₂O, Pmeseta 15 cmH₂O, sin auto-PEEP en la pausa espiratoria. SpO₂ 97 %.

**Hora 3:** salta la alarma de presión alta. El ventilador muestra Ppico 39 cmH₂O. Realizas una pausa inspiratoria: Pmeseta 16 cmH₂O.

**Paso 1, separar componentes.**
- Componente resistivo basal: $24 - 15 = 9\,\text{cmH}_2\text{O}$; ahora $39 - 16 = 23\,\text{cmH}_2\text{O}$.
- Componente elástico basal: $15 - 5 = 10\,\text{cmH}_2\text{O}$; ahora $16 - 5 = 11\,\text{cmH}_2\text{O}$.

**Paso 2, interpretar.** La presión subió casi exclusivamente por el componente resistivo. Con el flujo constante de 1 L/s, la resistencia estimada pasó de unos 9 a unos 23 cmH₂O/L/s. Un aumento brusco de la presión pico sin aumento de la meseta indica un aumento de la resistencia, y sus causas más frecuentes (problemas del circuito, secreciones o broncoespasmo) son tratables de inmediato (Grinnan y Truwit, 2005).

**Paso 3, buscar la causa de forma ordenada:** recorre el circuito desde el paciente hacia el ventilador. ¿El tubo está acodado o mordido? ¿Hay secreciones audibles o visibles en la curva de flujo? ¿Hay sibilancias? ¿El filtro o intercambiador de calor y humedad está saturado de agua o secreciones? En este paciente encuentras secreciones espesas; tras la aspiración, la Ppico vuelve a 25 cmH₂O.

**Variante para comparar:** si en la hora 3 la pausa hubiera mostrado Pmeseta 29 cmH₂O con Ppico 38 cmH₂O, la diferencia pico menos meseta seguiría en 9 y el problema sería elástico: el sistema respiratorio se habría vuelto más rígido. Las causas que deberías descartar entonces son otras, como un neumotórax a tensión, la intubación del bronquio principal, la hiperinflación dinámica o el edema pulmonar (Grinnan y Truwit, 2005). Una meseta próxima a 30 cmH₂O, además, se acerca al límite que usó el ensayo de la ARDS Network en pacientes con SDRA, cuya estrategia protectora mantuvo la Pmeseta en 30 cmH₂O o menos (ARDS Network, 2000). Este paciente no tiene SDRA, pero el hallazgo obliga a buscar la causa sin demora.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) en VCV y prueba lo siguiente:

1. Anota la presión pico y la meseta iniciales. Después aumenta el flujo inspiratorio: verás que la presión pico sube y que la meseta prácticamente no cambia.
2. Aumenta la resistencia del paciente: la diferencia entre pico y meseta se amplía, mientras la meseta se mantiene.
3. Reduce la compliance: suben juntas la presión pico y la meseta, y la diferencia entre ambas se conserva.
4. Cambia a PCV y repite la reducción de compliance: ahora la presión no cambia, pero el volumen corriente cae y el flujo se hace cero antes.

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** En VCV con $V_t = 0{,}5\,\text{L}$, flujo 1 L/s, $C_{rs} = 0{,}05\,\text{L/cmH}_2\text{O}$, $R_{aw} = 12\,\text{cmH}_2\text{O/L/s}$ y PEEP 6 cmH₂O, ¿qué presión pico y meseta esperas?

*Respuesta:* componente elástico $0{,}5/0{,}05 = 10$; resistivo $12 \cdot 1 = 12$. Ppico $= 10 + 12 + 6 = 28\,\text{cmH}_2\text{O}$; Pmeseta $= 10 + 6 = 16\,\text{cmH}_2\text{O}$.

**2.** Un paciente en PCV con presión de 14 cmH₂O sobre la PEEP pasa de un volumen corriente de 480 mL a 320 mL en una hora sin que cambie la programación. ¿Qué te dice la ecuación?

*Respuesta:* con la presión fija, la caída de volumen indica que empeoró la compliance, que aumentó la resistencia (si el tiempo inspiratorio ya no basta para que el flujo llegue a cero) o que el paciente desarrolló auto-PEEP que reduce el gradiente efectivo. Debes medir: pausa inspiratoria y espiratoria y revisar la curva de flujo.

**3.** ¿Por qué no deberías medir la presión meseta mientras el paciente hace esfuerzos inspiratorios?

*Respuesta:* porque $P_{mus}$ deja de ser cero; el esfuerzo modifica la presión medida en la vía aérea durante la pausa y la meseta ya no representa solo la presión elástica del sistema respiratorio.

<!-- page: sintesis-ecuacion-movimiento | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La presión en la vía aérea es la suma de un componente elástico ($V/C_{rs}$), un componente resistivo ($R_{aw}\cdot\dot{V}$) y la PEEP total; si el paciente respira, sus músculos aportan $P_{mus}$.
- La presión pico contiene los tres componentes; la presión meseta, medida con una pausa sin flujo, elimina el resistivo y se aproxima a la presión alveolar.
- Ppico − Pmeseta refleja la resistencia; Pmeseta − PEEP total refleja la elasticidad del sistema respiratorio (*driving pressure*).
- En VCV el volumen y el flujo son fijos y la presión depende del paciente; en PCV la presión es fija y el volumen depende del paciente.
- Un aumento de presión pico con meseta estable orienta a resistencia; un aumento de pico y meseta en paralelo orienta a pérdida de compliance.
- Las mediciones de mecánica solo son interpretables en un paciente pasivo; con esfuerzo, la presión de la vía aérea no representa toda la presión que distiende el pulmón.
- La *driving pressure* fue la variable ventilatoria más asociada con la supervivencia en un análisis de nueve ensayos en SDRA, donde un aumento de una desviación estándar (unos 7 cmH₂O) se asoció con mayor mortalidad (Amato et al., 2015); es un dato observacional, no una meta validada en ensayos.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Interpretar la presión pico aislada** → mezcla resistencia y elasticidad, de modo que no indica qué cambió → haz siempre una pausa inspiratoria y compara pico con meseta.
- **Medir la meseta con el paciente haciendo esfuerzos** → $P_{mus}$ distorsiona la lectura y la compliance calculada no es fiable → mide con el paciente relajado y repite si la curva de pausa no es estable.
- **Olvidar la auto-PEEP** → si usas la PEEP programada en lugar de la PEEP total, sobrestimas el componente elástico y subestimas la compliance → realiza una pausa espiratoria antes de calcular.
- **Esperar alarmas de presión en PCV** → en PCV la presión está fijada, así que el empeoramiento se manifiesta como caída del volumen corriente → ajusta y vigila las alarmas de volumen y de ventilación minuto.
- **Mezclar unidades** → usar flujo en L/min o volumen en mL sin convertir da resultados 60 o 1000 veces erróneos → convierte el flujo a L/s y usa volumen y compliance en las mismas unidades.
- **Subir la sedación como primera respuesta a una presión alta** → oculta problemas mecánicos tratables → separa primero los componentes y descarta tubo obstruido, secreciones, broncoespasmo o neumotórax.

<!-- block: REFERENCES | Referencias -->
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., et al. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747–755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network [Acute Respiratory Distress Syndrome Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Grinnan, D. C., & Truwit, J. D. (2005). Clinical review: Respiratory mechanics in spontaneous and assisted ventilation. *Critical Care, 9*(5), 472–484. [https://doi.org/10.1186/cc3516](https://doi.org/10.1186/cc3516)
- Lucangelo, U., Bernabé, F., & Blanch, L. (2005). Respiratory mechanics derived from signals in the ventilator circuit. *Respiratory Care, 50*(1), 55–67. [https://pubmed.ncbi.nlm.nih.gov/15636645/](https://pubmed.ncbi.nlm.nih.gov/15636645/)
- Marini, J. J., & Crooke, P. S. (1993). A general mathematical model for respiratory dynamics relevant to the clinical setting. *American Review of Respiratory Disease, 147*(1), 14–24. [https://doi.org/10.1164/ajrccm/147.1.14](https://doi.org/10.1164/ajrccm/147.1.14)
- Mauri, T., Yoshida, T., Bellani, G., Goligher, E. C., Carteaux, G., Rittayamai, N., Mojoli, F., Chiumello, D., Piquilloud, L., Grasso, S., et al. (2016). Esophageal and transpulmonary pressure in the clinical setting: Meaning, usefulness and perspectives. *Intensive Care Medicine, 42*(9), 1360–1373. [https://doi.org/10.1007/s00134-016-4400-x](https://doi.org/10.1007/s00134-016-4400-x)
- Pérez-Nieto, O. R., Mancilla-Galindo, J., Mendiola-Villalobos, C., Carrión-Moya, J. D., Zamarrón-López, E. I., Guerrero-Gutiérrez, M. A., et al. (2023). Aplicaciones clínicas de la ecuación del movimiento del sistema respiratorio para la toma de decisiones en el paciente bajo ventilación mecánica invasiva: artículo de reflexión. *Iatreia, 36*(1), 112–127. [https://doi.org/10.17533/udea.iatreia.179](https://doi.org/10.17533/udea.iatreia.179)
