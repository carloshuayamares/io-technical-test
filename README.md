# Technical Test - Card Issuer and Processor

This project contains a distributed system for card issuing and processing using Kafka as the message broker.

## Project Structure

- **shared/**: Shared code, types, utilities, and configurations
  - `types/`: TypeScript type definitions
  - `kafka/`: Kafka client configuration and utilities
  - `logger/`: Logging utilities
  - `utils/`: Common utility functions
  - `constants/`: Application constants

- **card-issuer/**: Service responsible for issuing cards
  - `src/controllers/`: API controllers
  - `src/services/`: Business logic
  - `src/repositories/`: Data access layer
  - `src/validators/`: Input validation
  - `src/kafka/`: Kafka producer for card events

- **card-processor/**: Service responsible for processing card events
  - `src/consumers/`: Kafka consumers
  - `src/services/`: Business logic
  - `src/retry/`: Retry logic for failed events
  - `src/kafka/`: Kafka consumer configuration

## Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Running the Application

```bash
docker-compose up
```

## Architecture

The system consists of two main services:

1. **Card Issuer**: Handles card creation and generates events
2. **Card Processor**: Consumes card events and processes them

Communication between services is facilitated through Kafka topics.
