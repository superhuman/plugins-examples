import {assert} from "chai";
import {connector} from "../pack";
import {describe} from "mocha";
import {executeFormulaFromPackDef} from "@superhuman/plugins-sdk/dist/development";
import {it} from "mocha";

describe("Trigonometry plugin", () => {
  it("executes Cosine", async () => {
    // Since our plugin doesn't make any fetcher calls, we can very simply
    // invoke formulas directly with the default mock execution context.
    assert.equal(1, await executeFormulaFromPackDef(connector, "Cosine", [0]));
    assert.approximately(
      1 / Math.sqrt(2),
      await executeFormulaFromPackDef<number>(connector, "Cosine", [
        Math.PI / 4,
      ]),
      1e6,
    );
  });

  it("converts degrees and radians", async () => {
    assert.equal(
      Math.PI / 2,
      await executeFormulaFromPackDef(connector, "ToRadians", [90]),
    );
    assert.equal(
      90,
      await executeFormulaFromPackDef(connector, "ToDegrees", [Math.PI / 2]),
    );
  });
});
