import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Menu, X } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'py-2 bg-white shadow-md' : 'py-4 bg-transparent'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="flex items-center"
        >
          <Heart className="h-8 w-8 text-indigo-600 mr-2" />
          <span className="text-2xl font-bold text-indigo-700">GiveHope</span>
        </motion.div>
        
        <div className="hidden md:flex space-x-8">
          {['Home', 'About', 'Programs', 'Donate', 'Contact'].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`font-medium ${isScrolled ? 'text-gray-800 hover:text-indigo-700' : 'text-white hover:text-indigo-200'} transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item}
            </motion.a>
          ))}
        </div>

        <motion.button
          className="md:hidden text-indigo-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileTap={{ scale: 0.9 }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>
      
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {['Home', 'About', 'Programs', 'Donate', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-medium text-gray-800 hover:text-indigo-700 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}
