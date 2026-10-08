import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';


// Suppress harmless MetaMask errors from browser extensions
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('MetaMask') || e.message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn'))) {
    e.stopImmediatePropagation();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && (e.reason.message && (e.reason.message.includes('MetaMask') || e.reason.message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')))) {
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
