import type { FunctionThread, Pool } from "threads";
import { describe, expect, it, vi } from "vitest";
import { GeoArrowSolidPolygonLayer } from "../src/layers/solid-polygon-layer.js";

describe("GeoArrowSolidPolygonLayer earcut worker pool lifecycle", () => {
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
});
