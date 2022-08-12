import "./App.css";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useWallet } from "@gimmixorg/use-wallet";
import {
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  L1Network,
  L2Network,
  IL1ToL2MessageReader,
} from "@arbitrum/sdk"

// import directly from nitro sdk since `getL1Network` in migration sdk
// require a provider while the one in nitro sdk can take a chainID
import {
  getL1Network,
  getL2Network
} from "@arbitrum/sdk-nitro/dist/lib/dataEntities/networks"

import { JsonRpcProvider } from "@ethersproject/providers";

import Redeem from "./Redeem";
import { L1ToL2MessageWaitResult } from "@arbitrum/sdk/dist/lib/message/L1ToL2Message";

export enum L1ReceiptState {
  EMPTY,
  LOADING,
  INVALID_INPUT_LENGTH,
  NOT_FOUND,
  FAILED,
  NO_L1_L2_MESSAGES,
  MESSAGES_FOUND
}

export enum AlertLevel {
  RED,
  YELLOW,
  GREEN,
  NONE
}

interface L1ToL2MessageReaderWithNetwork extends IL1ToL2MessageReader {
  l2Network: L2Network;
}

const looksLikeCallToInboxethDeposit = async (
  l1ToL2Message: IL1ToL2MessageReader
): Promise<boolean> => {
  const txData = await l1ToL2Message.getInputs();

  return (
    txData.l2CallValue.isZero() &&
    txData.maxGas.isZero() &&
    txData.gasPriceBid.isZero() &&
    txData.callDataLength.isZero() &&
    txData.destinationAddress === txData.excessFeeRefundAddress &&
    txData.excessFeeRefundAddress === txData.callValueRefundAddress
  );
};
const receiptStateToDisplayableResult = (
  l1ReceiptState: L1ReceiptState
): {
  text: string;
  alertLevel: AlertLevel;
} => {
  switch (l1ReceiptState) {
    case L1ReceiptState.EMPTY:
      return {
        text: "",
        alertLevel: AlertLevel.NONE
      };
    case L1ReceiptState.LOADING:
      return {
        text: "Loading...",
        alertLevel: AlertLevel.NONE
      };
    case L1ReceiptState.INVALID_INPUT_LENGTH:
      return {
        text: "Error: invalid transction hash",
        alertLevel: AlertLevel.RED
      };
    case L1ReceiptState.NOT_FOUND:
      return {
        text: "L1 transaction not found",
        alertLevel: AlertLevel.YELLOW
      };
    case L1ReceiptState.FAILED:
      return {
        text: "Error: L1 transaction reverted",
        alertLevel: AlertLevel.RED
      };
    case L1ReceiptState.NO_L1_L2_MESSAGES:
      return {
        text: "No L1-to-L2 messages created by provided L1 transaction",
        alertLevel: AlertLevel.YELLOW
      };
    case L1ReceiptState.MESSAGES_FOUND:
      return {
        text: "L1 to L2 messages found",
        alertLevel: AlertLevel.GREEN
      };
  }
};

export interface L1ToL2MessageStatusDisplay {
  text: string;
  alertLevel: AlertLevel;
  showRedeemButton: boolean;
  explorerUrl: string;
  l2Network: L2Network;
  l1ToL2Message: IL1ToL2MessageReader;
  l2TxHash: string;
}

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
  l1TxnReceipt: L1TransactionReceipt,
  l1Network: L1Network,
  l1Provider: JsonRpcProvider
}

if (!process.env.REACT_APP_INFURA_KEY)
  throw new Error("No REACT_APP_INFURA_KEY set");

const supportedL1Networks = {
  1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  4: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
};


const getL1TxnReceipt = async (txnHash: string): Promise<ReceiptRes | undefined> => {
  for (let [chainID, rpcURL] of Object.entries(supportedL1Networks)) {
    const l1Network = await getL1Network(+chainID);
    const l1Provider = await new JsonRpcProvider(rpcURL);

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

const getL1ToL2Messages = async (
  l1TxnReceipt: L1TransactionReceipt,
  l1Network: L1Network
): Promise<L1ToL2MessageReaderWithNetwork[]> => {
  let allL1ToL2Messages: L1ToL2MessageReaderWithNetwork[] = [];

  // Workaround https://github.com/OffchainLabs/arbitrum-sdk/pull/137
  for (let l2ChainID of Array.from(new Set(l1Network.partnerChainIDs))) {
    // TODO: error handle
    const l2Network = await getL2Network(l2ChainID);

    // Check if any l1ToL2 msg is sent to the inbox of this l2Network
    const logFromL2Inbox = l1TxnReceipt.logs.filter(log => {
      return log.address.toLowerCase() === l2Network.ethBridge.inbox.toLowerCase()
    })
    if (logFromL2Inbox.length === 0) continue

    // Workaround https://github.com/OffchainLabs/arbitrum-sdk/pull/138
    if (!l2Network.rpcURL && l2ChainID === 42170) {
      l2Network.rpcURL = "https://nova.arbitrum.io/rpc"
    }
    const l2Provider = new JsonRpcProvider(l2Network.rpcURL);
    const l1ToL2MessagesWithNetwork: L1ToL2MessageReaderWithNetwork[] = (
      await l1TxnReceipt.getL1ToL2Messages(l2Provider)
    ).map(l1ToL2Message => {
      return Object.assign(l1ToL2Message, { l2Network });
    });
    allL1ToL2Messages = allL1ToL2Messages.concat(l1ToL2MessagesWithNetwork);
  }
  return allL1ToL2Messages;
};

const l1ToL2MessageToStatusDisplay = async (
  l1ToL2Message: L1ToL2MessageReaderWithNetwork,
): Promise<L1ToL2MessageStatusDisplay> => {
  const { l2Network } = l1ToL2Message;
  const { explorerUrl } = l2Network;

  let messageStatus: L1ToL2MessageWaitResult
  try {
    messageStatus = await l1ToL2Message.waitForStatus(undefined, 1);
  } catch (e) {
    // catch timeout if not immediately found
    messageStatus = { status: L1ToL2MessageStatus.NOT_YET_CREATED }
  }

  let l2TxHash = "null"
  if (messageStatus.status === L1ToL2MessageStatus.REDEEMED) {
    l2TxHash = messageStatus.l2TxReceipt.transactionHash
  }

  // naming is hard
  const stuffTheyAllHave = {
    explorerUrl,
    l2Network,
    l1ToL2Message,
    l2TxHash,
  };
  switch (messageStatus.status) {
    case L1ToL2MessageStatus.CREATION_FAILED:
      return {
        text:
          "L2 message creation reverted; perhaps provided maxSubmissionCost was too low?",
        alertLevel: AlertLevel.RED,
        showRedeemButton: false,
        ...stuffTheyAllHave
      };
    case L1ToL2MessageStatus.EXPIRED: {
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(l1ToL2Message)
      if (looksLikeEthDeposit) {
        return {
          text: "Success! 🎉 Your Eth deposit has completed",
          alertLevel: AlertLevel.GREEN,
          showRedeemButton: false,
          ...stuffTheyAllHave
        }
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
        text:
          "L1 to L2 message initiated from L1, but not yet created — check again in a few minutes!",
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
      const looksLikeEthDeposit = await looksLikeCallToInboxethDeposit(l1ToL2Message)
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
      throw new Error("Uncaught L1ToL2MessageStatus type in switch statemmtn");
  }
};

function App() {
  const { connect, disconnect, provider } = useWallet();
  const [connectedNetworkId, setConnectedNetworkID] = useState<number | null>(
    null
  );
  const resultRef = useRef<null | HTMLDivElement>(null); 

  const signer = useMemo(() => {
    if (!provider) {
      return null;
    } else {
      return provider.getSigner();
    }
  }, [provider]);

  useEffect(() => {
    if (!signer) {
      setConnectedNetworkID(null);
    } else {
      signer
        .getChainId()
        .then(chainID => setConnectedNetworkID(chainID));
    }
  }, [signer, provider]);

  const [input, setInput] = React.useState<string>("");
  const [l1TxnHashState, setL1TxnHashState] = React.useState<L1ReceiptState>(
    L1ReceiptState.EMPTY
  );
  const [l1TxnReceipt, setl1TxnReceipt] = React.useState<ReceiptRes>();
  const [l1ToL2MessagesDisplays, setl1ToL2MessagesDisplays] = React.useState<
    L1ToL2MessageStatusDisplay[]
  >([]);

  const retryablesSearch = async (txHash: string) => {
    setl1TxnReceipt(undefined);
    setl1ToL2MessagesDisplays([]);
    setL1TxnHashState(L1ReceiptState.LOADING);

    if (txHash.length !== 66) {
      return setL1TxnHashState(L1ReceiptState.INVALID_INPUT_LENGTH);
    }

    // simple deep linking
    window.history.pushState("", "", `/${txHash}`);

    const receiptRes = await getL1TxnReceipt(txHash);
    setl1TxnReceipt(receiptRes);

    if (receiptRes === undefined) {
      return setL1TxnHashState(L1ReceiptState.NOT_FOUND);
    }
    const { l1Network, l1TxnReceipt } = receiptRes;
    if (l1TxnReceipt.status === 0) {
      return setL1TxnHashState(L1ReceiptState.FAILED);
    }

    const l1ToL2Messages = await getL1ToL2Messages(l1TxnReceipt, l1Network);
    if (l1ToL2Messages.length === 0) {
      return setL1TxnHashState(L1ReceiptState.NO_L1_L2_MESSAGES);
    }

    setL1TxnHashState(L1ReceiptState.MESSAGES_FOUND);


    const l1ToL2MessageStatuses: L1ToL2MessageStatusDisplay[] = [];
    for (let l1ToL2Message of l1ToL2Messages) {
      const l1ToL2MessageStatus = await l1ToL2MessageToStatusDisplay(
        l1ToL2Message,
      );
      l1ToL2MessageStatuses.push(l1ToL2MessageStatus);
    }
    setl1ToL2MessagesDisplays(l1ToL2MessageStatuses);

    if(resultRef.current) resultRef.current.scrollIntoView() // scroll to results
  };

  const handleChange = (event: any) => {
    setInput(event.target.value);
  };
  const handleSubmit = (event: any) => {
    event.preventDefault();
    retryablesSearch(input);
  };

  // simple deep linking
  if (input === "" && window.location.pathname.length === 67) {
    const txhash = window.location.pathname.substring(1,)
    setInput(txhash)
    retryablesSearch(txhash)
  }

  const { text: l1TxnResultText } = receiptStateToDisplayableResult(
    l1TxnHashState
  );
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
          Paste your L1 tx hash above and find out whats up with your L1 to L2
          retryable.
        </h6>
      </div>

      <div>{l1TxnReceipt && (
          <a href={l1TxnReceipt.l1Network.explorerUrl + '/tx/' + l1TxnReceipt.l1TxnReceipt.transactionHash} rel="noreferrer" target="_blank">
            L1 Tx on {l1TxnReceipt.l1Network.name}
          </a>
        )} {l1TxnResultText} </div>
      <br />
      <div>
        {" "}
        {l1TxnHashState === L1ReceiptState.MESSAGES_FOUND &&
          l1ToL2MessagesDisplays.length === 0
          ? "loading messages..."
          : null}{" "}
      </div>
      {l1ToL2MessagesDisplays.some(msg => msg.showRedeemButton) ? (
        signer ? (
          <button onClick={() => disconnect()}>Disconnect Wallet</button>
        ) : (
          <button onClick={() => connect()}>Connect Wallet</button>
        )
      ) : null}

      {l1ToL2MessagesDisplays.map((l1ToL2MessageDisplay, i) => {
        return (
          <div key={l1ToL2MessageDisplay.l1ToL2Message.retryableCreationId} ref={resultRef}>
            {
              <>
                <h3>Your transaction status on {l1ToL2MessageDisplay.l2Network.name}</h3>
                <p>{l1ToL2MessageDisplay.text}</p>
                {l1ToL2MessageDisplay.showRedeemButton ? (
                  <Redeem
                    l1ToL2Message={l1ToL2MessageDisplay}
                    signer={signer}
                    connectedNetworkId={connectedNetworkId}
                  />
                ) : null}
              </>
            }
            <p>
            -----Txn links----- <br />
              <a
                href={
                  l1ToL2MessageDisplay.explorerUrl +
                  "/tx/" +
                  l1ToL2MessageDisplay.l1ToL2Message.retryableCreationId
                }
                rel="noreferrer"
                target="_blank"
              >
                Retryable Ticket
              </a>
              <br />
              {l1ToL2MessageDisplay.l2TxHash !== "null" && (
              <><a
                  href={l1ToL2MessageDisplay.explorerUrl +
                    "/tx/" +
                    l1ToL2MessageDisplay.l2TxHash}
                  rel="noreferrer"
                  target="_blank"
                >
                  L2 Tx
                </a><br /></>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default App;
