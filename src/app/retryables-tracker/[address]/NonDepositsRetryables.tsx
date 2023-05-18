import Link from 'next/link';
import { querySubgraph, subgraphUrl } from './querySubgraph';
import { BridgeRetryable } from './types';

async function fetchNonDepositsRetryablesFromAddress(address: string) {
  const queryForSubmission = `
    query {
      retryables(
        where: {
          sender: "${address}"
        }
      ) {
        transactionHash
      }
    }
  `;

  const { retryables }: { retryables: BridgeRetryable[] } = await querySubgraph(
    queryForSubmission,
    subgraphUrl.Bridge,
  );

  return retryables;
}

type Props = {
  address: string;
  limit?: number;
};
async function NonDepositsRetryables({ address, limit }: Props) {
  const retryables = (
    await fetchNonDepositsRetryablesFromAddress(address)
  ).slice(0, limit);

  return retryables.length ? (
    <ul>
      {retryables.map((retryable) => (
        <li key={retryable.transactionHash}>
          <Link href={`/tx/${retryable.transactionHash}`}>
            {retryable.transactionHash}
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <div>No non-deposit retryables found for {address}</div>
  );
}

export default NonDepositsRetryables;
