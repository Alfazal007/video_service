import fs from 'fs';
import path from 'path';
import { getAllFilePaths } from './cloudinary';

export async function downloadVideo(): Promise<boolean> {
    const deleteSuccess = await deleteFilesInFolder();
    if (!deleteSuccess) {
        return false;
    }
    return true;
}

async function deleteFilesInFolder(): Promise<boolean> {
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
}

