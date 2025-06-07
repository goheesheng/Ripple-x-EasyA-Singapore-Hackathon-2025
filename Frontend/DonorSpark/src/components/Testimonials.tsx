import { motion } from 'framer-motion';
import Slider from 'react-slick';
import { Quote, Star } from 'lucide-react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Emma Thompson',
    role: 'Regular Donor',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150',
    quote: 'Donating to DonorSpark has been one of the most rewarding decisions I\'ve made. The transparency in how they use funds gives me confidence that my contributions are making a real difference.',
    stars: 5
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Volunteer',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
    quote: 'After volunteering with DonorSpark, I saw firsthand the impact they make in communities. Their approach is thoughtful, sustainable, and truly transformative.',
    stars: 5
  },
  {
    id: 3,
    name: 'Sophia Chen',
    role: 'Corporate Partner',
    image: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&q=80&w=150&h=150',
    quote: 'Our company partnered with DonorSpark for our CSR initiatives, and it has been an incredible journey. Their team is professional, dedicated, and passionate about creating positive change.',
    stars: 5
  }
];

export default function Testimonials() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="py-12 px-4 bg-gray-50"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Voices of Impact</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from donors, volunteers, and partners who have witnessed the change we're making together.
          </p>
        </div>

        <Slider {...settings}>
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="px-4">
              <div className="testimonial-card">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-14 h-14 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>

                <div className="mb-4 flex">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>

                <div className="relative">
                  <Quote size={24} className="text-indigo-200 absolute -top-2 -left-2 transform -scale-x-100" />
                  <p className="text-gray-700 italic pl-5">{testimonial.quote}</p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </motion.div>
  );
}
