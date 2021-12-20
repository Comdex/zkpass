import React from 'react';
import logo from './logo.svg';
import './css/App.css';
import DiscripProject from './components/DiscripProject';
import ToRegister from './components/ToRegister';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>zkPass</h1>
        <DiscripProject />
        <ToRegister />
      </header>
    </div>
  );
}

export default App;
