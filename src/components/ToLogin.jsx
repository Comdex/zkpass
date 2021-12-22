import Chip from '@mui/material/Chip';
import { useNavigate } from "react-router-dom";

export default function ToLogin() {
    let navigate = useNavigate();
    return <Chip label="Go Log In" color="primary" variant="outlined" onClick={()=> {
        navigate("/log-in-by-name");
    }} />
}
