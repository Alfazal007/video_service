import { BrowserRouter } from 'react-router-dom'
import './App.css'
import { Routes } from 'react-router-dom'
import { Route } from 'react-router-dom'
import Dashboard from './components/dashboard'
import Home from './components/home'
import SignInPage from './components/signin'
import SignUpPage from './components/signup'
import UserProvider from './context/UserContext'
import Landing from './components/landing'

export interface User {
    accessToken: string;
    userId: number;
}

function App() {
    return (
        <>
            <UserProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="signin" element={<SignInPage />} />
                        <Route path="signup" element={<SignUpPage />} />
                    </Routes>
                </BrowserRouter>
            </UserProvider>
        </>
    )
}

// TODO:: Add search, watch-video, create-video-metadata and get video url, upload-video, start-transcoding, get-thumbnail, upload-thumbnail

export default App
