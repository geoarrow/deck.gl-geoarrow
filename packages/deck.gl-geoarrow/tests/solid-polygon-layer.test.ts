import type { FunctionThread, Pool } from "threads";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeoArrowSolidPolygonLayer } from "../src/layers/solid-polygon-layer.js";

describe("GeoArrowSolidPolygonLayer earcut worker pool lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not terminate an externally provided worker pool", async () => {
    const terminate = vi.fn(async () => {});

    const externalPool = {
      terminate,
    } as unknown as Pool<FunctionThread>;

    const layer = new GeoArrowSolidPolygonLayer({
      id: "test-layer",
      data: null as never,
      earcutWorkerPool: externalPool,
    });

    layer.initializeState({} as never);
    await layer.finalizeState({} as never);

    expect(terminate).not.toHaveBeenCalled();
  });

  it("does not fetch a worker script by default", () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(""));

    const layer = new GeoArrowSolidPolygonLayer({
      id: "test-layer",
      data: null as never,
    });
    layer.initializeState({} as never);

    expect(fetch).not.toHaveBeenCalled();
  });
});
