import fs from 'fs';
import path from 'path';

export async function deleteExistingFiles(): Promise<boolean> {
    const folderPath = path.join(__dirname, "../videosFFMPEG/");
    const deleteSuccess = await deleteFilesInFolder(folderPath);
    if (!deleteSuccess) {
        return false;
    }
    return true;
}

async function deleteFilesInFolder(folderPath: string): Promise<boolean> {
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
            }
        }
        return true;
    } catch (err) {
        console.error("Error deleting files or folders:", err);
        return false;
    }
}
