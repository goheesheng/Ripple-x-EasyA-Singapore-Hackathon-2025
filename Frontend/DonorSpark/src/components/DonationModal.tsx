import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import { processDonation } from '../services/donations';
import { getCurrentUser } from '../services/auth';
import { Campaign } from '../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onDonationSuccess?: (amount: number) => void;
}

export default function DonationModal({ isOpen, onClose, campaign, onDonationSuccess }: DonationModalProps) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDonation = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Validate amount
      const donationAmount = parseFloat(amount);
      if (donationAmount <= 0) {
        throw new Error('Please enter a valid donation amount');
      }

      // Get current user (donor)
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Please log in to make a donation');
      }

      // Check if campaign has wallet address
      if (!campaign.campaignWalletAddress) {
        throw new Error('Campaign wallet address not found. Please contact support.');
      }

      console.log('💰 Starting donation process...', {
        campaignId: campaign.id,
        campaignWallet: campaign.campaignWalletAddress,
        amount: donationAmount,
        donor: currentUser.id
      });

      // Process donation through XRPL
      const result = await processDonation(
        campaign.id,
        campaign.campaignWalletAddress,
        donationAmount,
        currentUser.id, // donor address
        campaign.title, // campaign title
        campaign.organizationName // organization name
      );

      if (result.success) {
        console.log('✅ Donation successful!', result);
        
        // Show success state
        setIsSuccess(true);
        
        // Update campaign amount in parent component
        if (onDonationSuccess) {
          onDonationSuccess(donationAmount);
        }
        
        // Trigger refresh of account summary if user is on that page
        const currentPath = window.location.pathname;
        if (currentPath === '/account-summary') {
          console.log('🔄 Triggering account summary refresh after successful donation');
          // Dispatch a custom event to trigger refresh
          window.dispatchEvent(new CustomEvent('donation-success', { 
            detail: { amount: donationAmount, campaignId: campaign.id } 
          }));
        }
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setAmount('');
        }, 3000);
        
      } else {
        throw new Error(result.message);
      }
      
    } catch (err) {
      console.error('❌ Donation failed:', err);
      let errorMessage = 'An error occurred while processing your donation';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide more helpful error messages
        if (err.message.includes('No transaction hash') || err.message.includes('Invalid transaction hash')) {
          errorMessage = 'Transaction processing issue detected. Please check your Crossmark wallet to see if the transaction was completed. If not, please try again.';
        } else if (err.message.includes('hash not immediately available')) {
          errorMessage = 'Transaction was submitted successfully but confirmation is taking longer than expected. Please check your Crossmark wallet for status.';
        } else if (err.message.includes('cancelled')) {
          errorMessage = 'Donation was cancelled. Please try again when ready.';
        } else if (err.message.includes('rejected or failed')) {
          errorMessage = 'Transaction was rejected. This could be due to insufficient funds or other wallet issues. Please check your balance and try again.';
        } else if (err.message.includes('Crossmark extension not found')) {
          errorMessage = 'Please install the Crossmark extension to make donations, or use demo mode for testing.';
        } else if (err.message.includes('Check console for full response')) {
          errorMessage = 'Transaction response format unexpected. Please check browser console for details and contact support.';
        } else if (err.message.includes('validation timeout')) {
          errorMessage = 'Transaction was submitted but taking longer to confirm. Please check your wallet and try again if needed.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Make a Donation</h3>
                <p className="text-gray-600 mt-1">
                  Supporting {campaign.organizationName}'s "{campaign.title}" campaign
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h4>
                <p className="text-gray-600">
                  Your donation of {amount} RLUSD has been processed successfully and validated on the XRPL blockchain!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Donation Amount (RLUSD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      step="0.01"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      RLUSD
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDonation}
                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                      isProcessing || !amount || parseFloat(amount) <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Donate Now'
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 