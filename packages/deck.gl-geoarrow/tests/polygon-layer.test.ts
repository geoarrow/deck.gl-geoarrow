import { describe, expect, it } from "vitest";
import { GeoArrowPolygonLayer } from "../src/layers/polygon-layer.js";

describe("GeoArrowPolygonLayer earcut worker defaults", () => {
  it("does not set a worker URL by default", () => {
    const layer = new GeoArrowPolygonLayer({
      id: "test-layer",
      data: null as never,
    });

    expect(layer.props.earcutWorkerUrl).toBeNull();
  });
});
