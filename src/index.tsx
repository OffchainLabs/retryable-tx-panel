import React from 'react';
import ReactDOM from 'react-dom';
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
  matchRoutes,
  redirect,
} from 'react-router-dom';
import { Info } from 'react-feather';
import { Tooltip } from 'react-tooltip';

import App from './App';
import { WagmiProvider } from './WagmiProvider';
import logo from './logo.svg';
import { isValidTxHash } from './isValidTxHash';
import { ExternalLink } from './ExternalLink';

import 'react-tooltip/dist/react-tooltip.css';
import './index.css';

const routes: RouteObject[] = [
  {
    path: 'tx',
    element: null,
    loader: ({ params }) => {
      if (!isValidTxHash(params.txHash)) {
        return redirect('/');
      }
    },
    children: [
      {
        path: '/tx/:txHash',
        element: null,
      },
    ],
  },
];

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      ...routes,
      {
        path: '*',
        element: null,
        loader: () => {
          // 404 route, redirect to base route
          if (!matchRoutes([...routes, { path: '/' }], window.location)) {
            return redirect('/');
          }
        },
      },
    ],
  },
]);

ReactDOM.render(
  <React.StrictMode>
    <header>
      <h1>
        Arbitrum Cross-chain Message Dashboard{' '}
        <ExternalLink
          id="title-info"
          href="https://developer.arbitrum.io/arbos/l1-to-l2-messaging"
          data-tooltip-content="Learn more about cross-chain messaging on Arbitrum"
        >
          <Info size={24} />
        </ExternalLink>
        <Tooltip anchorId="title-info" place="top" />
      </h1>
      <div className="header-logo">
        <img src={logo} alt="logo" />
      </div>
      <WagmiProvider>
        <RouterProvider router={router} />
      </WagmiProvider>
    </header>
  </React.StrictMode>,
  document.getElementById('root'),
);
