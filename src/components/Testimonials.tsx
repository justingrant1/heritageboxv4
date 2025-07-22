
interface TestimonialType {
  quote: string;
  author: string;
  location: string;
  rating?: number;
  date?: string;
}

const TestimonialCard = ({ 
  quote, 
  author, 
  location 
}: TestimonialType) => {
  return (
    <div className="testimonial-card">
      <div className="mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-secondary">★</span>
        ))}
      </div>
      <p className="italic mb-4 text-gray-700">{quote}</p>
      <div>
        <p className="font-bold">{author}</p>
        <p className="text-sm text-gray-500">{location}</p>
      </div>
    </div>
  );
};

// Export testimonials data and schema for use across components
export const testimonials = [
  {
    quote: "HeritageBox helped me preserve decades of family memories. The process was simple and the quality of the digitized media exceeded my expectations.",
    author: "Sarah Johnson",
    location: "Seattle, WA",
    rating: 5,
    date: "2025-02-15"
  },
  {
    quote: "I found boxes of old VHS tapes in my parents' attic and HeritageBox made it so easy to convert them. Now our whole family can enjoy these precious memories!",
    author: "Michael Rodriguez",
    location: "Austin, TX",
    rating: 5,
    date: "2025-03-22"
  },
  {
    quote: "The customer service was outstanding. They treated my family photos with such care, as if they were their own memories.",
    author: "Patricia Williams",
    location: "Boston, MA",
    rating: 5,
    date: "2025-04-10"
  }
];

// Generate Review schema markup for SEO
export const getTestimonialsSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HeritageBox",
    "review": testimonials.map(testimonial => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": testimonial.rating,
        "bestRating": 5
      },
      "author": {
        "@type": "Person",
        "name": testimonial.author
      },
      "datePublished": testimonial.date,
      "reviewBody": testimonial.quote
    }))
  };
};

const Testimonials = () => {

  return (
    <section className="bg-white section-padding">
      <div className="container mx-auto container-padding">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. See what others are saying about their HeritageBox experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              location={testimonial.location}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
