import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="description"
          content="Web site used to track Arbitrum Retryable transactions."
        />
        <meta name="theme-color" content="#000000" />

        {/* <link rel="icon" href="/logo.png" /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
