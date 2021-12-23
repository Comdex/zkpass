import * as React from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { Link } from 'react-router-dom';

const steps = [
  'Register Your Email',
  'Register Your Withdraw&Authorization Key',
  'Register Done!',
];

export default function RegisterSuccess() {
  return (
    <div style={{left: '25%', position: 'absolute', width:'50%'}}>
      <Stepper activeStep={3} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <br/>
      <div>
        <p>Congratulations! You got Your Unique Name in zkPass!</p>
        <p>Now, Please head to
          <Link to="/private-zoom">your private zoom</Link>
        </p>
      </div>
      </div>
  );
}
