import { getAdmin } from './client';
import { KAFKA_TOPICS } from './topics';
import { topicConfig, dlqTopicConfig } from './config';

export async function initializeTopics(): Promise<void> {
  const admin = await getAdmin();

  const topicsToCreate = [
    {
      topic: KAFKA_TOPICS.CARD_REQUESTED,
      ...topicConfig,
    },
    {
      topic: KAFKA_TOPICS.CARDS_ISSUED,
      ...topicConfig,
    },
    {
      topic: KAFKA_TOPICS.CARD_REQUESTED_DLQ,
      ...dlqTopicConfig,
    },
  ];

  try {
    const existingTopics = await admin.fetchTopicMetadata({
      topics: Object.values(KAFKA_TOPICS),
    });

    const existingTopicNames = new Set(
      existingTopics.topics.map(t => t.name)
    );

    const topicsToCreateFiltered = topicsToCreate.filter(
      t => !existingTopicNames.has(t.topic)
    );

    if (topicsToCreateFiltered.length > 0) {
      await admin.createTopics({
        topics: topicsToCreateFiltered,
        validateOnly: false,
        timeout: 30000,
      });

      console.log(
        `✅ Topics created successfully: ${topicsToCreateFiltered.map(t => t.topic).join(', ')}`
      );
    } else {
      console.log('✅ All topics already exist');
    }
  } catch (error) {
    console.error('❌ Error initializing topics:', error);
    throw error;
  }
}
