import {
  addUtcMonths,
  normalizeCourseCode,
  normalizeMatchKey,
  parseSourceDate,
} from "./normalizers";

describe("parseSourceDate", () => {
  it.each([
    ["2026-10-01", "2026-10-01"],
    ["1. 10. 2026", "2026-10-01"],
    ["01.10.2026", "2026-10-01"],
    ["43552", "2019-03-28"],
  ])("parses %s", (raw, expected) => {
    const parsed = parseSourceDate(raw);

    expect(parsed.kind).toBe("value");
    if (parsed.kind === "value") {
      expect(parsed.value.toISOString().slice(0, 10)).toBe(expected);
    }
  });

  it("rejects an impossible calendar date", () => {
    expect(parseSourceDate("31. 9. 2026")).toEqual({ kind: "invalid" });
  });
});

describe("normalization", () => {
  it("normalizes safe course code variants", () => {
    expect(normalizeCourseCode(" bozp_z ")).toBe("BOZP-Z");
  });

  it("normalizes Czech text only for matching", () => {
    expect(normalizeMatchKey("  SPRÁVA   BUDOV ")).toBe("sprava budov");
  });

  it("keeps month-end arithmetic deterministic", () => {
    const result = addUtcMonths(new Date(Date.UTC(2024, 0, 31)), 1);
    expect(result.toISOString().slice(0, 10)).toBe("2024-02-29");
  });
});
