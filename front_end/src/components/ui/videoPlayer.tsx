import { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import 'jb-videojs-hls-quality-selector';

export const VideoPlayer = ({ videoLink }: { videoLink: string }) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    const options = {
        controls: true,
        responsive: true,
        fluid: true,
        autoplay: false,
        sources: [
            {
                src: videoLink,
                type: "application/x-mpegURL"
            }
        ]
    }

    // @ts-ignore
    const onReady = (player) => {
        playerRef.current = player;
        player.hlsQualitySelector({
            displayCurrentQuality: true,
        });
        player.on("waiting", () => {
            videojs.log("player is waiting");
        });
        player.on("dispose", () => {
            videojs.log("player will dispose");
        });
    };

    useEffect(() => {
        if (!playerRef.current) {
            const videoElement = document.createElement("video-js");

            videoElement.classList.add("vjs-big-play-centered");
            videoRef.current?.appendChild(videoElement);

            const player = (playerRef.current = videojs(videoElement, options, () => {
                videojs.log("player is ready");
                onReady && onReady(player);
            }));

        } else {
            const player = playerRef.current;

            player.autoplay(options.autoplay);
            player.src(options.sources);
        }
    }, [options, videoRef]);


    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div
            data-vjs-player
            className="w-full h-full"
        >
            <div ref={videoRef} />
            {videoLink}
        </div>
    );
};

export default VideoPlayer;

