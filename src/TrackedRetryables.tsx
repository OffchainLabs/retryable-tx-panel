import React, { useState, useMemo, useEffect, useRef } from "react";
import axios from "axios";

interface TrackedRetryable {
  l1TxHash: string;
  msgIndex: number;
  ArbchainId: 42161 | 42170;
  createdAt: "2022-09-01T14:34:59.639Z";
  l1TimestampCreated: number;
  Arbchain: {
    lastBlockChecked: number;
  };
}

const unredeemedRetryablesURL = `${process.env
  .REACT_APP_DEV_REDEEMABLE_RETRYABLES_ROOT ||
  "https://retryablestatus.arbitrum.io"}/unredeemed/mainnet/`;

function TrackedRerryables() {
  const [trackedRetryables, setTrackedRetryables] = useState<
    TrackedRetryable[]
  >([]);

  const keepUpdatingTrackedRetryables = async () => {
    try {
      const res = await axios.get(unredeemedRetryablesURL);
      const retryablesObj = res.data.data;
      const retryablesArray = retryablesObj[42161].concat(retryablesObj[42170]);
      setTrackedRetryables(retryablesArray);
    } catch (err) {
      console.warn("Error fetch retyables data", err);
    } finally {
      setTimeout(keepUpdatingTrackedRetryables, 15 * 1000);
    }
  };

  useEffect(() => {
    keepUpdatingTrackedRetryables();
  }, []);

  return (
    <div>
      {" "}
      Found {trackedRetryables.length ? trackedRetryables.length : null}{" "}
      potentially redeemable retryables{" "}
    </div>
  );
}

export default TrackedRerryables;
