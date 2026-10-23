import {assert} from "chai";
import {describe} from "mocha";
import {executeFormulaFromPackDef} from "@superhuman/plugins-sdk/dist/development";
import {it} from "mocha";
import {pack} from "../pack";

describe("Trigonometry plugin", () => {
  it("executes Cosine", async () => {
    // Since our plugin doesn't make any fetcher calls, we can very simply
    // invoke formulas directly with the default mock execution context.
    assert.equal(1, await executeFormulaFromPackDef(pack, "Cosine", [0]));
    assert.approximately(
      1 / Math.sqrt(2),
      await executeFormulaFromPackDef<number>(pack, "Cosine", [Math.PI / 4]),
      1e6,
    );
  });

  it("converts degrees and radians", async () => {
    assert.equal(
      Math.PI / 2,
      await executeFormulaFromPackDef(pack, "ToRadians", [90]),
    );
    assert.equal(
      90,
      await executeFormulaFromPackDef(pack, "ToDegrees", [Math.PI / 2]),
    );
  });
});
