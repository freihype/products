import { keyOf } from "../../../../lib";
import { defaultMessages } from "../../../../shared";

export const operatorTypes = new Map();


operatorTypes
  .set("number", [
    { value: keyOf(defaultMessages, defaultMessages.lessThan), Label: defaultMessages.lessThan, TranslateTo: " < " },
    { value: keyOf(defaultMessages, defaultMessages.lessThanOrEqual), Label: defaultMessages.lessThanOrEqual, TranslateTo: " <= " },
    { value: keyOf(defaultMessages, defaultMessages.equal), Label: defaultMessages.equal, TranslateTo: " = " },
    { value: keyOf(defaultMessages, defaultMessages.greaterThan), Label: defaultMessages.greaterThan, TranslateTo: " > " },
    { value: keyOf(defaultMessages, defaultMessages.greaterThanOrEqual), Label: defaultMessages.greaterThanOrEqual, TranslateTo: " >= " }
  ])
  .set("time", [
    { value: keyOf(defaultMessages, defaultMessages.atLeast), Label: defaultMessages.atLeast },
    { value: keyOf(defaultMessages, defaultMessages.atMost), Label: defaultMessages.atMost }
  ])
  .set("timestamp", [
    { value: keyOf(defaultMessages, defaultMessages.before), Label: defaultMessages.before },
    { value: keyOf(defaultMessages, defaultMessages.after), Label: defaultMessages.after }
  ])
  .set("date", [
    { value: keyOf(defaultMessages, defaultMessages.before), Label: defaultMessages.before },
    { value: keyOf(defaultMessages, defaultMessages.after), Label: defaultMessages.after }
  ])
  .set("string", [
    { value: keyOf(defaultMessages, defaultMessages.contains), Label: defaultMessages.contains },
    { value: keyOf(defaultMessages, defaultMessages.notContains), Label: defaultMessages.notContains },
    { value: keyOf(defaultMessages, defaultMessages.startsWith), Label: defaultMessages.startsWith },
    { value: keyOf(defaultMessages, defaultMessages.equal), Label: defaultMessages.equal }
  ])
  .set("array", [
    { value: keyOf(defaultMessages, defaultMessages.has), Label: defaultMessages.has },
    { value: keyOf(defaultMessages, defaultMessages.hasNot), Label: defaultMessages.hasNot }
  ])
  .set("browser", [
    { Label: "Like", TranslateTo: " Like " },
    { Label: "Not Like", TranslateTo: " Not Like " },
    { Label: "=", TranslateTo: " = " },
    { Label: "!=", TranslateTo: " != " }
  ])
  .set("boolean", [
    { Label: "=", TranslateTo: " = " },
    { Label: "!=", TranslateTo: " != " }
  ]);

export const operandTypes = new Map();
operandTypes
  .set("AND", { Label: "AND", TranslateTo: " AND " })
  .set("OR", { Label: "OR", TranslateTo: " OR " });
