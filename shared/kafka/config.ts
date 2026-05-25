import { KafkaConfig, SASLOptions } from 'kafkajs';

type KafkaSaslMechanism = 'plain' | 'scram-sha-256' | 'scram-sha-512';

const kafkaSaslEnabled = process.env.KAFKA_SASL_ENABLED === 'true';
const kafkaSaslMechanism = process.env.KAFKA_SASL_MECHANISM as KafkaSaslMechanism | undefined;
const kafkaSaslUsername = process.env.KAFKA_SASL_USERNAME || '';
const kafkaSaslPassword = process.env.KAFKA_SASL_PASSWORD || '';

const getSaslConfig = (): SASLOptions | undefined => {
  if (!kafkaSaslEnabled) {
    return undefined;
  }

  switch (kafkaSaslMechanism) {
    case 'scram-sha-256':
      return {
        mechanism: 'scram-sha-256',
        username: kafkaSaslUsername,
        password: kafkaSaslPassword,
      };
    case 'scram-sha-512':
      return {
        mechanism: 'scram-sha-512',
        username: kafkaSaslUsername,
        password: kafkaSaslPassword,
      };
    default:
      return {
        mechanism: 'plain',
        username: kafkaSaslUsername,
        password: kafkaSaslPassword,
      };
  }
};

export const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'app-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: getSaslConfig(),
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
