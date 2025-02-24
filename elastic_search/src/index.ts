import { Consumer, Kafka } from "kafkajs";
import { configDotenv } from "dotenv";
import { indexToElasticSearch } from "./indexToElasticSearch";

configDotenv();

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"]
})

const consumer = kafka.consumer({ groupId: 'my-group-2' });

const main = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'elastic_search', fromBeginning: false });
    let heartbeatInterval: any;
    await consumer.run({
        eachBatchAutoResolve: false,
        eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
            const topic = batch.topic;
            const partition = batch.partition;

            for (const message of batch.messages) {
                if (!isRunning() || isStale()) break;
                console.log({ message })
                const value = message.value?.toString();
                if (value) {
                    let videoId = parseInt(value);

                    try {
                        heartbeatInterval = setInterval(async () => {
                            try {
                                await heartbeat();
                                console.log(`Heartbeat sent for video ID: ${videoId}`);
                            } catch (err) {
                                console.warn("Failed to send heartbeat:", err);
                                return;
                            }
                        }, 5000);

                        /*                        let indexIntoElasticSearch = await indexToElasticSearch(videoId);
                        if (!indexIntoElasticSearch) {
                            await retryMessage(consumer, topic, partition, message.offset);
                            return;
                        }
*/
                        await consumer.commitOffsets([
                            { topic, partition, offset: (BigInt(message.offset) + BigInt(1)).toString() }
                        ]);
                    }
                    catch (err) { }
                    finally {
                        if (heartbeatInterval) {
                            clearInterval(heartbeatInterval);
                        }
                    }
                    resolveOffset(message.offset);
                }
            }
        },
    });
};

main()
//createMapping()

async function retryMessage(consumer: Consumer, topic: string, partition: number, offset: string) {
    console.warn(`Retrying message at offset ${offset} in 5s...`);
    await delay(2000);

    consumer.pause([{ topic, partitions: [partition] }]);
    consumer.seek({ topic, partition, offset });
    setImmediate(() => consumer.resume([{ topic, partitions: [partition] }]));
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
