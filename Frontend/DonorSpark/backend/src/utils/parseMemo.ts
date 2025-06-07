// NOTE: This utility is no longer used in the main TransactionTimer service
// The timer now reads campaign end dates directly from the MySQL database
// instead of parsing transaction memos. This file is kept for reference
// in case memo parsing is needed for other purposes.

export const parseMemo = (memos: any[]): any => {
  let report = {};
  if (memos && memos.length > 0) {
    for (const memo of memos) {
      if (memo.Memo && memo.Memo.MemoData) {
        try {
          // Decode the hexadecimal memo data to a string
          const memoDataHex = memo.Memo.MemoData;
          const memoDataJson = Buffer.from(memoDataHex, "hex").toString("utf8");

          // Parse the JSON string into a JavaScript object
          const memoDataObject = JSON.parse(memoDataJson);

          // console.log('Decoded memo data:', memoDataObject)
          report = { ...report, ...memoDataObject };
        } catch (error) {
          console.log("Error parsing memo data:", error);
          // If it's not JSON, just return the decoded string
          const memoDataHex = memo.Memo.MemoData;
          const memoDataString = Buffer.from(memoDataHex, "hex").toString("utf8");
          return { memoData: memoDataString };
        }
      } else {
        console.log("No MemoData found in memo.");
      }
    }
    return report;
  } else {
    console.log("No memos found in the transaction.");
    return {};
  }
};

export default parseMemo; 