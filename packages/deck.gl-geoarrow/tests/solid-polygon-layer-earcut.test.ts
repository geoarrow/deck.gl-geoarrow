import * as ga from "@geoarrow/geoarrow-js";
import * as arrow from "apache-arrow";
import type { FunctionThread } from "threads";
import { Pool } from "threads";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeoArrowSolidPolygonLayer } from "../src/layers/solid-polygon-layer.js";
import * as utils from "../src/utils/utils.js";

vi.mock("@geoarrow/geoarrow-js", async (importOriginal) => {
  const actual = await importOriginal<typeof ga>();
  return {
    ...actual,
    worker: {
      ...actual.worker,
      preparePostMessage: vi.fn(actual.worker.preparePostMessage),
    },
  };
});

vi.mock("../src/utils/utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof utils>();
  return {
    ...actual,
    getInterleavedPolygon: vi.fn(actual.getInterleavedPolygon),
  };
});

// A unit square as a single closed ring
const xs = [0, 1, 1, 0, 0];
const ys = [0, 0, 1, 1, 0];

function makeCoords(separated: boolean): arrow.Data {
  const float = new arrow.Float64();
  if (separated) {
    return arrow.makeData({
      type: new arrow.Struct([
        new arrow.Field("x", float),
        new arrow.Field("y", float),
      ]),
      length: xs.length,
      children: [
        arrow.makeData({ type: float, data: new Float64Array(xs) }),
        arrow.makeData({ type: float, data: new Float64Array(ys) }),
      ],
    });
  }
  return arrow.makeData({
    type: new arrow.FixedSizeList(2, new arrow.Field("xy", float)),
    length: xs.length,
    child: arrow.makeData({
      type: float,
      data: new Float64Array(xs.flatMap((x, i) => [x, ys[i]])),
    }),
  });
}

function makeList(child: arrow.Data, name: string): arrow.Data {
  return arrow.makeData({
    type: new arrow.List(new arrow.Field(name, child.type)),
    length: 1,
    valueOffsets: new Int32Array([0, child.length]),
    child,
  });
}

function makePolygonData(separated: boolean) {
  const rings = makeList(makeCoords(separated), "vertices");
  return makeList(rings, "rings") as ga.data.PolygonData;
}

function makeMultiPolygonData(separated: boolean) {
  const polygons = makePolygonData(separated);
  return makeList(polygons, "polygons") as ga.data.MultiPolygonData;
}

const expectedTriangles = ga.algorithm.earcut(makePolygonData(false));

// In-process stand-in for the earcut worker: clone the payload as postMessage
// would, rehydrate it, and triangulate.
async function earcutWorker(message: { send: ga.data.PolygonData }) {
  const polygonData = ga.worker.rehydrateData(structuredClone(message.send));
  return ga.algorithm.earcut(polygonData);
}

const pools: Pool<FunctionThread>[] = [];
const blockedWorkers: Array<() => void> = [];

function createPool(size: number): Pool<FunctionThread> {
  const pool = Pool(
    async () => earcutWorker as unknown as FunctionThread,
    size,
  );
  pools.push(pool);
  return pool;
}

/** Occupy one worker until the returned function is called. */
function blockWorker(pool: Pool<FunctionThread>): () => void {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  pool.queue(() => blocked);
  blockedWorkers.push(release);
  return release;
}

function nextTaskQueued(pool: Pool<FunctionThread>): Promise<void> {
  return new Promise((resolve) => {
    const subscription = pool.events().subscribe((event) => {
      if (event.type === Pool.EventType.taskQueued) {
        subscription.unsubscribe();
        resolve();
      }
    });
  });
}

function createLayer(pool: Pool<FunctionThread>) {
  const layer = new GeoArrowSolidPolygonLayer({
    id: "test-layer",
    data: null as never,
    earcutWorkerUrl: null,
    earcutWorkerPool: pool,
  });
  layer.initializeState({} as never);
  return layer;
}

describe.each([
  { geometry: "Polygon", coords: "interleaved" },
  { geometry: "Polygon", coords: "separated" },
  { geometry: "MultiPolygon", coords: "interleaved" },
  { geometry: "MultiPolygon", coords: "separated" },
])("$geometry earcut with $coords coordinates", ({ geometry, coords }) => {
  const separated = coords === "separated";

  function triangulate(layer: GeoArrowSolidPolygonLayer) {
    return geometry === "Polygon"
      ? layer._earcutPolygonData(makePolygonData(separated))
      : layer._earcutMultiPolygonData(makeMultiPolygonData(separated));
  }

  afterEach(async () => {
    for (const release of blockedWorkers.splice(0)) {
      release();
    }
    await Promise.all(pools.splice(0).map((pool) => pool.completed(true)));
    vi.mocked(ga.worker.preparePostMessage).mockClear();
    vi.mocked(utils.getInterleavedPolygon).mockClear();
  });

  it("prepares geometry only once a worker picks up the task", async () => {
    const pool = createPool(1);
    const releaseWorker = blockWorker(pool);
    const layerTaskQueued = nextTaskQueued(pool);

    const result = triangulate(createLayer(pool));
    await layerTaskQueued;

    expect(utils.getInterleavedPolygon).not.toHaveBeenCalled();
    expect(ga.worker.preparePostMessage).not.toHaveBeenCalled();

    releaseWorker();
    await expect(result).resolves.toEqual(expectedTriangles);
    expect(utils.getInterleavedPolygon).toHaveBeenCalledTimes(
      separated ? 1 : 0,
    );
    expect(ga.worker.preparePostMessage).toHaveBeenCalledOnce();
  });

  it("resolves with its own result while other pool tasks are running", async () => {
    const pool = createPool(2);
    blockWorker(pool);

    await expect(triangulate(createLayer(pool))).resolves.toEqual(
      expectedTriangles,
    );
  });
});
