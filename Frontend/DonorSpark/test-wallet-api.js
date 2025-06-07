import fetch from 'node-fetch';

async function testWalletAPI() {
  console.log('🧪 Testing wallet API endpoints...\n');
  
  try {
    // Test storing a wallet
    console.log('1. Testing wallet storage...');
    const testWallet = {
      publicAddress: 'rTestWallet123456789ABCDEF',
      seed: 'sTestSeed123456789ABCDEF'
    };
    
    const storeResponse = await fetch('http://localhost:3001/api/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testWallet)
    });
    
    if (storeResponse.ok) {
      const storeResult = await storeResponse.json();
      console.log('✅ Wallet stored:', storeResult);
    } else {
      console.log('❌ Failed to store wallet:', storeResponse.status, storeResponse.statusText);
      const errorText = await storeResponse.text();
      console.log('Error details:', errorText);
    }
    
    // Test retrieving the wallet
    console.log('\n2. Testing wallet retrieval...');
    const getResponse = await fetch(`http://localhost:3001/api/wallets/${testWallet.publicAddress}`);
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Wallet retrieved:', {
        publicAddress: getResult.wallet.public_address,
        seedLength: getResult.wallet.seed.length,
        createdAt: getResult.wallet.created_at
      });
    } else {
      console.log('❌ Failed to retrieve wallet:', getResponse.status, getResponse.statusText);
    }
    
    // Test storing duplicate wallet (should update)
    console.log('\n3. Testing duplicate wallet storage (should update)...');
    const updatedWallet = {
      publicAddress: testWallet.publicAddress,
      seed: 'sUpdatedSeed987654321FEDCBA'
    };
    
    const updateResponse = await fetch('http://localhost:3001/api/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedWallet)
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Wallet updated:', updateResult);
    } else {
      console.log('❌ Failed to update wallet:', updateResponse.status, updateResponse.statusText);
    }
    
    // Verify the update
    console.log('\n4. Verifying wallet update...');
    const verifyResponse = await fetch(`http://localhost:3001/api/wallets/${testWallet.publicAddress}`);
    
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      console.log('✅ Updated wallet verified:', {
        publicAddress: verifyResult.wallet.public_address,
        seedLength: verifyResult.wallet.seed.length,
        seedMatches: verifyResult.wallet.seed === updatedWallet.seed
      });
    } else {
      console.log('❌ Failed to verify wallet update:', verifyResponse.status, verifyResponse.statusText);
    }
    
    console.log('\n🎉 Wallet API test completed!');
    
  } catch (error) {
    console.error('❌ Wallet API test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run server');
  }
}

testWalletAPI(); 