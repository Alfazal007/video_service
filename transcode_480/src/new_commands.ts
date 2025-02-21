import path from "path";

export function commandReturner(videoUrl: string): string {
    const folderToRun = path.join(__dirname, "../videosFFMPEG/");

    return `cd ${folderToRun} && \
            mkdir -p stream_480p && \
            ffmpeg -i "${videoUrl}" \
                -filter_complex "[0:v]scale=w=854:h=480[vout]" \
                -map "[vout]" -c:v libx264 -b:v 1400k -maxrate 1498k -bufsize 2100k \
                -map a:0 -c:a aac -b:a 96k -ac 2 \
                -f hls \
                -hls_time 5 \
                -hls_playlist_type vod \
                -hls_flags independent_segments \
                -hls_segment_type mpegts \
                -hls_segment_filename "stream_480p/data%03d.ts" \
                stream_480p/playlist.m3u8 && \
            echo '#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=1498000,RESOLUTION=854x480,CODECS="avc1.64001f,mp4a.40.2"
stream_480p/playlist.m3u8' > master.m3u8`
}

/*
                -hls_segment_filename stream_%v/data%03d.ts \
                -master_pl_name master.m3u8 \
                -var_stream_map "v:0,a:0" \
                stream_%v/playlist.m3u8`
        */
