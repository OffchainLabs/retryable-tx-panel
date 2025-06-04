'use client';
import React, { useMemo } from 'react';
import { MessageStatusDisplay } from '@/types';
import { ParentToChildMessageWriter } from '@arbitrum/sdk';
import { useNetwork, useSigner } from 'wagmi';
import { BigNumber } from 'ethers';
import { RetryableMessageParams } from '@arbitrum/sdk/dist/lib/dataEntities/message';

type Props = {
  parentToChildMessage: {
    chainId: MessageStatusDisplay['childNetwork']['chainId'];
    networkName: MessageStatusDisplay['childNetwork']['name'];
    sender: string | null;
    messageNumber: string | undefined;
    parentBaseFee: string | null;
    messageData: {
      destAddress: string;
      l2CallValue: string;
      l1Value: string;
      maxSubmissionFee: string;
      excessFeeRefundAddress: string;
      callValueRefundAddress: string;
      gasLimit: string;
      maxFeePerGas: string;
      data: string;
    } | null;
  };
};

function Redeem({ parentToChildMessage }: Props) {
  const [message, setMessage] = React.useState<string>('');
  const { chain } = useNetwork();
  const { data: signer = null } = useSigner({ chainId: chain?.id });

  const {
    chainId,
    networkName,
    sender,
    messageNumber,
    parentBaseFee,
    messageData,
  } = parentToChildMessage;

  const redeemButton = useMemo(() => {
    if (!signer) return null;

    if (chain?.id !== chainId) {
      return `To redeem, connect to chain ${chainId} (${networkName})`;
    }

    return (
      <button
        className="button"
        onClick={async () => {
          const {
            destAddress = '',
            data = '',
            l2CallValue,
            l1Value,
            maxSubmissionFee,
            excessFeeRefundAddress = '',
            callValueRefundAddress = '',
            gasLimit,
            maxFeePerGas,
          } = messageData || {};
          const messageDataParsed: RetryableMessageParams = {
            destAddress,
            data,
            l2CallValue: BigNumber.from(l2CallValue),
            l1Value: BigNumber.from(l1Value),
            maxSubmissionFee: BigNumber.from(maxSubmissionFee),
            excessFeeRefundAddress,
            callValueRefundAddress,
            gasLimit: BigNumber.from(gasLimit),
            maxFeePerGas: BigNumber.from(maxFeePerGas),
          };

          const parentToChildMessageWriter = new ParentToChildMessageWriter(
            signer,
            chainId,
            sender || '',
            BigNumber.from(messageNumber),
            BigNumber.from(parentBaseFee),
            messageDataParsed,
          );

          try {
            const res = await parentToChildMessageWriter.redeem();
            const rec = await res.wait();
            if (rec.status === 1) {
              setMessage(
                `Retryable successfully redeemed! ${rec.transactionHash}`,
              );
              // Reload the page to show the new status
              window.location.reload();
            } else {
              setMessage(res.toString());
              throw new Error('Failed to redeem');
            }
          } catch (e: unknown) {
            const err = e as Error & { error?: Error };
            const errorMessage = err.error?.message || err.message;
            setMessage(errorMessage);
          }
        }}
      >
        Redeem
      </button>
    );
  }, [
    chain?.id,
    signer,
    chainId,
    networkName,
    sender,
    messageNumber,
    parentBaseFee,
    messageData,
  ]);

  return (
    <>
      {redeemButton}
      <div>
        {message && (
          <textarea readOnly className="redeemtext" value={message} />
        )}
      </div>
    </>
  );
}

export default Redeem;
