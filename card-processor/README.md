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

### 1. Escucha Evento
```json
{
  "id": "uuid-evento",
  "source": "uuid-flujo",
  "type": "io.card.requested.v1",
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

### 2. Simula Carga Extena
- Latencia: 200-500ms (aleatorio)
- Probabilidad de éxito: 50%
- Probabilidad de fallo: 50%

### 3. En Caso de Éxito
- ✅ Genera tarjeta (número válido, vencimiento, CVV)
- ✅ Almacena en DB
- ✅ Publica `io.cards.issued.v1`

```json
{
  "id": "uuid-evento",
  "source": "requestId",
  "type": "io.cards.issued.v1",
  "data": {
    "cardId": "uuid-tarjeta",
    "requestId": "11654321",
    "cardNumber": "4532015112830366",
    "expiryDate": "12/27",
    "cvv": "123",
    "documentNumber": "11654321",
    "email": "joseperez@example.com",
    "cardType": "VISA",
    "currency": "PEN",
    "status": "ISSUED"
  }
}
```

### 4. En Caso de Fallo
- 🔄 Reintenta con backoff: 1s → 2s → 4s
- Máx 3 intentos
- Si falla definitivamente → publica DLQ

```json
{
  "id": "uuid-evento",
  "source": "requestId",
  "type": "io.card.requested.v1.dlq",
  "data": {
    "originalRequestId": "11654321",
    "originalPayload": { ... },
    "error": "External processing failed",
    "retryCount": 3,
    "reason": "Card processing failed after 3 retry attempts. Last error: External processing failed"
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
