import { transcode } from "buffer";
import { Kafka } from "kafkajs";
import { transcodeVideo } from "./transcode";
import { configDotenv } from "dotenv";
import base64 from "base-64";

configDotenv();

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"]
})

const username = process.env.CLOUDINARY_API_KEY as string;
const password = process.env.CLOUDINARY_API_SECRET as string;

const credentials = base64.encode(`${username}:${password}`);

const consumer = kafka.consumer({ groupId: 'my-group' });

const main = async () => {
    const res = await transcodeVideo(1, credentials);
    console.log({ res });
    /*
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
    */
};

main()
