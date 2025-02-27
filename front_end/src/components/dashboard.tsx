import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
    const route = useNavigate();
    const [username, setUsername] = useState("")

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem("user")
        if (!storedUser) {
            route("/signin")
            return
        }

        const user = JSON.parse(storedUser)
        setUsername(user.username)
    }, [route])

    const handleSignOut = () => {
        localStorage.removeItem("user")
        route("/signin")
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-red-600">VideoHub</h1>
                    <div className="flex items-center gap-4">
                        <span>Welcome, {username}</span>
                        <Button variant="outline" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold">Dashboard</h2>
                    <p className="mt-4">You are now signed in to your account.</p>
                </div>
            </div>
        </div>
    )
}

