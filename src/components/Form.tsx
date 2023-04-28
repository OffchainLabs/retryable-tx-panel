'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { isValidTxHash } from '@/utils/isValidTxHash';

const Form = () => {
  const pathname = usePathname();
  const router = useRouter();
  const tx = pathname.split('/tx/')[1];
  const [value, setValue] = useState(tx ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (isValidTxHash(value)) {
      setError(null);
      router.push(`/tx/${value}`);
    } else if (value) {
      setError('Invalid address');
      router.push('/');
    }
  };

  return (
    <>
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-inner">
          <input
            name="txInput"
            placeholder="Paste your transaction hash"
            className="input-style"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <input type="submit" value="Submit" />
        </div>
        {error && (
          <div className="error">The transaction hash is not valid</div>
        )}
      </form>
      <Tooltip id="title-info" place="top" className="tooltip" />
    </>
  );
};

export { Form };
