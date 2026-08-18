export interface ThingiverseUser {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
}

export interface ThingiverseImage {
  url?: string;
}

export interface ThingiverseThing {
  id?: number;
  name?: string;
  public_url?: string;
  url?: string;
  thumbnail?: string;
  default_image?: { url?: string };
  creator?: ThingiverseUser;
  license?: string;
  description?: string;
  like_count?: number;
  is_nsfw?: boolean;
}

export interface ThingiverseClientError {
  status: number;
  message: string;
}
