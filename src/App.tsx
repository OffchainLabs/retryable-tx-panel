import logo from './logo.svg';
import './App.css';
import React from "react"
import { Bridge } from "arb-ts"
import { Wallet, providers } from "ethers"
import Web3Modal from "web3modal";

interface RetryableTxs {
  "l1BlockExplorerUrl": string,
  "l2BlockExplorerUrl": string,
  "l1Tx": string,
  "l2Tx": string,
  "autoRedeem": string,
  "ticket": string
}

function App() {
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  // this is set as an object with user txs
  const [userTxs, setUserTxs] = React.useState<undefined | RetryableTxs>(undefined);

  const handleChange = (event: any) => {
    setInput(event.target.value);
  }

  const handleSubmit = (event: any) => {
    setLoading(true)
    event.preventDefault();

    if(input.length !== 66) {
      alert("Invalid tx hash")
      setLoading(false)
      return;
    }

    retryableSearch(input)
      .then(() => setLoading(false))
      .catch((err) => {
        console.log(err)
        alert(err.toString());
        setLoading(false)
      })
  }

  const retryableSearch = async (l1TxHash: string) => {
    const providerOptions = {};
    const web3Modal = new Web3Modal({
      // network: "mainnet", // optional
      // cacheProvider: true, // optional
      providerOptions // required
    });
    const instance = await web3Modal.connect();
    const provider = new providers.Web3Provider(instance);
    const signer = provider.getSigner();
    // TODO: what if a user ignores the metamask popup?

    let l1Provider: providers.JsonRpcProvider;
    let l2Provider: providers.JsonRpcProvider;
    let l1BlockExplorerUrl: string;
    let l2BlockExplorerUrl: string;
    
    const chainId = await signer.getChainId()
    if(chainId === 42161) {
      console.log("connected to correct L2 mainnet network")
      l1Provider = new providers.JsonRpcProvider("https://mainnet.infura.io/v3/8838d00c028a46449be87e666387c71a")
      l2Provider = signer.provider
      l1BlockExplorerUrl = "https://etherscan.io/tx/"
      l2BlockExplorerUrl = "https://arbiscan.io/tx/"
    } else if(chainId === 421611) {
      console.log("connected to correct L2 rinkeby network")
      l1Provider = new providers.JsonRpcProvider("https://rinkeby.infura.io/v3/8838d00c028a46449be87e666387c71a")
      l2Provider = signer.provider
      l1BlockExplorerUrl = "https://rinkeby.etherscan.io/tx/"
      l2BlockExplorerUrl = "https://rinkeby-explorer.arbitrum.io/tx/"
    } else if(chainId === 1) {
      // TODO: use addCustomNetwork from metamask
      throw new Error("instead change your metamask to connect to arb1")
    } else if(chainId === 4) {
      // TODO: use addCustomNetwork from metamask
      throw new Error("instead change your metamask to connect to arb rinkeby")
    } else {
      throw new Error(`Chain id ${chainId} not recognised`)
    }

    // TODO: if user on rinkeby, try looking for L1 tx hash on mainnet
    // TODO: use metamask instead of random wallet
    const wallet = Wallet.createRandom()
    const bridge = await Bridge.init(wallet.connect(l1Provider), wallet.connect(l2Provider))
    
    console.log("looking for l1 tx hash")
    const l1Receipt = await bridge.getL1Transaction(l1TxHash).catch(err => {
      throw new Error("can't get L1 receipt. are you connected to the correct network?")
    })
    console.log("getting seq num")
    const _seqNums = await bridge.getInboxSeqNumFromContractTransaction(l1Receipt)

    if (!_seqNums) throw new Error('no seq nums')
    const seqNum = _seqNums[0]

    const autoRedeemHash = await bridge.calculateRetryableAutoRedeemTxnHash(
      seqNum
    )
    const redeemTxnHash = await bridge.calculateL2RetryableTransactionHash(seqNum)
    const retryableTicketHash = await bridge.calculateL2TransactionHash(seqNum)


    setUserTxs({
      "l1BlockExplorerUrl": l1BlockExplorerUrl,
      "l2BlockExplorerUrl": l2BlockExplorerUrl,
      "l1Tx": l1TxHash,
      "l2Tx": redeemTxnHash,
      "autoRedeem": autoRedeemHash,
      "ticket": retryableTicketHash
    })

    // TODO: get receipts and infer what failed

    // const autoRedeemRec = await l2Provider.getTransactionReceipt(autoRedeemHash)
    // const redeemTxnRec = await l2Provider.getTransactionReceipt(redeemTxnHash)
    // const retryableTicketRec = await l2Provider.getTransactionReceipt(
    //   retryableTicketHash
    // )
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Arbitrum Retryables Panel</p>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Paste your L1 tx hash below and find out whats up with your L1 to L2 tx
        </p>
      { !loading &&
        <form onSubmit={handleSubmit}>
          <label>
            <input value={input} onChange={handleChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      }
      { loading &&
        <p>Loading...</p>
      }
      { userTxs &&

        <p>
          Got retryable txs. <br />
          <a href={userTxs["l1BlockExplorerUrl"] + userTxs["l1Tx"]} rel="noreferrer" target="_blank">
          L1 tx
          </a> <br />
          <a href={userTxs["l2BlockExplorerUrl"] + userTxs["ticket"]} rel="noreferrer" target="_blank">
          Retryable Ticket
          </a> <br />
          <a href={userTxs["l2BlockExplorerUrl"] + userTxs["autoRedeem"]} rel="noreferrer" target="_blank">
          Auto Redeem
          </a> <br />
          <a href={userTxs["l2BlockExplorerUrl"] + userTxs["l2Tx"]} rel="noreferrer" target="_blank">
          L2 tx
          </a> <br />
        </p>
      }

      </header>
    </div>
  );
}

export default App;
