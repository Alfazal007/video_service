import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import axios from "axios"
import { DOMAIN } from "../..//constants"
import { useNavigate } from "react-router-dom"

export default function SearchBar() {
    const [query, setQuery] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const route = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    async function querysearchbar() {
        try {
            const filteredLists = await axios.get(`${DOMAIN}/api/v1/search/searchbar/${query}`);
            console.log({ filteredLists });
            setSuggestions(filteredLists.data);
        } catch (err) {
            console.log("cat")
            setSuggestions([])
        }
    }

    useEffect(() => {
        if (query) {
            querysearchbar();
            setShowSuggestions(true)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }, [query])

    async function searchActual(toBeSearched: string) {
        route(`/query/${toBeSearched}`)
        return;
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        searchActual(query);
    }

    const handleSuggestionClick = async (suggestion: string) => {
        setQuery(suggestion)
        setShowSuggestions(false);
        searchActual(suggestion);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-2xl" ref={searchRef}>
                <form onSubmit={handleSubmit} className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-4 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search..."
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <Search size={20} />
                        </button>
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </form>
            </div>
        </div>
    )
}

