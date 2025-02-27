import { UserContext } from '../context/UserContext'
import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

export function Landing() {
    const { user } = useContext(UserContext);
    const route = useNavigate();
    useEffect(() => {
        if (!user) {
            route("/signin");
            return;
        }
    }, [user])

    return (
        JSON.stringify(user)
    )
}

export default Landing
