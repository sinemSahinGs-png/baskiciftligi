import { createBinaryStlCube } from "@/domain/manufacturing/mesh";
import type { ThingiverseFile, ThingiverseThing } from "@/providers/thingiverse/types";

const FIXTURE_IMAGE =
  "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg";

const ccByThing: ThingiverseThing = {
  id: 1001,
  name: "20 mm kalibrasyon küpü",
  public_url: "https://www.thingiverse.com/thing:1001",
  thumbnail: FIXTURE_IMAGE,
  creator: { name: "fixture-ada" },
  license: "Creative Commons - Attribution",
  description: "CI fikstürü. Canlı API değildir.",
  like_count: 12,
  collect_count: 3,
  file_count: 1,
  is_nsfw: false,
};

const ncThing: ThingiverseThing = {
  id: 2002,
  name: "Ticari olmayan vazo",
  public_url: "https://www.thingiverse.com/thing:2002",
  thumbnail: FIXTURE_IMAGE,
  creator: { name: "fixture-leo" },
  license: "Creative Commons - Attribution - Non-Commercial",
  description: "Lisans reddi fikstürü.",
  like_count: 4,
  file_count: 1,
  is_nsfw: false,
};

const detail1587568: ThingiverseThing = {
  id: 1587568,
  name: "Low Poly Vase",
  public_url: "https://www.thingiverse.com/thing:1587568",
  thumbnail: FIXTURE_IMAGE,
  creator: { name: "fixture-vase" },
  license: "Creative Commons - Attribution",
  description: "Production regression fixture for single-image API shape.",
  like_count: 120,
  collect_count: 40,
  file_count: 1,
  is_nsfw: false,
};

const detail50204: ThingiverseThing = {
  id: 50204,
  name: "Telefon tutucu",
  public_url: "https://www.thingiverse.com/thing:50204",
  thumbnail: FIXTURE_IMAGE,
  creator: { name: "fixture-phone" },
  license: "Creative Commons - Attribution",
  description: "Mobile regression fixture.",
  like_count: 8,
  file_count: 1,
  is_nsfw: false,
};

const benchyThing: ThingiverseThing = {
  id: 763622,
  name: "#3DBenchy - The jolly 3D printing torture-test",
  public_url: "https://www.thingiverse.com/thing:763622",
  thumbnail: FIXTURE_IMAGE,
  creator: { name: "fixture-benchy" },
  license: "Creative Commons - Attribution",
  description: "Benchy regression fixture.",
  like_count: 5000,
  file_count: 1,
  is_nsfw: false,
};

const filesByThing: Record<string, ThingiverseFile[]> = {
  "1001": [
    {
      id: 11,
      name: "cube.stl",
      size: 684,
      download_url: "https://api.thingiverse.com/files/11",
      direct_url: "https://cdn.thingiverse.com/fixtures/cube.stl",
      formatted_size: "684 B",
    },
  ],
  "2002": [
    {
      id: 22,
      name: "vase.stl",
      size: 684,
      download_url: "https://api.thingiverse.com/files/22",
      formatted_size: "684 B",
    },
  ],
  "1587568": [
    {
      id: 158,
      name: "Low_Poly_Vase.stl",
      size: 2048,
      download_url: "https://api.thingiverse.com/files/158",
      formatted_size: "2 KB",
    },
  ],
  "50204": [
    {
      id: 502,
      name: "phone_stand.stl",
      size: 1024,
      download_url: "https://api.thingiverse.com/files/502",
      formatted_size: "1 KB",
    },
  ],
};

export async function loadThingiverseFixture<T>(path: string): Promise<T> {
  if (path.startsWith("/popular") || path.startsWith("/search/")) {
    return [ccByThing, ncThing, benchyThing] as T;
  }
  if (path === "/things/1001") {
    return ccByThing as T;
  }
  if (path === "/things/2002") {
    return ncThing as T;
  }
  if (path === "/things/1587568") {
    return detail1587568 as T;
  }
  if (path === "/things/50204") {
    return detail50204 as T;
  }
  if (path === "/things/763622") {
    return benchyThing as T;
  }
  if (path === "/things/401001" || path === "/things/403001") {
    throw Object.assign(new Error("Thingiverse kimliği reddedildi."), {
      status: path.endsWith("401001") ? 401 : 403,
    });
  }
  if (path === "/things/429001") {
    throw Object.assign(new Error("Thingiverse hız sınırı."), { status: 429 });
  }
  if (path === "/things/500001") {
    throw Object.assign(new Error("Thingiverse yanıtı 500."), { status: 500 });
  }
  if (path === "/things/504001") {
    throw Object.assign(new Error("Thingiverse zaman aşımı."), { status: 504 });
  }
  if (path.endsWith("/images")) {
    const thingId = path.match(/^\/things\/(\d+)\/images$/)?.[1];
    if (thingId === "1587568") {
      return {
        id: 501,
        url: "https://cdn.thingiverse.com/assets/fixture/ab/cd/vase/display_large.jpg",
      } as T;
    }
    if (thingId === "1001") {
      return [
        { id: 1, url: "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_large.jpg" },
        { id: 1, url: "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg" },
        { id: 2, url: "https://cdn.thingiverse.com/site/img/thingiverse_logo.png" },
      ] as T;
    }
    return [{ id: 99, url: FIXTURE_IMAGE }] as T;
  }
  if (path === "/things/1001/files") {
    return filesByThing["1001"] as T;
  }
  if (path === "/things/2002/files") {
    return filesByThing["2002"] as T;
  }
  if (path === "/things/1587568/files") {
    return filesByThing["1587568"] as T;
  }
  if (path === "/things/50204/files") {
    return filesByThing["50204"] as T;
  }
  if (path.startsWith("/things/")) {
    const error = new Error("Thingiverse kaydı yok veya kaldırılmış.");
    (error as Error & { status: number }).status = 404;
    throw Object.assign(error, { name: "ThingiverseApiError" });
  }
  return [] as T;
}

export async function loadThingiverseFileFixture(downloadUrl: string) {
  void downloadUrl;
  return {
    bytes: createBinaryStlCube(20),
    contentType: "model/stl",
    finalUrl: downloadUrl,
  };
}
