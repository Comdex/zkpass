import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import reportWebVitals from './reportWebVitals';
import BaseRouter from './router/router';

ReactDOM.render(
  <React.StrictMode>
    <BaseRouter />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
