# Card Processor Service - Event Consumer

## Descripción

Consumer que escucha eventos de `io.card.requested.v1` desde Kafka, procesa solicitudes de tarjetas con reintentos automáticos, genera tarjetas y publica eventos de éxito o envía a Dead Letter Queue (DLQ) en caso de fallo.

## Características

- ✅ Consume eventos `io.card.requested.v1` con patrón CloudEvents
- ✅ Simula carga externa (200-500ms) con algoritmo aleatorio de éxito/fallo
- ✅ Reintentos con backoff exponencial: 1s, 2s, 4s (máx 3 intentos)
- ✅ Generación de tarjetas válidas (números Visa con Luhn)
- ✅ Almacenamiento en DB local (SQLite)
- ✅ Publica `io.cards.issued.v1` en caso de éxito
- ✅ Publica `io.card.requested.v1.dlq` en caso de fallo permanente
- ✅ Flag `forceError` para pruebas de fallo forzado

## Estructura de Carpetas

```
src/
├── app.ts                      # Entry point principal
├── consumers/
│   └── CardConsumer.ts         # Consumer Kafka
├── services/
│   ├── CardProcessingService.ts # Lógica de procesamiento y reintentos
│   └── CardGenerationService.ts # Generación de datos de tarjeta
├── repositories/
│   └── CardRepository.ts       # Acceso a datos
├── models/
│   └── Card.ts                 # Interfaces y tipos
└── database/
    └── db.ts                   # Configuración SQLite
```

## Instalación

```bash
npm install
```

## Variables de Entorno

Crear archivo `.env`:

```env
NODE_ENV=development
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=card-processor-service
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

## Flujo de Procesamiento

### 1. Escucha Evento Kafka entrante
```jsonc
{
  "id": 1,                            // Identificador incremental del evento (eventCounter), no UUID
  "source": "uuid-flujo",             // Origen del evento, heredado por el servicio al republicar eventos
  "type": "io.card.requested.v1",     // Tipo de evento y tópico Kafka asociado
  "datacontenttype": "application/json", // Tipo de contenido del evento
  "time": "2026-05-22T10:30:00.000Z", // Marca de tiempo del evento
  "data": {
    "documentType": "DNI",            // Tipo de documento del cliente
    "documentNumber": "11654321",     // Número de documento del cliente
    "fullName": "Jose Perez",         // Nombre completo del solicitante
    "age": 25,                          // Edad del solicitante
    "email": "joseperez@example.com", // Correo electrónico del cliente
    "cardType": "VISA",               // Tipo de tarjeta solicitada
    "currency": "PEN",                // Moneda solicitada
    "forceError": false                 // Flag opcional para simular fallo
  }
}
```

> Nota: en `card-processor` se usa `documentNumber` como `requestId` interno para seguimiento del procesamiento.
> El campo `id` del evento Kafka es un contador incremental interno (`eventCounter`), no un UUID.

### 2. Simula Carga Extena
- Latencia: 200-500ms (aleatorio)
- Probabilidad de éxito: 50%
- Probabilidad de fallo: 50%

### 3. En Caso de Éxito
- ✅ Genera tarjeta (número válido, vencimiento, CVV)
- ✅ Almacena en DB local
- ✅ Publica evento Kafka `io.cards.issued.v1`

#### Evento Kafka publicado en `io.cards.issued.v1`
```jsonc
{
  "id": 2,                          // Identificador incremental del evento (eventCounter)
  "source": "uuid-flujo",        // Source heredado del evento de entrada
  "type": "io.cards.issued.v1",  // Tipo/tópico del evento de tarjeta emitida
  "datacontenttype": "application/json", // Tipo de contenido del evento
  "time": "2026-05-22T10:30:00.000Z", // Marca de tiempo del evento
  "data": {
    "cardId": "uuid-tarjeta",      // UUID interno de la tarjeta generada
    "requestId": "11654321",       // RequestId interno derivado de documentNumber
    "cardNumber": "4532015112830366", // Número de tarjeta generado
    "expiryDate": "12/27",         // Fecha de vencimiento de la tarjeta
    "cvv": "123",                  // Código CVV generado
    "documentNumber": "11654321",   // Documento del cliente asociado
    "email": "joseperez@example.com", // Correo electrónico del cliente
    "cardType": "VISA",             // Tipo de tarjeta emitida
    "currency": "PEN",              // Moneda de la tarjeta
    "status": "ISSUED"              // Estado final de la tarjeta
  }
}
```

#### Estructura de datos guardada en la base de datos local
```jsonc
{
  "id": "uuid-registro",             // UUID interno de la fila en SQLite
  "cardId": "uuid-tarjeta",          // UUID interno de la tarjeta
  "requestId": "11654321",           // RequestId original de la solicitud
  "documentNumber": "11654321",      // Documento del cliente asociado
  "cardNumber": "4532015112830366", // Número de tarjeta generado
  "expiryDate": "12/27",             // Fecha de vencimiento de la tarjeta
  "cvv": "123",                      // Código CVV generado
  "cardType": "VISA",                // Tipo de tarjeta emitida
  "currency": "PEN",                 // Moneda de la tarjeta
  "status": "ISSUED",                // Estado del registro en DB
  "createdAt": "2026-05-22T10:30:00.000Z", // Fecha de creación del registro
  "updatedAt": "2026-05-22T10:30:00.000Z"  // Fecha de última actualización
}
```

### 4. En Caso de Fallo
- 🔄 Reintenta con backoff: 1s → 2s → 4s
- Máx 3 intentos
- Si falla definitivamente → publica evento DLQ

#### Evento Kafka publicado en `io.card.requested.v1.dlq`

```jsonc
{
  "id": 3,                       // Identificador incremental del evento DLQ (eventCounter)
  "source": "uuid-flujo",                    // Source heredado del evento original o requestId si no existe
  "type": "io.card.requested.v1.dlq",        // Evento DLQ publicado en Kafka
  "datacontenttype": "application/json",     // Tipo de contenido del evento
  "time": "2026-05-22T10:30:00.000Z",       // Marca de tiempo del evento DLQ
  "data": {
    "originalRequestId": "11654321",         // RequestId interno derivado de documentNumber
    "originalPayload": {                       // Evento original completo que falló
      ...
    },
    "error": "External processing failed",   // Mensaje de error final
    "retryCount": 3,                          // Cantidad de reintentos realizados
    "reason": "Card processing failed after 3 retry attempts. Last error: External processing failed" // Descripción detallada del motivo
  }
}
```

## Algoritmo de Reintentos

```
Intento 1 → Fallo → Espera 1s
Intento 2 → Fallo → Espera 2s
Intento 3 → Fallo → Publica a DLQ
```

## Generación de Tarjetas

### Validación de Número de Tarjeta
- **VISA**: Comienza con 4, 16 dígitos
- Todos usan **algoritmo de Luhn** para verificación

### Datos de la Tarjeta
- **Número**: Válido según tipo y con check digit
- **Vencimiento**: 2-5 años en el futuro (MM/YY)
- **CVV**: 3 dígitos

## Ejemplos de Prueba

### Con forceError=true (fuerza 3 fallos)
Resultado: El evento va a DLQ sin haber intentado guardar en DB.

## Dependencias Principales

- **kafkajs**: Cliente para consumir eventos Kafka
- **sqlite3**: Base de datos local
- **uuid**: Generación de UUIDs
- **typescript**: Lenguaje de tipado

## Monitoreo

### Logs
```bash
docker-compose logs -f card-processor
```

### Eventos Publicados
```bash
# Ver eventos en topic CARDS_ISSUED
docker-compose exec kafka kafka-console-consumer \
  --topic io.cards.issued.v1 \
  --from-beginning \
  --bootstrap-server localhost:9092

# Ver eventos en DLQ
docker-compose exec kafka kafka-console-consumer \
  --topic io.card.requested.v1.dlq \
  --from-beginning \
  --bootstrap-server localhost:9092
```

## Rollback y Limpieza

```bash
# Detener todos los servicios
docker-compose down -v

# Limpiar volúmenes
docker volume prune
```
