# Documentación de Autenticación - Ventylab Server

Esta documentación explica cómo usar el sistema de autenticación desde el frontend.

## Configuración de Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
# URL del backend
NEXTAUTH_URL=http://localhost:3000

# Secret para firmar tokens (genera uno aleatorio)
NEXTAUTH_SECRET=tu-secret-aleatorio-aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/ventylab?schema=public"
```

### Generar NEXTAUTH_SECRET

Puedes generar un secret aleatorio usando:

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# O usando OpenSSL
openssl rand -base64 32
```

## Endpoints de Autenticación

### 1. Registro de Usuario

**POST** `/api/auth/register`

Registra un nuevo usuario con email y contraseña.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "name": "Nombre del Usuario",
  "role": "STUDENT" // Opcional: STUDENT, INSTRUCTOR, ADMIN
}
```

**Response (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "clx...",
    "email": "usuario@ejemplo.com",
    "name": "Nombre del Usuario",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Ejemplo con fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    name: 'Nombre del Usuario',
  }),
});

const data = await response.json();
```

### 2. Login con Credenciales

**POST** `/api/auth/signin` (NextAuth)

Este es el endpoint principal de NextAuth para login. Usa el flujo estándar de NextAuth.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "redirect": false
}
```

**Response:**
NextAuth retornará un token JWT en la respuesta.

**Ejemplo con fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    redirect: false,
  }),
  credentials: 'include', // Importante para cookies
});

const data = await response.json();
```

### 3. Login con Google OAuth

**GET** `/api/auth/signin/google`

Inicia el flujo de OAuth con Google. El usuario será redirigido a Google para autenticarse.

**Ejemplo:**
```javascript
// Redirigir al usuario
window.location.href = 'http://localhost:3000/api/auth/signin/google';
```

### 4. Obtener Sesión Actual

**GET** `/api/auth/session`

Obtiene la sesión actual del usuario autenticado.

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "usuario@ejemplo.com",
    "name": "Nombre del Usuario",
    "role": "STUDENT",
    "image": null
  },
  "expires": "2024-01-31T00:00:00.000Z"
}
```

**Ejemplo con fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/session', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  credentials: 'include',
});

const session = await response.json();
```

### 5. Logout

**POST** `/api/auth/signout`

Cierra la sesión del usuario.

**Ejemplo con fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/signout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'include',
});
```

## Uso del Token JWT en Requests

Una vez que el usuario inicia sesión, recibirás un token JWT. Debes incluir este token en todas las requests protegidas usando el header `Authorization`.

### Ejemplo de Request Protegida

```javascript
// Obtener el token (guárdalo después del login)
const token = localStorage.getItem('authToken'); // O donde lo guardes

// Hacer request a endpoint protegido
const response = await fetch('http://localhost:3000/api/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

if (response.status === 401) {
  // Token inválido o expirado, redirigir al login
  window.location.href = '/login';
}

const data = await response.json();
```

### Manejo de Errores de Autenticación

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la solicitud');
  }

  return response.json();
}
```

## Middleware de Autenticación en el Backend

El backend incluye un middleware `authenticate` que puedes usar en tus rutas protegidas:

```typescript
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/auth';

// Ruta protegida (requiere autenticación)
router.get('/api/protected', authenticate, (req, res) => {
  // req.user está disponible aquí
  res.json({
    message: 'Ruta protegida',
    user: req.user,
  });
});

// Ruta que requiere rol específico
router.get('/api/admin', authenticate, requireRole('ADMIN'), (req, res) => {
  res.json({
    message: 'Solo administradores',
    user: req.user,
  });
});
```

## Flujo Completo de Autenticación

### 1. Registro
```javascript
// 1. Usuario se registra
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    name: 'Usuario',
  }),
});

const { user } = await registerResponse.json();
```

### 2. Login
```javascript
// 2. Usuario inicia sesión
const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña123',
    redirect: false,
  }),
  credentials: 'include',
});

const { token } = await loginResponse.json();

// 3. Guardar token
localStorage.setItem('authToken', token);
```

### 3. Usar Token en Requests
```javascript
// 4. Usar token en requests protegidas
const protectedResponse = await fetch('http://localhost:3000/api/protected', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  },
});
```

## Notas Importantes

1. **Seguridad del Token**: Nunca expongas el token en URLs o logs. Guárdalo de forma segura (localStorage, sessionStorage, o cookies httpOnly).

2. **Expiración**: Los tokens expiran después de 30 días. Implementa renovación automática si es necesario.

3. **HTTPS en Producción**: Siempre usa HTTPS en producción para proteger los tokens en tránsito.

4. **CORS**: Asegúrate de configurar CORS correctamente para permitir requests desde tu frontend.

5. **Refresh Tokens**: Considera implementar refresh tokens para mejor seguridad en producción.

## Solución de Problemas

### Error: "No se proporcionó un token de autenticación"
- Verifica que estés incluyendo el header `Authorization: Bearer <token>`
- Asegúrate de que el token no esté vacío

### Error: "Token expirado"
- El token ha expirado (30 días por defecto)
- El usuario debe iniciar sesión nuevamente

### Error: "Token inválido"
- El token está mal formado o fue firmado con un secret diferente
- Verifica que `NEXTAUTH_SECRET` sea el mismo en todas las instancias

### Error: "Usuario no encontrado"
- El usuario fue eliminado de la base de datos pero el token aún es válido
- Esto se maneja automáticamente por el middleware

