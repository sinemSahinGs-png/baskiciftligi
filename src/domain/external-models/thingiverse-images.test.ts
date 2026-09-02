import { describe, expect, it } from "vitest";

import {
  collectThingiverseGalleryCandidates,
  hasUsableThingiverseThumbnail,
  isThingiversePlaceholderImageUrl,
  normalizeThingiverseImageUrl,
  selectThingiverseDisplayUrl,
  thingiverseImageIdentity,
} from "@/domain/external-models/thingiverse-images";

describe("thingiverse-images", () => {
  it("removes placeholder logo URLs", () => {
    expect(
      isThingiversePlaceholderImageUrl(
        "https://cdn.thingiverse.com/site/img/thingiverse_logo.png",
      ),
    ).toBe(true);
    expect(
      normalizeThingiverseImageUrl(
        "https://cdn.thingiverse.com/site/img/thingiverse_logo.png",
      ),
    ).toBeNull();
  });

  it("normalizes protocol and rejects unsupported hosts", () => {
    expect(
      normalizeThingiverseImageUrl(
        "//cdn.thingiverse.com/assets/ab/cd/file/display_large.jpg",
      ),
    ).toBe("https://cdn.thingiverse.com/assets/ab/cd/file/display_large.jpg");
    expect(normalizeThingiverseImageUrl("https://evil.example/x.jpg")).toBeNull();
    expect(normalizeThingiverseImageUrl("")).toBeNull();
  });

  it("collapses duplicate resize variants into one gallery image", () => {
    const base = "https://cdn.thingiverse.com/assets/ab/cd/model/display_large.jpg";
    const medium = "https://cdn.thingiverse.com/assets/ab/cd/model/display_medium.jpg";
    const candidates = collectThingiverseGalleryCandidates({
      thumbnailUrl: base,
      imageUrls: [medium, base],
    });
    expect(candidates).toHaveLength(1);
  });

  it("deduplicates by image id when provided", () => {
    const candidates = collectThingiverseGalleryCandidates({
      imageMeta: [
        { id: 42, url: "https://cdn.thingiverse.com/assets/a/display_large.jpg" },
        { id: 42, url: "https://cdn.thingiverse.com/assets/a/display_thumb.jpg" },
      ],
    });
    expect(candidates).toHaveLength(1);
  });

  it("uses image identity without resize params", () => {
    const a = thingiverseImageIdentity(
      "https://cdn.thingiverse.com/assets/x/display_large.jpg",
    );
    const b = thingiverseImageIdentity(
      "https://cdn.thingiverse.com/assets/x/display_medium.jpg",
    );
    expect(a).toBe(b);
  });

  it("selects smaller variants for cards and thumbs", () => {
    const url = "https://cdn.thingiverse.com/assets/x/display_large.jpg";
    expect(selectThingiverseDisplayUrl(url, "card")).toContain("display_medium");
    expect(selectThingiverseDisplayUrl(url, "thumb")).toContain("display_thumb");
    expect(
      selectThingiverseDisplayUrl(
        "https://cdn.thingiverse.com/assets/x/display_medium.jpg",
        "card",
      ),
    ).toContain("display_medium.jpg");
    expect(
      selectThingiverseDisplayUrl(
        "https://cdn.thingiverse.com/assets/x/display_medium.jpg",
        "card",
      ),
    ).not.toContain("display_mediumium");
  });

  it("reports usable discovery thumbnails", () => {
    expect(
      hasUsableThingiverseThumbnail(
        "https://cdn.thingiverse.com/assets/x/display_medium.jpg",
      ),
    ).toBe(true);
    expect(
      hasUsableThingiverseThumbnail(
        "https://cdn.thingiverse.com/site/img/thingiverse_logo.png",
      ),
    ).toBe(false);
  });

  it("returns empty gallery when all candidates invalid", () => {
    expect(
      collectThingiverseGalleryCandidates({
        thumbnailUrl: "https://cdn.thingiverse.com/site/img/thingiverse_logo.png",
        imageUrls: ["", "not-a-url"],
      }),
    ).toEqual([]);
  });
});
