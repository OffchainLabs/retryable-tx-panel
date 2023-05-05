'use client';
import React, { useCallback, useState } from 'react';
import {
  Address,
  getL2Network,
  L1ToL2MessageGasEstimator,
  L1TransactionReceipt,
} from '@arbitrum/sdk';
import { Inbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory';
import { getBaseFee } from '@arbitrum/sdk/dist/lib/utils/lib';
import { useNetwork, useSigner } from 'wagmi';
import { getProviderFromChainId, getTargetChainId } from '@/utils';
import { BigNumber } from 'ethers';

function RecoverFundsButton({
  balanceToRecover,
  chainID,
  destinationAddress,
  addressToRecoverFrom,
}: {
  balanceToRecover: BigNumber;
  chainID: number;
  destinationAddress: string;
  addressToRecoverFrom: string;
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { chain } = useNetwork();
  const { data: signer } = useSigner({ chainId: chain?.id });

  const handleRecover = useCallback(async () => {
    if (!signer) {
      return;
    }

    const signerAddress = new Address(await signer.getAddress());

    if (signerAddress.value !== addressToRecoverFrom) {
      setMessage(
        `You can only retrieve funds from an address you're connected as. Please connect as ${addressToRecoverFrom}`,
      );
      return;
    }

    setLoading(true);
    setMessage('');

    // We instantiate the Inbox factory object to make use of its methods
    const targetChainID = getTargetChainId(chainID);

    const baseL2Provider = getProviderFromChainId(targetChainID);
    const l2Network = await getL2Network(baseL2Provider);
    const inbox = Inbox__factory.connect(
      l2Network.ethBridge.inbox,
      baseL2Provider,
    );

    // We estimate gas usage
    const l1ToL2MessageGasEstimator = new L1ToL2MessageGasEstimator(
      baseL2Provider,
    );

    if (!signer.provider) {
      setLoading(false);
      return;
    }

    const signerAliasedAddress = signerAddress.applyAlias();

    // The estimateAll method gives us the following values for sending an L1->L2 message
    //      (1) maxSubmissionCost: The maximum cost to be paid for submitting the transaction
    //      (2) gasLimit: The L2 gas limit
    //      (3) maxFeePerGas: The price bid per gas on L2
    //      (4) deposit: The total amount to deposit on L1 to cover L2 gas and L2 call value
    const gasEstimation = await l1ToL2MessageGasEstimator.estimateAll(
      {
        from: signerAliasedAddress.value,
        to: destinationAddress,
        l2CallValue: balanceToRecover,
        excessFeeRefundAddress: destinationAddress,
        callValueRefundAddress: destinationAddress,
        data: '0x',
      },
      await getBaseFee(signer.provider),
      signer.provider,
    );

    // And we send the request through the method unsafeCreateRetryableTicket of the Inbox contract
    // We need this method because we don't want the contract to check that we are not sending the l2CallValue
    // in the "value" of the transaction, because we want to use the amount that is already on L2
    const l2CallValue = balanceToRecover
      .sub(gasEstimation.maxSubmissionCost)
      .sub(gasEstimation.gasLimit.mul(gasEstimation.maxFeePerGas));

    if (l2CallValue.isNegative()) {
      setMessage('Balance on aliased address is too low to pay for gas');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const l1SubmissionTxRaw = await inbox
        .connect(signer)
        .unsafeCreateRetryableTicket(
          destinationAddress, // to
          l2CallValue, // l2CallValue
          gasEstimation.maxSubmissionCost, // maxSubmissionCost
          destinationAddress, // excessFeeRefundAddress
          destinationAddress, // callValueRefundAddress
          gasEstimation.gasLimit, // maxLimit
          gasEstimation.maxFeePerGas, // maxFeePerGas
          '0x', // data
          {
            from: signerAddress.value,
            value: 0,
          },
        );

      // We wrap the transaction in monkeyPatchContractCallWait so we can also waitForL2 later on
      const l1SubmissionTx =
        L1TransactionReceipt.monkeyPatchContractCallWait(l1SubmissionTxRaw);
      const l1SubmissionTxReceipt = await l1SubmissionTx.wait();

      setMessage(
        `L1 submission transaction receipt is: ${l1SubmissionTxReceipt.transactionHash}. Follow the transaction in the <a target="_blank" href="https://retryable-dashboard.arbitrum.io/tx/${l1SubmissionTxReceipt.transactionHash}">Retryables Dashboard</a>.`,
      );

      await l1SubmissionTxReceipt.waitForL2(baseL2Provider);
      window.location.reload();
    } catch (err: any) {
      setMessage((err as Error).message.toString());
    } finally {
      setLoading(false);
    }
  }, [balanceToRecover, chainID, destinationAddress, signer]);

  if (!signer) return null;

  if (chain?.id !== 1 && chain?.id !== 5) {
    return (
      <div>Unknown L1 chain id. This chain is not supported by this tool</div>
    );
  }

  if (chain?.id !== chainID) {
    return (
      <div>
        To recover funds, connect to chain ${chain?.id} (${chain?.name})
      </div>
    );
  }

  return (
    <>
      <div className="recover-funds-form">
        <button id="recover-button" disabled={loading} onClick={handleRecover}>
          Recover
        </button>
      </div>
      <div>
        {message && (
          <div
            className="recoverfundstext"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        )}
      </div>
    </>
  );
}

export { RecoverFundsButton };
