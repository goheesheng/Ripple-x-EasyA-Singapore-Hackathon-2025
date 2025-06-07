import { Client, Payment, xrpToDrops } from 'xrpl'
import { walletFromSecretNumbers } from 'xrpl/dist/npm/Wallet/walletFromSecretNumbers'

const TESTNET_JSON_RPC = "wss://s.altnet.rippletest.net:51233"
const SGD_ISSUER = "rh6UCKiPqqpSnSGfWz1wA9ZSu9j5FFLGVN"
const RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV"
const RLUSD_HEX = "524C555344000000000000000000000000000000" // RLUSD in hex

async function swapSGDToRLUSD() {
    const client = new Client(TESTNET_JSON_RPC)
    await client.connect()

    // Use your wallet
    const wallet = walletFromSecretNumbers([
        "452485","253166","540417","346312","112580","517665","551520","613943"
    ])

    // Prepare the payment transaction
    const payment: Payment = {
        TransactionType: "Payment",
        Account: wallet.address,
        Amount: {
            currency: RLUSD_HEX,
            issuer: RLUSD_ISSUER,
            value: "0.1"
        },
        Destination: wallet.address, // self-swap for demo; use another address for real swap
        SendMax: {
            currency: "SGD",
            issuer: SGD_ISSUER,
            value: "0.11" // allow up to 1.1 SGD to be spent (slippage buffer)
        }
        // Optionally, you can add a Paths field if you want to specify a path
    }

    // Submit the payment
    const response = await client.submitAndWait(payment, { wallet })
    console.log("Swap transaction result:", response.result)
    console.log(`View on explorer: https://testnet.xrpl.org/transactions/${response.result.hash}`)

    await client.disconnect()
}

swapSGDToRLUSD()