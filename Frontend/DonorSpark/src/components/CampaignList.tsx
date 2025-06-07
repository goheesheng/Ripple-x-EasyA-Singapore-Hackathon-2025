import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, DollarSign, Users } from 'lucide-react';
import DonationModal from './DonationModal';
import { getCurrentUser, isOrganization } from '../services/auth';
import { Campaign, getCampaigns, getCampaignsByOrganization, getCampaignsByDonor, updateCampaignAmount } from '../services/campaigns';
import { User } from '../types/index';

interface CampaignListProps {
  showOnlyMyCampaigns?: boolean;
  showOnlyMyDonations?: boolean;
}

export default function CampaignList({ showOnlyMyCampaigns, showOnlyMyDonations }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser() as User;
        let filteredCampaigns: Campaign[] = [];

        if (showOnlyMyCampaigns && currentUser?.id) {
          filteredCampaigns = await getCampaignsByOrganization(currentUser.id);
        } else if (showOnlyMyDonations && currentUser?.id) {
          filteredCampaigns = await getCampaignsByDonor(currentUser.id);
        } else {
          filteredCampaigns = await getCampaigns();
        }

        setCampaigns(filteredCampaigns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [showOnlyMyCampaigns, showOnlyMyDonations]);

  const handleDonateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationModalOpen(true);
  };

  const handleDonationModalClose = () => {
    setIsDonationModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleDonationSuccess = async (amount: number) => {
    if (selectedCampaign) {
      try {
        const updatedCampaign = await updateCampaignAmount(selectedCampaign.id, amount);
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(campaign =>
            campaign.id === selectedCampaign.id ? updatedCampaign : campaign
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update campaign amount');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    );
  }

  const getTitle = () => {
    if (showOnlyMyCampaigns) return "My Campaigns";
    if (showOnlyMyDonations) return "My Donations";
    return "Active Campaigns";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">{getTitle()}</h2>
      
      {campaigns.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No campaigns found.</p>
          {showOnlyMyCampaigns && isOrganization() && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg"
              onClick={() => window.location.href = '/create-campaign'}
            >
              Create Your First Campaign
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-48">
                <img
                  src={campaign.image || '/default-logo.png'}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                  {campaign.category}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-800">{campaign.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-2" />
                    <span>{campaign.organizationName}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((campaign.currentAmount / campaign.targetAmount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(campaign.currentAmount / campaign.targetAmount) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-gray-600">
                    <span className="text-indigo-600 font-bold">${campaign.currentAmount.toLocaleString()}</span>
                    <span className="text-sm"> raised of ${campaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
                    onClick={() => handleDonateClick(campaign)}
                  >
                    Donate
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedCampaign && (
        <DonationModal
          isOpen={isDonationModalOpen}
          onClose={handleDonationModalClose}
          campaign={selectedCampaign}
          onDonationSuccess={handleDonationSuccess}
        />
      )}
    </div>
  );
} 