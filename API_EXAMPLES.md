# Ejemplos de API con cURL

## Autenticación

### 1. Login con Google

```bash
curl -X POST http://localhost:3000/auth/google/login \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "ya29.a0AfH6SMBx..."
  }'
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzdWFyaW9AZWplbXBsby5jb20iLCJpYXQiOjE3MDYwMDAwMDAsImV4cCI6MTcwNjAwMzYwMH0.xxxxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "picture": "https://lh3.googleusercontent.com/a/xxxxx",
    "googleId": "123456789012345678901"
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Token de Google inválido o expirado",
  "error": "Unauthorized"
}
```

### 2. Obtener Perfil del Usuario

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta exitosa (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "picture": "https://lh3.googleusercontent.com/a/xxxxx",
  "googleId": "123456789012345678901"
}
```

### 3. Refrescar Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta exitosa (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "picture": "https://lh3.googleusercontent.com/a/xxxxx",
    "googleId": "123456789012345678901"
  }
}
```

## Google Drive

### 4. Listar Archivos de Drive

```bash
curl -X GET http://localhost:3000/drive/files \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta exitosa (200):**
```json
{
  "files": [
    {
      "id": "1abc123def456ghi789jkl",
      "name": "Plática de Tarde de crecimiento - Enero 2024.mp4",
      "mimeType": "video/mp4",
      "size": "123456789",
      "createdTime": "2024-01-15T10:30:00.000Z",
      "webViewLink": "https://drive.google.com/file/d/1abc123def456ghi789jkl/view?usp=drivesdk",
      "webContentLink": "https://drive.google.com/uc?id=1abc123def456ghi789jkl&export=download"
    },
    {
      "id": "2xyz987wvu654tsr321qpo",
      "name": "Plática de Tarde de crecimiento - Febrero 2024.mp4",
      "mimeType": "video/mp4",
      "size": "987654321",
      "createdTime": "2024-02-20T14:45:00.000Z",
      "webViewLink": "https://drive.google.com/file/d/2xyz987wvu654tsr321qpo/view?usp=drivesdk",
      "webContentLink": "https://drive.google.com/uc?id=2xyz987wvu654tsr321qpo&export=download"
    }
  ]
}
```

**Error sin autenticación (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Error sin token de Google (401):**
```json
{
  "statusCode": 401,
  "message": "No se encontró el token de acceso de Google para el usuario",
  "error": "Unauthorized"
}
```

## Flujo Completo de Ejemplo

### Paso 1: Login
```bash
# Guardar la respuesta en una variable
RESPONSE=$(curl -s -X POST http://localhost:3000/auth/google/login \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "ya29.a0AfH6SMBx..."
  }')

echo $RESPONSE | jq .
```

### Paso 2: Extraer el JWT
```bash
# Extraer el access_token usando jq
JWT_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
echo "JWT Token: $JWT_TOKEN"
```

### Paso 3: Usar el JWT para obtener archivos
```bash
curl -X GET http://localhost:3000/drive/files \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Paso 4: Verificar perfil
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Paso 5: Refrescar token antes de que expire
```bash
NEW_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer $JWT_TOKEN")

NEW_JWT_TOKEN=$(echo $NEW_RESPONSE | jq -r '.access_token')
echo "Nuevo JWT Token: $NEW_JWT_TOKEN"
```

## Script Bash Completo

```bash
#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo -e "${YELLOW}=== Test de API de Autenticación ===${NC}\n"

# 1. Login
echo -e "${YELLOW}1. Haciendo login con Google...${NC}"
read -p "Ingresa tu Google access_token: " GOOGLE_TOKEN

RESPONSE=$(curl -s -X POST "$API_URL/auth/google/login" \
  -H "Content-Type: application/json" \
  -d "{\"access_token\": \"$GOOGLE_TOKEN\"}")

if [ $? -eq 0 ]; then
  JWT_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
  
  if [ "$JWT_TOKEN" != "null" ] && [ -n "$JWT_TOKEN" ]; then
    echo -e "${GREEN}✓ Login exitoso${NC}"
    echo "JWT Token: ${JWT_TOKEN:0:50}..."
    
    USER_EMAIL=$(echo $RESPONSE | jq -r '.user.email')
    USER_NAME=$(echo $RESPONSE | jq -r '.user.name')
    echo "Usuario: $USER_NAME ($USER_EMAIL)"
  else
    echo -e "${RED}✗ Error en login${NC}"
    echo $RESPONSE | jq .
    exit 1
  fi
else
  echo -e "${RED}✗ Error al conectar con el servidor${NC}"
  exit 1
fi

echo ""

# 2. Obtener perfil
echo -e "${YELLOW}2. Obteniendo perfil...${NC}"
PROFILE=$(curl -s -X GET "$API_URL/auth/profile" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo $PROFILE | jq -e '.id' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Perfil obtenido${NC}"
  echo $PROFILE | jq .
else
  echo -e "${RED}✗ Error al obtener perfil${NC}"
  echo $PROFILE | jq .
fi

echo ""

# 3. Listar archivos de Drive
echo -e "${YELLOW}3. Listando archivos de Google Drive...${NC}"
FILES=$(curl -s -X GET "$API_URL/drive/files" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo $FILES | jq -e '.files' > /dev/null 2>&1; then
  FILE_COUNT=$(echo $FILES | jq '.files | length')
  echo -e "${GREEN}✓ Archivos obtenidos: $FILE_COUNT${NC}"
  echo $FILES | jq '.files[] | {name: .name, size: .size, createdTime: .createdTime}'
else
  echo -e "${RED}✗ Error al obtener archivos${NC}"
  echo $FILES | jq .
fi

echo ""

# 4. Refrescar token
echo -e "${YELLOW}4. Refrescando token...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Authorization: Bearer $JWT_TOKEN")

NEW_JWT_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.access_token')

if [ "$NEW_JWT_TOKEN" != "null" ] && [ -n "$NEW_JWT_TOKEN" ]; then
  echo -e "${GREEN}✓ Token refrescado${NC}"
  echo "Nuevo JWT Token: ${NEW_JWT_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Error al refrescar token${NC}"
  echo $REFRESH_RESPONSE | jq .
fi

echo ""
echo -e "${GREEN}=== Test completado ===${NC}"
```

## Errores Comunes

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Causa:** Token JWT inválido, expirado o no proporcionado.
**Solución:** Verifica que el header `Authorization` esté correctamente formateado: `Bearer <token>`

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["access_token should not be empty", "access_token must be a string"],
  "error": "Bad Request"
}
```
**Causa:** Falta el campo `access_token` o tiene un formato incorrecto.
**Solución:** Asegúrate de enviar el body con el formato correcto.

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```
**Causa:** Error en el servidor (puede ser problema con la BD, Google API, etc.)
**Solución:** Revisa los logs del servidor para más detalles.

## Testing con Postman

### Configuración de Environment

Crea un environment en Postman con las siguientes variables:

```
base_url: http://localhost:3000
google_access_token: (tu token de Google)
jwt_token: (se llenará automáticamente)
```

### Collection de Postman

1. **Login**
   - Method: POST
   - URL: `{{base_url}}/auth/google/login`
   - Body (JSON):
     ```json
     {
       "access_token": "{{google_access_token}}"
     }
     ```
   - Tests (para guardar el JWT automáticamente):
     ```javascript
     var jsonData = pm.response.json();
     pm.environment.set("jwt_token", jsonData.access_token);
     ```

2. **Get Profile**
   - Method: GET
   - URL: `{{base_url}}/auth/profile`
   - Headers:
     - Authorization: `Bearer {{jwt_token}}`

3. **Refresh Token**
   - Method: POST
   - URL: `{{base_url}}/auth/refresh`
   - Headers:
     - Authorization: `Bearer {{jwt_token}}`
   - Tests:
     ```javascript
     var jsonData = pm.response.json();
     pm.environment.set("jwt_token", jsonData.access_token);
     ```

4. **List Drive Files**
   - Method: GET
   - URL: `{{base_url}}/drive/files`
   - Headers:
     - Authorization: `Bearer {{jwt_token}}`

## Notas Importantes

1. **Expiración:** Los JWT expiran en 1 hora por defecto
2. **Formato del Header:** Siempre usa `Bearer <token>`, no olvides el espacio
3. **CORS:** Si llamas desde un navegador, asegúrate de que CORS esté configurado
4. **HTTPS:** En producción, siempre usa HTTPS para proteger los tokens
5. **Token de Google:** El access_token de Google también expira, el frontend debe manejarlo

## Documentación Swagger

Para una experiencia interactiva, visita:

```
http://localhost:3000/api/docs
```

Swagger te permite:
- Ver todos los endpoints disponibles
- Ver los esquemas de request/response
- Probar los endpoints directamente desde el navegador
- Autenticarte con el botón "Authorize"

