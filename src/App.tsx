import "./App.css";
import React, { useEffect, useRef } from "react";
import {
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  L2ToL1MessageStatus,
  L1Network,
  L2Network,
  getL1Network,
  getL2Network,
  L1ToL2MessageReader
} from "@arbitrum/sdk";
import { useNavigate, useParams, generatePath } from "react-router-dom";

import { useNetwork, useSigner } from "wagmi";
import { ethers } from "ethers";
import {
  JsonRpcProvider,
  StaticJsonRpcProvider,
  JsonRpcSigner
} from "@ethersproject/providers";

import Redeem from "./Redeem";
import {
  L1ToL2MessageWaitResult,
  EthDepositMessage
} from "@arbitrum/sdk/dist/lib/message/L1ToL2Message";
import { getL2ToL1Messages, L2ToL1MessageData, L2TxnStatus } from "./lib";
import L2ToL1MsgsDisplay from "./L2ToL1MsgsDisplay";
import { isValidTxHash } from "./isValidTxHash";
import { ConnectButtons } from "./ConnectButtons";

export enum ReceiptState {
  EMPTY,
  LOADING,
  INVALID_INPUT_LENGTH,
  NOT_FOUND,
  L1_FAILED,
  L2_FAILED,
  NO_L1_L2_MESSAGES,
  MESSAGES_FOUND,
  NO_L2_L1_MESSAGES
}

export enum AlertLevel {
  RED,
  YELLOW,
  GREEN,
  NONE
}

interface L1ToL2MessageReaderWithNetwork extends L1ToL2MessageReader {
  l2Network: L2Network;
}

interface EthDepositMessageWithNetwork extends EthDepositMessage {
  l2Network: L2Network;
}

interface L1ToL2MessagesAndDepositMessages {
  retryables: L1ToL2MessageReaderWithNetwork[];
  deposits: EthDepositMessageWithNetwork[];
}

const looksLikeCallToInboxethDeposit = async (
  l1ToL2Message: L1ToL2MessageReader
): Promise<boolean> => {
  const txData = await l1ToL2Message.messageData;
  return (
    txData.l2CallValue.isZero() &&
    txData.gasLimit.isZero() &&
    txData.maxFeePerGas.isZero() &&
    (txData.data.toString() === ethers.constants.HashZero ||
      txData.data.toString() === "" ||
      txData.data.toString() === "0x") &&
    txData.destAddress === txData.excessFeeRefundAddress &&
    txData.excessFeeRefundAddress === txData.callValueRefundAddress
  );
};

const receiptStateToDisplayableResult = (
  l1ReceiptState: ReceiptState
): {
  text: string;
  alertLevel: AlertLevel;
} => {
  switch (l1ReceiptState) {
    case ReceiptState.EMPTY:
      return {
        text: "",
        alertLevel: AlertLevel.NONE
      };
    case ReceiptState.LOADING:
      return {
        text: "Loading...",
        alertLevel: AlertLevel.NONE
      };
    case ReceiptState.INVALID_INPUT_LENGTH:
      return {
        text: "Error: invalid transaction hash",
        alertLevel: AlertLevel.RED
      };
    case ReceiptState.NOT_FOUND:
      return {
        text: "L1 transaction not found",
        alertLevel: AlertLevel.YELLOW
      };
    case ReceiptState.L1_FAILED:
      return {
        text: "Error: L1 transaction reverted",
        alertLevel: AlertLevel.RED
      };
    case ReceiptState.L2_FAILED:
      return {
        text: "Error: L2 transaction reverted",
        alertLevel: AlertLevel.RED
      };
    case ReceiptState.NO_L1_L2_MESSAGES:
      return {
        text: "No L1-to-L2 messages created by provided L1 transaction",
        alertLevel: AlertLevel.YELLOW
      };
    case ReceiptState.MESSAGES_FOUND:
      return {
        text: "Cross chain messages found",
        alertLevel: AlertLevel.GREEN
      };
    case ReceiptState.NO_L2_L1_MESSAGES: {
      return {
        text: "No L1-to-L2 messages created by provided L1 transaction",
        alertLevel: AlertLevel.YELLOW
      };
    }
  }
};

interface MessageStatusDisplayBase {
  text: string;
  alertLevel: AlertLevel;
  showRedeemButton: boolean;
  explorerUrl: string;
  l2Network: L2Network;
  l2TxHash: string;
}
interface MessageStatusDisplayRetryable extends MessageStatusDisplayBase {
  l1ToL2Message: L1ToL2MessageReader;
  ethDepositMessage: undefined;
}
interface MessageStatusDisplayDeposit extends MessageStatusDisplayBase {
  l1ToL2Message: undefined;
  ethDepositMessage: EthDepositMessage;
}
export type MessageStatusDisplay =
  | MessageStatusDisplayRetryable
  | MessageStatusDisplayDeposit;

export enum Status {
  CREATION_FAILURE,
  NOT_FOUND,
  REEXECUTABLE,
  SUCCEEDED
}

export interface Result {
  status: Status;
  text: string;
}

export interface RetryableTxs {
  l1BlockExplorerUrl: string;
  l2BlockExplorerUrl: string;
  l1Tx?: string;
  l2Tx?: string;
  autoRedeem?: string;
  ticket?: string;
  result: Result;
  l2ChainId: number;
}

export interface ReceiptRes {
  l1TxnReceipt: L1TransactionReceipt;
  l1Network: L1Network;
  l1Provider: JsonRpcProvider;
}

if (!process.env.REACT_APP_INFURA_KEY)
  throw new Error("No REACT_APP_INFURA_KEY set");

export const supportedL1Networks = {
  1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
};

const getL1TxnReceipt = async (
  txnHash: string
): Promise<ReceiptRes | undefined> => {
  for (let [chainID, rpcURL] of Object.entries(supportedL1Networks)) {
    const l1Network = await getL1Network(+chainID);
    const l1Provider = await new StaticJsonRpcProvider(rpcURL);

    const rec = await l1Provider.getTransactionReceipt(txnHash);
    if (rec) {
      return {
        l1TxnReceipt: new L1TransactionReceipt(rec),
        l1Network,
        l1Provider
      };
    }
  }
};

const getL1ToL2MessagesAndDepositMessages = async (
  l1TxnReceipt: L1TransactionReceipt,
  l1Network: L1Network
): Promise<L1ToL2MessagesAndDepositMessages> => {
  let allL1ToL2Messages: L1ToL2MessageReaderWithNetwork[] = [];
  let allDepositMessages: EthDepositMessageWithNetwork[] = [];
  for (let l2ChainID of Array.from(new Set(l1Network.partnerChainIDs))) {
    // TODO: error handle
    const l2Network = await getL2Network(l2ChainID);

    // Check if any l1ToL2 msg is sent to the inbox of this l2Network
    const logFromL2Inbox = l1TxnReceipt.logs.filter((log) => {
      return (
        log.address.toLowerCase() === l2Network.ethBridge.inbox.toLowerCase()
      );
    });
    if (logFromL2Inbox.length === 0) continue;

    let l2RpcURL;
    switch (l2ChainID) {
      case 42161:
        l2RpcURL = "https://arb1.arbitrum.io/rpc";
        break;
      case 42170:
        l2RpcURL = "https://nova.arbitrum.io/rpc";
        break;
      case 421613:
        l2RpcURL = "https://goerli-rollup.arbitrum.io/rpc";
        break;
      default:
        throw new Error(
          "Unknown L2 chain id. This chain is not supported by dashboard"
        );
    }
    const l2Provider = new StaticJsonRpcProvider(l2RpcURL);
    const l1ToL2MessagesWithNetwork: L1ToL2MessageReaderWithNetwork[] = (
      await l1TxnReceipt.getL1ToL2Messages(l2Provider)
    ).map((l1ToL2Message) => {
      return Object.assign(l1ToL2Message, { l2Network });
    });

    const depositMessagesWithNetwork: EthDepositMessageWithNetwork[] = (
      await l1TxnReceipt.getEthDeposits(l2Provider)
    ).map((depositMessage) => {
      return Object.assign(depositMessage, { l2Network });
    });
    allL1ToL2Messages = allL1ToL2Messages.concat(l1ToL2MessagesWithNetwork);
    allDepositMessages = allDepositMessages.concat(depositMessagesWithNetwork);
  }
  const allMessages: L1ToL2MessagesAndDepositMessages = {
    retryables: allL1ToL2Messages,
    deposits: allDepositMessages
  };
  return allMessages;
};

const depositMessageStatusDisplay = async (
  ethDepositMessage: EthDepositMessageWithNetwork
): Promise<MessageStatusDisplay> => {
  const { l2Network } = ethDepositMessage;
  const { explorerUrl } = l2Network;
  const depositTxReceipt = await ethDepositMessage.wait();
  const l2TxHash = ethDepositMessage.l2DepositTxHash;

  // naming is hard
  const stuffTheyAllHave = {
    l1ToL2Message: undefined,
    explorerUrl,
    l2Network,
    ethDepositMessage,
    l2TxHash
  };
  if (depositTxReceipt?.status === 1) {
    return {
      text: "Success! 🎉 Your Eth deposit has completed",
      alertLevel: AlertLevel.GREEN,
      showRedeemButton: false,
      ...stuffTheyAllHave
    };
  } else {
    return {
      text: "Something failed in this tracker, you can try to check your account on l2",
      alertLevel: AlertLevel.RED,
      showRedeemButton: false,
      ...stuffTheyAllHave
    };
  }
};

const l1ToL2MessageToStatusDisplay = async (
  l1ToL2Message: L1ToL2MessageReaderWithNetwork
): Promise<MessageStatusDisplay> => {
  const { l2Network } = l1ToL2Message;
  const { explorerUrl } = l2Network;

  let messageStatus: L1ToL2MessageWaitResult;
  try {
    messageStatus = await l1ToL2Message.waitForStatus(undefined, 1);
  } catch (e) {
    // catch timeout if not immediately found
    messageStatus = { status: L1ToL2MessageStatus.NOT_YET_CREATED };
  }

  let l2TxHash = "null";
  if (messageStatus.status === L1ToL2MessageStatus.REDEEMED) {
    l2TxHash = messageStatus.l2TxReceipt.transactionHash;
  }

  // naming is hard
  const stuffTheyAllHave = {
    ethDepositMessage: undefined,
    explorerUrl,
    l2Network,
    l1ToL2Message,
    l2TxHash
  };
  switch (messageStatus.status) {
    case L1ToL2MessageStatus.CREATION_FAILED:
      return {
        text: "L2 message creation reverted; perhaps provided maxSubmissionCost was too low?",
        alertLevel: AlertLevel.RED,
        showRedeemButton: false,
        ...stuffTheyAllHave
      };
    case L1ToL2MessageStatus.EXPIRED: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(
        l1ToL2Message
      );
      if (looksLikeEthDeposit) {
        return {
          text: "Success! 🎉 Your Eth deposit has completed",
          alertLevel: AlertLevel.GREEN,
          showRedeemButton: false,
          ...stuffTheyAllHave
        };
      }
      return {
        text: "Retryable ticket expired.",
        alertLevel: AlertLevel.RED,
        showRedeemButton: false,
        ...stuffTheyAllHave
      };
    }
    case L1ToL2MessageStatus.NOT_YET_CREATED: {
      return {
        text: "L1 to L2 message initiated from L1, but not yet created — check again in a few minutes!",
        alertLevel: AlertLevel.YELLOW,
        showRedeemButton: false,
        ...stuffTheyAllHave
      };
    }

    case L1ToL2MessageStatus.REDEEMED: {
      const text = "Success! 🎉 Your retryable was executed.";
      return {
        text: text,
        alertLevel: AlertLevel.GREEN,
        showRedeemButton: false,
        ...stuffTheyAllHave
      };
    }
    case L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(
        l1ToL2Message
      );
      if (looksLikeEthDeposit) {
        return {
          text: "Success! 🎉 Your Eth deposit has completed",
          alertLevel: AlertLevel.GREEN,
          showRedeemButton: false,
          ...stuffTheyAllHave
        };
      }
      const text = (() => {
        // we do not know why auto redeem failed in nitro
        return "Auto-redeem failed; you can redeem it now:";
      })();
      return {
        text,
        alertLevel: AlertLevel.YELLOW,
        showRedeemButton: true,
        ...stuffTheyAllHave
      };
    }

    default:
      throw new Error("Uncaught L1ToL2MessageStatus type in switch statement");
  }
};

function App() {
  const { txHash } = useParams();
  const navigate = useNavigate();

  const oldTxHash = new URLSearchParams(window.location.search).get("t");

  useEffect(() => {
    if (!oldTxHash) {
      return;
    }

    if (isValidTxHash(oldTxHash)) {
      navigate(generatePath("tx/:txHash", { txHash: oldTxHash }));
    } else {
      navigate("/");
    }
  }, [navigate, oldTxHash]);

  const { data: signer = null } = useSigner();

  const resultRef = useRef<null | HTMLDivElement>(null);
  const { chain } = useNetwork();

  const [input, setInput] = React.useState<string>("");
  const [txHashState, setTxnHashState] = React.useState<ReceiptState>(
    ReceiptState.EMPTY
  );
  const [l1TxnReceipt, setl1TxnReceipt] = React.useState<ReceiptRes>();
  const [messagesDisplays, setMessagesDisplays] = React.useState<
    MessageStatusDisplay[]
  >([]);

  const [l2ToL1MessagesToShow, setL2ToL1MessagesToShow] = React.useState<
    L2ToL1MessageData[]
  >([]);

  const getRetryableIdOrDepositHash = (message: MessageStatusDisplay) => {
    if (message.l1ToL2Message !== undefined) {
      return message.l1ToL2Message.retryableCreationId;
    }
    return message.ethDepositMessage.l2DepositTxHash;
  };

  const retryablesSearch = async (txHash: string) => {
    setl1TxnReceipt(undefined);
    setMessagesDisplays([]);
    setL2ToL1MessagesToShow([]);
    setTxnHashState(ReceiptState.LOADING);

    if (txHash.length !== 66) {
      return setTxnHashState(ReceiptState.INVALID_INPUT_LENGTH);
    }

    // simple deep linking
    navigate(generatePath("tx/:txHash", { txHash }));

    const receiptRes = await getL1TxnReceipt(txHash);
    setl1TxnReceipt(receiptRes);

    if (receiptRes === undefined) {
      const res = await getL2ToL1Messages(txHash);
      // TODO: handle terminal states
      if (res.l2ToL1Messages.length > 0) {
        setTxnHashState(ReceiptState.MESSAGES_FOUND);
        return setL2ToL1MessagesToShow(res.l2ToL1Messages);
      }

      if (res.l2TxnStatus === L2TxnStatus.SUCCESS) {
        return setTxnHashState(ReceiptState.NO_L2_L1_MESSAGES);
      }
      if (res.l2TxnStatus === L2TxnStatus.FAILURE) {
        return setTxnHashState(ReceiptState.L2_FAILED);
      }

      return setTxnHashState(ReceiptState.NOT_FOUND);
    }
    const { l1Network, l1TxnReceipt } = receiptRes;
    if (l1TxnReceipt.status === 0) {
      return setTxnHashState(ReceiptState.L1_FAILED);
    }

    const allMessages = await getL1ToL2MessagesAndDepositMessages(
      l1TxnReceipt,
      l1Network
    );
    const l1ToL2Messages = allMessages.retryables;
    const depositMessages = allMessages.deposits;

    if (l1ToL2Messages.length === 0 && depositMessages.length === 0) {
      return setTxnHashState(ReceiptState.NO_L1_L2_MESSAGES);
    }

    setTxnHashState(ReceiptState.MESSAGES_FOUND);

    const messageStatuses: MessageStatusDisplay[] = [];
    for (let l1ToL2Message of l1ToL2Messages) {
      const l1ToL2MessageStatus = await l1ToL2MessageToStatusDisplay(
        l1ToL2Message
      );
      messageStatuses.push(l1ToL2MessageStatus);
    }

    for (let depositMessage of depositMessages) {
      const l1ToL2MessageStatus = await depositMessageStatusDisplay(
        depositMessage
      );
      messageStatuses.push(l1ToL2MessageStatus);
    }

    setMessagesDisplays(messageStatuses);

    if (resultRef.current) resultRef.current.scrollIntoView(); // scroll to results
  };

  const handleChange = (event: any) => {
    setInput(event.target.value);
  };
  const handleSubmit = (event: any) => {
    event.preventDefault();
    retryablesSearch(input);
  };

  // simple deep linking
  if (input === "" && isValidTxHash(txHash)) {
    setInput(txHash);
    retryablesSearch(txHash);
  }
  const { text: l1TxnResultText } =
    receiptStateToDisplayableResult(txHashState);
  return (
    <div>
      <div>
        <form onSubmit={handleSubmit}>
          <div className="form-container">
            <input
              autoFocus
              placeholder="Tx hash"
              value={input}
              onChange={handleChange}
              className="input-style"
            />
            <input type="submit" value="Submit" />
          </div>
        </form>
        <h6>
          Paste your tx hash above and find out whats up with your cross chain
          message.
        </h6>
      </div>

      <div>
        {l1TxnReceipt && (
          <a
            href={
              l1TxnReceipt.l1Network.explorerUrl +
              "/tx/" +
              l1TxnReceipt.l1TxnReceipt.transactionHash
            }
            rel="noreferrer"
            target="_blank"
          >
            L1 Tx on {l1TxnReceipt.l1Network.name}
          </a>
        )}{" "}
        {l1TxnResultText}{" "}
      </div>
      <br />
      <div>
        {" "}
        {txHashState === ReceiptState.MESSAGES_FOUND &&
        messagesDisplays.length === 0 &&
        l2ToL1MessagesToShow.length === 0
          ? "loading messages..."
          : null}{" "}
      </div>
      {messagesDisplays.some((msg) => msg.showRedeemButton) ||
      l2ToL1MessagesToShow.some(
        (msg) => msg.status === L2ToL1MessageStatus.CONFIRMED
      ) ? (
        <ConnectButtons />
      ) : null}

      <L2ToL1MsgsDisplay
        signer={signer as JsonRpcSigner}
        l2ToL1Messages={l2ToL1MessagesToShow}
        connectedNetworkId={chain?.id}
      />

      {messagesDisplays.map((messageDisplay) => {
        return (
          <div
            key={getRetryableIdOrDepositHash(messageDisplay)}
            ref={resultRef}
          >
            {
              <>
                <h3>
                  Your transaction status on {messageDisplay.l2Network.name}
                </h3>
                <p>{messageDisplay.text}</p>
                {true ? (
                  <Redeem
                    l1ToL2Message={messageDisplay}
                    signer={signer as JsonRpcSigner}
                    connectedNetworkId={chain?.id}
                  />
                ) : null}
              </>
            }
            <p>
              -----Txn links----- <br />
              {
                <>
                  {messageDisplay.l1ToL2Message !== undefined ? (
                    <a
                      href={
                        messageDisplay.explorerUrl +
                        "/tx/" +
                        getRetryableIdOrDepositHash(messageDisplay)
                      }
                      rel="noreferrer"
                      target="_blank"
                    >
                      Retryable Ticket
                    </a>
                  ) : null}
                </>
              }
              <br />
              {messageDisplay.l2TxHash !== "null" && (
                <>
                  <a
                    href={
                      messageDisplay.explorerUrl +
                      "/tx/" +
                      messageDisplay.l2TxHash
                    }
                    rel="noreferrer"
                    target="_blank"
                  >
                    L2 Tx
                  </a>
                  <br />
                </>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default App;
