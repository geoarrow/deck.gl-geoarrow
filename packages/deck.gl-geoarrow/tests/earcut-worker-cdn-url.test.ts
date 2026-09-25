/**
 * Test that the Earcut worker URL matches the version we require.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { EARCUT_WORKER_CDN_URL } from "../src/layers/solid-polygon-layer.js";

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// geoarrow-js doesn't export its package.json, so resolve its main entry
// (dist/geoarrow.cjs) and read the package.json one directory up.
const require = createRequire(import.meta.url);
const geoarrowJsDir = join(
  dirname(require.resolve("@geoarrow/geoarrow-js")),
  "..",
);
const installedVersion: string = readJson(
  join(geoarrowJsDir, "package.json"),
).version;

const ourPackageJson = readJson(join(__dirname, "..", "package.json"));

describe("EARCUT_WORKER_CDN_URL", () => {
  it("pins the installed geoarrow-js version", () => {
    expect(EARCUT_WORKER_CDN_URL).toBe(
      `https://cdn.jsdelivr.net/npm/@geoarrow/geoarrow-js@${installedVersion}/dist/earcut.worker.min.js`,
    );
  });

  it("matches the geoarrow-js dependency floor", () => {
    expect(ourPackageJson.dependencies["@geoarrow/geoarrow-js"]).toBe(
      `^${installedVersion}`,
    );
  });
});
