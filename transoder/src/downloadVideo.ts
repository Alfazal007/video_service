import fs from 'fs';
import path from 'path';

export async function downloadVideo(public_id: string): Promise<boolean> {
    const videoUrl = `https://res.cloudinary.com/itachinftvr/video/upload/${public_id}`;
    const filePath = `videosFFMPEG/new_video.mp4`;
    const deleteSuccess = deleteFilesInFolder();
    if (!deleteSuccess) {
        return false;
    }
    // run the following here
    // sudo docker run --rm -v /home/itachi/Downloads/project/youtube/transoder/videosFFMPEG:/mnt jrottenberg/ffmpeg -i "https://res.cloudinary.com/itachinftvr/video/upload/<public_id>" /mnt/video_output.avi
    return true;
}

function deleteFilesInFolder(): boolean {
    const folderPath = path.join(__dirname, "../videosFFMPEG/");
    try {
        const files = fs.readdirSync(folderPath);
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            // Delete each file synchronously
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
        });
        console.log("All files deleted.");
        return true;
    } catch (err) {
        console.error('Error reading or deleting files in the directory:', err);
        return false;
    }
}

