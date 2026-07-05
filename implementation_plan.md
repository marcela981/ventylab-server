# Arquitectura: Modo de Construcción In-Place (Notion-Style) y Accesos Administrativos

El objetivo de este plan es actualizar la estructura de la base de datos y la interfaz de manera que se permita la creación de contenido jerárquico infinito para los profesores, la edición in-place del contenido de lecciones mediante un editor en diseño secuencial vertical, y alargar las facilidades completas de navegación para roles administrativos, corrigiendo los malentendidos previos sobre el comportamiento de visualización y de los bloqueos.

## User Review Required
> [!IMPORTANT]
> **Por favor revisa detenidamente las reglas del frontend.** 
> Especialmente la distinción entre modo de lectura (pasos) y el modo edición (scroll) para las lecciones, así como la confirmación de que con las modificaciones propuestas todos los bloqueos en la UI desaparecerán para TEACHER y ADMIN. ¿Estás de acuerdo con estos ajustes?

## Plan de Implementación (Backend)

### 1. Refactor del Esquema (Prisma)
- **Modificaciones en `schema.prisma`**:
  - Convertir el modelo `Level` en recursivo añadiendo `parentId String?` apuntando a `Level`. Permitirá agrupar Tracks > Niveles > Subniveles.
  - Atributos de Interfaz: Añadir `color String?` y `tags String?` a `Level`, `Module`, y `Lesson` (o al modelo equivalente).
  - Almacenamiento Estilo Notion: Agregar una columna tipo `content Json?` al modelo `Lesson`. Esto reemplazará el modelo relacional atómico fragmentado actual (`Step` por `Step`), posibilitando almacenar una estructura entera autodescriptiva generada por el editor directamente en la base de datos de manera atómica.

### 2. Capa de Servicios y API Endpoints
Se prepararán en `pages/api/teaching/...`:
- `GET /api/teaching/tree`: Devuelve el árbol completo.
- `POST / PUT / DELETE /api/teaching/node`: Crear, renombrar y borrar ramas del árbol currículum con soporte recursivo (Nivel/Subnivel/Módulo).
- `PUT /api/teaching/lesson/:id/content`: API Endpoint de persistencia que almacena o hace commit del payload de bloques JSON construidos en el "Modo de Edición" por el usuario docente.

## Plan de Implementación (Frontend Core)

### 1. Desbloqueo Total para Teacher/Admin
- Refactorizaremos los componentes (`ModuleProgressCard.jsx`, `ModuleLessonsList.jsx`, etc.) e inyectaremos `useAuth`.
- Agregaremos la regla: `if (user?.role === 'TEACHER' || user?.role === 'ADMIN') return true;`.
- Con esto, garantizamos que las etiquetas o tooltips tipo *"Completa el anterior"* desaparezcan por completo. Para instructores y administradores, el acceso al material será irrestricto, libre y nunca estará bloqueado por carecer de prerequisitos de estudiante.

### 2. Modo Visualización vs. Modo Edición
Aquí se corrige el enfoque previo. La web operará estrictamente con 2 modos sobre una Lección/Caso Clínico:
- **Modo Default / Estudiante (Visualización Secuencial)**: El estudiante continuará viendo las lecciones tal como existen: a través de Steppers / "Siguiente" o tarjetas, priorizando su enfoque pedagógico de avance guiado. 
- **Modo de Edición (Scroll Vertical Estilo Notion)**: **ÚNICAMENTE** se activará cuando el instructor dé clic en "Habilitar Modo Edición". En ese momento, la vista se desenrollará para formar una página en la que se hará scroll vertical, quitando el flujo de los pasos visuales y permitiendo incorporar, modificar o borrar información directamente "in-place", usando bloques drag-and-drop tipo texto, quizz o multimedios.

### 3. Ocultamiento de Pestañas
En el archivo base (`TeachingModule.jsx`):
- Ocultar las pestañas o secciones irrelevantes ("Tu Progreso", "Dashboard de Estudiante") en caso de que el rol de usuario sea `TEACHER` o `ADMIN`.

## Open Questions
- ¿Requieres algún esquema de permisos o bloqueos en especial dentro del Modo Edición para que los `TEACHER` no puedan modificar contenido creado por`ADMIN`? ¿O compartimos globalmente el estado de edición para ambos roles?

## Verification Plan

### Manual Verification
1. Identificarse como `TEACHER` o `ADMIN`. Verificar que en ningún módulo o lección sale el candado de "Completa el anterior".
2. Ingresar a una lección en modo normal y constatar que se ve en su flujo habitual iterativo (pasos / tarjetas previas).
3. Entrar a "Modo de Edición" y verificar la mutación al "Modo Scroll Infinito", en el cual se permite alterar contenido.
4. Crear subniveles recursivos simulando múltiples ramificaciones y constatar el esquema flexible.
