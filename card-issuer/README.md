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
```json
{
  "customer": {
    "documentType": "DNI",
    "documentNumber": "11654321",
    "fullName": "Jose Perez",
    "age": 25,
    "email": "joseperez@example.com"
  },
  "product": {
    "type": "VISA",
    "currency": "PEN"
  },
  "forceError": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING"
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

- **documentType**: Requerido, valores permitidos: `DNI`, `PASAPORTE`, `RUC`
- **documentNumber**: Requerido, alfanumérico, 8-12 caracteres
- **fullName**: Requerido, 3-100 caracteres
- **age**: Requerido, entero, 18-120
- **email**: Requerido, formato de email válido
- **cardType**: Requerido, valores permitidos: `VISA`, `MASTERCARD`, `AMEX`
- **currency**: Requerido, valores permitidos: `USD`, `PEN`, `EUR`

## Flujo de Procesamiento

1. Cliente envía POST a `/cards/issue`
2. Validación del payload
3. Generación de `requestId` (UUID)
4. Almacenamiento en SQLite con estado `PENDING`
5. Publicación de CloudEvent en Kafka
6. Respuesta al cliente con `requestId` y `status`
7. El card-processor consume el evento y procesa la solicitud

## CloudEvent Publicado

```json
{
  "id": "uuid-evento",
  "source": "requestId",
  "type": "io.card.requested.v1",
  "datacontenttype": "application/json",
  "time": "2026-05-22T10:30:00.000Z",
  "data": {
    "documentType": "DNI",
    "documentNumber": "11654321",
    "fullName": "Jose Perez",
    "age": 25,
    "email": "joseperez@example.com",
    "cardType": "VISA",
    "currency": "PEN"
  }
}
```

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

