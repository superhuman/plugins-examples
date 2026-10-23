import * as sdk from "@superhuman/plugins-sdk";

export const pack = sdk.newPack();

const DegreesParameter = sdk.makeParameter({
  type: sdk.ParameterType.Number,
  name: "angle",
  description: "An angle measured in degrees.",
});

const RadiansParameter = sdk.makeParameter({
  type: sdk.ParameterType.Number,
  name: "angle",
  description: "An angle measured in radians.",
});

pack.addFormula({
  resultType: sdk.ValueType.Number,
  name: "Sine",
  description: "Returns the angle (in radians) whose sine is the given number",
  parameters: [RadiansParameter],
  examples: [{params: [0], result: 0}],
  execute: ([value]) => Math.sin(value),
});

pack.addFormula({
  resultType: sdk.ValueType.Number,
  name: "Cosine",
  description: "Returns the cosine of a number (in radians).",
  parameters: [RadiansParameter],
  examples: [{params: [0], result: 1}],
  execute: ([value]) => Math.cos(value),
});

pack.addFormula({
  resultType: sdk.ValueType.Number,
  name: "Tangent",
  description: "Returns the tangent of a number (in radians).",
  parameters: [RadiansParameter],
  examples: [{params: [0], result: 0}],
  execute: ([value]) => Math.tan(value),
});

pack.addFormula({
  resultType: sdk.ValueType.Number,
  name: "ToRadians",
  description: "Converts degrees to radians.",
  parameters: [DegreesParameter],
  examples: [{params: [180], result: 3.14}],
  execute: ([value]) => (value * Math.PI) / 180,
});

pack.addFormula({
  resultType: sdk.ValueType.Number,
  name: "ToDegrees",
  description: "Converts radians to degrees.",
  parameters: [RadiansParameter],
  examples: [{params: [3.14159], result: 180}],
  execute: ([value]) => (value * 180) / Math.PI,
});
