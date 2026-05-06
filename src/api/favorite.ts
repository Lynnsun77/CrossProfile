export type FavoriteRequest = {
  assetId: string;
  favorited: boolean;
};

export type FavoriteResponse = {
  success: boolean;
  assetId: string;
  favorited: boolean;
};

export function buildFavoriteUrl() {
  return '/api/favorite';
}

// Mock POST /api/favorite
export async function postFavorite(req: FavoriteRequest): Promise<FavoriteResponse> {
  void buildFavoriteUrl();
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return { success: true, assetId: req.assetId, favorited: req.favorited };
}

