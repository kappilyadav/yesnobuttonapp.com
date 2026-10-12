export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://yesnobuttonapp.com/#organization",
  "name": "YesNoButton",
  "url": "https://yesnobuttonapp.com/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://yesnobuttonapp.com/web-app-manifest-512x512.png",
    "width": 512,
    "height": 512
  },
  "description": "Creator of the free online Yes No Button random decision maker.",
  "email": "hello@yesnobuttonapp.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "hello@yesnobuttonapp.com",
    "url": "https://yesnobuttonapp.com/contact/",
    "availableLanguage": "English"
  },
  "founder": { "@id": "https://yesnobuttonapp.com/about/#founder" }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://yesnobuttonapp.com/#website",
  "name": "Yes No Button",
  "url": "https://yesnobuttonapp.com/",
  "description": "A free online random Yes or No decision maker. Press the button to get a truly random answer to any yes or no question.",
  "inLanguage": "en",
  "publisher": { "@id": "https://yesnobuttonapp.com/#organization" }
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
  "isAccessibleForFree": true,
  "inLanguage": "en",
  "image": "https://yesnobuttonapp.com/og-image.webp",
  "creator": { "@id": "https://yesnobuttonapp.com/#organization" },
  "author": { "@id": "https://yesnobuttonapp.com/about/#founder" },
  "publisher": { "@id": "https://yesnobuttonapp.com/#organization" }
};

// Per-page WebApplication entity so each tool page describes itself, not the homepage.
export const createWebAppSchema = (page: { name: string; url: string; description: string }) => ({
  ...webAppSchema,
  "@id": `${page.url}#webapp`,
  "name": page.name,
  "url": page.url,
  "description": page.description,
});

export const createFaqSchema = (items: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
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
  "@id": `https://yesnobuttonapp.com/blog/${post.slug}/#article`,
  "headline": post.title,
  "description": post.description,
  "image": post.image ?? "https://yesnobuttonapp.com/og-image.webp",
  "datePublished": post.pubDate.toISOString(),
  "dateModified": (post.updatedDate ?? post.pubDate).toISOString(),
  "inLanguage": "en",
  "isPartOf": { "@id": "https://yesnobuttonapp.com/#website" },
  "author": { "@id": "https://yesnobuttonapp.com/about/#founder" },
  "publisher": { "@id": "https://yesnobuttonapp.com/#organization" },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://yesnobuttonapp.com/blog/${post.slug}/`
  }
});

export const collectionPageSchema = (posts: { id: string; title: string }[] = []) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Yes No Button Blog",
  "description": "Decision-making tips, question ideas, and guides for using the Yes No Button.",
  "url": "https://yesnobuttonapp.com/blog/",
  "isPartOf": { "@id": "https://yesnobuttonapp.com/#website" },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": posts.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://yesnobuttonapp.com/blog/${p.id}/`,
      "name": p.title
    }))
  }
});

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
  "image": "https://yesnobuttonapp.com/images/kappil-yadav.webp",
  "description": "Full-stack developer who builds and maintains the Yes No Button and its web tools.",
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
  "isPartOf": { "@id": "https://yesnobuttonapp.com/#website" },
  "mainEntity": { "@id": "https://yesnobuttonapp.com/#organization" }
};

export const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Yes No Button",
  "description": "Get in touch with the Yes No Button team. Have a question, suggestion, or feedback? We'd love to hear from you.",
  "url": "https://yesnobuttonapp.com/contact/",
  "isPartOf": { "@id": "https://yesnobuttonapp.com/#website" },
  "mainEntity": { "@id": "https://yesnobuttonapp.com/#organization" }
};

export const createWebPageSchema = (description: string, url?: string, name?: string) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  ...(name ? { "name": name } : {}),
  "description": description,
  "url": url ?? "https://yesnobuttonapp.com/",
  "inLanguage": "en",
  "isPartOf": { "@id": "https://yesnobuttonapp.com/#website" }
});
