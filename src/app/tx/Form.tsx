'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import { isValidTxHash } from '../../lib';

import 'react-tooltip/dist/react-tooltip.css';

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
      router.replace(`/tx/${txValue}`);
    } else {
      form.reset();
      router.replace('/tx');
    }
  };

  return (
    <>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          name="txInput"
          placeholder="Paste your transaction hash"
          className="input-style"
          defaultValue={tx}
        />
        <input type="submit" value="Submit" />
      </form>
      <Tooltip anchorId="title-info" place="top" className="tooltip" />
    </>
  );
};

export { Form };
