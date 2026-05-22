import { Kafka, Admin, Producer, Consumer } from 'kafkajs';
import { kafkaConfig } from './config';

let kafka: Kafka;
let admin: Admin;

export function getKafkaClient(): Kafka {
  if (!kafka) {
    kafka = new Kafka(kafkaConfig);
  }
  return kafka;
}

export async function getAdmin(): Promise<Admin> {
  if (!admin) {
    admin = getKafkaClient().admin();
    await admin.connect();
  }
  return admin;
}

export async function disconnectAdmin(): Promise<void> {
  if (admin) {
    await admin.disconnect();
    admin = null as any;
  }
}

export function getProducer(): Producer {
  return getKafkaClient().producer();
}

export function getConsumer(groupId: string): Consumer {
  return getKafkaClient().consumer({ groupId });
}
