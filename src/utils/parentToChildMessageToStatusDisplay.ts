import {
  AlertLevel,
  ParentToChildMessageReaderClassicWithNetwork,
  ParentToChildMessageReaderWithNetwork,
  MessageStatusDisplay,
} from '@/types';
import {
  ParentToChildMessageStatus,
  ParentToChildMessageWaitForStatusResult,
} from '@arbitrum/sdk/dist/lib/message/ParentToChildMessage';
import { getExplorer } from './getExplorer';
import { looksLikeCallToInboxethDeposit } from './looksLikeCallToInboxethDeposit';

async function getAutoRedeemAttempt(
  parentToChildMessage:
    | ParentToChildMessageReaderWithNetwork
    | ParentToChildMessageReaderClassicWithNetwork,
): Promise<string | undefined> {
  if ('getAutoRedeemAttempt' in parentToChildMessage) {
    return (await parentToChildMessage.getAutoRedeemAttempt())?.transactionHash;
  }

  return parentToChildMessage.autoRedeemId;
}

export const parentToChildMessageToStatusDisplay = async (
  parentToChildMessage:
    | ParentToChildMessageReaderWithNetwork
    | ParentToChildMessageReaderClassicWithNetwork,
): Promise<MessageStatusDisplay> => {
  const { childNetwork } = parentToChildMessage;
  let explorerUrl: string | null = null;
  try {
    explorerUrl = getExplorer(childNetwork.chainId);
  } catch (e) {
    explorerUrl = '';
  }

  let messageStatus:
    | ParentToChildMessageWaitForStatusResult
    | { status: ParentToChildMessageStatus };

  try {
    if ('waitForStatus' in parentToChildMessage) {
      messageStatus = await parentToChildMessage.waitForStatus(undefined, 1);
    } else {
      messageStatus = {
        status: await parentToChildMessage.status(),
      };
    }
  } catch (e) {
    // catch timeout if not immediately found
    messageStatus = { status: ParentToChildMessageStatus.NOT_YET_CREATED };
  }

  let childTxHash = 'null';
  if (
    messageStatus.status === ParentToChildMessageStatus.REDEEMED &&
    'childTxReceipt' in messageStatus
  ) {
    childTxHash = messageStatus.childTxReceipt.transactionHash;
  }

  // naming is hard
  const stuffTheyAllHave = {
    ethDepositMessage: undefined,
    explorerUrl,
    childNetwork,
    parentToChildMessage,
    childTxHash,
    autoRedeemHash: await getAutoRedeemAttempt(parentToChildMessage),
  };
  switch (messageStatus.status) {
    case ParentToChildMessageStatus.CREATION_FAILED:
      return {
        text: 'L2 message creation reverted; perhaps provided maxSubmissionCost was too low?',
        alertLevel: AlertLevel.RED,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    case ParentToChildMessageStatus.EXPIRED: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(
        parentToChildMessage,
      );
      if (looksLikeEthDeposit) {
        return {
          text: 'Success! 🎉 Your Eth deposit has completed',
          alertLevel: AlertLevel.GREEN,
          showRedeemButton: false,
          ...stuffTheyAllHave,
        };
      }
      return {
        text: 'Retryable ticket expired.',
        alertLevel: AlertLevel.RED,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    }
    case ParentToChildMessageStatus.NOT_YET_CREATED: {
      return {
        text: 'L1 to L2 message initiated from L1, but not yet created — check again in a few minutes!',
        alertLevel: AlertLevel.YELLOW,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    }
    case ParentToChildMessageStatus.REDEEMED: {
      return {
        text: 'Success! 🎉 Your retryable was executed.',
        alertLevel: AlertLevel.GREEN,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    }
    case ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(
        parentToChildMessage,
      );
      if (looksLikeEthDeposit) {
        return {
          text: 'Success! 🎉 Your Eth deposit has completed',
          alertLevel: AlertLevel.GREEN,
          showRedeemButton: false,
          ...stuffTheyAllHave,
        };
      }
      const text =
        // we do not know why auto redeem failed in nitro
        'Auto-redeem failed; you can redeem it now:';
      return {
        text,
        alertLevel: AlertLevel.YELLOW,
        showRedeemButton: true,
        ...stuffTheyAllHave,
      };
    }

    default:
      throw new Error(
        'Uncaught ParentToChildMessageStatus type in switch statement',
      );
  }
};
