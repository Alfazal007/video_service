import { Link } from "react-router-dom"
import { SignInForm } from "./deeperui/signinform"

export default function SignInPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-red-600">VideoHub</h1>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
                </div>
                <SignInForm />
                <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link to="/signup" className="font-medium text-red-600 hover:text-red-500">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}

