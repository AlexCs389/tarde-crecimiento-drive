# Sistema de Autenticación JWT

Este proyecto implementa un sistema completo de autenticación basado en JWT (JSON Web Tokens) con integración de Google OAuth.

## Flujo de Autenticación

### 1. Login con Google (Frontend)

El frontend debe realizar el login con Google OAuth y obtener el `access_token`:

```javascript
// Ejemplo con Google Sign-In
const response = await gapi.auth2.getAuthInstance().signIn();
const access_token = response.getAuthResponse().access_token;
```

### 2. Autenticación en el Backend

El frontend envía el `access_token` de Google al endpoint de autenticación:

**Endpoint:** `POST /auth/google/login`

**Request Body:**
```json
{
  "access_token": "ya29.a0AfH6SMBx..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "picture": "https://lh3.googleusercontent.com/...",
    "googleId": "123456789012345678901"
  }
}
```

El backend:
1. Verifica el `access_token` de Google
2. Obtiene la información del usuario de Google
3. Crea o actualiza el usuario en la base de datos
4. Guarda el `access_token` de Google en la BD (para usar con Google Drive API)
5. Genera un JWT propio del sistema
6. Retorna el JWT y los datos del usuario

### 3. Uso del JWT en Requests Subsecuentes

El frontend debe incluir el JWT en el header `Authorization` de todas las peticiones protegidas:

```javascript
fetch('https://api.ejemplo.com/drive/files', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
})
```

### 4. Validación del JWT

El backend valida automáticamente el JWT en todos los endpoints protegidos con `@UseGuards(JwtAuthGuard)`.

Si el token es válido:
- El request continúa
- Los datos del usuario están disponibles vía `@CurrentUser()` decorator

Si el token es inválido o expirado:
- Retorna `401 Unauthorized`
- El frontend debe redirigir al login

## Endpoints de Autenticación

### POST /auth/google/login
Autentica un usuario con Google OAuth.

**Request:**
```json
{
  "access_token": "ya29.a0AfH6SMBx..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": { ... }
}
```

### GET /auth/profile
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "picture": "https://lh3.googleusercontent.com/...",
  "googleId": "123456789012345678901"
}
```

### POST /auth/refresh
Refresca el JWT token (requiere un token válido).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": { ... }
}
```

## Endpoints Protegidos

### GET /drive/files
Lista los archivos de Google Drive del usuario autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "files": [
    {
      "id": "1abc...",
      "name": "archivo.mp4",
      "mimeType": "video/mp4",
      ...
    }
  ]
}
```

## Configuración

### Variables de Entorno

Asegúrate de configurar las siguientes variables de entorno:

```bash
# JWT Secret (usa una clave segura en producción)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google OAuth (opcional, solo si usas Google OAuth directamente)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Expiración del Token

Por defecto, el JWT expira en **1 hora** (3600 segundos).

Para cambiar la expiración, modifica el archivo `src/authentication/authentication.module.ts`:

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '24h', // Cambiar a 24 horas
  },
}),
```

## Estructura de la Base de Datos

La tabla `users` almacena:

- `id`: UUID único del usuario
- `email`: Email del usuario (único)
- `name`: Nombre del usuario
- `picture`: URL de la foto de perfil
- `googleId`: ID de Google (único)
- `accessToken`: Access token de Google (para usar con APIs de Google)
- `refreshToken`: Refresh token de Google (opcional, para renovar el access token)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

## Swagger / OpenAPI

La documentación interactiva está disponible en:

```
http://localhost:3000/api/docs
```

Para probar endpoints protegidos en Swagger:

1. Primero, llama a `POST /auth/google/login` con tu access_token de Google
2. Copia el `access_token` de la respuesta
3. Haz clic en el botón "Authorize" (candado) en la parte superior
4. Pega el token en el campo "Value"
5. Haz clic en "Authorize"
6. Ahora puedes probar todos los endpoints protegidos

## Ejemplo de Integración en el Frontend

### React con Context API

```typescript
// AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  googleId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (googleAccessToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('jwt_token')
  );

  const login = async (googleAccessToken: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/google/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: googleAccessToken }),
      });

      if (!response.ok) {
        throw new Error('Error en la autenticación');
      }

      const data = await response.json();
      
      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
```

### Uso en Componentes

```typescript
// LoginButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';

export const LoginButton = () => {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      await login(credentialResponse.credential);
      // Redirigir al dashboard
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
};
```

### API Client con Interceptor

```typescript
// api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Ejemplo de Uso

```typescript
// DriveFiles.tsx
import { useEffect, useState } from 'react';
import api from './api';

export const DriveFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await api.get('/drive/files');
        setFiles(response.data.files);
      } catch (error) {
        console.error('Error al obtener archivos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Mis Archivos de Drive</h1>
      <ul>
        {files.map((file: any) => (
          <li key={file.id}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

## Seguridad

### Mejores Prácticas

1. **JWT_SECRET**: Usa una clave secreta fuerte y única en producción
2. **HTTPS**: Siempre usa HTTPS en producción para proteger los tokens
3. **Expiración**: Configura una expiración apropiada para los tokens (1-24 horas)
4. **Refresh Tokens**: Considera implementar refresh tokens para sesiones más largas
5. **Validación**: El backend siempre valida el token en cada request
6. **Almacenamiento**: En el frontend, guarda el token en localStorage o sessionStorage
7. **CORS**: Configura CORS apropiadamente para tu dominio

### Manejo de Tokens Expirados

Cuando un token expira:
1. El backend retorna `401 Unauthorized`
2. El frontend debe detectar este error
3. Redirigir al usuario al login
4. El usuario debe autenticarse nuevamente con Google

## Troubleshooting

### Error: "Token de Google inválido o expirado"
- Verifica que el access_token de Google sea válido
- Los tokens de Google también expiran, el frontend debe renovarlos

### Error: "Usuario no válido"
- El JWT es válido pero el usuario no existe en la BD
- Esto puede ocurrir si se eliminó el usuario de la BD

### Error: "No se encontró el token de acceso de Google"
- El usuario existe pero no tiene un access_token de Google guardado
- El usuario debe hacer login nuevamente

## Soporte

Para más información, consulta:
- [NestJS JWT Documentation](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

