import { Client } from 'xrpl'
import { Wallet } from 'xrpl/dist/npm/Wallet'
import { walletFromSecretNumbers } from 'xrpl/dist/npm/Wallet/walletFromSecretNumbers'
import type { AMMCreate, TrustSet, AccountSet } from 'xrpl'

// Configuration
const TESTNET_JSON_RPC = "wss://s.altnet.rippletest.net:51233"
const SGD_ISSUER = "rh6UCKiPqqpSnSGfWz1wA9ZSu9j5FFLGVN"

const RLUSD_ISSUER = "rhLdr1iXiVsMxvcTwbuK1Kbkg9DuEcdMNC"
// const RLUSD_ISSUER = rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV

async function main() {
    const client = new Client(TESTNET_JSON_RPC)
    try {
        // Initialize connection and wallet
        await client.connect()
        
        const wallet = walletFromSecretNumbers(
            ["452485","253166","540417","346312","112580","517665","551520","613943"]
        )
        console.log(`Wallet address: ${wallet.address}`)

        // Enable Default Ripple (required for holding multiple currencies)
        console.log("\nEnabling Default Ripple...")
        const accountSetTx: AccountSet = {
            TransactionType: "AccountSet",
            Account: wallet.address,
            SetFlag: 8  // asfDefaultRipple
        }
        await client.submit(accountSetTx, { wallet })
        console.log("✅ Default Ripple enabled")

        // Create trustlines for both currencies
        console.log("\nSetting up trust lines...")
        
        // SGD trust line
        const sgdTrustTx: TrustSet = {
            TransactionType: "TrustSet",
            Account: wallet.address,
            LimitAmount: {
                currency: "SGD",
                issuer: SGD_ISSUER,
                value: "1000000"
            }
        }
        await client.submit(sgdTrustTx, { wallet })
        console.log("✅ SGD trust line created")

        // RLUSD trust line
        const rlusdTrustTx: TrustSet = {
            TransactionType: "TrustSet",
            Account: wallet.address,
            LimitAmount: {
                currency: "USD",
                issuer: RLUSD_ISSUER,
                value: "1000000"
            }
        }
        await client.submit(rlusdTrustTx, { wallet })
        console.log("✅ RLUSD trust line created")

        // Create AMM Pool
        console.log("\nCreating AMM pool...")
        const ammCreateTx: AMMCreate = {
            TransactionType: "AMMCreate",
            Account: wallet.address,
            Amount: {
                currency: "SGD",
                issuer: SGD_ISSUER,
                value: "5"
            },
            Amount2: {
                currency: "USD",
                issuer: RLUSD_ISSUER,
                value: "5"
            },
            TradingFee: 500  // 0.5% fee
        }

        const response = await client.submit(ammCreateTx, { wallet })
        console.log(`✅ AMM pool created: https://testnet.xrpl.org/transactions/${response.result.tx_json.hash}`)

        // Verify pool creation with retries
        console.log("\nVerifying pool creation...")
        let retries = 3
        while (retries > 0) {
            try {
                const poolInfo = await client.request({
                    command: "amm_info",
                    asset: {
                        currency: "SGD",
                        issuer: SGD_ISSUER
                    },
                    asset2: {
                        currency: "USD",
                        issuer: RLUSD_ISSUER
                    }
                })
                console.log("Pool details:", poolInfo.result)
                break
            } catch (error) {
                retries--
                if (retries === 0) {
                    console.log("⚠️ Could not verify pool creation. Please check the transaction status manually.")
                    break
                }
                console.log(`Waiting for pool to be created... (${retries} retries left)`)
                await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
            }
        }

    } catch (error) {
        console.error("\n❌ Error:", error)
        console.log("\nTroubleshooting steps:")
        console.log("1. Verify your account has at least 10 XRP for reserve and fees")
        console.log("2. Check that you have sufficient SGD and RLUSD tokens")
        console.log("3. Verify the issuers are correct")
        console.log("4. Make sure the testnet is operational")
    } finally {
        await client.disconnect()
    }
}

main() 