import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCurrentUser } from '../services/auth';
import { getCampaignsByDonor } from '../services/campaigns';
import { Campaign, Donation } from '../types';
import { Download } from 'lucide-react';

interface DonationSummary {
  totalAmount: number;
  campaignCount: number;
  donations: Array<{
    campaignTitle: string;
    amount: number;
    date: string;
    campaignId: string;
  }>;
}

// Helper function to format RLUSD amounts
const formatRLUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('$', 'RLUSD ');
};

const AccountSummary = () => {
  const [summary, setSummary] = useState<DonationSummary>({
    totalAmount: 0,
    campaignCount: 0,
    donations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadDonationSummary();
  }, [year]);

  const loadDonationSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = getCurrentUser();
      if (!user || user.type !== 'donor') {
        throw new Error('Please login as a donor to view your donation summary');
      }

      // Get all campaigns the user has donated to
      const campaigns = await getCampaignsByDonor(user.id);
      
      // Get donations from localStorage (in a real app, this would come from your backend)
      const donationsStr = localStorage.getItem('donations') || '[]';
      const allDonations: Donation[] = JSON.parse(donationsStr);
      
      // Filter donations for the current user and selected year
      const userDonations = allDonations.filter(donation => {
        const donationYear = new Date(donation.createdAt).getFullYear();
        return donation.donorId === user.id && donationYear === year;
      });

      // Create summary
      const donationSummary: DonationSummary = {
        totalAmount: userDonations.reduce((sum, donation) => sum + donation.amount, 0),
        campaignCount: new Set(userDonations.map(d => d.campaignId)).size,
        donations: await Promise.all(userDonations.map(async donation => {
          const campaign = campaigns.find(c => c.id === donation.campaignId);
          return {
            campaignTitle: campaign?.title || 'Unknown Campaign',
            amount: donation.amount,
            date: donation.createdAt,
            campaignId: donation.campaignId
          };
        }))
      };

      setSummary(donationSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load donation summary');
    } finally {
      setLoading(false);
    }
  };

  const downloadTaxReport = () => {
    // Create CSV content
    const csvContent = [
      ['Date', 'Campaign', 'Amount (RLUSD)'],
      ...summary.donations.map(donation => [
        new Date(donation.date).toLocaleDateString(),
        donation.campaignTitle,
        donation.amount.toFixed(2)
      ]),
      [], // Empty line
      ['Total Donations', '', summary.totalAmount.toFixed(2)],
      ['Number of Campaigns', '', summary.campaignCount.toString()]
    ].map(row => row.join(',')).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donation-summary-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Donation Summary</h1>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-indigo-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Total Donations</h3>
                    <p className="text-3xl font-bold text-indigo-600">{formatRLUSD(summary.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Campaigns Supported</h3>
                    <p className="text-3xl font-bold text-green-600">{summary.campaignCount}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Tax Deductible Amount</h3>
                    <p className="text-3xl font-bold text-purple-600">{formatRLUSD(summary.totalAmount)}</p>
                  </div>
                </div>

                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Donation History</h2>
                  <button
                    onClick={downloadTaxReport}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Tax Report
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (RLUSD)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summary.donations.map((donation, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(donation.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{donation.campaignTitle}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatRLUSD(donation.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">Total</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatRLUSD(summary.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountSummary; 