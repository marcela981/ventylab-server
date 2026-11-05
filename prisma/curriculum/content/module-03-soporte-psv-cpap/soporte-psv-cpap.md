<!-- page: como-funciona-psv | THEORY | Cómo funciona la presión de soporte -->
<!-- block: INTRODUCTION | Por qué importa la PSV -->
La ventilación con presión de soporte (PSV) es uno de los modos más usados cuando el paciente recupera el impulso respiratorio: durante el destete, tras retirar la sedación profunda y como modo de ventilación no invasiva. Parece un modo sencillo porque tiene pocos parámetros, pero cada respiración es el resultado de una negociación entre el ventilador y los músculos del paciente. Si la negociación sale mal, el paciente puede quedar **sobreasistido** (músculos que se atrofian, esfuerzos que no disparan, alcalosis, apneas) o **infraasistido** (fatiga, taquipnea, esfuerzos excesivos que lesionan el pulmón y el diafragma).

En esta lección aprenderás a describir la PSV con las variables de fase (disparo, límite y ciclado), a reconocer en las curvas un ajuste adecuado y a corregir los desajustes más frecuentes.

<!-- block: THEORY | Las tres fases de una respiración en PSV -->
Según la clasificación de las variables de fase que viste en "Variables de fase: disparo, límite y ciclado", la PSV es un modo **disparado por el paciente, limitado por presión y ciclado por flujo** (Hess, 2005).

### Disparo: lo inicia siempre el paciente

No hay frecuencia mandatoria. El ventilador espera a detectar un esfuerzo, ya sea por una caída de presión por debajo de la PEEP (disparo por presión) o por una desviación del flujo de base (disparo por flujo). Si el paciente deja de respirar, la PSV no garantiza ventilación: los ventiladores modernos detectan la apnea, activan una ventilación de respaldo y alarman, por lo que la alarma de apnea y su respaldo deben estar siempre configurados (Hess, 2005).

La causa más frecuente de dificultad para disparar en PSV es la **auto-PEEP**: el paciente debe primero vencer la presión alveolar positiva que queda al final de la espiración antes de que su esfuerzo llegue al sensor (Hess, 2005).

### Límite: una presión fija por encima de la PEEP

Una vez disparado, el ventilador eleva la presión en la vía aérea hasta la PEEP más el nivel de soporte programado y la mantiene. La velocidad con que alcanza esa presión es el **rise time** (o tiempo de presurización). Un rise time rápido entrega mucho flujo al inicio, útil en pacientes con alta demanda; uno lento puede dejar al paciente con hambre de flujo, y uno demasiado rápido puede producir un pico de presión incómodo al inicio. Debe ajustarse a la comodidad del paciente y a la forma de las curvas (Hess, 2005).

### Ciclado: termina cuando el flujo cae

Con la presión fija, el flujo inspiratorio es máximo al principio y luego cae a medida que el pulmón se llena y el esfuerzo del paciente disminuye. El ventilador pasa a espiración cuando el flujo cae a un porcentaje del flujo pico, el **criterio de ciclado** o trigger espiratorio. En muchos ventiladores el valor de fábrica es el 25 % del flujo pico, y algunos equipos permiten ajustarlo en un rango muy amplio (Hess, 2005). Como respaldo, la mayoría tiene un ciclado secundario por tiempo o por presión.

![Dos gráficos apilados de dos respiraciones en PSV: en la presión se ve una pequeña caída bajo la PEEP que marca el esfuerzo, la subida según el rise time hasta PEEP más soporte (17 cmH₂O) y la meseta hasta el ciclado; en el flujo se ve el pico precoz, la caída progresiva y el ciclado cuando el flujo llega al 25 % del pico, seguido de la espiración pasiva](/learning/diagrams/i2-psv-curvas.svg "Figura: disparo, presurización y ciclado por flujo en PSV")

<!-- block: THEORY | Lo que el paciente decide -->
En PSV el paciente controla la frecuencia, el tiempo inspiratorio (dentro de lo que permite el criterio de ciclado) y, junto con el soporte, el volumen corriente. Por eso, el Vt y la FR que ves en pantalla son **resultados**, no ajustes. Un Vt alto puede deberse a un soporte excesivo o a un esfuerzo intenso; una FR alta puede deberse a infraasistencia o a ansiedad, dolor o fiebre. La lectura de la PSV siempre exige mirar al paciente: uso de músculos accesorios, sudoración, movimiento abdominal y sincronía entre sus esfuerzos y los ciclos del ventilador.

La PSV con un nivel de soporte de cero equivale a respirar con CPAP a través del circuito, que verás en la lección "CPAP y presión positiva continua".

<!-- page: ecuacion-y-ajustes | THEORY | Fórmulas y ajuste de parámetros -->
<!-- block: THEORY | La ecuación del movimiento con esfuerzo del paciente -->
Cuando el paciente participa, la presión que mueve el gas es la suma de la presión del ventilador y la presión generada por los músculos inspiratorios ($P_{mus}$):

$$
P_{aw}(t) + P_{mus}(t) = \frac{V(t)}{C_{rs}} + R_{aw}\cdot\dot{V}(t) + PEEP_{total}
$$

| Símbolo | Significado | Unidad |
|---|---|---|
| $P_{aw}$ | Presión en la vía aérea (PEEP + soporte durante la inspiración) | cmH₂O |
| $P_{mus}$ | Presión generada por los músculos respiratorios | cmH₂O |
| $V$ | Volumen insuflado | L |
| $C_{rs}$ | Compliance del sistema respiratorio | L/cmH₂O |
| $R_{aw}$ | Resistencia | cmH₂O/L/s |
| $\dot{V}$ | Flujo | L/s |

La consecuencia práctica es que el Vt en PSV depende de tres cosas: el nivel de soporte, la mecánica del paciente y su esfuerzo (Hess, 2005). Con el mismo soporte, un paciente con más esfuerzo recibe más volumen.

El final de la inspiración se calcula con el criterio de ciclado: el flujo de ciclado ($\dot{V}_{ciclado}$, en L/min) es una fracción $k$ (sin unidades, por ejemplo 0,25 para el 25 %) del flujo pico inspiratorio ($\dot{V}_{pico}$, en L/min) de esa misma respiración.

<!-- block: EQUATION | Criterio de ciclado por flujo -->
\dot{V}_{ciclado} = k\cdot\dot{V}_{pico}

<!-- block: THEORY | Estimar el esfuerzo sin catéter esofágico -->
Medir $P_{mus}$ requiere presión esofágica, pero dos maniobras con oclusión, disponibles en muchos ventiladores, permiten estimar el esfuerzo en la cabecera:

- **P0.1**: la caída de presión en la vía aérea en los primeros 100 ms de un esfuerzo contra la vía ocluida. Refleja el impulso respiratorio. Una P0.1 de referencia mayor de 3,5 cmH₂O detectó esfuerzos potencialmente excesivos con una sensibilidad del 80 % y una especificidad del 77 %, y una P0.1 de 1,0 cmH₂O o menos detectó esfuerzos bajos con alta sensibilidad (Telias et al., 2020). Los valores que muestra cada ventilador pueden diferir de la medición de referencia.
- **Presión de oclusión espiratoria ($\Delta P_{occ}$)**: la caída máxima de presión en la vía aérea durante un esfuerzo contra una oclusión al final de la espiración. Bertoni et al. (2019) derivaron dos estimaciones:

$$
P_{mus} \approx -\tfrac{3}{4}\cdot\Delta P_{occ} \qquad \Delta P_{L,dyn} \approx (P_{pico} - PEEP) - \tfrac{2}{3}\cdot\Delta P_{occ}
$$

donde $\Delta P_{L,dyn}$ es la driving pressure transpulmonar dinámica. En ese estudio se consideraron excesivos una $P_{mus}$ mayor de 10 cmH₂O y una $\Delta P_{L,dyn}$ mayor de 15 cmH₂O, y ambos ocurrieron con frecuencia en pacientes en ventilación asistida (Bertoni et al., 2019).

<!-- block: EXERCISE | Ejemplo resuelto -->
Paciente en PSV de 10 cmH₂O con PEEP de 6 cmH₂O, criterio de ciclado del 25 %. El monitor muestra un flujo pico de 60 L/min. Una maniobra de oclusión espiratoria muestra $\Delta P_{occ} = -12\,\text{cmH}_2\text{O}$.

1. **Flujo de ciclado**: $\dot{V}_{ciclado} = 0{,}25 \times 60 = 15\,\text{L/min}$. La inspiración terminará cuando el flujo baje a 15 L/min.
2. **Esfuerzo estimado**: $P_{mus} \approx -0{,}75 \times (-12) = 9\,\text{cmH}_2\text{O}$.
3. **Driving pressure transpulmonar dinámica**: $\Delta P_{L,dyn} \approx (16 - 6) - 0{,}67 \times (-12) = 10 + 8 = 18\,\text{cmH}_2\text{O}$.
4. **Interpretación**: el esfuerzo aislado está cerca del límite usado en el estudio, pero la suma de soporte y esfuerzo produce una distensión pulmonar estimada por encima de 15 cmH₂O. El pulmón recibe más estiramiento del que sugiere el nivel de soporte de 10 cmH₂O.
5. **Decisión**: antes de bajar el soporte (lo que aumentaría el trabajo del paciente) busca la causa del impulso alto: dolor, fiebre, acidosis, hipoxemia, ansiedad o sedación insuficiente. Repite la medición tras tratarla.

<!-- block: THEORY | Cómo ajustar cada parámetro -->
| Parámetro | Qué controla | Señal de ajuste inadecuado |
|---|---|---|
| Nivel de soporte | Parte de la carga que asume el ventilador | Vt alto, FR baja, esfuerzos ineficaces (exceso); taquipnea, músculos accesorios (defecto) |
| Sensibilidad del disparo | Esfuerzo necesario para iniciar el ciclo | Autodisparo (demasiado sensible); esfuerzos sin respuesta o retraso (poco sensible) |
| Rise time | Velocidad de presurización | Curva de presión cóncava al inicio (lento); pico inicial y molestia (rápido) |
| Criterio de ciclado | Final de la inspiración | Doble disparo (ciclado prematuro); pico de presión al final por espiración activa (ciclado tardío) |
| PEEP | Presión de base y compensación de auto-PEEP | Esfuerzos ineficaces por auto-PEEP no contrarrestada |

<!-- page: sobre-infraasistencia | THEORY | Sobreasistencia, infraasistencia y ciclado -->
<!-- block: THEORY | Buscar el nivel de soporte adecuado -->
El trabajo clásico de Brochard et al. (1989) mostró en pacientes con dificultad para el destete que, al aumentar el soporte, disminuían el trabajo respiratorio y el consumo de oxígeno de los músculos respiratorios y desaparecían los signos electromiográficos de fatiga diafragmática. Para cada paciente existía un nivel óptimo (de hasta 20 cmH₂O en esa serie), definido como el más bajo que mantenía actividad diafragmática sin fatiga. Por encima de ese nivel aparecían hiperinsuflación y apneas. La actividad del esternocleidomastoideo, fácil de observar, aumentaba cuando el soporte era insuficiente.

Hoy sabemos que el problema no es solo la fatiga. En un estudio ecográfico, el grosor del diafragma disminuyó más de un 10 % durante la primera semana de ventilación en el 44 % de los pacientes; la baja actividad contráctil se asoció a la pérdida de grosor y la actividad alta al aumento, y ambos cambios se asociaron a peor función diafragmática (Goligher et al., 2015). La meta, por tanto, es un esfuerzo **ni demasiado bajo ni demasiado alto**.

### Sobreasistencia

Un soporte excesivo produce Vt grandes con poco esfuerzo, baja la PaCO₂ y el impulso, alarga el tiempo inspiratorio y deja menos tiempo para espirar. El resultado típico son los **esfuerzos ineficaces**: el paciente intenta inspirar durante la espiración, pero no consigue disparar porque el pulmón aún no se ha vaciado y la auto-PEEP es alta. En pacientes con más del 10 % de esfuerzos ineficaces, reducir el soporte de 20 a 13 cmH₂O (mediana) bajó el Vt de 10,2 a 5,9 mL/kg de peso predicho y redujo los esfuerzos ineficaces del 45 % a prácticamente cero, sin aumentar la frecuencia real del paciente ni su esfuerzo (Thille et al., 2008).

Una pista clave: con esfuerzos ineficaces la frecuencia que muestra el ventilador es **menor** que la frecuencia real del paciente. Cuenta los esfuerzos mirando el tórax y el abdomen, o las muescas en la curva de flujo espiratorio.

### Infraasistencia

Un soporte insuficiente se manifiesta con taquipnea, Vt bajos, uso de músculos accesorios, respiración paradójica, diaforesis y P0.1 alta. Prolongarla puede llevar a fatiga, a esfuerzos lesivos para el pulmón y a fracaso del destete.

<!-- block: THEORY | Ajustar el ciclado -->
El ventilador debería ciclar cuando termina la inspiración neural del paciente. Si cicla antes, el paciente sigue inspirando y puede disparar una segunda respiración (doble disparo). Si cicla después, el paciente empieza a espirar contra el ventilador y la presión sube por encima del nivel programado al final de la inspiración (Hess, 2005).

![Tres columnas con presión y flujo: ciclado adecuado con espiración pasiva; ciclado prematuro con umbral alto, en el que el esfuerzo residual deforma el flujo espiratorio; ciclado tardío con umbral bajo en obstrucción, con flujo que cae lentamente, inspiración prolongada y pico de presión al final](/learning/diagrams/i2-psv-ciclado.svg "Figura: efecto del criterio de ciclado en las curvas")

En la **obstrucción al flujo aéreo** (EPOC), el flujo inspiratorio cae lentamente porque la constante de tiempo es larga, de modo que tarda en llegar al 25 % del pico: la inspiración se prolonga, se acorta la espiración y aumenta la auto-PEEP. En pacientes con enfermedad obstructiva, subir el criterio de ciclado del 10 % al 70 % del flujo pico redujo el retraso del ciclado (de 1,26 a 0,25 s), la auto-PEEP (de 6,5 a 4,8 cmH₂O) y los esfuerzos que no disparaban (de 9 a 2 por minuto) (Tassaux et al., 2005). En el pulmón restrictivo ocurre lo contrario: el flujo cae deprisa y un criterio alto puede cortar la inspiración demasiado pronto.

Las **fugas** (ventilación no invasiva, fístula broncopleural, tubo sin balón) también alteran el ciclado: si el flujo de fuga es mayor que el flujo de ciclado, la inspiración no termina por flujo y se prolonga hasta el ciclado secundario o hasta que el paciente espira con fuerza. En esa situación conviene un ventilador con ciclado ajustable o un modo ciclado por tiempo (Hess, 2005).

<!-- block: CALLOUT:info | PSV durante la prueba de ventilación espontánea -->
La PSV también se usa como prueba de ventilación espontánea. En un ensayo con 1153 pacientes, una prueba de 30 minutos con 8 cmH₂O de soporte logró más extubaciones exitosas que una prueba de 2 horas con tubo en T (82,3 % frente a 74,0 %), sin diferencias en la reintubación (Subirà et al., 2019). Este tema se desarrolla en "Prueba de ventilación espontánea y extubación".

<!-- page: caso-psv-epoc | CASE_STUDY | Aplicación clínica: esfuerzos ineficaces en un paciente con EPOC -->
<!-- block: CASE_STUDY | Ejemplo clínico -->
#### Presentación

Hombre de 68 años con EPOC grave, cuarto día de ventilación invasiva por exacerbación con neumonía. Talla 172 cm; peso predicho $50 + 0{,}91 \times (172 - 152{,}4) \approx 67{,}8\,\text{kg}$. Se retiró la sedación profunda y está en PSV: soporte 18 cmH₂O, PEEP 5 cmH₂O, criterio de ciclado 25 %, FiO₂ 0,35.

Monitor: Vt 650 mL, FR mostrada 14/min, Ppico 23 cmH₂O. Gasometría: pH 7,46, PaCO₂ 41 mmHg (su PaCO₂ habitual en fase estable es de 52 mmHg), PaO₂ 72 mmHg. Al observarlo cuentas 24 movimientos inspiratorios por minuto en el abdomen.

#### Paso 1: interpreta la discrepancia de frecuencias

El ventilador cuenta 14 ciclos, pero el paciente hace 24 esfuerzos: unos 10 por minuto no disparan. En la curva de flujo espiratorio verás pequeñas muescas hacia la línea de cero que coinciden con los movimientos abdominales. Son **esfuerzos ineficaces**.

#### Paso 2: busca el mecanismo

- Vt de $650 / 67{,}8 \approx 9{,}6\,\text{mL/kg}$ de peso predicho: el soporte es alto.
- Un Vt grande en un pulmón con constante de tiempo larga necesita mucho tiempo para salir; el siguiente esfuerzo llega antes de que el pulmón se vacíe y debe vencer una auto-PEEP elevada.
- El flujo inspiratorio cae lentamente: con ciclado al 25 % la inspiración se prolonga y la espiración se acorta todavía más.
- La PaCO₂ por debajo de la habitual del paciente y el pH alcalótico confirman la sobreasistencia.

#### Paso 3: corrige

1. **Reduce el soporte** de forma escalonada, por ejemplo a 12 cmH₂O, vigilando el Vt, la FR real y los signos de esfuerzo. Este es el ajuste que más reduce los esfuerzos ineficaces (Thille et al., 2008).
2. **Sube el criterio de ciclado**, por ejemplo al 40-50 %, para acortar la inspiración y alargar la espiración (Tassaux et al., 2005).
3. **Valora la PEEP externa**: en la limitación al flujo espiratorio, una PEEP externa por debajo de la auto-PEEP puede reducir el esfuerzo necesario para disparar. Este punto se trata en "Auto-PEEP e hiperinflación dinámica".
4. **Trata la obstrucción**: broncodilatadores y aspiración de secreciones reducen la constante de tiempo.

#### Paso 4: reevalúa

Tras los cambios: Vt 430 mL (6,3 mL/kg), FR del ventilador 23/min coincidente con la del paciente, sin muescas en el flujo espiratorio. La FR "subió" en pantalla, pero no porque el paciente respire más deprisa: ahora el ventilador detecta todos sus esfuerzos. Sin músculos accesorios ni diaforesis.

<!-- block: CALLOUT:tip | Practícalo en el simulador -->
Abre el caso [«Exacerbación de EPOC con hiperinflación dinámica»](/simulador?tab=simular&case=engine-copd-exacerbation) y selecciona el modo PSV:

1. Programa un soporte alto y observa el Vt y la curva de flujo espiratorio: verás que el flujo no llega a cero antes del siguiente ciclo, signo de auto-PEEP.
2. Baja el soporte de forma escalonada y observa cómo se acorta la inspiración y mejora el vaciado espiratorio.
3. Compara las curvas de flujo con el pulmón obstructivo y con el caso [«Pulmón normal: postoperatorio inmediato»](/simulador?tab=simular&case=engine-normal-lung): en el obstructivo el flujo inspiratorio cae más despacio y el ciclado llega más tarde.

<!-- block: EXERCISE | Preguntas -->
1. **Un paciente en PSV de 8 cmH₂O tiene FR 36/min, Vt 280 mL (peso predicho 70 kg), tiraje y P0.1 de 5 cmH₂O. ¿Qué indican estos datos?**
   Respuesta: infraasistencia o una carga excesiva. El Vt es de 4 mL/kg, la FR es alta y la P0.1 sugiere un impulso elevado (Telias et al., 2020). Aumenta el soporte mientras buscas la causa (secreciones, broncoespasmo, fiebre, dolor, insuficiencia cardíaca) y considera si el paciente realmente está listo para el destete.
2. **Al final de cada inspiración en PSV ves un pico de presión por encima del nivel programado. ¿Qué ocurre?**
   Respuesta: ciclado tardío. El paciente termina su inspiración neural y empieza a espirar activamente mientras el ventilador sigue insuflando. Sube el criterio de ciclado o reduce el soporte (Hess, 2005).
3. **¿Por qué aparece doble disparo en un paciente con SDRA leve en PSV con ciclado al 60 %?**
   Respuesta: en un pulmón poco distensible el flujo cae deprisa y, con un umbral alto, la inspiración termina mientras el paciente sigue inspirando. Su esfuerzo residual dispara un segundo ciclo y suma dos volúmenes. Baja el criterio de ciclado y valora el nivel de soporte y el impulso.

<!-- page: sintesis | THEORY | Síntesis -->
<!-- block: SUMMARY | Puntos clave -->
- La PSV es disparada por el paciente, limitada por presión y ciclada por flujo (Hess, 2005). No garantiza ventilación si el paciente deja de respirar: configura la apnea y el respaldo.
- El Vt depende del soporte, de la mecánica y del esfuerzo del paciente: $P_{aw} + P_{mus} = V/C_{rs} + R_{aw}\cdot\dot{V} + PEEP_{total}$.
- La meta es un esfuerzo moderado: tanto el esfuerzo bajo como el alto se asocian a cambios del grosor y de la función del diafragma (Goligher et al., 2015).
- La sobreasistencia produce Vt grandes, alcalosis y esfuerzos ineficaces; reducir el soporte hacia unos 6 mL/kg de peso predicho los eliminó en dos tercios de los pacientes estudiados (Thille et al., 2008).
- En la EPOC el ciclado tiende a ser tardío; subir el criterio de ciclado reduce la auto-PEEP y los esfuerzos que no disparan (Tassaux et al., 2005).
- P0.1 y la presión de oclusión espiratoria permiten estimar el impulso y el esfuerzo sin catéter esofágico (Telias et al., 2020; Bertoni et al., 2019).
- La FR que muestra el ventilador en PSV puede no ser la del paciente: cuenta los esfuerzos mirando al paciente y las curvas.

<!-- block: CALLOUT:warning | Errores frecuentes -->
- **Interpretar una FR baja en pantalla como un paciente cómodo** → puede haber esfuerzos ineficaces que el ventilador no cuenta → compara la FR del monitor con los movimientos del paciente y busca muescas en el flujo espiratorio.
- **Subir el soporte cuando hay esfuerzos ineficaces** → aumenta el Vt, la hiperinsuflación y la auto-PEEP, y empeora el problema → reduce el soporte o acorta la inspiración con el criterio de ciclado.
- **Usar el mismo criterio de ciclado para todos** → en la EPOC el ciclado es tardío y en el pulmón rígido puede ser prematuro → ajústalo mirando las curvas de presión y flujo al final de la inspiración.
- **Considerar que un soporte bajo protege siempre el pulmón** → con impulso alto el esfuerzo del paciente puede generar una distensión pulmonar elevada → estima el esfuerzo (P0.1, presión de oclusión) y trata la causa del impulso.
- **Olvidar la alarma de apnea y la ventilación de respaldo** → si el impulso desaparece (sedación, opioides, alcalosis) no hay ventilación garantizada → verifica su configuración al pasar a PSV.
- **Ignorar las fugas en ventilación no invasiva** → impiden el ciclado por flujo y prolongan la inspiración → reduce la fuga o usa ciclado ajustable o por tiempo.

<!-- block: REFERENCES | Referencias -->
- Bertoni, M., Telias, I., Urner, M., Long, M., Del Sorbo, L., Fan, E., Sinderby, C., Beck, J., Liu, L., Qiu, H., Wong, J., Slutsky, A. S., Ferguson, N. D., Brochard, L. J., & Goligher, E. C. (2019). A novel non-invasive method to detect excessively high respiratory effort and dynamic transpulmonary driving pressure during mechanical ventilation. *Critical Care, 23*(1), 346. [https://doi.org/10.1186/s13054-019-2617-0](https://doi.org/10.1186/s13054-019-2617-0)
- Brochard, L., Harf, A., Lorino, H., & Lemaire, F. (1989). Inspiratory pressure support prevents diaphragmatic fatigue during weaning from mechanical ventilation. *American Review of Respiratory Disease, 139*(2), 513-521. [https://doi.org/10.1164/ajrccm/139.2.513](https://doi.org/10.1164/ajrccm/139.2.513)
- Goligher, E. C., Fan, E., Herridge, M. S., Murray, A., Vorona, S., Brace, D., Rittayamai, N., Lanys, A., Tomlinson, G., Singh, J. M., Bolz, S.-S., Rubenfeld, G. D., Kavanagh, B. P., Brochard, L. J., & Ferguson, N. D. (2015). Evolution of diaphragm thickness during mechanical ventilation: Impact of inspiratory effort. *American Journal of Respiratory and Critical Care Medicine, 192*(9), 1080-1088. [https://doi.org/10.1164/rccm.201503-0620OC](https://doi.org/10.1164/rccm.201503-0620OC)
- Hess, D. R. (2005). Ventilator waveforms and the physiology of pressure support ventilation. *Respiratory Care, 50*(2), 166-186. [https://doi.org/10.4187/respcare.05500166](https://doi.org/10.4187/respcare.05500166)
- Subirà, C., Hernández, G., Vázquez, A., Rodríguez-García, R., González-Castro, A., García, C., Rubio, O., Ventura, L., López, A., de la Torre, M.-C., Keough, E., Arauzo, V., Hermosa, C., Sánchez, C., Tizón, A., Tenza, E., Laborda, C., Cabañes, S., Lacueva, V., . . . Fernández, R. (2019). Effect of pressure support vs T-piece ventilation strategies during spontaneous breathing trials on successful extubation among patients receiving mechanical ventilation: A randomized clinical trial. *JAMA, 321*(22), 2175-2182. [https://doi.org/10.1001/jama.2019.7234](https://doi.org/10.1001/jama.2019.7234)
- Tassaux, D., Gainnier, M., Battisti, A., & Jolliet, P. (2005). Impact of expiratory trigger setting on delayed cycling and inspiratory muscle workload. *American Journal of Respiratory and Critical Care Medicine, 172*(10), 1283-1289. [https://doi.org/10.1164/rccm.200407-880OC](https://doi.org/10.1164/rccm.200407-880OC)
- Telias, I., Junhasavasdikul, D., Rittayamai, N., Piquilloud, L., Chen, L., Ferguson, N. D., Goligher, E. C., & Brochard, L. (2020). Airway occlusion pressure as an estimate of respiratory drive and inspiratory effort during assisted ventilation. *American Journal of Respiratory and Critical Care Medicine, 201*(9), 1086-1098. [https://doi.org/10.1164/rccm.201907-1425OC](https://doi.org/10.1164/rccm.201907-1425OC)
- Thille, A. W., Cabello, B., Galia, F., Lyazidi, A., & Brochard, L. (2008). Reduction of patient-ventilator asynchrony by reducing tidal volume during pressure-support ventilation. *Intensive Care Medicine, 34*(8), 1477-1486. [https://doi.org/10.1007/s00134-008-1121-9](https://doi.org/10.1007/s00134-008-1121-9)
