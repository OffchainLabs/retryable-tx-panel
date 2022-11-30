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
import { isValidTxHash } from "./isValidTxHash";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: ({ params }) => {
      // If the app was accessed through old URL format, redirect
      const oldTxHash = new URLSearchParams(window.location.search).get("t");
      const { txHash } = params;

      // This loader is executed when accessing tx/:txhash, we need this check to avoid infinite loop
      if (txHash || !oldTxHash) {
        return;
      }

      if (isValidTxHash(oldTxHash)) {
        return redirect(`tx/${oldTxHash}`);
      }
    },
    children: [
      {
        path: "tx",
        element: null,
        loader: ({ params }) => {
          const { txHash } = params;
          if (!txHash || !isValidTxHash(txHash)) {
            return redirect("/");
          }
        },
        children: [
          {
            path: "/tx/:txHash",
            element: null
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
