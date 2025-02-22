import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

const uploadToCloudinary = (buffer: Buffer, userId: number, path: string, fileName: string, projectId: number) => {
    cloudinary.config({
        cloud_name: 'itachinftvr',
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string
    });

    return new Promise((resolve, reject) => {
        const index = path.indexOf("videosFFMPEG")
        const pathCloudinary = path.substring(index + 13)
        const updatedFolder = pathCloudinary.replace(fileName, "")
        const stream = cloudinary.uploader.upload_stream(
            {
                unique_filename: false,
                overwrite: true,
                resource_type: "raw",
                folder: `/${userId}/${projectId}/${updatedFolder}`,
                public_id: `${fileName}`,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export async function createCloudinaryData(userId: number, videoId: number): Promise<boolean> {
    const targetFolder = path.join(__dirname, `../videosFFMPEG/`)
    try {
        const files = await getAllFilePaths(targetFolder);
        const uploads = files.map(async (filePath) => {
            const buffer = await fs.promises.readFile(filePath);
            return uploadToCloudinary(buffer, userId, filePath, path.basename(filePath), videoId);
        });
        await Promise.all(uploads);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getAllFilePaths(folderPath: string) {
    const filePaths: string[] = [];
    async function traverse(currentPath: string) {
        const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(currentPath, item.name);
            if (item.isDirectory()) {
                await traverse(fullPath);
            } else if (item.isFile()) {
                filePaths.push(fullPath);
            }
        }
    }
    await traverse(folderPath);
    return filePaths;
}
