import * as helpers from "./helpers";
import * as schemas from "./schemas";
import * as sdk from "@superhuman/plugins-sdk";

export const pack = sdk.newPack();

// The Merriam-Webster API uses an API token, which should be included in
// request urls in a "key=" parameter, so we configure that here. When
// running `packs auth examples/dictionary/pack.ts` you will be prompted
// to enter your API key to use when using `packs execute` to exercise formulas
// in this plugin. Users would be prompted to enter an API key when installing
// this plugin in the Coda UI.
pack.setUserAuthentication({
  type: sdk.AuthenticationType.QueryParamToken,
  paramName: "key",
});

// This tells Coda which domain the plugin make requests to. Any fetcher
// requests to other domains won't be allowed.
pack.addNetworkDomain("dictionaryapi.com");

pack.addFormula({
  resultType: sdk.ValueType.Object,
  name: "Define",
  description: "Returns the definition and other metadata for a given word.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "word",
      description: "A word to define.",
    }),
  ],
  schema: schemas.DefinitionArraySchema,
  examples: [
    {
      params: ["hello"],
      result: {
        id: "hello",
        definitions: ["definition of hello"],
        partOfSpeech: "noun",
        headword: "hello",
        firstUse: "1834",
        offensive: false,
      },
    },
  ],
  execute: async function ([word], context) {
    return helpers.lookupDefinition(context, word);
  },
});
