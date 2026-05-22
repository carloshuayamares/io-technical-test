export const KAFKA_TOPICS = {
  CARD_REQUESTED: 'io.card.requested.v1',
  CARDS_ISSUED: 'io.cards.issued.v1',
  CARD_REQUESTED_DLQ: 'io.card.requested.v1.dlq',
} as const;

export type KafkaTopicKey = keyof typeof KAFKA_TOPICS;
