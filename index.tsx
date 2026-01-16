import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./index.css";


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
console.log(import.meta.env.VITE_GEMINI_API_KEY);


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);