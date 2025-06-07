import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Menu, X, User, LogOut, PlusCircle, Gift, RefreshCw } from 'lucide-react';
import { signInWithCrossmark, signOut, getCurrentUser, isOrganization, isDonor, toggleUserType } from '../services/auth';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const newUser = await signInWithCrossmark();
      if (newUser) {
        setUser(newUser);
      }
    } catch (error) {
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.');
    }
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
  };

  const handleToggleUserType = async () => {
    await toggleUserType();
    setUser(getCurrentUser());
  };

  // Function to truncate wallet address
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="fixed w-full bg-white/90 backdrop-blur-sm z-50 shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-800">GiveHope</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link to="#about" className="text-gray-600 hover:text-indigo-600 transition-colors">
              About
            </Link>
            <Link to="#programs" className="text-gray-600 hover:text-indigo-600 transition-colors">
              Programs
            </Link>
            <Link to="#donate" className="text-gray-600 hover:text-indigo-600 transition-colors">
              Donate
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">{truncateAddress(user.id)}</span>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2"
                  >
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user.type === 'organization' ? 'Organization Account' : 'Donor Account'}
                    </div>
                    <button
                      onClick={handleToggleUserType}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Switch to {user.type === 'organization' ? 'Donor' : 'Organization'}</span>
                    </button>
                    {isOrganization() && (
                      <>
                        <Link
                          to="/create-campaign"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <PlusCircle className="h-5 w-5" />
                          <span>Create Campaign</span>
                        </Link>
                        <Link
                          to="/my-campaigns"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Gift className="h-5 w-5" />
                          <span>My Campaigns</span>
                        </Link>
                      </>
                    )}
                    {isDonor() && (
                      <>
                        <Link
                          to="/my-donations"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Gift className="h-5 w-5" />
                          <span>My Donations</span>
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-indigo-600 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 space-y-4"
          >
            <Link
              to="/"
              className="block text-gray-600 hover:text-indigo-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="#about"
              className="block text-gray-600 hover:text-indigo-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link
              to="#programs"
              className="block text-gray-600 hover:text-indigo-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Programs
            </Link>
            <Link
              to="#donate"
              className="block text-gray-600 hover:text-indigo-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Donate
            </Link>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">{truncateAddress(user.id)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {user.type === 'organization' ? 'Organization Account' : 'Donor Account'}
                </div>
                <button
                  onClick={() => {
                    handleToggleUserType();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors w-full"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Switch to {user.type === 'organization' ? 'Donor' : 'Organization'}</span>
                </button>
                {isOrganization() && (
                  <>
                    <Link
                      to="/create-campaign"
                      className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>Create Campaign</span>
                    </Link>
                    <Link
                      to="/my-campaigns"
                      className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Gift className="h-5 w-5" />
                      <span>My Campaigns</span>
                    </Link>
                  </>
                )}
                {isDonor() && (
                  <Link
                    to="/my-donations"
                    className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Gift className="h-5 w-5" />
                    <span>My Donations</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleSignIn();
                  setIsOpen(false);
                }}
                className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Header;
