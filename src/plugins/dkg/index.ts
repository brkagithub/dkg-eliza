import { Provider } from "@ai16z/eliza";
import {
  SearchPlugin,
  SearchPluginConfig,
  SearchAction,
} from "../../common/types.ts";
import createMemoryAction from "./actions/create-memory.ts";
import graphSearchProvider from "./providers/graph-search.ts";

// ---------------------------------------------
// Plugin configuration interface
// ---------------------------------------------
export interface DkgPluginConfig extends SearchPluginConfig {
  // Add any DKG-specific config options here if needed
  // e.g., custom query patterns, additional rate limits, etc.
}

// ---------------------------------------------
// Default configuration for the DKG plugin
// ---------------------------------------------
const DEFAULT_CONFIG: Partial<DkgPluginConfig> = {
  maxResults: 20,
};

export class DkgPlugin implements SearchPlugin {
  name = "dkg-search";
  description =
    "Plugin that queries the OriginTrail Decentralized Knowledge Graph";
  config: DkgPluginConfig;

  constructor(config: DkgPluginConfig) {
    // Merge user config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  actions: SearchAction[] = [createMemoryAction];

  providers: Provider[] = [graphSearchProvider];
}

export default new DkgPlugin({ apiKey: "" });
