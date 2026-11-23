import {Hono} from "hono";
import {SuggestionEndpointRequestJsonSchema} from "@superhuman/plugins-sdk/dist/suggestion_schemas";
import type {SuggestionRequest} from "@superhuman/plugins-sdk/dist/suggestion_types";
import {bearerAuth} from "hono/bearer-auth";
import {findDateSuggestions} from "./suggestions";
import {timingSafeEqual} from "hono/utils/buffer";
import {z} from "zod";
import {zValidator} from "@hono/zod-validator";

interface AppEnv {
  Bindings: {
    // Shared secret the connector sends as `Authorization: Bearer <token>`.
    // Set with `wrangler secret put AUTH_TOKEN` (or `.dev.vars` locally).
    AUTH_TOKEN?: string;
  };
}

const app = new Hono<AppEnv>();

// Rejects any request whose bearer token doesn't match the AUTH_TOKEN secret.
// If the secret isn't configured, every request is rejected.
const requireToken = bearerAuth<AppEnv>({
  verifyToken: (token, c) => {
    let expected = c.env.AUTH_TOKEN;
    if (!expected) {
      return false;
    }
    return timingSafeEqual(token, expected);
  },
});

// Create a Zod schema for the request, from the JSON schema.
const suggestionRequestSchema = z.fromJSONSchema(
  SuggestionEndpointRequestJsonSchema,
) as z.ZodType<SuggestionRequest>;

// Suggestions endpoint, that validates the shared secret and the request body.
app.post(
  "/suggestions",
  requireToken,
  zValidator("json", suggestionRequestSchema),
  c => {
    return c.json(findDateSuggestions(c.req.valid("json")));
  },
);

app.notFound(c => c.json({error: "not_found"}, 404));

export default app;
