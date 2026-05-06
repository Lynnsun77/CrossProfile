export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function mockDispatch(): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: '任务已成功派发' };
}

export async function mockExport(): Promise<{ success: boolean; url: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, url: '#mock-export-url' };
}
