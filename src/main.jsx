import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DisplayScreen from './DisplayScreen.jsx'

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/display' ? <DisplayScreen /> : <App />}
  </React.StrictMode>,
)
