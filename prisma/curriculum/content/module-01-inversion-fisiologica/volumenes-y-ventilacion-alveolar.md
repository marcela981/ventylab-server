<!-- page: conceptos-volumenes | THEORY | Volúmenes, capacidades y espacio muerto -->
<!-- block: INTRODUCTION | No todo el aire que entregas llega al alvéolo -->
El ventilador mide con precisión cuánto gas entra y sale del tubo endotraqueal en cada respiración. Pero el intercambio de oxígeno y de CO₂ solo ocurre donde el gas alveolar toca sangre capilar, y una parte de cada volumen corriente nunca llega a ese lugar o llega a alvéolos mal perfundidos. Entender qué fracción del volumen es útil explica por qué dos pacientes con el mismo volumen minuto pueden tener PaCO₂ muy diferentes, y por qué reducir el volumen corriente sin compensar con la frecuencia puede elevar el CO₂ aunque el monitor muestre un volumen minuto "normal".

<!-- block: THEORY | Volúmenes y capacidades pulmonares -->
Los volúmenes pulmonares son compartimentos que no se superponen; las capacidades son sumas de dos o más volúmenes (Wanger et al., 2005):

| Término | Definición |
|---|---|
| Volumen corriente (Vt) | Gas que entra y sale en una respiración |
| Volumen de reserva inspiratoria (VRI) | Gas adicional que puede inhalarse tras una inspiración corriente |
| Volumen de reserva espiratoria (VRE) | Gas adicional que puede exhalarse tras una espiración corriente |
| Volumen residual (VR) | Gas que queda tras una espiración máxima |
| Capacidad residual funcional (CRF) | VRE + VR: gas en el pulmón al final de una espiración tranquila |
| Capacidad vital (CV) | VRI + Vt + VRE |
| Capacidad pulmonar total (CPT) | Suma de todos los volúmenes |

Los valores normales varían con la edad, el sexo y la talla, por lo que se interpretan frente a valores de referencia y no frente a un número fijo. La espirometría mide los volúmenes que se movilizan, pero no el volumen residual ni, por lo tanto, la CRF ni la CPT, que requieren técnicas como la pletismografía o la dilución de gases (West & Luks, 2021).

![Espirograma esquemático: una línea de volumen frente al tiempo muestra respiraciones corrientes, una inspiración máxima y una espiración máxima. Se señalan el volumen corriente, los volúmenes de reserva inspiratoria y espiratoria, el volumen residual y las capacidades residual funcional, vital y pulmonar total.](/learning/diagrams/b1-volumenes-espirograma.svg "Figura: volúmenes y capacidades pulmonares")

<!-- block: THEORY | La capacidad residual funcional: el reservorio que amortigua -->
La CRF es el volumen de equilibrio del sistema respiratorio: el punto en que el retroceso del pulmón hacia dentro y el de la pared torácica hacia fuera se anulan. Tiene dos funciones clínicas. Es un **reservorio de oxígeno**, que permite tolerar unos minutos de apnea, y mantiene abiertos los alvéolos y las vías aéreas pequeñas al final de la espiración.

La CRF disminuye al pasar del decúbito supino, con la obesidad y, de forma marcada, con la anestesia y la parálisis muscular, porque se pierde el tono que sostiene la pared torácica y el diafragma. Cuando la CRF cae por debajo del volumen al que se cierran las vías aéreas pequeñas, aparecen zonas mal ventiladas y atelectasias (Hedenstierna & Edmark, 2010). La PEEP que programas en el ventilador es, en buena parte, una herramienta para restituir esa CRF perdida.

<!-- block: THEORY | Espacio muerto anatómico, alveolar y fisiológico -->
El **espacio muerto** es la parte del volumen corriente que no participa en el intercambio gaseoso (Tusman et al., 2012). Se distinguen tres conceptos:

- **Espacio muerto anatómico:** el volumen de las vías aéreas de conducción (nariz o tubo, tráquea, bronquios, hasta los bronquiolos terminales). En un adulto en reposo ronda los 150 mL (West & Luks, 2021). En el paciente intubado, el tubo sustituye a la vía aérea superior, pero se añade el **espacio muerto instrumental**: la pieza en Y distal, filtros intercambiadores de calor y humedad, conectores y extensiones.
- **Espacio muerto alveolar:** alvéolos ventilados pero sin perfusión, o con perfusión escasa para su ventilación (relación V/Q alta).
- **Espacio muerto fisiológico:** la suma de ambos. Es el que calculas con la ecuación de Bohr-Enghoff.

Robertson (2015) subraya que un espacio muerto fisiológico elevado rara vez se debe solo a alvéolos sin ninguna perfusión; el mecanismo dominante suele ser la heterogeneidad de la relación ventilación-perfusión.

![Esquema de un volumen corriente dividido en tres partes: el gas que queda en el tubo y las vías de conducción, el gas que llega a alvéolos ventilados sin perfusión y el gas que llega a alvéolos perfundidos, que es la única fracción que intercambia gases.](/learning/diagrams/b1-volumenes-espacio-muerto.svg "Figura: destino de un volumen corriente")

<!-- page: formulas-ventilacion-alveolar | EXERCISE | Fórmulas y cálculo: ventilación minuto, ventilación alveolar y PaCO₂ -->
<!-- block: THEORY | Ventilación minuto y ventilación alveolar -->
La **ventilación minuto** ($\dot{V}_E$) es todo el gas que se moviliza en un minuto:

$$
\dot{V}_E = V_T \cdot FR
$$

La **ventilación alveolar** ($\dot{V}_A$) es la parte que llega a zonas de intercambio:

$$
\dot{V}_A = (V_T - V_D)\cdot FR
$$

Donde $V_T$ es el volumen corriente (mL), $V_D$ el espacio muerto (mL), $FR$ la frecuencia respiratoria (respiraciones/min) y ambos flujos se expresan en L/min. Como ejemplo clásico, con un $V_T$ de 500 mL, un espacio muerto de 150 mL y 15 respiraciones/min, la ventilación minuto es de 7,5 L/min y la alveolar de 5,25 L/min (West & Luks, 2021).

La consecuencia práctica es que el espacio muerto "se cobra" en cada respiración. Si mantienes el volumen minuto pero repartes el gas en respiraciones más pequeñas y más frecuentes, una proporción mayor de cada una queda en el espacio muerto y la ventilación alveolar cae.

<!-- block: EQUATION | Ecuación de Bohr con la modificación de Enghoff -->
\frac{V_D}{V_T} = \frac{P_aCO_2 - P_{\bar{E}}CO_2}{P_aCO_2}

<!-- block: THEORY | Cómo se interpreta la fracción de espacio muerto -->
En la ecuación de Bohr original se usa la PCO₂ alveolar; Enghoff propuso sustituirla por la PaCO₂ arterial, más fácil de medir. $P_{\bar{E}}CO_2$ es la PCO₂ media del gas espirado (mmHg), que se obtiene recogiendo el gas espirado o con capnografía volumétrica. El valor de Enghoff es un índice global de ineficiencia del intercambio que aumenta con cualquier desajuste V/Q, incluido el shunt, y no solo con el espacio muerto "verdadero" (Tusman et al., 2012). En reposo, en personas sanas, la fracción $V_D/V_T$ suele situarse entre 0,2 y 0,35 (West & Luks, 2021). En el síndrome de dificultad respiratoria aguda (SDRA) temprano, Nuckton et al. (2002) midieron un valor medio de 0,58, y cada aumento de 0,05 se asoció con un 45 % más de probabilidad de muerte.

<!-- block: EQUATION | Ecuación de la PaCO₂ (ventilación alveolar) -->
P_aCO_2 = \frac{0{,}863 \cdot \dot{V}CO_2}{\dot{V}_A}

<!-- block: THEORY | Ejemplo resuelto -->
En la ecuación de la PaCO₂, $\dot{V}CO_2$ es la producción de CO₂ (mL/min, condiciones STPD), $\dot{V}_A$ la ventilación alveolar (L/min, condiciones BTPS) y 0,863 una constante que concilia esas unidades para obtener mmHg (West & Luks, 2021). La relación es una **hipérbola**: si la ventilación alveolar se reduce a la mitad, la PaCO₂ se duplica, con la producción de CO₂ constante.

**Datos.** Paciente adulto en modo controlado por volumen: $V_T = 450$ mL, $FR = 16$/min, espacio muerto fisiológico de 150 mL y producción de CO₂ de 200 mL/min.

1. Ventilación minuto: $450 \times 16 = 7200\,\text{mL/min} = 7{,}2\,\text{L/min}$.
2. Ventilación alveolar: $(450 - 150) \times 16 = 4800\,\text{mL/min} = 4{,}8\,\text{L/min}$.
3. PaCO₂ esperada: $0{,}863 \times 200 / 4{,}8 \approx 36\,\text{mmHg}$.
4. Fracción de espacio muerto: $150/450 \approx 0{,}33$. Si la PaCO₂ medida fuera 36 mmHg, la PCO₂ espirada media coherente sería $36 \times (1 - 0{,}33) \approx 24\,\text{mmHg}$.

**Variación.** Mantén la ventilación minuto en 7,2 L/min, pero con $V_T = 300$ mL y $FR = 24$/min. La ventilación alveolar es $(300 - 150) \times 24 = 3600\,\text{mL/min}$, y la PaCO₂ esperada sube a $0{,}863 \times 200 / 3{,}6 \approx 48\,\text{mmHg}$. Con el mismo volumen minuto, la PaCO₂ aumenta 12 mmHg solo por el espacio muerto.

![Gráfica de PaCO₂ frente a ventilación alveolar con producción de CO₂ constante: una hipérbola descendente. Se marcan dos puntos del ejemplo, 4,8 L/min con unos 36 mmHg y 3,6 L/min con unos 48 mmHg, y se indica que en la zona de baja ventilación pequeños descensos elevan mucho la PaCO₂.](/learning/diagrams/b1-volumenes-paco2-hiperbola.svg "Figura: relación hiperbólica entre ventilación alveolar y PaCO₂")

<!-- page: aplicacion-clinica-ventilacion-alveolar | CASE_STUDY | Aplicación clínica: hipercapnia con volumen minuto "alto" -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
**Paciente.** Mujer de 54 años, talla 160 cm, con SDRA por neumonía, en su segundo día de ventilación mecánica en modo controlado por volumen. Se aplica ventilación protectora con volumen corriente de 6 mL/kg de peso corporal predicho (ARDS Network, 2000), lo que en ella corresponde a unos 320 mL; frecuencia 26/min; PEEP 12 cmH₂O. Tiene un filtro intercambiador de calor y humedad y una extensión corrugada entre la pieza en Y y el tubo.

**Gasometría arterial.** pH 7,25; PaCO₂ 58 mmHg. La capnografía volumétrica estima una PCO₂ espirada media de 20 mmHg.

**Razonamiento paso a paso.**

1. **Volumen minuto:** $0{,}32 \times 26 = 8{,}3\,\text{L/min}$. Es un valor que, de forma aislada, no sugeriría hipoventilación.
2. **Fracción de espacio muerto (Bohr-Enghoff):** $(58 - 20)/58 \approx 0{,}66$. Dos tercios de cada respiración no participan en la eliminación de CO₂. Es un valor alto incluso para el SDRA, donde Nuckton et al. (2002) asociaron cifras elevadas con mayor mortalidad.
3. **Ventilación alveolar efectiva:** $8{,}3 \times (1 - 0{,}66) \approx 2{,}8\,\text{L/min}$. Esto explica la PaCO₂ elevada pese al volumen minuto aparentemente adecuado.
4. **¿De dónde viene el espacio muerto?** Hay un componente fisiológico propio del SDRA (desajuste V/Q, microtrombosis, posible sobredistensión de zonas sanas) y un componente instrumental. Con volúmenes corrientes pequeños, los mililitros fijos del filtro y de la extensión pesan proporcionalmente más.
5. **Opciones razonables para discutir con el equipo:** revisar y retirar el espacio muerto instrumental innecesario (extensiones, conectores) según el protocolo de la unidad; evaluar si un aumento de la frecuencia es posible sin generar atrapamiento de aire; y valorar si la PEEP está produciendo sobredistensión (más espacio muerto alveolar) o reclutamiento. Aumentar el volumen corriente a costa de la protección pulmonar no es la primera respuesta.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung) y:

1. En VCV, anota el volumen minuto, la PaCO₂ y el pH de partida.
2. Reduce el volumen corriente y aumenta la frecuencia de modo que el volumen minuto quede aproximadamente igual. Observa la tendencia de la PaCO₂ y del pH con el paso del tiempo.
3. Vuelve al ajuste inicial y, ahora, aumenta solo la frecuencia: la PaCO₂ debería tender a bajar. Fíjate también en la curva de flujo espiratorio para comprobar que vuelve a cero antes de la siguiente respiración.

<!-- block: EXERCISE | Comprueba lo aprendido -->
**1.** Un paciente tiene $V_T$ de 500 mL, $FR$ de 12/min y un espacio muerto de 200 mL. Calcula la ventilación minuto y la alveolar.

*Respuesta:* $\dot{V}_E = 500 \times 12 = 6{,}0$ L/min; $\dot{V}_A = (500 - 200) \times 12 = 3{,}6$ L/min.

**2.** Con una producción de CO₂ constante, la ventilación alveolar pasa de 5 a 2,5 L/min. ¿Qué ocurre con la PaCO₂?

*Respuesta:* se duplica, porque la PaCO₂ es inversamente proporcional a la ventilación alveolar.

**3.** PaCO₂ 45 mmHg y PCO₂ espirada media 27 mmHg. ¿Cuál es la fracción de espacio muerto?

*Respuesta:* $(45 - 27)/45 = 0{,}40$.

**4.** ¿Por qué añadir una extensión entre la pieza en Y y el tubo afecta más a un paciente con volumen corriente pequeño?

*Respuesta:* porque ese volumen es fijo y se resta de cada respiración; cuanto menor es el volumen corriente, mayor es la proporción que representa y menor la ventilación alveolar.

<!-- page: sintesis-ventilacion-alveolar | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- Los volúmenes pulmonares son compartimentos independientes; las capacidades son sumas de volúmenes. La CRF es el volumen de equilibrio y el reservorio de oxígeno del pulmón.
- La CRF cae con el decúbito supino, la obesidad, la anestesia y la parálisis; su pérdida favorece el cierre de vías aéreas pequeñas y las atelectasias.
- El espacio muerto fisiológico es la suma del anatómico (más el instrumental en el paciente intubado) y del alveolar.
- $\dot{V}_E = V_T \cdot FR$ y $\dot{V}_A = (V_T - V_D)\cdot FR$: con el mismo volumen minuto, respiraciones más pequeñas y rápidas dan menos ventilación alveolar.
- La PaCO₂ depende de la producción de CO₂ y, de forma inversa e hiperbólica, de la ventilación alveolar.
- La ecuación de Bohr-Enghoff estima la fracción de espacio muerto y es, en realidad, un índice global de ineficiencia del intercambio; en el SDRA temprano su elevación se asocia con mayor mortalidad.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Juzgar la ventilación solo por el volumen minuto.** Es engañoso porque no tiene en cuenta el espacio muerto. En su lugar, interpreta el volumen minuto junto con la PaCO₂ y, si está disponible, con la capnografía volumétrica.
- **Bajar el volumen corriente sin compensar la frecuencia.** Reduce la ventilación alveolar y eleva la PaCO₂. En su lugar, anticipa el cambio y ajusta la frecuencia vigilando el tiempo espiratorio.
- **Olvidar el espacio muerto instrumental.** Filtros, extensiones y conectores se suman a cada respiración y pesan más con volúmenes pequeños. En su lugar, revisa el circuito y retira lo que no aporte, según el protocolo de tu unidad.
- **Tomar la PCO₂ espirada final como sustituto fiable de la PaCO₂ en pacientes graves.** Cuando hay mucho espacio muerto, la diferencia entre ambas aumenta. En su lugar, confirma con gasometría arterial y usa la tendencia del capnograma como apoyo.
- **Pensar que el espacio muerto alto significa siempre "alvéolos sin sangre".** El mecanismo dominante suele ser la heterogeneidad V/Q. En su lugar, considera también la sobredistensión, el bajo gasto y el shunt.

<!-- block: REFERENCES | Referencias -->
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Hedenstierna, G., & Edmark, L. (2010). Mechanisms of atelectasis in the perioperative period. *Best Practice & Research Clinical Anaesthesiology, 24*(2), 157–169. [https://doi.org/10.1016/j.bpa.2009.12.002](https://doi.org/10.1016/j.bpa.2009.12.002)
- Nuckton, T. J., Alonso, J. A., Kallet, R. H., Daniel, B. M., Pittet, J.-F., Eisner, M. D., & Matthay, M. A. (2002). Pulmonary dead-space fraction as a risk factor for death in the acute respiratory distress syndrome. *New England Journal of Medicine, 346*(17), 1281–1286. [https://doi.org/10.1056/NEJMoa012835](https://doi.org/10.1056/NEJMoa012835)
- Robertson, H. T. (2015). Dead space: The physiology of wasted ventilation. *European Respiratory Journal, 45*(6), 1704–1716. [https://doi.org/10.1183/09031936.00137614](https://doi.org/10.1183/09031936.00137614)
- Tusman, G., Sipmann, F. S., & Bohm, S. H. (2012). Rationale of dead space measurement by volumetric capnography. *Anesthesia & Analgesia, 114*(4), 866–874. [https://doi.org/10.1213/ANE.0b013e318247f6cc](https://doi.org/10.1213/ANE.0b013e318247f6cc)
- Wanger, J., Clausen, J. L., Coates, A., Pedersen, O. F., Brusasco, V., Burgos, F., Casaburi, R., Crapo, R., Enright, P., van der Grinten, C. P. M., Gustafsson, P., Hankinson, J., Jensen, R., Johnson, D., MacIntyre, N., McKay, R., Miller, M. R., Navajas, D., Pellegrino, R., & Viegi, G. (2005). Standardisation of the measurement of lung volumes. *European Respiratory Journal, 26*(3), 511–522. [https://doi.org/10.1183/09031936.05.00035005](https://doi.org/10.1183/09031936.05.00035005)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.
