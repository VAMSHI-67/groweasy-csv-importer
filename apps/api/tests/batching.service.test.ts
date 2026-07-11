import { describe, it, expect } from "vitest";
import { splitIntoBatches } from "../src/services/batching.service";

describe("batching.service", () => {
  it("should split rows into correct batch sizes", () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const batches = splitIntoBatches(rows, 20);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(20);
    expect(batches[1]).toHaveLength(20);
    expect(batches[2]).toHaveLength(10);
  });

  it("should return empty array for empty input", () => {
    const batches = splitIntoBatches([], 20);
    expect(batches).toHaveLength(0);
  });

  it("should return single batch when rows < batch size", () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    const batches = splitIntoBatches(rows, 20);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(5);
  });

  it("should handle exact multiple of batch size", () => {
    const rows = Array.from({ length: 40 }, (_, i) => ({ id: i }));
    const batches = splitIntoBatches(rows, 20);

    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(20);
    expect(batches[1]).toHaveLength(20);
  });

  it("should handle single row", () => {
    const rows = [{ id: 1 }];
    const batches = splitIntoBatches(rows, 20);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
  });

  it("should handle batch size of 1", () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    const batches = splitIntoBatches(rows, 1);

    expect(batches).toHaveLength(3);
    batches.forEach((batch) => expect(batch).toHaveLength(1));
  });
});
