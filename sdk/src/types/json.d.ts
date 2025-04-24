/**
 * Type declarations for importing JSON files
 */
declare module '*.json' {
  const value: any;
  export default value;
}

declare type JSONPrimitive = string | number | boolean | null;
declare type JSONObject = { [key: string]: JSONValue };
declare type JSONArray = JSONValue[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type JSONValue = JSONPrimitive | JSONObject | JSONArray | any; // Allow any for flexibility 