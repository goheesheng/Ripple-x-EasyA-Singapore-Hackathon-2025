import { Client, Payment, Wallet, TrustSet } from 'xrpl'

const TESTNET_JSON_RPC = "wss://s.altnet.rippletest.net:51233"
const SGD_ISSUER = "rh6UCKiPqqpSnSGfWz1wA9ZSu9j5FFLGVN"
const RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV"
const RLUSD_HEX = "524C555344000000000000000000000000000000" // RLUSD in hex
const DESTINATION_ADDRESS = "raPeFkekHdpKkSEavQfu7C8iQstFX9EtDA"
const BACKEND_API_URL = "http://localhost:3001/api"

interface CampaignWalletInfo {
    campaignId: string
    walletAddress: string
    walletSeed: string
}

async function getExpiredCampaignWallets(): Promise<CampaignWalletInfo[]> {
    try {
        // Get all campaigns from the backend API
        const campaignsResponse = await fetch(`${BACKEND_API_URL}/campaigns`)
        if (!campaignsResponse.ok) {
            throw new Error(`Failed to fetch campaigns: ${campaignsResponse.status}`)
        }
        
        const campaignsData = await campaignsResponse.json()
        const campaigns = campaignsData.campaigns || []
        
        const walletInfo: CampaignWalletInfo[] = []
        const currentTime = new Date()
        
        for (const campaign of campaigns) {
            // Check if campaign has reached end_date and is still active
            const endDate = new Date(campaign.endDate)
            
            if (endDate <= currentTime && 
                campaign.status === 'active' && 
                campaign.campaignWalletAddress) {
                
                // Get wallet seed for this campaign
                try {
                    const walletResponse = await fetch(`${BACKEND_API_URL}/wallets/${campaign.campaignWalletAddress}`)
                    if (walletResponse.ok) {
                        const walletData = await walletResponse.json()
                        
                        walletInfo.push({
                            campaignId: campaign.id,
                            walletAddress: campaign.campaignWalletAddress,
                            walletSeed: walletData.wallet.seed
                        })
                        
                        console.log(`📋 Found expired campaign: ${campaign.title}`)
                        console.log(`   Campaign ID: ${campaign.id}`)
                        console.log(`   Wallet: ${campaign.campaignWalletAddress}`)
                        console.log(`   End Date: ${campaign.endDate}`)
                    } else {
                        console.log(`⚠️  No wallet found for campaign ${campaign.id}`)
                    }
                } catch (error) {
                    console.error(`Error fetching wallet for campaign ${campaign.id}:`, error)
                }
            }
        }
        
        return walletInfo
        
    } catch (error) {
        console.error("Error fetching expired campaigns:", error)
        return []
    }
}

async function updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    try {
        const response = await fetch(`${BACKEND_API_URL}/campaigns/${campaignId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status })
        })
        
        if (response.ok) {
            const result = await response.json()
            console.log(`✅ Campaign ${campaignId} status updated to: ${status}`)
        } else {
            console.error(`❌ Failed to update campaign status: ${response.status} ${response.statusText}`)
        }
    } catch (error) {
        console.error("Error updating campaign status:", error)
    }
}

async function checkTrustLine(client: Client, walletAddress: string, currency: string, issuer: string): Promise<boolean> {
    try {
        const response = await client.request({
            command: 'account_lines',
            account: walletAddress,
            ledger_index: 'validated'
        })

        const trustLines = response.result.lines || []
        const hasTrustLine = trustLines.some((line: any) => 
            line.currency === currency && line.account === issuer
        )

        console.log(`🔍 Trust line check for ${currency}: ${hasTrustLine ? '✅ EXISTS' : '❌ MISSING'}`)
        return hasTrustLine
    } catch (error) {
        console.error(`Error checking trust line for ${currency}:`, error)
        return false
    }
}

async function establishTrustLine(client: Client, wallet: Wallet, currency: string, issuer: string, limit: string = "1000000"): Promise<boolean> {
    try {
        console.log(`🔗 Establishing trust line for ${currency} with issuer ${issuer}...`)
        
        const trustSet: TrustSet = {
            TransactionType: "TrustSet",
            Account: wallet.address,
            LimitAmount: {
                currency: currency,
                issuer: issuer,
                value: limit
            }
        }

        console.log("📤 Submitting TrustSet transaction...")
        const response = await client.submitAndWait(trustSet, { wallet })
        
        if (response.result.meta && typeof response.result.meta === 'object' && 'TransactionResult' in response.result.meta) {
            const transactionResult = response.result.meta.TransactionResult
            
            if (transactionResult === 'tesSUCCESS') {
                console.log(`✅ Trust line established for ${currency}`)
                console.log(`Transaction Hash: ${response.result.hash}`)
                return true
            } else {
                console.log(`❌ Trust line establishment failed: ${transactionResult}`)
                return false
            }
        } else {
            console.log("⚠️  Trust line transaction result unclear")
            return false
        }
    } catch (error) {
        console.error(`❌ Failed to establish trust line for ${currency}:`, error)
        return false
    }
}

async function ensureTrustLines(client: Client, wallet: Wallet): Promise<boolean> {
    console.log("🔍 Checking and establishing required trust lines...")
    
    // Check SGD trust line
    const hasSGDTrustLine = await checkTrustLine(client, wallet.address, "SGD", SGD_ISSUER)
    
    // Check RLUSD trust line
    const hasRLUSDTrustLine = await checkTrustLine(client, wallet.address, "RLUSD", RLUSD_ISSUER)
    
    let allTrustLinesReady = true
    
    // Establish SGD trust line if missing
    if (!hasSGDTrustLine) {
        console.log("🔗 SGD trust line missing, establishing...")
        const sgdSuccess = await establishTrustLine(client, wallet, "SGD", SGD_ISSUER)
        if (!sgdSuccess) {
            console.log("❌ Failed to establish SGD trust line")
            allTrustLinesReady = false
        }
    }
    
    // Establish RLUSD trust line if missing
    if (!hasRLUSDTrustLine) {
        console.log("🔗 RLUSD trust line missing, establishing...")
        const rlusdSuccess = await establishTrustLine(client, wallet, "RLUSD", RLUSD_ISSUER)
        if (!rlusdSuccess) {
            console.log("❌ Failed to establish RLUSD trust line")
            allTrustLinesReady = false
        }
    }
    
    if (allTrustLinesReady) {
        console.log("✅ All required trust lines are ready")
    } else {
        console.log("❌ Some trust lines could not be established")
    }
    
    return allTrustLinesReady
}

async function swapSGDToRLUSD(walletAddress: string, walletSeed: string): Promise<string | null> {
    const client = new Client(TESTNET_JSON_RPC)
    
    try {
        await client.connect()
        console.log("✅ Connected to XRPL testnet")

        // Create wallet from seed
        const wallet = Wallet.fromSeed(walletSeed)
        console.log(`✅ Wallet loaded: ${wallet.address}`)
        
        // Verify wallet address matches
        if (wallet.address !== walletAddress) {
            throw new Error(`Wallet address mismatch: expected ${walletAddress}, got ${wallet.address}`)
        }

        // Check wallet balance
        try {
            const accountInfo = await client.request({
                command: 'account_info',
                account: wallet.address
            })
            console.log(`💰 Wallet XRP balance: ${accountInfo.result.account_data.Balance} drops`)
            
            // Check if wallet has enough XRP for trust line transactions (if needed)
            const xrpBalance = parseInt(accountInfo.result.account_data.Balance)
            const minimumXRP = 20000000 // 20 XRP in drops (reserve + transaction fees)
            
            if (xrpBalance < minimumXRP) {
                console.log(`⚠️  Warning: Low XRP balance (${xrpBalance} drops). May not be sufficient for trust lines and swap.`)
            }
        } catch (error) {
            console.log("⚠️  Could not fetch wallet balance:", error)
        }

        // STEP 1: Ensure trust lines are established
        console.log("\n🔗 STEP 1: Ensuring trust lines are established...")
        const trustLinesReady = await ensureTrustLines(client, wallet)
        
        if (!trustLinesReady) {
            throw new Error("Failed to establish required trust lines. Cannot proceed with swap.")
        }

        // STEP 2: Check token balances
        console.log("\n💰 STEP 2: Checking token balances...")
        try {
            const balanceResponse = await client.request({
                command: 'account_lines',
                account: wallet.address,
                ledger_index: 'validated'
            })

            const lines = balanceResponse.result.lines || []
            const sgdLine = lines.find((line: any) => line.currency === 'SGD' && line.account === SGD_ISSUER)
            const rlusdLine = lines.find((line: any) => line.currency === 'RLUSD' && line.account === RLUSD_ISSUER)

            console.log(`SGD Balance: ${sgdLine ? sgdLine.balance : '0'} SGD`)
            console.log(`RLUSD Balance: ${rlusdLine ? rlusdLine.balance : '0'} RLUSD`)

            if (!sgdLine || parseFloat(sgdLine.balance) < 0.11) {
                console.log("⚠️  Warning: Insufficient SGD balance for swap")
            }
        } catch (error) {
            console.log("⚠️  Could not fetch token balances:", error)
        }

        // STEP 3: Perform the swap
        console.log("\n🔄 STEP 3: Performing SGD to RLUSD swap...")

        // Prepare the payment transaction
        const payment: Payment = {
            TransactionType: "Payment",
            Account: wallet.address,
            Amount: {
                currency: RLUSD_HEX,
                issuer: RLUSD_ISSUER,
                value: "0.1"
            },
            Destination: DESTINATION_ADDRESS,
            SendMax: {
                currency: "SGD",
                issuer: SGD_ISSUER,
                value: "0.11" // allow up to 0.11 SGD to be spent (slippage buffer)
            }
        }

        console.log("📤 Submitting swap transaction...")
        console.log("Transaction details:", JSON.stringify(payment, null, 2))

        // Submit the payment
        const response = await client.submitAndWait(payment, { wallet })
        
        if (response.result.meta && typeof response.result.meta === 'object' && 'TransactionResult' in response.result.meta) {
            const transactionResult = response.result.meta.TransactionResult
            
            if (transactionResult === 'tesSUCCESS') {
                console.log("✅ Swap transaction successful!")
                console.log(`Transaction Hash: ${response.result.hash}`)
                console.log(`View on explorer: https://testnet.xrpl.org/transactions/${response.result.hash}`)
                return response.result.hash
            } else {
                console.log(`❌ Transaction failed with result: ${transactionResult}`)
                throw new Error(`Transaction failed: ${transactionResult}`)
            }
        } else {
            console.log("⚠️  Transaction result unclear")
            console.log("Response:", JSON.stringify(response.result, null, 2))
            return null
        }

    } catch (error) {
        console.error("❌ Swap failed:", error)
        
        if (error instanceof Error) {
            if (error.message.includes('tecUNFUNDED_PAYMENT')) {
                console.log("💡 Hint: The wallet may not have sufficient SGD balance")
            } else if (error.message.includes('tecNO_LINE')) {
                console.log("💡 Hint: Trust lines may not be properly established")
            } else if (error.message.includes('tecPATH_DRY')) {
                console.log("💡 Hint: No liquidity path found for this swap")
            } else if (error.message.includes('tecINSUF_RESERVE_LINE')) {
                console.log("💡 Hint: Insufficient XRP reserve for trust line")
            }
        }
        
        throw error
    } finally {
        await client.disconnect()
        console.log("🔌 Disconnected from XRPL testnet")
    }
}

async function main() {
    console.log("🚀 Starting SGD to RLUSD swap for expired campaigns...")
    console.log("=".repeat(60))
    
    try {
        // Get all expired campaign wallets
        const expiredWallets = await getExpiredCampaignWallets()
        
        if (expiredWallets.length === 0) {
            console.log("ℹ️  No expired campaigns found")
            return
        }
        
        console.log(`🎯 Found ${expiredWallets.length} expired campaign(s) to process`)
        console.log("=".repeat(60))
        
        // Process each expired campaign
        for (const walletInfo of expiredWallets) {
            console.log(`\n🔄 Processing campaign: ${walletInfo.campaignId}`)
            console.log(`Wallet: ${walletInfo.walletAddress}`)
            
            try {
                const txHash = await swapSGDToRLUSD(walletInfo.walletAddress, walletInfo.walletSeed)
                
                if (txHash) {
                    console.log(`✅ Swap completed for campaign ${walletInfo.campaignId}`)
                    console.log(`Transaction: ${txHash}`)
                    
                    // Update campaign status to completed
                    await updateCampaignStatus(walletInfo.campaignId, 'completed')
                } else {
                    console.log(`⚠️  Swap result unclear for campaign ${walletInfo.campaignId}`)
                }
                
            } catch (error) {
                console.error(`❌ Failed to swap for campaign ${walletInfo.campaignId}:`, error)
                // Continue with next campaign even if one fails
            }
            
            console.log("-".repeat(40))
        }
        
        console.log("\n🎉 All expired campaigns processed!")
        
    } catch (error) {
        console.error("❌ Main process failed:", error)
    }
}

// Run the main function
main()