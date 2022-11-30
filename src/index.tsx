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
    children: [
      {
        path: "tx",
        element: null,
        loader: ({ params }) => {
          if (!isValidTxHash(params.txHash)) {
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
