# 🤝 Ripple-Based Verified Donation Platform

A decentralized donation matching platform built on the **XRP Ledger (XRPL)** using **RLUSD**, with **Fractal ID** for KYC verification and **on-chain DIDs** for identity management. Designed for seamless off-ramp to fiat, making it easy for non-Web3-native charities to receive donations.

## 🔧 Tech Stack

| Component        | Tech                                       |
|------------------|--------------------------------------------|
| Blockchain       | XRPL (Testnet or Mainnet)                  |
| Stablecoin       | RLUSD (Ripple USD stablecoin)             |
| Identity Layer   | Fractal ID + DIDs stored via IPFS          |
| DID Storage      | IPFS + XRPL account fields (Domain/Memo)  |
| Matching Logic   | XRPL Hooks or backend trigger              |
| Off-Ramp         | RLUSD → USDT → CEX withdrawal (manual/auto) |
| Backend          | Python (Flask + FastAPI), MongoDB optional |
| Frontend         | React + WalletConnect or XUMM SDK          |

## 🌐 Features

- 🔐 **Fractal KYC integration** to verify donor identities  
- 🪪 **On-chain DIDs** mapped to XRPL wallets  
- 💸 **RLUSD donations** to smart campaign wallets  
- 🔁 **Automatic donation matching** for verified users  
- 🏦 **Seamless off-ramp** via RLUSD → USDT → CEX withdrawal  
- 🧾 **Charity dashboard** (planned) with SGD payout receipts  

## 📦 How It Works

### 1. Donor Verification  
- Donor connects XRPL wallet  
- Completes KYC via Fractal ID  
- DID is created and uploaded to IPFS  
- CID is stored on XRPL (`Domain` field)  

### 2. Donation Flow  
- Donor sends RLUSD to a campaign wallet  
- Hook or backend matches donation (if verified)  
- Campaign wallet tracks donations on-chain  

### 3. Payout to Charity  
- When goal met or deadline hit:  
  - RLUSD is swapped to USDT on XRPL DEX  
  - USDT sent to centralized wallet  
  - SGD manually or automatically withdrawn to charity bank  

## 📁 Project Structure

```
├── backend/
│   ├── app.py              # Flask webhook for Fractal + DID builder
│   ├── did_generator.py    # Generates DID document from KYC
│   └── ipfs.py            # Uploads to IPFS via Web3.storage
├── frontend/
│   ├── components/         # React components (Wallet, KYC)
│   └── pages/             # Main app logic
├── xrpl/
│   ├── writer.py          # Writes DID CID to XRPL Domain
│   └── matcher.py         # Handles donation matching logic
```

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/goheesheng/Ripple-x-EasyA-Singapore-Hackathon-2025/branches
```

### 2. Setup Instructions
For Mac!!! (bash woohoo)
- python3 -m venv .venv
- source .venv/bin/activate
- pip3 -r requirements.txt
For Windows (Powershell L bro)
- python -m venv .venv
- .venv\Scripts\activate.bat
- pip3 -r requirements.txt

## 📝 License

*Coming soon...*

## 👥 Contributing

*Coming soon...*