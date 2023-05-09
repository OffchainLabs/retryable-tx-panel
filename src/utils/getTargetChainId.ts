export const getTargetChainId = (chainID: number | undefined) => {
  const defaultTargetChainId = 42161;

  if (!chainID) {
    return defaultTargetChainId;
  }

  return (
    {
      1: 42161,
      5: 421613,
      42161: 42161,
      421613: 421613,
    }[chainID] || defaultTargetChainId
  );
};
