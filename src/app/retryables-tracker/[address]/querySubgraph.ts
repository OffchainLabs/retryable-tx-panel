const retryablesSubgraphUrl = process.env.RETRYABLES_SUBGRAPH_URL;
const bridgeSubgraphUrl = process.env.BRIDGE_SUBGRAPH_URL;

if (!retryablesSubgraphUrl || !bridgeSubgraphUrl) {
  throw new Error('Missing subgraph Urls');
}

export enum SubgraphQuery {
  Retryables = 'retryables',
  Bridge = 'bridge',
}

const urls = {
  [SubgraphQuery.Retryables]: retryablesSubgraphUrl,
  [SubgraphQuery.Bridge]: bridgeSubgraphUrl,
};

export async function querySubgraph(query: string, type: SubgraphQuery) {
  const url = urls[type];
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    cache: 'no-cache',
  });

  const { data } = await response.json();
  return data;
}
