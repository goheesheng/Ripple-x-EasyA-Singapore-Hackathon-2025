import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, ChevronDown, DollarSign, Facebook, Globe, Heart, Instagram, Mail, MapPin, Phone, Twitter, Users } from 'lucide-react';
import './index.css';

// Components
import Header from './components/Header';
import DonationForm from './components/DonationForm';
import Testimonials from './components/Testimonials';
import CreateCampaign from './components/CreateCampaign';
import CampaignList from './components/CampaignList';
import { signInWithCrossmark, isOrganization, getCurrentUser } from './services/auth';
import AccountSummary from './components/AccountSummary';
import CampaignWithdrawal from './components/CampaignWithdrawal';
import OfframpPage from './components/OfframpPage';

// Impact statistics
const impactStats = [
  { id: 1, icon: <Users className="w-10 h-10 text-indigo-500" />, value: 15000, label: 'People Helped', prefix: '', suffix: '+' },
  { id: 2, icon: <Globe className="w-10 h-10 text-indigo-500" />, value: 35, label: 'Countries Reached', prefix: '', suffix: '' },
  { id: 3, icon: <DollarSign className="w-10 h-10 text-indigo-500" />, value: 2.5, label: 'Million Raised', prefix: '$', suffix: 'M' },
  { id: 4, icon: <Heart className="w-10 h-10 text-indigo-500" />, value: 200, label: 'Local Projects', prefix: '', suffix: '+' },
];

// Programs
const programs = [
  {
    id: 1, 
    title: 'Education for All',
    description: 'Supporting schools and educational programs in underserved communities.',
    image: 'https://images.unsplash.com/photo-1511949860663-92c5c57d48a7?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 2, 
    title: 'Clean Water Initiative',
    description: 'Providing access to clean water through sustainable infrastructure projects.',
    image: 'https://images.unsplash.com/photo-1581331474067-505cf18bfadb?auto=format&fit=crop&q=80&w=600&h=400'
  },
  {
    id: 3, 
    title: 'Healthcare Access',
    description: 'Supporting medical clinics and healthcare services in rural areas.',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600&h=400'
  },
];

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Load Google Font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Check authentication on route change
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = getCurrentUser();
      
      // Check if the current route requires organization access
      const requiresOrg = ['/create-campaign', '/my-campaigns'].includes(location.pathname);
      
      if (requiresOrg) {
        // If not logged in or not an organization, redirect to home
        if (!currentUser || !isOrganization()) {
          alert('Access denied. Only registered organizations can access this page.');
          navigate('/');
          return;
        }
      }
      
      // If not logged in, try to connect
      if (!currentUser) {
        try {
          const user = await signInWithCrossmark();
          if (!user) {
            navigate('/');
          }
        } catch (error) {
          console.error('Failed to connect:', error);
          navigate('/');
        }
      }
    };

    checkAuth();
    setIsLoading(false);
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Animation settings
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Header />
      
      <Routes>
        <Route path="/create-campaign" element={<CreateCampaign />} />
        <Route path="/campaigns" element={<CampaignList />} />
        <Route path="/my-campaigns" element={<CampaignList showOnlyMyCampaigns />} />
        <Route path="/my-donations" element={<CampaignList showOnlyMyDonations />} />
        <Route path="/account-summary" element={<AccountSummary />} />
        <Route path="/withdraw/:campaignId" element={<CampaignWithdrawal />} />
        <Route path="/offramp/:campaignId" element={<OfframpPage />} />
        <Route path="/" element={
          <>
            {/* Hero Section */}
            <section id="home" className="hero-gradient text-white min-h-screen flex items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-900/30 z-10"></div>
              <div className="container mx-auto px-4 z-20 pt-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-xl"
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Help Us Make A Difference
                    </h1>
                    <p className="text-xl mb-8 text-indigo-100">
                      Your donation can transform lives. Join us in our mission to create a better world for those in need.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <motion.a
                        href="#donate"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-indigo-700 font-semibold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center"
                      >
                        Donate Now
                        <ArrowRight size={18} className="ml-2" />
                      </motion.a>
                      <motion.a
                        href="#about"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center"
                      >
                        Learn More
                      </motion.a>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hidden md:block"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=600" 
                      alt="People helping each other" 
                      className="rounded-lg shadow-2xl"
                    />
                  </motion.div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center"
                >
                  <a href="#about" className="inline-block text-white animate-bounce">
                    <ChevronDown size={30} />
                  </a>
                </motion.div>
              </div>
            </section>
            
            {/* Campaigns Section */}
            <section id="campaigns" className="py-20 bg-gray-50">
              <CampaignList />
            </section>
            
            {/* About Section */}
            <section id="about" className="py-20 bg-white">
              <div className="container mx-auto px-4">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="text-center mb-16"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    About DonorSpark
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    We believe in the power of collective action. DonorSpark connects compassionate donors with 
                    verified organizations to create lasting positive change in communities worldwide.
                  </p>
                </motion.div>
                
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  {programs.map((program, index) => (
                    <motion.div
                      key={program.id}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeIn}
                      transition={{ delay: index * 0.2 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      <img src={program.image} alt={program.title} className="w-full h-48 object-cover" />
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{program.title}</h3>
                        <p className="text-gray-600">{program.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Impact Section */}
            <section className="py-20 bg-indigo-50">
              <div className="container mx-auto px-4">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="text-center mb-16"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Our Impact Together
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    See the incredible difference we've made together. Every donation, no matter the size, 
                    contributes to these amazing achievements.
                  </p>
                </motion.div>
                
                <div ref={statsRef} className="grid md:grid-cols-4 gap-8">
                  {impactStats.map((stat, index) => (
                    <motion.div
                      key={stat.id}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeIn}
                      transition={{ delay: index * 0.1 }}
                      className="impact-card text-center"
                    >
                      <div className="flex justify-center mb-4">
                        {stat.icon}
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        {statsInView && (
                          <>
                            {stat.prefix}
                            <CountUp end={stat.value} duration={2} />
                            {stat.suffix}
                          </>
                        )}
                      </div>
                      <div className="text-gray-600">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Testimonials Section */}
            <section className="py-20 bg-white">
              <Testimonials />
            </section>
            
            {/* Donation Section */}
            <section id="donate" className="py-20 bg-gray-50">
              <div className="container mx-auto px-4">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="text-center mb-16"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Make a Donation Today
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Your contribution can make a real difference. Choose an amount that feels right for you 
                    and help us continue our important work.
                  </p>
                </motion.div>
                
                <DonationForm />
              </div>
            </section>
            
            {/* Footer */}
            <footer className="bg-gray-800 text-white py-16">
              <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4">DonorSpark</h3>
                    <p className="text-gray-300">
                      Connecting hearts with causes. Making a difference, one donation at a time.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2">
                      <li><a href="#home" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
                      <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                      <li><a href="#campaigns" className="text-gray-300 hover:text-white transition-colors">Campaigns</a></li>
                      <li><a href="#donate" className="text-gray-300 hover:text-white transition-colors">Donate</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Contact</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Phone size={16} className="mr-2" />
                        <span className="text-gray-300">+1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center">
                        <Mail size={16} className="mr-2" />
                        <span className="text-gray-300">hello@donorspark.org</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2" />
                        <span className="text-gray-300">123 Charity Lane, Hope City</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                    <div className="flex space-x-4">
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        <Facebook size={24} />
                      </a>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        <Twitter size={24} />
                      </a>
                      <a href="#" className="text-gray-300 hover:text-white transition-colors">
                        <Instagram size={24} />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 mt-12 pt-8 text-center">
                  <p className="text-gray-300">
                    © 2024 DonorSpark. All rights reserved. Made with ❤️ for a better world.
                  </p>
                </div>
              </div>
            </footer>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
