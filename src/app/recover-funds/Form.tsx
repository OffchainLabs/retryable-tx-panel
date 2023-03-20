'use client';
import { usePathname, useRouter } from 'next/navigation';
import { utils } from 'ethers';
import { useAccount } from 'wagmi';

const Form = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const addressQuery = pathname.split('/recover-funds/')[1];

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const addressValue = formData.get('addressInput')?.toString();

    if (addressValue && utils.isAddress(addressValue)) {
      router.replace(`/recover-funds/${addressValue}`);
    } else {
      form.reset();
      router.replace('/recover-funds');
    }
  };

  return (
    <>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          name="addressInput"
          placeholder="Enter the address"
          className="input-style"
          defaultValue={addressQuery || address}
        />
        <input type="submit" value="Submit" />
      </form>
    </>
  );
};

export { Form };
