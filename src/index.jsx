import React from 'react';
import ReactDOM from 'react-dom/client';
import KeycloakBootstrap from './KeycloakBootstrap';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <KeycloakBootstrap />
  </React.StrictMode>,
);
