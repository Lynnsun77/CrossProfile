export type GapRequestPayload = {
  title: string;
  description: string;
  context?: Record<string, unknown>;
};

export type GapRequestResponse = {
  success: boolean;
  requestId: string;
};

// Mock POST /api/gap-request
export async function postGapRequest(payload: GapRequestPayload): Promise<GapRequestResponse> {
  void payload;
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return {
    success: true,
    requestId: `gap_${Math.random().toString(16).slice(2, 8)}`,
  };
}

