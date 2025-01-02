import dotenv from "dotenv";
dotenv.config();
import { IAgentRuntime, Memory, State, elizaLogger } from "@ai16z/eliza";
import { SearchResult } from "../../../common/types.ts";
import { handleApiError, formatSearchResults } from "../../../common/utils.ts";
// @ts-ignore
import DKG from "dkg.js";

// ---------------------------------------------
// Create a DKG client instance
// ---------------------------------------------

const DkgClient = new DKG({
  environment: process.env.ENVIRONMENT,
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: process.env.OT_NODE_PORT,
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME,
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY,
  },
  maxNumberOfRetries: 300,
  frequency: 2,
  contentType: "all",
  nodeApiVersion: "/v1",
});

export default {
  name: "DKG_CREATE",
  description: "Create a memory on the Decentralized Knowledge Graph.",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Elon Musk loves pizza.",
        },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Memory successfully created on the DKG! Check it out here: https://dkg-testnet.origintrail.io/explore?ual=did:dkg:base:8453/0x3bdfa81079b2ba53a25a6641608e5e1e6c464597/408090",
          action: "DKG_CREATE",
          content: {
            ual: "did:dkg:base:8453/0x3bdfa81079b2ba53a25a6641608e5e1e6c464597/408090",
          },
        },
      },
    ],
  ],
  similes: ["dkg", "origintrail", "knowledge graph"],
  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // no need to validate
    return true;
    // try {
    //   // If you want to require a search query from the user:
    //   validateSearchQuery(message.content);
    //   return true;
    // } catch {
    //   return false;
    // }
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const userQuery =
        message.content.text ?? "What is the capital of Serbia?";
      // TODO: check what these variables have runtime, message, state, maybe there's something useful

      elizaLogger.info(`User question is: ${JSON.stringify(userQuery)}`);

      // TODO: transform into custom pickable ontology instead of hardcoded
      const knowledgeAsset = {
        "@context": "http://schema.org",
        "@type": "City",
        "@id": "uuid:belgrade",
        name: "Belgrade",
        description:
          "The capital and largest city of Serbia, known for its vibrant culture and historic significance.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Belgrade",
          addressCountry: "Serbia",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 44.8176,
          longitude: 20.4569,
        },
      };

      elizaLogger.info(
        `Formed Knowledge Asset ${JSON.stringify(knowledgeAsset)}`
      );

      const createOperationResult = await DkgClient.asset.create(
        { public: knowledgeAsset },
        {
          epochsNum: 2,
          minimumNumberOfFinalizationConfirmations: 1,
          minimumNumberOfNodeReplications: 3,
        }
      );

      if (!createOperationResult || !createOperationResult.UAL) {
        throw new Error("DKG asset creation failed.");
      }

      const UAL = createOperationResult.UAL;
      elizaLogger.info(`Created Knowledge Asset with the UAL ${UAL}`);

      // TODO: make dkg explorer link constant
      // TODO: make this link be a part of the message or a reply to the previous message. idk how to do this
      return `Memory has been created with the UAL ${UAL}. Check it out at https://dkg-testnet.origintrail.io/explore?ual=${UAL}`;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
