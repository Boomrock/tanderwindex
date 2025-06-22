// Утилита для генерации SVG градиентных заглушек
export function generateGradientPlaceholder(seed?: string): string {
  // Используем seed для консистентности градиентов для одного тендера
  const hash = seed ? hashString(seed) : Math.random();
  
  const gradients = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ffecd2', '#fcb69f'],
    ['#ff9a9e', '#fecfef'],
    ['#a18cd1', '#fbc2eb'],
    ['#fad0c4', '#ffd1ff'],
    ['#84fab0', '#8fd3f4'],
    ['#cfd9df', '#e2ebf0'],
    ['#667db6', '#0082c8'],
    ['#f12711', '#f5af19'],
    ['#667eea', '#764ba2']
  ];

  const gradientIndex = Math.floor(hash * gradients.length);
  const [color1, color2] = gradients[gradientIndex];
  
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      <circle cx="120" cy="80" r="30" fill="rgba(255,255,255,0.1)" />
      <circle cx="300" cy="200" r="50" fill="rgba(255,255,255,0.05)" />
      <polygon points="200,150 250,100 300,150 250,200" fill="rgba(255,255,255,0.08)" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

export function getImageUrl(images: string[] | string | null, fallbackSeed?: string): string {
  if (!images) {
    return generateGradientPlaceholder(fallbackSeed);
  }
  
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : generateGradientPlaceholder(fallbackSeed);
    } catch {
      return images || generateGradientPlaceholder(fallbackSeed);
    }
  }
  
  if (Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  
  return generateGradientPlaceholder(fallbackSeed);
}