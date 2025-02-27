import type React from "react"

import { useContext, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { AlertCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { DOMAIN } from "../../constants"
import { UserContext } from "../../context/UserContext"

export function SignInForm() {
    const { setUser } = useContext(UserContext);
    const route = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!username || !password) {
            setError("Username and password are required")
            return
        }

        if (username.length < 6 || username.length > 20) {
            setError("Username should be of the length between 6 and 20")
            return
        }

        if (password.length < 6 || password.length > 20) {
            setError("Password should be of the length between 6 and 20")
            return
        }

        setLoading(true)

        try {
            const signInRes = await axios.post(`${DOMAIN}/api/v1/user/login`, {
                username,
                password
            }, {
                withCredentials: true
            });
            console.log({ signInRes })
            if (signInRes.status != 200) {
                setError(signInRes.data.errors);
                return;
            }
            setUser({
                userId: signInRes.data.userId,
                accessToken: signInRes.data.accessToken
            })
            route("/")
        } catch (err) {
            // @ts-ignore
            setError(err.response.data.errors)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
            </Button>
        </form>
    )
}

