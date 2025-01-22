'use client';
import React, { useCallback, useState } from 'react';
import {
  Address,
  getArbitrumNetwork,
  ParentToChildMessageGasEstimator,
  ParentTransactionReceipt,
} from '@arbitrum/sdk';
import { Inbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory';
import { getBaseFee } from '@arbitrum/sdk/dist/lib/utils/lib';
import { mainnet, sepolia, useNetwork, useSigner } from 'wagmi';
import { getProviderFromChainId, getTargetChainId } from '@/utils';
import { BigNumber } from 'ethers';
import { ChainId } from '@/utils/network';
import { useAccountType } from '@/utils/useAccountType';

function getParentChainIdFromChildChainId(childChainId: number | undefined) {
  if (!childChainId) {
    return ChainId.Mainnet;
  }

  return {
    [ChainId.ArbitrumOne]: ChainId.Mainnet,
    [ChainId.ArbitrumSepolia]: ChainId.Sepolia,
  }[childChainId];
}

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
  const { isSmartContractWallet, isLoading: isLoadingAccountType } =
    useAccountType();
  const { chain } = useNetwork();
  const { data: signer } = useSigner({
    chainId: getParentChainIdFromChildChainId(chainID),
  });

  const handleRecover = useCallback(async () => {
    if (!signer) {
      return;
    }

    const signerAddress = new Address(await signer.getAddress());

    if (
      signerAddress.value.toLowerCase() !== addressToRecoverFrom.toLowerCase()
    ) {
      setMessage(
        `You can only retrieve funds from an address you're connected as. Please connect as ${addressToRecoverFrom}`,
      );
      return;
    }

    setLoading(true);
    setMessage('');

    const baseChildProvider = getProviderFromChainId(chainID);
    const childNetwork = await getArbitrumNetwork(baseChildProvider);
    const inbox = Inbox__factory.connect(
      childNetwork.ethBridge.inbox,
      baseChildProvider,
    );

    // We estimate gas usage
    const parentToChildMessageGasEstimator =
      new ParentToChildMessageGasEstimator(baseChildProvider);

    if (!signer.provider) {
      setLoading(false);
      return;
    }

    const signerAliasedAddress = signerAddress.applyAlias();

    // The estimateAll method gives us the following values for sending an Parent->Child message
    //      (1) maxSubmissionCost: The maximum cost to be paid for submitting the transaction
    //      (2) gasLimit: The child chain gas limit
    //      (3) maxFeePerGas: The price bid per gas on child chain
    //      (4) deposit: The total amount to deposit on parent chain to cover child chain gas and l2CallValue
    const gasEstimation = await parentToChildMessageGasEstimator.estimateAll(
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
    // in the "value" of the transaction, because we want to use the amount that is already on child chain
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
      const parentSubmissionTxRaw = await inbox
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
      const parentSubmissionTx =
        ParentTransactionReceipt.monkeyPatchContractCallWait(
          parentSubmissionTxRaw,
        );
      const parentSubmissionTxReceipt = await parentSubmissionTx.wait();

      setMessage(
        `L1 submission transaction receipt is: ${parentSubmissionTxReceipt.transactionHash}. Follow the transaction in the <a target="_blank" href="https://retryable-dashboard.arbitrum.io/tx/${parentSubmissionTxReceipt.transactionHash}">Retryables Dashboard</a>.`,
      );

      await parentSubmissionTxReceipt.waitForChildTransactionReceipt(
        baseChildProvider,
      );
      window.location.reload();
    } catch (err: any) {
      setMessage((err as Error).message.toString());
    } finally {
      setLoading(false);
    }
  }, [
    addressToRecoverFrom,
    balanceToRecover,
    chainID,
    destinationAddress,
    signer,
  ]);

  if (!signer) return null;

  if (chain?.id !== mainnet.id && chain?.id !== sepolia.id) {
    return (
      <div>Unknown L1 chain id. This chain is not supported by this tool</div>
    );
  }

  if (getTargetChainId(chain?.id) !== chainID) {
    return (
      <div>
        To recover funds, connect to chain {chain?.id} ({chain?.name})
      </div>
    );
  }

  return (
    <>
      <div className="recover-funds-form">
        <div>
          <button
            className="button"
            id="recover-button"
            disabled={loading}
            onClick={handleRecover}
          >
            Recover
          </button>
        </div>
        {loading && isSmartContractWallet && !isLoadingAccountType && (
          <div className="flex flex-col">
            <span>
              <b>
                To continue, please approve tx on your smart contract wallet.
              </b>{' '}
              If you have k of n signers, then k of n will need to sign.
            </span>
          </div>
        )}
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
