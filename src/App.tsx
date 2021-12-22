import React from 'react';
import './css/App.css';
import DiscripProject from './components/DiscripProject';
import ToRegister from './components/ToRegister';
import ToLogin from './components/ToLogin';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>zkPass</h1>
        <DiscripProject />
        <ToRegister />
        <ToLogin />
      </header>
    </div>
  );
}

export default App;
