'use client';
import { utils } from 'ethers';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Form = () => {
  const pathname = usePathname();
  const router = useRouter();
  const addressQuery = pathname.split('/recover-funds/')[1];
  const [value, setValue] = useState(addressQuery);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (!(typeof value === 'string') || !utils.isAddress(value)) {
      setErrorMessage('Address is invalid');
      return;
    }

    setErrorMessage(null);
    router.push(`/recover-funds/${value}`);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    setValue(addressQuery);
  }, [addressQuery]);

  return (
    <>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          name="addressInput"
          placeholder="Enter the address"
          className="input-style"
          value={value || ''}
          onChange={handleChange}
        />
        <input type="submit" value="Submit" />
        {errorMessage && <span className="error">{errorMessage}</span>}
      </form>
    </>
  );
};

export { Form };
