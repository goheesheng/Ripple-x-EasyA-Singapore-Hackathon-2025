# XRPL Charity Campaign System

A test project demonstrating the implementation of a charity campaign system using the XRP Ledger (XRPL) and the xrpl.js library.

## Features

- Wallet Management
  - Create and manage XRPL wallets
  - Handle test credentials
  - Support for seed/mnemonic-based wallet creation
  - Classic and X-address support

- Campaign Management
  - Create charity campaigns with funding targets
  - Process donations in RLUSD
  - Track campaign progress and status
  - Campaign deadline management

- Real-time Updates
  - Subscribe to ledger events
  - Monitor campaign transactions
  - Track payment streams
  - Real-time balance updates

- RLUSD Integration
  - Trust line creation and management
  - RLUSD payment processing
  - Balance tracking

## Project Structure

```
xrpl-charity-system/
├── src/
│   ├── wallet/
│   │   └── WalletManager.ts       # Wallet management functionality
│   ├── campaigns/
│   │   └── CampaignManager.ts     # Campaign management system
│   ├── subscriptions/
│   │   └── EventListener.ts       # Real-time event subscriptions
│   ├── utils/
│   │   └── XRPLHelpers.ts         # Utility functions
│   └── config.ts                  # Configuration settings
├── examples/
│   └── create-campaign.ts         # Example usage
└── tests/
    └── CampaignManager.test.ts    # Test suite
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to XRPL Testnet

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd xrpl-charity-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

1. Run the example script:
   ```bash
   npm start
   ```

2. Run tests:
   ```bash
   npm test
   ```

## Example: Creating a Campaign

```typescript
// Initialize managers
const walletManager = new WalletManager();
const campaignManager = new CampaignManager(walletManager);

// Connect to XRPL
await walletManager.connect();

// Create charity wallet
const charityWallet = await walletManager.createFundedTestWallet();
await walletManager.createRLUSDTrustLine(charityWallet);

// Create campaign
const campaign = await campaignManager.createCampaign(
  charityWallet,
  'Save the Trees',
  'Help us plant 1000 trees',
  '1000',  // 1000 RLUSD target
  30       // 30 days duration
);

// Make donation
const donorWallet = await walletManager.createFundedTestWallet();
await walletManager.createRLUSDTrustLine(donorWallet);
await campaignManager.donate(campaign.id, donorWallet, '100');
```

## Configuration

The system can be configured through the `config.ts` file:

- XRPL network settings
- Campaign parameters
- RLUSD configuration
- Fee settings

## Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Development

For development with hot reloading:

```bash
npm run dev
```

## Notes

- This is a test project using the XRPL Testnet
- RLUSD is a test token for demonstration
- Real deployments should include additional security measures
- Campaign wallets are managed by the charity organization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC 