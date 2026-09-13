import { getEventListeners } from "node:events";
import type * as ga from "@geoarrow/geoarrow-js";
import * as arrow from "apache-arrow";
import type { FunctionThread } from "threads";
import { Pool, Thread } from "threads";
import { describe, expect, it, vi } from "vitest";
import { GeoArrowSolidPolygonLayer } from "../src/layers/solid-polygon-layer.js";

function makePolygonData(): ga.data.PolygonData {
  const float = new arrow.Float64();
  const vertices = arrow.makeData({
    type: new arrow.FixedSizeList(2, new arrow.Field("xy", float)),
    length: 4,
    child: arrow.makeData({
      type: float,
      data: new Float64Array([0, 0, 1, 0, 1, 1, 0, 0]),
    }),
  });
  const rings = arrow.makeData({
    type: new arrow.List(new arrow.Field("vertices", vertices.type)),
    length: 1,
    valueOffsets: new Int32Array([0, 4]),
    child: vertices,
  });
  return arrow.makeData({
    type: new arrow.List(new arrow.Field("rings", rings.type)),
    length: 1,
    valueOffsets: new Int32Array([0, 1]),
    child: rings,
  });
}

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
      earcutWorkerUrl: null,
    });

    layer.initializeState({} as never);
    await layer.finalizeState({} as never);

    expect(terminate).not.toHaveBeenCalled();
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeLayer(pool?: Pool<FunctionThread>) {
  const layer = new GeoArrowSolidPolygonLayer({
    id: "test-layer",
    data: new arrow.RecordBatch({}),
    earcutWorkerUrl: null,
    earcutWorkerPool: pool,
  });
  layer.initializeState({} as never);
  return layer;
}

function nextTaskQueued(pool: Pool<FunctionThread>) {
  return new Promise<void>((resolve) => {
    const subscription = pool.events().subscribe((event) => {
      if (event.type === Pool.EventType.taskQueued) {
        subscription.unsubscribe();
        resolve();
      }
    });
  });
}

function triangulate(layer: GeoArrowSolidPolygonLayer, type = "Polygon") {
  const polygon = makePolygonData();
  if (type === "Polygon") return layer._earcutPolygonData(polygon);
  return layer._earcutMultiPolygonData(
    arrow.makeData({
      type: new arrow.List(new arrow.Field("polygons", polygon.type)),
      length: 1,
      valueOffsets: new Int32Array([0, 1]),
      child: polygon,
    }),
  );
}

describe("GeoArrowSolidPolygonLayer earcut cancellation", () => {
  it.each([
    "Polygon",
    "MultiPolygon",
  ])("settles a cancelled queued %s task before the shared worker is released", async (type) => {
    const triangles = new Uint32Array([0, 1, 2]);
    const worker = vi.fn(async () => triangles);
    const pool = Pool(async () => worker as unknown as FunctionThread, 1);
    const busy = deferred<void>();
    const blocker = pool.queue(() => busy.promise);
    const layer = makeLayer(pool);
    const queued = nextTaskQueued(pool);
    const result = triangulate(layer, type);
    await queued;
    try {
      await layer.finalizeState({} as never);
      await expect(result).resolves.toBeNull();
      expect(worker).not.toHaveBeenCalled();
    } finally {
      busy.resolve();
      await blocker;
    }
    await expect(triangulate(makeLayer(pool), type)).resolves.toEqual(
      triangles,
    );
    expect(worker).toHaveBeenCalledTimes(1);
  });

  it.each([
    false,
    true,
  ])("ignores a running task after finalization (reject: %s)", async (reject) => {
    const started = deferred<void>();
    const work = deferred<Uint32Array>();
    const pool = Pool(
      async () =>
        (async () => {
          started.resolve();
          return work.promise;
        }) as unknown as FunctionThread,
      1,
    );
    const layer = makeLayer(pool);
    vi.spyOn(layer, "_updateEarcut").mockImplementation(() =>
      triangulate(layer),
    );
    const setState = vi.spyOn(layer, "setState").mockImplementation(() => {});
    const update = layer.updateData();
    await started.promise;
    const settled = pool.settled();
    try {
      await layer.finalizeState({} as never);
      await update;
      expect(setState).not.toHaveBeenCalled();
    } finally {
      if (reject) work.reject(new Error("late worker failure"));
      else work.resolve(new Uint32Array([0, 1, 2]));
      await settled;
    }
    expect(setState).not.toHaveBeenCalled();
  });

  it("settles the update while an owned pool shuts down", async () => {
    const started = deferred<void>();
    const work = deferred<Uint32Array>();
    const pool = Pool(
      async () =>
        (async () => {
          started.resolve();
          return work.promise;
        }) as unknown as FunctionThread,
      1,
    );
    const terminate = vi.spyOn(Thread, "terminate").mockResolvedValue();
    const layer = makeLayer(pool);
    layer.state.ownsEarcutWorkerPool = true;
    const result = triangulate(layer);
    await started.promise;
    const finalized = layer.finalizeState({} as never);
    try {
      await expect(result).resolves.toBeNull();
    } finally {
      work.resolve(new Uint32Array([0, 1, 2]));
      await finalized;
      terminate.mockRestore();
    }
  });

  it("cleans up abort listeners after successful and failed tasks", async () => {
    const error = new Error("worker failure");
    const worker = vi
      .fn()
      .mockResolvedValueOnce(new Uint32Array([0, 1, 2]))
      .mockRejectedValueOnce(error);
    const pool = Pool(async () => worker as unknown as FunctionThread, 1);
    const layer = makeLayer(pool);
    await expect(triangulate(layer)).resolves.toEqual(
      new Uint32Array([0, 1, 2]),
    );
    expect(
      getEventListeners(layer.state.earcutAbortController.signal, "abort"),
    ).toHaveLength(0);
    await expect(triangulate(layer)).rejects.toBe(error);
    expect(
      getEventListeners(layer.state.earcutAbortController.signal, "abort"),
    ).toHaveLength(0);
  });

  it("is not failed by another layer's task", async () => {
    const started = deferred<void>();
    const work = deferred<Uint32Array>();
    const pool = Pool(
      async () =>
        (async () => {
          started.resolve();
          return work.promise;
        }) as unknown as FunctionThread,
      2,
    );
    const result = triangulate(makeLayer(pool));
    await started.promise;
    const error = new Error("another layer failed");
    const failed = pool.queue(() => {
      throw error;
    });
    await expect(Promise.resolve(failed)).rejects.toBe(error);
    work.resolve(new Uint32Array([0, 1, 2]));
    await expect(result).resolves.toEqual(new Uint32Array([0, 1, 2]));
  });

  it("returns immediately for a finalized layer with worker source still pending", async () => {
    const layer = makeLayer();
    const source = deferred<string>();
    layer.state.earcutWorkerRequest = source.promise;
    await layer.finalizeState({} as never);
    try {
      await expect(triangulate(layer)).resolves.toBeNull();
    } finally {
      source.resolve("");
    }
  });

  it("does not update state if finalized during the main-thread fallback", async () => {
    const layer = makeLayer();
    vi.spyOn(layer, "_updateEarcut").mockImplementation(() =>
      triangulate(layer),
    );
    const setState = vi.spyOn(layer, "setState").mockImplementation(() => {});
    const update = layer.updateData();
    await layer.finalizeState({} as never);
    await update;
    expect(setState).not.toHaveBeenCalled();
  });

  it("does not create a pool if finalized while fetching worker source", async () => {
    const layer = makeLayer();
    const source = deferred<string>();
    layer.state.earcutWorkerRequest = source.promise;
    const pool = layer.initEarcutPool();
    await layer.finalizeState({} as never);
    source.resolve("worker source");
    await expect(pool).resolves.toBeNull();
    expect(layer.state.ownsEarcutWorkerPool).toBe(false);
  });

  it("does not set state if finalized after triangulation resolves", async () => {
    const layer = makeLayer();
    vi.spyOn(layer, "_updateEarcut").mockResolvedValue(
      new Uint32Array([0, 1, 2]),
    );
    const setState = vi.spyOn(layer, "setState").mockImplementation(() => {});
    const update = layer.updateData();
    await layer.finalizeState({} as never);
    await update;
    expect(setState).not.toHaveBeenCalled();
  });
});
