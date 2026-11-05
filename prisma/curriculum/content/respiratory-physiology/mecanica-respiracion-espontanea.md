<!-- page: conceptos-presiones | THEORY | Conceptos: las presiones que mueven el aire -->
<!-- block: INTRODUCTION | Por qué empezar por la respiración espontánea -->
El ventilador no inventa una física nueva: aplica las mismas leyes que gobiernan la respiración normal, pero desde el otro extremo del sistema. En la respiración espontánea los músculos bajan la presión alrededor del pulmón; en la ventilación con presión positiva la máquina sube la presión en la vía aérea. Para entender esa inversión, que verás en la lección «De la presión negativa a la presión positiva», primero necesitas dominar qué presiones existen, entre qué puntos se miden y qué produce cada diferencia.

Además, muchos pacientes ventilados conservan esfuerzo propio. Sus músculos siguen generando cambios de presión pleural que se suman a la presión del ventilador. Reconocer esa suma es la base para interpretar el disparo, las asincronías y la carga que soporta el pulmón.

<!-- block: THEORY | Cuatro puntos de medida y tres diferencias -->
El aire se mueve siempre desde una presión mayor hacia una menor. Para describir el sistema respiratorio conviene identificar cuatro puntos:

- **Apertura de la vía aérea (Pao)**: boca, nariz o extremo del tubo endotraqueal.
- **Alvéolo (Palv)**: presión del gas en los espacios alveolares.
- **Espacio pleural (Ppl)**: presión en la superficie del pulmón.
- **Superficie corporal (Pbs)**: presión que rodea el tórax; respirando aire ambiente es la atmosférica.

Por convención, las presiones respiratorias se expresan en cmH₂O con referencia a la atmosférica, que vale cero.

Las diferencias entre esos puntos tienen nombre propio:

- **Presión transpulmonar (PL)**: Palv − Ppl. Es la presión que distiende el pulmón como órgano; también se le llama presión de retracción elástica del pulmón.
- **Presión a través de la pared torácica (Pw)**: Ppl − Pbs.
- **Presión del sistema respiratorio (Prs)**: Palv − Pbs, igual a PL + Pw.
- **Presión resistiva**: Pao − Palv, que solo existe mientras hay flujo.

Conviene saber que el término «transpulmonar» se ha usado con dos definiciones distintas en la literatura: diferencia entre la apertura de la vía aérea y la pleura (incluye las vías aéreas) o entre el alvéolo y la pleura (solo el tejido pulmonar). En condiciones estáticas, sin flujo, ambas coinciden; con flujo no, y confundirlas ha generado interpretaciones erróneas (Loring et al., 2016).

![Esquema del pulmón dentro de la caja torácica con los puntos de presión en la apertura de la vía aérea, el alvéolo, el espacio pleural y la superficie corporal, y las definiciones de presión transpulmonar, de la pared torácica y del sistema respiratorio](/learning/diagrams/pr1-mecanica-esquema-presiones.svg "Figura: compartimentos y presiones del sistema respiratorio")

<!-- block: THEORY | El equilibrio en reposo: la capacidad residual funcional -->
Al final de una espiración tranquila no hay flujo, Palv es cero y los músculos están relajados. El pulmón tiende a retraerse hacia adentro por su elasticidad y su tensión superficial; la pared torácica, a esa misma altura, tiende a expandirse hacia afuera. Las dos fuerzas son iguales y opuestas: ese volumen de equilibrio es la **capacidad residual funcional (CRF)**. La oposición entre ambas mantiene la presión pleural por debajo de la atmosférica, alrededor de −5 cmH₂O en el sujeto sano de pie (West & Luks, 2021). La presión pleural no es uniforme: por el peso del pulmón es más negativa en los vértices que en las bases, de modo que en reposo los alvéolos apicales están más distendidos y los basales tienen más margen para expandirse.

Que la presión pleural sea negativa en el sano no es una ley obligatoria: en un sujeto relajado y con la vía aérea abierta puede llegar a ser claramente positiva (Loring et al., 2016). Lo verás en pacientes cuya pared torácica o abdomen comprime el pulmón, un tema que se retoma en la lección sobre presión esofágica.

<!-- block: THEORY | El ciclo inspiración-espiración -->
**Inspiración.** El diafragma y los intercostales externos se contraen, la caja torácica se expande y la presión pleural se hace más negativa. Aumenta PL, el pulmón se distiende, el gas alveolar se rarifica y Palv cae ligeramente por debajo de cero. Ese pequeño gradiente entre la boca (cero) y el alvéolo (negativo) genera el flujo inspiratorio. Al final de la inspiración el flujo se detiene y Palv vuelve a cero.

**Espiración.** Los músculos se relajan; la energía elástica almacenada en el pulmón lo retrae, Palv se vuelve ligeramente positiva y el gas sale. La presión pleural regresa a su valor de reposo.

La presión pleural durante el ciclo tiene dos componentes: uno elástico, proporcional al volumen, y otro resistivo, que hace falta para mover el gas por las vías aéreas. Por eso la curva real de Ppl se adelanta y se separa de la línea puramente elástica (West & Luks, 2021).

![Tres curvas apiladas frente al tiempo durante una respiración tranquila: el volumen sube a 0,5 L y vuelve; la presión alveolar baja a cerca de −1 cmH₂O en inspiración y sube a cerca de +1 en espiración; la presión pleural baja de −5 a cerca de −7,5 cmH₂O, con la parte elástica en línea discontinua](/learning/diagrams/pr1-mecanica-curvas-ciclo.svg "Figura: volumen, presión alveolar y presión pleural en un ciclo espontáneo (valores ilustrativos)")

<!-- page: formulas-mecanica | THEORY | Fórmulas y cálculo: compliance, ecuación del movimiento y trabajo -->
<!-- block: THEORY | Compliance del pulmón, de la pared y del sistema -->
La **compliance** expresa cuánto volumen se obtiene por cada unidad de presión de distensión:

$$
C = \frac{\Delta V}{\Delta P}
$$

- $C$: compliance, en mL/cmH₂O (o L/cmH₂O).
- $\Delta V$: cambio de volumen, en mL.
- $\Delta P$: cambio de la presión de distensión correspondiente, en cmH₂O, medido sin flujo.

Su inversa es la **elastancia** ($E = 1/C$), en cmH₂O/L. Para el pulmón se usa PL; para la pared, Pw; para el sistema, Prs. Pulmón y pared están en serie respecto a la presión, por lo que sus elastancias se suman:

$$
E_{rs} = E_{L} + E_{cw} \quad\Longleftrightarrow\quad \frac{1}{C_{rs}} = \frac{1}{C_{L}} + \frac{1}{C_{cw}}
$$

En el adulto sano la compliance pulmonar es del orden de 200 mL/cmH₂O (West & Luks, 2021); si la pared tiene un valor similar, la del sistema completo queda en la mitad, del orden de 100 mL/cmH₂O.

<!-- block: THEORY | La ecuación del movimiento en respiración espontánea -->
Durante una inspiración espontánea, la presión que generan los músculos ($P_{mus}$) se consume en vencer la elastancia del sistema y la resistencia de las vías aéreas:

$$
P_{mus} = E_{rs}\cdot V + R_{aw}\cdot\dot{V}
$$

- $V$: volumen por encima de la CRF (L); $\dot{V}$: flujo (L/s); $R_{aw}$: resistencia de la vía aérea (cmH₂O·s/L).

En ventilación mecánica sin esfuerzo, el ventilador aporta toda la presión en la apertura de la vía aérea; si el paciente respira y además recibe soporte, ambas presiones se suman. Esa forma general, con PEEP y presión del ventilador, es la que trabajarás en la lección «La ecuación del movimiento».

<!-- block: THEORY | Trabajo respiratorio -->
El **trabajo** mecánico de respirar es la integral de la presión respecto al volumen:

$$
W = \int P\,dV
$$

Se divide en un componente elástico (almacenado durante la inspiración y devuelto en la espiración) y un componente resistivo (disipado como calor). Para medirlo en la práctica se usa la presión esofágica como estimación de la presión pleural, que permite separar el trabajo sobre el pulmón y sobre la pared, por ejemplo con el diagrama de Campbell (Cabello & Mancebo, 2006). Las variaciones de presión esofágica representan las variaciones de la presión pleural, y la diferencia entre la presión en la vía aérea y la esofágica es una estimación válida de la presión transpulmonar (Akoumianaki et al., 2014).

<!-- block: EXERCISE | Ejemplo resuelto -->
Un adulto sano respira en reposo. Durante una inspiración de 0,5 L, en las condiciones estáticas del inicio y del final, la presión pleural pasa de −5 a −7,5 cmH₂O y la presión alveolar es cero en ambos momentos (valores ilustrativos).

**1. Presión transpulmonar al inicio y al final.**
$PL_{inicial} = 0 - (-5) = 5\,\text{cmH}_2\text{O}$; $PL_{final} = 0 - (-7{,}5) = 7{,}5\,\text{cmH}_2\text{O}$. $\Delta PL = 2{,}5\,\text{cmH}_2\text{O}$.

**2. Compliance pulmonar.**
$C_L = 500\,\text{mL} / 2{,}5\,\text{cmH}_2\text{O} = 200\,\text{mL/cmH}_2\text{O}$.

**3. Compliance del sistema si $C_{cw} = 200\,\text{mL/cmH}_2\text{O}$.**
$1/C_{rs} = 1/200 + 1/200 = 1/100$, por lo que $C_{rs} = 100\,\text{mL/cmH}_2\text{O}$.

**4. Trabajo elástico sobre el pulmón.**
Con una relación presión-volumen lineal, el trabajo elástico es el área de un triángulo: $W = \tfrac{1}{2}\cdot\Delta P\cdot\Delta V = 0{,}5 \times 2{,}5\,\text{cmH}_2\text{O} \times 0{,}5\,\text{L} = 0{,}625\,\text{cmH}_2\text{O·L}$. Como $1\,\text{cmH}_2\text{O·L} \approx 0{,}098\,\text{J}$, $W \approx 0{,}061\,\text{J}$ por respiración.

**5. Si la compliance pulmonar cae a la mitad** (100 mL/cmH₂O), el mismo volumen exige $\Delta PL = 5\,\text{cmH}_2\text{O}$ y el trabajo elástico se duplica: $0{,}5 \times 5 \times 0{,}5 = 1{,}25\,\text{cmH}_2\text{O·L}$. Es la razón por la que un pulmón rígido obliga a respirar con volúmenes pequeños y frecuencias altas.

<!-- page: aplicacion-clinica-mecanica | CASE_STUDY | Aplicación clínica: esfuerzo intenso y pulmón rígido -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente:** hombre de 46 años con neumonía bilateral, ingresado en la UCI, que respira de forma espontánea con oxígeno suplementario. Es un paciente ficticio con valores coherentes para el ejercicio.

**Hallazgos:** frecuencia respiratoria de 34 rpm, uso visible de esternocleidomastoideos, tiraje intercostal y respiración paradójica intermitente (el abdomen se hunde en la inspiración). Se le ha colocado un catéter con balón esofágico, que muestra descensos de la presión esofágica de alrededor de 15 cmH₂O por inspiración, frente a los 2 a 3 cmH₂O del ejemplo del sujeto sano.

**Razonamiento paso a paso:**

1. **Compliance reducida.** La neumonía rellena alvéolos y reduce el volumen aireado. Con menos alvéolos disponibles, cada mililitro requiere más presión transpulmonar.
2. **Gran caída de la presión pleural.** Para generar esa presión transpulmonar, los músculos tienen que hacer muy negativa la presión pleural. Como Palv se mantiene cerca de cero, la PL que soporta el tejido aumenta en la misma magnitud que cae la Ppl.
3. **Patrón respiratorio.** Como el trabajo elástico aumenta con el volumen, el paciente reduce el volumen corriente y sube la frecuencia, lo que incrementa la proporción de ventilación de espacio muerto.
4. **Signos de fatiga.** El uso de músculos accesorios y la respiración paradójica sugieren que el diafragma no sostiene la carga. La relación entre carga y capacidad muscular es central para decidir el soporte ventilatorio.
5. **Lectura con presión esofágica.** El balón muestra el esfuerzo real, que la presión en la vía aérea por sí sola no revela. En pacientes ventilados, la presión esofágica permite estimar la presión transpulmonar y el esfuerzo muscular (Akoumianaki et al., 2014).

**Qué se haría:** valorar soporte ventilatorio para descargar los músculos, tratar la causa y vigilar el esfuerzo una vez conectado al ventilador, porque el esfuerzo intenso puede persistir con el soporte. Las implicaciones para la lesión pulmonar se tratan en «Mecanismos de la lesión inducida por el ventilador».

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y:

- Programa un modo espontáneo (PSV o CPAP) y, mientras el paciente simulado mantenga esfuerzo propio, observa que, en las inspiraciones del paciente, la presión en la vía aérea sube por encima de la PEEP solo mientras el ventilador asiste.
- Compara con un modo controlado (VCV): fíjate en que la presión en la vía aérea es positiva durante toda la inspiración, a diferencia de la presión alveolar negativa de la respiración espontánea.
- Si el caso te permite modificar la mecánica del paciente, reduce la compliance y observa que, con el mismo soporte, el volumen corriente disminuye y la frecuencia del paciente tiende a aumentar.

<!-- block: EXERCISE | Preguntas de comprobación -->
**1. Al final de una inspiración espontánea, con la glotis abierta y sin flujo, ¿cuánto vale la presión alveolar?**

Cero (atmosférica). Sin flujo no hay gradiente entre boca y alvéolo.

**2. Si la presión pleural pasa de −5 a −10 cmH₂O con un cambio de volumen de 0,5 L, ¿cuál es la compliance pulmonar estática?**

$\Delta PL = 5\,\text{cmH}_2\text{O}$; $C_L = 500/5 = 100\,\text{mL/cmH}_2\text{O}$, la mitad del valor de referencia del sujeto sano.

**3. ¿Por qué el neumotórax hace que la pared torácica se expanda ligeramente del lado afectado?**

Porque desaparece la presión pleural subatmosférica que retenía la pared hacia adentro; la pared tiende entonces a su posición de reposo, más expandida.

<!-- page: sintesis-mecanica | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- El aire fluye por gradientes de presión: en la inspiración espontánea la presión alveolar cae ligeramente por debajo de la atmosférica.
- La presión transpulmonar (Palv − Ppl) distiende el pulmón; la presión del sistema respiratorio es la suma de la transpulmonar y la de la pared torácica.
- En la CRF la retracción del pulmón y la expansión de la pared se equilibran, y la presión pleural es de alrededor de −5 cmH₂O en el sano (West & Luks, 2021).
- La compliance es ΔV/ΔP sin flujo; pulmón y pared suman sus elastancias.
- La ecuación del movimiento reparte la presión muscular entre un componente elástico y uno resistivo.
- El trabajo respiratorio crece cuando cae la compliance o sube la resistencia; el paciente responde con volúmenes pequeños y frecuencias altas.
- La presión esofágica estima la presión pleural y permite separar las cargas del pulmón y de la pared (Akoumianaki et al., 2014).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Llamar «transpulmonar» a cualquier diferencia de presión** → existen dos definiciones que solo coinciden sin flujo (Loring et al., 2016) → especifica entre qué puntos mides y en qué condición.
- **Asumir que la presión pleural siempre es negativa** → en un sujeto relajado puede ser positiva (Loring et al., 2016) → no extrapoles los valores del sano a todos los pacientes.
- **Medir compliance con flujo presente** → la presión incluye entonces el componente resistivo y la compliance queda subestimada → mide en condiciones estáticas (pausa o final de inspiración sin flujo).
- **Interpretar una presión baja en la vía aérea como ausencia de esfuerzo** → el paciente puede estar generando grandes caídas de presión pleural → observa los músculos, la frecuencia y, si dispones, la presión esofágica.
- **Olvidar que la espiración en reposo es pasiva** → depende de la energía elástica almacenada → si la espiración es activa, piensa en carga aumentada u obstrucción.

<!-- block: REFERENCES | Referencias -->
- Akoumianaki, E., Maggiore, S. M., Valenza, F., Bellani, G., Jubran, A., Loring, S. H., Pelosi, P., Talmor, D., Grasso, S., Chiumello, D., Guérin, C., Patroniti, N., Ranieri, V. M., Gattinoni, L., Nava, S., Terragni, P.-P., Pesenti, A., Tobin, M., Mancebo, J., & Brochard, L. (2014). The application of esophageal pressure measurement in patients with respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 189*(5), 520–531. [https://doi.org/10.1164/rccm.201312-2193CI](https://doi.org/10.1164/rccm.201312-2193CI)
- Cabello, B., & Mancebo, J. (2006). Work of breathing. *Intensive Care Medicine, 32*(9), 1311–1314. [https://doi.org/10.1007/s00134-006-0278-3](https://doi.org/10.1007/s00134-006-0278-3)
- Loring, S. H., Topulos, G. P., & Hubmayr, R. D. (2016). Transpulmonary pressure: The importance of precise definitions and limiting assumptions. *American Journal of Respiratory and Critical Care Medicine, 194*(12), 1452–1457. [https://doi.org/10.1164/rccm.201512-2448CP](https://doi.org/10.1164/rccm.201512-2448CP)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.
