import {
  L1ToL2MessageReaderClassicWithNetwork,
  L1ToL2MessageReaderWithNetwork,
} from '@/types';
import { L1ToL2MessageReaderClassic } from '@arbitrum/sdk';
import { constants } from 'ethers';
import { hexDataSlice } from 'ethers/lib/utils.js';

export const looksLikeCallToInboxethDeposit = async (
  l1ToL2Message:
    | L1ToL2MessageReaderWithNetwork
    | L1ToL2MessageReaderClassicWithNetwork,
) => {
  const txData = (
    await l1ToL2Message.l2Provider.getTransaction(
      l1ToL2Message.retryableCreationId,
    )
  ).data;
  // Check that length of retryData param is zero
  // Classic: https://arbiscan.io/tx/0x70670f5aa9cfbfb3e4e7328b0635432affd1aa7ebe337e1583df50ab7f43357e
  // #7 mean 8th parameter (for the position) and 9th parameter is it's length
  // the slice should be 4 + 8 * 32, 4 + 9 * 32
  // nitro: https://arbiscan.io/tx/0x3510b0c56ace2fa6d90b8a6a63b52ff13b76b0703198e5648afb7a35b15a7a1a
  // #10 mean 11th parameter (for the position) and 12th parameter is it's length
  // the slice should be 4 + 11 * 32, 4 + 12 * 32
  const sliceIndex =
    l1ToL2Message instanceof L1ToL2MessageReaderClassic ? 8 : 11;
  return (
    hexDataSlice(txData, 4 + sliceIndex * 32, 4 + (sliceIndex + 1) * 32) ===
    constants.HashZero
  );
};
