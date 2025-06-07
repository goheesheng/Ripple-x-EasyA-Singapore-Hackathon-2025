import fetch from 'node-fetch';

async function testCampaignsAPI() {
  console.log('🧪 Testing campaigns API...\n');
  
  try {
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test creating a campaign
    console.log('\n2. Testing campaign creation...');
    const testCampaign = {
      id: 'test_campaign_' + Date.now(),
      title: 'Test Campaign',
      description: 'This is a test campaign',
      targetAmount: 1000,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'education',
      organizationId: 'test_org_123',
      organizationName: 'Test Organization',
      organizationDescription: 'Test organization description',
      organizationWebsite: 'https://test.com',
      imageUrl: 'https://test.com/image.jpg',
      campaignWalletAddress: 'rTestWallet123456789'
    };
    
    console.log('✅ All required fields present:');
    console.log('- id:', testCampaign.id);
    console.log('- title:', testCampaign.title);
    console.log('- description:', testCampaign.description);
    console.log('- targetAmount:', testCampaign.targetAmount);
    console.log('- endDate:', testCampaign.endDate);
    console.log('- category:', testCampaign.category);
    console.log('- organizationId:', testCampaign.organizationId);
    console.log('- organizationName:', testCampaign.organizationName);
    
    console.log('Request data:', JSON.stringify(testCampaign, null, 2));
    
    const createResponse = await fetch('http://localhost:3001/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testCampaign)
    });
    
    console.log('Response status:', createResponse.status);
    console.log('Response headers:', Object.fromEntries(createResponse.headers.entries()));
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Campaign created:', createResult);
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Campaign creation failed:');
      console.log('Status:', createResponse.status);
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCampaignsAPI(); 