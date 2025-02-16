import { transcode } from "buffer";
import { Kafka } from "kafkajs";
import { transcodeVideo } from "./transcode";

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"]
})

const consumer = kafka.consumer({ groupId: 'my-group' });

const main = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'transcode', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const value = message.value?.toString();
                if (value) {
                    let videoId = parseInt(value);
                    transcodeVideo(videoId);
                }
                await consumer.commitOffsets([
                    { topic, partition, offset: (BigInt(message.offset) + BigInt(1)).toString() }
                ]);
            } catch (err) {
                console.log("Some issue with handling the message ", err);
            }
        },
    });
};

main()
