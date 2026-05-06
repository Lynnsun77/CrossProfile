export type SubscribeBatchRequest = {
  assetIds: string[];
  targets: string[];
};

export type SubscribeBatchResponse = {
  success: boolean;
  results: Array<{
    assetId: string;
    targets: string[];
    success: boolean;
  }>;
};

export function buildSubscribeBatchUrl() {
  return '/api/subscribe/batch';
}

// Mock POST /api/subscribe/batch
export async function postSubscribeBatch(req: SubscribeBatchRequest): Promise<SubscribeBatchResponse> {
  void buildSubscribeBatchUrl();
  await new Promise((resolve) => window.setTimeout(resolve, 260));

  const assetIds = Array.from(new Set(req.assetIds)).filter(Boolean);
  const targets = Array.from(new Set(req.targets)).filter(Boolean);

  return {
    success: true,
    results: assetIds.map((assetId) => ({
      assetId,
      targets,
      success: true,
    })),
  };
}

