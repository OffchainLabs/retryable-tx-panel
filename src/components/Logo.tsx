import Image from 'next/image';
import Link from 'next/link';
import LogoSVG from '../../public/logo.svg';

const Logo = () => {
  return (
    <div className="header-logo">
      <Link href="/">
        <Image src={LogoSVG} alt="logo" priority />
      </Link>
    </div>
  );
};

export { Logo };
