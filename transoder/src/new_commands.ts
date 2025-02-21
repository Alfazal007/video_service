import path from "path";
import { Quality } from "./transcode";

export function commandReturner(videoUrl: string, quality: Quality): string {
    const folderToRun = path.join(__dirname, "../videosFFMPEG/");

    if (quality == Quality.v1080) {
        return `cd ${folderToRun} && \
            ffmpeg -i "${videoUrl}" \
            -filter_complex \
                "[0:v]split=3[v1][v2][v3]; \
                [v1]scale=w=1920:h=1080[v1out]; \
                [v2]scale=w=1280:h=720[v2out]; \
                [v3]scale=w=640:h=360[v3out]" \
            -map "[v1out]" -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 7500k \
            -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate:v:1 2996k -bufsize:v:1 4200k \
            -map "[v3out]" -c:v:2 libx264 -b:v:2 800k -maxrate:v:2 856k -bufsize:v:2 1200k \
            -map a:0 -c:a aac -b:a:0 192k -ac 2 \
            -map a:0 -c:a aac -b:a:1 128k -ac 2 \
            -map a:0 -c:a aac -b:a:2 64k -ac 2 \
            -f hls \
            -hls_time 5 \
            -hls_playlist_type vod \
            -hls_flags independent_segments \
            -hls_segment_type mpegts \
            -hls_segment_filename stream_%v/data%03d.ts \
            -master_pl_name master.m3u8 \
            -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
            stream_%v/playlist.m3u8`
    }

    else if (quality == Quality.v720) {
        return `cd ${folderToRun} && \
            ffmpeg -i "${videoUrl}" \
            -filter_complex \
                "[0:v]split=2[v1][v2]; \
                [v1]scale=w=1280:h=720[v1out]; \
                [v2]scale=w=640:h=360[v2out]" \
            -map "[v1out]" -c:v:0 libx264 -b:v:0 2800k -maxrate:v:0 2996k -bufsize:v:0 4200k \
            -map "[v2out]" -c:v:1 libx264 -b:v:1 800k -maxrate:v:1 856k -bufsize:v:1 1200k \
            -map a:0 -c:a aac -b:a:0 128k -ac 2 \
            -map a:0 -c:a aac -b:a:1 64k -ac 2 \
            -f hls \
            -hls_time 5 \
            -hls_playlist_type vod \
            -hls_flags independent_segments \
            -hls_segment_type mpegts \
            -hls_segment_filename stream_%v/data%03d.ts \
            -master_pl_name master.m3u8 \
            -var_stream_map "v:0,a:0 v:1,a:1" \
            stream_%v/playlist.m3u8`
    }

    else if (quality == Quality.v480) {
        return `cd ${folderToRun} && \
                ffmpeg -i "${videoUrl}" \
                -filter_complex \
                    "[0:v]scale=w=640:h=360[vout]" \
                -map "[vout]" -c:v libx264 -b:v 800k -maxrate 856k -bufsize 1200k \
                -map a:0 -c:a aac -b:a 64k -ac 2 \
                -f hls \
                -hls_time 5 \
                -hls_playlist_type vod \
                -hls_flags independent_segments \
                -hls_segment_type mpegts \
                -hls_segment_filename stream_%v/data%03d.ts \
                -master_pl_name master.m3u8 \
                -var_stream_map "v:0,a:0" \
                stream_%v/playlist.m3u8`
    }

    else {
        return `cd ${folderToRun} && \
                ffmpeg -i "${videoUrl}" \
                -filter_complex \
                    "[0:v]scale=w=640:h=360[vout]" \
                -map "[vout]" -c:v libx264 -b:v 800k -maxrate 856k -bufsize 1200k \
                -map a:0 -c:a aac -b:a 64k -ac 2 \
                -f hls \
                -hls_time 5 \
                -hls_playlist_type vod \
                -hls_flags independent_segments \
                -hls_segment_type mpegts \
                -hls_segment_filename stream_%v/data%03d.ts \
                -master_pl_name master.m3u8 \
                -var_stream_map "v:0,a:0" \
                stream_%v/playlist.m3u8`
    }
}
