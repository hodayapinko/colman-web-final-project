import { buildPostText, splitIntoChunks } from "../embedding";

describe("embedding text preparation", () => {
  describe("buildPostText", () => {
    it("builds text from title/rating/location/content", () => {
      const text = buildPostText({
        title: "Amazing Hotel",
        location: "Paris",
        rating: 5,
        content: "Great stay, very clean rooms.",
      });

      expect(text).toContain("Title: Amazing Hotel");
      expect(text).toContain("Location: Paris");
      expect(text).toContain("Rating: 5 / 5");
      expect(text).toContain("Content: Great stay, very clean rooms.");
    });

    it("does not include unrelated fields even if present", () => {
      const text = buildPostText({
        title: "My Review",
        location: "Rome",
        rating: 4,
        content: "Nice view.",
        image: "SHOULD_NOT_APPEAR",
      } as any);

      expect(text).not.toContain("SHOULD_NOT_APPEAR");
      expect(text).toContain("Title: My Review");
    });

    it("handles missing optional fields", () => {
      const text = buildPostText({
        title: undefined as any,
        content: "Solid experience.",
        location: undefined,
        rating: undefined,
      });

      expect(text).toBe("Content: Solid experience.");
    });
  });

  describe("splitIntoChunks", () => {
    it("returns a single chunk for short text", () => {
      const chunks = splitIntoChunks("short");
      expect(chunks).toEqual(["short"]);
    });
  });
});
