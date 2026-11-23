// Values that exist only after the artifacts are created. Update each constant
// at the step in its comment, then upload the artifact that reads it.

// The host of the deployed server. It's printed by `wrangler deploy`. Set this
// after deploying the Worker and before uploading the connector.
export const ServerDomain = "date-formatter.example.workers.dev";

// Pack id printed by `packs create` for the connector. Set this after that
// command and before uploading the agent. 0 is a placeholder.
export const ConnectorPackId = 0;
