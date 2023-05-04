'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Form = () => {
  const pathname = usePathname();
  const router = useRouter();
  const addressQuery = pathname.split('/recover-funds/')[1];
  const [value, setValue] = useState(addressQuery);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const addressValue = formData.get('addressInput')?.toString();

    if (typeof addressValue === 'string') {
      router.push(`/recover-funds/${addressValue}`);
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    setValue(addressQuery);
  }, [addressQuery]);

  console.log(value);
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
      </form>
    </>
  );
};

export { Form };
