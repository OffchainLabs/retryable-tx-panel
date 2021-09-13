import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import logo from "./logo.svg";

ReactDOM.render(
  <React.StrictMode>
    <div className="Header">
      <header className="Header-header">
        <h2>Arbitrum Retryable Dashboard</h2>
        <img src={logo} className="Header-logo" alt="logo" />
        <App />
      </header>
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);
