import { Consumer, Kafka } from "kafkajs";
import { transcodeVideo } from "./transcode";
import { configDotenv } from "dotenv";
import base64 from "base-64";
import { updateDBAndTellIfNeedToUpdateMaster } from "./updateDB";
import { updateMasterCloudinary } from "./updateMasterCloudinary";
import { updateMasterCloudinaryFOUREIGHTY } from "./updateFourEightyCloudinary";
import { create } from "domain";

configDotenv();

const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"]
})

const username = process.env.CLOUDINARY_API_KEY as string;
const password = process.env.CLOUDINARY_API_SECRET as string;


const credentials = base64.encode(`${username}:${password}`);

const consumer = kafka.consumer({ groupId: 'my-group-1' });

const main = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'transcode_480', fromBeginning: false });
    let heartbeatInterval: any;
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ heartbeat, topic, partition, message }) => {
            try {
                const value = message.value?.toString();
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

                    let [canCommitToKafka, creatorId, videoQuality] = await transcodeVideo(videoId, credentials);

                    if (!canCommitToKafka) {
                        await retryMessage(consumer, topic, partition, message.offset);
                        return;
                    }

                    if (creatorId) {
                        const publicKeyOfMaster =
                            `${creatorId}/${videoId}/master.m3u8`;
                        let [commitToKafka, updateMaster] = await updateDBAndTellIfNeedToUpdateMaster(videoId, publicKeyOfMaster);
                        if (!commitToKafka) {
                            await retryMessage(consumer, topic, partition, message.offset);
                            return;
                        }

                        if (updateMaster) {
                            console.log("Inside update of master file");
                            let masterFileUpdateResult = await updateMasterCloudinary(videoQuality, publicKeyOfMaster);
                            if (!masterFileUpdateResult) {
                                await retryMessage(consumer, topic, partition, message.offset);
                                return;
                            }
                        } else {
                            let publicKeyTemp = `${creatorId}/${videoId}/temp.m3u8`
                            let masterFileUpdateResult = await updateMasterCloudinaryFOUREIGHTY(videoQuality, publicKeyTemp);
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
                await retryMessage(consumer, topic, partition, message.offset);
            } finally {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
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
