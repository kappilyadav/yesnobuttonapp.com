// scripts/embed.ts
export function copyEmbedCode(iframeCode: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(iframeCode).then(() => true).catch(() => false);
  }
  return false;
}
