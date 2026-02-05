/**
 * Application Entry Point
 * 
 * This is where the React application starts. It mounts our main App component
 * onto the DOM (the 'root' element in index.html).
 * We use StrictMode to help catch potential problems during development.
 * 
 * Author: Drabesh Acharya
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
