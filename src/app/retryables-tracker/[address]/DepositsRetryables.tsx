import Link from 'next/link';
import { querySubgraph, subgraphUrl } from './querySubgraph';
import { Deposit } from './types';

async function fetchDepositsRetryablesFromAddress(address: string) {
  const queryForDeposit = `
    query {
      deposits(
        where: {
          sender: "${address}"
        },
        orderBy: timestamp,
        orderDirection: desc
      ) {
        transactionHash
      }
    }
  `;
  const { deposits }: { deposits: Deposit[] } = await querySubgraph(
    queryForDeposit,
    subgraphUrl.Bridge,
  );

  return deposits;
  // const transactionHashes = deposits.map((deposit) => deposit.transactionHash);
  // const queryForSubmission = `
  //   query {
  //     retryables(
  //       where: {
  //         transactionHash_in: ${JSON.stringify(transactionHashes)}
  //       }
  //     ) {
  //       sender
  //       transactionHash
  //       retryableTicketID
  //     }
  //   }
  // `;
  // const { retryables }: { retryables: BridgeRetryable[] } = await querySubgraph(
  //   queryForSubmission,
  //   bridgeSubgraphUrl,
  // );

  // const submissionHashes = retryables.map(
  //   (retryable) => retryable.retryableTicketID,
  // );

  // const queryForL2Ticket = `
  //   query {
  //     retryables(
  //       where: {
  //         createdAtTxHash_in: ${JSON.stringify(submissionHashes)}
  //       }
  //     ) {
  //       id
  //       status
  //       retryTxHash
  //       timeoutTimestamp
  //       createdAtTimestamp
  //       createdAtBlockNumber
  //       createdAtTxHash
  //       redeemedAtTimestamp
  //       isAutoRedeemed
  //       sequenceNum
  //       donatedGas
  //       gasDonor
  //       maxRefund
  //       submissionFeeRefund
  //       requestId
  //       l1BaseFee
  //       deposit
  //       callvalue
  //       gasFeeCap
  //       gasLimit
  //       maxSubmissionFee
  //       feeRefundAddress
  //       beneficiary
  //       retryTo
  //       retryData
  //     }
  //   }
  // `;

  // const resultForL2Ticket: { retryables: Retryable[] } = await querySubgraph(
  //   queryForL2Ticket,
  //   retryablesSubgraphUrl,
  // );

  // return deposits;
}

type Props = {
  address: string;
  limit?: number;
};
async function DepositRetryables({ address, limit }: Props) {
  const depositRetryables = (
    await fetchDepositsRetryablesFromAddress(address)
  ).slice(0, limit);

  return depositRetryables.length ? (
    <ul>
      {depositRetryables.map((depositRetryable) => (
        <li key={depositRetryable.transactionHash}>
          <Link href={`/tx/${depositRetryable.transactionHash}`}>
            {depositRetryable.transactionHash}
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <div>No deposit retryables found for {address}</div>
  );
}

export default DepositRetryables;
