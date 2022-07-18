import "./App.css";
import React, { useState, useMemo, useEffect } from "react";
import { useWallet } from "@gimmixorg/use-wallet";
import {
  L1ToL2MessageReader,
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  L1Network,
  L2Network,
  getL2Network,
  getL1Network,
  addCustomNetwork
} from "@arbitrum/sdk"

import { JsonRpcProvider } from "@ethersproject/providers";
import Redeem from "./Redeem";

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

interface L1ToL2MessageReaderWithNetwork extends L1ToL2MessageReader {
  l2Network: L2Network;
}

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
  l1ToL2Message: L1ToL2MessageReader;
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

if (!process.env.REACT_APP_INFURA_KEY)
  throw new Error("No REACT_APP_INFURA_KEY set");

const supportedL1Networks = {
  // 1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  // 4: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
};

addCustomNetwork({
  customL1Network: {
    "blockTime": 15,
    "chainID": 5,
    "explorerUrl": "https://goerli.etherscan.io/",
    "isCustom": true,
    "name": "Goerli",
    "partnerChainIDs": [
      421613
    ],
    "rpcURL": `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
  },
  customL2Network: {
    "chainID": 421613,
    "confirmPeriodBlocks": 960,
    "ethBridge": {
      "bridge": "0x9903a892da86c1e04522d63b08e5514a921e81df",
      "inbox": "0x1fdbbcc914e84af593884bf8e8dd6877c29035a2",
      "outbox": "0xFDF2B11347dA17326BAF30bbcd3F4b09c4719584",
      "rollup": "0x767CfF8D8de386d7cbe91DbD39675132ba2f5967",
      "sequencerInbox": "0xb32f4257e05c56c53d46bbec9e85770eb52425d6"
    },
    "explorerUrl": "https://goerli-rollup-explorer.arbitrum.io/",
    "isArbitrum": true,
    "isCustom": true,
    "name": "ArbLocal",
    "partnerChainID": 5,
    "rpcURL": "https://goerli-rollup.arbitrum.io/rpc",
    "tokenBridge": {
      "l1CustomGateway": "0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7",
      "l1ERC20Gateway": "0x715D99480b77A8d9D603638e593a539E21345FdF",
      "l1GatewayRouter": "0x4c7708168395aEa569453Fc36862D2ffcDaC588c",
      "l1MultiCall": "0xa0A8537a683B49ba4bbE23883d984d4684e0acdD",
      "l1ProxyAdmin": "0x16101A84B00344221E2983190718bFAba30D9CeE",
      "l1Weth": "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      "l1WethGateway": "0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502",
      "l2CustomGateway": "0x8b6990830cF135318f75182487A4D7698549C717",
      "l2ERC20Gateway": "0x2eC7Bc552CE8E51f098325D2FcF0d3b9d3d2A9a2",
      "l2GatewayRouter": "0xE5B9d8d42d656d1DcB8065A6c012FE3780246041",
      "l2Multicall": "0x108B25170319f38DbED14cA9716C54E5D1FF4623",
      "l2ProxyAdmin": "0xeC377B42712608B0356CC54Da81B2be1A4982bAb",
      "l2Weth": "0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3",
      "l2WethGateway": "0xf9F2e89c8347BD96742Cc07095dee490e64301d6"
    },
    "retryableLifetimeSeconds": 608400
}})

const getL1TxnReceipt = async (txnHash: string) => {
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

  for (let l2ChainID of l1Network.partnerChainIDs) {
    // TODO: error handlle
    const l2Network = await getL2Network(l2ChainID);
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
  looksLikeEthDeposit: boolean
): Promise<L1ToL2MessageStatusDisplay> => {
  const { l2Network } = l1ToL2Message;
  const messageStatus = await l1ToL2Message.waitForStatus(undefined, 0);
  const { explorerUrl } = await getL2Network(l1ToL2Message.l2Provider);
  const autoRedeemRec = await l1ToL2Message.getAutoRedeemAttempt()
  const l2TxReceipt = messageStatus.status === L1ToL2MessageStatus.REDEEMED ? messageStatus.l2TxReceipt : autoRedeemRec
  const l2TxHash = l2TxReceipt ? l2TxReceipt.transactionHash : "null"

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
      const text =
        l2TxReceipt && l2TxReceipt.status === 1 && l2TxReceipt.transactionHash === autoRedeemRec?.transactionHash
          ? "Success! 🎉 Your retryable was auto-executed."
          : "Success! 🎉 Your retryable ticket has been executed directly on L2.";
      return {
        text: text,
        alertLevel: AlertLevel.GREEN,
        showRedeemButton: false,
        ...stuffTheyAllHave
      };
    }
    case L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2: {
      if (looksLikeEthDeposit) {
        return {
          text: "Success! 🎉 Your Eth deposit has completed",
          alertLevel: AlertLevel.GREEN,
          showRedeemButton: false,
          ...stuffTheyAllHave
        };
      }

      const text = (() => {
        if (autoRedeemRec) {
          return "Auto-redeem reverted; you can redeem it now:";
        }
        return "Auto-redeem reverted due to gas parameters; you can redeem it now:";
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
  const [l1ToL2MessagesDisplays, setl1ToL2MessagesDisplays] = React.useState<
    L1ToL2MessageStatusDisplay[]
  >([]);

  const retryablesSearch = async (txHash: string) => {
    setl1ToL2MessagesDisplays([]);
    setL1TxnHashState(L1ReceiptState.LOADING);

    if (txHash.length !== 66) {
      return setL1TxnHashState(L1ReceiptState.INVALID_INPUT_LENGTH);
    }
    window.history.pushState("", "", `/${txHash}`);
    const receiptRes = await getL1TxnReceipt(txHash);
    if (receiptRes === undefined) {
      return setL1TxnHashState(L1ReceiptState.NOT_FOUND);
    }
    const { l1Network, l1TxnReceipt, l1Provider } = receiptRes;
    if (l1TxnReceipt.status === 0) {
      return setL1TxnHashState(L1ReceiptState.FAILED);
    }

    const l1ToL2Messages = await getL1ToL2Messages(l1TxnReceipt, l1Network);
    if (l1ToL2Messages.length === 0) {
      return setL1TxnHashState(L1ReceiptState.NO_L1_L2_MESSAGES);
    }

    setL1TxnHashState(L1ReceiptState.MESSAGES_FOUND);

    const tx = await l1Provider.getTransaction(txHash)
    const looksLikeEthDeposit = (tx.data.slice(0,10) === "0x0f4d14e9")
    // const looksLikeEthDeposit = await l1TxnReceipt.looksLikeEthDeposit(
    //   l1Provider
    // );

    const l1ToL2MessageStatuses: L1ToL2MessageStatusDisplay[] = [];
    for (let l1ToL2Message of l1ToL2Messages) {
      const l1ToL2MessageStatus = await l1ToL2MessageToStatusDisplay(
        l1ToL2Message,
        looksLikeEthDeposit
      );
      l1ToL2MessageStatuses.push(l1ToL2MessageStatus);
    }
    setl1ToL2MessagesDisplays(l1ToL2MessageStatuses);
  };

  const handleChange = (event: any) => {
    setInput(event.target.value);
  };
  const handleSubmit = (event: any) => {
    event.preventDefault();
    retryablesSearch(input);
  };

  if (input === "" && window.location.pathname.length === 67){
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

      <div> {l1TxnResultText} </div>
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
          <div key={l1ToL2MessageDisplay.l1ToL2Message.retryableCreationId}>
            {
              <>
                <h2>Your transaction status:</h2>
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
            <h2>Txn links:</h2>
            <p>
              <br />
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
              <a
                href={
                  l1ToL2MessageDisplay.explorerUrl +
                  "/tx/" +
                  l1ToL2MessageDisplay.l2TxHash
                }
                rel="noreferrer"
                target="_blank"
              >
                L2 Tx
              </a>
              <br />
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default App;
