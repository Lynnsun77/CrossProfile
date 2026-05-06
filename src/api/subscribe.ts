export type SubscribeTarget = {
  key: string;
  label: string;
};

export type SubscribeRequest = {
  assetId: string;
  targets: string[];
};

export type SubscribeResponse = {
  success: boolean;
  assetId: string;
  targets: string[];
};

export function buildSubscribeUrl() {
  return '/api/subscribe';
}

// Mock POST /api/subscribe
export async function postSubscribe(req: SubscribeRequest): Promise<SubscribeResponse> {
  void buildSubscribeUrl();
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  return { success: true, assetId: req.assetId, targets: req.targets };
}

