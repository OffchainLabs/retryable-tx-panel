import Link from 'next/link';
import { Retryable, Deposit, BridgeRetryable } from './types';
import { querySubgraph, SubgraphQuery } from './querySubgraph';

async function fetchPendingRetryables(
  address?: string,
): Promise<`0x${string}`[]> {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const query = `
    query {
      retryables(
        where: {
          redeemedAtTimestamp: null,
          timeoutTimestamp_gt: ${timestamp}
        }
      ) {
        createdAtTxHash
      }
    }
  `;

  const result: { retryables: Retryable[] } = await querySubgraph(
    query,
    SubgraphQuery.Retryables,
  );
  const retryableCreationTxHashes = result.retryables.map(
    (retryable) => retryable.createdAtTxHash,
  );
  const queryForCreation = `
    query {
      retryables(
        where: {
          retryableTicketID_in: ${JSON.stringify(retryableCreationTxHashes)}
        }
      ) {
        sender
        transactionHash
      }
    }
  `;
  const { retryables }: { retryables: BridgeRetryable[] } = await querySubgraph(
    queryForCreation,
    SubgraphQuery.Bridge,
  );

  if (retryables.length === 0) {
    return [];
  }

  const retryableCreationTransactions = retryables.map(
    (retryable) => retryable.transactionHash,
  );
  // Query the deposit transactions hashes
  const queryForDeposits = `
    query {
      deposits(
        where: {
          transactionHash_in: ${JSON.stringify(retryableCreationTransactions)}
        }
      ) {
        sender
        transactionHash
      }
    }
  `;

  const { deposits }: { deposits: Deposit[] } = await querySubgraph(
    queryForDeposits,
    SubgraphQuery.Bridge,
  );

  const depositsMap = deposits.reduce((acc, deposit) => {
    acc[deposit.transactionHash] = deposit;
    return acc;
  }, {} as { [txHash: string]: Deposit });

  let retryablesWithDeposit = retryables.map((retryable) => {
    const deposit = depositsMap[retryable.transactionHash];
    return deposit ? deposit : retryable;
  });
  if (address) {
    retryablesWithDeposit = retryablesWithDeposit.filter((retryable) => {
      return retryable.sender.toLowerCase() === address.toLowerCase();
    });
  }
  return retryablesWithDeposit.map((retryable) => retryable.transactionHash);
}

type Props = {
  address?: string;
  limit?: number;
};
async function PendingRetryables({ address, limit }: Props) {
  const retryablesHashes = (await fetchPendingRetryables(address)).slice(
    0,
    limit,
  );

  return retryablesHashes.length ? (
    <ul>
      {retryablesHashes.map((retryablesHash) => (
        <li key={retryablesHash}>
          <Link href={`/tx/${retryablesHash}`}>{retryablesHash}</Link>
        </li>
      ))}
    </ul>
  ) : (
    <div>No pending retryables found for {address}</div>
  );
}

export default PendingRetryables;
