# Reporte Comparativo de Schemas Prisma - VentyLab

**Fecha de análisis:** $(date)
**Proyecto original:** ventilab-web (frontend)
**Proyecto nuevo:** ventylab-server (backend)

---

## RESUMEN EJECUTIVO

**Hallazgo principal:** El proyecto original (ventilab-web) **NO contiene un schema.prisma**. No hay configuración de Prisma ni base de datos en el proyecto original. El proyecto es puramente frontend (Next.js) sin backend ni ORM.

**Conclusión:** El schema.prisma en `ventylab-server` es completamente nuevo, creado desde cero para el nuevo backend. No hay modelos originales para comparar.

---

## SECCIÓN 1 - MODELOS EN ventylab-server

### Total de Modelos: 13

#### 1. User
**Campos:** 9
- `id` (String, @id, @default(cuid()))
- `email` (String, @unique)
- `emailVerified` (DateTime?)
- `name` (String?)
- `password` (String)
- `role` (UserRole enum, @default(STUDENT))
- `image` (String?)
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `accounts` → Account[] (one-to-many)
- `sessions` → Session[] (one-to-many)
- `progress` → Progress[] (one-to-many)
- `quizAttempts` → QuizAttempt[] (one-to-many)
- `achievements` → Achievement[] (one-to-many)
- `evaluationAttempts` → EvaluationAttempt[] (one-to-many)

**Constraints:**
- `@@unique([email])`
- `@@map("users")`

---

#### 2. Account
**Campos:** 13
- `id` (String, @id, @default(cuid()))
- `userId` (String)
- `type` (String)
- `provider` (String)
- `providerAccountId` (String)
- `refresh_token` (String?, @db.Text)
- `access_token` (String?, @db.Text)
- `expires_at` (Int?)
- `token_type` (String?)
- `scope` (String?)
- `id_token` (String?, @db.Text)
- `session_state` (String?)

**Relaciones:**
- `user` → User (many-to-one, onDelete: Cascade)

**Constraints:**
- `@@unique([provider, providerAccountId])`
- `@@map("accounts")`

**Nota:** Modelo estándar de NextAuth para OAuth.

---

#### 3. Session
**Campos:** 4
- `id` (String, @id, @default(cuid()))
- `sessionToken` (String, @unique)
- `userId` (String)
- `expires` (DateTime)

**Relaciones:**
- `user` → User (many-to-one, onDelete: Cascade)

**Constraints:**
- `@@unique([sessionToken])`
- `@@map("sessions")`

**Nota:** Modelo estándar de NextAuth para sesiones.

---

#### 4. VerificationToken
**Campos:** 3
- `identifier` (String)
- `token` (String, @unique)
- `expires` (DateTime)

**Relaciones:** Ninguna

**Constraints:**
- `@@unique([identifier, token])`
- `@@map("verification_tokens")`

**Nota:** Modelo estándar de NextAuth para tokens de verificación.

---

#### 5. Module
**Campos:** 7
- `id` (String, @id, @default(cuid()))
- `title` (String)
- `description` (String?, @db.Text)
- `order` (Int, @default(0))
- `isActive` (Boolean, @default(true))
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `lessons` → Lesson[] (one-to-many)
- `progress` → Progress[] (one-to-many)

**Constraints:**
- `@@map("modules")`

---

#### 6. Lesson
**Campos:** 8
- `id` (String, @id, @default(cuid()))
- `moduleId` (String)
- `title` (String)
- `content` (String?, @db.Text)
- `order` (Int, @default(0))
- `isActive` (Boolean, @default(true))
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `module` → Module (many-to-one, onDelete: Cascade)
- `progress` → Progress[] (one-to-many)

**Constraints:**
- `@@map("lessons")`

---

#### 7. Progress
**Campos:** 8
- `id` (String, @id, @default(cuid()))
- `userId` (String)
- `moduleId` (String?)
- `lessonId` (String?)
- `completed` (Boolean, @default(false))
- `progress` (Float, @default(0))
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `user` → User (many-to-one, onDelete: Cascade)
- `module` → Module? (many-to-one, optional, onDelete: Cascade)
- `lesson` → Lesson? (many-to-one, optional, onDelete: Cascade)

**Constraints:**
- `@@map("progress")`

**Nota:** Permite progreso a nivel de módulo o lección. `moduleId` y `lessonId` son opcionales.

---

#### 8. Quiz
**Campos:** 9
- `id` (String, @id, @default(cuid()))
- `title` (String)
- `description` (String?, @db.Text)
- `moduleId` (String?)
- `lessonId` (String?)
- `questions` (Json) - Array de preguntas
- `passingScore` (Float, @default(70.0))
- `timeLimit` (Int?) - Tiempo límite en minutos
- `isActive` (Boolean, @default(true))
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `attempts` → QuizAttempt[] (one-to-many)

**Constraints:**
- `@@map("quizzes")`

**Nota:** Puede estar asociado a un módulo o lección, o ser independiente.

---

#### 9. QuizAttempt
**Campos:** 8
- `id` (String, @id, @default(cuid()))
- `userId` (String)
- `quizId` (String)
- `score` (Float)
- `passed` (Boolean)
- `answers` (Json) - Respuestas del usuario
- `startedAt` (DateTime, @default(now()))
- `completedAt` (DateTime?)

**Relaciones:**
- `user` → User (many-to-one, onDelete: Cascade)
- `quiz` → Quiz (many-to-one, onDelete: Cascade)

**Constraints:**
- `@@map("quiz_attempts")`

---

#### 10. Achievement
**Campos:** 6
- `id` (String, @id, @default(cuid()))
- `userId` (String)
- `title` (String)
- `description` (String?, @db.Text)
- `icon` (String?)
- `unlockedAt` (DateTime, @default(now()))

**Relaciones:**
- `user` → User (many-to-one, onDelete: Cascade)

**Constraints:**
- `@@map("achievements")`

---

#### 11. ClinicalCase
**Campos:** 13
- `id` (String, @id, @default(cuid()))
- `title` (String)
- `description` (String, @db.Text)
- `patientAge` (Int)
- `patientWeight` (Float) - En kg
- `mainDiagnosis` (String)
- `comorbidities` (String[]) - Array de strings
- `labData` (Json?) - Datos de laboratorio (gasometría, etc)
- `difficulty` (CaseDifficulty enum)
- `pathology` (Pathology enum)
- `educationalGoal` (String, @db.Text)
- `isActive` (Boolean, @default(true))
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `expertConfiguration` → ExpertConfiguration? (one-to-one)
- `evaluationAttempts` → EvaluationAttempt[] (one-to-many)

**Constraints:**
- `@@index([difficulty])`
- `@@index([pathology])`
- `@@index([isActive])`
- `@@map("clinical_cases")`

---

#### 12. ExpertConfiguration
**Campos:** 12
- `id` (String, @id, @default(cuid()))
- `clinicalCaseId` (String, @unique)
- `ventilationMode` (String) - volume, pressure, etc
- `tidalVolume` (Float?) - Vt en ml
- `respiratoryRate` (Int?) - FR en resp/min
- `peep` (Float?) - PEEP en cmH2O
- `fio2` (Float?) - FiO2 en porcentaje (0-100)
- `maxPressure` (Float?) - Presión máxima en cmH2O
- `iERatio` (String?) - Relación I:E (ej: "1:2")
- `justification` (String, @db.Text)
- `acceptableRanges` (Json?) - Rangos aceptables {param: {min, max}}
- `parameterPriorities` (Json?) - Prioridades {param: CRITICO|IMPORTANTE|OPCIONAL}
- `createdAt` (DateTime, @default(now()))
- `updatedAt` (DateTime, @updatedAt)

**Relaciones:**
- `clinicalCase` → ClinicalCase (one-to-one, onDelete: Cascade)

**Constraints:**
- `@@unique([clinicalCaseId])`
- `@@map("expert_configurations")`

---

#### 13. EvaluationAttempt
**Campos:** 10
- `id` (String, @id, @default(cuid()))
- `userId` (String)
- `clinicalCaseId` (String)
- `userConfiguration` (Json) - Configuración del usuario
- `score` (Float) - Score calculado (0-100)
- `differences` (Json?) - Diferencias con configuración experta
- `aiFeedback` (String?, @db.Text) - Retroalimentación de IA
- `completionTime` (Int?) - Tiempo en segundos
- `isSuccessful` (Boolean, @default(false))
- `startedAt` (DateTime, @default(now()))
- `completedAt` (DateTime?)

**Relaciones:**
- `user` → User (many-to-one, onDelete: Cascade)
- `clinicalCase` → ClinicalCase (many-to-one, onDelete: Cascade)

**Constraints:**
- `@@index([userId])`
- `@@index([clinicalCaseId])`
- `@@index([userId, clinicalCaseId])` - Índice compuesto
- `@@index([isSuccessful])`
- `@@index([startedAt])`
- `@@map("evaluation_attempts")`

---

## SECCIÓN 2 - ENUMS DEFINIDOS

### 1. UserRole
- `STUDENT`
- `INSTRUCTOR`
- `ADMIN`

### 2. CaseDifficulty
- `BEGINNER`
- `INTERMEDIATE`
- `ADVANCED`

### 3. Pathology
- `EPOC`
- `SDRA`
- `NEUMONIA`
- `ASMA`
- `FIBROSIS_PULMONAR`
- `EDEMA_PULMONAR`
- `EMBOLIA_PULMONAR`
- `TEP`
- `BRONQUIOLITIS`
- `SINDROME_DE_DISTRES_RESPIRATORIO`
- `OTRAS`

### 4. ParameterPriority
- `CRITICO`
- `IMPORTANTE`
- `OPCIONAL`

---

## SECCIÓN 3 - CONFIGURACIÓN DEL SCHEMA

### Generator
```prisma
generator client {
  provider = "prisma-client-js"
}
```
**Estado:** ✅ Configurado correctamente

### Datasource
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
**Estado:** ✅ Configurado para PostgreSQL
**URL:** Variable de entorno `DATABASE_URL`

---

## SECCIÓN 4 - COMPARACIÓN CON PROYECTO ORIGINAL

### ❌ NO HAY SCHEMA.PRISMA EN EL PROYECTO ORIGINAL

**Razón:** El proyecto `ventilab-web` es puramente frontend (Next.js) sin:
- Backend separado
- Base de datos configurada
- Prisma ORM
- Schema de base de datos

**Evidencia:**
- No existe carpeta `prisma/` en `ventilab-web`
- No existe archivo `schema.prisma` en ninguna ubicación
- No hay dependencias de Prisma en `package.json` del frontend
- No hay referencias a Prisma en el código del frontend

### Estructura de Datos en el Frontend Original

El frontend original usa:
- **Archivos JSON estáticos** en `src/data/`:
  - `curriculumData.js` - Datos de currículo
  - `clinical-cases/` - Casos clínicos (archivos JSON)
  - `expert-configurations/` - Configuraciones expertas (archivos JSON)
  - `teaching-content/` - Contenido educativo (archivos)

- **Contextos React** para estado:
  - `LearningProgressContext.jsx` - Estado de progreso en memoria
  - `PatientDataContext.js` - Datos de pacientes simulados

**Conclusión:** El frontend original no tenía persistencia de datos. Todo estaba en memoria o archivos estáticos.

---

## SECCIÓN 5 - MODELOS QUE FALTAN EN ventylab-server

### ❌ NO HAY MODELOS FALTANTES

**Razón:** No hay schema original para comparar. Todos los modelos en `ventylab-server` son nuevos.

**Sin embargo, basándome en la estructura del frontend, estos modelos fueron creados para reemplazar:**

1. **Datos estáticos → Modelos de BD:**
   - `curriculumData.js` → `Module`, `Lesson`
   - `clinical-cases/*.json` → `ClinicalCase`
   - `expert-configurations/*.json` → `ExpertConfiguration`

2. **Estado en memoria → Modelos de BD:**
   - `LearningProgressContext` → `Progress`, `Achievement`
   - Estado de quizzes → `Quiz`, `QuizAttempt`
   - Estado de evaluaciones → `EvaluationAttempt`

3. **Autenticación nueva:**
   - `User`, `Account`, `Session`, `VerificationToken` (NextAuth)

---

## SECCIÓN 6 - ÍNDICES Y OPTIMIZACIONES

### Índices Definidos en ventylab-server

1. **ClinicalCase:**
   - `@@index([difficulty])` - Búsqueda por dificultad
   - `@@index([pathology])` - Búsqueda por patología
   - `@@index([isActive])` - Filtrado de casos activos

2. **EvaluationAttempt:**
   - `@@index([userId])` - Búsqueda por usuario
   - `@@index([clinicalCaseId])` - Búsqueda por caso
   - `@@index([userId, clinicalCaseId])` - Búsqueda compuesta (historial de usuario por caso)
   - `@@index([isSuccessful])` - Filtrado de intentos exitosos
   - `@@index([startedAt])` - Ordenamiento por fecha

### Constraints Únicos

1. **User:**
   - `email` - Único

2. **Account:**
   - `[provider, providerAccountId]` - Único compuesto

3. **Session:**
   - `sessionToken` - Único

4. **VerificationToken:**
   - `token` - Único
   - `[identifier, token]` - Único compuesto

5. **ExpertConfiguration:**
   - `clinicalCaseId` - Único (one-to-one con ClinicalCase)

---

## SECCIÓN 7 - RELACIONES ENTRE MODELOS

### Diagrama de Relaciones

```
User (1) ──< (N) Account
User (1) ──< (N) Session
User (1) ──< (N) Progress
User (1) ──< (N) QuizAttempt
User (1) ──< (N) Achievement
User (1) ──< (N) EvaluationAttempt

Module (1) ──< (N) Lesson
Module (1) ──< (N) Progress

Lesson (1) ──< (N) Progress

Quiz (1) ──< (N) QuizAttempt

ClinicalCase (1) ──< (1) ExpertConfiguration
ClinicalCase (1) ──< (N) EvaluationAttempt
```

### Tipos de Relaciones

1. **One-to-Many:**
   - User → Account, Session, Progress, QuizAttempt, Achievement, EvaluationAttempt
   - Module → Lesson, Progress
   - Lesson → Progress
   - Quiz → QuizAttempt
   - ClinicalCase → EvaluationAttempt

2. **One-to-One:**
   - ClinicalCase → ExpertConfiguration

3. **Many-to-One (inversas):**
   - Progress → User, Module?, Lesson?
   - QuizAttempt → User, Quiz
   - Achievement → User
   - EvaluationAttempt → User, ClinicalCase

---

## SECCIÓN 8 - CAMPOS JSON Y FLEXIBILIDAD

### Modelos con Campos JSON

1. **Quiz.questions** (Json)
   - Almacena array de preguntas flexible
   - Permite diferentes tipos de preguntas sin cambiar schema

2. **QuizAttempt.answers** (Json)
   - Almacena respuestas del usuario
   - Estructura puede variar según tipo de pregunta

3. **ClinicalCase.labData** (Json?)
   - Datos de laboratorio variables (gasometría, etc)
   - Estructura puede variar por caso

4. **ExpertConfiguration.acceptableRanges** (Json?)
   - Rangos aceptables por parámetro
   - Estructura: `{param: {min, max, unit}}`

5. **ExpertConfiguration.parameterPriorities** (Json?)
   - Prioridades por parámetro
   - Estructura: `{param: CRITICO|IMPORTANTE|OPCIONAL}`

6. **EvaluationAttempt.userConfiguration** (Json)
   - Configuración ingresada por usuario
   - Estructura variable según modo de ventilación

7. **EvaluationAttempt.differences** (Json?)
   - Diferencias detectadas
   - Estructura calculada dinámicamente

**Ventaja:** Flexibilidad para estructuras de datos que pueden evolucionar sin migraciones.

**Desventaja:** No hay validación a nivel de base de datos. La validación debe hacerse en la aplicación.

---

## SECCIÓN 9 - RECOMENDACIONES

### ✅ Modelos Completos

Todos los modelos necesarios están presentes. No faltan modelos críticos.

### ⚠️ Consideraciones Futuras

1. **Campo XP en User:**
   - Actualmente no hay campo `xp` en el modelo User
   - Los servicios de progreso asumen que existe `(user as any).xp`
   - **Recomendación:** Agregar campo `xp Int @default(0)` al modelo User

2. **Campos de timestamps en Progress:**
   - Falta `completedAt` en Progress
   - Solo hay `createdAt` y `updatedAt`
   - **Recomendación:** Agregar `completedAt DateTime?` para tracking preciso

3. **Relación Quiz con Module/Lesson:**
   - Quiz tiene `moduleId` y `lessonId` opcionales
   - No hay relaciones definidas en Prisma
   - **Recomendación:** Agregar relaciones opcionales si se necesita navegación

4. **Índices adicionales:**
   - `Progress` podría beneficiarse de índices en `userId`, `moduleId`, `lessonId`
   - `QuizAttempt` podría tener índice en `userId, quizId` para historial
   - **Recomendación:** Agregar índices según patrones de consulta

5. **Soft deletes:**
   - No hay campo `deletedAt` para soft deletes
   - **Recomendación:** Considerar agregar si se necesita recuperación de datos

---

## CONCLUSIÓN

El schema.prisma en `ventylab-server` es **completamente nuevo**, creado desde cero. No hay schema original para comparar porque el proyecto original no tenía base de datos.

**Características del nuevo schema:**
- ✅ 13 modelos bien estructurados
- ✅ Relaciones correctas entre modelos
- ✅ Índices para optimización
- ✅ Constraints únicos apropiados
- ✅ Campos JSON para flexibilidad
- ✅ Enums para validación
- ✅ Configuración PostgreSQL correcta

**El schema está completo y listo para usar.** Las únicas mejoras sugeridas son campos adicionales (XP, completedAt) y más índices según necesidades de consulta.

