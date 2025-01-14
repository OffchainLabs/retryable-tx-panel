import {
  ParentToChildMessageReaderClassicWithNetwork,
  ParentToChildMessageReaderWithNetwork,
} from '@/types';
import { ParentToChildMessageReaderClassic } from '@arbitrum/sdk';
import { constants } from 'ethers';
import { hexDataSlice } from 'ethers/lib/utils';

export const looksLikeCallToInboxethDeposit = async (
  parentToChildMessage:
    | ParentToChildMessageReaderWithNetwork
    | ParentToChildMessageReaderClassicWithNetwork,
) => {
  const txData = (
    await parentToChildMessage.childProvider.getTransaction(
      parentToChildMessage.retryableCreationId,
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
    parentToChildMessage instanceof ParentToChildMessageReaderClassic ? 8 : 11;

  const retryDataIsZero =
    hexDataSlice(txData, 4 + sliceIndex * 32, 4 + (sliceIndex + 1) * 32) ===
    constants.HashZero;

  if (parentToChildMessage instanceof ParentToChildMessageReaderClassic) {
    return retryDataIsZero;
  }

  return (
    retryDataIsZero &&
    parentToChildMessage.messageData.l2CallValue.eq(constants.Zero)
  );
};
