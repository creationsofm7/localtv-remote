// `koffi/indirect` is the bundler-friendly entrypoint but ships no own types;
// it exposes the same API as the default `koffi` export.
declare module 'koffi/indirect' {
  import koffi from 'koffi';
  export default koffi;
}
