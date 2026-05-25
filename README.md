# Technical Test - Card Issuer and Processor

Este proyecto contiene un sistema distribuido para la emisión y el procesamiento de tarjetas usando Kafka como broker de mensajes.

## Estructura del proyecto

- **shared/**: Código compartido, tipos, utilidades y configuraciones
  - `types/`: Definiciones de tipos de TypeScript
  - `kafka/`: Configuración y utilidades del cliente Kafka
  - `logger/`: Utilidades de registro
  - `utils/`: Funciones utilitarias comunes
  - `constants/`: Constantes de la aplicación

- **card-issuer/**: Servicio responsable de emitir tarjetas
  - `src/controllers/`: Controladores de la API
  - `src/services/`: Lógica de negocio
  - `src/repositories/`: Capa de acceso a datos
  - `src/validators/`: Validación de entradas
  - `src/kafka/`: Productor Kafka para eventos de tarjetas

- **card-processor/**: Servicio responsable de procesar eventos de tarjetas
  - `src/consumers/`: Consumidores Kafka
  - `src/services/`: Lógica de negocio
  - `src/retry/`: Lógica de reintento para eventos fallidos
  - `src/kafka/`: Configuración del consumidor Kafka

## Configuración

### Requisitos previos

- Docker y Docker Compose
- Node.js (para desarrollo local)

### Ejecutar la aplicación

```bash
docker-compose up --build -d
```

## Arquitectura

El sistema consiste en dos servicios principales:

1. **Card Issuer**: Gestiona la creación de tarjetas y genera eventos
2. **Card Processor**: Consume eventos de tarjetas y los procesa

La comunicación entre servicios se facilita mediante tópicos de Kafka.

## Tópicos de Kafka e inspección de eventos

### Listar tópicos existentes
```bash
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### Tópicos usados por el proyecto
- `io.card.requested.v1`
- `io.cards.issued.v1`
- `io.card.requested.v1.dlq`

### Describir un tópico específico
```bash
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic io.cards.issued.v1
```

### Leer eventos publicados en un tópico
```bash
docker-compose exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic io.cards.issued.v1 --from-beginning --timeout-ms 10000
```

### Leer eventos del DLQ
```bash
docker-compose exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic io.card.requested.v1.dlq --from-beginning --timeout-ms 10000
```

## Inspeccionar registros de las bases de datos de cada microservicio

### Card Issuer
```bash
docker-compose exec card-issuer sh -c "node card-issuer/scripts/query-db.js"
```

### Card Processor
```bash
docker-compose exec card-processor sh -c "node card-processor/scripts/query-db.js"
```

### Filtrar por requestId
```bash
docker-compose exec card-issuer sh -c "node card-issuer/scripts/query-db.js <requestId>"
```

```bash
docker-compose exec card-processor sh -c "node card-processor/scripts/query-db.js <requestId>"
```

### Ver el directorio de datos dentro del contenedor
```bash
docker-compose exec card-issuer ls -la /app/data
```

```bash
docker-compose exec card-processor ls -la /app/data
```

## Consideraciones importantes

- Las bases de datos se mantienen separadas para cada servicio; `card-issuer` y `card-processor` tienen su propio almacenamiento independiente.
- Las tarjetas creadas exitosamente se guardan como evento en el tópico `io.cards.issued.v1` y pueden ser consumidas por otro servicio (Nuevos Servicios que consuman el tópico en cuestión).

### Flag ForceError y reintentos de solicitudes

- Las solicitudes enviadas con `forceError: true` se **persisten en la base de datos** del servicio card-issuer.
- Un cliente (identificado por `documentNumber`) puede enviar múltiples solicitudes de emisión de tarjeta bajo las siguientes condiciones:
  - **Si el intento anterior se realizó con `forceError: true`**, se permite una nueva solicitud con el mismo número de documento.
  - Si la solicitud anterior fue exitosa o todavía está en estado PENDING sin la bandera `forceError`, las presentaciones de documentos duplicados son **rechazadas**.
- Este mecanismo permite a los clientes reintentar la emisión de la tarjeta después de un error simulado (usando `forceError: true`) sin necesitar proporcionar un documento diferente.
- Para futuros casos que no sean errores forzados, el mismo número de documento no debería poder generarse de nuevo cuando ya existe una solicitud válida o pendiente.

### Buenas prácticas aplicadas

- Uso de eventos para desacoplar los componentes y permitir que servicios independientes consuman el mismo flujo de datos.
- Garantizar la confiabilidad del código mediante persistencia de eventos y manejo consistente de estados.
- Monitoreo claro obligatorio a través de la observabilidad de eventos y registros, para detectar y depurar fallos rápidamente.
- Implementación de prácticas de desarrollo seguro: validación de entrada, control de errores y separación de responsabilidades.
- Arquitectura modular y componentes desacoplados para que `card-issuer` y `card-processor` puedan evolucionar de forma independiente.

## Mejoras futuras

- El servicio `card-processor` podría publicar un evento de tarjeta generada al completar el procesamiento exitoso.
- `card-issuer` consumiría ese evento para actualizar el estado de la tarjeta en su propia base de datos.
- Esto reforzaría la sincronización entre servicios y permitiría un flujo de estado más robusto entre emisión y procesamiento.
