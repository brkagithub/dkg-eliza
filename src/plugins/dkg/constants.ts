// TODO: add isConnectedTo field or similar which you will use to connect w other KAs
export const dkgMemoryTemplate = {
  "@context": "http://schema.org",
  "@type": "CreativeWork",
  name: "<describe memory in a short way, as a title here>",
  description:
    "A memory created and stored by the agent, representing <describe interaction here>",
  creator: {
    "@type": "Person",
    "@id": "uuid:dr:keegan:grant",
    name: "Dr Keegan Grant",
  },
  dateCreated: "yyyy-mm-ddTHH:mm:ssZ",
  content: {
    "@type": "Text",
    "@id": "uuid:content:title",
    text: "<Insert text from the user query here>",
  },
  keywords: [
    {
      "@type": "Text",
      "@id": "uuid:keyword1",
      name: "keyword1",
    },
    {
      "@type": "Text",
      "@id": "uuid:keyword2",
      name: "keyword2",
    },
  ],
  inLanguage: "en",
  about: [
    {
      "@type": "Thing",
      "@id": "uuid:thing1",
      name: "Thing 1",
    },
    {
      "@type": "Thing",
      "@id": "uuid:thing2",
      name: "Thing 2",
    },
  ],
};
// associatedMedia: { can be twt image
//   "@type": "MediaObject",
//   contentUrl: "https://example.com/user-query-audio.mp3",
//   encodingFormat: "audio/mpeg",
// },

export const sparqlExamples = [
  `
  SELECT DISTINCT ?name ?description ?contentText
  WHERE {
    ?s a <http://schema.org/CreativeWork> .
    ?s <http://schema.org/name> ?name .
    ?s <http://schema.org/description> ?description .
    ?s <http://schema.org/content> ?content .
    ?content <http://schema.org/text> ?contentText .
    FILTER(
      CONTAINS(LCASE(?description), "example_word1") || 
      CONTAINS(LCASE(?description), "example_word2")
    )
  }
  `,
  `
  SELECT DISTINCT ?name ?description ?contentText
  WHERE {
    ?s a <http://schema.org/CreativeWork> .
    ?s <http://schema.org/name> ?name .
    ?s <http://schema.org/description> ?description .
    ?s <http://schema.org/content> ?content .
    ?content <http://schema.org/text> ?contentText .
    ?s <http://schema.org/keywords> ?keyword .
    ?keyword <http://schema.org/name> ?keywordName .
    FILTER(
      CONTAINS(LCASE(?keywordName), "example_keyword1") || 
      CONTAINS(LCASE(?keywordName), "example_keyword2")
    )
  }
  `,
  `
  SELECT DISTINCT ?name ?description ?contentText
  WHERE {
    ?s a <http://schema.org/CreativeWork> .
    ?s <http://schema.org/name> ?name .
    ?s <http://schema.org/description> ?description .
    ?s <http://schema.org/content> ?content .
    ?content <http://schema.org/text> ?contentText .
    ?s <http://schema.org/about> ?about .
    ?about <http://schema.org/name> ?aboutName .
    FILTER(
      CONTAINS(LCASE(?aboutName), "example_about1") || 
      CONTAINS(LCASE(?aboutName), "example_about2")
    )
  }
  `,
];

export const generalSparqlQuery = `
  SELECT DISTINCT ?name ?description ?contentText
  WHERE {
    ?s a <http://schema.org/CreativeWork> .
    ?s <http://schema.org/name> ?name .
    ?s <http://schema.org/description> ?description .
    ?s <http://schema.org/content> ?content .
    ?content <http://schema.org/text> ?contentText .
  }
  LIMIT 10
`;

export const DKG_EXPLORER_LINKS = {
  testnet: "https://dkg-testnet.origintrail.io/explore?ual=",
  mainnet: "https://dkg.origintrail.io/explore?ual=",
};
