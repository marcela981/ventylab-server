<!--
Funcionalidad: Currículo de mecánica respiratoria y ventilación mecánica
Descripción: Temario completo por track y nivel (Prerrequisitos, Principiante, Intermedio, Avanzado y VentyLab) con módulos, lecciones, ids, objetivos de aprendizaje, páginas y fuentes; generado a partir del manifiesto de importación y del contenido de prisma/curriculum/content. Contenido pendiente de validación experta (validacion-contenido.md, sección Bloque B)
Versión: 1.0
Autor: Marcela Mazo Castro
Proyecto: VentyLab
Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
Institución: Universidad del Valle
Contacto: marcela.mazo@correounivalle.edu.co
-->

# Currículo de VentyLab

Fecha: 2026-11-04. **7 niveles, 33 módulos, 71 lecciones y 339 páginas.** Estado: **pendiente de validación experta** (lista en [validacion-contenido.md](validacion-contenido.md#bloque-b--contenido-del-currículo-de-enseñanza)).

## Cómo se construyó

- **Fuentes de julio primero.** El temario y el orden parten del currículo de julio (`curriculumData.js` y `data/lessons/**` de `ventilab-web` de julio). Ese material se usó como guía de temas, no como texto final: las lecciones de Principiante eran lecturas troceadas de PDF y las de Intermedio y Avanzado estaban centradas en obesidad y en teoría pedagógica. Todo el texto es redacción original.
- **Investigación.** Cada lección se completó con guías y consensos (ATS/ESICM/SCCM, ESICM 2023, ATS 2024, definición global de SDRA 2024, ACCP/ATS 2017, ERS/ATS 2017, GOLD, GINA, BTS, AARC, SHEA), ensayos y revisiones sistemáticas de referencia (ARDSNet 2000, PROSEVA, ART, EPVent, HOT-ICU, LUNG SAFE…) y textos de referencia (West; Tobin; Hess y Kacmarek; Cairo). Cada referencia se verificó por DOI (Crossref, PubMed o Europe PMC) o, en libros, por editorial o catálogo. Ninguna cifra clínica figura sin cita; las que no se pudieron leer en el texto completo están marcadas en la lista de validación.
- **Estructura de cada lección (3 a 6 páginas):** conceptos con diagramas SVG originales, fórmulas en LaTeX con ejemplo resuelto, aplicación clínica con un ejemplo clínico y ejercicios, "Practícalo en el simulador" con un caso del catálogo cuando aplica, puntos clave, errores frecuentes y referencias en APA 7.
- **Ids.** Se conservan los ids de julio de los niveles, módulos y lecciones que siguen; lo nuevo usa un UUID determinista (`curriculumId`, mismo algoritmo que la semilla demo). Detalle y tabla para otros bloques: `_coord/curriculo-ids.md`.
- **Retirados (archivados, no borrados):** los módulos VentyLab de julio `ventylab-module-01-historia-fisiologia`, `ventylab-module-04-vni-destete`, `ventylab-module-05-raciocinio-clinico`, `ventylab-module-06-innovacion-tecnologia` (eran pedagogía, no uso de la plataforma) y las lecciones `rp-inversion-fisiologica`, `rp-ecuacion-movimiento`, `rp-variables-fase`, `basic-parameters` (duplicaban Principiante) más las 4 de esos módulos.
- **Importación:** [importacion-curriculo.md](importacion-curriculo.md).

## Track Mecánica ventilatoria · Prerequisitos

Id del nivel: `level-prerequisitos`. Repaso opcional de fisiología respiratoria y de las bases físicas y clínicas antes del currículo principal.

### 1. Fisiología respiratoria esencial

Id: `respiratory-physiology` (id de julio conservado). Anatomía funcional, mecánica de la respiración espontánea e intercambio gaseoso.

**Anatomía funcional del sistema respiratorio** — `3ba4080d-bead-5a47-8838-3d8bdcbb9e1e` · 4 páginas · 35 min

Objetivos de aprendizaje:

- Diferenciar la zona de conducción de la zona respiratoria y relacionarlas con el espacio muerto anatómico
- Explicar la función del surfactante a partir de la ley de Laplace
- Calcular el efecto de un cambio de radio sobre la resistencia de la vía aérea con la ley de Poiseuille
- Describir el papel del diafragma, la pleura y la circulación pulmonar en la mecánica y el intercambio
- Calcular la resistencia vascular pulmonar e interpretarla frente a los umbrales de las guías

Páginas: Conceptos: de la vía aérea al alvéolo · Fórmulas y cálculo: tensión superficial, resistencia y circulación pulmonar · Aplicación clínica: la anatomía en el paciente intubado · Síntesis.

**Mecánica de la respiración espontánea** — `42a5aaa4-f69f-5cc1-a153-f7cf99cb2786` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Definir las presiones alveolar, pleural, transpulmonar y del sistema respiratorio y los puntos entre los que se miden
- Describir los cambios de volumen, presión alveolar y presión pleural durante un ciclo espontáneo
- Calcular la compliance pulmonar, de la pared y del sistema respiratorio a partir de cambios de presión y volumen
- Interpretar el trabajo respiratorio y su aumento cuando cae la compliance
- Justificar el uso de la presión esofágica como estimación de la presión pleural

Páginas: Conceptos: las presiones que mueven el aire · Fórmulas y cálculo: compliance, ecuación del movimiento y trabajo · Aplicación clínica: esfuerzo intenso y pulmón rígido · Síntesis.

**Intercambio gaseoso y transporte de O₂ y CO₂** — `57bb17ed-803a-5c8f-b179-421b872cecdb` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Explicar la difusión alveolocapilar con la ley de Fick
- Clasificar las alteraciones de la relación ventilación-perfusión en shunt, relaciones bajas y espacio muerto, y predecir su respuesta al oxígeno
- Interpretar la curva de disociación de la oxihemoglobina y sus desplazamientos
- Calcular el contenido arterial de oxígeno, el aporte de oxígeno y la fracción de shunt
- Describir las formas de transporte del CO₂ y el efecto Haldane

Páginas: Conceptos: difusión y relación ventilación-perfusión · Transporte de O₂ y CO₂ en la sangre · Fórmulas y cálculo: contenido, aporte y shunt · Aplicación clínica: hipoxemia por neumonía · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Akoumianaki, E., Maggiore, S. M., Valenza, F., Bellani, G., Jubran, A., Loring, S. H., Pelosi, P., Talmor, D., Grasso, S., Chiumello, D., Guérin, C., Patroniti, N., Ranieri, V. M., Gattinoni, L., Nava, S., Terragni, P.-P., Pesenti, A., Tobin, M., Mancebo, J., & Brochard, L. (2014). The application of esophageal pressure measurement in patients with respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 189*(5), 520–531. [https://doi.org/10.1164/rccm.201312-2193CI](https://doi.org/10.1164/rccm.201312-2193CI)
- American Thoracic Society/European Respiratory Society. (2002). ATS/ERS statement on respiratory muscle testing. *American Journal of Respiratory and Critical Care Medicine, 166*(4), 518–624. [https://doi.org/10.1164/rccm.166.4.518](https://doi.org/10.1164/rccm.166.4.518)
- Cabello, B., & Mancebo, J. (2006). Work of breathing. *Intensive Care Medicine, 32*(9), 1311–1314. [https://doi.org/10.1007/s00134-006-0278-3](https://doi.org/10.1007/s00134-006-0278-3)
- Collins, J.-A., Rudenski, A., Gibson, J., Howard, L., & O'Driscoll, R. (2015). Relating oxygen partial pressure, saturation and content: The haemoglobin–oxygen dissociation curve. *Breathe, 11*(3), 194–201. [https://doi.org/10.1183/20734735.001415](https://doi.org/10.1183/20734735.001415)
- Dushianthan, A., Grocott, M. P. W., Murugan, G. S., Wilkinson, T. M. A., & Postle, A. D. (2023). Pulmonary surfactant in adult ARDS: Current perspectives and future directions. *Diagnostics, 13*(18), 2964. [https://doi.org/10.3390/diagnostics13182964](https://doi.org/10.3390/diagnostics13182964)
- Humbert, M., Kovacs, G., Hoeper, M. M., Badagliacca, R., Berger, R. M. F., Brida, M., Carlsen, J., Coats, A. J. S., Escribano-Subias, P., Ferrari, P., Ferreira, D. S., Ghofrani, H. A., Giannakoulas, G., Kiely, D. G., Mayer, E., Meszaros, G., Nagavci, B., Olsson, K. M., Pepke-Zaba, J., … Wort, S. J. (2022). 2022 ESC/ERS guidelines for the diagnosis and treatment of pulmonary hypertension. *European Heart Journal, 43*(38), 3618–3731. [https://doi.org/10.1093/eurheartj/ehac237](https://doi.org/10.1093/eurheartj/ehac237)
- Knudsen, L., Hummel, B., Wrede, C., Zimmermann, R., Perlman, C. E., & Smith, B. J. (2023). Acinar micromechanics in health and lung injury: What we have learned from quantitative morphology. *Frontiers in Physiology, 14*, 1142221. [https://doi.org/10.3389/fphys.2023.1142221](https://doi.org/10.3389/fphys.2023.1142221)
- Kovacs, G., Berghold, A., Scheidl, S., & Olschewski, H. (2009). Pulmonary arterial pressure during rest and exercise in healthy subjects: A systematic review. *European Respiratory Journal, 34*(4), 888–894. [https://doi.org/10.1183/09031936.00145608](https://doi.org/10.1183/09031936.00145608)
- Loring, S. H., Topulos, G. P., & Hubmayr, R. D. (2016). Transpulmonary pressure: The importance of precise definitions and limiting assumptions. *American Journal of Respiratory and Critical Care Medicine, 194*(12), 1452–1457. [https://doi.org/10.1164/rccm.201512-2448CP](https://doi.org/10.1164/rccm.201512-2448CP)
- Ltaief, Z., Schneider, A. G., & Liaudet, L. (2021). Pathophysiology and clinical implications of the veno-arterial PCO₂ gap. *Critical Care, 25*(1), 318. [https://doi.org/10.1186/s13054-021-03671-w](https://doi.org/10.1186/s13054-021-03671-w)
- Mallat, J., Jozwiak, M., Orozco, N., Hamzaoui, O., Monnet, X., Teboul, J.-L., De Backer, D., & Ospina-Tascón, G. A. (2025). Use of CO₂-derived variables in critically ill patients. *Annals of Intensive Care, 15*(1), 142. [https://doi.org/10.1186/s13613-025-01569-2](https://doi.org/10.1186/s13613-025-01569-2)
- Ochs, M., Nyengaard, J. R., Jung, A., Knudsen, L., Voigt, M., Wahlers, T., Richter, J., & Gundersen, H. J. G. (2004). The number of alveoli in the human lung. *American Journal of Respiratory and Critical Care Medicine, 169*(1), 120–124. [https://doi.org/10.1164/rccm.200308-1107OC](https://doi.org/10.1164/rccm.200308-1107OC)
- Petersson, J., & Glenny, R. W. (2014). Gas exchange and ventilation–perfusion relationships in the lung. *European Respiratory Journal, 44*(4), 1023–1041. [https://doi.org/10.1183/09031936.00037014](https://doi.org/10.1183/09031936.00037014)
- Robertson, H. T. (2015). Dead space: The physiology of wasted ventilation. *European Respiratory Journal, 45*(6), 1704–1716. [https://doi.org/10.1183/09031936.00137614](https://doi.org/10.1183/09031936.00137614)
- Severinghaus, J. W. (1979). Simple, accurate equations for human blood O₂ dissociation computations. *Journal of Applied Physiology, 46*(3), 599–602. [https://doi.org/10.1152/jappl.1979.46.3.599](https://doi.org/10.1152/jappl.1979.46.3.599)
- Tymen, R., dos Santos, E. C., Taccone, F. S., & Aubron, C. (2026). Physiological determinants and the red blood cells transfusion decision-making process in non-bleeding critically ill patients: A comprehensive narrative review. *Intensive Care Medicine, 52*(2), 309–323. [https://doi.org/10.1007/s00134-026-08304-w](https://doi.org/10.1007/s00134-026-08304-w)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.

</details>

### 2. Bases físicas y clínicas de la ventilación

Id: `ventilation-principles` (id de julio conservado). Física de los gases y unidades de medida; indicaciones y objetivos de la ventilación mecánica.

**Física de los gases, presiones y unidades** — `ea64918c-869c-531a-9251-a0c969d2b8e7` · 6 páginas · 35 min

Objetivos de aprendizaje:

- Distinguir presión, volumen y flujo, y relacionar el volumen con el área bajo la curva de flujo
- Aplicar las leyes de Boyle, Dalton y Henry para explicar el movimiento del gas, la presión inspirada de O₂ y el O₂ disuelto
- Calcular la presión inspirada de O₂ a distintas presiones barométricas
- Convertir correctamente entre cmH₂O, mmHg y kPa, y entre L/min y L/s
- Interpretar una gráfica magnitud-tiempo identificando ejes, línea de base, fases del ciclo, pendiente y área

Páginas: Presión, volumen y flujo: las tres magnitudes del ventilador · Leyes de los gases aplicadas a la respiración · Unidades de medida y conversiones · Lectura de gráficas magnitud-tiempo · Aplicación clínica: física de los gases junto a la cama · Síntesis.

**Indicaciones y objetivos de la ventilación mecánica** — `vm-indications` · 5 páginas · 35 min

Objetivos de aprendizaje:

- Clasificar la insuficiencia respiratoria aguda en hipoxémica o hipercápnica a partir del mecanismo y la gasometría
- Identificar las principales indicaciones de ventilación mecánica, incluida la controversia sobre la protección de la vía aérea
- Explicar los objetivos fisiológicos y clínicos del soporte ventilatorio
- Justificar la elección entre oxígeno de alto flujo, ventilación no invasiva y ventilación invasiva según las guías vigentes
- Reconocer los criterios de fracaso del soporte no invasivo que obligan a intubar sin demora

Páginas: Insuficiencia respiratoria: falla del pulmón y falla de la bomba · Indicaciones y objetivos de la ventilación mecánica · Ventilación invasiva frente a no invasiva · Aplicación clínica: de la mascarilla al tubo · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Cairo, J. M. (2020). *Pilbeam's mechanical ventilation: Physiological and clinical applications* (7.ª ed.). Elsevier.
- Davidson, A. C., Banham, S., Elliott, M., Kennedy, D., Gelder, C., Glossop, A., Church, A. C., Creagh-Brown, B., Dodd, J. W., Felton, T., Foëx, B., Mansfield, L., McDonnell, L., Parker, R., Patterson, C. M., Sovani, M., y Thomas, L. (2016). BTS/ICS guideline for the ventilatory management of acute hypercapnic respiratory failure in adults. *Thorax, 71*(Suppl 2), ii1-ii35. [https://doi.org/10.1136/thoraxjnl-2015-208209](https://doi.org/10.1136/thoraxjnl-2015-208209)
- Freund, Y., Viglino, D., Cachanado, M., Cassard, C., Montassier, E., Douay, B., Guenezan, J., Le Borgne, P., Yordanov, Y., Severin, A., Roussel, M., Daniel, M., Marteau, A., Peschanski, N., Teissandier, D., Macrez, R., Morere, J., Chouihed, T., Roux, D., ... Simon, T. (2023). Effect of noninvasive airway management of comatose patients with acute poisoning: A randomized clinical trial. *JAMA, 330*(23), 2267-2274. [https://doi.org/10.1001/jama.2023.24391](https://doi.org/10.1001/jama.2023.24391)
- Hess, D. R., y Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4.ª ed.). McGraw-Hill Education.
- O'Driscoll, B. R., Howard, L. S., Earis, J., y Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl 1), ii1-ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Oczkowski, S., Ergan, B., Bos, L., Chatwin, M., Ferrer, M., Gregoretti, C., Heunks, L., Frat, J. P., Longhini, F., Nava, S., Navalesi, P., Ozsancak Uğurlu, A., Pisani, L., Renda, T., Thille, A. W., Winck, J. C., Windisch, W., Tonia, T., Boyd, J., ... Scala, R. (2022). ERS clinical practice guidelines: High-flow nasal cannula in acute respiratory failure. *European Respiratory Journal, 59*(4), 2101574. [https://doi.org/10.1183/13993003.01574-2021](https://doi.org/10.1183/13993003.01574-2021)
- Pham, T., Brochard, L. J., y Slutsky, A. S. (2017). Mechanical ventilation: State of the art. *Mayo Clinic Proceedings, 92*(9), 1382-1400. [https://doi.org/10.1016/j.mayocp.2017.05.004](https://doi.org/10.1016/j.mayocp.2017.05.004)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., y Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Roussos, C., y Koutsoukou, A. (2003). Respiratory failure. *European Respiratory Journal, 22*(Suppl 47), 3s-14s. [https://doi.org/10.1183/09031936.03.00038503](https://doi.org/10.1183/09031936.03.00038503)
- Slutsky, A. S. (1993). Mechanical ventilation. American College of Chest Physicians' Consensus Conference. *Chest, 104*(6), 1833-1859. [https://doi.org/10.1378/chest.104.6.1833](https://doi.org/10.1378/chest.104.6.1833)
- Thompson, A., y Taylor, B. N. (2008). *Guide for the use of the International System of Units (SI)* (NIST Special Publication 811). National Institute of Standards and Technology. [https://doi.org/10.6028/NIST.SP.811e2008](https://doi.org/10.6028/NIST.SP.811e2008)
- West, J. B. (1996). Prediction of barometric pressures at high altitude with the use of model atmospheres. *Journal of Applied Physiology, 81*(4), 1850-1854. [https://doi.org/10.1152/jappl.1996.81.4.1850](https://doi.org/10.1152/jappl.1996.81.4.1850)
- West, J. B., y Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11.ª ed.). Wolters Kluwer.

</details>

## Track Mecánica ventilatoria · Nivel Principiante

Id del nivel: `level-beginner`. Fisiología aplicada, mecánica respiratoria, el ventilador, parámetros y modos básicos, monitoreo, alarmas y seguridad.

### 1. La inversión fisiológica y la fisiología aplicada

Id: `module-01-inversion-fisiologica` (id de julio conservado). Del gradiente negativo de la respiración espontánea a la presión positiva; volúmenes, ventilación alveolar y oxigenación.

**De la presión negativa a la presión positiva** — `module-01-inversion-fisiologica` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Comparar las presiones alveolar, pleural y transpulmonar durante la respiración espontánea y durante la ventilación con presión positiva.
- Explicar cómo cambia la distribución de la ventilación en el paciente anestesiado y paralizado frente al paciente que respira solo.
- Describir el papel del pulmón de acero y de la epidemia de poliomielitis de Copenhague de 1952 en el paso a la ventilación con presión positiva.
- Relacionar el aumento de la presión intratorácica con sus efectos sobre el retorno venoso y la poscarga de ambos ventrículos.
- Analizar una hipotensión tras el inicio de la ventilación mecánica e identificar las causas que deben descartarse.

Páginas: De la presión negativa a la presión positiva · Historia breve y primeras consecuencias hemodinámicas · Aplicación clínica: la hipotensión tras la intubación · Síntesis.

**Volúmenes pulmonares, espacio muerto y ventilación alveolar** — `9c2e6dc2-f10e-59e7-b508-9861b5e93ffb` · 4 páginas · 45 min

Objetivos de aprendizaje:

- Identificar los volúmenes y capacidades pulmonares y explicar la importancia clínica de la capacidad residual funcional.
- Diferenciar el espacio muerto anatómico, instrumental, alveolar y fisiológico.
- Calcular la ventilación minuto, la ventilación alveolar y la fracción de espacio muerto con la ecuación de Bohr-Enghoff.
- Predecir el efecto de un cambio de volumen corriente o de frecuencia sobre la PaCO₂ mediante la ecuación de la ventilación alveolar.
- Interpretar una hipercapnia con volumen minuto aparentemente adecuado y proponer medidas para reducir el espacio muerto.

Páginas: Volúmenes, capacidades y espacio muerto · Fórmulas y cálculo: ventilación minuto, ventilación alveolar y PaCO₂ · Aplicación clínica: hipercapnia con volumen minuto "alto" · Síntesis.

**Oxigenación y ventilación: dos objetivos distintos** — `6e63d316-e5a7-5e7d-b60e-3b9c76d12a56` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Distinguir los controles del ventilador que modifican la oxigenación de los que modifican la eliminación de CO₂.
- Calcular la PO₂ alveolar con la ecuación del gas alveolar y el gradiente alveolo-arterial.
- Clasificar un caso de hipoxemia según su mecanismo a partir del gradiente A-a y de la respuesta a la FiO₂.
- Estimar la presión media de la vía aérea en una onda de presión cuadrada y explicar su relación con la oxigenación.
- Justificar la elección de ajustes iniciales ante un paciente con hipoxemia e hipercapnia simultáneas.

Páginas: Oxigenación y ventilación: dos problemas, dos grupos de controles · Fórmulas y cálculo: gas alveolar, gradiente A-a y presión media · Aplicación clínica: hipoxemia e hipercapnia en el mismo paciente · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Aggarwal, N. R., Brower, R. G., Hager, D. N., Thompson, B. T., Netzer, G., Shanholtz, C., Lagakos, A., & Checkley, W. (2018). Oxygen exposure resulting in arterial oxygen tensions above the protocol goal was associated with worse clinical outcomes in acute respiratory distress syndrome. *Critical Care Medicine, 46*(4), 517–524. [https://doi.org/10.1097/CCM.0000000000002886](https://doi.org/10.1097/CCM.0000000000002886)
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Drinker, P., & Shaw, L. A. (1929). An apparatus for the prolonged administration of artificial respiration: I. A design for adults and children. *Journal of Clinical Investigation, 7*(2), 229–247. [https://doi.org/10.1172/JCI100226](https://doi.org/10.1172/JCI100226)
- Froese, A. B., & Bryan, A. C. (1974). Effects of anesthesia and paralysis on diaphragmatic mechanics in man. *Anesthesiology, 41*(3), 242–255. [https://doi.org/10.1097/00000542-197409000-00006](https://doi.org/10.1097/00000542-197409000-00006)
- Hantzidiamantis, P. J., & Amaro, E. (2023). Physiology, alveolar to arterial oxygen gradient. En *StatPearls*. StatPearls Publishing. [https://www.ncbi.nlm.nih.gov/books/NBK545153/](https://www.ncbi.nlm.nih.gov/books/NBK545153/)
- Hedenstierna, G., & Edmark, L. (2010). Mechanisms of atelectasis in the perioperative period. *Best Practice & Research Clinical Anaesthesiology, 24*(2), 157–169. [https://doi.org/10.1016/j.bpa.2009.12.002](https://doi.org/10.1016/j.bpa.2009.12.002)
- Lassen, H. C. A. (1953). A preliminary report on the 1952 epidemic of poliomyelitis in Copenhagen with special reference to the treatment of acute respiratory insufficiency. *The Lancet, 261*(6749), 37–41. [https://doi.org/10.1016/S0140-6736(53)92530-6](https://doi.org/10.1016/S0140-6736(53)92530-6)
- Marini, J. J., & Ravenscraft, S. A. (1992). Mean airway pressure: Physiologic determinants and clinical importance—Part 1: Physiologic determinants and measurements. *Critical Care Medicine, 20*(10), 1461–1472. [https://doi.org/10.1097/00003246-199210000-00017](https://doi.org/10.1097/00003246-199210000-00017)
- Nuckton, T. J., Alonso, J. A., Kallet, R. H., Daniel, B. M., Pittet, J.-F., Eisner, M. D., & Matthay, M. A. (2002). Pulmonary dead-space fraction as a risk factor for death in the acute respiratory distress syndrome. *New England Journal of Medicine, 346*(17), 1281–1286. [https://doi.org/10.1056/NEJMoa012835](https://doi.org/10.1056/NEJMoa012835)
- O'Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl. 1), ii1–ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Pinsky, M. R. (2018). Cardiopulmonary interactions: Physiologic basis and clinical applications. *Annals of the American Thoracic Society, 15*(Suppl. 1), S45–S48. [https://doi.org/10.1513/AnnalsATS.201704-339FR](https://doi.org/10.1513/AnnalsATS.201704-339FR)
- Robertson, H. T. (2015). Dead space: The physiology of wasted ventilation. *European Respiratory Journal, 45*(6), 1704–1716. [https://doi.org/10.1183/09031936.00137614](https://doi.org/10.1183/09031936.00137614)
- Sarkar, M., Niranjan, N., & Banyal, P. K. (2017). Mechanisms of hypoxemia. *Lung India, 34*(1), 47–60. [https://doi.org/10.4103/0970-2113.197116](https://doi.org/10.4103/0970-2113.197116)
- Slutsky, A. S. (2015). History of mechanical ventilation: From Vesalius to ventilator-induced lung injury. *American Journal of Respiratory and Critical Care Medicine, 191*(10), 1106–1115. [https://doi.org/10.1164/rccm.201503-0421PP](https://doi.org/10.1164/rccm.201503-0421PP)
- Tusman, G., Sipmann, F. S., & Bohm, S. H. (2012). Rationale of dead space measurement by volumetric capnography. *Anesthesia & Analgesia, 114*(4), 866–874. [https://doi.org/10.1213/ANE.0b013e318247f6cc](https://doi.org/10.1213/ANE.0b013e318247f6cc)
- Wanger, J., Clausen, J. L., Coates, A., Pedersen, O. F., Brusasco, V., Burgos, F., Casaburi, R., Crapo, R., Enright, P., van der Grinten, C. P. M., Gustafsson, P., Hankinson, J., Jensen, R., Johnson, D., MacIntyre, N., McKay, R., Miller, M. R., Navajas, D., Pellegrino, R., & Viegi, G. (2005). Standardisation of the measurement of lung volumes. *European Respiratory Journal, 26*(3), 511–522. [https://doi.org/10.1183/09031936.05.00035005](https://doi.org/10.1183/09031936.05.00035005)
- West, J. B. (2005). The physiological challenges of the 1952 Copenhagen poliomyelitis epidemic and a renaissance in clinical respiratory physiology. *Journal of Applied Physiology, 99*(2), 424–432. [https://doi.org/10.1152/japplphysiol.00184.2005](https://doi.org/10.1152/japplphysiol.00184.2005)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.

</details>

### 2. Mecánica respiratoria: la ecuación del movimiento

Id: `module-02-ecuacion-movimiento` (id de julio conservado). Ecuación del movimiento, compliance, elastancia, resistencia y constante de tiempo.

**La ecuación del movimiento** — `module-02-ecuacion-movimiento` · 4 páginas · 45 min

Objetivos de aprendizaje:

- Identificar los términos de la ecuación del movimiento (presión elástica, presión resistiva, PEEP total y presión muscular) y sus unidades.
- Calcular la presión pico y la presión meseta esperadas a partir del volumen, el flujo, la compliance, la resistencia y la PEEP.
- Interpretar un aumento de presión en la vía aérea distinguiendo un patrón resistivo de uno elástico mediante la comparación pico-meseta.
- Explicar qué variable controla el ventilador y cuál depende del paciente en VCV y en PCV.
- Justificar por qué las mediciones de mecánica deben realizarse con el paciente pasivo.

Páginas: La ecuación del movimiento: de qué se compone la presión · Fórmulas y cálculo · Aplicación clínica: leer una alarma de presión alta · Síntesis.

**Compliance y elastancia del sistema respiratorio** — `0b16070a-7016-5c19-932d-7e37ded51b6a` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Calcular la compliance estática, la compliance dinámica, la elastancia y la driving pressure usando la PEEP total.
- Diferenciar la compliance estática de la dinámica y explicar qué información aporta cada una.
- Interpretar la curva presión-volumen estática, incluidas la zona lineal y la de sobredistensión.
- Identificar causas de compliance baja de origen pulmonar y de la pared torácica, y causas de compliance alta.
- Justificar por qué una misma presión meseta puede implicar distinta tensión pulmonar según la pared torácica.

Páginas: Compliance y elastancia: conceptos · Fórmulas y cálculo · Aplicación clínica: compliance en el SDRA con obesidad · Síntesis.

**Resistencia de la vía aérea y constante de tiempo** — `3f430df2-6cd5-5554-81d6-cef0a9a5e98a` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Calcular la resistencia inspiratoria con la fórmula (Ppico − Pmeseta)/flujo en VCV con flujo constante.
- Identificar los factores que aumentan la resistencia (radio, tubo endotraqueal, secreciones, broncoespasmo, circuito) y su relación con la ley de Poiseuille.
- Calcular la constante de tiempo y estimar la fracción de volumen exhalada según el tiempo espiratorio.
- Interpretar el atrapamiento aéreo y la auto-PEEP como consecuencia de un tiempo espiratorio corto respecto a la constante de tiempo.
- Ajustar de forma razonada la frecuencia y el tiempo inspiratorio para alargar el tiempo espiratorio en un paciente obstruido.

Páginas: Resistencia de la vía aérea: conceptos · Fórmulas y cálculo · Aplicación clínica: resistencia alta y atrapamiento · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., et al. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747–755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network [Acute Respiratory Distress Syndrome Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Chiumello, D., Carlesso, E., Cadringher, P., Caironi, P., Valenza, F., Polli, F., Tallarini, F., Cozzi, P., Cressoni, M., Colombo, A., Marini, J. J., & Gattinoni, L. (2008). Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 178*(4), 346–355. [https://doi.org/10.1164/rccm.200710-1589OC](https://doi.org/10.1164/rccm.200710-1589OC)
- Gattinoni, L., Pelosi, P., Suter, P. M., Pedoto, A., Vercesi, P., & Lissoni, A. (1998). Acute respiratory distress syndrome caused by pulmonary and extrapulmonary disease: Different syndromes? *American Journal of Respiratory and Critical Care Medicine, 158*(1), 3–11. [https://doi.org/10.1164/ajrccm.158.1.9708031](https://doi.org/10.1164/ajrccm.158.1.9708031)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., et al. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Grinnan, D. C., & Truwit, J. D. (2005). Clinical review: Respiratory mechanics in spontaneous and assisted ventilation. *Critical Care, 9*(5), 472–484. [https://doi.org/10.1186/cc3516](https://doi.org/10.1186/cc3516)
- Lucangelo, U., Bernabé, F., & Blanch, L. (2005). Respiratory mechanics derived from signals in the ventilator circuit. *Respiratory Care, 50*(1), 55–67. [https://pubmed.ncbi.nlm.nih.gov/15636645/](https://pubmed.ncbi.nlm.nih.gov/15636645/)
- Marini, J. J. (2011). Dynamic hyperinflation and auto-positive end-expiratory pressure: Lessons learned over 30 years. *American Journal of Respiratory and Critical Care Medicine, 184*(7), 756–762. [https://doi.org/10.1164/rccm.201102-0226PP](https://doi.org/10.1164/rccm.201102-0226PP)
- Marini, J. J., & Crooke, P. S. (1993). A general mathematical model for respiratory dynamics relevant to the clinical setting. *American Review of Respiratory Disease, 147*(1), 14–24. [https://doi.org/10.1164/ajrccm/147.1.14](https://doi.org/10.1164/ajrccm/147.1.14)
- Mauri, T., Yoshida, T., Bellani, G., Goligher, E. C., Carteaux, G., Rittayamai, N., Mojoli, F., Chiumello, D., Piquilloud, L., Grasso, S., et al. (2016). Esophageal and transpulmonary pressure in the clinical setting: Meaning, usefulness and perspectives. *Intensive Care Medicine, 42*(9), 1360–1373. [https://doi.org/10.1007/s00134-016-4400-x](https://doi.org/10.1007/s00134-016-4400-x)
- Pérez-Nieto, O. R., Mancilla-Galindo, J., Mendiola-Villalobos, C., Carrión-Moya, J. D., Zamarrón-López, E. I., Guerrero-Gutiérrez, M. A., et al. (2023). Aplicaciones clínicas de la ecuación del movimiento del sistema respiratorio para la toma de decisiones en el paciente bajo ventilación mecánica invasiva: artículo de reflexión. *Iatreia, 36*(1), 112–127. [https://doi.org/10.17533/udea.iatreia.179](https://doi.org/10.17533/udea.iatreia.179)

</details>

### 3. El ventilador: componentes y variables de fase

Id: `module-03-variables-fase` (id de julio conservado). Componentes del ventilador y del circuito; disparo, límite, ciclado y línea de base.

**Componentes del ventilador y del circuito** — `33024dc7-3909-5783-9471-864cde3b2687` · 5 páginas · 35 min

Objetivos de aprendizaje:

- Identificar la función de la fuente de gas, el mezclador, las válvulas inspiratoria y espiratoria, los sensores y el controlador en el suministro de cada respiración.
- Diferenciar la humidificación activa del intercambiador de calor y humedad según sus metas de humedad, su espacio muerto y su resistencia.
- Calcular el efecto del espacio muerto instrumental sobre la ventilación alveolar y la PaCO₂ esperada.
- Calcular el volumen compresible del circuito y justificar la autoprueba del equipo con el circuito definitivo.
- Justificar ante un caso clínico la retirada de un accesorio del circuito como causa de hipercapnia o de aumento de la presión pico.

Páginas: Conceptos: cómo está construido un ventilador · Circuito, humidificación, filtros e interfaz · Fórmulas y cálculo: volumen, espacio muerto y volumen compresible · Aplicación clínica: cuando el circuito explica la gasometría · Síntesis.

**Variables de fase: disparo, límite y ciclado** — `module-03-variables-fase` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Identificar en las curvas de presión y flujo las cuatro variables de fase de una respiración: disparo, objetivo o límite, ciclado y línea de base.
- Clasificar una respiración como mandatoria o espontánea según quién controla su disparo y su ciclado.
- Calcular el tiempo inspiratorio en VCV con flujo constante y el flujo de ciclado en presión de soporte.
- Interpretar los signos de un disparo poco sensible, de autodisparo y de ciclado tardío.
- Ajustar de forma razonada la sensibilidad del disparo y el criterio de ciclado en un paciente con obstrucción al flujo aéreo.

Páginas: Conceptos: la lógica de cada respiración · Disparo, ciclado y línea de base en detalle · Fórmulas y cálculo: tiempo inspiratorio y criterio de ciclado · Aplicación clínica: leer las fases en un paciente obstructivo · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Aslanian, P., El Atrous, S., Isabey, D., Valente, E., Corsi, D., Harf, A., Lemaire, F., & Brochard, L. (1998). Effects of flow triggering on breathing effort during partial ventilatory support. *American Journal of Respiratory and Critical Care Medicine, 157*(1), 135-143. [https://doi.org/10.1164/ajrccm.157.1.96-12052](https://doi.org/10.1164/ajrccm.157.1.96-12052)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Gentile, M. A. (2011). Cycling of the mechanical ventilator breath. *Respiratory Care, 56*(1), 52-60. [https://doi.org/10.4187/respcare.01088](https://doi.org/10.4187/respcare.01088)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Hinkson, C. R., Benson, M. S., Stephens, L. M., & Deem, S. (2006). The effects of apparatus dead space on PaCO2 in patients receiving lung-protective ventilation. *Respiratory Care, 51*(10), 1140-1144. [https://pubmed.ncbi.nlm.nih.gov/17005059/](https://pubmed.ncbi.nlm.nih.gov/17005059/)
- Imanaka, H., Nishimura, M., Takeuchi, M., Kimball, W. R., Yahagi, N., & Kumon, K. (2000). Autotriggering caused by cardiogenic oscillation during flow-triggered mechanical ventilation. *Critical Care Medicine, 28*(2), 402-407. [https://doi.org/10.1097/00003246-200002000-00019](https://doi.org/10.1097/00003246-200002000-00019)
- Klompas, M., Branson, R., Cawcutt, K., Crist, M., Eichenwald, E. C., Greene, L. R., Lee, G., Maragakis, L. L., Powell, K., Priebe, G. P., Speck, K., Yokoe, D. S., & Berenholtz, S. M. (2022). Strategies to prevent ventilator-associated pneumonia, ventilator-associated events, and nonventilator hospital-acquired pneumonia in acute-care hospitals: 2022 update. *Infection Control & Hospital Epidemiology, 43*(6), 687-713. [https://doi.org/10.1017/ice.2022.88](https://doi.org/10.1017/ice.2022.88)
- Morán, I., Bellapart, J., Vari, A., & Mancebo, J. (2006). Heat and moisture exchangers and heated humidifiers in acute lung injury/acute respiratory distress syndrome patients: Effects on respiratory mechanics and gas exchange. *Intensive Care Medicine, 32*(4), 524-531. [https://doi.org/10.1007/s00134-006-0073-1](https://doi.org/10.1007/s00134-006-0073-1)
- Restrepo, R. D., & Walsh, B. K. (2012). Humidification during invasive and noninvasive mechanical ventilation: 2012. *Respiratory Care, 57*(5), 782-788. [https://doi.org/10.4187/respcare.01766](https://doi.org/10.4187/respcare.01766)
- Sassoon, C. S. (2011). Triggering of the ventilator in patient-ventilator interactions. *Respiratory Care, 56*(1), 39-51. [https://doi.org/10.4187/respcare.01006](https://doi.org/10.4187/respcare.01006)
- Tassaux, D., Gainnier, M., Battisti, A., & Jolliet, P. (2005). Impact of expiratory trigger setting on delayed cycling and inspiratory muscle workload. *American Journal of Respiratory and Critical Care Medicine, 172*(10), 1283-1289. [https://doi.org/10.1164/rccm.200407-880OC](https://doi.org/10.1164/rccm.200407-880OC)
- Thille, A. W., Rodriguez, P., Cabello, B., Lellouche, F., & Brochard, L. (2006). Patient-ventilator asynchrony during assisted mechanical ventilation. *Intensive Care Medicine, 32*(10), 1515-1522. [https://doi.org/10.1007/s00134-006-0301-8](https://doi.org/10.1007/s00134-006-0301-8)
- Wilkes, A. R. (2011a). Heat and moisture exchangers and breathing system filters: Their use in anaesthesia and intensive care. Part 1 - history, principles and efficiency. *Anaesthesia, 66*(1), 31-39. [https://doi.org/10.1111/j.1365-2044.2010.06563.x](https://doi.org/10.1111/j.1365-2044.2010.06563.x)
- Wilkes, A. R. (2011b). Heat and moisture exchangers and breathing system filters: Their use in anaesthesia and intensive care. Part 2 - practical use, including problems, and their use with paediatric patients. *Anaesthesia, 66*(1), 40-51. [https://doi.org/10.1111/j.1365-2044.2010.06564.x](https://doi.org/10.1111/j.1365-2044.2010.06564.x)

</details>

### 4. Parámetros ventilatorios básicos

Id: `12369cc3-13d2-5c35-b16f-55a372d9ae29`. Volumen corriente por peso predicho, frecuencia, tiempos, relación I:E, FiO₂ y PEEP iniciales.

**Volumen corriente y peso corporal predicho** — `fef34f34-13b1-5758-aab2-b0fd634b6264` · 4 páginas · 35 min

Objetivos de aprendizaje:

- Calcular el peso corporal predicho a partir de la talla y el sexo con la fórmula de ARDSNet.
- Calcular el volumen corriente en mL a partir de un objetivo en mL/kg de peso predicho y expresar en mL/kg un volumen ya programado.
- Justificar por qué el volumen corriente se dosifica según el peso predicho y no según el peso real.
- Seleccionar un rango de volumen corriente coherente con la evidencia en pacientes con y sin SDRA.
- Identificar los errores habituales de dosificación en pacientes con obesidad o de baja talla.

Páginas: Conceptos: el volumen corriente se dosifica según el tamaño del pulmón · Fórmulas y cálculo del volumen corriente · Aplicación clínica: elegir el volumen corriente · Síntesis.

**Frecuencia, tiempos y relación I:E** — `05d50865-e1f7-5d2c-93f0-70807f95ca8d` · 4 páginas · 35 min

Objetivos de aprendizaje:

- Calcular el tiempo de ciclo total, el tiempo inspiratorio, el tiempo espiratorio y la relación I:E a partir de la frecuencia, el volumen corriente, el flujo y la pausa.
- Calcular la ventilación minuto y estimar la ventilación alveolar considerando el espacio muerto.
- Estimar el cambio esperado de PaCO₂ al modificar la ventilación alveolar.
- Interpretar en la curva de flujo un tiempo espiratorio insuficiente y relacionarlo con la auto-PEEP.
- Ajustar frecuencia y flujo inspiratorio para prolongar el tiempo espiratorio en un paciente obstructivo.

Páginas: Conceptos: el ciclo ventilatorio repartido en el tiempo · Fórmulas y cálculo de los tiempos · Aplicación clínica: cuando el tiempo espiratorio no alcanza · Síntesis.

**FiO₂ y PEEP: primeros ajustes** — `5101c979-c772-57a6-a412-5b37df5b0627` · 4 páginas · 35 min

Objetivos de aprendizaje:

- Explicar los mecanismos por los que la FiO₂ y la PEEP mejoran la oxigenación y sus riesgos principales.
- Seleccionar la meta de SpO₂ adecuada según el contexto clínico y las guías.
- Calcular e interpretar el cociente PaO₂/FiO₂ indicando la FiO₂ y la PEEP de referencia.
- Ajustar la sensibilidad del disparo al valor más sensible que no produzca autodisparo.
- Aplicar una secuencia ordenada de comprobaciones y ajustes durante los primeros 30 minutos de ventilación.

Páginas: Conceptos: FiO₂, PEEP y sensibilidad del disparo · Metas de oxigenación, valores iniciales y cálculos · Aplicación clínica: los primeros 30 minutos · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Cakar, N., Tuğrul, M., Demirarslan, A., Nahum, A., Adams, A., Akýncý, O., Esen, F., & Telci, L. (2001). Time required for partial pressure of arterial oxygen equilibration during mechanical ventilation after a step change in fractional inspired oxygen concentration. *Intensive Care Medicine, 27*(4), 655–659. [https://doi.org/10.1007/s001340100900](https://doi.org/10.1007/s001340100900)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., et al. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Han, S., Martin, G. S., Maloney, J. P., Shanholtz, C., Barnes, K. C., Murray, S., & Sevransky, J. E. (2011). Short women with severe sepsis-related acute lung injury receive lung protective ventilation less frequently: An observational cohort study. *Critical Care, 15*(6), R262. [https://doi.org/10.1186/cc10524](https://doi.org/10.1186/cc10524)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary* [Protocolo]. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- O'Driscoll, B. R., Howard, L., Earis, J., & Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl 1), ii1–ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Plens, G., Morais, C., Nakamura, M., Souza, P., et al. (2018). Effect of cardiogenic oscillations on trigger delay during pressure support ventilation. *Respiratory Care, 63*(7), 865–872. [https://doi.org/10.4187/respcare.05995](https://doi.org/10.4187/respcare.05995)
- Sassoon, C. S. H. (2011). Triggering of the ventilator in patient-ventilator interactions. *Respiratory Care, 56*(1), 39–51. [https://doi.org/10.4187/respcare.01006](https://doi.org/10.4187/respcare.01006)
- Serpa Neto, A., Cardoso, S. O., Manetta, J. A., Pereira, V. G., Espósito, D. C., Pasqualucci, M. de O., et al. (2012). Association between use of lung-protective ventilation with lower tidal volumes and clinical outcomes among patients without acute respiratory distress syndrome: A meta-analysis. *JAMA, 308*(16), 1651–1659. [https://doi.org/10.1001/jama.2012.13730](https://doi.org/10.1001/jama.2012.13730)
- Siemieniuk, R. A. C., Chu, D. K., Kim, L. H., Güell-Rous, M. R., Alhazzani, W., Soccal, P. M., et al. (2018). Oxygen therapy for acutely ill medical patients: A clinical practice guideline. *BMJ, 363*, k4169. [https://doi.org/10.1136/bmj.k4169](https://doi.org/10.1136/bmj.k4169)
- Simonis, F. D., Binnekade, J. M., Braber, A., Gelissen, H. P., et al. (2015). PReVENT — protective ventilation in patients without ARDS at start of ventilation: Study protocol for a randomized controlled trial. *Trials, 16*, 226. [https://doi.org/10.1186/s13063-015-0759-1](https://doi.org/10.1186/s13063-015-0759-1)
- Sjoding, M. W., Dickson, R. P., Iwashyna, T. J., Gay, S. E., & Valley, T. S. (2020). Racial bias in pulse oximetry measurement. *New England Journal of Medicine, 383*(25), 2477–2478. [https://doi.org/10.1056/NEJMc2029240](https://doi.org/10.1056/NEJMc2029240)
- The Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Walter, J. M., Corbridge, T. C., & Singer, B. D. (2018). Invasive mechanical ventilation. *Southern Medical Journal, 111*(12), 746–753. [https://doi.org/10.14423/SMJ.0000000000000905](https://doi.org/10.14423/SMJ.0000000000000905)
- Writing Committee and Steering Committee for the RELAx Collaborative Group, Algera, A. G., Pisani, L., Serpa Neto, A., et al. (2020). Effect of a lower vs higher positive end-expiratory pressure strategy on ventilator-free days in ICU patients without ARDS: A randomized clinical trial. *JAMA, 324*(24), 2509–2520. [https://doi.org/10.1001/jama.2020.23517](https://doi.org/10.1001/jama.2020.23517)
- Writing Group for the PReVENT Investigators, Simonis, F. D., Serpa Neto, A., Binnekade, J. M., et al. (2018). Effect of a low vs intermediate tidal volume strategy on ventilator-free days in intensive care unit patients without ARDS: A randomized clinical trial. *JAMA, 320*(18), 1872–1880. [https://doi.org/10.1001/jama.2018.14280](https://doi.org/10.1001/jama.2018.14280)

</details>

### 5. Modos ventilatorios básicos: VCV y PCV

Id: `module-04-modos-ventilatorios` (id de julio conservado). Taxonomía de los modos y ventilación controlada por volumen y por presión.

**Taxonomía de los modos ventilatorios** — `module-04-modos-ventilatorios` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Diferenciar un ciclo mandatorio de uno espontáneo según quién decide el disparo y el ciclado
- Identificar la variable de control (volumen o presión) de un modo a partir de lo que se preestablece en cada ciclo
- Clasificar un modo en su patrón ventilatorio (VC-CMV, VC-IMV, PC-CMV, PC-IMV o PC-CSV) y justificar por qué no existe VC-CSV
- Traducir nombres comerciales frecuentes (A/C, PRVC, VC+, PSV) a su etiqueta taxonómica
- Calcular la ventilación minuto real en CMV cuando el paciente dispara ciclos adicionales

Páginas: Qué es un modo ventilatorio · Secuencias de ciclos y patrones ventilatorios · Del nombre comercial a la taxonomía · Síntesis.

**Ventilación controlada por volumen (VCV)** — `572cf862-d25a-55bd-abd5-e4a6bbc03d6c` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Interpretar las curvas de presión, flujo y volumen de la VCV con flujo constante y pausa inspiratoria
- Calcular resistencia, compliance, presión de distensión y tiempo inspiratorio a partir de la presión pico, la presión meseta y el flujo
- Distinguir un aumento de presión de origen resistivo de uno de origen elástico mediante la pausa inspiratoria
- Explicar el efecto del flujo constante frente al desacelerado sobre la presión pico y la presión meseta
- Reconocer el hambre de flujo en la curva de presión y proponer ajustes correctivos

Páginas: Cómo funciona la ventilación controlada por volumen · Fórmulas y cálculo en VCV · Aplicación clínica: cuando la presión cambia · Síntesis.

**Ventilación controlada por presión (PCV)** — `f8b4033b-c332-5dde-a2cf-7e81d370a52a` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Explicar por qué en PCV la presión es cuadrada y el flujo desacelerado
- Calcular el volumen corriente esperado en PCV a partir de la compliance, la resistencia, la presión y el tiempo inspiratorio
- Interpretar la curva de flujo para decidir si alargar el tiempo inspiratorio aumentará el volumen
- Identificar las causas de un cambio de volumen con presión constante y priorizar la respuesta
- Ajustar las alarmas de volumen espirado y ventilación minuto como vigilancia principal del modo

Páginas: Cómo funciona la ventilación controlada por presión · Fórmulas y cálculo en PCV · Aplicación clínica: cuando el volumen cambia · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Al-Saady, N., & Bennett, E. D. (1985). Decelerating inspiratory flow waveform improves lung mechanics and gas exchange in patients on intermittent positive-pressure ventilation. *Intensive Care Medicine, 11*(2), 68-75. [https://doi.org/10.1007/BF00254777](https://doi.org/10.1007/BF00254777)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Chatburn, R. L. (2007). Classification of ventilator modes: Update and proposal for implementation. *Respiratory Care, 52*(3), 301-323. [https://doi.org/10.4187/respcare.07520301](https://doi.org/10.4187/respcare.07520301)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Esteban, A., Alía, I., Gordo, F., de Pablo, R., Suarez, J., González, G., & Blanco, J. (2000). Prospective randomized trial comparing pressure-controlled ventilation and volume-controlled ventilation in ARDS. *Chest, 117*(6), 1690-1696. [https://doi.org/10.1378/chest.117.6.1690](https://doi.org/10.1378/chest.117.6.1690)
- Fajardo-Campoverdi, A., Mireles-Cabodevila, E., Medina, A., Ibarra-Estrada, M., Baltazar-Torres, J., & Chatburn, R. (2025). Actualización de la taxonomía de los modos de ventilación mecánica. *Medicina Intensiva, 49*(10), 502211. [https://doi.org/10.1016/j.medin.2025.502211](https://doi.org/10.1016/j.medin.2025.502211)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., Adhikari, N. K. J., Amato, M. B. P., Branson, R., Brower, R. G., Ferguson, N. D., Gajic, O., Gattinoni, L., Hess, D., Mancebo, J., Meade, M. O., McAuley, D. F., Pesenti, A., Ranieri, V. M., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Marini, J. J., Capps, J. S., & Culver, B. H. (1985). The inspiratory work of breathing during assisted mechanical ventilation. *Chest, 87*(5), 612-618. [https://doi.org/10.1378/chest.87.5.612](https://doi.org/10.1378/chest.87.5.612)
- Mireles-Cabodevila, E., Hatipoğlu, U., & Chatburn, R. L. (2013). A rational framework for selecting modes of ventilation. *Respiratory Care, 58*(2), 348-366. [https://doi.org/10.4187/respcare.01839](https://doi.org/10.4187/respcare.01839)
- Rittayamai, N., Katsios, C. M., Beloncle, F., Friedrich, J. O., Mancebo, J., & Brochard, L. (2015). Pressure-controlled vs volume-controlled ventilation in acute respiratory failure: A physiology-based narrative and systematic review. *Chest, 148*(2), 340-355. [https://doi.org/10.1378/chest.14-3169](https://doi.org/10.1378/chest.14-3169)
- Tobin, M. J. (Ed.). (2013). *Principles and practice of mechanical ventilation* (3rd ed.). McGraw-Hill Medical.

</details>

### 6. Monitoreo básico y alarmas

Id: `module-05-monitorizacion-grafica` (id de julio conservado). Presiones, volúmenes y curvas escalares; alarmas del ventilador y respuesta escalonada.

**Monitoreo básico: presiones, volúmenes y curvas escalares** — `module-05-monitorizacion-grafica` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar en el monitor la presión pico, la presión meseta, la PEEP total, la presión media, el Vti, el Vte y la ventilación minuto, y explicar qué representa cada una.
- Calcular la resistencia, la compliance estática, la driving pressure, la ventilación minuto y la fracción de fuga a partir de los valores del monitor.
- Interpretar las curvas escalares de presión, flujo y volumen frente al tiempo en VCV y PCV, incluidos los signos de auto-PEEP, fuga y secreciones.
- Aplicar una secuencia sistemática de lectura del monitor y justificar si un cambio de presión es de origen resistivo o elástico.

Páginas: Qué mide el ventilador y qué significa cada valor · Fórmulas y cálculo a partir del monitor · Lectura sistemática de las curvas · Aplicación clínica: un cambio en el monitor · Síntesis.

**Alarmas del ventilador: tipos y respuesta** — `64447eb0-63a5-51c1-92ea-6c4202be7875` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Identificar las alarmas básicas del ventilador (presión alta y baja, Vte bajo, VE alta y baja, frecuencia alta, apnea, desconexión, fallo de gas o energía) y sus causas más frecuentes.
- Ajustar los límites de alarma a partir de los valores estables del paciente y reajustarlos tras cada cambio de parámetros.
- Explicar qué es la fatiga de alarmas, por qué se produce y qué estrategias la reducen.
- Aplicar una respuesta escalonada ante una alarma, priorizando la evaluación del paciente y la ventilación manual cuando está inestable.

Páginas: Para qué sirven las alarmas y qué tipos existen · Cómo ajustar los límites · Fatiga de alarmas · Respuesta escalonada ante una alarma · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Barberis, L., Manno, E., & Guérin, C. (2003). Effect of end-inspiratory pause duration on plateau pressure in mechanically ventilated patients. *Intensive Care Medicine, 29*(1), 130-134. [https://doi.org/10.1007/s00134-002-1568-z](https://doi.org/10.1007/s00134-002-1568-z)
- Dexter, A. M., & Clark, K. (2020). Ventilator graphics: Scalars, loops, & secondary measures. *Respiratory Care, 65*(6), 739-759. [https://doi.org/10.4187/respcare.07805](https://doi.org/10.4187/respcare.07805)
- Hess, D. R. (2014). Respiratory mechanics in mechanically ventilated patients. *Respiratory Care, 59*(11), 1773-1794. [https://doi.org/10.4187/respcare.03410](https://doi.org/10.4187/respcare.03410)
- Higgs, A., McGrath, B. A., Goddard, C., Rangasami, J., Suntharalingam, G., Gale, R., Cook, T. M., Difficult Airway Society, Intensive Care Society, Faculty of Intensive Care Medicine, & Royal College of Anaesthetists. (2018). Guidelines for the management of tracheal intubation in critically ill adults. *British Journal of Anaesthesia, 120*(2), 323-352. [https://doi.org/10.1016/j.bja.2017.10.021](https://doi.org/10.1016/j.bja.2017.10.021)
- Langga, L., Oh, J., López, D., Blake, N., McField, E., Hotz, J., Nava-Guerra, L., Knox, K., & Chinnock, R. (2021). Prevalence, proportionality, and cause of ventilator alarms in a pediatric intensive care setting. *Respiratory Care, 66*(4), 541-550. [https://doi.org/10.4187/respcare.07200](https://doi.org/10.4187/respcare.07200)
- Marini, J. J., & Ravenscraft, S. A. (1992). Mean airway pressure: Physiologic determinants and clinical importance—Part 1: Physiologic determinants and measurements. *Critical Care Medicine, 20*(10), 1461-1472. [https://doi.org/10.1097/00003246-199210000-00017](https://doi.org/10.1097/00003246-199210000-00017)
- Pepe, P. E., & Marini, J. J. (1982). Occult positive end-expiratory pressure in mechanically ventilated patients with airflow obstruction: The auto-PEEP effect. *American Review of Respiratory Disease, 126*(1), 166-170. [https://pubmed.ncbi.nlm.nih.gov/7046541/](https://pubmed.ncbi.nlm.nih.gov/7046541/)
- Scott, J. B., De Vaux, L., Dills, C., & Strickland, S. L. (2019). Mechanical ventilation alarms and alarm fatigue. *Respiratory Care, 64*(10), 1308-1313. [https://doi.org/10.4187/respcare.06878](https://doi.org/10.4187/respcare.06878)
- Sendelbach, S., & Funk, M. (2013). Alarm fatigue: A patient safety concern. *AACN Advanced Critical Care, 24*(4), 378-386. [https://doi.org/10.4037/NCI.0b013e3182a903f9](https://doi.org/10.4037/NCI.0b013e3182a903f9)
- The Joint Commission. (2013, 8 de abril). *Medical device alarm safety in hospitals* (Sentinel Event Alert, Issue 50). [https://www.jointcommission.org/sea_issue_50](https://www.jointcommission.org/sea_issue_50)
- Walsh, B. K., & Waugh, J. B. (2020). Alarm strategies and surveillance for mechanical ventilation. *Respiratory Care, 65*(6), 820-831. [https://doi.org/10.4187/respcare.07546](https://doi.org/10.4187/respcare.07546)

</details>

### 7. Efectos sistémicos y seguridad del paciente ventilado

Id: `module-06-efectos-sistemicos` (id de julio conservado). Interacción corazón-pulmón, lesión inducida por el ventilador y seguridad del paciente.

**Efectos sistémicos y lesión inducida por el ventilador** — `module-06-efectos-sistemicos` · 6 páginas · 45 min

Objetivos de aprendizaje:

- Explicar cómo la presión positiva intratorácica modifica el retorno venoso, la poscarga del ventrículo derecho y la poscarga del ventrículo izquierdo.
- Identificar los efectos renales y neurológicos de la ventilación mecánica y los factores que los agravan.
- Diferenciar barotrauma, volutrauma, atelectrauma y biotrauma por su mecanismo y su manifestación clínica.
- Calcular el peso corporal predicho, el volumen corriente por kilo y la presión de distensión a partir de datos del ventilador.
- Justificar un ajuste de volumen corriente, PEEP o FiO₂ considerando a la vez su efecto pulmonar y hemodinámico.

Páginas: Interacción corazón-pulmón bajo presión positiva · Riñón, cerebro y toxicidad del oxígeno · Lesión pulmonar inducida por el ventilador · Fórmulas y cálculo · Aplicación clínica · Síntesis.

**Seguridad del paciente ventilado** — `43a4c272-1b4a-5d6b-930b-c3fb82b8d0fd` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Aplicar una verificación sistemática del equipo y de la cabecera antes de conectar al paciente y en cada turno.
- Enumerar las prácticas esenciales de prevención de la neumonía asociada a la ventilación según la actualización SHEA 2022 y justificar su mecanismo.
- Calcular y verificar la presión del manguito dentro del rango que evita fuga e isquemia de la mucosa.
- Identificar los factores de riesgo de desconexión y extubación no planificada y las medidas para prevenirlas.
- Aplicar el enfoque DOPE y la ventilación manual de rescate ante el deterioro agudo de un paciente intubado.

Páginas: Antes de conectar: equipo y cabecera preparados · Prevención de la neumonía asociada a la ventilación · Desconexiones y extubación no planificada · Deterioro agudo: el enfoque DOPE · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network [ARDS Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Cook, T. M., Woodall, N., Harper, J., & Benger, J. (2011). Major complications of airway management in the UK: Results of the Fourth National Audit Project of the Royal College of Anaesthetists and the Difficult Airway Society. Part 2: Intensive care and emergency departments. *British Journal of Anaesthesia, 106*(5), 632-642. [https://doi.org/10.1093/bja/aer059](https://doi.org/10.1093/bja/aer059)
- Drakulovic, M. B., Torres, A., Bauer, T. T., Nicolas, J. M., Nogué, S., & Ferrer, M. (1999). Supine body position as a risk factor for nosocomial pneumonia in mechanically ventilated patients: A randomised trial. *The Lancet, 354*(9193), 1851-1858. [https://doi.org/10.1016/S0140-6736(98)12251-1](https://doi.org/10.1016/S0140-6736(98)12251-1)
- Higgs, A., McGrath, B. A., Goddard, C., Rangasami, J., Suntharalingam, G., Gale, R., & Cook, T. M. (2018). Guidelines for the management of tracheal intubation in critically ill adults. *British Journal of Anaesthesia, 120*(2), 323-352. [https://doi.org/10.1016/j.bja.2017.10.021](https://doi.org/10.1016/j.bja.2017.10.021)
- Kallet, R. H., & Matthay, M. A. (2013). Hyperoxic acute lung injury. *Respiratory Care, 58*(1), 123-141. [https://doi.org/10.4187/respcare.01963](https://doi.org/10.4187/respcare.01963)
- Kleinman, M. E., Chameides, L., Schexnayder, S. M., Samson, R. A., Hazinski, M. F., Atkins, D. L., Berg, M. D., de Caen, A. R., Fink, E. L., Freid, E. B., Hickey, R. W., Marino, B. S., Nadkarni, V. M., Proctor, L. T., Qureshi, F. A., Sartorelli, K., Topjian, A., van der Jagt, E. W., & Zaritsky, A. L. (2010). Part 14: Pediatric advanced life support: 2010 American Heart Association guidelines for cardiopulmonary resuscitation and emergency cardiovascular care. *Circulation, 122*(18 Suppl. 3), S876-S908. [https://doi.org/10.1161/CIRCULATIONAHA.110.971101](https://doi.org/10.1161/CIRCULATIONAHA.110.971101)
- Klompas, M., Branson, R., Cawcutt, K., Crist, M., Eichenwald, E. C., Greene, L. R., Lee, G., Maragakis, L. L., Powell, K., Priebe, G. P., Speck, K., Yokoe, D. S., & Berenholtz, S. M. (2022). Strategies to prevent ventilator-associated pneumonia, ventilator-associated events, and nonventilator hospital-acquired pneumonia in acute-care hospitals: 2022 update. *Infection Control & Hospital Epidemiology, 43*(6), 687-713. [https://doi.org/10.1017/ice.2022.88](https://doi.org/10.1017/ice.2022.88)
- Koyner, J. L., & Murray, P. T. (2008). Mechanical ventilation and lung-kidney interactions. *Clinical Journal of the American Society of Nephrology, 3*(2), 562-570. [https://doi.org/10.2215/CJN.03090707](https://doi.org/10.2215/CJN.03090707)
- Mahmood, S. S., & Pinsky, M. R. (2018). Heart-lung interactions during mechanical ventilation: The basics. *Annals of Translational Medicine, 6*(18), 349. [https://doi.org/10.21037/atm.2018.04.29](https://doi.org/10.21037/atm.2018.04.29)
- Pinsky, M. R. (2018). Cardiopulmonary interactions: Physiologic basis and clinical applications. *Annals of the American Thoracic Society, 15*(Suppl. 1), S45-S48. [https://doi.org/10.1513/AnnalsATS.201704-339FR](https://doi.org/10.1513/AnnalsATS.201704-339FR)
- Rello, J., Soñora, R., Jubert, P., Artigas, A., Rué, M., & Vallés, J. (1996). Pneumonia in intubated patients: Role of respiratory airway care. *American Journal of Respiratory and Critical Care Medicine, 154*(1), 111-115. [https://doi.org/10.1164/ajrccm.154.1.8680665](https://doi.org/10.1164/ajrccm.154.1.8680665)
- Robba, C., Poole, D., McNett, M., Asehnoune, K., Bösel, J., Bruder, N., Chieregato, A., Cinotti, R., Duranteau, J., Einav, S., Ercole, A., Ferguson, N., Guerin, C., Siempos, I. I., Kurtz, P., Juffermans, N. P., Mancebo, J., Mascia, L., McCredie, V., ... Stevens, R. D. (2020). Mechanical ventilation in patients with acute brain injury: Recommendations of the European Society of Intensive Care Medicine consensus. *Intensive Care Medicine, 46*(12), 2397-2410. [https://doi.org/10.1007/s00134-020-06283-0](https://doi.org/10.1007/s00134-020-06283-0)
- Schjørring, O. L., Klitgaard, T. L., Perner, A., Wetterslev, J., Lange, T., Siegemund, M., Bäcklund, M., Keus, F., Laake, J. H., Morgan, M., Thormar, K. M., Rosborg, S. A., Bisgaard, J., Erntgaard, A. E. S., Lynnerup, A. H., Pedersen, R. L., Crescioli, E., Gielstrup, T. C., Behzadi, M. T., ... Rasmussen, B. S. (2021). Lower or higher oxygenation targets for acute hypoxemic respiratory failure. *New England Journal of Medicine, 384*(14), 1301-1311. [https://doi.org/10.1056/NEJMoa2032510](https://doi.org/10.1056/NEJMoa2032510)
- Seegobin, R. D., & van Hasselt, G. L. (1984). Endotracheal cuff pressure and tracheal mucosal blood flow: Endoscopic study of effects of four large volume cuffs. *British Medical Journal, 288*(6422), 965-968. [https://doi.org/10.1136/bmj.288.6422.965](https://doi.org/10.1136/bmj.288.6422.965)
- Slutsky, A. S., & Ranieri, V. M. (2013). Ventilator-induced lung injury. *New England Journal of Medicine, 369*(22), 2126-2136. [https://doi.org/10.1056/NEJMra1208707](https://doi.org/10.1056/NEJMra1208707)

</details>

## Track Mecánica ventilatoria · Nivel Intermedio

Id del nivel: `level-intermedio`. Selección del modo, modos espontáneos, SIMV y duales, curvas y bucles, asincronías, gasometría, oxigenación y destete. Requiere completar `level-beginner`. Los módulos se desbloquean en orden.

### 1. Selección del modo: VCV frente a PCV en el paciente complejo

Id: `module-01-vcv-vs-pcv` (id de julio conservado). Evidencia comparativa y criterios para elegir la variable de control.

**VCV frente a PCV en el paciente complejo** — `lesson-vcv-vs-pcv` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar qué variable controla y cuál deja libre cada modo ante un cambio de compliance, resistencia o esfuerzo del paciente.
- Calcular con la ecuación del movimiento la Ppico, la Pplat y la driving pressure en VCV y el volumen corriente esperado en PCV.
- Interpretar la evidencia comparativa entre VCV y PCV en SDRA y en anestesia, distinguiendo asociación de causalidad.
- Justificar la elección del modo y el ajuste de alarmas en un paciente con obesidad y SDRA.
- Ajustar la presión inspiratoria en PCV cuando la compliance cambia para mantener el volumen corriente protector.

Páginas: Qué variable protege cada modo · Fórmulas y cálculo: predecir la respuesta a un cambio de mecánica · Qué dice la evidencia comparativa · Aplicación clínica: SDRA en una paciente con obesidad · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network (ARDS Network). (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Bagchi, A., Rudolph, M. I., Ng, P. Y., Timm, F. P., Long, D. R., Shaefi, S., Ladha, K., Vidal Melo, M. F., & Eikermann, M. (2017). The association of postoperative pulmonary complications in 109,360 patients with pressure-controlled or volume-controlled ventilation. *Anaesthesia, 72*(11), 1334-1343. [https://doi.org/10.1111/anae.14039](https://doi.org/10.1111/anae.14039)
- Chacko, B., Peter, J. V., Tharyan, P., John, G., & Jeyaseelan, L. (2015). Pressure-controlled versus volume-controlled ventilation for acute respiratory failure due to acute lung injury (ALI) or acute respiratory distress syndrome (ARDS). *Cochrane Database of Systematic Reviews*, (1), CD008807. [https://doi.org/10.1002/14651858.CD008807.pub2](https://doi.org/10.1002/14651858.CD008807.pub2)
- De Jong, A., Wrigge, H., Hedenstierna, G., Gattinoni, L., Chiumello, D., Frat, J.-P., Ball, L., Schetz, M., Pickkers, P., & Jaber, S. (2020). How to ventilate obese patients in the ICU. *Intensive Care Medicine, 46*(12), 2423-2435. [https://doi.org/10.1007/s00134-020-06286-x](https://doi.org/10.1007/s00134-020-06286-x)
- Esteban, A., Alía, I., Gordo, F., de Pablo, R., Suarez, J., González, G., & Blanco, J. (2000). Prospective randomized trial comparing pressure-controlled ventilation and volume-controlled ventilation in ARDS. *Chest, 117*(6), 1690-1696. [https://doi.org/10.1378/chest.117.6.1690](https://doi.org/10.1378/chest.117.6.1690)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., Adhikari, N. K. J., Amato, M. B. P., Branson, R., Brower, R. G., Ferguson, N. D., Gajic, O., Gattinoni, L., Hess, D., Mancebo, J., Meade, M. O., McAuley, D. F., Pesenti, A., Ranieri, V. M., . . . Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Rittayamai, N., Katsios, C. M., Beloncle, F., Friedrich, J. O., Mancebo, J., & Brochard, L. (2015). Pressure-controlled vs volume-controlled ventilation in acute respiratory failure: A physiology-based narrative and systematic review. *Chest, 148*(2), 340-355. [https://doi.org/10.1378/chest.14-3169](https://doi.org/10.1378/chest.14-3169)

</details>

### 2. Modos espontáneos: PSV y CPAP

Id: `module-03-soporte-psv-cpap` (id de julio conservado). Presión de soporte y presión positiva continua.

**Ventilación con presión de soporte (PSV)** — `lesson-soporte-psv-cpap` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Identificar en las curvas de presión y flujo el disparo, la presurización (rise time) y el ciclado por flujo de una respiración en PSV.
- Calcular el flujo de ciclado a partir del criterio programado y estimar el esfuerzo muscular y la driving pressure transpulmonar con la presión de oclusión.
- Interpretar los signos clínicos y gráficos de sobreasistencia e infraasistencia, incluidos los esfuerzos ineficaces.
- Ajustar el nivel de soporte y el criterio de ciclado en un paciente con EPOC y asincronía.
- Justificar por qué el volumen corriente y la frecuencia en PSV son resultados y no ajustes.

Páginas: Cómo funciona la presión de soporte · Fórmulas y ajuste de parámetros · Sobreasistencia, infraasistencia y ciclado · Aplicación clínica: esfuerzos ineficaces en un paciente con EPOC · Síntesis.

**CPAP y presión positiva continua** — `46ed6992-7c2f-5cfb-84e1-17496b27d104` · 5 páginas · 35 min

Objetivos de aprendizaje:

- Explicar los efectos de la CPAP sobre la capacidad residual funcional, la compliance, el trabajo respiratorio y la vía aérea superior.
- Calcular el cambio de la carga umbral por auto-PEEP y el sentido del cambio de la poscarga del ventrículo izquierdo con presión positiva.
- Identificar las indicaciones con evidencia (edema pulmonar cardiogénico, hipoxemia posoperatoria, apnea obstructiva del sueño) y las situaciones en que la CPAP no basta.
- Interpretar la respuesta a la CPAP en la primera hora y decidir cuándo escalar el soporte.
- Planificar la vigilancia posoperatoria del paciente con apnea obstructiva del sueño.

Páginas: Qué hace la presión positiva continua · Fórmulas y cálculo: presiones que cambian con la CPAP · Indicaciones y evidencia · Aplicación clínica: hipoxemia tras una laparotomía · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Bertoni, M., Telias, I., Urner, M., Long, M., Del Sorbo, L., Fan, E., Sinderby, C., Beck, J., Liu, L., Qiu, H., Wong, J., Slutsky, A. S., Ferguson, N. D., Brochard, L. J., & Goligher, E. C. (2019). A novel non-invasive method to detect excessively high respiratory effort and dynamic transpulmonary driving pressure during mechanical ventilation. *Critical Care, 23*(1), 346. [https://doi.org/10.1186/s13054-019-2617-0](https://doi.org/10.1186/s13054-019-2617-0)
- Brochard, L., Harf, A., Lorino, H., & Lemaire, F. (1989). Inspiratory pressure support prevents diaphragmatic fatigue during weaning from mechanical ventilation. *American Review of Respiratory Disease, 139*(2), 513-521. [https://doi.org/10.1164/ajrccm/139.2.513](https://doi.org/10.1164/ajrccm/139.2.513)
- Chung, F., Liao, P., Yegneswaran, B., Shapiro, C. M., & Kang, W. (2014). Postoperative changes in sleep-disordered breathing and sleep architecture in patients with obstructive sleep apnea. *Anesthesiology, 120*(2), 287-298. [https://doi.org/10.1097/ALN.0000000000000040](https://doi.org/10.1097/ALN.0000000000000040)
- De Jong, A., Wrigge, H., Hedenstierna, G., Gattinoni, L., Chiumello, D., Frat, J.-P., Ball, L., Schetz, M., Pickkers, P., & Jaber, S. (2020). How to ventilate obese patients in the ICU. *Intensive Care Medicine, 46*(12), 2423-2435. [https://doi.org/10.1007/s00134-020-06286-x](https://doi.org/10.1007/s00134-020-06286-x)
- Goligher, E. C., Fan, E., Herridge, M. S., Murray, A., Vorona, S., Brace, D., Rittayamai, N., Lanys, A., Tomlinson, G., Singh, J. M., Bolz, S.-S., Rubenfeld, G. D., Kavanagh, B. P., Brochard, L. J., & Ferguson, N. D. (2015). Evolution of diaphragm thickness during mechanical ventilation: Impact of inspiratory effort. *American Journal of Respiratory and Critical Care Medicine, 192*(9), 1080-1088. [https://doi.org/10.1164/rccm.201503-0620OC](https://doi.org/10.1164/rccm.201503-0620OC)
- Gray, A., Goodacre, S., Newby, D. E., Masson, M., Sampson, F., & Nicholl, J. (2008). Noninvasive ventilation in acute cardiogenic pulmonary edema. *New England Journal of Medicine, 359*(2), 142-151. [https://doi.org/10.1056/NEJMoa0707992](https://doi.org/10.1056/NEJMoa0707992)
- Hess, D. R. (2005). Ventilator waveforms and the physiology of pressure support ventilation. *Respiratory Care, 50*(2), 166-186. [https://doi.org/10.4187/respcare.05500166](https://doi.org/10.4187/respcare.05500166)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Patil, S. P., Ayappa, I. A., Caples, S. M., Kimoff, R. J., Patel, S. R., & Harrod, C. G. (2019). Treatment of adult obstructive sleep apnea with positive airway pressure: An American Academy of Sleep Medicine clinical practice guideline. *Journal of Clinical Sleep Medicine, 15*(2), 335-343. [https://doi.org/10.5664/jcsm.7640](https://doi.org/10.5664/jcsm.7640)
- Perkins, G. D., Ji, C., Connolly, B. A., Couper, K., Lall, R., Baillie, J. K., Bradley, J. M., Dark, P., Dave, C., De Soyza, A., Dennis, A. V., Devrell, A., Fairbairn, S., Ghani, H., Gorman, E. A., Green, C. A., Hart, N., Hee, S. W., Kimbley, Z., . . . McAuley, D. F. (2022). Effect of noninvasive respiratory strategies on intubation or mortality among patients with acute hypoxemic respiratory failure and COVID-19: The RECOVERY-RS randomized clinical trial. *JAMA, 327*(6), 546-558. [https://doi.org/10.1001/jama.2022.0028](https://doi.org/10.1001/jama.2022.0028)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., & Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Squadrone, V., Coha, M., Cerutti, E., Schellino, M. M., Biolino, P., Occella, P., Belloni, G., Vilianis, G., Fiore, G., Cavallo, F., Ranieri, V. M., & Piedmont Intensive Care Units Network (PICUN). (2005). Continuous positive airway pressure for treatment of postoperative hypoxemia: A randomized controlled trial. *JAMA, 293*(5), 589-595. [https://doi.org/10.1001/jama.293.5.589](https://doi.org/10.1001/jama.293.5.589)
- Subirà, C., Hernández, G., Vázquez, A., Rodríguez-García, R., González-Castro, A., García, C., Rubio, O., Ventura, L., López, A., de la Torre, M.-C., Keough, E., Arauzo, V., Hermosa, C., Sánchez, C., Tizón, A., Tenza, E., Laborda, C., Cabañes, S., Lacueva, V., . . . Fernández, R. (2019). Effect of pressure support vs T-piece ventilation strategies during spontaneous breathing trials on successful extubation among patients receiving mechanical ventilation: A randomized clinical trial. *JAMA, 321*(22), 2175-2182. [https://doi.org/10.1001/jama.2019.7234](https://doi.org/10.1001/jama.2019.7234)
- Tassaux, D., Gainnier, M., Battisti, A., & Jolliet, P. (2005). Impact of expiratory trigger setting on delayed cycling and inspiratory muscle workload. *American Journal of Respiratory and Critical Care Medicine, 172*(10), 1283-1289. [https://doi.org/10.1164/rccm.200407-880OC](https://doi.org/10.1164/rccm.200407-880OC)
- Telias, I., Junhasavasdikul, D., Rittayamai, N., Piquilloud, L., Chen, L., Ferguson, N. D., Goligher, E. C., & Brochard, L. (2020). Airway occlusion pressure as an estimate of respiratory drive and inspiratory effort during assisted ventilation. *American Journal of Respiratory and Critical Care Medicine, 201*(9), 1086-1098. [https://doi.org/10.1164/rccm.201907-1425OC](https://doi.org/10.1164/rccm.201907-1425OC)
- Thille, A. W., Cabello, B., Galia, F., Lyazidi, A., & Brochard, L. (2008). Reduction of patient-ventilator asynchrony by reducing tidal volume during pressure-support ventilation. *Intensive Care Medicine, 34*(8), 1477-1486. [https://doi.org/10.1007/s00134-008-1121-9](https://doi.org/10.1007/s00134-008-1121-9)

</details>

### 3. SIMV y modos duales

Id: `module-04-duales-simv` (id de julio conservado). Ventilación mandatoria intermitente sincronizada y modos de control adaptativo.

**SIMV: principios, usos y limitaciones** — `lesson-duales-simv` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Identificar en las curvas los ciclos mandatorios y espontáneos de SIMV con presión de soporte
- Explicar la lógica de la ventana de sincronía y en qué se diferencia SIMV de la ventilación asistida-controlada
- Calcular la ventilación minuto total y la fracción aportada por los ciclos mandatorios
- Justificar con la evidencia por qué la reducción progresiva de la frecuencia SIMV no es un método de destete recomendado

Páginas: SIMV: cómo funciona · Ventilación minuto y reparto del trabajo · SIMV en la práctica clínica · Síntesis.

**Modos duales y de control adaptativo** — `9a68375f-81fb-592b-9287-78af74a513ed` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Describir cómo un modo de volumen objetivo con presión adaptativa ajusta la presión ciclo a ciclo
- Calcular la presión inspiratoria necesaria para un volumen objetivo a partir de la compliance
- Interpretar una presión adaptativa creciente o decreciente como signo clínico
- Identificar el riesgo de retirada de soporte y de volumen excesivo con esfuerzo intenso del paciente
- Calcular la frecuencia de liberación y la presión media en APRV y valorar los límites de su evidencia

Páginas: Volumen objetivo con presión adaptativa · La presión que busca el algoritmo · APRV: una introducción · Modos adaptativos en la cabecera · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Branson, R. D., & Chatburn, R. L. (2007). Should adaptive pressure control modes be utilized for virtually all patients receiving mechanical ventilation? *Respiratory Care, 52*(4), 478-488. [https://doi.org/10.4187/respcare.07520478](https://doi.org/10.4187/respcare.07520478)
- Brochard, L., Rauss, A., Benito, S., Conti, G., Mancebo, J., Rekik, N., Gasparetto, A., & Lemaire, F. (1994). Comparison of three methods of gradual withdrawal from ventilatory support during weaning from mechanical ventilation. *American Journal of Respiratory and Critical Care Medicine, 150*(4), 896-903. [https://doi.org/10.1164/ajrccm.150.4.7921460](https://doi.org/10.1164/ajrccm.150.4.7921460)
- Cairo, J. M. (2020). *Pilbeam's mechanical ventilation: Physiological and clinical applications* (7th ed.). Elsevier.
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Esteban, A., Frutos, F., Tobin, M. J., Alía, I., Solsona, J. F., Valverdú, I., Fernández, R., de la Cal, M. A., Benito, S., Tomás, R., et al. (1995). A comparison of four methods of weaning patients from mechanical ventilation. *New England Journal of Medicine, 332*(6), 345-350. [https://doi.org/10.1056/NEJM199502093320601](https://doi.org/10.1056/NEJM199502093320601)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Kallet, R. H. (2011). Patient-ventilator interaction during acute lung injury, and the role of spontaneous breathing: Part 2: Airway pressure release ventilation. *Respiratory Care, 56*(2), 190-206. [https://doi.org/10.4187/respcare.00968](https://doi.org/10.4187/respcare.00968)
- Kallet, R. H., Campbell, A. R., Dicker, R. A., Katz, J. A., & Mackersie, R. C. (2005). Work of breathing during lung-protective ventilation in patients with acute lung injury and acute respiratory distress syndrome: A comparison between volume and pressure-regulated breathing modes. *Respiratory Care, 50*(12), 1623-1631. [https://doi.org/10.4187/respcare.05501623](https://doi.org/10.4187/respcare.05501623)
- Lim, J., & Litton, E. (2019). Airway pressure release ventilation in adult patients with acute hypoxemic respiratory failure: A systematic review and meta-analysis. *Critical Care Medicine, 47*(12), 1794-1799. [https://doi.org/10.1097/CCM.0000000000003972](https://doi.org/10.1097/CCM.0000000000003972)
- Marini, J. J., Smith, T. C., & Lamb, V. J. (1988). External work output and force generation during synchronized intermittent mechanical ventilation: Effect of machine assistance on breathing effort. *American Review of Respiratory Disease, 138*(5), 1169-1179. [https://doi.org/10.1164/ajrccm/138.5.1169](https://doi.org/10.1164/ajrccm/138.5.1169)
- Mireles-Cabodevila, E., Hatipoğlu, U., & Chatburn, R. L. (2013). A rational framework for selecting modes of ventilation. *Respiratory Care, 58*(2), 348-366. [https://doi.org/10.4187/respcare.01839](https://doi.org/10.4187/respcare.01839)
- Schmidt, G. A., Girard, T. D., Kress, J. P., Morris, P. E., Ouellette, D. R., Alhazzani, W., Burns, S. M., Epstein, S. K., Esteban, A., Fan, E., Ferrer, M., Fraser, G. L., Gong, M. N., Hough, C. L., Mehta, S., Nanchal, R., Patel, S., Pawlik, A. J., Schweickert, W. D., … Truwit, J. D. (2017). Official executive summary of an American Thoracic Society/American College of Chest Physicians clinical practice guideline: Liberation from mechanical ventilation in critically ill adults. *American Journal of Respiratory and Critical Care Medicine, 195*(1), 115-119. [https://doi.org/10.1164/rccm.201610-2076ST](https://doi.org/10.1164/rccm.201610-2076ST)
- Zhou, Y., Jin, X., Lv, Y., Wang, P., Yang, Y., Liang, G., Wang, B., & Kang, Y. (2017). Early application of airway pressure release ventilation may reduce the duration of mechanical ventilation in acute respiratory distress syndrome. *Intensive Care Medicine, 43*(11), 1648-1659. [https://doi.org/10.1007/s00134-017-4912-z](https://doi.org/10.1007/s00134-017-4912-z)

</details>

### 4. Curvas y bucles ventilatorios

Id: `module-05-graficas-fine-tuning` (id de julio conservado). Curvas escalares por modo y bucles presión-volumen y flujo-volumen.

**Curvas de presión, flujo y volumen en el tiempo** — `lesson-graficas-fine-tuning` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar qué curva refleja la mecánica del paciente en VCV y en PCV
- Calcular la resistencia, la compliance estática y la constante de tiempo a partir de las curvas
- Interpretar los signos gráficos de auto-PEEP, fuga, secreciones y hambre de flujo
- Ajustar el flujo inspiratorio, el tiempo inspiratorio y el tiempo de subida según la forma de las curvas

Páginas: Las curvas escalares por modo · Mecánica a partir de las curvas · Patrones anormales y ajuste fino · Las curvas en un caso real · Síntesis.

**Bucles presión-volumen y flujo-volumen** — `1e978a22-62ac-564c-b7eb-bc668af71b14` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Diferenciar la curva presión-volumen casi estática del bucle dinámico del ventilador
- Calcular la compliance dinámica y estática y la fracción de fuga a partir de los bucles
- Interpretar en los bucles la sobredistensión, la obstrucción al flujo espiratorio y las secreciones
- Justificar las limitaciones de los bucles antes de tomar decisiones de ajuste

Páginas: El bucle presión-volumen · Pendientes y cálculos en los bucles · El bucle flujo-volumen · Los bucles en dos pacientes · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Cairo, J. M. (2020). *Pilbeam's mechanical ventilation: Physiological and clinical applications* (7th ed.). Elsevier.
- Dhand, R. (2005). Ventilator graphics and respiratory mechanics in the patient with obstructive lung disease. *Respiratory Care, 50*(2), 246-261. [https://doi.org/10.4187/respcare.05500246](https://doi.org/10.4187/respcare.05500246)
- Georgopoulos, D., Prinianakis, G., & Kondili, E. (2006). Bedside waveforms interpretation as a tool to identify patient-ventilator asynchronies. *Intensive Care Medicine, 32*(1), 34-47. [https://doi.org/10.1007/s00134-005-2828-5](https://doi.org/10.1007/s00134-005-2828-5)
- Grasso, S., Terragni, P., Mascia, L., Fanelli, V., Quintel, M., Herrmann, P., Hedenstierna, G., Slutsky, A. S., & Ranieri, V. M. (2004). Airway pressure-time curve profile (stress index) detects tidal recruitment/hyperinflation in experimental acute lung injury. *Critical Care Medicine, 32*(4), 1018-1027. [https://doi.org/10.1097/01.CCM.0000120059.94009.AD](https://doi.org/10.1097/01.CCM.0000120059.94009.AD)
- Guglielminotti, J., Alzieu, M., Maury, E., Guidet, B., & Offenstadt, G. (2000). Bedside detection of retained tracheobronchial secretions in patients receiving mechanical ventilation: Is it time for tracheal suctioning? *Chest, 118*(4), 1095-1099. [https://doi.org/10.1378/chest.118.4.1095](https://doi.org/10.1378/chest.118.4.1095)
- Harris, R. S. (2005). Pressure-volume curves of the respiratory system. *Respiratory Care, 50*(1), 78-99. [https://doi.org/10.4187/respcare.05500078](https://doi.org/10.4187/respcare.05500078)
- Hess, D. R. (2014). Respiratory mechanics in mechanically ventilated patients. *Respiratory Care, 59*(11), 1773-1794. [https://doi.org/10.4187/respcare.03410](https://doi.org/10.4187/respcare.03410)
- Lucangelo, U., Bernabè, F., & Blanch, L. (2005). Respiratory mechanics derived from signals in the ventilator circuit. *Respiratory Care, 50*(1), 55-67. [https://doi.org/10.4187/respcare.05500055](https://doi.org/10.4187/respcare.05500055)

</details>

### 5. Asincronías paciente-ventilador

Id: `f9e877f8-7590-592c-ab04-a57e4d309c9a`. Asincronías de disparo, de flujo y de ciclado: reconocimiento y corrección.

**Asincronías de disparo** — `cd02baa6-9dc5-50a4-a62c-73d03fc7a306` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Identificar en las curvas de presión y flujo el esfuerzo ineficaz, el disparo retardado y el autodisparo.
- Explicar por qué la auto-PEEP y la sobreasistencia producen esfuerzos ineficaces.
- Calcular el índice de asincronía y el umbral de disparo en presencia de auto-PEEP.
- Ajustar el nivel de soporte, la sensibilidad del trigger y la PEEP externa según la causa identificada.
- Justificar por qué la frecuencia del monitor no sustituye a la observación clínica del paciente.

Páginas: Qué es una asincronía de disparo · Fórmulas: índice de asincronía y umbral de disparo · Aplicación clínica: esfuerzos ineficaces en EPOC · Síntesis.

**Asincronías de flujo y de ciclado** — `edaeaaa7-69e1-5292-8052-f27daa4dc61f` · 4 páginas · 40 min

Objetivos de aprendizaje:

- Reconocer el hambre de flujo, el flujo excesivo, el ciclado prematuro, el ciclado tardío y el doble disparo en las curvas escalares.
- Interpretar la ecuación del movimiento con esfuerzo muscular para explicar la concavidad de la presión en VCV.
- Calcular el tiempo inspiratorio en VCV y estimar el efecto del criterio de ciclado en presión de soporte según la constante de tiempo.
- Ajustar flujo, tiempo inspiratorio, modo y criterio de ciclado anticipando sus efectos secundarios.
- Justificar la vigilancia del volumen corriente real ante el doble disparo y el cambio a modos de presión.

Páginas: Asincronías de flujo y de ciclado · Fórmulas: flujo, tiempo inspiratorio y criterio de ciclado · Aplicación clínica: hambre de flujo, doble disparo y ciclado tardío · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Blanch, L., Villagra, A., Sales, B., Montanya, J., Lucangelo, U., Luján, M., García-Esquirol, O., Chacón, E., Estruga, A., Oliva, J. C., Hernández-Abadia, A., Albaiceta, G. M., Fernández-Mondejar, E., Fernández, R., Lopez-Aguilar, J., Villar, J., Murias, G., & Kacmarek, R. M. (2015). Asynchronies during mechanical ventilation are associated with mortality. *Intensive Care Medicine, 41*(4), 633-641. [https://doi.org/10.1007/s00134-015-3692-6](https://doi.org/10.1007/s00134-015-3692-6)
- Chiumello, D., Polli, F., Tallarini, F., Chierichetti, M., Motta, G., Azzari, S., Colombo, R., Rech, R., Pelosi, P., Raimondi, F., & Gattinoni, L. (2007). Effect of different cycling-off criteria and positive end-expiratory pressure during pressure support ventilation in patients with chronic obstructive pulmonary disease. *Critical Care Medicine, 35*(11), 2547-2552. [https://doi.org/10.1097/01.ccm.0000287594.80110.34](https://doi.org/10.1097/01.ccm.0000287594.80110.34)
- Colombo, D., Cammarota, G., Alemani, M., Carenzo, L., Barra, F. L., Vaschetto, R., Slutsky, A. S., Della Corte, F., & Navalesi, P. (2011). Efficacy of ventilator waveforms observation in detecting patient-ventilator asynchrony. *Critical Care Medicine, 39*(11), 2452-2457. [https://doi.org/10.1097/CCM.0b013e318225753c](https://doi.org/10.1097/CCM.0b013e318225753c)
- de Wit, M., Miller, K. B., Green, D. A., Ostman, H. E., Gennings, C., & Epstein, S. K. (2009). Ineffective triggering predicts increased duration of mechanical ventilation. *Critical Care Medicine, 37*(10), 2740-2745. [https://doi.org/10.1097/ccm.0b013e3181a98a05](https://doi.org/10.1097/ccm.0b013e3181a98a05)
- Gentile, M. A. (2011). Cycling of the mechanical ventilator breath. *Respiratory Care, 56*(1), 52-60. [https://doi.org/10.4187/respcare.01088](https://doi.org/10.4187/respcare.01088)
- Georgopoulos, D., Prinianakis, G., & Kondili, E. (2006). Bedside waveforms interpretation as a tool to identify patient-ventilator asynchronies. *Intensive Care Medicine, 32*(1), 34-47. [https://doi.org/10.1007/s00134-005-2828-5](https://doi.org/10.1007/s00134-005-2828-5)
- Gilstrap, D., & MacIntyre, N. (2013). Patient-ventilator interactions. Implications for clinical management. *American Journal of Respiratory and Critical Care Medicine, 188*(9), 1058-1068. [https://doi.org/10.1164/rccm.201212-2214CI](https://doi.org/10.1164/rccm.201212-2214CI)
- Holanda, M. A., Vasconcelos, R. D. S., Ferreira, J. C., & Pinheiro, B. V. (2018). Patient-ventilator asynchrony. *Jornal Brasileiro de Pneumologia, 44*(4), 321-333. [https://doi.org/10.1590/S1806-37562017000000185](https://doi.org/10.1590/S1806-37562017000000185)
- Imanaka, H., Nishimura, M., Takeuchi, M., Kimball, W. R., Yahagi, N., & Kumon, K. (2000). Autotriggering caused by cardiogenic oscillation during flow-triggered mechanical ventilation. *Critical Care Medicine, 28*(2), 402-407. [https://doi.org/10.1097/00003246-200002000-00019](https://doi.org/10.1097/00003246-200002000-00019)
- Leung, P., Jubran, A., & Tobin, M. J. (1997). Comparison of assisted ventilator modes on triggering, patient effort, and dyspnea. *American Journal of Respiratory and Critical Care Medicine, 155*(6), 1940-1948. [https://doi.org/10.1164/ajrccm.155.6.9196100](https://doi.org/10.1164/ajrccm.155.6.9196100)
- MacIntyre, N. R., McConnell, R., Cheng, K. C., & Sane, A. (1997). Patient-ventilator flow dyssynchrony: Flow-limited versus pressure-limited breaths. *Critical Care Medicine, 25*(10), 1671-1677. [https://doi.org/10.1097/00003246-199710000-00016](https://doi.org/10.1097/00003246-199710000-00016)
- Pohlman, M. C., McCallister, K. E., Schweickert, W. D., Pohlman, A. S., Nigos, C. P., Krishnan, J. A., Charbeneau, J. T., Gehlbach, B. K., Kress, J. P., & Hall, J. B. (2008). Excessive tidal volume from breath stacking during lung-protective ventilation for acute lung injury. *Critical Care Medicine, 36*(11), 3019-3023. [https://doi.org/10.1097/CCM.0b013e31818b308b](https://doi.org/10.1097/CCM.0b013e31818b308b)
- Tassaux, D., Gainnier, M., Battisti, A., & Jolliet, P. (2005). Impact of expiratory trigger setting on delayed cycling and inspiratory muscle workload. *American Journal of Respiratory and Critical Care Medicine, 172*(10), 1283-1289. [https://doi.org/10.1164/rccm.200407-880OC](https://doi.org/10.1164/rccm.200407-880OC)
- Thille, A. W., Cabello, B., Galia, F., Lyazidi, A., & Brochard, L. (2008). Reduction of patient-ventilator asynchrony by reducing tidal volume during pressure-support ventilation. *Intensive Care Medicine, 34*(8), 1477-1486. [https://doi.org/10.1007/s00134-008-1121-9](https://doi.org/10.1007/s00134-008-1121-9)
- Thille, A. W., Rodriguez, P., Cabello, B., Lellouche, F., & Brochard, L. (2006). Patient-ventilator asynchrony during assisted mechanical ventilation. *Intensive Care Medicine, 32*(10), 1515-1522. [https://doi.org/10.1007/s00134-006-0301-8](https://doi.org/10.1007/s00134-006-0301-8)

</details>

### 6. Gasometría arterial

Id: `9c1342e4-4917-5eb8-8233-44733fca56b3`. Interpretación sistemática del equilibrio ácido-base y su relación con los ajustes del ventilador.

**Interpretación sistemática del equilibrio ácido-base** — `62feb82c-7fa5-55af-9a8e-7aed7b320e70` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar el trastorno ácido-base primario a partir de pH, PaCO₂ y HCO₃⁻
- Calcular la compensación esperada con la fórmula de Winter y las reglas de compensación respiratoria y metabólica
- Distinguir un trastorno respiratorio agudo de uno crónico según la respuesta del bicarbonato
- Calcular e interpretar el anión gap corregido por albúmina y el delta ratio
- Justificar la presencia de un trastorno mixto cuando la compensación medida no coincide con la esperada

Páginas: El equilibrio ácido-base y sus dos reguladores · Un método sistemático en seis pasos · Fórmulas: compensación esperada, anión gap y delta ratio · Aplicación clínica: acidosis en el shock séptico · Síntesis.

**Gasometría y ajustes del ventilador** — `cc69882c-a2ec-59b9-8677-c05c44fdcaed` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Interpretar el cociente PaO₂/FiO₂ y clasificar la gravedad de la hipoxemia según la definición de Berlín y la definición global
- Seleccionar la palanca del ventilador adecuada para corregir un problema de oxigenación o de ventilación
- Calcular la frecuencia respiratoria o el volumen corriente necesarios para alcanzar una PaCO₂ objetivo
- Aplicar los límites de pH de la hipercapnia permisiva y reconocer sus contraindicaciones
- Justificar cuándo una gasometría venosa no sustituye a la arterial

Páginas: Oxigenación: PaO₂/FiO₂ y metas · Fórmulas: cómo corregir la PaCO₂ con la ventilación · Hipercapnia permisiva y gasometría venosa · Aplicación clínica: SDRA con acidosis respiratoria · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Adrogué, H. J., & Madias, N. E. (2010). Secondary responses to altered acid-base status: The rules of engagement. *Journal of the American Society of Nephrology, 21*(6), 920–923. [https://doi.org/10.1681/ASN.2009121211](https://doi.org/10.1681/ASN.2009121211)
- Albert, M. S., Dell, R. B., & Winters, R. W. (1967). Quantitative displacement of acid-base equilibrium in metabolic acidosis. *Annals of Internal Medicine, 66*(2), 312–322. [https://doi.org/10.7326/0003-4819-66-2-312](https://doi.org/10.7326/0003-4819-66-2-312)
- ARDS Definition Task Force. (2012). Acute respiratory distress syndrome: The Berlin Definition. *JAMA, 307*(23), 2526–2533. [https://doi.org/10.1001/jama.2012.5669](https://doi.org/10.1001/jama.2012.5669)
- Berend, K., de Vries, A. P. J., & Gans, R. O. B. (2014). Physiological approach to assessment of acid–base disturbances. *New England Journal of Medicine, 371*(15), 1434–1445. [https://doi.org/10.1056/NEJMra1003327](https://doi.org/10.1056/NEJMra1003327)
- Byrne, A. L., Bennett, M., Chatterji, R., Symons, R., Pace, N. L., & Thomas, P. S. (2014). Peripheral venous and arterial blood gas analysis in adults: Are they comparable? A systematic review and meta-analysis. *Respirology, 19*(2), 168–175. [https://doi.org/10.1111/resp.12225](https://doi.org/10.1111/resp.12225)
- Figge, J., Jabor, A., Kazda, A., & Fencl, V. (1998). Anion gap and hypoalbuminemia. *Critical Care Medicine, 26*(11), 1807–1810. [https://doi.org/10.1097/00003246-199811000-00019](https://doi.org/10.1097/00003246-199811000-00019)
- Kraut, J. A., & Madias, N. E. (2007). Serum anion gap: Its uses and limitations in clinical medicine. *Clinical Journal of the American Society of Nephrology, 2*(1), 162–174. [https://doi.org/10.2215/CJN.03020906](https://doi.org/10.2215/CJN.03020906)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., Calfee, C. S., Combes, A., et al. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37–47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- Nin, N., Muriel, A., Peñuelas, O., Brochard, L., Lorente, J. A., Ferguson, N. D., Raymondos, K., Ríos, F., et al. (2017). Severe hypercapnia and outcome of mechanically ventilated patients with moderate or severe acute respiratory distress syndrome. *Intensive Care Medicine, 43*(2), 200–208. [https://doi.org/10.1007/s00134-016-4611-1](https://doi.org/10.1007/s00134-016-4611-1)
- Robba, C., Poole, D., McNett, M., Asehnoune, K., Bösel, J., Bruder, N., Chieregato, A., Cinotti, R., et al. (2020). Mechanical ventilation in patients with acute brain injury: Recommendations of the European Society of Intensive Care Medicine consensus. *Intensive Care Medicine, 46*(12), 2397–2410. [https://doi.org/10.1007/s00134-020-06283-0](https://doi.org/10.1007/s00134-020-06283-0)
- Schjørring, O. L., Klitgaard, T. L., Perner, A., Wetterslev, J., Lange, T., Siegemund, M., Bäcklund, M., Keus, F., et al. (2021). Lower or higher oxygenation targets for acute hypoxemic respiratory failure. *New England Journal of Medicine, 384*(14), 1301–1311. [https://doi.org/10.1056/NEJMoa2032510](https://doi.org/10.1056/NEJMoa2032510)
- Tucker, A. M., & Johnson, T. N. (2025). Breathing and balance: Clinical insights and management strategies of respiratory acid-base disorders. *Nutrition in Clinical Practice, 40*(4), 774–792. [https://doi.org/10.1002/ncp.11328](https://doi.org/10.1002/ncp.11328)
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.

</details>

### 7. Oxigenación y PEEP

Id: `module-02-peep-optimizar-oxigenacion` (id de julio conservado). Fisiología de la PEEP e índices de oxigenación.

**PEEP: fisiología, beneficios y riesgos** — `lesson-peep-optimizar-oxigenacion` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Explicar cómo la PEEP aumenta el volumen pulmonar al final de la espiración y reduce el cortocircuito intrapulmonar.
- Diferenciar la PEEP extrínseca de la intrínseca y medir la PEEP total con una pausa espiratoria.
- Calcular la presión de distensión y la compliance usando la PEEP total.
- Interpretar la respuesta de la presión meseta a un cambio de PEEP para distinguir reclutamiento de sobredistensión.
- Identificar los efectos hemodinámicos de la PEEP sobre el retorno venoso y la poscarga del ventrículo derecho.

Páginas: PEEP: qué es y por qué mejora la oxigenación · PEEP extrínseca, PEEP intrínseca y cálculos básicos · Efectos hemodinámicos, sobredistensión y evidencia · Aplicación clínica · Síntesis.

**Índices de oxigenación y ajuste de FiO₂ y PEEP** — `59c9d7ee-c60d-576e-ba9b-09ad62ce1802` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Calcular PaO₂/FiO₂, SpO₂/FiO₂, índice de oxigenación e índice de saturación de oxígeno.
- Clasificar la gravedad de la hipoxemia según la definición global de SDRA, incluida la corrección por altitud.
- Interpretar las tablas FiO₂/PEEP de la red ARDS como punto de partida del ajuste.
- Seleccionar una meta de SpO₂ o PaO₂ adecuada al contexto clínico.
- Justificar cuándo confirmar la pulsioximetría con gasometría arterial.

Páginas: Medir la oxigenación: por qué no basta con la PaO₂ · Fórmulas y cálculo · Tablas FiO₂/PEEP y metas de oxigenación · Aplicación clínica · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Brower, R. G., Lanken, P. N., MacIntyre, N., Matthay, M. A., Morris, A., Ancukiewicz, M., Schoenfeld, D., & Thompson, B. T. (2004). Higher versus lower positive end-expiratory pressures in patients with the acute respiratory distress syndrome. *New England Journal of Medicine, 351*(4), 327-336. [https://doi.org/10.1056/NEJMoa032193](https://doi.org/10.1056/NEJMoa032193)
- Emeriaud, G., López-Fernández, Y. M., Iyer, N. P., Bembea, M. M., Agulnik, A., Barbaro, R. P., et al. (2023). Executive summary of the Second International Guidelines for the Diagnosis and Management of Pediatric Acute Respiratory Distress Syndrome (PALICC-2). *Pediatric Critical Care Medicine, 24*(2), 143-168. [https://doi.org/10.1097/PCC.0000000000003147](https://doi.org/10.1097/PCC.0000000000003147)
- Gattinoni, L., Caironi, P., Cressoni, M., Chiumello, D., Ranieri, V. M., Quintel, M., Russo, S., Patroniti, N., Cornejo, R., & Bugedo, G. (2006). Lung recruitment in patients with the acute respiratory distress syndrome. *New England Journal of Medicine, 354*(17), 1775-1786. [https://doi.org/10.1056/NEJMoa052052](https://doi.org/10.1056/NEJMoa052052)
- Gattinoni, L., Carlesso, E., & Cressoni, M. (2015). Selecting the 'right' positive end-expiratory pressure level. *Current Opinion in Critical Care, 21*(1), 50-57. [https://doi.org/10.1097/MCC.0000000000000166](https://doi.org/10.1097/MCC.0000000000000166)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., et al. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., et al. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37-47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary*. [https://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](https://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- O'Driscoll, B. R., Howard, L. S., Earis, J., & Mak, V. (2017). BTS guideline for oxygen use in adults in healthcare and emergency settings. *Thorax, 72*(Suppl. 1), ii1-ii90. [https://doi.org/10.1136/thoraxjnl-2016-209729](https://doi.org/10.1136/thoraxjnl-2016-209729)
- Pinsky, M. R. (2018). Cardiopulmonary interactions: Physiologic basis and clinical applications. *Annals of the American Thoracic Society, 15*(Suppl. 1), S45-S48. [https://doi.org/10.1513/AnnalsATS.201704-339FR](https://doi.org/10.1513/AnnalsATS.201704-339FR)
- Rice, T. W., Wheeler, A. P., Bernard, G. R., Hayden, D. L., Schoenfeld, D. A., & Ware, L. B. (2007). Comparison of the SpO₂/FiO₂ ratio and the PaO₂/FiO₂ ratio in patients with acute lung injury or ARDS. *Chest, 132*(2), 410-417. [https://doi.org/10.1378/chest.07-0617](https://doi.org/10.1378/chest.07-0617)
- Schjørring, O. L., Klitgaard, T. L., Perner, A., Wetterslev, J., Lange, T., Siegemund, M., et al. (2021). Lower or higher oxygenation targets for acute hypoxemic respiratory failure. *New England Journal of Medicine, 384*(14), 1301-1311. [https://doi.org/10.1056/NEJMoa2032510](https://doi.org/10.1056/NEJMoa2032510)
- Sjoding, M. W., Dickson, R. P., Iwashyna, T. J., Gay, S. E., & Valley, T. S. (2020). Racial bias in pulse oximetry measurement. *New England Journal of Medicine, 383*(25), 2477-2478. [https://doi.org/10.1056/NEJMc2029240](https://doi.org/10.1056/NEJMc2029240)
- Tobin, M. J. (Ed.). (2013). *Principles and practice of mechanical ventilation* (3rd ed.). McGraw-Hill.
- West, J. B., & Luks, A. M. (2021). *West's respiratory physiology: The essentials* (11th ed.). Wolters Kluwer.

</details>

### 8. Destete y prueba de ventilación espontánea

Id: `module-06-avanzado-evaluacion-destete` (id de julio conservado). Preparación para el destete, prueba de ventilación espontánea y extubación.

**Preparación para el destete** — `lesson-avanzado-evaluacion-destete` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Identificar los criterios de preparación para una prueba de ventilación espontánea en sus cinco dominios.
- Justificar la combinación diaria de la prueba de despertar con la prueba de ventilación espontánea.
- Calcular e interpretar el índice de respiración rápida superficial y reconocer sus limitaciones.
- Clasificar el destete como simple, difícil o prolongado según el consenso de 2007 y el estudio WIND.

Páginas: El destete como proceso · Criterios de preparación y sedación · Índice de respiración rápida superficial · Aplicación clínica · Síntesis.

**Prueba de ventilación espontánea y extubación** — `527b41e6-73bf-5f43-88d0-425959a95ec1` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Comparar la prueba con tubo en T, CPAP y presión de soporte baja según su fisiología y la evidencia.
- Reconocer los criterios objetivos y clínicos de fracaso de la prueba y actuar ante ellos.
- Calcular el volumen de fuga del balón e interpretar el riesgo de estridor postextubación.
- Planificar la extubación y la vigilancia posterior, incluida la ventilación no invasiva preventiva en pacientes de alto riesgo.

Páginas: La prueba de ventilación espontánea · Duración, vigilancia y criterios de fracaso · Vía aérea, prueba de fuga y extubación · Aplicación clínica · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Béduneau, G., Pham, T., Schortgen, F., Piquilloud, L., Zogheib, E., Jonas, M., et al. (2017). Epidemiology of weaning outcome according to a new definition. The WIND study. *American Journal of Respiratory and Critical Care Medicine, 195*(6), 772-783. [https://doi.org/10.1164/rccm.201602-0320OC](https://doi.org/10.1164/rccm.201602-0320OC)
- Boles, J. M., Bion, J., Connors, A., Herridge, M., Marsh, B., Melot, C., Pearl, R., Silverman, H., Stanchina, M., Vieillard-Baron, A., & Welte, T. (2007). Weaning from mechanical ventilation. *European Respiratory Journal, 29*(5), 1033-1056. [https://doi.org/10.1183/09031936.00010206](https://doi.org/10.1183/09031936.00010206)
- Esteban, A., Alía, I., Gordo, F., Fernández, R., Solsona, J. F., Vallverdú, I., et al. (1997). Extubation outcome after spontaneous breathing trials with T-tube or pressure support ventilation. *American Journal of Respiratory and Critical Care Medicine, 156*(2), 459-465. [https://doi.org/10.1164/ajrccm.156.2.9610109](https://doi.org/10.1164/ajrccm.156.2.9610109)
- Esteban, A., Alía, I., Tobin, M. J., Gil, A., Gordo, F., Vallverdú, I., et al. (1999). Effect of spontaneous breathing trial duration on outcome of attempts to discontinue mechanical ventilation. *American Journal of Respiratory and Critical Care Medicine, 159*(2), 512-518. [https://doi.org/10.1164/ajrccm.159.2.9803106](https://doi.org/10.1164/ajrccm.159.2.9803106)
- Girard, T. D., Kress, J. P., Fuchs, B. D., Thomason, J. W., Schweickert, W. D., Pun, B. T., et al. (2008). Efficacy and safety of a paired sedation and ventilator weaning protocol for mechanically ventilated patients in intensive care (Awakening and Breathing Controlled trial): A randomised controlled trial. *The Lancet, 371*(9607), 126-134. [https://doi.org/10.1016/S0140-6736(08)60105-1](https://doi.org/10.1016/S0140-6736(08)60105-1)
- Kress, J. P., Pohlman, A. S., O'Connor, M. F., & Hall, J. B. (2000). Daily interruption of sedative infusions in critically ill patients undergoing mechanical ventilation. *New England Journal of Medicine, 342*(20), 1471-1477. [https://doi.org/10.1056/NEJM200005183422002](https://doi.org/10.1056/NEJM200005183422002)
- Miller, R. L., & Cole, R. P. (1996). Association between reduced cuff leak volume and postextubation stridor. *Chest, 110*(4), 1035-1040. [https://doi.org/10.1378/chest.110.4.1035](https://doi.org/10.1378/chest.110.4.1035)
- NHLBI ARDS Clinical Network. (2008). *Mechanical ventilation protocol summary*. [https://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](https://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Schmidt, G. A., Girard, T. D., Kress, J. P., Morris, P. E., Ouellette, D. R., Alhazzani, W., et al. (2017). Official executive summary of an American Thoracic Society/American College of Chest Physicians clinical practice guideline: Liberation from mechanical ventilation in critically ill adults. *American Journal of Respiratory and Critical Care Medicine, 195*(1), 115-119. [https://doi.org/10.1164/rccm.201610-2076ST](https://doi.org/10.1164/rccm.201610-2076ST)
- Subirà, C., Hernández, G., Vázquez, A., Rodríguez-García, R., González-Castro, A., García, C., et al. (2019). Effect of pressure support vs T-piece ventilation strategies during spontaneous breathing trials on successful extubation among patients receiving mechanical ventilation: A randomized clinical trial. *JAMA, 321*(22), 2175-2182. [https://doi.org/10.1001/jama.2019.7234](https://doi.org/10.1001/jama.2019.7234)
- Tanios, M. A., Nevins, M. L., Hendra, K. P., Cardinal, P., Allan, J. E., Naumova, E. N., & Epstein, S. K. (2006). A randomized, controlled trial of the role of weaning predictors in clinical decision making. *Critical Care Medicine, 34*(10), 2530-2535. [https://doi.org/10.1097/01.CCM.0000236546.98861.25](https://doi.org/10.1097/01.CCM.0000236546.98861.25)
- Thille, A. W., Gacouin, A., Coudroy, R., Ehrmann, S., Quenot, J. P., Nay, M. A., et al. (2022). Spontaneous-breathing trials with pressure-support ventilation or a T-piece. *New England Journal of Medicine, 387*(20), 1843-1854. [https://doi.org/10.1056/NEJMoa2209041](https://doi.org/10.1056/NEJMoa2209041)
- Yang, K. L., & Tobin, M. J. (1991). A prospective study of indexes predicting the outcome of trials of weaning from mechanical ventilation. *New England Journal of Medicine, 324*(21), 1445-1450. [https://doi.org/10.1056/NEJM199105233242101](https://doi.org/10.1056/NEJM199105233242101)

</details>

## Track Mecánica ventilatoria · Nivel Avanzado

Id del nivel: `level-avanzado`. VILI, SDRA, reclutamiento, prono, mecánica avanzada, enfermedad obstructiva, asincronías complejas, destete difícil y casos integradores. Requiere completar `level-intermedio`. Los módulos se desbloquean en orden.

### 1. VILI y ventilación protectora

Id: `module-01-vili-ventilacion-protectora` (id de julio conservado). Mecanismos de lesión inducida por el ventilador y estrategia protectora.

**Mecanismos de la lesión inducida por el ventilador** — `lesson-vili-ventilacion-protectora` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar los mecanismos de la VILI (volutrauma, atelectrauma, barotrauma, biotrauma, ergotrauma y P-SILI) y su base fisiológica
- Calcular el strain y estimar el stress pulmonar a partir del volumen insuflado, el volumen aireado y la elastancia específica
- Interpretar la compliance baja del SDRA según el concepto de baby lung
- Justificar por qué cumplir 6 mL/kg y una meseta de 30 cmH₂O no garantiza la ausencia de lesión
- Distinguir la evidencia experimental firme de las hipótesis sin umbral clínico validado

Páginas: Qué es la lesión inducida por el ventilador · Stress, strain y baby lung · De los experimentos a la práctica clínica · Aplicación clínica · Síntesis.

**Ventilación protectora: volumen corriente, presión meseta y driving pressure** — `93a148ca-735f-565c-92ec-1323cac8188c` · 6 páginas · 45 min

Objetivos de aprendizaje:

- Calcular el peso corporal predicho y el volumen corriente de 4 a 8 mL/kg PBW
- Medir e interpretar la presión pico, la presión meseta y la driving pressure con pausa inspiratoria
- Aplicar los pasos del protocolo ARDSNet para ajustar volumen, frecuencia y meta de pH
- Comparar las recomendaciones de ATS y ESICM sobre volumen, meseta y driving pressure con su fuerza y certeza
- Justificar la ventilación protectora en cirugía y en pacientes de UCI sin SDRA según la evidencia disponible

Páginas: Fundamentos de la ventilación protectora · Fórmulas y cálculo · Driving pressure y recomendaciones actuales · Protección en pulmones sin SDRA · Aplicación clínica · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network, Brower, R. G., Matthay, M. A., Morris, A., Schoenfeld, D., Thompson, B. T., & Wheeler, A. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J. C., Carvalho, C. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network. (2008). *NIH NHLBI ARDS Clinical Network mechanical ventilation protocol summary*. National Heart, Lung, and Blood Institute. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Brochard, L., Slutsky, A., & Pesenti, A. (2017). Mechanical ventilation to minimize progression of lung injury in acute respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 195*(4), 438-442. [https://doi.org/10.1164/rccm.201605-1081CP](https://doi.org/10.1164/rccm.201605-1081CP)
- Chiumello, D., Carlesso, E., Cadringher, P., Caironi, P., Valenza, F., Polli, F., Tallarini, F., Cozzi, P., Cressoni, M., Colombo, A., Marini, J. J., & Gattinoni, L. (2008). Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 178*(4), 346-355. [https://doi.org/10.1164/rccm.200710-1589OC](https://doi.org/10.1164/rccm.200710-1589OC)
- Dreyfuss, D., Soler, P., Basset, G., & Saumon, G. (1988). High inflation pressure pulmonary edema: Respective effects of high airway pressure, high tidal volume, and positive end-expiratory pressure. *American Review of Respiratory Disease, 137*(5), 1159-1164. [https://doi.org/10.1164/ajrccm/137.5.1159](https://doi.org/10.1164/ajrccm/137.5.1159)
- Futier, E., Constantin, J. M., Paugam-Burtz, C., Pascal, J., Eurin, M., Neuschwander, A., ... Jaber, S. (2013). A trial of intraoperative low-tidal-volume ventilation in abdominal surgery. *New England Journal of Medicine, 369*(5), 428-437. [https://doi.org/10.1056/NEJMoa1301082](https://doi.org/10.1056/NEJMoa1301082)
- Gattinoni, L., & Pesenti, A. (2005). The concept of "baby lung". *Intensive Care Medicine, 31*(6), 776-784. [https://doi.org/10.1007/s00134-005-2627-z](https://doi.org/10.1007/s00134-005-2627-z)
- Gattinoni, L., Tonetti, T., Cressoni, M., Cadringher, P., Herrmann, P., Moerer, O., Protti, A., Gotti, M., Chiurazzi, C., Carlesso, E., Chiumello, D., & Quintel, M. (2016). Ventilator-related causes of lung injury: The mechanical power. *Intensive Care Medicine, 42*(10), 1567-1575. [https://doi.org/10.1007/s00134-016-4505-2](https://doi.org/10.1007/s00134-016-4505-2)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Protti, A., Cressoni, M., Santini, A., Langer, T., Mietto, C., Febres, D., Chierichetti, M., Coppola, S., Conte, G., Gatti, S., Leopardi, O., Masson, S., Lombardi, L., Lazzerini, M., Rampoldi, E., Cadringher, P., & Gattinoni, L. (2011). Lung stress and strain during mechanical ventilation: Any safe threshold? *American Journal of Respiratory and Critical Care Medicine, 183*(10), 1354-1362. [https://doi.org/10.1164/rccm.201010-1757OC](https://doi.org/10.1164/rccm.201010-1757OC)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Ranieri, V. M., Suter, P. M., Tortorella, C., De Tullio, R., Dayer, J. M., Brienza, A., Bruno, F., & Slutsky, A. S. (1999). Effect of mechanical ventilation on inflammatory mediators in patients with acute respiratory distress syndrome: A randomized controlled trial. *JAMA, 282*(1), 54-61. [https://doi.org/10.1001/jama.282.1.54](https://doi.org/10.1001/jama.282.1.54)
- Terragni, P. P., Rosboch, G., Tealdi, A., Corno, E., Menaldo, E., Davini, O., Gandini, G., Herrmann, P., Mascia, L., Quintel, M., Slutsky, A. S., Gattinoni, L., & Ranieri, V. M. (2007). Tidal hyperinflation during low tidal volume ventilation in acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 175*(2), 160-166. [https://doi.org/10.1164/rccm.200607-915OC](https://doi.org/10.1164/rccm.200607-915OC)
- Writing Group for the PReVENT Investigators, Simonis, F. D., Serpa Neto, A., Binnekade, J. M., Braber, A., Bruin, K. C. M., ... Schultz, M. J. (2018). Effect of a low vs intermediate tidal volume strategy on ventilator-free days in intensive care unit patients without ARDS: A randomized clinical trial. *JAMA, 320*(18), 1872-1880. [https://doi.org/10.1001/jama.2018.14280](https://doi.org/10.1001/jama.2018.14280)
- Young, C. C., Harris, E. M., Vacchiano, C., Bodnar, S., Bukowy, B., Elliott, R. R. D., ... Sprung, J. (2019). Lung-protective ventilation for the surgical patient: International expert panel-based consensus recommendations. *British Journal of Anaesthesia, 123*(6), 898-913. [https://doi.org/10.1016/j.bja.2019.08.017](https://doi.org/10.1016/j.bja.2019.08.017)

</details>

### 2. Síndrome de dificultad respiratoria aguda (SDRA)

Id: `module-07-sdra` (id de julio conservado). Definición, fisiopatología, gravedad y manejo ventilatorio escalonado.

**SDRA: definición, fisiopatología y gravedad** — `lesson-sdra` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar los criterios de la definición de Berlín y las ampliaciones de la definición global de 2024
- Calcular PaO₂/FiO₂ y SpO₂/FiO₂, con corrección por altitud, para clasificar la gravedad
- Explicar cómo el daño de la barrera alveolocapilar produce shunt, baby lung y aumento del espacio muerto
- Interpretar los datos epidemiológicos y el concepto de subfenotipos y sus límites actuales

Páginas: Qué es el SDRA: de Berlín a la definición global · Fisiopatología: barrera, edema y baby lung · Gravedad, epidemiología y fenotipos · Aplicación clínica · Síntesis.

**Manejo ventilatorio escalonado del SDRA** — `3d0b2558-62ee-5818-9ee1-08432ad7dd85` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Interpretar la fuerza y la certeza de las recomendaciones de ATS 2017/2024 y ESICM 2023
- Evaluar la respuesta a la PEEP mediante la driving pressure y la compliance
- Justificar la indicación, el momento y la duración del decúbito prono según PROSEVA y las guías
- Comparar la evidencia y las recomendaciones sobre bloqueo neuromuscular y ECMO venovenosa
- Identificar las intervenciones desaconsejadas: reclutamiento prolongado, HFOV rutinaria y ECCO₂R fuera de ensayos

Páginas: La lógica del manejo escalonado · Peldaños 1 y 2: ventilación protectora, PEEP y reclutamiento · Peldaños 2 a 4: prono, bloqueo neuromuscular y ECMO · Aplicación clínica · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- ARDS Definition Task Force, Ranieri, V. M., Rubenfeld, G. D., Thompson, B. T., Ferguson, N. D., Caldwell, E., Fan, E., Camporota, L., & Slutsky, A. S. (2012). Acute respiratory distress syndrome: The Berlin Definition. *JAMA, 307*(23), 2526-2533. [https://doi.org/10.1001/jama.2012.5669](https://doi.org/10.1001/jama.2012.5669)
- Bellani, G., Laffey, J. G., Pham, T., Fan, E., Brochard, L., Esteban, A., ... Pesenti, A. (2016). Epidemiology, patterns of care, and mortality for patients with acute respiratory distress syndrome in intensive care units in 50 countries. *JAMA, 315*(8), 788-800. [https://doi.org/10.1001/jama.2016.0291](https://doi.org/10.1001/jama.2016.0291)
- Calfee, C. S., Delucchi, K., Parsons, P. E., Thompson, B. T., Ware, L. B., & Matthay, M. A. (2014). Subphenotypes in acute respiratory distress syndrome: Latent class analysis of data from two randomised controlled trials. *The Lancet Respiratory Medicine, 2*(8), 611-620. [https://doi.org/10.1016/S2213-2600(14)70097-9](https://doi.org/10.1016/S2213-2600(14)70097-9)
- Combes, A., Hajage, D., Capellier, G., Demoule, A., Lavoué, S., Guervilly, C., ... Mercat, A. (2018). Extracorporeal membrane oxygenation for severe acute respiratory distress syndrome. *New England Journal of Medicine, 378*(21), 1965-1975. [https://doi.org/10.1056/NEJMoa1800385](https://doi.org/10.1056/NEJMoa1800385)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253-1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Gattinoni, L., & Pesenti, A. (2005). The concept of "baby lung". *Intensive Care Medicine, 31*(6), 776-784. [https://doi.org/10.1007/s00134-005-2627-z](https://doi.org/10.1007/s00134-005-2627-z)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Guérin, C., Reignier, J., Richard, J. C., Beuret, P., Gacouin, A., Boulain, T., ... Ayzac, L. (2013). Prone positioning in severe acute respiratory distress syndrome. *New England Journal of Medicine, 368*(23), 2159-2168. [https://doi.org/10.1056/NEJMoa1214103](https://doi.org/10.1056/NEJMoa1214103)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., ... Wick, K. D. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37-47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- National Heart, Lung, and Blood Institute PETAL Clinical Trials Network, Moss, M., Huang, D. T., Brower, R. G., Ferguson, N. D., Ginde, A. A., ... Angus, D. C. (2019). Early neuromuscular blockade in the acute respiratory distress syndrome. *New England Journal of Medicine, 380*(21), 1997-2008. [https://doi.org/10.1056/NEJMoa1901686](https://doi.org/10.1056/NEJMoa1901686)
- Papazian, L., Forel, J. M., Gacouin, A., Penot-Ragon, C., Perrin, G., Loundou, A., ... Roch, A. (2010). Neuromuscular blockers in early acute respiratory distress syndrome. *New England Journal of Medicine, 363*(12), 1107-1116. [https://doi.org/10.1056/NEJMoa1005372](https://doi.org/10.1056/NEJMoa1005372)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Thompson, B. T., Chambers, R. C., & Liu, K. D. (2017). Acute respiratory distress syndrome. *New England Journal of Medicine, 377*(6), 562-572. [https://doi.org/10.1056/NEJMra1608077](https://doi.org/10.1056/NEJMra1608077)
- Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial (ART) Investigators, Cavalcanti, A. B., Suzumura, É. A., Laranjeira, L. N., Paisani, D. M., Damiani, L. P., ... Ribeiro de Carvalho, C. R. (2017). Effect of lung recruitment and titrated positive end-expiratory pressure (PEEP) vs low PEEP on mortality in patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 318*(14), 1335-1345. [https://doi.org/10.1001/jama.2017.14171](https://doi.org/10.1001/jama.2017.14171)

</details>

### 3. Reclutamiento alveolar y titulación de PEEP

Id: `3f6d343e-81c7-544d-a496-af77e7db3c3d`. Reclutabilidad, maniobras de reclutamiento y métodos de titulación de PEEP.

**Maniobras de reclutamiento: fisiología, evidencia y riesgos** — `b92cb403-8cac-5acd-a159-89603f64e909` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Explicar la histéresis de la curva presión-volumen y su relación con la PEEP tras el reclutamiento
- Calcular el volumen reclutado y la relación reclutamiento/insuflación (R/I) a partir de datos del ventilador
- Interpretar los resultados del ensayo ART y su impacto en las guías ESICM 2023 y ATS 2024
- Distinguir una maniobra prolongada de una breve según la definición de las guías
- Justificar ante un caso clínico por qué priorizar medidas de bajo riesgo frente a una maniobra a alta presión

Páginas: Fisiología del colapso y del reclutamiento · Estimar la reclutabilidad: la relación R/I · Técnicas de reclutamiento y lo que dicen los ensayos · Aplicación clínica: ¿reclutar o no reclutar? · Síntesis.

**Métodos de titulación de PEEP** — `b1e89497-c94b-5301-8eaa-316bf097acb7` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar en las tablas FiO₂/PEEP de la red ARDS la PEEP correspondiente a una FiO₂ dada
- Calcular la presión de distensión y la compliance en cada escalón de una prueba decremental
- Interpretar la presión transpulmonar espiratoria obtenida con presión esofágica
- Comparar la evidencia de los ensayos de PEEP alta frente a baja y las recomendaciones discordantes de las guías
- Ajustar la PEEP en un caso clínico integrando mecánica, oxigenación y hemodinamia

Páginas: El dilema de la PEEP: colapso frente a sobredistensión · Métodos de titulación y cálculos · Lo que dice la evidencia · Aplicación clínica: titular la PEEP en un SDRA moderado · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Beitler, J. R., Sarge, T., Banner-Goodspeed, V. M., Gong, M. N., Cook, D., Novack, V., Loring, S. H., Talmor, D., & EPVent-2 Study Group. (2019). Effect of titrating positive end-expiratory pressure (PEEP) with an esophageal pressure-guided strategy vs an empirical high PEEP-FiO₂ strategy on death and days free from mechanical ventilation among patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 321*(9), 846–857. [https://doi.org/10.1001/jama.2019.0555](https://doi.org/10.1001/jama.2019.0555)
- Briel, M., Meade, M., Mercat, A., Brower, R. G., Talmor, D., Walter, S. D., ... Guyatt, G. (2010). Higher vs lower positive end-expiratory pressure in patients with acute lung injury and acute respiratory distress syndrome: Systematic review and meta-analysis. *JAMA, 303*(9), 865–873. [https://doi.org/10.1001/jama.2010.218](https://doi.org/10.1001/jama.2010.218)
- Cavalcanti, A. B., Suzumura, É. A., Laranjeira, L. N., Paisani, D. M., Damiani, L. P., Guimarães, H. P., ... Ribeiro de Carvalho, C. R.; Writing Group for the Alveolar Recruitment for Acute Respiratory Distress Syndrome Trial (ART) Investigators. (2017). Effect of lung recruitment and titrated positive end-expiratory pressure (PEEP) vs low PEEP on mortality in patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 318*(14), 1335–1345. [https://doi.org/10.1001/jama.2017.14171](https://doi.org/10.1001/jama.2017.14171)
- Chen, L., Del Sorbo, L., Grieco, D. L., Junhasavasdikul, D., Rittayamai, N., Soliman, I., Sklar, M. C., Rauseo, M., Ferguson, N. D., Fan, E., Richard, J.-C. M., & Brochard, L. (2020). Potential for lung recruitment estimated by the recruitment-to-inflation ratio in acute respiratory distress syndrome: A clinical trial. *American Journal of Respiratory and Critical Care Medicine, 201*(2), 178–187. [https://doi.org/10.1164/rccm.201902-0334OC](https://doi.org/10.1164/rccm.201902-0334OC)
- Costa, E. L. V., Borges, J. B., Melo, A., Suarez-Sipmann, F., Toufen, C., Bohm, S. H., & Amato, M. B. P. (2009). Bedside estimation of recruitable alveolar collapse and hyperdistension by electrical impedance tomography. *Intensive Care Medicine, 35*(6), 1132–1137. [https://doi.org/10.1007/s00134-009-1447-y](https://doi.org/10.1007/s00134-009-1447-y)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253–1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Gattinoni, L., Caironi, P., Cressoni, M., Chiumello, D., Ranieri, V. M., Quintel, M., Russo, S., Patroniti, N., Cornejo, R., & Bugedo, G. (2006). Lung recruitment in patients with the acute respiratory distress syndrome. *New England Journal of Medicine, 354*(17), 1775–1786. [https://doi.org/10.1056/NEJMoa052052](https://doi.org/10.1056/NEJMoa052052)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... European Society of Intensive Care Medicine Taskforce on ARDS. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Hess, D. R. (2015). Recruitment maneuvers and PEEP titration. *Respiratory Care, 60*(11), 1688–1704. [https://doi.org/10.4187/respcare.04409](https://doi.org/10.4187/respcare.04409)
- NHLBI ARDS Network. (2008). *NIH NHLBI ARDS Clinical Network mechanical ventilation protocol summary* [Protocolo clínico]. National Heart, Lung, and Blood Institute. [http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf](http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24–36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Talmor, D., Sarge, T., Malhotra, A., O'Donnell, C. R., Ritz, R., Lisbon, A., Novack, V., & Loring, S. H. (2008). Mechanical ventilation guided by esophageal pressure in acute lung injury. *New England Journal of Medicine, 359*(20), 2095–2104. [https://doi.org/10.1056/NEJMoa0708638](https://doi.org/10.1056/NEJMoa0708638)

</details>

### 4. Ventilación en decúbito prono

Id: `983c20df-a9c5-5f36-8449-070e213f0893`. Fisiología, indicaciones, técnica y seguridad del decúbito prono.

**Fisiología del decúbito prono** — `e95ba39d-1087-55cd-9655-6a33693fd1d7` · 5 páginas · 35 min

Objetivos de aprendizaje:

- Explicar por qué en prono la reapertura dorsal supera al colapso ventral
- Interpretar el efecto del prono sobre la relación ventilación-perfusión sabiendo que la perfusión sigue siendo dorsal
- Calcular la compliance del sistema respiratorio a partir de las compliances del pulmón y de la pared torácica
- Relacionar la caída de la PaCO₂ y de la presión de distensión con la descarga del ventrículo derecho
- Justificar por qué la respuesta en oxigenación no es el criterio para mantener o abandonar el prono

Páginas: Gravedad, forma del tórax y distribución de la aireación · Estrés, strain y mecánica en prono · Ventrículo derecho y eliminación de CO₂ · Aplicación clínica: interpretar la respuesta al prono · Síntesis.

**Indicaciones, técnica y seguridad del prono** — `356a5700-43b0-567e-971d-a158d9bcfacf` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Identificar a los pacientes candidatos a prono según el ensayo PROSEVA y la guía ESICM 2023
- Reconocer la contraindicación absoluta y las contraindicaciones relativas del prono
- Describir los pasos y funciones del equipo para realizar el giro con seguridad
- Calcular el cambio porcentual de la PaO₂/FiO₂ y aplicar los criterios de suspensión
- Justificar el papel limitado del prono despierto según la evidencia disponible

Páginas: Evidencia e indicaciones · Técnica del giro y cuidados durante la sesión · Complicaciones, seguridad y prono despierto · Aplicación clínica: del criterio a la sesión de prono · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Cornejo, R. A., Díaz, J. C., Tobar, E. A., Bruhn, A. R., Ramos, C. A., González, R. A., ... Pereira, G. L. (2013). Effects of prone positioning on lung protection in patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 188*(4), 440–448. [https://doi.org/10.1164/rccm.201207-1279OC](https://doi.org/10.1164/rccm.201207-1279OC)
- Ehrmann, S., Li, J., Ibarra-Estrada, M., Perez, Y., Pavlov, I., McNicholas, B., ... Kimmoun, A. (2021). Awake prone positioning for COVID-19 acute hypoxaemic respiratory failure: A randomised, controlled, multinational, open-label meta-trial. *The Lancet Respiratory Medicine, 9*(12), 1387–1395. [https://doi.org/10.1016/S2213-2600(21)00356-8](https://doi.org/10.1016/S2213-2600(21)00356-8)
- Fan, E., Del Sorbo, L., Goligher, E. C., Hodgson, C. L., Munshi, L., Walkey, A. J., ... Brochard, L. J. (2017). An official American Thoracic Society/European Society of Intensive Care Medicine/Society of Critical Care Medicine clinical practice guideline: Mechanical ventilation in adult patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 195*(9), 1253–1263. [https://doi.org/10.1164/rccm.201703-0548ST](https://doi.org/10.1164/rccm.201703-0548ST)
- Gattinoni, L., Taccone, P., Carlesso, E., & Marini, J. J. (2013). Prone position in acute respiratory distress syndrome: Rationale, indications, and limits. *American Journal of Respiratory and Critical Care Medicine, 188*(11), 1286–1293. [https://doi.org/10.1164/rccm.201308-1532CI](https://doi.org/10.1164/rccm.201308-1532CI)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., ... European Society of Intensive Care Medicine Taskforce on ARDS. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727–759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Guérin, C., Albert, R. K., Beitler, J., Gattinoni, L., Jaber, S., Marini, J. J., Munshi, L., Papazian, L., Pesenti, A., Vieillard-Baron, A., & Mancebo, J. (2020). Prone position in ARDS patients: Why, when, how and for whom. *Intensive Care Medicine, 46*(12), 2385–2396. [https://doi.org/10.1007/s00134-020-06306-w](https://doi.org/10.1007/s00134-020-06306-w)
- Guérin, C., Reignier, J., Richard, J.-C., Beuret, P., Gacouin, A., Boulain, T., ... Ayzac, L.; PROSEVA Study Group. (2013). Prone positioning in severe acute respiratory distress syndrome. *New England Journal of Medicine, 368*(23), 2159–2168. [https://doi.org/10.1056/NEJMoa1214103](https://doi.org/10.1056/NEJMoa1214103)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., ... Wick, K. D. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37–47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- Munshi, L., Del Sorbo, L., Adhikari, N. K. J., Hodgson, C. L., Wunsch, H., Meade, M. O., Uleryk, E., Mancebo, J., Pesenti, A., Ranieri, V. M., & Fan, E. (2017). Prone position for acute respiratory distress syndrome: A systematic review and meta-analysis. *Annals of the American Thoracic Society, 14*(Suppl. 4), S280–S288. [https://doi.org/10.1513/AnnalsATS.201704-343OT](https://doi.org/10.1513/AnnalsATS.201704-343OT)
- Vieillard-Baron, A., Charron, C., Caille, V., Belliard, G., Page, B., & Jardin, F. (2007). Prone positioning unloads the right ventricle in severe ARDS. *Chest, 132*(5), 1440–1446. [https://doi.org/10.1378/chest.07-1013](https://doi.org/10.1378/chest.07-1013)

</details>

### 5. Mecánica avanzada: driving pressure, potencia mecánica y auto-PEEP

Id: `module-02-monitorizacion-alto-nivel` (id de julio conservado). Driving pressure, potencia mecánica, hiperinflación dinámica y presión transpulmonar.

**Driving pressure y potencia mecánica** — `lesson-monitorizacion-alto-nivel` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Calcular la driving pressure y la compliance a partir de la presión meseta y la PEEP total.
- Interpretar la driving pressure como el volumen corriente normalizado por el pulmón aireado disponible.
- Calcular la potencia mecánica en VCV con la fórmula simplificada y el índice 4·ΔP + FR.
- Ajustar el volumen corriente o la PEEP según la respuesta de la driving pressure en un paciente con SDRA.
- Justificar los límites de la evidencia observacional sobre driving pressure y potencia mecánica.

Páginas: Driving pressure: el volumen corriente visto desde el pulmón que queda · Potencia mecánica: fórmulas y cálculo · Aplicación clínica: SDRA con driving pressure elevada · Límites de la driving pressure y la potencia mecánica · Síntesis.

**Auto-PEEP e hiperinflación dinámica** — `5f8e4ef1-5ae0-54a5-87ab-6b46fffa8236` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Explicar el mecanismo de la auto-PEEP a partir del tiempo espiratorio, la constante de tiempo y la limitación del flujo.
- Identificar el atrapamiento aéreo en la curva de flujo-tiempo.
- Calcular la auto-PEEP con una pausa espiratoria y estimar el volumen atrapado en un modelo simple.
- Interpretar sus efectos hemodinámicos y su papel en los esfuerzos ineficaces.
- Ajustar frecuencia, volumen, flujo inspiratorio y PEEP externa para reducir la hiperinflación.

Páginas: Mecanismo: cuando la espiración no termina · Medición y cálculo de la auto-PEEP · Consecuencias y estrategias de manejo · Aplicación clínica: EPOC con hipotensión tras la intubación · Síntesis.

**Presión esofágica y presión transpulmonar** — `f4b8ba6a-462d-56ac-89c5-4d90afe2222d` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Describir la técnica de medición de la presión esofágica y su validación con la prueba de oclusión.
- Calcular la presión transpulmonar espiratoria e inspiratoria por el método directo y el derivado de elastancias.
- Interpretar qué región pulmonar representa cada método de presión transpulmonar.
- Justificar la titulación de PEEP con presión transpulmonar en un paciente con obesidad.
- Evaluar la evidencia de los ensayos EPVent y EPVent-2 y la posición de las guías de la ESICM de 2023.

Páginas: Pulmón y pared torácica: dos resortes en serie · Técnica de medición y cálculos · Aplicación clínica: titulación de PEEP en un paciente con obesidad · Evidencia clínica y errores frecuentes · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Akoumianaki, E., Maggiore, S. M., Valenza, F., Bellani, G., Jubran, A., Loring, S. H., Pelosi, P., Talmor, D., Grasso, S., Chiumello, D., Guérin, C., Patroniti, N., Ranieri, V. M., Gattinoni, L., Nava, S., Terragni, P.-P., Pesenti, A., Tobin, M., Mancebo, J., & Brochard, L. (2014). The application of esophageal pressure measurement in patients with respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 189*(5), 520-531. [https://doi.org/10.1164/rccm.201312-2193CI](https://doi.org/10.1164/rccm.201312-2193CI)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Baydur, A., Behrakis, P. K., Zin, W. A., Jaeger, M., & Milic-Emili, J. (1982). A simple method for assessing the validity of the esophageal balloon technique. *American Review of Respiratory Disease, 126*(5), 788-791. [https://doi.org/10.1164/arrd.1982.126.5.788](https://doi.org/10.1164/arrd.1982.126.5.788)
- Beitler, J. R., Sarge, T., Banner-Goodspeed, V. M., Gong, M. N., Cook, D., Novack, V., Loring, S. H., & Talmor, D. (2019). Effect of titrating positive end-expiratory pressure (PEEP) with an esophageal pressure-guided strategy vs an empirical high PEEP-FiO₂ strategy on death and days free from mechanical ventilation among patients with acute respiratory distress syndrome: A randomized clinical trial. *JAMA, 321*(9), 846-857. [https://doi.org/10.1001/jama.2019.0555](https://doi.org/10.1001/jama.2019.0555)
- Blanch, L., Bernabé, F., & Lucangelo, U. (2005). Measurement of air trapping, intrinsic positive end-expiratory pressure, and dynamic hyperinflation in mechanically ventilated patients. *Respiratory Care, 50*(1), 110-124. [https://doi.org/10.4187/respcare.05500110](https://doi.org/10.4187/respcare.05500110)
- Bugedo, G., Retamal, J., & Bruhn, A. (2017). Driving pressure: A marker of severity, a safety limit, or a goal for mechanical ventilation? *Critical Care, 21*, 199. [https://doi.org/10.1186/s13054-017-1779-x](https://doi.org/10.1186/s13054-017-1779-x)
- Chiumello, D., Gotti, M., Guanziroli, M., Formenti, P., Umbrello, M., Pasticci, I., Mistraletti, G., & Busana, M. (2020). Bedside calculation of mechanical power during volume- and pressure-controlled mechanical ventilation. *Critical Care, 24*, 417. [https://doi.org/10.1186/s13054-020-03116-w](https://doi.org/10.1186/s13054-020-03116-w)
- Costa, E. L. V., Slutsky, A. S., Brochard, L. J., Brower, R., Serpa-Neto, A., Cavalcanti, A. B., Mercat, A., Meade, M., Morais, C. C. A., Goligher, E., Carvalho, C. R. R., & Amato, M. B. P. (2021). Ventilatory variables and mechanical power in patients with acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 204*(3), 303-311. [https://doi.org/10.1164/rccm.202009-3467OC](https://doi.org/10.1164/rccm.202009-3467OC)
- Gattinoni, L., Tonetti, T., Cressoni, M., Cadringher, P., Herrmann, P., Moerer, O., Protti, A., Gotti, M., Chiurazzi, C., Carlesso, E., Chiumello, D., & Quintel, M. (2016). Ventilator-related causes of lung injury: The mechanical power. *Intensive Care Medicine, 42*(10), 1567-1575. [https://doi.org/10.1007/s00134-016-4505-2](https://doi.org/10.1007/s00134-016-4505-2)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Guérin, C., Milic-Emili, J., & Fournier, G. (2000). Effect of PEEP on work of breathing in mechanically ventilated COPD patients. *Intensive Care Medicine, 26*(9), 1207-1214. [https://doi.org/10.1007/s001340051339](https://doi.org/10.1007/s001340051339)
- Marini, J. J. (2011). Dynamic hyperinflation and auto-positive end-expiratory pressure: Lessons learned over 30 years. *American Journal of Respiratory and Critical Care Medicine, 184*(7), 756-762. [https://doi.org/10.1164/rccm.201102-0226PP](https://doi.org/10.1164/rccm.201102-0226PP)
- Pepe, P. E., & Marini, J. J. (1982). Occult positive end-expiratory pressure in mechanically ventilated patients with airflow obstruction: The auto-PEEP effect. *American Review of Respiratory Disease, 126*(1), 166-170. [https://doi.org/10.1164/arrd.1982.126.1.166](https://doi.org/10.1164/arrd.1982.126.1.166)
- Pirrone, M., Fisher, D., Chipman, D., Imber, D. A., Corona, J., Mietto, C., Kacmarek, R. M., & Berra, L. (2016). Recruitment maneuvers and positive end-expiratory pressure titration in morbidly obese ICU patients. *Critical Care Medicine, 44*(2), 300-307. [https://doi.org/10.1097/CCM.0000000000001387](https://doi.org/10.1097/CCM.0000000000001387)
- Ranieri, V. M., Giuliani, R., Cinnella, G., Pesce, C., Brienza, N., Ippolito, E. L., Pomo, V., Fiore, T., Gottfried, S. B., & Brienza, A. (1993). Physiologic effects of positive end-expiratory pressure in patients with chronic obstructive pulmonary disease during acute ventilatory failure and controlled mechanical ventilation. *American Review of Respiratory Disease, 147*(1), 5-13. [https://doi.org/10.1164/ajrccm/147.1.5](https://doi.org/10.1164/ajrccm/147.1.5)
- Sarge, T., Baedorf-Kassis, E., Banner-Goodspeed, V., Novack, V., Loring, S. H., Gong, M. N., Cook, D., Talmor, D., & Beitler, J. R. (2021). Effect of esophageal pressure-guided positive end-expiratory pressure on survival from acute respiratory distress syndrome: A risk-based and mechanistic reanalysis of the EPVent-2 trial. *American Journal of Respiratory and Critical Care Medicine, 204*(10), 1153-1163. [https://doi.org/10.1164/rccm.202009-3539OC](https://doi.org/10.1164/rccm.202009-3539OC)
- Serpa Neto, A., Deliberato, R. O., Johnson, A. E. W., Bos, L. D., Amorim, P., Pereira, S. M., Cazati, D. C., Cordioli, R. L., Correa, T. D., Pollard, T. J., Schettino, G. P. P., Timenetsky, K. T., Celi, L. A., Pelosi, P., Gama de Abreu, M., & Schultz, M. J. (2018). Mechanical power of ventilation is associated with mortality in critically ill patients: An analysis of patients in two observational cohorts. *Intensive Care Medicine, 44*(11), 1914-1922. [https://doi.org/10.1007/s00134-018-5375-6](https://doi.org/10.1007/s00134-018-5375-6)
- Smith, T. C., & Marini, J. J. (1988). Impact of PEEP on lung mechanics and work of breathing in severe airflow obstruction. *Journal of Applied Physiology, 65*(4), 1488-1499. [https://doi.org/10.1152/jappl.1988.65.4.1488](https://doi.org/10.1152/jappl.1988.65.4.1488)
- Talmor, D., Sarge, T., Malhotra, A., O'Donnell, C. R., Ritz, R., Lisbon, A., Novack, V., & Loring, S. H. (2008). Mechanical ventilation guided by esophageal pressure in acute lung injury. *New England Journal of Medicine, 359*(20), 2095-2104. [https://doi.org/10.1056/NEJMoa0708638](https://doi.org/10.1056/NEJMoa0708638)
- Tuxen, D. V., & Lane, S. (1987). The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *American Review of Respiratory Disease, 136*(4), 872-879. [https://doi.org/10.1164/ajrccm/136.4.872](https://doi.org/10.1164/ajrccm/136.4.872)
- Yoshida, T., Amato, M. B. P., Grieco, D. L., Chen, L., Lima, C. A. S., Roldan, R., Morais, C. C. A., Gomes, S., Costa, E. L. V., Cardoso, P. F. G., Charbonney, E., Richard, J. M., Brochard, L., & Kavanagh, B. P. (2018). Esophageal manometry and regional transpulmonary pressure in lung injury. *American Journal of Respiratory and Critical Care Medicine, 197*(8), 1018-1026. [https://doi.org/10.1164/rccm.201709-1806OC](https://doi.org/10.1164/rccm.201709-1806OC)

</details>

### 6. Enfermedad obstructiva: EPOC y asma

Id: `module-06-epoc-asma-fumadores` (id de julio conservado). Fisiopatología de la obstrucción y ventilación en la exacerbación de EPOC y en el asma grave.

**Fisiopatología de la obstrucción al flujo aéreo** — `lesson-epoc-asma-fumadores` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Diferenciar los mecanismos de obstrucción de la vía aérea en la EPOC y en el asma grave
- Explicar la limitación del flujo espiratorio y su relación con la hiperinflación dinámica y la auto-PEEP
- Calcular la constante de tiempo, el tiempo espiratorio y el volumen atrapado estimado en un modelo unicompartimental
- Interpretar las presiones pico, meseta y la PEEP total para identificar un problema predominantemente resistivo
- Justificar la cesación tabáquica a partir de su efecto en la historia natural de la EPOC y del asma

Páginas: La obstrucción al flujo aéreo: qué falla y dónde · Constante de tiempo y cálculo del atrapamiento · EPOC frente a asma y el papel del tabaquismo · Aplicación clínica: reconocer la obstrucción en el ventilador · Síntesis.

**Ventilación en la exacerbación de EPOC** — `919fa678-a19c-5d67-9425-f4c7b560e698` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar las indicaciones de VNI en la exacerbación de EPOC según las guías ERS/ATS y BTS/ICS
- Reconocer los criterios de fracaso de la VNI y las indicaciones de intubación
- Ajustar la ventilación invasiva para prolongar el tiempo espiratorio y limitar la hiperinflación dinámica
- Calcular la auto-PEEP con pausa espiratoria y ajustar la PEEP externa a una fracción de ella
- Justificar una PaCO₂ objetivo cercana a la basal del paciente con hipercapnia crónica

Páginas: La exacerbación de EPOC como falla de bomba · VNI primero: indicaciones, ajustes y criterios de fracaso · Ventilación invasiva: tiempo espiratorio, PEEP externa e hipercapnia permisiva · Aplicación clínica: del fracaso de la VNI al ajuste invasivo · Síntesis.

**Ventilación en el asma grave** — `cfa1840b-44c0-5036-9f50-5c91905ef7bf` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Explicar cómo la ventilación minuto, el volumen corriente y el tiempo espiratorio determinan la hiperinflación en el asma grave
- Ajustar los parámetros iniciales del ventilador según la estrategia de hipoventilación controlada
- Interpretar la presión meseta, la auto-PEEP, el VEI y los signos indirectos de atrapamiento
- Aplicar una secuencia de evaluación ante la hipotensión tras la intubación del paciente asmático
- Justificar los límites aceptados de la hipercapnia permisiva

Páginas: El asma grave en el ventilador: un pulmón que no logra vaciarse · Ajustes iniciales: hipoventilación controlada · Monitoreo del atrapamiento y complicaciones · Aplicación clínica: la primera hora de un asmático intubado · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Agustí, A., Celli, B. R., Criner, G. J., Halpin, D., Anzueto, A., Barnes, P., Bourbeau, J., Han, M. K., Martinez, F. J., Montes de Oca, M., Mortimer, K., Papi, A., Pavord, I., Roche, N., Salvi, S., Sin, D. D., Singh, D., Stockley, R., López Varela, M. V., ... Vogelmeier, C. F. (2023). Global Initiative for Chronic Obstructive Lung Disease 2023 report: GOLD executive summary. *European Respiratory Journal, 61*(4), 2300239. [https://doi.org/10.1183/13993003.00239-2023](https://doi.org/10.1183/13993003.00239-2023)
- Barnes, P. J. (2008). Immunology of asthma and chronic obstructive pulmonary disease. *Nature Reviews Immunology, 8*(3), 183-192. [https://doi.org/10.1038/nri2254](https://doi.org/10.1038/nri2254)
- Brochard, L., Mancebo, J., Wysocki, M., Lofaso, F., Conti, G., Rauss, A., Simonneau, G., Benito, S., Gasparetto, A., Lemaire, F., Isabey, D., & Harf, A. (1995). Noninvasive ventilation for acute exacerbations of chronic obstructive pulmonary disease. *New England Journal of Medicine, 333*(13), 817-822. [https://doi.org/10.1056/NEJM199509283331301](https://doi.org/10.1056/NEJM199509283331301)
- Calverley, P. M. A., & Koulouris, N. G. (2005). Flow limitation and dynamic hyperinflation: Key concepts in modern respiratory physiology. *European Respiratory Journal, 25*(1), 186-199. [https://doi.org/10.1183/09031936.04.00113204](https://doi.org/10.1183/09031936.04.00113204)
- Caramez, M. P., Borges, J. B., Tucci, M. R., Okamoto, V. N., Carvalho, C. R. R., Kacmarek, R. M., Malhotra, A., Velasco, I. T., & Amato, M. B. P. (2005). Paradoxical responses to positive end-expiratory pressure in patients with airway obstruction during controlled ventilation. *Critical Care Medicine, 33*(7), 1519-1528. [https://doi.org/10.1097/01.CCM.0000168044.98844.30](https://doi.org/10.1097/01.CCM.0000168044.98844.30)
- Davidson, A. C., Banham, S., Elliott, M., Kennedy, D., Gelder, C., Glossop, A., Church, A. C., Creagh-Brown, B., Dodd, J. W., Felton, T., Foëx, B., Mansfield, L., McDonnell, L., Parker, R., Patterson, C. M., Sovani, M., & Thomas, L. (2016). BTS/ICS guideline for the ventilatory management of acute hypercapnic respiratory failure in adults. *Thorax, 71*(Suppl. 2), ii1-ii35. [https://doi.org/10.1136/thoraxjnl-2015-208209](https://doi.org/10.1136/thoraxjnl-2015-208209)
- Fletcher, C., & Peto, R. (1977). The natural history of chronic airflow obstruction. *British Medical Journal, 1*(6077), 1645-1648. [https://doi.org/10.1136/bmj.1.6077.1645](https://doi.org/10.1136/bmj.1.6077.1645)
- Hogg, J. C., Chu, F., Utokaparch, S., Woods, R., Elliott, W. M., Buzatu, L., Cherniack, R. M., Rogers, R. M., Sciurba, F. C., Coxson, H. O., & Paré, P. D. (2004). The nature of small-airway obstruction in chronic obstructive pulmonary disease. *New England Journal of Medicine, 350*(26), 2645-2653. [https://doi.org/10.1056/NEJMoa032158](https://doi.org/10.1056/NEJMoa032158)
- Junhasavasdikul, D., Telias, I., Grieco, D. L., Chen, L., Gutierrez, C. M., Piraino, T., & Brochard, L. (2018). Expiratory flow limitation during mechanical ventilation. *Chest, 154*(4), 948-962. [https://doi.org/10.1016/j.chest.2018.01.046](https://doi.org/10.1016/j.chest.2018.01.046)
- Leatherman, J. (2015). Mechanical ventilation for severe asthma. *Chest, 147*(6), 1671-1680. [https://doi.org/10.1378/chest.14-1733](https://doi.org/10.1378/chest.14-1733)
- Osadnik, C. R., Tee, V. S., Carson-Chahhoud, K. V., Picot, J., Wedzicha, J. A., & Smith, B. J. (2017). Non-invasive ventilation for the management of acute hypercapnic respiratory failure due to exacerbation of chronic obstructive pulmonary disease. *Cochrane Database of Systematic Reviews, 2017*(7), CD004104. [https://doi.org/10.1002/14651858.CD004104.pub4](https://doi.org/10.1002/14651858.CD004104.pub4)
- Ranieri, V. M., Giuliani, R., Cinnella, G., Pesce, C., Brienza, N., Ippolito, E. L., Pomo, V., Fiore, T., Gottfried, S. B., & Brienza, A. (1993). Physiologic effects of positive end-expiratory pressure in patients with chronic obstructive pulmonary disease during acute ventilatory failure and controlled mechanical ventilation. *American Review of Respiratory Disease, 147*(1), 5-13. [https://doi.org/10.1164/ajrccm/147.1.5](https://doi.org/10.1164/ajrccm/147.1.5)
- Reddel, H. K., Bacharier, L. B., Bateman, E. D., Brightling, C. E., Brusselle, G. G., Buhl, R., Cruz, A. A., Duijts, L., Drazen, J. M., FitzGerald, J. M., Fleming, L. J., Inoue, H., Ko, F. W., Krishnan, J. A., Levy, M. L., Lin, J., Mortimer, K., Pitrez, P. M., Sheikh, A., ... Boulet, L.-P. (2022). Global Initiative for Asthma Strategy 2021: Executive summary and rationale for key changes. *European Respiratory Journal, 59*(1), 2102730. [https://doi.org/10.1183/13993003.02730-2021](https://doi.org/10.1183/13993003.02730-2021)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., & Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Stather, D. R., & Stewart, T. E. (2005). Clinical review: Mechanical ventilation in severe asthma. *Critical Care, 9*(6), 581-587. [https://doi.org/10.1186/cc3733](https://doi.org/10.1186/cc3733)
- Thomson, N. C., Chaudhuri, R., & Livingston, E. (2004). Asthma and cigarette smoking. *European Respiratory Journal, 24*(5), 822-833. [https://doi.org/10.1183/09031936.04.00039004](https://doi.org/10.1183/09031936.04.00039004)
- Tuxen, D. V., & Lane, S. (1987). The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *American Review of Respiratory Disease, 136*(4), 872-879. [https://doi.org/10.1164/ajrccm/136.4.872](https://doi.org/10.1164/ajrccm/136.4.872)
- Tuxen, D. V., Williams, T. J., Scheinkestel, C. D., Czarny, D., & Bowes, G. (1992). Use of a measurement of pulmonary hyperinflation to control the level of mechanical ventilation in patients with acute severe asthma. *American Review of Respiratory Disease, 146*(5 Pt 1), 1136-1142. [https://doi.org/10.1164/ajrccm/146.5_Pt_1.1136](https://doi.org/10.1164/ajrccm/146.5_Pt_1.1136)
- Williams, T. J., Tuxen, D. V., Scheinkestel, C. D., Czarny, D., & Bowes, G. (1992). Risk factors for morbidity in mechanically ventilated patients with acute severe asthma. *American Review of Respiratory Disease, 146*(3), 607-615. [https://doi.org/10.1164/ajrccm/146.3.607](https://doi.org/10.1164/ajrccm/146.3.607)

</details>

### 7. Asincronías complejas

Id: `module-03-advertencias-asincronias` (id de julio conservado). Doble disparo, disparo reverso, esfuerzos ineficaces y abordaje sistemático.

**Asincronías complejas: doble disparo, disparo reverso y P-SILI** — `lesson-advertencias-asincronias` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Identificar en las curvas de presión y flujo el doble disparo iniciado por el paciente y diferenciarlo del disparo reverso
- Calcular el índice de asincronía y el volumen apilado en mL/kg de peso predicho a partir de un registro
- Explicar el mecanismo de la lesión pulmonar autoinfligida y del pendelluft en el pulmón lesionado
- Interpretar la relación entre asincronía frecuente y pronóstico reconociendo los límites de la evidencia observacional

Páginas: Asincronías complejas: cuando el paciente y la máquina se desacoplan · Esfuerzo vigoroso, P-SILI y esfuerzos ineficaces · Fórmulas: cuantificar la asincronía y el volumen apilado · Aplicación clínica: SDRA con dobles disparos · Síntesis.

**Abordaje sistemático de las asincronías** — `f43d944f-fce1-5749-9eff-861df5067a02` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Aplicar un algoritmo de detección, clasificación, búsqueda de la causa y corrección de las asincronías
- Calcular el esfuerzo muscular y la presión transpulmonar dinámica estimados a partir de la presión de oclusión espiratoria
- Interpretar la P0.1 para decidir si el paciente está infraasistido o sobreasistido
- Ajustar el soporte, el tiempo inspiratorio y el ciclado según el tipo de asincronía
- Justificar el uso de sedoanalgesia y bloqueo neuromuscular según la evidencia y las guías actuales

Páginas: Un método para no perderse: detectar, clasificar, buscar la causa, corregir · Medir el impulso y el esfuerzo: P0.1 y presión de oclusión · Corregir: ajustes del ventilador, sedoanalgesia y bloqueo neuromuscular · Aplicación clínica: dos pacientes, dos direcciones · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Akoumianaki, E., Lyazidi, A., Rey, N., Matamis, D., Perez-Martinez, N., Giraud, R., Mancebo, J., Brochard, L., & Richard, J.-C. M. (2013). Mechanical ventilation-induced reverse-triggered breaths: A frequently unrecognized form of neuromechanical coupling. *Chest, 143*(4), 927-938. [https://doi.org/10.1378/chest.12-1817](https://doi.org/10.1378/chest.12-1817)
- Beitler, J. R., Sands, S. A., Loring, S. H., Owens, R. L., Malhotra, A., Spragg, R. G., Matthay, M. A., Thompson, B. T., & Talmor, D. (2016). Quantifying unintended exposure to high tidal volumes from breath stacking dyssynchrony in ARDS: The BREATHE criteria. *Intensive Care Medicine, 42*(9), 1427-1436. [https://doi.org/10.1007/s00134-016-4423-3](https://doi.org/10.1007/s00134-016-4423-3)
- Bertoni, M., Telias, I., Urner, M., Long, M., Del Sorbo, L., Fan, E., Sinderby, C., Beck, J., Liu, L., Qiu, H., Wong, J., Slutsky, A. S., Ferguson, N. D., Brochard, L. J., & Goligher, E. C. (2019). A novel non-invasive method to detect excessively high respiratory effort and dynamic transpulmonary driving pressure during mechanical ventilation. *Critical Care, 23*(1), 346. [https://doi.org/10.1186/s13054-019-2617-0](https://doi.org/10.1186/s13054-019-2617-0)
- Blanch, L., Villagra, A., Sales, B., Montanya, J., Lucangelo, U., Luján, M., García-Esquirol, O., Chacón, E., Estruga, A., Oliva, J. C., Hernández-Abadia, A., Albaiceta, G. M., Fernández-Mondejar, E., Fernández, R., Lopez-Aguilar, J., Villar, J., Murias, G., & Kacmarek, R. M. (2015). Asynchronies during mechanical ventilation are associated with mortality. *Intensive Care Medicine, 41*(4), 633-641. [https://doi.org/10.1007/s00134-015-3692-6](https://doi.org/10.1007/s00134-015-3692-6)
- Brochard, L., Slutsky, A., & Pesenti, A. (2017). Mechanical ventilation to minimize progression of lung injury in acute respiratory failure. *American Journal of Respiratory and Critical Care Medicine, 195*(4), 438-442. [https://doi.org/10.1164/rccm.201605-1081CP](https://doi.org/10.1164/rccm.201605-1081CP)
- Devlin, J. W., Skrobik, Y., Gélinas, C., Needham, D. M., Slooter, A. J. C., Pandharipande, P. P., Watson, P. L., Weinhouse, G. L., Nunnally, M. E., Rochwerg, B., Balas, M. C., van den Boogaard, M., Bosma, K. J., Brummel, N. E., Chanques, G., Denehy, L., Drouot, X., Fraser, G. L., Harris, J. E., ... Alhazzani, W. (2018). Clinical practice guidelines for the prevention and management of pain, agitation/sedation, delirium, immobility, and sleep disruption in adult patients in the ICU. *Critical Care Medicine, 46*(9), e825-e873. [https://doi.org/10.1097/CCM.0000000000003299](https://doi.org/10.1097/CCM.0000000000003299)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Papazian, L., Forel, J.-M., Gacouin, A., Penot-Ragon, C., Perrin, G., Loundou, A., Jaber, S., Arnal, J.-M., Perez, D., Seghboyan, J.-M., Constantin, J.-M., Courant, P., Lefrant, J.-Y., Guérin, C., Prat, G., Morange, S., & Roch, A. (2010). Neuromuscular blockers in early acute respiratory distress syndrome. *New England Journal of Medicine, 363*(12), 1107-1116. [https://doi.org/10.1056/NEJMoa1005372](https://doi.org/10.1056/NEJMoa1005372)
- Pohlman, M. C., McCallister, K. E., Schweickert, W. D., Pohlman, A. S., Nigos, C. P., Krishnan, J. A., Charbeneau, J. T., Gehlbach, B. K., Kress, J. P., & Hall, J. B. (2008). Excessive tidal volume from breath stacking during lung-protective ventilation for acute lung injury. *Critical Care Medicine, 36*(11), 3019-3023. [https://doi.org/10.1097/CCM.0b013e31818b308b](https://doi.org/10.1097/CCM.0b013e31818b308b)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., Bellani, G., Brower, R. G., Burry, L., Chen, J.-T., Hodgson, C., Hough, C. L., Lamontagne, F., Law, A., Papazian, L., Pham, T., Rubin, E., Siuba, M., Telias, I., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Rodriguez, P. O., Tiribelli, N., Fredes, S., Gogniat, E., Plotnikow, G., Fernandez Ceballos, I., Pratto, R., Raimondi, A., Guaymas, M., Ilutovich, S., San Román, E., Madorno, M., Maskin, P., Brochard, L., & Setten, M. (2021). Prevalence of reverse triggering in early ARDS: Results from a multicenter observational study. *Chest, 159*(1), 186-195. [https://doi.org/10.1016/j.chest.2020.08.018](https://doi.org/10.1016/j.chest.2020.08.018)
- Telias, I., Junhasavasdikul, D., Rittayamai, N., Piquilloud, L., Chen, L., Ferguson, N. D., Goligher, E. C., & Brochard, L. (2020). Airway occlusion pressure as an estimate of respiratory drive and inspiratory effort during assisted ventilation. *American Journal of Respiratory and Critical Care Medicine, 201*(9), 1086-1098. [https://doi.org/10.1164/rccm.201907-1425OC](https://doi.org/10.1164/rccm.201907-1425OC)
- Thille, A. W., Cabello, B., Galia, F., Lyazidi, A., & Brochard, L. (2008). Reduction of patient-ventilator asynchrony by reducing tidal volume during pressure-support ventilation. *Intensive Care Medicine, 34*(8), 1477-1486. [https://doi.org/10.1007/s00134-008-1121-9](https://doi.org/10.1007/s00134-008-1121-9)
- Thille, A. W., Rodriguez, P., Cabello, B., Lellouche, F., & Brochard, L. (2006). Patient-ventilator asynchrony during assisted mechanical ventilation. *Intensive Care Medicine, 32*(10), 1515-1522. [https://doi.org/10.1007/s00134-006-0301-8](https://doi.org/10.1007/s00134-006-0301-8)
- Yoshida, T., Torsani, V., Gomes, S., De Santis, R. R., Beraldo, M. A., Costa, E. L. V., Tucci, M. R., Zin, W. A., Kavanagh, B. P., & Amato, M. B. P. (2013). Spontaneous effort causes occult pendelluft during mechanical ventilation. *American Journal of Respiratory and Critical Care Medicine, 188*(12), 1420-1427. [https://doi.org/10.1164/rccm.201303-0539OC](https://doi.org/10.1164/rccm.201303-0539OC)

</details>

### 8. Destete difícil y ventilación no invasiva

Id: `module-04-destete-complejo-vmni` (id de julio conservado). Destete difícil y prolongado; VNI y cánula nasal de alto flujo tras la extubación.

**Destete difícil y prolongado** — `lesson-destete-complejo-vmni` · 6 páginas · 45 min

Objetivos de aprendizaje:

- Clasificar el destete de un paciente según el consenso de 2007 y según el estudio WIND
- Calcular el índice tensión-tiempo y el cociente frecuencia/volumen e interpretarlos como balance entre carga y capacidad
- Identificar las causas de fracaso del destete mediante el esquema ABCDE
- Justificar el momento de la traqueostomía y el método de destete en el paciente prolongado según la evidencia

Páginas: Destete difícil y prolongado: de qué hablamos · Causas de fracaso: un repaso estructurado · Fórmulas: índice tensión-tiempo y patrón respiratorio · Destete prolongado: traqueostomía, método de destete y rehabilitación · Aplicación clínica: cuatro PVE fallidas · Síntesis.

**VNI y cánula nasal de alto flujo tras la extubación** — `15eb1b53-1c24-5364-98aa-1451b83b40ec` · 5 páginas · 40 min

Objetivos de aprendizaje:

- Diferenciar el uso preventivo de la ventilación no invasiva de su uso como rescate
- Identificar a los pacientes con alto riesgo de fracaso de la extubación según los criterios de los ensayos
- Seleccionar ventilación no invasiva, cánula nasal de alto flujo u oxígeno convencional según el riesgo y las guías
- Calcular la reducción absoluta del riesgo y el número necesario a tratar a partir de los resultados de un ensayo
- Justificar la reintubación sin demora ante una insuficiencia respiratoria posextubación establecida

Páginas: Tras la extubación: prevenir el fracaso, no rescatarlo · Qué dice la evidencia: VNI, CNAF y oxígeno convencional · Cálculo: reducción absoluta del riesgo, NNT y presiones de la VNI · Aplicación clínica: extubar a un paciente con EPOC · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Béduneau, G., Pham, T., Schortgen, F., Piquilloud, L., Zogheib, E., Jonas, M., Grelon, F., Runge, I., Terzi, N., Grangé, S., Barberet, G., Guitard, P.-G., Frat, J.-P., Constan, A., Chretien, J.-M., Mancebo, J., Mercat, A., Richard, J.-C. M., & Brochard, L. (2017). Epidemiology of weaning outcome according to a new definition. The WIND study. *American Journal of Respiratory and Critical Care Medicine, 195*(6), 772-783. [https://doi.org/10.1164/rccm.201602-0320OC](https://doi.org/10.1164/rccm.201602-0320OC)
- Boles, J.-M., Bion, J., Connors, A., Herridge, M., Marsh, B., Melot, C., Pearl, R., Silverman, H., Stanchina, M., Vieillard-Baron, A., & Welte, T. (2007). Weaning from mechanical ventilation. *European Respiratory Journal, 29*(5), 1033-1056. [https://doi.org/10.1183/09031936.00010206](https://doi.org/10.1183/09031936.00010206)
- Dres, M., Dubé, B.-P., Mayaux, J., Delemazure, J., Reuter, D., Brochard, L., Similowski, T., & Demoule, A. (2017). Coexistence and impact of limb muscle and diaphragm weakness at time of liberation from mechanical ventilation in medical intensive care unit patients. *American Journal of Respiratory and Critical Care Medicine, 195*(1), 57-66. [https://doi.org/10.1164/rccm.201602-0367OC](https://doi.org/10.1164/rccm.201602-0367OC)
- Esteban, A., Frutos-Vivar, F., Ferguson, N. D., Arabi, Y., Apezteguía, C., González, M., Epstein, S. K., Hill, N. S., Nava, S., Soares, M.-A., D'Empaire, G., Alía, I., & Anzueto, A. (2004). Noninvasive positive-pressure ventilation for respiratory failure after extubation. *New England Journal of Medicine, 350*(24), 2452-2460. [https://doi.org/10.1056/NEJMoa032736](https://doi.org/10.1056/NEJMoa032736)
- Ferrer, M., Sellarés, J., Valencia, M., Carrillo, A., Gonzalez, G., Badia, J. R., Nicolas, J. M., & Torres, A. (2009). Non-invasive ventilation after extubation in hypercapnic patients with chronic respiratory disorders: Randomised controlled trial. *The Lancet, 374*(9695), 1082-1088. [https://doi.org/10.1016/S0140-6736(09)61038-2](https://doi.org/10.1016/S0140-6736(09)61038-2)
- Hernández, G., Vaquero, C., Colinas, L., Cuena, R., González, P., Canabal, A., Sanchez, S., Rodriguez, M. L., Villasclaras, A., & Fernández, R. (2016b). Effect of postextubation high-flow nasal cannula vs noninvasive ventilation on reintubation and postextubation respiratory failure in high-risk patients: A randomized clinical trial. *JAMA, 316*(15), 1565-1574. [https://doi.org/10.1001/jama.2016.14194](https://doi.org/10.1001/jama.2016.14194)
- Hernández, G., Vaquero, C., González, P., Subira, C., Frutos-Vivar, F., Rialp, G., Laborda, C., Colinas, L., Cuena, R., & Fernández, R. (2016a). Effect of postextubation high-flow nasal cannula vs conventional oxygen therapy on reintubation in low-risk patients: A randomized clinical trial. *JAMA, 315*(13), 1354-1361. [https://doi.org/10.1001/jama.2016.2711](https://doi.org/10.1001/jama.2016.2711)
- Heunks, L. M., & van der Hoeven, J. G. (2010). Clinical review: The ABC of weaning failure - a structured approach. *Critical Care, 14*(6), 245. [https://doi.org/10.1186/cc9296](https://doi.org/10.1186/cc9296)
- Jubran, A., Grant, B. J. B., Duffner, L. A., Collins, E. G., Lanuza, D. M., Hoffman, L. A., & Tobin, M. J. (2013). Effect of pressure support vs unassisted breathing through a tracheostomy collar on weaning duration in patients requiring prolonged mechanical ventilation: A randomized trial. *JAMA, 309*(7), 671-677. [https://doi.org/10.1001/jama.2013.159](https://doi.org/10.1001/jama.2013.159)
- Lemaire, F., Teboul, J.-L., Cinotti, L., Giotto, G., Abrouk, F., Steg, G., Macquin-Mavier, I., & Zapol, W. M. (1988). Acute left ventricular dysfunction during unsuccessful weaning from mechanical ventilation. *Anesthesiology, 69*(2), 171-179. [https://doi.org/10.1097/00000542-198808000-00004](https://doi.org/10.1097/00000542-198808000-00004)
- Oczkowski, S., Ergan, B., Bos, L., Chatwin, M., Ferrer, M., Gregoretti, C., Heunks, L., Frat, J.-P., Longhini, F., Nava, S., Navalesi, P., Ozsancak Uğurlu, A., Pisani, L., Renda, T., Thille, A. W., Winck, J. C., Windisch, W., Tonia, T., Boyd, J., ... Scala, R. (2022). ERS clinical practice guidelines: High-flow nasal cannula in acute respiratory failure. *European Respiratory Journal, 59*(4), 2101574. [https://doi.org/10.1183/13993003.01574-2021](https://doi.org/10.1183/13993003.01574-2021)
- Ouellette, D. R., Patel, S., Girard, T. D., Morris, P. E., Schmidt, G. A., Truwit, J. D., Alhazzani, W., Burns, S. M., Epstein, S. K., Esteban, A., Fan, E., Ferrer, M., Fraser, G. L., Gong, M. N., Hough, C. L., Mehta, S., Nanchal, R., Pawlik, A. J., Schweickert, W. D., ... Kress, J. P. (2017). Liberation from mechanical ventilation in critically ill adults: An official American College of Chest Physicians/American Thoracic Society clinical practice guideline. *Chest, 151*(1), 166-180. [https://doi.org/10.1016/j.chest.2016.10.036](https://doi.org/10.1016/j.chest.2016.10.036)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., & Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Thille, A. W., Muller, G., Gacouin, A., Coudroy, R., Decavèle, M., Sonneville, R., Beloncle, F., Girault, C., Dangers, L., Lautrette, A., Cabasson, S., Rouzé, A., Vivier, E., Le Meur, A., Ricard, J.-D., Razazi, K., Barberet, G., Lebert, C., Ehrmann, S., ... Frat, J.-P. (2019). Effect of postextubation high-flow nasal oxygen with noninvasive ventilation vs high-flow nasal oxygen alone on reintubation among patients at high risk of extubation failure: A randomized clinical trial. *JAMA, 322*(15), 1465-1475. [https://doi.org/10.1001/jama.2019.14901](https://doi.org/10.1001/jama.2019.14901)
- Vassilakopoulos, T., Zakynthinos, S., & Roussos, C. (1998). The tension-time index and the frequency/tidal volume ratio are the major pathophysiologic determinants of weaning failure and success. *American Journal of Respiratory and Critical Care Medicine, 158*(2), 378-385. [https://doi.org/10.1164/ajrccm.158.2.9710084](https://doi.org/10.1164/ajrccm.158.2.9710084)
- Young, D., Harrison, D. A., Cuthbertson, B. H., Rowan, K., & TracMan Collaborators. (2013). Effect of early vs late tracheostomy placement on survival in patients receiving mechanical ventilation: The TracMan randomized trial. *JAMA, 309*(20), 2121-2129. [https://doi.org/10.1001/jama.2013.5154](https://doi.org/10.1001/jama.2013.5154)

</details>

### 9. Ventilación en el paciente con obesidad

Id: `module-05-obesidad-sedentarismo` (id de julio conservado). Mecánica, programación y cuidados del paciente con obesidad.

**Ventilación en el paciente con obesidad** — `lesson-obesidad-sedentarismo` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Explicar cómo la obesidad reduce la CRF y eleva la presión pleural, y por qué eso produce atelectasias en decúbito supino
- Calcular el peso corporal predicho y el volumen corriente a partir de la talla medida
- Calcular la driving pressure, la compliance y la presión transpulmonar espiratoria e inspiratoria con presión esofágica
- Ajustar la PEEP según la respuesta de la mecánica y la hemodinamia, justificando el uso selectivo del reclutamiento
- Planificar la posición, la preoxigenación y el soporte tras la extubación en el paciente con obesidad

Páginas: Qué cambia en la mecánica respiratoria con la obesidad · Fórmulas y cálculo: peso predicho, driving pressure y presión transpulmonar · De la inducción a la extubación: estrategia ventilatoria · Aplicación clínica: SDRA en una paciente con obesidad · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Behazin, N., Jones, S. B., Cohen, R. I., & Loring, S. H. (2010). Respiratory restriction and elevated pleural and esophageal pressures in morbid obesity. *Journal of Applied Physiology, 108*(1), 212-218. [https://doi.org/10.1152/japplphysiol.91356.2008](https://doi.org/10.1152/japplphysiol.91356.2008)
- Bluth, T., Serpa Neto, A., Schultz, M. J., Pelosi, P., Gama de Abreu, M., & Writing Committee for the PROBESE Collaborative Group of the PROtective VEntilation Network (PROVEnet) for the Clinical Trial Network of the European Society of Anaesthesiology. (2019). Effect of intraoperative high positive end-expiratory pressure (PEEP) with recruitment maneuvers vs low PEEP on postoperative pulmonary complications in obese patients: A randomized clinical trial. *JAMA, 321*(23), 2292-2305. [https://doi.org/10.1001/jama.2019.7505](https://doi.org/10.1001/jama.2019.7505)
- De Jong, A., Wrigge, H., Hedenstierna, G., Gattinoni, L., Chiumello, D., Frat, J. P., Ball, L., Schetz, M., Pickkers, P., & Jaber, S. (2020). How to ventilate obese patients in the ICU. *Intensive Care Medicine, 46*(12), 2423-2435. [https://doi.org/10.1007/s00134-020-06286-x](https://doi.org/10.1007/s00134-020-06286-x)
- Fumagalli, J., Berra, L., Zhang, C., Pirrone, M., Santiago, R. R. S., Gomes, S., Magni, F., Dos Santos, G. A. B., Bennett, D., Torsani, V., Fisher, D., Morais, C., Amato, M. B. P., & Kacmarek, R. M. (2017). Transpulmonary pressure describes lung morphology during decremental positive end-expiratory pressure trials in obesity. *Critical Care Medicine, 45*(8), 1374-1381. [https://doi.org/10.1097/CCM.0000000000002460](https://doi.org/10.1097/CCM.0000000000002460)
- Jones, R. L., & Nzekwu, M. M. (2006). The effects of body mass index on lung volumes. *Chest, 130*(3), 827-833. [https://doi.org/10.1378/chest.130.3.827](https://doi.org/10.1378/chest.130.3.827)
- Pelosi, P., Croci, M., Ravagnan, I., Tredici, S., Pedoto, A., Lissoni, A., & Gattinoni, L. (1998). The effects of body mass on lung volumes, respiratory mechanics, and gas exchange during general anesthesia. *Anesthesia & Analgesia, 87*(3), 654-660. [https://doi.org/10.1097/00000539-199809000-00031](https://doi.org/10.1097/00000539-199809000-00031)
- Pirrone, M., Fisher, D., Chipman, D., Imber, D. A., Corona, J., Mietto, C., Kacmarek, R. M., & Berra, L. (2016). Recruitment maneuvers and positive end-expiratory pressure titration in morbidly obese ICU patients. *Critical Care Medicine, 44*(2), 300-307. [https://doi.org/10.1097/CCM.0000000000001387](https://doi.org/10.1097/CCM.0000000000001387)

</details>

### 10. Casos integradores

Id: `module-08-recuperacion-proteccion` (id de julio conservado). Casos clínicos completos que integran el currículo, con práctica en el simulador.

**Caso integrador 1: SDRA por neumonía** — `lesson-recuperacion-proteccion` · 5 páginas · 50 min

Objetivos de aprendizaje:

- Identificar un SDRA con la definición de Berlín y con la definición global de 2024
- Calcular el volumen corriente por peso predicho, la driving pressure y la compliance en cada etapa del caso
- Justificar la indicación de prono y las decisiones sobre PEEP y reclutamiento según las guías ESICM 2023 y ATS 2024
- Ajustar el descenso de FiO₂ y PEEP y la transición a modo asistido
- Planificar la prueba de ventilación espontánea y el soporte tras la extubación

Páginas: Etapa 1: ingreso, diagnóstico y ventilación inicial · Etapa 2: primeras horas, driving pressure, PEEP y prono · Etapa 3: día 2, vuelta a supino y reducción del soporte · Etapa 4: preparación para el destete y extubación · Síntesis del caso.

**Caso integrador 2: exacerbación de EPOC con hiperinflación dinámica** — `aa048581-e4e1-55f4-be07-b435e4bf6ba1` · 5 páginas · 45 min

Objetivos de aprendizaje:

- Interpretar una acidosis respiratoria crónica agudizada e indicar la VNI
- Calcular el tiempo espiratorio, la resistencia, la auto-PEEP y la compliance con la PEEP total
- Ajustar la frecuencia, el flujo y la presión de soporte para reducir la hiperinflación y los esfuerzos ineficaces
- Justificar una meta de PaCO₂ basada en el estado previo del paciente
- Distinguir el uso preventivo de la VNI tras la extubación de su uso como rescate

Páginas: Etapa 1: exacerbación hipercápnica y ventilación no invasiva · Etapa 2: fracaso de la VNI, intubación y ajustes iniciales · Etapa 3: gasometría, auto-PEEP y paso a modo asistido · Etapa 4: prueba de ventilación espontánea y extubación · Síntesis del caso.

**Caso integrador 3: crisis asmática grave** — `764c4545-9b69-5316-a00f-6f613727f48b` · 4 páginas · 45 min

Objetivos de aprendizaje:

- Identificar los signos de agotamiento que indican la intubación en la crisis asmática
- Calcular el tiempo espiratorio, la resistencia, la auto-PEEP y el volumen al final de la inspiración por kg de peso predicho
- Aplicar la hipoventilación controlada priorizando la prevención de la hiperinflación sobre la corrección de la PaCO₂
- Diferenciar hiperinflación dinámica y neumotórax a tensión ante un deterioro súbito
- Justificar el momento de inicio del destete según la evolución de la obstrucción

Páginas: Etapa 1: crisis asmática grave e intubación · Etapa 2: hipoventilación controlada y vigilancia de la hiperinflación · Etapa 3: deterioro súbito y liberación del ventilador · Síntesis del caso.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- ARDS Network. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Brochard, L., Mancebo, J., Wysocki, M., Lofaso, F., Conti, G., Rauss, A., Simonneau, G., Benito, S., Gasparetto, A., Lemaire, F., Isabey, D., & Harf, A. (1995). Noninvasive ventilation for acute exacerbations of chronic obstructive pulmonary disease. *New England Journal of Medicine, 333*(13), 817-822. [https://doi.org/10.1056/NEJM199509283331301](https://doi.org/10.1056/NEJM199509283331301)
- Global Initiative for Chronic Obstructive Lung Disease [GOLD]. (2024). *Global strategy for the prevention, diagnosis and management of chronic obstructive pulmonary disease: 2025 report*. [https://goldcopd.org/2025-gold-report/](https://goldcopd.org/2025-gold-report/)
- Grasselli, G., Calfee, C. S., Camporota, L., Poole, D., Amato, M. B. P., Antonelli, M., Arabi, Y. M., Baroncelli, F., Beitler, J. R., Bellani, G., Bellingan, G., Blackwood, B., Bos, L. D. J., Brochard, L., Brodie, D., Burns, K. E. A., Combes, A., D'Arrigo, S., De Backer, D., ... Cecconi, M. (2023). ESICM guidelines on acute respiratory distress syndrome: Definition, phenotyping and respiratory support strategies. *Intensive Care Medicine, 49*(7), 727-759. [https://doi.org/10.1007/s00134-023-07050-7](https://doi.org/10.1007/s00134-023-07050-7)
- Guérin, C., Reignier, J., Richard, J.-C., Beuret, P., Gacouin, A., Boulain, T., Mercier, E., Badet, M., Mercat, A., Baudin, O., Clavel, M., Chatellier, D., Jaber, S., Rosselli, S., Mancebo, J., Sirodot, M., Hilbert, G., Bengler, C., Richecoeur, J., ... Ayzac, L. (2013). Prone positioning in severe acute respiratory distress syndrome. *New England Journal of Medicine, 368*(23), 2159-2168. [https://doi.org/10.1056/NEJMoa1214103](https://doi.org/10.1056/NEJMoa1214103)
- Leatherman, J. (2015). Mechanical ventilation for severe asthma. *Chest, 147*(6), 1671-1680. [https://doi.org/10.1378/chest.14-1733](https://doi.org/10.1378/chest.14-1733)
- Matthay, M. A., Arabi, Y., Arroliga, A. C., Bernard, G., Bersten, A. D., Brochard, L. J., Calfee, C. S., Combes, A., Daniel, B. M., Ferguson, N. D., Gong, M. N., Gotts, J. E., Herridge, M. S., Laffey, J. G., Liu, K. D., Machado, F. R., Martin, T. R., McAuley, D. F., Mercat, A., ... Wick, K. D. (2024). A new global definition of acute respiratory distress syndrome. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 37-47. [https://doi.org/10.1164/rccm.202303-0558WS](https://doi.org/10.1164/rccm.202303-0558WS)
- Ouellette, D. R., Patel, S., Girard, T. D., Morris, P. E., Schmidt, G. A., Truwit, J. D., Alhazzani, W., Burns, S. M., Epstein, S. K., Esteban, A., Fan, E., Ferrer, M., Fraser, G. L., Gong, M. N., Hough, C. L., Mehta, S., Nanchal, R., Pawlik, A. J., Schweickert, W. D., ... Kress, J. P. (2017). Liberation from mechanical ventilation in critically ill adults: An official American College of Chest Physicians/American Thoracic Society clinical practice guideline. *Chest, 151*(1), 166-180. [https://doi.org/10.1016/j.chest.2016.10.036](https://doi.org/10.1016/j.chest.2016.10.036)
- Qadir, N., Sahetya, S., Munshi, L., Summers, C., Abrams, D., Beitler, J., Bellani, G., Brower, R. G., Burry, L., Chen, J. T., Hodgson, C., Hough, C. L., Lamontagne, F., Law, A., Papazian, L., Pham, T., Rubin, E., Siuba, M., Telias, I., ... Fan, E. (2024). An update on management of adult patients with acute respiratory distress syndrome: An official American Thoracic Society clinical practice guideline. *American Journal of Respiratory and Critical Care Medicine, 209*(1), 24-36. [https://doi.org/10.1164/rccm.202311-2011ST](https://doi.org/10.1164/rccm.202311-2011ST)
- Rochwerg, B., Brochard, L., Elliott, M. W., Hess, D., Hill, N. S., Nava, S., Navalesi, P., Antonelli, M., Brozek, J., Conti, G., Ferrer, M., Guntupalli, K., Jaber, S., Keenan, S., Mancebo, J., Mehta, S., & Raoof, S. (2017). Official ERS/ATS clinical practice guidelines: Noninvasive ventilation for acute respiratory failure. *European Respiratory Journal, 50*(2), 1602426. [https://doi.org/10.1183/13993003.02426-2016](https://doi.org/10.1183/13993003.02426-2016)
- Subirà, C., Hernández, G., Vázquez, A., Rodríguez-García, R., González-Castro, A., García, C., Rubio, O., Ventura, L., López, A., de la Torre, M. C., Keough, E., Arauzo, V., Hermosa, C., Sánchez, C., Tizón, A., Tenza, E., Laborda, C., Cabañes, S., Lacueva, V., ... Fernández, R. (2019). Effect of pressure support vs T-piece ventilation strategies during spontaneous breathing trials on successful extubation among patients receiving mechanical ventilation: A randomized clinical trial. *JAMA, 321*(22), 2175-2182. [https://doi.org/10.1001/jama.2019.7234](https://doi.org/10.1001/jama.2019.7234)
- Tuxen, D. V., & Lane, S. (1987). The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *American Review of Respiratory Disease, 136*(4), 872-879. [https://doi.org/10.1164/ajrccm/136.4.872](https://doi.org/10.1164/ajrccm/136.4.872)
- Tuxen, D. V., Williams, T. J., Scheinkestel, C. D., Czarny, D., & Bowes, G. (1992). Use of a measurement of pulmonary hyperinflation to control the level of mechanical ventilation in patients with acute severe asthma. *American Review of Respiratory Disease, 146*(5 Pt 1), 1136-1142. [https://doi.org/10.1164/ajrccm/146.5_Pt_1.1136](https://doi.org/10.1164/ajrccm/146.5_Pt_1.1136)

</details>

## Track VentyLab · Principiante

Id del nivel: `ventylab-principiante`. Primeros pasos en la plataforma y el ventilador VentyLab. Los módulos se desbloquean en orden.

### 1. Primeros pasos en VentyLab

Id: `2a77461f-8570-5df3-8201-18ac67a737f5`. Navegación, aprendizaje con el currículo y el tutor IA, y evaluaciones.

**Navegación, roles, perfil y notificaciones** — `7294eac7-74b3-54f0-aa3b-6db43c573e78` · 4 páginas · 20 min

Objetivos de aprendizaje:

- Identificar las entradas del menú lateral, el grupo Herramientas y el menú Opciones de la tarjeta de usuario.
- Diferenciar lo que ven y pueden hacer los roles Estudiante, Docente y Administrador.
- Actualizar el nombre, la foto y la contraseña desde Mi perfil.
- Gestionar las notificaciones desde la campana y la página Notificaciones.

Páginas: Cómo está organizada la plataforma · Roles y lo que ve cada uno · Recorrido guiado: tu primer ingreso · Síntesis.

**Aprender con VentyLab: currículo, progreso y tutor IA** — `2ca2a1c8-bb9f-5b1f-bd52-743065ec5498` · 4 páginas · 25 min

Objetivos de aprendizaje:

- Describir la organización del currículo en bloques, niveles y módulos y las reglas de desbloqueo.
- Explicar qué cuenta como página vista y lección completada.
- Utilizar TutorAI, la expansión de tema y las notas ancladas para estudiar con práctica de recuperación.
- Valorar las respuestas de la IA con comentarios concretos.
- Justificar por qué las respuestas de la IA deben verificarse y nunca usarse para decisiones sobre pacientes reales.

Páginas: El currículo y tu progreso · El visor de lecciones, las notas y el tutor de IA · Uso responsable de la IA · Síntesis.

**Evaluaciones: quizzes, talleres y exámenes** — `89a20bba-72f2-5a96-9ce3-8e1a201a6379` · 4 páginas · 20 min

Objetivos de aprendizaje:

- Diferenciar quiz, taller y examen según su presentación, retroalimentación y publicación de la nota.
- Aplicar las reglas de tiempo, guardado automático, intentos y envío al presentar un intento.
- Interpretar los estados de un intento y explicar cuándo se publica la calificación.
- Calcular el efecto de la calificación todo o nada en preguntas de selección múltiple.

Páginas: Tipos de evaluación · Presentar un intento paso a paso · Resultados y publicación de notas · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Alkaissi, H., & McFarlane, S. I. (2023). Artificial hallucinations in ChatGPT: Implications in scientific writing. *Cureus, 15*(2), e35179. [https://doi.org/10.7759/cureus.35179](https://doi.org/10.7759/cureus.35179)
- Black, P., & Wiliam, D. (1998). Assessment and classroom learning. *Assessment in Education: Principles, Policy & Practice, 5*(1), 7-74. [https://doi.org/10.1080/0969595980050102](https://doi.org/10.1080/0969595980050102)
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354-380. [https://doi.org/10.1037/0033-2909.132.3.354](https://doi.org/10.1037/0033-2909.132.3.354)
- Cook, D. A., Hatala, R., Brydges, R., Zendejas, B., Szostek, J. H., Wang, A. T., Erwin, P. J., & Hamstra, S. J. (2011). Technology-enhanced simulation for health professions education: A systematic review and meta-analysis. *JAMA, 306*(9), 978-988. [https://doi.org/10.1001/jama.2011.1234](https://doi.org/10.1001/jama.2011.1234)
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81-112. [https://doi.org/10.3102/003465430298487](https://doi.org/10.3102/003465430298487)
- Issenberg, S. B., McGaghie, W. C., Petrusa, E. R., Gordon, D. L., & Scalese, R. J. (2005). Features and uses of high-fidelity medical simulations that lead to effective learning: A BEME systematic review. *Medical Teacher, 27*(1), 10-28. [https://doi.org/10.1080/01421590500046924](https://doi.org/10.1080/01421590500046924)
- Masters, K. (2023). Ethical use of artificial intelligence in health professions education: AMEE Guide No. 158. *Medical Teacher, 45*(6), 574-584. [https://doi.org/10.1080/0142159X.2023.2186203](https://doi.org/10.1080/0142159X.2023.2186203)
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249-255. [https://doi.org/10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- VentyLab. (2026). *Manual de uso* [documentación interna].

</details>

### 2. El ventilador VentyLab y sus componentes

Id: `ventylab-module-02-ventilador-componentes` (id de julio conservado). Arquitectura del equipo físico, telemetría y diferencias con el simulador digital.

**El ventilador VentyLab y sus componentes** — `vl-ventilador-componentes` · 5 páginas · 30 min

Objetivos de aprendizaje:

- Describir el recorrido de la telemetría y de los comandos entre el equipo, el broker, el servidor y el navegador.
- Comparar los modos y rangos disponibles en el simulador digital y en el equipo real.
- Calcular el tiempo espiratorio y la relación I:E a partir de FR y Ti y verificar la regla de Te mínimo.
- Interpretar los estados Enviando, Aplicado y Rechazado de un cambio en el equipo real.
- Justificar por qué la consola muestra los valores que informa el equipo y no los escritos.

Páginas: Arquitectura: del equipo a tu pantalla · Modos y parámetros disponibles · Cómo viaja un cambio al equipo real · Recorrido: el mismo ajuste en Digital y en Real · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- OASIS. (2019). *MQTT Version 5.0* (OASIS Standard). [https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- VentyLab. (2026). *Manual de uso* [documentación interna].

</details>

## Track VentyLab · Intermedio

Id del nivel: `ventylab-intermedio`. El simulador digital, los casos clínicos, las sesiones y la retroalimentación. Requiere completar `ventylab-principiante`. Los módulos se desbloquean en orden.

### 1. El simulador digital: programación y monitoreo

Id: `ventylab-module-03-programacion-modos` (id de julio conservado). Programar modos clásicos y leer el monitoreo, las alarmas y el estado del paciente.

**Programar modos clásicos en el simulador** — `vl-programacion-modos-clasicos` · 5 páginas · 30 min

Objetivos de aprendizaje:

- Identificar las zonas de la consola y los parámetros que muestra cada modo.
- Calcular el peso corporal predicho, el volumen corriente por kilogramo y el volumen minuto.
- Ajustar FR y Ti para obtener una relación I:E determinada.
- Explicar cuándo se aplica cada tipo de cambio y cómo actúa el multiplicador de tiempo.
- Programar VCV y PCV en un paciente simulado y comparar sus curvas.

Páginas: La consola del simulador y la elección del modo · Volumen, tiempos y cálculos de apoyo · Cambios automáticos y control del tiempo · Aplicación: de VCV a PCV en un paciente postoperatorio · Síntesis.

**Leer el monitoreo, las alarmas y el estado del paciente** — `891a4006-bcda-50c3-9bfe-fe3dead157f1` · 6 páginas · 30 min

Objetivos de aprendizaje:

- Interpretar las curvas de presión, flujo y volumen y los bucles P-V y F-V con una lectura sistemática.
- Calcular la compliance estática, la dinámica y la presión de distensión a partir de las tarjetas.
- Priorizar y resolver alarmas usando el panel ¿Cómo estabilizar? sin delegar la decisión.
- Explicar los estados de evolución del paciente simulado y sus límites como modelo educativo.
- Ajustar la frecuencia ante auto-PEEP y verificar el efecto en las curvas.

Páginas: Curvas y bucles en la consola · Las tarjetas de valores · Alarmas y ayuda para estabilizar · El estado del paciente y su evolución · Aplicación: leer el monitoreo en una exacerbación de EPOC · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network [ARDS Network]. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301-1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747-755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Chatburn, R. L., El-Khatib, M., & Mireles-Cabodevila, E. (2014). A taxonomy for mechanical ventilation: 10 fundamental maxims. *Respiratory Care, 59*(11), 1747-1763. [https://doi.org/10.4187/respcare.03057](https://doi.org/10.4187/respcare.03057)
- Evans, L., Rhodes, A., Alhazzani, W., Antonelli, M., Coopersmith, C. M., French, C., Machado, F. R., Mcintyre, L., Ostermann, M., Prescott, H. C., Schorr, C., Simpson, S., Wiersinga, W. J., Alshamsi, F., Angus, D. C., Arabi, Y., Azevedo, L., Beale, R., Beilman, G., ... Levy, M. (2021). Surviving Sepsis Campaign: International guidelines for management of sepsis and septic shock 2021. *Critical Care Medicine, 49*(11), e1063-e1143. [https://doi.org/10.1097/CCM.0000000000005337](https://doi.org/10.1097/CCM.0000000000005337)
- Gaba, D. M. (2004). The future vision of simulation in health care. *Quality and Safety in Health Care, 13*(Suppl. 1), i2-i10. [https://doi.org/10.1136/qshc.2004.009878](https://doi.org/10.1136/qshc.2004.009878)
- Hess, D. R., & Kacmarek, R. M. (2019). *Essentials of mechanical ventilation* (4th ed.). McGraw-Hill Education.
- Sendelbach, S., & Funk, M. (2013). Alarm fatigue: A patient safety concern. *AACN Advanced Critical Care, 24*(4), 378-386. [https://doi.org/10.4037/NCI.0b013e3182a903f9](https://doi.org/10.4037/NCI.0b013e3182a903f9)
- VentyLab. (2026). *Manual de uso* [documentación interna].

</details>

### 2. Casos clínicos, sesiones y retroalimentación

Id: `7fd5f9f0-4711-5cc1-8758-0761737103f1`. Casos del catálogo y paciente propio; sesiones, repetición y retroalimentación con IA.

**Casos clínicos del catálogo y paciente propio** — `e4c57d44-9ae6-58c8-8b64-507c4ccc64e7` · 4 páginas · 25 min

Objetivos de aprendizaje:

- Cargar un caso clínico publicado con los filtros de patología y dificultad y enviarlo al Monitoreo
- Diferenciar un caso del catálogo, un paciente aleatorio y un paciente propio según lo que define cada uno en la simulación
- Interpretar los objetivos del cajón «Caso clínico» y su estado en tiempo real sin confundirlo con la nota
- Calcular el volumen corriente por kilo de peso predicho a partir de los datos del caso
- Explicar cómo el modelo de evolución hace mejorar o empeorar al paciente simulado

Páginas: Caso del catálogo y paciente propio · Objetivos del caso y evolución del paciente · Recorrido: cargar y resolver un caso · Síntesis.

**Sesiones, repetición y retroalimentación con IA** — `ff0f4144-f309-57c8-b93c-f8a9c8898b3f` · 5 páginas · 25 min

Objetivos de aprendizaje:

- Localizar una sesión en Mis sesiones con el filtro de tipo y los periodos de 31 días y elegir la acción adecuada
- Interpretar el resultado oficial del servidor, sus objetivos y el desglose de la rúbrica
- Usar la repetición y sus eventos para verificar una hipótesis sobre la propia práctica
- Aplicar las reglas de uso de la Asesoría IA (registro, política en examen, límite de uso)
- Justificar cuándo descartar una sugerencia de IA contrastándola con la fisiología y los objetivos del caso

Páginas: Mis sesiones: tu historial de práctica · Resultado de la sesión y repetición · Retroalimentación con IA y sus límites · Recorrido: revisar una sesión · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Acute Respiratory Distress Syndrome Network, Brower, R. G., Matthay, M. A., Morris, A., Schoenfeld, D., Thompson, B. T., & Wheeler, A. (2000). Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. *New England Journal of Medicine, 342*(18), 1301–1308. [https://doi.org/10.1056/NEJM200005043421801](https://doi.org/10.1056/NEJM200005043421801)
- Amato, M. B. P., Meade, M. O., Slutsky, A. S., Brochard, L., Costa, E. L. V., Schoenfeld, D. A., Stewart, T. E., Briel, M., Talmor, D., Mercat, A., Richard, J.-C. M., Carvalho, C. R. R., & Brower, R. G. (2015). Driving pressure and survival in the acute respiratory distress syndrome. *New England Journal of Medicine, 372*(8), 747–755. [https://doi.org/10.1056/NEJMsa1410639](https://doi.org/10.1056/NEJMsa1410639)
- Cook, D. A., Hatala, R., Brydges, R., Zendejas, B., Szostek, J. H., Wang, A. T., Erwin, P. J., & Hamstra, S. J. (2011). Technology-enhanced simulation for health professions education: A systematic review and meta-analysis. *JAMA, 306*(9), 978–988. [https://doi.org/10.1001/jama.2011.1234](https://doi.org/10.1001/jama.2011.1234)
- Fanning, R. M., & Gaba, D. M. (2007). The role of debriefing in simulation-based learning. *Simulation in Healthcare, 2*(2), 115–125. [https://doi.org/10.1097/SIH.0b013e3180315539](https://doi.org/10.1097/SIH.0b013e3180315539)
- Issenberg, S. B., McGaghie, W. C., Petrusa, E. R., Gordon, D. L., & Scalese, R. J. (2005). Features and uses of high-fidelity medical simulations that lead to effective learning: A BEME systematic review. *Medical Teacher, 27*(1), 10–28. [https://doi.org/10.1080/01421590500046924](https://doi.org/10.1080/01421590500046924)
- Masters, K. (2023). Ethical use of artificial intelligence in health professions education: AMEE Guide No. 158. *Medical Teacher, 45*(6), 574–584. [https://doi.org/10.1080/0142159X.2023.2186203](https://doi.org/10.1080/0142159X.2023.2186203)
- McGaghie, W. C., Issenberg, S. B., Cohen, E. R., Barsuk, J. H., & Wayne, D. B. (2011). Does simulation-based medical education with deliberate practice yield better results than traditional clinical education? A meta-analytic comparative review of the evidence. *Academic Medicine, 86*(6), 706–711. [https://doi.org/10.1097/ACM.0b013e318217e119](https://doi.org/10.1097/ACM.0b013e318217e119)
- VentyLab. (2026). *Manual de uso* [documentación interna].
- World Health Organization. (2024). *Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models*. [https://www.who.int/publications/i/item/9789240084759](https://www.who.int/publications/i/item/9789240084759)

</details>

## Track VentyLab · Avanzado

Id del nivel: `ventylab-avanzado`. Reserva, conexión y uso seguro del equipo físico. Requiere completar `ventylab-intermedio`. Los módulos se desbloquean en orden.

### 1. Reserva y conexión del equipo físico

Id: `2b14c136-be41-539b-89c2-0275eea94368`. Reservar el equipo y operarlo desde la pestaña Conexión.

**Reservar el equipo físico** — `befd9e27-53ec-5c36-aeef-d0b84d19a9b0` · 5 páginas · 20 min

Objetivos de aprendizaje:

- Reservar el ventilador con «Reservar ahora» o desde una franja libre del calendario
- Identificar las reglas de reserva vigentes (franja, duración máxima, antelación y límites) en la página del calendario
- Distinguir una reserva personal de una de grupo y quién opera en cada una
- Cancelar o liberar una reserva e interpretar el aviso de una reserva desplazada

Páginas: Un equipo, muchas personas · Reservar paso a paso · Grupos, cancelación y desplazamiento · Recorrido: planear una práctica de grupo · Síntesis.

**Conectar y operar el equipo real** — `5c53e67b-ea0c-57e8-b034-62cc37c005d5` · 5 páginas · 30 min

Objetivos de aprendizaje:

- Describir el camino de la telemetría y de los comandos entre el equipo, el broker MQTT, el servidor y el navegador
- Interpretar los estados de la pestaña Conexión y la diferencia entre Desconectar y Liberar
- Tomar, liberar o ceder el control exclusivo del equipo según el rol
- Interpretar la latencia, el estado del equipo y el estado por parámetro del envío automático
- Verificar en Comandos recientes si un cambio fue aplicado por el equipo

Páginas: Cómo llegan los datos del equipo a tu pantalla · La pestaña Conexión y el control del equipo · Operar el equipo con envío automático · Recorrido: tu primera conexión · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Cvach, M. (2012). Monitor alarm fatigue: An integrative review. *Biomedical Instrumentation & Technology, 46*(4), 268–277. [https://doi.org/10.2345/0899-8205-46.4.268](https://doi.org/10.2345/0899-8205-46.4.268)
- International Organization for Standardization. (2020). *Medical electrical equipment — Part 2-12: Particular requirements for basic safety and essential performance of critical care ventilators* (ISO Standard No. 80601-2-12:2020). [https://www.iso.org/standard/72069.html](https://www.iso.org/standard/72069.html)
- Issenberg, S. B., McGaghie, W. C., Petrusa, E. R., Gordon, D. L., & Scalese, R. J. (2005). Features and uses of high-fidelity medical simulations that lead to effective learning: A BEME systematic review. *Medical Teacher, 27*(1), 10–28. [https://doi.org/10.1080/01421590500046924](https://doi.org/10.1080/01421590500046924)
- McGaghie, W. C., Issenberg, S. B., Cohen, E. R., Barsuk, J. H., & Wayne, D. B. (2011). Does simulation-based medical education with deliberate practice yield better results than traditional clinical education? A meta-analytic comparative review of the evidence. *Academic Medicine, 86*(6), 706–711. [https://doi.org/10.1097/ACM.0b013e318217e119](https://doi.org/10.1097/ACM.0b013e318217e119)
- VentyLab. (2026). *Manual de uso* [documentación interna].

</details>

### 2. Seguridad en el modo real

Id: `687af28f-cdd1-53a3-ae11-ed188f51cd47`. Salvaguardas, rangos seguros y respuesta ante fallas del equipo.

**Salvaguardas, rangos seguros y respuesta ante fallas** — `cc5787a2-f702-5e5c-acfb-f6db2edb27bd` · 6 páginas · 30 min

Objetivos de aprendizaje:

- Identificar las condiciones de uso del equipo físico (pulmón de prueba, parada en el equipo, sin comandos automáticos) y las responsabilidades de cada papel
- Calcular el tiempo espiratorio y la relación I:E de un ajuste y predecir si el servidor lo rechaza
- Diferenciar los límites técnicos del laboratorio de una recomendación clínica
- Aplicar la respuesta adecuada ante equipo sin datos, pérdida de conexión o de control, alarmas y comandos sin confirmación
- Ejecutar el cierre ordenado y las medidas de higiene de la práctica

Páginas: Principios y responsabilidades · Rangos seguros y envío automático · Pérdida de conexión, control y alarmas · Higiene del equipo y cierre de la práctica · Recorrido: una falla durante la práctica · Síntesis.

<details><summary>Fuentes del módulo (APA 7)</summary>

- Cvach, M. (2012). Monitor alarm fatigue: An integrative review. *Biomedical Instrumentation & Technology, 46*(4), 268–277. [https://doi.org/10.2345/0899-8205-46.4.268](https://doi.org/10.2345/0899-8205-46.4.268)
- International Organization for Standardization. (2020). *Medical electrical equipment — Part 2-12: Particular requirements for basic safety and essential performance of critical care ventilators* (ISO Standard No. 80601-2-12:2020). [https://www.iso.org/standard/72069.html](https://www.iso.org/standard/72069.html)
- Rutala, W. A., & Weber, D. J. (2016). Disinfection and sterilization in health care facilities. *Infectious Disease Clinics of North America, 30*(3), 609–637. [https://doi.org/10.1016/j.idc.2016.04.002](https://doi.org/10.1016/j.idc.2016.04.002)
- VentyLab. (2026). *Manual de uso* [documentación interna].
- World Health Organization. (2009). *WHO guidelines on hand hygiene in health care*. [https://www.who.int/publications/i/item/9789241597906](https://www.who.int/publications/i/item/9789241597906)

</details>

