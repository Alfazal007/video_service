import { Button } from "../components/ui/button"
import { Play, Volume2, SkipForward, Maximize } from "lucide-react"
import { Slider } from "../components/ui/slider"
import { useEffect, useState } from "react"
import axios from "axios"
import { DOMAIN } from "../constants"
import { useNavigate, useParams } from "react-router-dom"
import VideoPlayer from "./ui/videoPlayer"

type Video = {
    id: number,
    creator_id: number,
    title: string,
    normal_done: number,
    foureighty_done: boolean
}

export default function YouTubeVideoPage() {
    const { creatorId, videoId } = useParams();
    const [video, setVideo] = useState<null | Video>(null);
    const route = useNavigate();

    async function getVideo() {
        try {
            let videoResponse = await axios.get(`${DOMAIN}/api/v1/viewVideo/${creatorId}/${videoId}`);
            if (videoResponse.status == 200) {
                setVideo(videoResponse.data);
            }
        } catch (err) {
            setVideo(null);
            route("/");
        }
    }

    useEffect(() => {
        getVideo();
    }, []);


    return (
        video &&
        <div className="container mx-auto max-w-4xl py-8 px-4">
            {/* Video Player */}
            <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video mb-4">
                <VideoPlayer videoLink={`https://res.cloudinary.com/itachinftvr/raw/upload/${video.creator_id}/${video.id}/${video.normal_done ? "master.m3u8" : "temp.m3u8"}`} />
            </div>

            <h1 className="text-xl font-bold mb-3">{video.title}</h1>

            <div className="flex items-center gap-3">
                <div>
                    <h2 className="font-medium">{video.creator_id}</h2>
                </div>
            </div>
        </div>
    )
}

