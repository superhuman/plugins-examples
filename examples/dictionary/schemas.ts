import * as sdk from "@superhuman/plugins-sdk";

export const DefinitionSchema = sdk.makeObjectSchema({
  properties: {
    id: {type: sdk.ValueType.String, required: true},
    definitions: {
      type: sdk.ValueType.Array,
      items: {type: sdk.ValueType.String},
      required: true,
    },
    headword: {type: sdk.ValueType.String, required: true},
    partOfSpeech: {type: sdk.ValueType.String},
    firstUse: {type: sdk.ValueType.String},
    offensive: {type: sdk.ValueType.Boolean, required: true},
  },
  // The display property tells Coda which of your object's properties
  // should be used as a label for your object. Plugin objects will be rendered
  // as a chip showing the label, and the rest of the fields will show up
  // when hovering over the chip.
  displayProperty: "headword",
});

export const DefinitionArraySchema = sdk.makeSchema({
  type: sdk.ValueType.Array,
  items: DefinitionSchema,
});
