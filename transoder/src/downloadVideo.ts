import fs from 'fs';
import path from 'path';
import { getAllFilePaths } from './cloudinary';

export async function downloadVideo(): Promise<boolean> {
    const folderPath = path.join(__dirname, "../videosFFMPEG/");
    const deleteSuccess = await deleteFilesInFolder(folderPath);
    if (!deleteSuccess) {
        return false;
    }
    return true;
}

async function deleteFilesInFolder(folderPath: string): Promise<boolean> {
    console.log("deletion video started");
    try {
        const files = await fs.promises.readdir(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isDirectory()) {
                await deleteFilesInFolder(filePath);
                try {
                    await fs.promises.rmdir(filePath);
                } catch (err) {
                    console.error(`Could not delete folder ${filePath}:`, err);
                    return false;
                }
            } else {
                await fs.promises.unlink(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
        }
        return true;
    } catch (err) {
        console.error("Error deleting files or folders:", err);
        return false;
    } finally {
        console.log("deletion video ended");
    }

    /*
    const folderPath = path.join(__dirname, "../videosFFMPEG/");
    const files = await getAllFilePaths(folderPath);
    try {
        files.forEach((file) => {
            fs.unlinkSync(file);
            console.log(`Deleted file: ${file} `);
        });
        console.log("All files deleted.");
        return true;
    } catch (err) {
        console.error('Error reading or deleting files in the directory:', err);
        return false;
    }
    */
}

