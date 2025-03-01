import { UserContext } from '../context/UserContext'
import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import SearchBar from './deeperui/searchbar';

export function Landing() {
    const { user } = useContext(UserContext);
    const route = useNavigate();
    useEffect(() => {
        if (!user) {
            route("/home");
            return;
        }
    }, [user])

    return (
        <SearchBar />
    )
}

export default Landing;
