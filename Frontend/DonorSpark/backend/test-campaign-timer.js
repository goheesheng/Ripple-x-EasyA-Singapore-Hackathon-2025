import fetch from 'node-fetch';

async function testCampaignTimer() {
  console.log('🧪 Testing campaign timer functionality...\n');
  
  try {
    // Test 1: Check if we can fetch campaigns
    console.log('1. Testing campaigns API...');
    const campaignsResponse = await fetch('http://localhost:3001/api/campaigns');
    
    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData.campaigns || [];
      console.log(`✅ Found ${campaigns.length} campaigns in database`);
      
      // Show campaigns with their end dates
      campaigns.forEach(campaign => {
        const endDate = new Date(campaign.endDate);
        const now = new Date();
        const isExpired = endDate <= now;
        
        console.log(`   📋 ${campaign.title}`);
        console.log(`      ID: ${campaign.id}`);
        console.log(`      End Date: ${campaign.endDate}`);
        console.log(`      Status: ${campaign.status}`);
        console.log(`      Wallet: ${campaign.campaignWalletAddress || 'None'}`);
        console.log(`      Expired: ${isExpired ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    } else {
      console.log('❌ Failed to fetch campaigns:', campaignsResponse.status);
    }
    
    // Test 2: Check if we can fetch wallets
    console.log('\n2. Testing wallets API...');
    
    // First, let's see if there are any wallets
    const campaignsResponse2 = await fetch('http://localhost:3001/api/campaigns');
    if (campaignsResponse2.ok) {
      const campaignsData = await campaignsResponse2.json();
      const campaigns = campaignsData.campaigns || [];
      
      for (const campaign of campaigns.slice(0, 3)) { // Test first 3 campaigns
        if (campaign.campaignWalletAddress) {
          const walletResponse = await fetch(`http://localhost:3001/api/wallets/${campaign.campaignWalletAddress}`);
          
          if (walletResponse.ok) {
            const walletData = await walletResponse.json();
            console.log(`✅ Found wallet for campaign ${campaign.id}:`);
            console.log(`   Address: ${walletData.wallet.public_address}`);
            console.log(`   Seed Length: ${walletData.wallet.seed.length} characters`);
          } else {
            console.log(`❌ No wallet found for campaign ${campaign.id} (${campaign.campaignWalletAddress})`);
          }
        }
      }
    }
    
    // Test 3: Test campaign status update
    console.log('\n3. Testing campaign status update...');
    const campaignsResponse3 = await fetch('http://localhost:3001/api/campaigns');
    if (campaignsResponse3.ok) {
      const campaignsData = await campaignsResponse3.json();
      const campaigns = campaignsData.campaigns || [];
      
      if (campaigns.length > 0) {
        const testCampaign = campaigns[0];
        console.log(`Testing status update for campaign: ${testCampaign.id}`);
        
        // Try to update status (but revert it back)
        const originalStatus = testCampaign.status;
        const newStatus = originalStatus === 'active' ? 'completed' : 'active';
        
        const updateResponse = await fetch(`http://localhost:3001/api/campaigns/${testCampaign.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Status update successful: ${originalStatus} → ${newStatus}`);
          
          // Revert back to original status
          const revertResponse = await fetch(`http://localhost:3001/api/campaigns/${testCampaign.id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ status: originalStatus })
          });
          
          if (revertResponse.ok) {
            console.log(`✅ Status reverted back to: ${originalStatus}`);
          }
        } else {
          console.log('❌ Failed to update campaign status:', updateResponse.status);
        }
      }
    }
    
    console.log('\n🎉 Campaign timer test completed!');
    console.log('\n💡 To run the actual timer service:');
    console.log('   cd backend && npm run start');
    
  } catch (error) {
    console.error('❌ Campaign timer test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run server');
  }
}

testCampaignTimer(); 