import { useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, ChevronDown, DollarSign, Facebook, Globe, Heart, Instagram, Mail, MapPin, Phone, Twitter, Users } from 'lucide-react';
import './index.css';

// Components
import Header from './components/Header';
import DonationForm from './components/DonationForm';
import Testimonials from './components/Testimonials';

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

  // Animation settings
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  // Statistics counter section with intersection observer
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Header />
      
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
      
      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Our Mission</h2>
            <p className="text-lg text-gray-600">
              At GiveHope, we believe in creating sustainable change through community-centered initiatives. 
              Our approach focuses on empowering communities with the tools and resources they need to thrive.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&q=80&w=600" 
                alt="Our mission in action" 
                className="rounded-lg shadow-lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4 text-indigo-700">How We Work</h3>
              <p className="text-gray-700 mb-6">
                Our work spans across education, healthcare, clean water, and humanitarian relief. We partner with local organizations to ensure that our efforts are culturally appropriate and sustainable.
              </p>
              <ul className="space-y-4">
                {[
                  'Community-Driven Projects',
                  'Sustainable Development',
                  'Local Partnerships',
                  'Transparency & Accountability'
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start"
                  >
                    <div className="bg-indigo-100 p-1 rounded-full mr-3 mt-1">
                      <Heart size={16} className="text-indigo-600" />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Impact Statistics */}
      <section ref={statsRef} className="py-16 bg-indigo-50">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Our Impact</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Through the generosity of our donors, we've been able to make significant strides in communities worldwide.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="impact-card text-center"
              >
                <div className="flex justify-center mb-4">{stat.icon}</div>
                <h3 className="text-3xl font-bold text-indigo-700 mb-2">
                  {stat.prefix}
                  {statsInView ? (
                    <CountUp 
                      end={stat.value} 
                      duration={2.5} 
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                  ) : '0'}
                  {stat.suffix}
                </h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Programs Section */}
      <section id="programs" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Our Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We focus on sustainable programs that create lasting change in communities around the world.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <img 
                  src={program.image} 
                  alt={program.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <motion.a
                    href="#"
                    whileHover={{ x: 5 }}
                    className="inline-flex items-center text-indigo-600 font-medium"
                  >
                    Learn more <ArrowRight size={16} className="ml-1" />
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Donation Section */}
      <section id="donate" className="py-20 px-4 bg-indigo-600">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <h2 className="text-3xl font-bold mb-4">Make Your Contribution</h2>
              <p className="text-indigo-100 mb-6">
                Your donation helps us continue our vital work around the world. Every contribution, no matter the size, makes a difference in someone's life.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  '100% of public donations go directly to field programs',
                  'Donations are tax-deductible where applicable',
                  'Choose between one-time or recurring donations',
                  'See the impact of your contribution through regular updates'
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start"
                  >
                    <div className="bg-white p-1 rounded-full mr-3 mt-1">
                      <Heart size={16} className="text-indigo-600" />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <DonationForm />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="h-7 w-7 text-indigo-400 mr-2" />
                <span className="text-xl font-bold">GiveHope</span>
              </div>
              <p className="text-gray-400 mb-4">
                Making a difference in the lives of people around the world through sustainable development and compassionate action.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {['Home', 'About Us', 'Our Programs', 'Get Involved', 'Donate'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin size={18} className="text-indigo-400 mr-2 mt-1" />
                  <span className="text-gray-400">123 Charity Lane, New York, NY 10001</span>
                </li>
                <li className="flex items-center">
                  <Mail size={18} className="text-indigo-400 mr-2" />
                  <a href="mailto:info@givehope.org" className="text-gray-400 hover:text-white transition-colors">
                    info@givehope.org
                  </a>
                </li>
                <li className="flex items-center">
                  <Phone size={18} className="text-indigo-400 mr-2" />
                  <a href="tel:+1234567890" className="text-gray-400 hover:text-white transition-colors">
                    (123) 456-7890
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-400 mb-4">
                Subscribe to our newsletter for updates on our projects and impact.
              </p>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-r-md transition-colors">
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} GiveHope Charity. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
