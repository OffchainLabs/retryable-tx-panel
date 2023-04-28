export const getTargetChainId = (l1ChainID: number | undefined) => {
  if (!l1ChainID) {
    return undefined;
  }

  return {
    1: 42161,
    5: 421613,
  }[l1ChainID];
};
