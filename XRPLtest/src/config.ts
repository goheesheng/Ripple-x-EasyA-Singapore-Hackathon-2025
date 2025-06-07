export const config = {
  // XRPL network configuration
  xrpl: {
    // Testnet server WebSocket URL
    server: 'wss://s.altnet.rippletest.net:51233',
    
    // Network identifier for testnet
    networkID: 1,
    
    // Default fee in drops (1 drop = 0.000001 XRP)
    defaultFee: '12',
    
    // Maximum transaction fee (in drops)
    maxFee: '2000000'
  },
  
  // Charity campaign configuration
  campaign: {
    // Minimum campaign duration in seconds (1 day)
    minDuration: 86400,
    
    // Maximum campaign duration in seconds (90 days)
    maxDuration: 7776000,
    
    // Minimum funding target in RLUSD
    minFundingTarget: '100',
    
    // Maximum funding target in RLUSD
    maxFundingTarget: '1000000'
  },
  
  // RLUSD token configuration
  rlusd: {
    // RLUSD issuer address (this is a placeholder - replace with actual issuer)
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    
    // RLUSD currency code
    currency: 'USD',
    
    // Default trust line limit
    defaultLimit: '1000000000'
  }
}; 