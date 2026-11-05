<!-- page: oxigenacion-fio2-peep | THEORY | Conceptos: FiO₂, PEEP y sensibilidad del disparo -->
<!-- block: INTRODUCTION | Por qué importa -->
Cuando conectas a un paciente al ventilador, la prioridad inmediata es que esté oxigenado. Para ello dispones de dos palancas principales: la **fracción inspirada de oxígeno** (FiO₂) y la **presión positiva al final de la espiración** (PEEP). Ambas mejoran la oxigenación, pero por mecanismos distintos y con riesgos distintos. Un tercer ajuste, la **sensibilidad del disparo** (trigger), no oxigena, pero decide si el ventilador "escucha" al paciente; si está mal ajustada, el paciente trabaja de más o recibe ciclos que no pidió.

En esta lección aprenderás a elegir los valores iniciales de FiO₂ y PEEP, a qué metas de saturación apuntar según el contexto, cómo ajustar el disparo y qué hacer durante los primeros 30 minutos hasta la gasometría de control.

<!-- block: THEORY | FiO₂: más oxígeno en el alvéolo, pero no gratis -->
Subir la FiO₂ aumenta la presión parcial de oxígeno en el gas alveolar y, con ella, el gradiente que impulsa la difusión hacia la sangre capilar. Es la herramienta más rápida: el efecto aparece en pocos minutos. Pero tiene un límite fisiológico: si la hipoxemia se debe a sangre que atraviesa alvéolos colapsados o llenos de líquido (cortocircuito o *shunt*), esa sangre nunca entra en contacto con el gas enriquecido, y subir la FiO₂ ayuda poco.

El oxígeno además tiene costo. La guía de práctica clínica del BMJ, basada en evidencia que asoció la oxigenoterapia liberal con mayor mortalidad en adultos con enfermedad aguda, recomienda de forma fuerte no mantener la saturación por encima del 96 % en pacientes médicos agudos (Siemieniuk et al., 2018). La idea práctica es: usa la FiO₂ necesaria para salir de la hipoxemia y, en cuanto el paciente esté estable, bájala hasta la mínima que mantenga la meta.

<!-- block: THEORY | PEEP: mantener abierto lo que se abrió -->
Al final de cada espiración, las unidades alveolares inestables (por edema, inflamación, compresión por el abdomen o por falta de surfactante) tienden a colapsarse. La PEEP mantiene una presión positiva en la vía aérea durante toda la espiración, de modo que esas unidades conservan volumen. El efecto es doble: aumenta el volumen pulmonar al final de la espiración y reduce el cortocircuito, porque más alvéolos siguen ventilados. Por eso la PEEP mejora la oxigenación reclutando alvéolos colapsados y disminuyendo el shunt intrapulmonar (Walter et al., 2018).

La PEEP también eleva la presión intratorácica media. Igual que la auto-PEEP, puede reducir el gradiente de retorno venoso y aumentar la poscarga del ventrículo derecho (Walter et al., 2018), sobre todo en pacientes hipovolémicos. Por eso, después de cada aumento de PEEP vigila la presión arterial y no solo la saturación.

#### Sensibilidad del disparo

El ventilador detecta el esfuerzo del paciente como una caída de presión en la vía aérea (disparo por presión) o como un flujo inspiratorio que entra al circuito (disparo por flujo); el umbral necesario para iniciar un ciclo es la **sensibilidad del disparo** (Walter et al., 2018). Un umbral más sensible responde más rápido, pero aumenta el riesgo de **autodisparo**: ciclos iniciados sin esfuerzo, por ejemplo por las oscilaciones cardiogénicas transmitidas a la vía aérea; un umbral menos sensible evita el autodisparo a costa de una respuesta más lenta (Plens et al., 2018). La regla práctica es buscar el ajuste más sensible que no produzca autodisparo, y revisar fugas y agua en el circuito antes de "endurecerlo". Los valores numéricos y la forma de programarlo dependen del fabricante, así que consulta el manual de tu equipo.

<!-- page: metas-y-valores-iniciales | THEORY | Metas de oxigenación, valores iniciales y cálculos -->
<!-- block: THEORY | Valores iniciales de FiO₂ y PEEP -->
No existe un único valor inicial válido para todos. Una revisión clínica propone, para adultos con ventilación minuto normal, una FiO₂ de 0,4 a 1,0 según el escenario y una PEEP de 5 cmH₂O; en el SDRA y en la enfermedad obstructiva grave sugiere empezar con FiO₂ de 1,0 y ajustarla después (Walter et al., 2018). En el SDRA, el protocolo de la red ARDS fija una PEEP mínima de 5 cmH₂O y propone tablas de combinaciones FiO₂/PEEP para alcanzar la meta de oxigenación (NHLBI ARDS Network, 2008).

En pacientes **sin SDRA**, un ensayo aleatorizado comparó la PEEP más baja posible entre 0 y 5 cmH₂O con una PEEP de 8 cmH₂O: la estrategia de PEEP baja no fue inferior en días libres de ventilador a los 28 días (Algera et al., 2020). Es decir, en el paciente sin lesión pulmonar no hay que subir la PEEP "por si acaso", aunque el grupo de PEEP baja necesitó estrategias de rescate de la hipoxemia con algo más de frecuencia (19,7 % frente a 14,6 %), una diferencia que no fue significativa tras el ajuste por comparaciones múltiples (Algera et al., 2020). La titulación de PEEP en el SDRA es controvertida y se aborda en el nivel avanzado.

#### Extracto de la tabla FiO₂/PEEP baja de ARDSNet

| FiO₂ | 0,3 | 0,4 | 0,4 | 0,5 | 0,5 | 0,6 | 0,7 |
|---|---|---|---|---|---|---|---|
| PEEP (cmH₂O) | 5 | 5 | 8 | 8 | 10 | 10 | 10 |

La tabla continúa hasta FiO₂ 1,0 con PEEP de 18 a 24 cmH₂O, y su uso es opcional según el propio protocolo (NHLBI ARDS Network, 2008).

<!-- block: THEORY | ¿A qué saturación apuntar? -->
Las metas no son iguales en todos los contextos, y las guías no coinciden exactamente; es un área donde la evidencia sigue evolucionando:

| Contexto | Meta | Fuente |
|---|---|---|
| SDRA en ventilación protectora | SpO₂ 88–95 % o PaO₂ 55–80 mmHg | NHLBI ARDS Network (2008) |
| Paciente agudo sin riesgo de hipercapnia | SpO₂ 94–98 % | O'Driscoll et al. (2017) |
| Riesgo de insuficiencia hipercápnica (p. ej., EPOC) | SpO₂ 88–92 % | O'Driscoll et al. (2017) |
| Paciente médico agudo, límite superior | No superar SpO₂ 96 % | Siemieniuk et al. (2018) |

![Rangos horizontales de SpO₂ objetivo: 88 a 95 % en SDRA según ARDSNet, 88 a 92 % con riesgo de hipercapnia y 94 a 98 % en el paciente agudo general según la BTS, con una línea en 96 % como límite superior recomendado](/learning/diagrams/b4-fio2-metas-spo2.svg "Figura: metas de SpO₂ según el contexto clínico")

#### La oximetría no es infalible

La SpO₂ estima la saturación arterial, pero puede sobrestimarla. En dos grandes cohortes, entre los pacientes con SpO₂ de 92 a 96 %, la hipoxemia oculta (saturación arterial menor de 88 %) fue casi tres veces más frecuente en pacientes negros que en pacientes blancos (Sjoding et al., 2020). Cuando la SpO₂ no concuerde con la clínica, o el paciente tenga mala perfusión periférica, confirma con una gasometría arterial.

<!-- block: THEORY | Índices sencillos de oxigenación -->
El índice más usado para relacionar la oxigenación con el oxígeno administrado es el cociente PaO₂/FiO₂:

$$
\frac{PaO_2}{FiO_2} = \frac{PaO_2\,(\text{mmHg})}{FiO_2\,(\text{fracción entre 0,21 y 1})}
$$

Expresa la FiO₂ como fracción, no como porcentaje: 60 % es 0,6. Un mismo valor de PaO₂ significa cosas muy distintas según la FiO₂: 80 mmHg con aire ambiente (FiO₂ 0,21) da un cociente de 381; con FiO₂ 0,8 da 100. El cociente depende también de la PEEP aplicada, por eso siempre se informa junto con ella. Sus umbrales diagnósticos para el SDRA se estudian en la lección correspondiente.

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente con neumonía, recién intubado, en VCV con FiO₂ 1,0 y PEEP 5 cmH₂O. La SpO₂ es 100 %. A los 15 minutos de la intubación, la gasometría muestra PaO₂ 260 mmHg.

1. Cociente PaO₂/FiO₂: $260/1{,}0 = 260$.
2. La SpO₂ de 100 % y la PaO₂ de 260 mmHg indican hiperoxia: hay margen para bajar la FiO₂.
3. Bajas la FiO₂ a 0,6 y luego a 0,5 vigilando la SpO₂. Con 0,5, la SpO₂ se estabiliza en 95 %.
4. En un estudio con pacientes estables sin EPOC, los autores concluyeron que, tras un cambio de FiO₂ de 0,2, bastan de 5 a 10 minutos para que la gasometría refleje la PaO₂ de equilibrio (Cakar et al., 2001); esperas al menos ese tiempo y extraes la gasometría de control: PaO₂ 82 mmHg con FiO₂ 0,5, cociente $82/0{,}5 = 164$.
5. Interpretación: con SpO₂ de 100 % la saturación no distingue entre una PaO₂ de 100 o de 300 mmHg, porque estás en la zona plana de la curva de disociación; solo la gasometría lo aclara. Observa además que el cociente cambió de 260 a 164 al bajar la FiO₂: no es una constante del paciente, así que regístralo siempre junto con la FiO₂ y la PEEP con que se obtuvo.

<!-- page: aplicacion-clinica-oxigenacion | CASE_STUDY | Aplicación clínica: los primeros 30 minutos -->
<!-- block: THEORY | Una secuencia ordenada -->
Los primeros minutos tras conectar a un paciente concentran muchos riesgos: tubo mal colocado, desconexiones, hipotensión tras la inducción y ajustes copiados de otro paciente. Seguir una secuencia fija ayuda a no olvidar nada. La siguiente figura propone un orden de trabajo; no sustituye a los protocolos de tu unidad.

![Diagrama de flujo con seis pasos: conectar y comprobar, oxigenar primero, bajar la FiO₂ hacia la meta, medir la mecánica, vigilar al paciente y extraer la gasometría de control tras estabilizar](/learning/diagrams/b4-fio2-primeros-30-min.svg "Figura: secuencia sugerida para los primeros 30 minutos")

Dos detalles merecen explicación. Primero, la presión meseta se mide con una pausa inspiratoria de 0,5 s y, en el SDRA, el protocolo indica revisarla al menos cada 4 horas y después de cada cambio de PEEP o Vt (NHLBI ARDS Network, 2008). Segundo, haz **un cambio cada vez**: si modificas a la vez FiO₂, PEEP y FR, no sabrás cuál produjo el efecto.

<!-- block: CASE_STUDY | Ejemplo clínico -->
**Situación.** Hombre de 62 años, talla 178 cm (PBW 73,3 kg), con neumonía extensa del lóbulo inferior derecho. Se intuba por hipoxemia refractaria a la cánula de alto flujo. Tras la intubación: VCV, Vt 440 mL (6 mL/kg de PBW), FR 20, PEEP 5 cmH₂O, FiO₂ 1,0. SpO₂ 89 %, presión arterial 98/60 mmHg.

**Paso 1: comprueba antes de ajustar.** La curva de capnografía muestra una onda regular, el tórax se expande de forma simétrica y el Vt espirado coincide con el programado. No hay fugas. La hipoxemia no se debe a un problema del equipo.

**Paso 2: elige la palanca.** Con FiO₂ 1,0 ya no puedes subir más el oxígeno, y una SpO₂ de 89 % con esa FiO₂ sugiere un cortocircuito importante. La PEEP es la herramienta adecuada. Subes la PEEP a 8 cmH₂O, luego a 10, observando la presión arterial tras cada paso porque el paciente acaba de recibir sedación.

**Paso 3: titula la FiO₂ hacia abajo.** Con PEEP 10, la SpO₂ sube a 96 %. Bajas la FiO₂ a 0,7 y después a 0,6, manteniendo la SpO₂ alrededor de 92-94 %. Si se confirmara un SDRA, la meta pasaría a ser 88-95 % (NHLBI ARDS Network, 2008), y la combinación FiO₂ 0,6 con PEEP 10 coincide con un escalón de la tabla de PEEP baja.

**Paso 4: verifica la mecánica y la hemodinamia.** La presión meseta con pausa de 0,5 s es 24 cmH₂O. La presión arterial se mantiene en 100/62 mmHg.

**Paso 5: gasometría de control.** Esperas al menos 10 minutos tras el último cambio de FiO₂ (Cakar et al., 2001): pH 7,33, PaCO₂ 48 mmHg, PaO₂ 72 mmHg con FiO₂ 0,6. Cociente PaO₂/FiO₂ $= 72/0{,}6 = 120$. La ventilación es aceptable y la oxigenación está dentro de la meta; la gravedad del cociente obliga a vigilar de cerca y a reevaluar en el contexto de un posible SDRA.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Neumonía grave con hipoxemia»](/simulador?tab=simular&case=july-neumonia-grave) y prueba lo siguiente:

- Con la PEEP fija, sube y baja la FiO₂: la SpO₂ responde, pero cada vez menos a medida que te acercas a FiO₂ altas.
- Aumenta la PEEP de forma escalonada y observa cómo mejora la SpO₂ y qué ocurre con la presión arterial media y con la presión meseta.
- Una vez que la saturación esté en meta, reduce la FiO₂ paso a paso hasta la mínima que la mantenga.
- Si no corriges la hipoxemia, observa cómo empeora el estado del paciente con el tiempo.

<!-- block: EXERCISE | Preguntas de práctica -->
**1.** Paciente con EPOC, intubado, SpO₂ 99 % con FiO₂ 0,5. ¿Qué haces?

*Respuesta:* bajas la FiO₂. En pacientes con riesgo de insuficiencia hipercápnica la meta es 88-92 % (O'Driscoll et al., 2017), y en general conviene no superar el 96 % (Siemieniuk et al., 2018).

**2.** PaO₂ 90 mmHg con FiO₂ 0,45. ¿Cuál es el cociente PaO₂/FiO₂?

*Respuesta:* $90/0{,}45 = 200$.

**3.** Un paciente sin esfuerzo inspiratorio recibe más ciclos de los programados y cada ciclo extra coincide con un latido. ¿Qué sospechas y qué haces?

*Respuesta:* autodisparo por oscilaciones cardiogénicas. Revisa fugas y agua en el circuito y reduce la sensibilidad del disparo lo justo para eliminarlo (Plens et al., 2018).

**4.** En un paciente postoperatorio sin lesión pulmonar, ¿es necesaria una PEEP de 8 cmH₂O de entrada?

*Respuesta:* no necesariamente. En pacientes sin SDRA, una estrategia de PEEP de 0 a 5 cmH₂O no fue inferior a 8 cmH₂O en días libres de ventilador (Algera et al., 2020); ajusta según la oxigenación.

<!-- page: sintesis-oxigenacion | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La FiO₂ actúa rápido, pero ayuda poco cuando la hipoxemia se debe a cortocircuito; la PEEP mejora la oxigenación reclutando alvéolos y reduciendo el shunt (Walter et al., 2018).
- Empieza con una FiO₂ suficiente para corregir la hipoxemia y bájala cuanto antes hasta la mínima que mantenga la meta (Siemieniuk et al., 2018).
- Las metas de SpO₂ dependen del contexto: 88-95 % en SDRA, 88-92 % con riesgo de hipercapnia, 94-98 % en el paciente agudo general, sin superar 96 % (NHLBI ARDS Network, 2008; O'Driscoll et al., 2017; Siemieniuk et al., 2018).
- Una PEEP inicial de 5 cmH₂O es un punto de partida habitual; sin SDRA, una PEEP baja no fue inferior a 8 cmH₂O (Walter et al., 2018; Algera et al., 2020).
- Ajusta el disparo al valor más sensible que no produzca autodisparo (Plens et al., 2018).
- Tras cambiar la FiO₂, espera unos 10 minutos antes de la gasometría de control (Cakar et al., 2001).
- Cada aumento de PEEP exige vigilar la presión arterial, y la SpO₂ puede sobrestimar la saturación real (Sjoding et al., 2020).

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Dejar la FiO₂ en 1,0 "porque el paciente está bien"** → la hiperoxia mantenida no aporta beneficio y se asocia a daño → titula hasta la meta y no superes el 96 % de SpO₂ (Siemieniuk et al., 2018).
- **Usar la misma meta de SpO₂ en todos** → en el paciente con EPOC una saturación alta puede empeorar la hipercapnia → aplica la meta de 88-92 % cuando hay riesgo hipercápnico (O'Driscoll et al., 2017).
- **Subir solo la FiO₂ en una hipoxemia por shunt** → la respuesta es mínima y se retrasa el tratamiento eficaz → valora la PEEP y la causa.
- **Extraer la gasometría justo después del cambio** → la PaO₂ todavía no refleja el nuevo equilibrio → espera unos 10 minutos (Cakar et al., 2001).
- **Hacer el disparo muy insensible para "evitar alarmas"** → el paciente tiene que esforzarse más y la respuesta es más lenta (Plens et al., 2018) → corrige la causa del autodisparo y usa el ajuste más sensible que lo evite.
- **Cambiar varios parámetros a la vez** → no puedes atribuir el efecto → haz un cambio cada vez y evalúa.

<!-- block: REFERENCES | Referencias -->
- Walter, J. M., Corbridge, T. C., & Singer, B. D. (2018). Invasive mechanical ventilation. *Southern Medical Journal, 111*(12), 746–753. [https://doi.org/10.14423/SMJ.0000000000000905](https://doi.org/10.14423/SMJ.0000000000000905)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary* [Protocolo]. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- O'Driscoll, B. R., Howard, L., Earis, J., & Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl 1), ii1–ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Siemieniuk, R. A. C., Chu, D. K., Kim, L. H., Güell-Rous, M. R., Alhazzani, W., Soccal, P. M., et al. (2018). Oxygen therapy for acutely ill medical patients: A clinical practice guideline. *BMJ, 363*, k4169. [https://doi.org/10.1136/bmj.k4169](https://doi.org/10.1136/bmj.k4169)
- Cakar, N., Tuğrul, M., Demirarslan, A., Nahum, A., Adams, A., Akýncý, O., Esen, F., & Telci, L. (2001). Time required for partial pressure of arterial oxygen equilibration during mechanical ventilation after a step change in fractional inspired oxygen concentration. *Intensive Care Medicine, 27*(4), 655–659. [https://doi.org/10.1007/s001340100900](https://doi.org/10.1007/s001340100900)
- Writing Committee and Steering Committee for the RELAx Collaborative Group, Algera, A. G., Pisani, L., Serpa Neto, A., et al. (2020). Effect of a lower vs higher positive end-expiratory pressure strategy on ventilator-free days in ICU patients without ARDS: A randomized clinical trial. *JAMA, 324*(24), 2509–2520. [https://doi.org/10.1001/jama.2020.23517](https://doi.org/10.1001/jama.2020.23517)
- Plens, G., Morais, C., Nakamura, M., Souza, P., et al. (2018). Effect of cardiogenic oscillations on trigger delay during pressure support ventilation. *Respiratory Care, 63*(7), 865–872. [https://doi.org/10.4187/respcare.05995](https://doi.org/10.4187/respcare.05995)
- Sjoding, M. W., Dickson, R. P., Iwashyna, T. J., Gay, S. E., & Valley, T. S. (2020). Racial bias in pulse oximetry measurement. *New England Journal of Medicine, 383*(25), 2477–2478. [https://doi.org/10.1056/NEJMc2029240](https://doi.org/10.1056/NEJMc2029240)
