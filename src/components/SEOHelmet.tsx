
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  keywords?: string;
  canonical?: string;
  schema?: object[]; // Added schema array to allow custom schema per page
}

export default function SEOHelmet({
  title = '',
  description = '',
  image = '/lovable-uploads/dff425b2-3ade-48c8-acd8-e56366b3516d.png',
  article = false,
  keywords = '',
  canonical = '',
  schema = [], // Default to empty array
}: SEOProps) {
  const { pathname } = useLocation();
  
  // Default values - optimized for length and keywords
  const defaultTitle = 'HeritageBox® | Professional Memory Digitization Services';
  const defaultDescription = 'Transform your precious VHS tapes, photos, slides and more into digital formats with HeritageBox®. Professional digitization services preserving memories for generations.';
  const defaultKeywords = 'digitize vhs, photo scanning, memory preservation, family archives, convert slides, legacy preservation, home movies digitization, media conversion service';
  
  // Ensure image URL is absolute
  const absoluteImageUrl = image.startsWith('http') 
    ? image 
    : `https://heritagebox.com${image}`;
  
  // Use provided canonical URL or build from pathname
  const canonicalUrl = canonical || `https://heritagebox.com${pathname}`;
  
  // Use defaults if not provided
  const seo = {
    title: title || defaultTitle,
    description: description || defaultDescription,
    image: absoluteImageUrl,
    url: canonicalUrl,
    keywords: keywords || defaultKeywords,
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <link rel="canonical" href={seo.url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:site_name" content="HeritageBox®" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      
      {/* Resource hints for performance */}
      <link rel="preconnect" href="https://cdn.gpteng.co" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://cdn.gpteng.co" />
      
      {/* Custom schema markup per page */}
      {schema.map((schemaObj, index) => (
        <script 
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObj) }}
        />
      ))}
    </Helmet>
  );
}
