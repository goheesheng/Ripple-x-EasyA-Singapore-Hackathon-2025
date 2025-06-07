import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test storing a campaign transaction
    console.log('\n2. Testing campaign transaction storage...');
    const testData = {
      campaignId: 'test_campaign_123',
      txHash: 'ABC123DEF456GHI789JKL012MNO345'
    };
    
    const storeResponse = await fetch('http://localhost:3001/api/campaigns/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (storeResponse.ok) {
      const storeResult = await storeResponse.json();
      console.log('✅ Transaction stored:', storeResult);
    } else {
      console.log('❌ Failed to store transaction:', storeResponse.status, storeResponse.statusText);
    }
    
    // Test retrieving campaign transactions
    console.log('\n3. Testing campaign transaction retrieval...');
    const getResponse = await fetch(`http://localhost:3001/api/campaigns/${testData.campaignId}/transactions`);
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Transactions retrieved:', getResult);
    } else {
      console.log('❌ Failed to retrieve transactions:', getResponse.status, getResponse.statusText);
    }
    
    console.log('\n🎉 API test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run server');
  }
}

testAPI(); 