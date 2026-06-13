// scripts/share.ts
export function generateShareUrl(result: string, question?: string): string {
  const params = new URLSearchParams();
  params.set('result', result);
  if (question) params.set('q', question);
  return `${window.location.origin}/?${params.toString()}`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function shareViaWebAPI(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (navigator.share) {
    return navigator.share(data).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
