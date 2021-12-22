import Chip from '@mui/material/Chip';
import { useNavigate } from "react-router-dom";

export default function ToRegister() {
    let navigate = useNavigate();
    return <Chip label="Apply for Your Crypto ID" color="success" variant="outlined" onClick={()=> {
        navigate("/register-email");
    }} />
}
