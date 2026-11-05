<!-- page: conceptos-pcv | THEORY | Cómo funciona la ventilación controlada por presión -->
<!-- block: INTRODUCTION | Por qué importa entender la PCV -->
En la ventilación controlada por presión (PCV, en la taxonomía PC-CMVs) el ventilador no promete un volumen: promete una presión. Durante todo el tiempo inspiratorio mantiene en la vía aérea el nivel que programaste, y el volumen que entra depende de cuánto se deja distender el sistema respiratorio, de cuánto se opone la vía aérea al paso del gas y de cuánto tiempo le das a la inspiración.

Esto la hace muy útil cuando quieres poner un techo firme a la presión inspiratoria, pero exige un cambio de mentalidad respecto a la VCV: ahora la variable que se mueve sola es el volumen corriente. Un tapón de moco, un neumotórax o un paciente que empieza a hacer esfuerzos intensos cambian el volumen sin que el ventilador lo impida. Saber predecir esos cambios es la base para usar la PCV con seguridad.

<!-- block: THEORY | Qué programas y qué resulta -->
En PCV programas (Hess & Kacmarek, 2019):

- **Presión inspiratoria**: según el equipo, como presión por encima de la PEEP o como presión total. Confirma siempre cuál de las dos muestra tu ventilador.
- **Tiempo inspiratorio ($T_I$)**, que es el criterio de ciclado: la inspiración termina por tiempo.
- **Frecuencia de respaldo**, **PEEP**, **FiO₂** y **sensibilidad del trigger**.
- **Tiempo de subida (rise time)**: la rapidez con que el ventilador alcanza la presión programada al inicio de la inspiración.

Lo que **resulta** es el volumen corriente, el flujo inspiratorio (su pico y su forma) y, por tanto, la ventilación minuto. La presión pico es prácticamente la programada, porque el ventilador ajusta el flujo instante a instante para mantenerla.

<!-- block: THEORY | Por qué el flujo desacelera -->
Al inicio de la inspiración la presión en la vía aérea sube de golpe hasta el nivel programado, mientras que la presión alveolar todavía está en la PEEP. Ese gradiente es máximo, y por eso el flujo también lo es. A medida que el gas entra, la presión alveolar sube, el gradiente entre la vía aérea y el alvéolo se reduce y el flujo cae. En un modelo de un solo compartimento esa caída es exponencial y su ritmo lo marca la constante de tiempo $\tau = R\cdot C$, que estudiaste en «Resistencia de la vía aérea y constante de tiempo».

Si el tiempo inspiratorio es suficientemente largo, el flujo llega a cero antes del ciclado: en ese momento la presión alveolar iguala a la de la vía aérea y la presión meseta coincide con la presión inspiratoria programada. Si el flujo todavía no es cero cuando termina la inspiración, el alvéolo no alcanzó esa presión y el volumen entregado es menor que el máximo posible.

![Tres gráficas apiladas de presión, flujo y volumen frente al tiempo en PCV: la presión es cuadrada al nivel programado; el flujo inspiratorio tiene un pico inicial y desacelera de forma exponencial hasta casi cero; el volumen sube rápido al principio y luego más lento](/learning/diagrams/b5-pcv-curvas-escalares.svg "Figura: curvas escalares de la PCV")

<!-- block: THEORY | Las curvas que debes reconocer -->
- **Presión-tiempo:** forma cuadrada. La pendiente inicial depende del rise time; después, una meseta plana al nivel programado durante todo el $T_I$.
- **Flujo-tiempo:** pico al inicio y caída exponencial. Mira si llega a cero antes del final de la inspiración; si no llega, alargar el $T_I$ aumentará el volumen.
- **Volumen-tiempo:** curva que sube rápido al principio y se aplana después. Su altura final es el volumen corriente, que cambia con la mecánica.

En la espiración, el comportamiento es el mismo que en VCV: pasiva, con flujo negativo máximo al inicio y descenso exponencial. Si el flujo espiratorio no vuelve a cero antes del ciclo siguiente, hay atrapamiento aéreo (auto-PEEP), que en PCV tiene una consecuencia adicional: reduce el gradiente de presión y, con él, el volumen entregado.

<!-- page: formulas-pcv | THEORY | Fórmulas y cálculo en PCV -->
<!-- block: THEORY | El volumen corriente en PCV -->
En un paciente pasivo, con un modelo de un solo compartimento y una subida de presión instantánea, el volumen al final de la inspiración es (Hess & Kacmarek, 2019):

$$
V_T = C_{rs}\cdot\Delta P\cdot\left(1 - e^{-T_I/\tau}\right)
$$

con

$$
\tau = R_{aw}\cdot C_{rs} \qquad \dot{V}_{pico} = \frac{\Delta P}{R_{aw}}
$$

| Símbolo | Significado | Unidad |
|---|---|---|
| $V_T$ | Volumen corriente entregado | L (o mL) |
| $C_{rs}$ | Compliance del sistema respiratorio | L/cmH₂O |
| $\Delta P$ | Presión inspiratoria por encima de la PEEP total | cmH₂O |
| $T_I$ | Tiempo inspiratorio | s |
| $\tau$ | Constante de tiempo del sistema | s |
| $R_{aw}$ | Resistencia inspiratoria | cmH₂O/(L/s) |
| $\dot{V}_{pico}$ | Flujo inspiratorio al inicio | L/s |

La fórmula muestra los tres determinantes del volumen: la presión aplicada ($\Delta P$), la distensibilidad ($C_{rs}$) y la relación entre el tiempo inspiratorio y la constante de tiempo. El término entre paréntesis es la fracción del volumen máximo que se alcanza: 63 % con un $T_I$ igual a una constante de tiempo, 86 % con dos y 95 % con tres. Observa también que el término de PEEP total incluye la auto-PEEP: si hay atrapamiento, el $\Delta P$ efectivo es menor que el programado.

![Volumen corriente frente al tiempo inspiratorio en PCV con 15 cmH₂O sobre la PEEP: con compliance de 40 mL/cmH₂O la curva se acerca a 600 mL y marca el 63, 86 y 95 % en una, dos y tres constantes de tiempo; con compliance de 25 mL/cmH₂O se acerca solo a 375 mL](/learning/diagrams/b5-pcv-volumen-segun-ti.svg "Figura: el volumen en PCV depende de la compliance y del tiempo inspiratorio")

<!-- block: THEORY | Ejemplo resuelto -->
Programas PC-CMVs con presión inspiratoria de $15\,\text{cmH}_2\text{O}$ sobre una PEEP de $5\,\text{cmH}_2\text{O}$ (presión total de $20\,\text{cmH}_2\text{O}$) y frecuencia de 20 ciclos/min. El paciente está pasivo, con $C_{rs} = 40\,\text{mL/cmH}_2\text{O}$ ($0{,}04\,\text{L/cmH}_2\text{O}$) y $R_{aw} = 10\,\text{cmH}_2\text{O/(L/s)}$, sin auto-PEEP.

1. Constante de tiempo: $\tau = 10 \times 0{,}04 = 0{,}4\,\text{s}$.
2. Volumen máximo posible: $C_{rs}\cdot\Delta P = 0{,}04 \times 15 = 0{,}600\,\text{L}$.
3. Flujo pico: $\dot{V}_{pico} = 15/10 = 1{,}5\,\text{L/s} = 90\,\text{L/min}$.
4. Con $T_I = 0{,}8\,\text{s}$ (dos constantes de tiempo): $V_T = 600 \times (1 - e^{-2}) = 600 \times 0{,}865 \approx 519\,\text{mL}$. El flujo no llega a cero al ciclar.
5. Con $T_I = 1{,}2\,\text{s}$ (tres constantes de tiempo): $V_T = 600 \times 0{,}950 = 570\,\text{mL}$. Ganas 51 mL sin subir la presión, pero el tiempo espiratorio baja de $3{,}0 - 0{,}8 = 2{,}2\,\text{s}$ a $3{,}0 - 1{,}2 = 1{,}8\,\text{s}$.

Ahora la compliance cae a $25\,\text{mL/cmH}_2\text{O}$ (por ejemplo, por una atelectasia) con el mismo ajuste de $T_I = 1{,}2\,\text{s}$:

- $\tau = 10 \times 0{,}025 = 0{,}25\,\text{s}$; el $T_I$ equivale a $1{,}2/0{,}25 = 4{,}8$ constantes de tiempo.
- $V_T = 0{,}025 \times 15 \times (1 - e^{-4{,}8}) = 375 \times 0{,}992 \approx 372\,\text{mL}$.
- La ventilación minuto pasa de $0{,}570 \times 20 = 11{,}4$ a $0{,}372 \times 20 = 7{,}4\,\text{L/min}$, una caída de alrededor del 35 %.

La presión en el monitor no se movió. Solo la alarma de volumen espirado o de ventilación minuto te avisaría del cambio.

<!-- block: THEORY | El tiempo de subida (rise time) -->
El rise time regula la pendiente inicial de la curva de presión. Una subida rápida entrega un flujo inicial alto, útil para pacientes con alta demanda; si es demasiado rápida puede producir un pico de presión por encima del objetivo y sensación de disconfort. Una subida lenta reduce el flujo inicial y puede dejar al paciente con hambre de flujo y aumentar su trabajo respiratorio (Hess & Kacmarek, 2019). Ajústalo observando la curva de presión (que llegue al objetivo sin sobrepasarlo) y al paciente.

<!-- page: aplicacion-pcv | CASE_STUDY | Aplicación clínica: cuando el volumen cambia -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
Hombre de 52 años, 170 cm (peso predicho de unos 66 kg con la fórmula del ensayo ARDSNet; Acute Respiratory Distress Syndrome Network, 2000), con SDRA por neumonía, sedado y sin esfuerzos. Está en PC-CMVs: presión inspiratoria de $14\,\text{cmH}_2\text{O}$ sobre una PEEP de $10\,\text{cmH}_2\text{O}$, $T_I = 0{,}9\,\text{s}$, frecuencia de 24 ciclos/min y FiO₂ de 0,6. El volumen espirado es de 400 mL (6,1 mL/kg) y el flujo inspiratorio llega a cero antes del ciclado. Con una pausa inspiratoria, la meseta es de $24\,\text{cmH}_2\text{O}$: $\Delta P = 14\,\text{cmH}_2\text{O}$ y $C_{rs} = 400/14 \approx 29\,\text{mL/cmH}_2\text{O}$. Volumen y presión están dentro de los objetivos de protección pulmonar recomendados para el SDRA: 4-8 mL/kg de peso predicho y meseta menor de $30\,\text{cmH}_2\text{O}$ (Fan et al., 2017).

**Día 2, por la mañana.** Se reduce la sedación. El paciente hace esfuerzos inspiratorios vigorosos y el volumen espirado sube a 620 mL (9,4 mL/kg) con la misma presión programada.

- En PCV, el esfuerzo muscular se suma a la presión del ventilador. La presión que distiende el pulmón (presión transpulmonar) es mayor que la que ves en el monitor, y el volumen sale del rango protector.
- La presión de la vía aérea no lo revela: el volumen espirado sí. Por eso, en PCV la alarma de volumen alto y la vigilancia del volumen por kilo de peso predicho son imprescindibles.
- Opciones: reducir la presión inspiratoria, valorar la causa del impulso (dolor, acidosis, hipoxemia, delirio) y ajustar la sedación y la analgesia. En presión controlada, el volumen no queda protegido frente al esfuerzo del paciente, porque la presión muscular se suma a la del ventilador en la ecuación del movimiento (Hess & Kacmarek, 2019).

**Día 2, por la tarde.** El paciente vuelve a estar pasivo. Suena la alarma de volumen bajo: 290 mL. La PaCO₂ subió respecto a la gasometría previa.

- La presión programada es la misma, así que el volumen bajó porque cambió la mecánica: compliance menor (atelectasia, neumotórax, intubación selectiva), resistencia mayor que impide completar el llenado (secreciones, broncoespasmo) o auto-PEEP que reduce el gradiente.
- Mira la curva de flujo: si ahora no llega a cero al final de la inspiración, la resistencia o la constante de tiempo aumentaron; si llega a cero antes que en la mañana, la compliance cayó.
- Trata la causa (aspirar secreciones, revisar la posición del tubo, descartar neumotórax) antes de subir la presión. Si necesitas subirla, vuelve a medir la meseta y la $\Delta P$.

<!-- block: THEORY | Ventajas, riesgos y lo que dice la evidencia -->
**Ventajas:** la presión inspiratoria tiene un techo fijo; el flujo desacelerado y variable se adapta mejor a la demanda del paciente que un flujo fijo; la presión alveolar máxima no supera la programada en un paciente pasivo.

**Riesgos:** el volumen corriente y la ventilación minuto cambian con la mecánica (hipoventilación si empeora, sobredistensión si mejora o si el paciente hace esfuerzos intensos); un $T_I$ largo acorta la espiración y puede generar auto-PEEP.

**Evidencia:** una revisión sistemática que comparó PC-CMV con VC-CMV en insuficiencia respiratoria aguda, con 34 estudios en general pequeños y de calidad variable, no encontró diferencias en compliance, intercambio gaseoso, hemodinámica, trabajo respiratorio ni resultados clínicos (Rittayamai et al., 2015). Un ensayo multicéntrico en 79 pacientes con SDRA, con meseta limitada a $35\,\text{cmH}_2\text{O}$ o menos en ambos grupos, observó mayor mortalidad hospitalaria con VCV (78 % frente a 51 %), pero en el análisis multivariado la mortalidad se asoció con el fallo de órganos extrapulmonares y no con el modo (Esteban et al., 2000). La conclusión práctica: el modo importa menos que el volumen y la presión que se consiguen con él. Estudiarás la comparación en detalle en «VCV frente a PCV en el paciente complejo».

<!-- block: EXERCISE | Comprueba tu razonamiento -->
**1.** En PCV, con $C_{rs} = 50\,\text{mL/cmH}_2\text{O}$, $R_{aw} = 8\,\text{cmH}_2\text{O/(L/s)}$ y $\Delta P = 12\,\text{cmH}_2\text{O}$, ¿cuál es el volumen máximo posible y qué $T_I$ necesitas para alcanzar el 95 % de él?

*Respuesta:* volumen máximo $= 0{,}05 \times 12 = 0{,}6\,\text{L}$. $\tau = 8 \times 0{,}05 = 0{,}4\,\text{s}$; el 95 % se alcanza en tres constantes de tiempo, $T_I \approx 1{,}2\,\text{s}$, con un volumen de unos 570 mL.

**2.** La curva de flujo inspiratorio llega a cero a la mitad del $T_I$. ¿Ganarás volumen si alargas el $T_I$?

*Respuesta:* no de forma relevante: el alvéolo ya alcanzó la presión programada. Solo acortarías la espiración. Para cambiar el volumen tendrías que cambiar la presión.

**3.** Un paciente en PCV desarrolla auto-PEEP de $5\,\text{cmH}_2\text{O}$. ¿Qué pasa con el volumen?

*Respuesta:* el gradiente efectivo es la presión total programada menos la PEEP total; si la presión total no cambia, el $\Delta P$ efectivo baja 5 cmH₂O y el volumen corriente disminuye.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«SDRA moderado en paciente con obesidad»](/simulador?tab=simular&case=engine-ards-obese) en PCV:

1. Observa el volumen espirado con la presión inicial: con la compliance baja de este paciente, el volumen por cada cmH₂O de presión será pequeño.
2. Alarga el tiempo inspiratorio y mira si el flujo inspiratorio llega a cero; cuando ya llega, más tiempo casi no aporta volumen.
3. Sube la presión inspiratoria y comprueba que el volumen aumenta, pero también lo hace la presión meseta; vigila que no supere el objetivo de protección.
4. Cambia a VCV con el volumen que obtuviste en PCV y compara: ahora la presión es la que cambiará si la mecánica cambia.

<!-- page: sintesis-pcv | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- En PCV el operador fija la presión inspiratoria y el tiempo inspiratorio; el volumen corriente y el flujo son las variables dependientes.
- La curva de presión es cuadrada y la de flujo, desacelerada, porque el gradiente entre la vía aérea y el alvéolo disminuye a medida que el pulmón se llena.
- $V_T = C_{rs}\cdot\Delta P\cdot(1 - e^{-T_I/\tau})$: el volumen depende de la presión, de la compliance y de la relación entre $T_I$ y la constante de tiempo.
- Si el flujo inspiratorio llega a cero antes del ciclado, la presión meseta coincide con la presión programada y alargar el $T_I$ no aporta volumen.
- Los esfuerzos intensos del paciente aumentan el volumen y la presión transpulmonar sin que la presión del monitor lo muestre (Hess & Kacmarek, 2019).
- Las alarmas de volumen espirado y de ventilación minuto son la defensa principal en PCV.
- Comparada con la VCV, la PCV no ha mostrado mejores resultados clínicos (Rittayamai et al., 2015; Esteban et al., 2000); lo que protege es el volumen y la presión alcanzados.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Creer que en PCV el volumen está garantizado.** Cambia con la compliance, la resistencia, la auto-PEEP y el esfuerzo. Vigila el volumen espirado en cada valoración y ajusta las alarmas de volumen.
- **Suponer que una presión baja en el monitor significa un pulmón protegido.** Con esfuerzos intensos, la presión transpulmonar puede ser alta. Calcula el volumen por kilo de peso predicho y valora el esfuerzo.
- **Subir la presión ante un volumen bajo sin buscar la causa.** Un tapón de moco o un neumotórax requieren otra intervención. Revisa la curva de flujo, ausculta y descarta problemas mecánicos primero.
- **Alargar el $T_I$ cuando el flujo ya llega a cero.** No aumenta el volumen y acorta la espiración, con riesgo de atrapamiento. Alarga el $T_I$ solo si el flujo no llega a cero al ciclar.
- **No confirmar si la presión programada es total o sobre la PEEP.** Según el equipo, el mismo número representa presiones distintas. Lee el valor de presión pico en el monitor tras el ajuste.

<!-- block: REFERENCES | Referencias -->
- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Esteban, A., Alía, I., Gordo, F., de Pablo, R., Suarez, J., González, G., & Blanco, J. (2000). Prospective randomized trial comparing pressure-controlled ventilation and volume-controlled ventilation in ARDS. *Chest, 117*(6), 1690-1696. [https://doi.org/10.1378/chest.117.6.1690](https://doi.org/10.1378/chest.117.6.1690)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., Adhikari, N. K. J., Amato, M. B. P., Branson, R., Brower, R. G., Ferguson, N. D., Gajic, O., Gattinoni, L., Hess, D., Mancebo, J., Meade, M. O., McAuley, D. F., Pesenti, A., Ranieri, V. M., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Rittayamai, N., Katsios, C. M., Beloncle, F., Friedrich, J. O., Mancebo, J., & Brochard, L. (2015). Pressure-controlled vs volume-controlled ventilation in acute respiratory failure: A physiology-based narrative and systematic review. *Chest, 148*(2), 340-355. [https://doi.org/10.1378/chest.14-3169](https://doi.org/10.1378/chest.14-3169)
