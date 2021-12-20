import React from 'react';

let typingCss = {
    color: '#3ffc19',
}

function DiscripProject() {
  return (
    <div>
        <div id='sourceDiscripDiv' style={{'display':'none'}}>
            <span style={typingCss}>zkpass</span> -  is a crypto identity dapp on Mina. <br/>
            <span>it can be both <span style={typingCss}>a wallet based on smart contract</span> and <span style={typingCss}>an identity authenticator</span>.</span> <br/>
            It protects your real wallet address from exposure,  <br/> enables social recovery of wallet without private key, <br/>acts as your passport in crypto world, <br/>and so on.
        </div>
        <div id="output-wrap">
            <span id="targetDiscripDiv"></span>
            <span style={typingCss}>|</span>
        </div>
    </div>
  );
}


export default DiscripProject;

