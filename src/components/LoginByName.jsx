import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import UnstyledButtonCustom from '../components/LoginButton'

const steps = [
  'Register Your Email',
  'Register Your Withdraw Key',
  'Register Your Authorization Key',
];

export default function LoginByName() {
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
        <TextField
          required
          id="uniqueName"
          label="Your unique name in zkPass"
          defaultValue=""
        /><br/>
        <UnstyledButtonCustom />
      </div>
    </Box>
  );
}
