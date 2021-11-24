import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@gimmixorg/use-wallet";
import { RetryableTxs, shouldAttemptRedeemText } from "./App";
import  ethers  from "ethers"
import { ArbRetryableTx__factory } from 'arb-ts'
const chainIDToName  =(chainID:number)=> {
     switch (chainID) {
        case 1:
            return "Mainnet"
        case 4: 
            return "Rinkeby"
        case 42161:
            return "Arbitrum One"
        case 421611:
            return "RinkArby"
        default:
            return "";
    }
}

interface RedeemProps {
  userTxs: RetryableTxs;
}

const redeem = async (signer: ethers.providers.JsonRpcSigner, userTxnHash: string)=>{
    const arbRetryableTx = ArbRetryableTx__factory.connect("0x000000000000000000000000000000000000006E", signer)
    const res = await arbRetryableTx.redeem(userTxnHash)
    const rec = await res.wait()
    alert(`Successfuly redeemed! ${userTxnHash}`)
}

function Redeem({ userTxs }: { userTxs: RetryableTxs }) {
  const { account, connect, disconnect, provider } = useWallet();
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
      signer.getChainId().then(setConnectedNetworkID);
    }
  }, [signer,provider]);

  const redeemButton = useMemo(()=>{
      if(!signer) return 
      if(connectedNetworkId !== userTxs.l2ChainId){
          return `To redeem, connect to chain ${userTxs.l2ChainId} (${chainIDToName(userTxs.l2ChainId)})`
      }
    //   @ts-ignore
      return <button onClick={()=> redeem(signer, userTxs.l2Tx)}>redeem</button>
    
  },[connectedNetworkId, userTxs, signer])

  console.warn("acc", account);
  console.warn("signer", signer);

  const show = userTxs.failReason === shouldAttemptRedeemText;
  if(!show) return null
  return (
    <div>
      {signer ? (
        <button onClick={() => disconnect()}>Disconnect Wallet</button>
      ) : (
        <button onClick={() => connect()}>Connect Wallet To Redeem</button>
      )}
      <div>

      {redeemButton }
      </div>


    </div>
  );
}

export default Redeem;
