// src/lib/validateMedia.ts
export function isValidMediaUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const lowerPath = parsedUrl.pathname.toLowerCase();

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mp3'];
    const bannedHosts = ['www.midjourney.com', 'midjourney.com']; // block homepage links

    // Disallow banned hosts
    if (bannedHosts.includes(parsedUrl.hostname)) return false;

    // Only allow valid file extensions
    return validExtensions.some(ext => lowerPath.endsWith(ext));
  } catch (err) {
    return false;
  }
}
