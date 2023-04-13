'use client';
import { Space_Grotesk } from 'next/font/google';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import { isValidTxHash } from '../isValidTxHash';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
});

const Form = () => {
  const pathname = usePathname();
  const router = useRouter();
  const tx = pathname.split('/tx/')[1];

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const txValue = formData.get('txInput')?.toString();

    if (isValidTxHash(txValue)) {
      router.push(`/tx/${txValue}`);
    } else {
      form.reset();
      router.push('/');
    }
  };

  return (
    <>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          name="txInput"
          placeholder="Paste your transaction hash"
          className={`input-style ${spaceGrotesk.className}`}
          defaultValue={tx}
        />
        <input
          type="submit"
          value="Submit"
          className={spaceGrotesk.className}
        />
      </form>
      <Tooltip anchorId="title-info" place="top" className="tooltip" />
    </>
  );
};

export { Form };
