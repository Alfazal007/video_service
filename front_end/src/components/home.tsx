import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 px-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-red-600">VideoHub</h1>
                    <p className="mt-2 text-gray-600">Your favorite video platform</p>
                </div>
                <div className="mt-8 flex flex-col space-y-4">
                    <Link to="/signin" className="w-full">
                        <Button className="w-full bg-red-600 hover:bg-red-700">Sign In</Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                        <Button variant="outline" className="w-full">
                            Create Account
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

