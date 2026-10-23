import {assert} from "chai";
import {describe} from "mocha";
import {executeFormulaFromPackDef} from "@superhuman/plugins-sdk/dist/development";
import {it} from "mocha";
import {pack} from "../pack";

describe("Dictionary plugin integration test", () => {
  it("executes Define", async () => {
    // Here we execute the formula using a real http fetcher. Since this plugin
    // requires authentication, this requires that you've already run
    // `packs auth examples/dictionary/pack.ts` to set up an API key.
    let response = await executeFormulaFromPackDef<any[]>(
      pack,
      "Define",
      ["coda"],
      undefined,
      undefined,
      {
        useRealFetcher: true,
        manifestPath: require.resolve("../pack"),
      },
    );

    assert.isAtLeast(response.length, 1);
    assert.equal(response[0].Id, "coda");
  });
});
