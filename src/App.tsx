import "./App.css";
import React from "react";
import { BridgeHelper } from "arb-ts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { toUtf8String } from "ethers/lib/utils";
import Redeem from './Redeem'

export enum Status {
  CREATION_FAILURE,
  NOT_FOUND,
  REEXECUTABLE,
  SUCCEEDED
}

export interface Result {
  status: Status,
  text: string
}

export interface RetryableTxs {
  l1BlockExplorerUrl: string;
  l2BlockExplorerUrl: string;
  l1Tx?: string;
  l2Tx?: string;
  autoRedeem?: string;
  ticket?: string;
  result: Result;
  l2ChainId: number
}
interface ArbTransactionReceipt {
  to: string;
  from: string;
  contractAddress: string;
  transactionIndex: string;
  root?: string;
  gasUsed: string;
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: Array<any>;
  blockNumber: string;
  confirmations: string;
  cumulativeGasUsed: string;
  byzantium: boolean;
  status?: string;

  returnData: string;
  returnCode: string;

  feeStats: {
    prices: {
      l1Transaction: string;
      l1Calldata: string;
      l2Storage: string;
      l2Computation: string;
    };
    unitsUsed: {
      l1Transaction: string;
      l1Calldata: string;
      l2Storage: string;
      l2Computation: string;
    };
    paid: {
      l1Transaction: string;
      l1Calldata: string;
      l2Storage: string;
      l2Computation: string;
    };
  };
}

const getArbTransactionReceipt = async (
  l2Provider: JsonRpcProvider,
  txHash: string
) => {
  if (txHash.length !== 66) throw new Error("Invalid tx hash length");
  return l2Provider
    .send("eth_getTransactionReceipt", [txHash])
    .then((res: ArbTransactionReceipt) => {
      if (!res) throw new Error("No tx receipt received");
      if (!res.returnCode)
        throw new Error(
          "Tx receipt doesn't have returnCode field. prob a l1 provider"
        );
      return res;
    });
};

// const connectMetamask = async () => {
//   const providerOptions = {};
//   const web3Modal = new Web3Modal({
//     // network: "mainnet", // optional
//     // cacheProvider: true, // optional
//     providerOptions, // required
//   });
//   const instance = await web3Modal.connect();
//   const provider = new providers.Web3Provider(instance);
//   const signer = provider.getSigner();
//   TODO: what if a user ignores the metamask popup?
// }
type SUPPORTED_NETWORKS = "1" | "42161" | "4" | "421611";

if(!process.env.REACT_APP_INFURA_KEY) throw new Error("No REACT_APP_INFURA_KEY set")

const retryableSearch = async (txHash: string): Promise<RetryableTxs> => {
  const providers: { [key in SUPPORTED_NETWORKS]: JsonRpcProvider } = {
    "1": new JsonRpcProvider(
      "https://mainnet.infura.io/v3/" + process.env.REACT_APP_INFURA_KEY
    ),
    "4": new JsonRpcProvider(
      "https://rinkeby.infura.io/v3/" + process.env.REACT_APP_INFURA_KEY
    ),
    "42161": new JsonRpcProvider("https://arb1.arbitrum.io/rpc"),
    "421611": new JsonRpcProvider("https://rinkeby.arbitrum.io/rpc"),
  };

  const receipts = await Promise.all(
    Object.keys(providers).map((key) => {
      const provider = providers[key as SUPPORTED_NETWORKS];
      const receipt = provider.send("eth_getTransactionReceipt", [txHash]);
      return receipt
        .then((receiptFields) =>
          !receiptFields
            ? undefined
            : {
                ...receiptFields,
                network: key as SUPPORTED_NETWORKS,
              }
        )
        .catch((err) => {
          console.log(err);
          return undefined;
        });
    })
  );

  const receipt = receipts.filter((rec) => rec);
  if (receipt.length !== 1) {
    console.log(receipt);
    throw new Error("Something went down with receipts");
  }

  const chainId = BigNumber.from(receipt[0].network);
  const isTestnet = chainId.toNumber() === 4 || chainId.toNumber() === 421611;
  const l1BlockExplorerUrl = isTestnet
    ? "https://rinkeby.etherscan.io/tx/"
    : "https://etherscan.io/tx/";
  const l2BlockExplorerUrl = isTestnet
    ? "https://testnet.arbiscan.io/tx/"
    : "https://arbiscan.io/tx/";

  if (chainId.toNumber() === 1 || chainId.toNumber() === 4) {
    console.log("looking for l1 tx hash");
    const l1Receipt = receipt[0];
    console.log("getting seq num");
    const _seqNums = await BridgeHelper.getInboxSeqNumFromContractTransaction(
      l1Receipt,
      // TODO: add L1 inbox to arb-ts networks object
      isTestnet
        ? "0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e"
        : "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f"
    );
    const l2ChainId = isTestnet
      ? BigNumber.from(421611)
      : BigNumber.from(42161);

    if (!_seqNums) throw new Error("no seq nums");
    const seqNum = _seqNums[0];
    // TODO: support many seqNums
    const autoRedeemHash = await BridgeHelper.calculateRetryableAutoRedeemTxnHash(seqNum, l2ChainId);
    const userTxnHash = await BridgeHelper.calculateL2RetryableTransactionHash(
      seqNum,
      l2ChainId
    );
    const retryableTicketHash = await BridgeHelper.calculateL2TransactionHash(
      seqNum,
      l2ChainId
    );

    const getResult = async (): Promise<Result> => {
      const l2Provider = providers[l2ChainId.toString() as SUPPORTED_NETWORKS];

      try {
        const retryableTicketRec = await getArbTransactionReceipt(
          l2Provider,
          retryableTicketHash
        );

        if (retryableTicketRec.status === "0x0")
          return {
            status: Status.CREATION_FAILURE,
            text: "Retryable ticket creation reverted. maxSubmissionCost is too low?"
          }
      } catch (e) {
        return {
          status: Status.NOT_FOUND,
          text: "Has your transaction been included in the L2 yet?"

        }
      }

      try {
        const autoRedeemRec = await getArbTransactionReceipt(
          l2Provider,
          autoRedeemHash
        );

        switch (BigNumber.from(autoRedeemRec.returnCode).toNumber()) {
          case 1:
            return {
              status: Status.REEXECUTABLE,
              text: autoRedeemRec.returnData.length < 10
              ? "The auto redeem reverted. Not sure why."
              : `Your auto redeem reverted. The revert reason is: ${toUtf8String(
                  `0x${autoRedeemRec.returnData.substr(10)}`
                )}`
            }
            
          case 2:
            return {
              text: "auto redeem hit congestion in the chain",
              status: Status.REEXECUTABLE
            }
          case 8:
            return {
              text: "auto redeem _TxResultCode_exceededTxGasLimit",
              status: Status.REEXECUTABLE
            }
          case 10:
            return {
              text: "auto redeem TxResultCode_belowMinimumTxGas",
              status: Status.REEXECUTABLE
            }
          case 11:
            return {
              text: "auto redeem TxResultCode_gasPriceTooLow",
              status: Status.REEXECUTABLE
            }
          case 12:
            return {
              text:  "auto redeem TxResultCode_noGasForAutoRedeem",
              status: Status.REEXECUTABLE
            }
          default:
            break;
        }
      } catch (e) {
        // TODO: what if the tx was redeemed later
        // ;
        return {
          text:  "The transaction was not automatically redeemed.",
          status: Status.REEXECUTABLE
        }
      }

      try {
        const userTxnRec = await getArbTransactionReceipt(
          l2Provider,
          userTxnHash
        );

        // TODO: does the user tx ever actually have useful info?

        switch (BigNumber.from(userTxnRec.returnCode).toNumber()) {
          case 0:
            return {
              status: Status.SUCCEEDED,
              text: "Your transaction succeeded 👍"
            }
          case 1:
            return{
              status: Status.REEXECUTABLE,
              text: userTxnRec.returnData.length < 10
              ? "The L2 user tx reverted. Not sure why."
              : `Your user txn reverted. The revert reason is: ${toUtf8String(
                  `0x${userTxnRec.returnData.substr(10)}`
                )}`
            } ;
          default:
            break;
        }
        return {
          text:  "The L2 user tx reverted. Not sure why.",
          status: Status.REEXECUTABLE
        }
      } catch (e) {
        return {
          status: Status.REEXECUTABLE,
          text:  "No user transaction found. You should attempt to redeem it."
        }
     
      }

    };

    const result = await getResult();

    return {
      l1BlockExplorerUrl: l1BlockExplorerUrl,
      l2BlockExplorerUrl: l2BlockExplorerUrl,
      l1Tx: txHash,
      l2Tx: userTxnHash,
      autoRedeem: autoRedeemHash,
      ticket: retryableTicketHash,
      result: result,
      l2ChainId: l2ChainId.toNumber()
    };
  } else if (chainId.toNumber() === 42161 || chainId.toNumber() === 421611) {
  } else {
    throw new Error("Network not identified");
  }
  throw new Error(
    "Hit unimplemented code path. Please provide L1 tx hash for now."
  );
};

function App() {
  const [input, setInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  // this is set as an object with user txs
  const [userTxs, setUserTxs] = React.useState<undefined | RetryableTxs>(
    undefined
  );

  const handleChange = (event: any) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event: any) => {
    setLoading(true);
    event.preventDefault();

    if (!input) return;

    if (input.length !== 66) {
      alert("Invalid tx hash");
      setLoading(false);
      return;
    }

    retryableSearch(input)
      .then((res) => {
        console.log(res);
        setUserTxs(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        alert(err.toString());
        setLoading(false);
      });
  };

  if (loading) return <p>Loading...</p>;

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

      {userTxs && (
        <>
          {userTxs.result && (
            <>
              <h2>Your transaction status:</h2>
              <p>{userTxs.result.text}</p>
              <Redeem
              userTxs={userTxs}
              />
            </>
          )}
          <h2>Useful links:</h2>
          <p>
            <a
              href={userTxs["l1BlockExplorerUrl"] + userTxs["l1Tx"]}
              rel="noreferrer"
              target="_blank"
            >
              L1 tx
            </a>
            <br />
            <a
              href={userTxs["l2BlockExplorerUrl"] + userTxs["ticket"]}
              rel="noreferrer"
              target="_blank"
            >
              Retryable Ticket
            </a>
            <br />
            <a
              href={userTxs["l2BlockExplorerUrl"] + userTxs["autoRedeem"]}
              rel="noreferrer"
              target="_blank"
            >
              Auto Redeem
            </a>
            <br />
            <a
              href={userTxs["l2BlockExplorerUrl"] + userTxs["l2Tx"]}
              rel="noreferrer"
              target="_blank"
            >
              L2 tx
            </a>
            <br />
          </p>
        </>
      )}
    </div>
  );
}

export default App;
