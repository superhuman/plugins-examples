import {ConnectorPackId} from "../config";
import * as sdk from "@superhuman/plugins-sdk";

export const agent = sdk.newAgent();

// These instructions are only used when chatting with the agent.
agent.setInstructions(`
  You help users write dates as YYYY-MM-DD. Suggest rewrites only for dates 
  that are unambiguous.
`);

// Add a while-writing routine that watches for text that contains dates.
agent.addDefaultRoutine({
  name: "Format dates",
  trigger: {
    kind: sdk.DefaultTriggerKind.WhileWriting,
    condition: "The user has written a date",
  },
});

agent.setTools({
  connectors: [
    {
      connectorId: ConnectorPackId,
      // Enables suggestions from the connector's provider.
      useSuggestions: true,
    },
  ],
});
