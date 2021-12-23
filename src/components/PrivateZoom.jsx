import * as React from 'react';
import ResponsiveAppBar from './HeadBar';
import SocialAppBadgeDone from './SocialAppBadgeDone';
import SocialAppBadge from './SocialAppBadge';
import gmailLogo from '../img/social-logos/gmail-logo.PNG';
import dicordLogo from '../img/social-logos/discord-logo.PNG';
import facebookLogo from '../img/social-logos/facebook-logo.PNG';
import twitterLogo from '../img/social-logos/twitter-logo.PNG';
import linkinLogo from '../img/social-logos/linkin-logo.PNG';
import outlookLogo from '../img/social-logos/outlook-logo.PNG';
import snapchatLogo from '../img/social-logos/snapchat-logo.PNG';
import uportLogo from '../img/social-logos/uport-logo.PNG';
import brightidLogo from '../img/social-logos/brightid-logo.PNG';
import githubLogo from '../img/social-logos/github-logo.PNG';
import Stack from '@mui/material/Stack';

function getSocialDone(){
    return {
        logoUrl: [gmailLogo]
    }
}

function getSocialUnDone(){
    return {
        logoUrl: [dicordLogo, facebookLogo, twitterLogo, linkinLogo, 
                    outlookLogo, snapchatLogo, uportLogo, brightidLogo,
                    githubLogo]
    }
}

export default function PrivateZoom() {
    let socialLogoDoneList = getSocialDone();
    let socialLogoUnDoneList = getSocialUnDone();
    return <div style={{left: '35%', position: 'absolute'}}>
        <ResponsiveAppBar />
        <h2>You have verified:</h2>
        <Stack direction="row" spacing={3}>
        {socialLogoDoneList.logoUrl.map((item, index) => <div style={{cursor: 'pointer'}} key={index}><SocialAppBadgeDone logoUrl={item}/></div>)}
        </Stack>
        <br/>
        <h2>Choose to bind:</h2>
        <Stack direction="row" spacing={2}>
        {socialLogoUnDoneList.logoUrl.slice(0, 4).map((item, index) => <div style={{cursor: 'pointer'}} key={index}><SocialAppBadge logoUrl={item}/></div>)}
        </Stack>
        <br/><br/>
        <Stack direction="row" spacing={2}>
        {socialLogoUnDoneList.logoUrl.slice(4, 8).map((item, index) => <div style={{cursor: 'pointer'}} key={index}><SocialAppBadge logoUrl={item}/></div>)}
        </Stack>
        <br/><br/>
        <Stack direction="row" spacing={2}>
        {socialLogoUnDoneList.logoUrl.slice(8).map((item, index) => <div style={{cursor: 'pointer'}} key={index}><SocialAppBadge logoUrl={item}/></div>)}
        </Stack>
    </div>
}