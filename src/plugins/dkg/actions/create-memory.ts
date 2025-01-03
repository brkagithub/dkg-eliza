import dotenv from "dotenv";
dotenv.config();
import {
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
  elizaLogger,
  generateText,
} from "@ai16z/eliza";
import { SearchResult } from "../../../common/types.ts";
import { handleApiError, formatSearchResults } from "../../../common/utils.ts";
// @ts-ignore
import DKG from "dkg.js";
import { DKG_EXPLORER_LINKS, dkgMemoryTemplate } from "../constants.ts";

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

async function constructKnowledgeAsset(
  runtime: IAgentRuntime,
  userQuery: string,
  state?: State
) {
  // TODO: not only based on 1 query, but whole conversation
  const context = `
  You are tasked with creating a structured memory JSON-LD object for an AI agent. The memory represents the interaction captured in the user query. Your goal is to extract all relevant information from the provided user query and populate the JSON-LD memory template provided below.

  ** Template **
  The memory should follow this JSON-LD structure:
  ${JSON.stringify(dkgMemoryTemplate)}

  ** Instructions **
  1. Extract the main idea of the user query and use it to create a concise and descriptive title for the memory. This should go in the "name" field.
  2. Summarize the interaction or content of the user query in the "description" field.
  3. Add the user query text to the "content.text" field.
  4. For the "about" field:
     - Identify the key topics or entities mentioned in the user query and add them as Thing objects.
     - Use concise, descriptive names for these topics.
  5. For the "keywords" field:
     - Extract relevant terms or concepts from the user query and list them as keywords.
     - Ensure the keywords capture the essence of the interaction, focusing on technical terms or significant ideas.
  6. Ensure all fields align with the schema.org ontology and accurately represent the interaction.
  7.Replace placeholder @id fields with unique and sensible identifiers:
     - Use the most relevant concept or term from the field to form the base of the ID.
     - @id fields must be valid uuids or URLs

  ** Input **
  User Query: ${userQuery}

  ** Output **
  Generate the memory in the exact JSON-LD format provided above, fully populated based on the input query.
  Make sure to only output the JSON-LD object. DO NOT OUTPUT ANYTHING ELSE, DONT ADD ANY COMMENTS OR REMARKS, JUST THE JSON LD CONTENT WRAPPED IN { }.
  `;
  const content = await generateText({
    runtime,
    context,
    modelClass: ModelClass.LARGE,
  });

  return JSON.parse(content.replace(/```json|```/g, ""));
}

export default {
  name: "DKG_CREATE",
  description: "Create a memory on the Decentralized Knowledge Graph.",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "<memory goes here>.",
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

      elizaLogger.info(`User question is: ${JSON.stringify(userQuery)}`);

      // TODO: ideally connect KA with existing KAs
      const knowledgeAsset = await constructKnowledgeAsset(
        runtime,
        userQuery,
        state
      );

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
      // TODO: make this link be a part of the message or a reply to the previous message. idk how to do this w twitter client
      const ENVIRONMENT = (process.env.ENVIRONMENT ??
        "testnet") as keyof typeof DKG_EXPLORER_LINKS;
      return `Memory has been created with the UAL ${UAL}. Check it out at ${DKG_EXPLORER_LINKS[ENVIRONMENT]}${UAL}`;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
