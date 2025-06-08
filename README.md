# Ripple-Based Verified Donation Platform

A decentralized donation platform built on the XRP Ledger (XRPL), utilizing RLUSD for stable-value transactions. The system integrates Fractal ID for Know Your Customer (KYC) verification and Decentralized Identifiers (DIDs) for on-chain identity management. It is designed to support fiat off-ramping, enabling traditional charities to securely and transparently receive donations.

---

## Tech Stack

### Frontend
- React.js (with TypeScript)
- TailwindCSS
- Crossmark (XRPL wallet browser extension)

### Backend
- Node.js
- Express.js
- MySQL (for campaign and user metadata)

### Blockchain
- XRPL (XRP Ledger)
- XRPL.js (JavaScript SDK for XRPL interaction)
- RLUSD (Ripple's USD-pegged stablecoin)

### Development Tools & Environment
- TypeScript
- npm (Node Package Manager)
- Git (Version Control)

---

## Features

- Identity verification using Fractal ID
- DID generation and on-chain storage via XRPL
- RLUSD-based donation mechanism
- On-chain transparency of donation flows
- Planned dashboard for charities 
- Payout receipts for donors to be able to view tax reliefs

---

## System Overview

### 1. Donor Verification
- Donor connects an XRPL-compatible wallet using Crossmark

### 2. Donation Process
- Donor chooses a cause to donate to
- Donor sends RLUSD to a designated campaign wallet
- All donations are recorded and visible on-chain

### 3. Payout Process
- Upon reaching a campaign goal OR deadline:
  - RLUSD is exchanged for XSGD on XRPL DEX
  - XSGD is transferred to a payment provider
  - XSGD is converted to Fiat currency and withdrawn to the charity’s local bank account

---

## Project Structure
RIPPLE-X-EASYA-SINGAPORE-HACKATHON-2025-1
├── Frontend/
│   └── DonorSpark/               # React frontend application
├── routes/                       # Express route handlers
├── services/                     # Backend service logic
├── node_modules/                 # Node.js dependencies
├── xrpl/                         # XRPL interaction logic
├── XRPLtest/                     # Test scripts for XRPL features
├── .env                          # Environment variable configuration
├── .gitignore                    # Git ignore rules
├── server.js                     # Entry point for Node.js backend
├── package.json                  # Project metadata and scripts
├── package-lock.json             # npm lock file
├── requirements.txt              # Python backend dependencies
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Project documentation


## Architecture Overview
Donor
  │
  ▼
React Frontend (Crossmark Wallet Integration)
  │
  ▼
Node.js Backend (Express API)
  │
  ├───────────────► MySQL Database
  │                     │
  │                     ▼
  │           Campaign & User Metadata
  │
  └───────────────► XRPL Blockchain
                        │
                        ▼
              Immutable RLUSD Transactions

## Dapp Deployer Block Explorer URL
```bash
https://testnet.xrpl.org/accounts/raPeFkekHdpKkSEavQfu7C8iQstFX9EtDA
```

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/goheesheng/Ripple-x-EasyA-Singapore-Hackathon-2025.git
cd Ripple-x-EasyA-Singapore-Hackathon-2025
```
### 2. Install Packages & Launch Servers
```bash
cd frontend
cd DonorSpark
npm i
npm run dev:full
```
### 3. Navigate to Web Page
```bash
localhost:5173
```

