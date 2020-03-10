export const Value2SQLValue = new Map();

const DateTimeConverter = value => {
  let d = new Date(value);
  return `'${d.toISOString()}'`;
};

Value2SQLValue.set("date", DateTimeConverter)
  .set("DateTime", DateTimeConverter)
  .set("Time", DateTimeConverter);

Value2SQLValue.set("number", value => value);

Value2SQLValue.set("string", value => `'${value}'`);
Value2SQLValue.set("boolean", value => (value ? 1 : 0));
