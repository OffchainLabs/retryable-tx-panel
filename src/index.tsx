import React from "react";
import ReactDOM from "react-dom";
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
  matchRoutes,
  redirect
} from "react-router-dom";
import "./index.css";
import App from "./App";
import { WagmiProvider } from "./WagmiProvider";
import logo from "./logo.svg";
import { isValidTxHash } from "./isValidTxHash";

const routes: RouteObject[] = [
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
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      ...routes,
      {
        path: "*",
        element: null,
        loader: () => {
          // 404 route, redirect to base route
          if (!matchRoutes([...routes, { path: "/" }], window.location)) {
            return redirect("/");
          }
        }
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
        <WagmiProvider>
          <RouterProvider router={router} />
        </WagmiProvider>
      </header>
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);
