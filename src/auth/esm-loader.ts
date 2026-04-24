/**
 * Workaround: TypeScript with "module": "commonjs" compiles dynamic import()
 * to require(), which can't load ESM-only packages (.mjs).
 * new Function() hides the import() from TypeScript's transformer so it's
 * preserved as a real ESM import() at runtime.
 */
export async function importEsm<T = any>(modulePath: string): Promise<T> {
    return new Function('modulePath', 'return import(modulePath)')(modulePath);
}
