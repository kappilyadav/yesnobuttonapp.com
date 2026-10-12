export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "YesNoButton",
  "url": "https://yesnobuttonapp.com/",
  "logo": "https://yesnobuttonapp.com/favicon.svg",
  "description": "Creator of the free online Yes No Button random decision maker.",
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Yes No Button",
  "url": "https://yesnobuttonapp.com/",
  "description": "A free online random Yes or No decision maker. Press the button to get a truly random answer to any yes or no question.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://yesnobuttonapp.com/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Yes No Button",
  "url": "https://yesnobuttonapp.com/",
  "description": "A free online random yes or no generator and decision maker. Press the button to get a truly random yes or no answer to any question.",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "browserRequirements": "Requires JavaScript",
  "featureList": [
    "Yes or No random generator",
    "Yes No Maybe three-way mode",
    "Voice audio result",
    "Result history tracker",
    "Shareable result URL",
    "Embeddable widget"
  ],
  "creator": { "@id": "https://yesnobuttonapp.com/#organization" }
};

export const createFaqSchema = (items: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});

export const articleSchema = (post: {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  slug: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.title,
  "description": post.description,
  "image": post.image ?? "https://yesnobuttonapp.com/og-image.webp",
  "datePublished": post.pubDate.toISOString(),
  "dateModified": (post.updatedDate ?? post.pubDate).toISOString(),
  "author": { "@id": "https://yesnobuttonapp.com/about/#founder" },
  "publisher": { "@id": "https://yesnobuttonapp.com/#organization" },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://yesnobuttonapp.com/blog/${post.slug}/`
  }
});

export const collectionPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Yes No Button Blog",
  "description": "Decision-making tips, question ideas, and guides for using the Yes No Button.",
  "url": "https://yesnobuttonapp.com/blog/"
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": item.name,
    "item": `https://yesnobuttonapp.com${item.url}`
  }))
});

export const founderSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://yesnobuttonapp.com/about/#founder",
  "name": "Kapil Yadav",
  "jobTitle": "Founder & Developer",
  "url": "https://yesnobuttonapp.com/author/",
  "sameAs": [
    "https://github.com/kappilyadav",
    "https://www.linkedin.com/in/kapilyadavv",
    "https://www.instagram.com/heykapil_",
    "https://x.com/kapsheeps"
  ],
  "worksFor": { "@id": "https://yesnobuttonapp.com/#organization" }
};

export const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Yes No Button",
  "description": "Learn about the Yes No Button — a free, anonymous random decision-making tool that helps you break out of analysis paralysis.",
  "url": "https://yesnobuttonapp.com/about/",
  "mainEntity": { "@id": "https://yesnobuttonapp.com/#organization" }
};

export const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Yes No Button",
  "description": "Get in touch with the Yes No Button team. Have a question, suggestion, or feedback? We'd love to hear from you.",
  "url": "https://yesnobuttonapp.com/contact/"
};

export const createWebPageSchema = (description: string, url?: string) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "description": description,
  "url": url ?? "https://yesnobuttonapp.com/"
});
