import { Link } from "react-router-dom";
import { SignUpForm } from "./deeperui/signupform";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-red-600">VideoHub</h1>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Create your account</h2>
                </div>
                <SignUpForm />
                <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/signin" className="font-medium text-red-600 hover:text-red-500">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

