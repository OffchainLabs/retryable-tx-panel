export enum subgraphUrl {
  Retryables = 'https://api.thegraph.com/subgraphs/name/gvladika/arbitrum-retryables',
  Bridge = 'https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-nitro',
}

export async function querySubgraph(query: string, url: subgraphUrl) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  return data;
}
