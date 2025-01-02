import dotenv from "dotenv";
dotenv.config();
import {
  IAgentRuntime,
  Memory,
  Provider,
  State,
  elizaLogger,
} from "@ai16z/eliza";

// @ts-ignore
import DKG from "dkg.js";

// Provider configuration
const PROVIDER_CONFIG = {
  environment: process.env.ENVIRONMENT || "testnet",
  endpoint: process.env.OT_NODE_HOSTNAME || "http://default-endpoint",
  port: process.env.OT_NODE_PORT || "8900",
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME || "base:84532",
    publicKey: process.env.PUBLIC_KEY || "",
    privateKey: process.env.PRIVATE_KEY || "",
  },
  maxNumberOfRetries: 300,
  frequency: 2,
  contentType: "all",
  nodeApiVersion: "/v1",
};

interface BlockchainConfig {
  name: string;
  publicKey: string;
  privateKey: string;
}

interface DKGClientConfig {
  environment: string;
  endpoint: string;
  port: string;
  blockchain: BlockchainConfig;
  maxNumberOfRetries?: number;
  frequency?: number;
  contentType?: string;
  nodeApiVersion?: string;
}

export class DKGProvider {
  private client: any; // TODO: add type
  constructor(config: DKGClientConfig) {
    this.validateConfig(config);
  }

  private validateConfig(config: DKGClientConfig): void {
    const requiredStringFields = ["environment", "endpoint", "port"];

    for (const field of requiredStringFields) {
      if (typeof config[field as keyof DKGClientConfig] !== "string") {
        throw new Error(
          `Invalid configuration: Missing or invalid value for '${field}'`
        );
      }
    }

    if (!config.blockchain || typeof config.blockchain !== "object") {
      throw new Error("Invalid configuration: 'blockchain' must be an object");
    }

    const blockchainFields = ["name", "publicKey", "privateKey"];

    for (const field of blockchainFields) {
      if (
        typeof config.blockchain[field as keyof BlockchainConfig] !== "string"
      ) {
        throw new Error(
          `Invalid configuration: Missing or invalid value for 'blockchain.${field}'`
        );
      }
    }

    this.client = new DKG(config);
  }

  async search(runtime: IAgentRuntime, message: Memory): Promise<string> {
    elizaLogger.info(`Entering graph search provider!`);

    const userQuery = message.content.text;

    elizaLogger.info(`Got user query ${JSON.stringify(userQuery)}`);

    // TODO: instead of hardcoding query use some predefined ontology + fewshot examples + LLM to construct query
    // TODO: ontology can probably be defined in json of the character via examples, this would be ideal
    // TODO: for the beggining agent should probably create only one 'type' of KA (then improve it and make it a whole ontology)
    const query = `
    SELECT ?p ?o
    WHERE {
    <uuid:belgrade> ?p ?o
    }
    `;

    elizaLogger.info(`Formed SPARQL query ${query}`);

    const queryOperationResult = await this.client.graph.query(query, "SELECT");

    if (!queryOperationResult || !queryOperationResult.data) {
      throw new Error("DKG response did not contain expected data.");
    }

    elizaLogger.info(
      `Got ${queryOperationResult.data.length} results from the DKG`
    );

    // TODO: idk dont love this format, maybe change it
    const result = queryOperationResult.data.map((entry: any) => {
      const formattedParts = Object.keys(entry).map(
        (key) => `${key}: ${entry[key]}`
      );
      return formattedParts.join(", ");
    });

    return result.join("\n");
  }
}

const dkgProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string | null> => {
    try {
      const provider = new DKGProvider(PROVIDER_CONFIG);

      return await provider.search(runtime, _message);
    } catch (error) {
      console.error("Error in wallet provider:", error);
      return null;
    }
  },
};

// Module exports
export default dkgProvider;
