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
  'Register Your Withdraw&Authorization Key',
  'Register Your Authorization Key',
];

export default function RegisterKeysForm() {
  let navigate = useNavigate();

  return (
    <div style={{left: '25%', position: 'absolute', width:'50%'}}>
      <Box
        component="form"
        sx={{
          '& .MuiTextField-root': { m: 1, width: '45ch' },
        }}
        noValidate
        autoComplete="off"
      >
        <div>
        <Stepper activeStep={1} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <br/>
          <TextField
            required
            id="uniqueName"
            label="Your unique name in zkPass"
            defaultValue=""
          /><br/>
          <TextField
            required
            id="email"
            label="Your Email"
            defaultValue=""
          /><br/>
          <TextField
            required
            id="withdrawKey"
            label="Withdrawing Public Key"
            defaultValue=""
          /><br/>
          <TextField
            required
            id="authKey"
            label="Authorization Public Key"
            defaultValue=""
            size='large'
          /><br/>
          <Button variant="outlined" size="large" onClick={()=> {
            console.log('trigger wallet to sign');
            navigate("/register-success");}}>go next</Button><br/>
        </div>
      </Box>
    </div>
  );
}
