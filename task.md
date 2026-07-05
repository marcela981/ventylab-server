# Tareas: Estructura Backend CMS In-Place (Notion Mode)

### Ajustes Base de Datos
- [ ] Actualizar `schema.prisma`:
  - Agregar recursividad a `Level` (`parentId` a `Level`).
  - Agregar `color`, `tags` a `Level`, `Module`, `Lesson`.
  - Agregar `blocks Json?` o `notionContent Json?` a `Lesson`.
- [ ] Generar migraciones o `prisma db push`.

### API Endpoints (`pages/api/...`)
- [ ] `GET /api/teaching/tree`: Para construir el árbol del curriculum recursivo.
- [ ] `POST / PUT / DELETE /api/teaching/node` para interactuar con la estructura jerárquica.
- [ ] `PUT /api/teaching/lesson/:id` para guardar los bloques de contenido (Notion).

### Reglas del Frontend (Core Integration)
- [ ] Intervenir `TeachingModule.jsx`: Ocultar Tabs de Dashboard/Progreso para TEACHER/ADMIN.
- [ ] Intervenir `useModuleAvailability.js`: Liberar acceso total a TEACHER/ADMIN (Bypass Prerequisitos).
- [ ] Renderizador `LessonViewer`: Reemplazar el `Stepper` de diapositivas por una Vista de Scroll Continuo Vertical.
