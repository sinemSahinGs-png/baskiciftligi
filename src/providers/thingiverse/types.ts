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
  license_url?: string;
  description?: string;
  like_count?: number;
  collect_count?: number;
  is_private?: boolean;
  is_nsfw?: boolean;
  file_count?: number;
  files_url?: string;
  tags?: Array<string | { name?: string }>;
  categories?: Array<string | { name?: string }>;
}

export interface ThingiverseFile {
  id?: number;
  name?: string;
  size?: number;
  url?: string;
  public_url?: string;
  download_url?: string;
  direct_url?: string;
  thumbnail?: string;
  formatted_size?: string;
  date?: string;
}

export interface ThingiverseClientError {
  status: number;
  message: string;
}
