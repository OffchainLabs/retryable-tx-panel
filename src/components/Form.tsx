'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { isValidTxHash } from '@/utils/isValidTxHash';
import { utils } from 'ethers';

const Form = () => {
  const pathname = usePathname();
  const router = useRouter();
  const txQueryString = pathname.split('/tx/')[1];
  const addressQueryString = pathname.split('/address/')[1];
  const recoverFundsQueryString = pathname.split('/recover-funds/')[1];
  const retryablesTrackerQueryString = pathname.split(
    '/retryables-tracker/',
  )[1];
  const [value, setValue] = useState(
    (txQueryString ||
      addressQueryString ||
      recoverFundsQueryString ||
      retryablesTrackerQueryString) ??
      '',
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (utils.isAddress(value)) {
      setError(null);
      router.push(`/address/${value}`);
      return;
    }

    if (isValidTxHash(value)) {
      setError(null);
      router.push(`/tx/${value}`);
      return;
    }

    setError('Invalid hash');
  };

  useEffect(() => {
    if (pathname.includes('/recover-funds/') && recoverFundsQueryString) {
      setValue(recoverFundsQueryString);
    }
  }, [pathname, recoverFundsQueryString]);

  return (
    <>
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-inner">
          <input
            name="txInput"
            placeholder="Paste your transaction hash or address"
            className="input-style"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          <input type="submit" value="Submit" />
        </div>
        {error && <div className="error">{error}</div>}
      </form>
      <Tooltip id="title-info" place="top" className="tooltip" />
    </>
  );
};

export { Form };
