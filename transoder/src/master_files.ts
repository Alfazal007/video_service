import { Quality } from "./transcode";

export function masterFileData(quality: Quality): string {
    if (quality === Quality.v1080) {
        return `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=5711200,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
stream_0/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=3220800,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
stream_1/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1498000,RESOLUTION=854x480,CODECS="avc1.64001f,mp4a.40.2"
stream_480p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=950400,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
stream_2/playlist.m3u8`
    }

    else if (quality === Quality.v720) {
        return `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=3220800,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
stream_0/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1498000,RESOLUTION=854x480,CODECS="avc1.64001f,mp4a.40.2"
stream_480p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=950400,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
stream_1/playlist.m3u8`
    }

    else if (quality === Quality.v480) {
        return `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=1498000,RESOLUTION=854x480,CODECS="avc1.64001f,mp4a.40.2"
stream_480p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=950400,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
stream_0/playlist.m3u8`
    }

    else {
        return ""
    }
}
