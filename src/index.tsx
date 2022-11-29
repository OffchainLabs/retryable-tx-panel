import React from "react";
import ReactDOM from "react-dom";
import {
  createBrowserRouter,
  RouterProvider,
  redirect
} from "react-router-dom";
import "./index.css";
import App from "./App";
import logo from "./logo.svg";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: ({ params }) => {
      // If the app was accessed through old URL format, redirect
      const txhash = new URLSearchParams(window.location.search).get("t");

      // This loader is executed when accessing tx/:txhash, we need this check to avoid infinite loop
      if (txhash?.length === 66 && !params.txhash) {
        return redirect(`tx/${txhash}`);
      }
    },
    children: [
      {
        path: "tx",
        element: null,
        loader: ({ params }) => {
          const { txhash } = params;
          if (!txhash || txhash.length !== 66) {
            return redirect("/");
          }
        },
        children: [
          {
            path: "/tx/:txhash",
            element: <App />
          }
        ]
      }
    ]
  }
]);

ReactDOM.render(
  <React.StrictMode>
    <div className="Header">
      <header className="Header-header">
        <h2>Arbitrum Cross-chain Message Dashboard</h2>
        <img src={logo} className="Header-logo" alt="logo" />
        <RouterProvider router={router} />
      </header>
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);
