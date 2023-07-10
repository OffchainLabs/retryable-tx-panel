import {
  AlertLevel,
  L1ToL2MessageReaderClassicWithNetwork,
  L1ToL2MessageReaderWithNetwork,
  MessageStatusDisplay,
} from '@/types';
import {
  L1ToL2MessageStatus,
  L1ToL2MessageWaitResult,
} from '@arbitrum/sdk/dist/lib/message/L1ToL2Message';
import { looksLikeCallToInboxethDeposit } from './looksLikeCallToInboxethDeposit';

async function getAutoRedeemAttempt(
  l1ToL2Message:
    | L1ToL2MessageReaderWithNetwork
    | L1ToL2MessageReaderClassicWithNetwork,
): Promise<string | undefined> {
  if ('getAutoRedeemAttempt' in l1ToL2Message) {
    return (await l1ToL2Message.getAutoRedeemAttempt())?.transactionHash;
  }

  return l1ToL2Message.autoRedeemId;
}

export const l1ToL2MessageToStatusDisplay = async (
  l1ToL2Message:
    | L1ToL2MessageReaderWithNetwork
    | L1ToL2MessageReaderClassicWithNetwork,
): Promise<MessageStatusDisplay> => {
  const { l2Network } = l1ToL2Message;
  const { explorerUrl } = l2Network;

  let messageStatus: L1ToL2MessageWaitResult | { status: L1ToL2MessageStatus };

  try {
    if ('waitForStatus' in l1ToL2Message) {
      messageStatus = await l1ToL2Message.waitForStatus(undefined, 1);
    } else {
      messageStatus = {
        status: await l1ToL2Message.status(),
      };
    }
  } catch (e) {
    // catch timeout if not immediately found
    messageStatus = { status: L1ToL2MessageStatus.NOT_YET_CREATED };
  }

  let l2TxHash = 'null';
  if (
    messageStatus.status === L1ToL2MessageStatus.REDEEMED &&
    'l2TxReceipt' in messageStatus
  ) {
    l2TxHash = messageStatus.l2TxReceipt.transactionHash;
  }

  // naming is hard
  const stuffTheyAllHave = {
    ethDepositMessage: undefined,
    explorerUrl,
    l2Network,
    l1ToL2Message,
    l2TxHash,
    autoRedeemHash: await getAutoRedeemAttempt(l1ToL2Message),
  };
  switch (messageStatus.status) {
    case L1ToL2MessageStatus.CREATION_FAILED:
      return {
        text: 'L2 message creation reverted; perhaps provided maxSubmissionCost was too low?',
        alertLevel: AlertLevel.RED,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    case L1ToL2MessageStatus.EXPIRED: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(
        l1ToL2Message,
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
    case L1ToL2MessageStatus.NOT_YET_CREATED: {
      return {
        text: 'L1 to L2 message initiated from L1, but not yet created — check again in a few minutes!',
        alertLevel: AlertLevel.YELLOW,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    }
    case L1ToL2MessageStatus.REDEEMED: {
      return {
        text: 'Success! 🎉 Your retryable was executed.',
        alertLevel: AlertLevel.GREEN,
        showRedeemButton: false,
        ...stuffTheyAllHave,
      };
    }
    case L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(
        l1ToL2Message,
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
      throw new Error('Uncaught L1ToL2MessageStatus type in switch statement');
  }
};
