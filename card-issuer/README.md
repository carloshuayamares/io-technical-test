# Card Issuer Service

## Descripción

REST API para emitir tarjetas de crédito. Genera solicitudes de emisión de tarjetas, valida los datos del cliente y publica eventos en Kafka para ser procesados por el servicio de card-processor.

## Características

- ✅ Endpoint POST `/cards/issue` para solicitar emisión de tarjetas
- ✅ Validación del payload con Joi
- ✅ Generación de requestId único
- ✅ Publicación de eventos CloudEvents en Kafka (topic: `io.card.requested.v1`)
- ✅ Almacenamiento en base de datos SQLite local
- ✅ Respuesta con requestId y status

## Estructura de Carpetas

```
src/
├── app.ts                 # Entrada principal de la aplicación
├── controllers/
│   └── CardController.ts  # Controladores de rutas
├── services/
│   └── CardService.ts     # Lógica de negocio
├── repositories/
│   └── CardRepository.ts  # Acceso a datos
├── validators/
│   └── CardValidator.ts   # Validación de payloads
├── kafka/
│   └── CardProducer.ts    # Productor de eventos Kafka
├── models/
│   └── Card.ts            # Modelos y interfaces
└── database/
    └── db.ts              # Configuración de SQLite
```

## Instalación

```bash
npm install
```

## Variables de Entorno

Crear archivo `.env`:

```env
PORT=3001
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=card-issuer-service
DEBUG=false
DATABASE_PATH=./data/issuer.db
```

## Desarrollo

```bash
npm run dev
```

## Build y Producción

```bash
npm run build
npm start
```

## Endpoints

### POST /cards/issue

Solicita la emisión de una tarjeta.

**Request:**
```jsonc
{
  "customer": {
    "documentType": "DNI",          // Tipo de documento del cliente
    "documentNumber": "11654321",   // Número de documento del cliente
    "fullName": "Jose Perez",      // Nombre completo del solicitante
    "age": 25,                       // Edad del solicitante
    "email": "joseperez@example.com" // Correo electrónico del solicitante
  },
  "product": {
    "type": "VISA",                // Tipo de tarjeta solicitada
    "currency": "PEN"              // Moneda del producto
  },
  "forceError": false                // Flag para simular error y permitir reintento
}
```

**Response (201 Created):**
```jsonc
{
  "success": true,                   // Resultado de la operación
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000", // ID único de la solicitud
    "status": "PENDING"            // Estado inicial de la solicitud
  }
}
```

**Response (409 Conflict):**
```jsonc
{
  "success": false,                  // Resultado de la operación
  "error": {
    "message": "Client already has a card request or issued card", // Mensaje de error
    "code": "CONFLICT"             // Código de error
  }
}
```

## Consideraciones Importantes

### Flag `forceError` y Reintentos

- Cuando una solicitud se realiza con el flag `forceError: true`, la solicitud **se guarda en la base de datos** del card-issuer.
- Un cliente (identificado por `documentNumber`) **puede realizar múltiples solicitudes** bajo las siguientes condiciones:
  - **Si el intento anterior fue con `forceError: true`**, se permite una nueva solicitud con el mismo número de documento.
  - Si la solicitud anterior fue exitosa o aún está en estado PENDING sin el flag `forceError`, no se permite duplicar el documento.
- Esto permite a los clientes reintentar la solicitud de emisión de tarjeta después de un error simulado (con `forceError: true`) sin necesidad de proporcionar un nuevo documento.

### GET /cards/:requestId

Obtiene el estado de una solicitud de tarjeta.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "documentType": "DNI",
    "documentNumber": "11654321",
    "fullName": "Jose Perez",
    "age": 25,
    "email": "joseperez@example.com",
    "cardType": "VISA",
    "currency": "PEN",
    "status": "PENDING",
    "createdAt": "2026-05-22T10:30:00.000Z",
    "updatedAt": "2026-05-22T10:30:00.000Z"
  }
}
```

## Validación de Payload

El payload es validado con las siguientes reglas:

- **documentType**: Requerido, valores permitidos: `DNI`
- **documentNumber**: Requerido, alfanumérico, 8-12 caracteres
- **fullName**: Requerido, 3-100 caracteres
- **age**: Requerido, entero, 18-120
- **email**: Requerido, formato de email válido
- **cardType**: Requerido, valores permitidos: `VISA`
- **currency**: Requerido, valores permitidos: `USD`, `PEN`

## Flujo de Procesamiento

1. Cliente envía POST a `/cards/issue`
2. Validación del payload
3. Generación de `requestId` (UUID)
4. Almacenamiento en SQLite con estado `PENDING`
5. Publicación de CloudEvent en Kafka
6. Respuesta al cliente con `requestId` y `status`
7. El card-processor consume el evento y procesa la solicitud

## Estructura de datos guardada en la base de datos local

El servicio `card-issuer` almacena cada solicitud de emisión en SQLite con la siguiente estructura:

```jsonc
{
  "id": "uuid-registro",                           // UUID interno de la fila en SQLite
  "requestId": "550e8400-e29b-41d4-a716-446655440000", // UUID de la solicitud
  "documentType": "DNI",              // Tipo de documento del cliente
  "documentNumber": "11654321",       // Número de documento del cliente
  "fullName": "Jose Perez",          // Nombre completo
  "age": 25,                            // Edad del cliente
  "email": "joseperez@example.com",   // Email del cliente
  "cardType": "VISA",                 // Tipo de tarjeta solicitada
  "currency": "PEN",                  // Moneda solicitada
  "status": "PENDING",               // Estado actual de la solicitud
  "forceError": false,                  // Flag usado para reintentos forzados
  "createdAt": "2026-05-22T10:30:00.000Z", // Fecha de creación
  "updatedAt": "2026-05-22T10:30:00.000Z"  // Fecha de última actualización
}
```

## CloudEvent Publicado

Este JSON es el evento Kafka producido por `card-issuer` al crear la solicitud:

#### Evento Kafka publicado en `io.card.requested.v1`
```jsonc
{
  "id": 1,                            // Identificador incremental del evento (eventCounter), no UUID
  "source": "requestId",            // Origen del evento, vinculado al requestId
  "type": "io.card.requested.v1",   // Tipo de evento Kafka (topic)
  "datacontenttype": "application/json", // Tipo de contenido del evento
  "time": "2026-05-22T10:30:00.000Z", // Marca de tiempo del evento
  "data": {
    "documentType": "DNI",          // Tipo de documento del cliente
    "documentNumber": "11654321",   // Número de documento del cliente
    "fullName": "Jose Perez",      // Nombre completo del cliente
    "age": 25,                        // Edad del cliente
    "email": "joseperez@example.com", // Correo electrónico del cliente
    "cardType": "VISA",             // Tipo de tarjeta solicitada
    "currency": "PEN"               // Moneda solicitada
  }
}
```

> Nota: el campo `id` en los eventos Kafka se genera internamente con un contador incremental (`eventCounter`) en lugar de un UUID.

## Health Check

```bash
GET /health
```

Respuesta:
```json
{
  "status": "healthy"
}
```

## Dependencias Principales

- **express**: Framework web
- **kafkajs**: Cliente para Kafka
- **sqlite3**: Base de datos local
- **joi**: Validación de esquemas
- **uuid**: Generación de UUIDs
- **typescript**: Lenguaje de tipado

## Testing

```bash
npm test
```

