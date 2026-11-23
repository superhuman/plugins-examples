import {ServerDomain} from "../config";
import * as sdk from "@superhuman/plugins-sdk";

export const connector = sdk.newConnector();

connector.addNetworkDomain(ServerDomain);

// The server requires `Authorization: Bearer <token>`. See the README.
connector.setSystemAuthentication({
  type: sdk.AuthenticationType.HeaderBearerToken,
});

// Registers a suggestion provider that the agent can use to get suggestions.
connector.addSuggestionProvider({
  type: sdk.SuggestionProviderType.Endpoint,
  name: "DateFormatter",
  endpointUrl: `https://${ServerDomain}/suggestions`,
});
