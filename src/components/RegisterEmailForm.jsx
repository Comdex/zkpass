import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom";

const steps = [
  'Register Your Email',
  'Register Your Withdraw Key',
  'Register Your Authorization Key',
];

export default function RegisterEmailForm() {
  let navigate = useNavigate();

  return (
    <Box
      component="form"
      sx={{
        '& .MuiTextField-root': { m: 1, width: '45ch' },
      }}
      noValidate
      autoComplete="off"
    >
      <div>
        <Stepper activeStep={0} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          <TextField required id="email" label="Your Email" defaultValue="" size="large"/>
          <Button variant="outlined" size="large">verify</Button><br/>
        </div>
        <TextField required id="verificationCode" label="input verification code " defaultValue="" /><br/>
        <Button variant="outlined" size="large" onClick={()=> {navigate("/register-keys");}}>go next</Button><br/>
      </div>
    </Box>
  );
}
