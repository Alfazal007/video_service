import { Kafka } from "kafkajs";
import { transcodeVideo } from "./transcode";
import { configDotenv } from "dotenv";
import base64 from "base-64";
import { updateDBAndTellIfNeedToUpdateMaster } from "./updateDB";
import { updateMasterCloudinary } from "./updateMasterCloudinary";

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
                        }
                    }, 5000);

                    let [canCommitToKafka, creatorId, videoQuality] = await transcodeVideo(videoId, credentials);

                    if (!canCommitToKafka) {
                        return;
                    }

                    if (creatorId) {
                        const publicKeyOfMaster =
                            `${creatorId}/${videoId}/master.m3u8`;
                        let [commitToKafka, updateMaster] = await updateDBAndTellIfNeedToUpdateMaster(videoId, publicKeyOfMaster);
                        if (!commitToKafka) {
                            return;
                        }
                        if (updateMaster) {
                            console.log("Inside update of master file");
                            let masterFileUpdateResult = await updateMasterCloudinary(videoQuality, publicKeyOfMaster);
                            if (!masterFileUpdateResult) {
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
            } finally {
                clearInterval(heartbeatInterval);
            }
        },
    });
};

main()
