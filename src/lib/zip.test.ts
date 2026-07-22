import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createZipBuffer } from "@/lib/zip";

describe("createZipBuffer", () => {
  it("creates a ZIP with a readable local file entry", () => {
    const source = Buffer.from("IFTA archive package", "utf8");
    const zip = createZipBuffer([{ name: "summary.txt", data: source, modifiedAt: new Date("2026-01-01T00:00:00Z") }]);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    const nameLength = zip.readUInt16LE(26);
    const extraLength = zip.readUInt16LE(28);
    const compressedSize = zip.readUInt32LE(18);
    const contentStart = 30 + nameLength + extraLength;
    expect(zip.subarray(30, 30 + nameLength).toString("utf8")).toBe("summary.txt");
    expect(inflateRawSync(zip.subarray(contentStart, contentStart + compressedSize))).toEqual(source);
    expect(zip.includes(Buffer.from("PK\u0005\u0006", "binary"))).toBe(true);
  });
});
