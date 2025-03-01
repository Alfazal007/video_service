import { Link } from "react-router-dom";
import { SearchItems } from "../searchedVideos"

export default function SearchResults({ searchResults }: { searchResults: SearchItems[] }) {
    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            <div className="space-y-4">
                {searchResults.map((video) => (
                    <div key={video.video_id} className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-shrink-0">
                            <Link to={`/video/${video.creator_id}/${video.video_id}`}>
                                <img
                                    src={`http://res.cloudinary.com/itachinftvr/image/upload/${video.creator_id}/thumbnail/${video.video_id}`}
                                    alt={`Thumbnail for ${video.title}`}
                                    width={320}
                                    height={180}
                                    className="rounded-lg w-full sm:w-[180px] object-cover aspect-video"
                                />
                            </Link>
                        </div>

                        <div className="flex-grow">
                            <Link to={`/video/${video.creator_id}/${video.video_id}`} className="block">
                                <h2 className="text-base font-semibold line-clamp-2 mb-1">{video.title}</h2>
                            </Link>
                            <div className="text-sm text-muted-foreground">
                                <p>{video.creator_id}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

