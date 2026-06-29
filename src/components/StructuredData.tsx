export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://noirblancny.com/#organization",
        name: "Noir & Blanc",
        url: "https://noirblancny.com",
        logo: {
          "@type": "ImageObject",
          url: "https://noirblancny.com/cdn/shop/files/Group_1171277502_2.svg",
        },
        description:
          "Discover Noir & Blanc luxury handbags collection. Timeless, meticulously crafted handbags including crossbody bags, totes, backpacks, and wallets.",
        email: "hello@noirblancny.com",
        sameAs: [
          "https://www.instagram.com/noirblancnyc/",
          "https://www.tiktok.com/@noirandblancnyc",
          "https://www.facebook.com/noirblancnyc",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://noirblancny.com/#website",
        url: "https://noirblancny.com",
        name: "Noir & Blanc",
        publisher: { "@id": "https://noirblancny.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://noirblancny.com/shop?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
