# Tests diferidos (curaduría pre-entrega)

Contenido movido aquí durante la limpieza pre-entrega para sacarlo del árbol de build.
Nada fue borrado; el movimiento es 100% reversible.

Origen original:

- `__tests__/` ← `src/modules/simulation/__tests__/` (9 tests unitarios de simulación)
- `jest.config.js` ← raíz del repo

Para restaurar:

```bash
mv __deferred_tests__/__tests__ src/modules/simulation/__tests__
mv __deferred_tests__/jest.config.js .
```

Nota: `package.json` conserva los scripts `test`/`test:watch` (jest); solo vuelven a
funcionar tras restaurar estos archivos.
