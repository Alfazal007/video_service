import { DOMAIN } from "../constants";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useNavigationType, useParams } from "react-router-dom";
import SearchResults from "./deeperui/searchResult";

export type SearchItems = {
    video_id: number,
    creator_id: number,
    title: string,
}

export const SearchedVideos = () => {
    const { query } = useParams();
    const [isError, setIsError] = useState(false);
    const route = useNavigate();
    const [searchedRes, setSearchedRes] = useState<SearchItems[]>([]);

    useEffect(() => {
        if (isError) {
            route("/");
            return;
        }
    }, [isError])

    async function fetchData() {
        try {
            const response = await axios.get(`${DOMAIN}/api/v1/search/searchlist/${query}`);
            setSearchedRes(response.data);
        } catch (err) {
            setIsError(true)
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <SearchResults searchResults={searchedRes} />
    )
}
