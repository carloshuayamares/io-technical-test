import { KafkaConfig } from 'kafkajs';

export const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'app-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL_ENABLED === 'true' ? {
    mechanism: (process.env.KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512') || 'plain',
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || '',
  } : undefined,
};

export const topicConfig = {
  numPartitions: parseInt(process.env.KAFKA_TOPIC_PARTITIONS || '3', 10),
  replicationFactor: parseInt(process.env.KAFKA_TOPIC_REPLICATION_FACTOR || '1', 10),
  configEntries: [
    { name: 'retention.ms', value: (7 * 24 * 60 * 60 * 1000).toString() }, // 7 days
  ],
};

export const dlqTopicConfig = {
  numPartitions: 1,
  replicationFactor: topicConfig.replicationFactor,
  configEntries: [
    { name: 'retention.ms', value: (30 * 24 * 60 * 60 * 1000).toString() }, // 30 days
  ],
};
