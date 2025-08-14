
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * @what This is the main entry point for the React application.
 * @why It finds the root HTML element and renders the main `App` component into it.
 * @how It uses `ReactDOM.createRoot` to initialize the React root, which enables concurrent features.
 * The `<React.StrictMode>` wrapper is used to highlight potential problems in the application during development.
 */

// Find the root DOM element where the React app will be mounted.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a React root for the `rootElement`.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component into the root.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);