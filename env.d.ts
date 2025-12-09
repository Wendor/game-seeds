/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

declare module '*?worker' {
    const workerConstructor: {
        new(): Worker
    }
    export default workerConstructor
}