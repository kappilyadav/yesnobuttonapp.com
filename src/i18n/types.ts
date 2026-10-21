export interface HomeContent {
  seo: { title: string; description: string };
  h1: string;
  subtitle: string;
  breadcrumb: string;
  what: { eyebrow: string; heading: string; paragraphs: string[]; cta: string };
  how: { eyebrow: string; heading: string; intro: string; steps: { title: string; text: string }[]; note: string };
  works: {
    eyebrow: string;
    heading: string;
    flowClick: string;
    flowResult: string;
    paragraphs: string[];
    tableHeading: string;
    tableHead: [string, string, string, string];
    tableRows: [string, string, string, string][];
  };
  faq: { eyebrow: string; heading: string; items: { question: string; answer: string }[]; showAll: string };
  aka: { eyebrow: string; heading: string; text: string };
  tool: { toyAria: string; wheelEntries: string[] };
  schemaFeatures: string[];
}
