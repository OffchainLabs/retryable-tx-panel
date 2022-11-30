function isValidTxHash(txHash: string | undefined): txHash is string {
  if (!txHash) {
    return false;
  }
  return /^0x([A-Fa-f0-9]{64})$/.test(txHash);
}

export { isValidTxHash };
