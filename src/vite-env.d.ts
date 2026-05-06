/// <reference types="vite/client" />

// JSON module declarations
declare module '*.json' {
  const value: any;
  export default value;
}
