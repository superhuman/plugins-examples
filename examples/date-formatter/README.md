# Date formatter agent

A sample agent that provides writing suggestions using a private connector and an external server. Learn more about this feature in the guide [Generate suggestions from your own backend](https://docs.superhuman.com/packs/build/latest/agents/features/screen-annotations/provider/).

The agent rewrites dates in a user's writing to `YYYY-MM-DD` format. The server use the `compromise` and `compromise-dates` libraries to find dates in text and reformat them.

**Limited access**

Using a suggestion provider to connect to an external server is only available to a limited set of partners.

## Layout

- `agent/` — Agent that sets up a while-writing routine and uses the connector for suggestions.
- `connector/` — A connector that includes a suggestion provider, pointing to an endpoint on the server.
- `server/` — A Cloudflare Worker that serves the suggestion endpoint.
- `config.ts` — Holds shared configuration information, such as domains and Pack IDs.

## Run locally

From the repository root, first install the Node dependencies

```sh
yarn
```

The server rejects requests that lack the right bearer token. For local runs, put a throwaway token in `examples/date-formatter/server/.dev.vars`, which is gitignored:

```sh
echo "AUTH_TOKEN=local-dev-token" > examples/date-formatter/server/.dev.vars
npx wrangler dev --config examples/date-formatter/server/wrangler.jsonc
```

Example request:

```sh
curl -s http://localhost:8787/suggestions \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer local-dev-token' \
  -d '{"text":"The launch is March 5, 2026."}'
```

Example response:

```json
{
  "suggestions": [
    {
      "startOffset": 14,
      "endOffset": 28,
      "original": "March 5, 2026.",
      "replacement": "2026-03-05.",
      "title": "Use ISO 8601",
      "explanation": "ISO 8601 is the best date format because it's unambiguous, sorts easily, works across the world, and is easy for humans and machines to use."
    }
  ]
}
```

## Deploy

Run these commands from the repository root. `config.ts` holds the two values that do not exist until you create the artifacts. The checked-in values are placeholders. Local `wrangler dev` does not read this file.

`packs create` runs once for each artifact. It prints a pack id and writes `.coda-pack.json` in that artifact's directory. Later commands read that file. `packs upload` sends a new version of an artifact you have already created.

1. Install dependencies, then log in to Cloudflare. Login is once per machine. It opens a browser and stores the credentials outside this repository.

   ```sh
   yarn
   npx wrangler login
   ```

2. Deploy the Worker. The first deploy asks you to register a `workers.dev` subdomain if the account does not have one.

   ```sh
   npx wrangler deploy --config examples/date-formatter/server/wrangler.jsonc
   ```

   Copy the host from the URL it prints into the `config.ts` variable `ServerDomain`. Leave off `https://` and any path. Do this before you upload the connector.

3. Generate a token and store it as the Worker's `AUTH_TOKEN` secret. The server rejects every request until this secret exists. Keep the token. You enter the same value in the connector in step 5.

   ```sh
   openssl rand -hex 32
   npx wrangler secret put AUTH_TOKEN --config examples/date-formatter/server/wrangler.jsonc
   ```

4. Register a Superhuman API token using `npx packs register --open`. The CLI writes it to `.coda.json`, which is gitignored, and uses it for every later `packs` command.

   ```sh
   npx packs register --open
   ```

5. Create, upload, and release the connector.

   ```sh
   npx packs create examples/date-formatter/connector/connector.ts \
     --name "Date formatter connector"
   npx packs upload examples/date-formatter/connector/connector.ts
   npx packs release examples/date-formatter/connector/connector.ts -y \
     --notes "Initial release"
   ```

   Copy the `pack_id` it prints into the `config.ts` variable `ConnectorPackId`.

6. Add the shared secret to the connector. Open the connector in Pack Studio (`https://docs.superhuman.com/p/<CONNECTOR_PACK_ID>`), navigate to the **Settings** tab, and click **Add system authentication**. Enter the secret token from step 2.

7. Create and upload the agent.

   ```sh
   npx packs create examples/date-formatter/agent/agent.ts \
     --name "Date formatter agent"
   npx packs upload examples/date-formatter/agent/agent.ts
   ```

   Copy the `pack_id` it prints and use it in the next step.

8. Update the connector so that only the agent we created above can use it.

   ```sh
   npx packs settings update examples/date-formatter/connector/connector.ts \
     --allowedAgents <AGENT_PACK_ID>
   ```

9. Install the agent into your account.

   ```sh
   npx packs agent install examples/date-formatter/agent/agent.ts
   ```

   Open the URL returned by that command and click the **Connect** button next to the connector.

## Try it out

1. Open https://textarea.org/

2. Enter the text

   ```
   We're going to party like it's December 31, 1999.
   ```

In a few seconds you should see it underlined, with the agent suggesting you replace the date with `1999-12-31`.