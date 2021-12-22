import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from '../App';
import RegisterEmailForm from '../components/RegisterEmailForm';
import RegisterKeysForm from '../components/RegisterKeysForm';
import RegisterSuccess from '../components/RegisterSuccess';
import PrivateZoom from '../components/PrivateZoom';
import LoginByName from '../components/LoginByName';
import { Link } from "react-router-dom";

const BaseRouter = () => {
    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<App />}></Route>
                <Route exact path="/log-in-by-name" element={<LoginByName />}></Route>
                <Route exact path="/register-email" element={<RegisterEmailForm />}></Route>
                <Route exact path="/register-keys" element={<RegisterKeysForm />}></Route>
                <Route exact path="/register-success" element={<RegisterSuccess />}></Route>
                <Route exact path="/private-zoom" element={<PrivateZoom />}></Route>
                
                <Route path="*" element={<main style={{ padding: "1rem" }}>
                    <p>There's nothing here!</p>
                    <p><Link to="/register-email">go register!</Link></p>
                    <p><Link to="/">go log in!</Link></p>
                    </main>} />
            </Routes>
        </Router>
    )
}

export default BaseRouter