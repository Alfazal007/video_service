import { Consumer, Kafka } from "kafkajs";
import { transcodeVideo } from "./transcode";
import { configDotenv } from "dotenv";
import base64 from "base-64";
import { updateDBAndTellIfNeedToUpdateMaster } from "./updateDB";
import { updateMasterCloudinary } from "./updateMasterFileCloudinary";

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
    await consumer.connect();
    await consumer.subscribe({ topic: 'transcode_normal', fromBeginning: false });
    let heartbeatInterval: any;
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ heartbeat, topic, partition, message }) => {
            try {
                const value = message.value?.toString();
                console.log("New request");
                if (value) {
                    let videoId = parseInt(value);
                    heartbeatInterval = setInterval(async () => {
                        try {
                            await heartbeat();
                            console.log(`Heartbeat sent for video ID: ${videoId}`);
                        } catch (err) {
                            console.warn("Failed to send heartbeat:", err);
                            return;
                        }
                    }, 5000);

                    let [statusOfFFMPEG, creatorId, videoQuality] = await transcodeVideo(videoId, credentials);
                    if (!statusOfFFMPEG) {
                        await retryMessage(consumer, topic, partition, message.offset);
                        return;
                    }
                    if (creatorId) {
                        const publicKeyOfMaster =
                            `${creatorId}/${videoId}/master.m3u8`;
                        // here transcoding normal is done, now to update the database
                        let [commitToKafka, updateMaster] = await updateDBAndTellIfNeedToUpdateMaster(videoId, publicKeyOfMaster);
                        if (!commitToKafka) {
                            await retryMessage(consumer, topic, partition, message.offset);
                            return;
                        }
                        if (updateMaster) {
                            console.log("Update of master file");
                            let masterFileUpdateResult = await updateMasterCloudinary(videoQuality, publicKeyOfMaster);
                            if (!masterFileUpdateResult) {
                                await retryMessage(consumer, topic, partition, message.offset);
                                return;
                            }
                        }
                    }
                }
                await consumer.commitOffsets([
                    { topic, partition, offset: (BigInt(message.offset) + BigInt(1)).toString() }
                ]);
            } catch (err) {
                console.log("Some issue with handling the message ", err);
                consumer.seek({ topic, partition, offset: message.offset });
            } finally {
                clearInterval(heartbeatInterval);
            }
        },
    });
};

main()

async function retryMessage(consumer: Consumer, topic: string, partition: number, offset: string) {
    console.warn(`Retrying message at offset ${offset} in 5s...`);
    await delay(2000);

    consumer.pause([{ topic, partitions: [partition] }]);
    consumer.seek({ topic, partition, offset });
    setImmediate(() => consumer.resume([{ topic, partitions: [partition] }]));
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
