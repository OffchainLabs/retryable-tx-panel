import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Info } from 'react-feather';
import { Tooltip } from 'react-tooltip';
import Image from 'next/image';
import Logo from '../../public/logo.svg';
import { ExternalLink } from '../components/ExternalLink';

import 'react-tooltip/dist/react-tooltip.css';

export type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const tx = (router.query.tx ?? '') as string;
  const [input, setInput] = useState<string>(tx);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    if (input) {
      router.push('/tx/' + input);
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    setInput(tx);
  }, [tx, setInput]);

  return (
    <>
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
          <Image src={Logo} alt="logo" />
        </div>
        <h2>Find out what&apos;s up with your cross-chain message</h2>
      </header>

      <main>
        <form className="form-container" onSubmit={handleSubmit}>
          <input
            placeholder="Paste your transaction hash"
            value={input}
            onChange={handleChange}
            className="input-style"
          />
          <input type="submit" value="Submit" />
        </form>
        {children}
      </main>
    </>
  );
}
