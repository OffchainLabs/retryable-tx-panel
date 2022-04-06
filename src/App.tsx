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
  5: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  1337: `http://localhost:8545`
};

addCustomNetwork({
  customL1Network: {
    "blockTime": 15,
    "chainID": 5,
    "explorerUrl": "https://goerli.etherscan.io/",
    "isCustom": true,
    "name": "Goerli",
    "partnerChainIDs": [
      421612
    ],
    "rpcURL": `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
  },
  customL2Network: {
    "chainID": 421612,
    "confirmPeriodBlocks": 960,
    "ethBridge": {
      "bridge": "0x9903a892da86c1e04522d63b08e5514a921e81df",
      "inbox": "0x1fdbbcc914e84af593884bf8e8dd6877c29035a2",
      "outboxes": {
        "0xFDF2B11347dA17326BAF30bbcd3F4b09c4719584": 0
      },
      "rollup": "0x767CfF8D8de386d7cbe91DbD39675132ba2f5967",
      "sequencerInbox": "0xb32f4257e05c56c53d46bbec9e85770eb52425d6"
    },
    "explorerUrl": "https://nitro-devnet-explorer.arbitrum.io/",
    "isArbitrum": true,
    "isCustom": true,
    "name": "ArbLocal",
    "partnerChainID": 5,
    "rpcURL": "https://nitro-devnet.arbitrum.io/rpc",
    "tokenBridge": {
      "l1CustomGateway": "0x23D4e0D7Cb7AE7CF745E82262B17eb46535Ae819",
      "l1ERC20Gateway": "0x6336C4e811b2f7D17d45b6241Fd47F2E11621Ffb",
      "l1GatewayRouter": "0x8BDFa67ace22cE2BFb2fFebe72f0c91CDA694d4b",
      "l1MultiCall": "0x90863B80f274b6D2227b01f2c1de4fdCb04896E2",
      "l1ProxyAdmin": "0x678cC9702ebF79d741E4f815937475311A58404a",
      "l1Weth": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
      "l1WethGateway": "0x64bfF696bE6a087A81936b9a2489624015381be4",
      "l2CustomGateway": "0x7AC493f26EF26904E52fE46C8DaEE247b9A556B8",
      "l2ERC20Gateway": "0xf298434ffE691400b932f4b14B436f451F4CED76",
      "l2GatewayRouter": "0xC502Ded1EE1d616B43F7f20Ebde83Be1A275ca3c",
      "l2Multicall": "0x1068dbfcc13f3a22fcAe684943AFA43cc66fA689",
      "l2ProxyAdmin": "0x1F2715AaC7EeFb75ebCc478f3D9a361fa47A95DD",
      "l2Weth": "0x96CfA560e7332DebA750e330fb6f59E2269f40Dd",
      "l2WethGateway": "0xf10c7CAA33A3360f60053Bc1081980f62567505F"
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
  const messageStatus = await l1ToL2Message.waitForStatus();
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
    const receiptRes = await getL1TxnReceipt(txHash);
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

    // TODO: Identify ETH Deposits
    const looksLikeEthDeposit = false
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
