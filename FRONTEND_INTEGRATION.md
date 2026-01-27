# Guía de Integración para el Frontend

## Resumen de la Implementación

Se ha implementado un sistema completo de autenticación JWT con las siguientes características:

✅ Login con Google OAuth (recibe access_token del frontend)
✅ Generación de JWT propios del sistema
✅ Almacenamiento del access_token de Google en BD
✅ Validación automática de JWT en endpoints protegidos
✅ Expiración de tokens (1 hora por defecto)
✅ Endpoints de perfil y refresh token
✅ Protección de endpoints de Drive con JWT
✅ Documentación Swagger con soporte Bearer Auth

## Endpoints Disponibles

### 🔐 Autenticación

#### 1. Login con Google
```
POST /auth/google/login
Content-Type: application/json

Body:
{
  "access_token": "ya29.a0AfH6SMBx..."
}

Response 200:
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

#### 2. Obtener Perfil (Protegido)
```
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 200:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "picture": "https://lh3.googleusercontent.com/...",
  "googleId": "123456789012345678901"
}
```

#### 3. Refrescar Token (Protegido)
```
POST /auth/refresh
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 200:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": { ... }
}
```

### 📁 Google Drive (Protegidos)

#### 4. Listar Archivos
```
GET /drive/files
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 200:
{
  "files": [
    {
      "id": "1abc...",
      "name": "Plática de Tarde de crecimiento.mp4",
      "mimeType": "video/mp4",
      "size": "123456789",
      "createdTime": "2024-01-01T00:00:00.000Z",
      "webViewLink": "https://drive.google.com/file/d/...",
      "webContentLink": "https://drive.google.com/uc?id=..."
    }
  ]
}
```

## Flujo de Autenticación

```
┌─────────────┐                                    ┌─────────────┐
│             │  1. Login con Google               │             │
│   Frontend  │───────────────────────────────────>│   Google    │
│             │                                    │    OAuth    │
└─────────────┘                                    └─────────────┘
       │                                                   │
       │ 2. Recibe access_token                           │
       │<──────────────────────────────────────────────────┘
       │
       │ 3. POST /auth/google/login
       │    { access_token: "..." }
       │
       v
┌─────────────┐                                    ┌─────────────┐
│             │                                    │             │
│   Frontend  │───────────────────────────────────>│   Backend   │
│             │                                    │   (NestJS)  │
└─────────────┘                                    └─────────────┘
       │                                                   │
       │                                                   │ 4. Verifica token
       │                                                   │    con Google
       │                                                   │
       │                                                   │ 5. Crea/actualiza
       │                                                   │    usuario en BD
       │                                                   │
       │                                                   │ 6. Genera JWT
       │                                                   │    propio
       │                                                   │
       │ 7. Retorna JWT + datos usuario                   │
       │<──────────────────────────────────────────────────┘
       │
       │ 8. Guarda JWT en localStorage
       │
       │ 9. Usa JWT en todas las peticiones
       │    Authorization: Bearer <jwt>
       │
       v
┌─────────────┐
│  Sesión     │
│  Activa     │
└─────────────┘
```

## Datos para Mantener la Sesión

El frontend debe almacenar y gestionar:

### 1. JWT Token (Obligatorio)
```javascript
localStorage.setItem('jwt_token', response.access_token);
```

### 2. Datos del Usuario (Recomendado)
```javascript
localStorage.setItem('user', JSON.stringify(response.user));
```

### 3. Tiempo de Expiración (Opcional)
```javascript
const expiresAt = Date.now() + (response.expires_in * 1000);
localStorage.setItem('token_expires_at', expiresAt.toString());
```

## Validación de Sesión

### Verificar si hay sesión activa:
```javascript
function isAuthenticated() {
  const token = localStorage.getItem('jwt_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  
  if (!token) return false;
  
  if (expiresAt && Date.now() > parseInt(expiresAt)) {
    // Token expirado
    logout();
    return false;
  }
  
  return true;
}
```

### Validar token con el backend:
```javascript
async function validateSession() {
  try {
    const response = await fetch('/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    
    if (!response.ok) {
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    logout();
    return false;
  }
}
```

## Manejo de Errores

### Error 401 Unauthorized
```javascript
// Interceptor de axios
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Error 400 Bad Request
```javascript
// Token de Google inválido
if (error.response?.status === 400) {
  alert('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
}
```

## Ejemplo Completo - React + TypeScript

### 1. Tipos TypeScript

```typescript
// types/auth.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  googleId: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 2. Context de Autenticación

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (googleAccessToken: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('jwt_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  // Inicializar sesión desde localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      const userStr = localStorage.getItem('user');
      const expiresAt = localStorage.getItem('token_expires_at');

      if (!token || !userStr) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Verificar expiración
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        logout();
        return;
      }

      // Validar token con el backend
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error validando sesión:', error);
        logout();
      }
    };

    initAuth();
  }, []);

  const login = async (googleAccessToken: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/google/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: googleAccessToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar sesión');
      }

      const data: AuthResponse = await response.json();

      // Calcular tiempo de expiración
      const expiresAt = Date.now() + (data.expires_in * 1000);

      // Guardar en localStorage
      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token_expires_at', expiresAt.toString());

      setState({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al refrescar token');
      }

      const data: AuthResponse = await response.json();

      const expiresAt = Date.now() + (data.expires_in * 1000);

      localStorage.setItem('jwt_token', data.access_token);
      localStorage.setItem('token_expires_at', expiresAt.toString());

      setState(prev => ({
        ...prev,
        token: data.access_token,
      }));
    } catch (error) {
      console.error('Error al refrescar token:', error);
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
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

### 3. Cliente API con Axios

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Interceptor para agregar el token
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

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expires_at');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 4. Componente de Login

```typescript
// components/LoginButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginButton = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      await login(credentialResponse.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión. Por favor, intenta de nuevo.');
    }
  };

  const handleError = () => {
    console.error('Login Failed');
    alert('Error al iniciar sesión con Google');
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
};
```

### 5. Ruta Protegida

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 6. Uso en la App

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginButton } from './components/LoginButton';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginButton />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
```

### 7. Ejemplo de uso de API

```typescript
// pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  webViewLink: string;
  webContentLink: string;
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
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

  return (
    <div>
      <header>
        <h1>Dashboard</h1>
        <div>
          <img src={user?.picture} alt={user?.name} />
          <span>{user?.name}</span>
          <button onClick={logout}>Cerrar Sesión</button>
        </div>
      </header>

      <main>
        <h2>Archivos de Google Drive</h2>
        {loading ? (
          <p>Cargando archivos...</p>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
```

## Variables de Entorno del Frontend

```env
# .env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Checklist de Integración

- [ ] Instalar `@react-oauth/google` para Google Sign-In
- [ ] Configurar `GoogleOAuthProvider` con tu Client ID
- [ ] Crear `AuthContext` para manejar el estado de autenticación
- [ ] Implementar función `login` que llame a `/auth/google/login`
- [ ] Guardar JWT en `localStorage`
- [ ] Crear interceptor de Axios para agregar el token
- [ ] Crear interceptor para manejar errores 401
- [ ] Implementar `ProtectedRoute` para rutas privadas
- [ ] Validar sesión al cargar la aplicación
- [ ] Implementar función `logout`
- [ ] Manejar expiración de tokens
- [ ] Probar flujo completo de autenticación

## Swagger UI

Para probar los endpoints manualmente:

1. Abre http://localhost:3000/api/docs
2. Ejecuta `POST /auth/google/login` con tu access_token de Google
3. Copia el `access_token` de la respuesta
4. Haz clic en el botón "Authorize" (🔒) en la parte superior
5. Pega el token y haz clic en "Authorize"
6. Ahora puedes probar todos los endpoints protegidos

## Soporte

Si tienes problemas con la integración, verifica:

1. ✅ El backend está corriendo en el puerto correcto
2. ✅ Las variables de entorno están configuradas
3. ✅ El token de Google es válido
4. ✅ El JWT no ha expirado
5. ✅ El header Authorization está correctamente formateado: `Bearer <token>`
6. ✅ CORS está configurado correctamente en el backend

Para más detalles técnicos, consulta `AUTHENTICATION.md`.

