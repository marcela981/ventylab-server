# Reporte Comparativo de Backends - VentyLab

**Fecha de análisis:** $(date)
**Proyecto original:** ventilab-web (solo frontend)
**Proyecto nuevo:** ventylab-server (backend separado)

---

## RESUMEN EJECUTIVO

**Hallazgo principal:** El proyecto original (ventilab-web) NO contiene un backend separado. Es un proyecto Next.js puro (frontend) sin API routes ni servidor Express independiente. El nuevo proyecto (ventylab-server) es un backend completamente nuevo creado desde cero.

**Conclusión:** No hay migración de código backend, sino creación de un nuevo backend siguiendo arquitectura moderna con Express + TypeScript + Prisma.

---

## SECCIÓN 1 - ESTRUCTURA DEL PROYECTO ORIGINAL (ventilab-web)

### Estructura General
```
ventilab-web/
├── pages/              # Páginas Next.js (frontend)
├── src/
│   ├── components/     # Componentes React
│   ├── service/        # Servicios del frontend (AI, storage)
│   ├── hooks/          # Hooks React
│   ├── utils/          # Utilidades del frontend
│   └── types/          # Tipos TypeScript
├── package.json        # Dependencias de frontend
└── tsconfig.json       # Configuración TypeScript
```

### Archivos de Servicios en Frontend (src/service/)
- `ai/` - Servicios de IA (Gemini, OpenAI, etc.) - **CLIENTE**
- `api/` - Clientes HTTP para consumir APIs externas - **CLIENTE**
- `storage/` - Almacenamiento local - **CLIENTE**

**Nota:** Estos son servicios del CLIENTE, no del servidor.

### No hay:
- ❌ Carpeta `backend/`
- ❌ Carpeta `server/`
- ❌ API routes de Next.js (`pages/api/`)
- ❌ Servidor Express
- ❌ Prisma schema
- ❌ Base de datos configurada
- ❌ Controladores de backend
- ❌ Middleware de backend

---

## SECCIÓN 2 - ESTRUCTURA DEL PROYECTO NUEVO (ventylab-server)

### Estructura Completa
```
ventylab-server/
├── prisma/
│   ├── schema.prisma          # Schema de Prisma (13 modelos)
│   ├── seed.ts                # Script de seed
│   └── migrations/            # Migraciones de BD
├── src/
│   ├── config/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── auth.ts            # Configuración NextAuth
│   │   └── aiConfig.ts        # Configuración de IA
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   ├── progress.controller.ts
│   │   └── evaluation.controller.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── AIServiceManager.ts
│   │   │   ├── FallbackManager.ts
│   │   │   ├── PromptTemplateManager.ts
│   │   │   ├── ResponseParser.ts
│   │   │   └── providers/
│   │   │       ├── GeminiProvider.ts
│   │   │       ├── OpenAIProvider.ts
│   │   │       ├── ClaudeProvider.ts
│   │   │       └── OllamaProvider.ts
│   │   ├── progress/
│   │   │   ├── progressQuery.service.ts
│   │   │   ├── progressUpdate.service.ts
│   │   │   ├── levelCalculation.service.ts
│   │   │   ├── achievements.service.ts
│   │   │   └── index.ts
│   │   ├── evaluation/
│   │   │   ├── evaluation.service.ts
│   │   │   └── index.ts
│   │   ├── auth/              # (vacía)
│   │   └── users/             # (vacía)
│   ├── middleware/
│   │   ├── auth.ts            # Middleware de autenticación JWT
│   │   └── errorHandler.ts    # Manejo global de errores
│   ├── routes/
│   │   ├── auth.ts            # Rutas de autenticación
│   │   ├── users.ts           # Rutas de usuarios
│   │   ├── progress.ts        # Rutas de progreso
│   │   └── evaluation.ts      # Rutas de evaluación
│   ├── types/
│   │   ├── ai/
│   │   │   └── index.ts       # Tipos de IA
│   │   ├── auth.d.ts          # Tipos de autenticación
│   │   ├── evaluation.ts      # Tipos de evaluación
│   │   └── progress.ts        # Tipos de progreso
│   ├── utils/                 # (vacía)
│   └── index.ts               # Punto de entrada del servidor
├── package.json
├── tsconfig.json
├── .gitignore
├── AUTH_DOCUMENTATION.md
└── (no .env.example - bloqueado por seguridad)
```

---

## SECCIÓN 3 - ARCHIVOS PRESENTES EN AMBOS PROYECTOS

### ❌ NO HAY ARCHIVOS EN COMÚN

**Razón:** El proyecto original no tiene backend. Todos los archivos del nuevo backend son creación nueva.

**Excepción:** Los servicios de IA (`src/service/ai/`) fueron COPIADOS desde el frontend original al backend nuevo, pero adaptados para TypeScript y entorno servidor.

---

## SECCIÓN 4 - ARCHIVOS SOLO EN PROYECTO ORIGINAL (Frontend)

### Servicios de IA (src/service/ai/)
**Estado:** Fueron COPIADOS al nuevo backend pero adaptados

1. **AIServiceManager.js** → `src/services/ai/AIServiceManager.ts`
   - **Original:** JavaScript, cliente (usa `window`)
   - **Nuevo:** TypeScript, servidor (sin `window`)
   - **Diferencias:** Convertido a TS, eliminadas referencias a navegador

2. **providers/GeminiProvider.js** → `src/services/ai/providers/GeminiProvider.ts`
   - **Original:** JavaScript, verifica `typeof window`
   - **Nuevo:** TypeScript, usa `process.env.GEMINI_API_KEY`
   - **Diferencias:** Adaptado para servidor, variables de entorno diferentes

3. **providers/OpenAIProvider.js** → `src/services/ai/providers/OpenAIProvider.ts`
   - **Original:** Vacío/placeholder
   - **Nuevo:** Plantilla TypeScript (pendiente implementación)
   - **Estado:** Ambos vacíos, nuevo tiene estructura

4. **providers/ClaudeProvider.js** → `src/services/ai/providers/ClaudeProvider.ts`
   - **Original:** Vacío/placeholder
   - **Nuevo:** Plantilla TypeScript (pendiente implementación)
   - **Estado:** Ambos vacíos, nuevo tiene estructura

5. **providers/OllamaProvider.js** → `src/services/ai/providers/OllamaProvider.ts`
   - **Original:** Vacío/placeholder
   - **Nuevo:** Plantilla TypeScript (pendiente implementación)
   - **Estado:** Ambos vacíos, nuevo tiene estructura

6. **FallbackManager.js** → `src/services/ai/FallbackManager.ts`
   - **Original:** Vacío
   - **Nuevo:** Plantilla TypeScript (pendiente implementación)

7. **PromptTemplateManager.js** → `src/services/ai/PromptTemplateManager.ts`
   - **Original:** Vacío
   - **Nuevo:** Plantilla TypeScript (pendiente implementación)

8. **ResponseParser.js** → `src/services/ai/ResponseParser.ts`
   - **Original:** Vacío
   - **Nuevo:** Plantilla TypeScript (pendiente implementación)

### Archivos de Configuración de IA (src/constants/ai/)
**Estado:** NO migrados (solo frontend)

1. **aiModelConfigs.js** - Configuraciones de modelos de IA
2. **feedbackCategories.js** - Categorías de feedback
3. **medicalValidationRules.js** - Reglas de validación médica
4. **promptTemplates.js** - Plantillas de prompts

**Nota:** Estos archivos son específicos del frontend y no se migraron porque la lógica de IA ahora está en el backend.

---

## SECCIÓN 5 - ARCHIVOS SOLO EN PROYECTO NUEVO (ventylab-server)

### Archivos de Configuración

1. **package.json**
   - **Tipo:** Configuración
   - **Descripción:** Dependencias del backend (Express, Prisma, NextAuth, etc.)

2. **tsconfig.json**
   - **Tipo:** Configuración
   - **Descripción:** Configuración TypeScript para el servidor

3. **.gitignore**
   - **Tipo:** Configuración
   - **Descripción:** Archivos a ignorar en Git

4. **AUTH_DOCUMENTATION.md**
   - **Tipo:** Documentación
   - **Descripción:** Documentación de autenticación

### Archivos de Prisma

5. **prisma/schema.prisma**
   - **Tipo:** Base de datos
   - **Descripción:** Schema de Prisma con 13 modelos
   - **Modelos:**
     1. User
     2. Account
     3. Session
     4. VerificationToken
     5. Module
     6. Lesson
     7. Progress
     8. Quiz
     9. QuizAttempt
     10. Achievement
     11. ClinicalCase
     12. ExpertConfiguration
     13. EvaluationAttempt
   - **Enums:** UserRole, CaseDifficulty, Pathology, ParameterPriority

6. **prisma/seed.ts**
   - **Tipo:** Script
   - **Descripción:** Script para poblar base de datos inicial

7. **prisma/migrations/**
   - **Tipo:** Base de datos
   - **Descripción:** Carpeta para migraciones (vacía por ahora)

### Archivos de Configuración (src/config/)

8. **src/config/prisma.ts**
   - **Tipo:** Configuración
   - **Descripción:** Cliente Prisma singleton con manejo de desarrollo/producción

9. **src/config/auth.ts**
   - **Tipo:** Configuración
   - **Descripción:** Configuración de NextAuth con providers (Google, Credentials)

10. **src/config/aiConfig.ts**
    - **Tipo:** Configuración
    - **Descripción:** Configuración de proveedores de IA

### Controladores (src/controllers/)

11. **src/controllers/users.controller.ts**
    - **Tipo:** Controller
    - **Descripción:** Gestión de usuarios (perfil, actualización, cambio de contraseña)

12. **src/controllers/progress.controller.ts**
    - **Tipo:** Controller
    - **Descripción:** Gestión de progreso (overview, módulos, lecciones, completar, quizzes)

13. **src/controllers/evaluation.controller.ts**
    - **Tipo:** Controller
    - **Descripción:** Evaluación de casos clínicos (listar, obtener, evaluar, historial)

### Servicios (src/services/)

14. **src/services/ai/AIServiceManager.ts**
    - **Tipo:** Service
    - **Descripción:** Gestor de servicios de IA con fallback

15. **src/services/ai/providers/GeminiProvider.ts**
    - **Tipo:** Service
    - **Descripción:** Provider de Google Gemini (implementado)

16. **src/services/ai/providers/OpenAIProvider.ts**
    - **Tipo:** Service
    - **Descripción:** Provider de OpenAI (plantilla)

17. **src/services/ai/providers/ClaudeProvider.ts**
    - **Tipo:** Service
    - **Descripción:** Provider de Anthropic Claude (plantilla)

18. **src/services/ai/providers/OllamaProvider.ts**
    - **Tipo:** Service
    - **Descripción:** Provider de Ollama (plantilla)

19. **src/services/ai/FallbackManager.ts**
    - **Tipo:** Service
    - **Descripción:** Gestor de fallback (plantilla)

20. **src/services/ai/PromptTemplateManager.ts**
    - **Tipo:** Service
    - **Descripción:** Gestor de plantillas de prompts (plantilla)

21. **src/services/ai/ResponseParser.ts**
    - **Tipo:** Service
    - **Descripción:** Parser de respuestas de IA (plantilla)

22. **src/services/progress/progressQuery.service.ts**
    - **Tipo:** Service
    - **Descripción:** Consultas de progreso con caché

23. **src/services/progress/progressUpdate.service.ts**
    - **Tipo:** Service
    - **Descripción:** Actualización de progreso con transacciones

24. **src/services/progress/levelCalculation.service.ts**
    - **Tipo:** Service
    - **Descripción:** Cálculo de niveles y XP

25. **src/services/progress/achievements.service.ts**
    - **Tipo:** Service
    - **Descripción:** Sistema de logros

26. **src/services/progress/index.ts**
    - **Tipo:** Service
    - **Descripción:** Exportaciones de servicios de progreso

27. **src/services/evaluation/evaluation.service.ts**
    - **Tipo:** Service
    - **Descripción:** Servicio de evaluación de casos clínicos

28. **src/services/evaluation/index.ts**
    - **Tipo:** Service
    - **Descripción:** Exportaciones de servicios de evaluación

### Middleware (src/middleware/)

29. **src/middleware/auth.ts**
    - **Tipo:** Middleware
    - **Descripción:** Autenticación JWT, verificación de roles

30. **src/middleware/errorHandler.ts**
    - **Tipo:** Middleware
    - **Descripción:** Manejo global de errores, AppError class

### Rutas (src/routes/)

31. **src/routes/auth.ts**
    - **Tipo:** Routes
    - **Descripción:** Rutas de autenticación (NextAuth + custom)

32. **src/routes/users.ts**
    - **Tipo:** Routes
    - **Descripción:** Rutas de usuarios

33. **src/routes/progress.ts**
    - **Tipo:** Routes
    - **Descripción:** Rutas de progreso

34. **src/routes/evaluation.ts**
    - **Tipo:** Routes
    - **Descripción:** Rutas de evaluación

### Tipos (src/types/)

35. **src/types/ai/index.ts**
    - **Tipo:** Types
    - **Descripción:** Tipos TypeScript para servicios de IA

36. **src/types/auth.d.ts**
    - **Tipo:** Types
    - **Descripción:** Extensiones de tipos de NextAuth

37. **src/types/evaluation.ts**
    - **Tipo:** Types
    - **Descripción:** Tipos para evaluación de casos clínicos

38. **src/types/progress.ts**
    - **Tipo:** Types
    - **Descripción:** Tipos para progreso y logros

### Archivo Principal

39. **src/index.ts**
    - **Tipo:** Entry Point
    - **Descripción:** Configuración completa del servidor Express

---

## SECCIÓN 6 - DEPENDENCIAS (package.json)

### Dependencias en ventylab-server (Backend)

#### Runtime:
- `express: ^4.18.2` - Framework web
- `@prisma/client: ^5.7.1` - Cliente Prisma
- `dotenv: ^16.3.1` - Variables de entorno
- `cors: ^2.8.5` - CORS
- `@google/generative-ai: ^0.24.1` - Google Gemini
- `next-auth: ^5.0.0-beta.25` - Autenticación
- `@auth/prisma-adapter: ^2.7.0` - Adaptador Prisma para NextAuth
- `bcryptjs: ^2.4.3` - Hash de contraseñas
- `jsonwebtoken: ^9.0.2` - JWT
- `helmet: ^7.1.0` - Seguridad HTTP
- `compression: ^1.7.4` - Compresión de respuestas
- `express-rate-limit: ^7.1.5` - Rate limiting
- `morgan: ^1.10.0` - Logger HTTP

#### DevDependencies:
- `@types/express: ^4.17.21`
- `@types/node: ^20.10.5`
- `@types/cors: ^2.8.17`
- `@types/bcryptjs: ^2.4.6`
- `@types/jsonwebtoken: ^9.0.7`
- `@types/compression: ^1.7.5`
- `@types/morgan: ^1.9.9`
- `typescript: ^5.3.3`
- `tsx: ^4.7.0`
- `prisma: ^5.7.1`

### Dependencias en ventilab-web (Frontend)

#### Runtime:
- `next: 15.3.3` - Framework Next.js
- `react: ^19.0.0` - React
- `@mui/material: ^7.1.1` - Material-UI
- `@google/generative-ai: ^0.24.1` - Google Gemini (cliente)
- `chart.js: ^4.4.9` - Gráficos
- `zod: ^3.25.49` - Validación
- `zustand: ^5.0.5` - State management
- Y otras dependencias de frontend...

### Comparación de Dependencias

#### ✅ Dependencias en común:
- `@google/generative-ai` - Usado en ambos (cliente vs servidor)

#### ❌ Dependencias que faltan en ventylab-server:
- Ninguna crítica faltante. El backend tiene todas las dependencias necesarias.

#### ⚠️ Dependencias que podrían agregarse en el futuro:
- `openai` - Para OpenAI Provider (cuando se implemente)
- `@anthropic-ai/sdk` - Para Claude Provider (cuando se implemente)
- `ollama` - Para Ollama Provider (cuando se implemente)

---

## SECCIÓN 7 - MODELOS DE BASE DE DATOS

### Prisma Schema (ventylab-server/prisma/schema.prisma)

**Total de modelos:** 13

1. **User** - Usuarios del sistema
2. **Account** - Cuentas OAuth (NextAuth)
3. **Session** - Sesiones (NextAuth)
4. **VerificationToken** - Tokens de verificación (NextAuth)
5. **Module** - Módulos educativos
6. **Lesson** - Lecciones
7. **Progress** - Progreso de usuarios
8. **Quiz** - Quizzes/evaluaciones
9. **QuizAttempt** - Intentos de quiz
10. **Achievement** - Logros
11. **ClinicalCase** - Casos clínicos
12. **ExpertConfiguration** - Configuración experta
13. **EvaluationAttempt** - Intentos de evaluación

**Enums:** 4
- UserRole (STUDENT, INSTRUCTOR, ADMIN)
- CaseDifficulty (BEGINNER, INTERMEDIATE, ADVANCED)
- Pathology (11 valores)
- ParameterPriority (CRITICO, IMPORTANTE, OPCIONAL)

**Índices:** Múltiples índices para optimización de consultas

---

## SECCIÓN 8 - ENDPOINTS IMPLEMENTADOS

### Autenticación (/api/auth)
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual
- `GET /api/auth/*` - NextAuth endpoints

### Usuarios (/api/users)
- `GET /api/users/me` - Perfil actual
- `PUT /api/users/me` - Actualizar perfil
- `PATCH /api/users/me` - Actualizar perfil
- `POST /api/users/me/change-password` - Cambiar contraseña
- `GET /api/users/me/stats` - Estadísticas

### Progreso (/api/progress)
- `GET /api/progress/overview` - Overview de progreso
- `GET /api/progress/modules/:moduleId` - Progreso de módulo
- `GET /api/progress/lessons/:lessonId` - Progreso de lección
- `POST /api/progress/lessons/:lessonId/complete` - Completar lección
- `POST /api/progress/quiz/:quizId/attempt` - Intentar quiz
- `GET /api/progress/me/stats` - Estadísticas

### Evaluación (/api/cases)
- `GET /api/cases` - Listar casos
- `GET /api/cases/:caseId` - Obtener caso
- `POST /api/cases/:caseId/evaluate` - Evaluar caso
- `GET /api/cases/:caseId/attempts` - Historial de intentos

---

## SECCIÓN 9 - CARACTERÍSTICAS NUEVAS EN ventylab-server

### Seguridad
- ✅ Helmet para headers de seguridad
- ✅ Rate limiting global
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ Manejo seguro de errores

### Arquitectura
- ✅ Separación clara de responsabilidades (controllers, services, routes)
- ✅ TypeScript estricto
- ✅ Middleware reutilizable
- ✅ Manejo global de errores
- ✅ Graceful shutdown

### Base de Datos
- ✅ Prisma ORM
- ✅ Migraciones
- ✅ Seed script
- ✅ 13 modelos completos
- ✅ Relaciones bien definidas

### Servicios
- ✅ Sistema de progreso completo
- ✅ Sistema de logros
- ✅ Cálculo de niveles
- ✅ Evaluación de casos clínicos
- ✅ Integración con IA

---

## SECCIÓN 10 - ARCHIVOS PENDIENTES DE IMPLEMENTAR

### Servicios de IA (plantillas)
- `OpenAIProvider.ts` - Pendiente implementación
- `ClaudeProvider.ts` - Pendiente implementación
- `OllamaProvider.ts` - Pendiente implementación
- `FallbackManager.ts` - Pendiente implementación
- `PromptTemplateManager.ts` - Pendiente implementación
- `ResponseParser.ts` - Pendiente implementación

### Servicios vacíos
- `src/services/auth/` - Carpeta vacía
- `src/services/users/` - Carpeta vacía
- `src/utils/` - Carpeta vacía

### Rutas pendientes
- `/api/ai/*` - Rutas de servicios de IA (comentado en index.ts)

---

## CONCLUSIÓN

El proyecto **ventylab-server** es un backend completamente nuevo, no una migración. Fue creado desde cero siguiendo mejores prácticas:

1. **Arquitectura moderna:** Express + TypeScript + Prisma
2. **Separación de responsabilidades:** Controllers, Services, Routes
3. **Seguridad:** Helmet, rate limiting, CORS, autenticación JWT
4. **Base de datos:** 13 modelos con relaciones completas
5. **Servicios completos:** Progreso, logros, evaluación, IA
6. **Documentación:** AUTH_DOCUMENTATION.md

**No hay código backend original para migrar** porque el proyecto original era solo frontend. Los servicios de IA fueron adaptados del frontend al backend, pero el resto es creación nueva.

---

## RECOMENDACIONES

1. **Completar providers de IA:** Implementar OpenAI, Claude y Ollama
2. **Agregar tests:** Unit tests y integration tests
3. **Documentación API:** Swagger/OpenAPI
4. **Logging:** Sistema de logging estructurado (Winston, Pino)
5. **Monitoreo:** Health checks avanzados, métricas
6. **Validación:** Zod o class-validator para validación de schemas
7. **Cache:** Redis para caché distribuido (actualmente en memoria)

