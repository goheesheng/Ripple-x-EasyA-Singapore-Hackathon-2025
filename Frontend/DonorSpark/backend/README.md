# DonorSpark Backend Timer Service

This backend service monitors a specific XRPL transaction and checks if a UTC time condition stored in the transaction's memo has been met.

## Features

- 🕐 Periodic checking of transaction memo data (every 1 minute by default)
- 📊 Automatic parsing of memo data using XRPL commons standards
- ⏰ UTC time comparison and notification when target time is reached
- 🔄 Robust error handling and connection management
- 🛑 Graceful shutdown handling

## Setup

1. **Install dependencies:**
   ```bash
   cd frontend/DonorSpark/backend
   npm install
   ```

2. **Run the service:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## How it Works

The service monitors transaction `79F19165AAB1FAC1F0C2FC85D4F58BEC363063207379E22C74F1F74E8A87C064` and:

1. **Fetches the transaction memo** from XRPL testnet
2. **Parses the memo data** using the standard XRPL memo format
3. **Looks for UTC time fields** in the memo (supports multiple field names):
   - `utcTime`
   - `targetTime`
   - `scheduledTime`
   - `executeAt`
   - `timestamp`
4. **Compares current UTC time** with the target time from the memo
5. **Prints "TIME HIT!" message** when the condition is met

## Expected Memo Format

The transaction memo should contain JSON data with a time field, for example:

```json
{
  "utcTime": "2025-01-26T15:30:00.000Z",
  "description": "Charity donation release time"
}
```

Or simply a timestamp string:
```
"2025-01-26T15:30:00.000Z"
```

## Output

The service will display:
- Initial transaction details and memo information
- Periodic time checks with remaining time countdown
- **"🎯 TIME HIT!"** message when the UTC time condition is met
- Target time and current time for verification

## Configuration

You can modify the following in `src/index.ts`:
- `TRANSACTION_ID`: The specific transaction to monitor
- `CHECK_INTERVAL_MINUTES`: How often to check (default: 1 minute)

## Dependencies

- `xrpl`: Official XRPL JavaScript library
- `typescript`: TypeScript support
- `ts-node`: TypeScript execution for Node.js 