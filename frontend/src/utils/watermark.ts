const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

export const applyWatermark = (file: File): Promise<Blob> =>
  new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (ev) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth  || 800;
          canvas.height = img.naturalHeight || 600;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(file); return; }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const w = canvas.width;
          const h = canvas.height;

          // Bottom strip watermark
          const stripH   = Math.max(Math.round(h * 0.07), 32);
          const fontSize  = Math.round(stripH * 0.52);
          const y         = h - stripH;

          // Semi-transparent white background strip
          ctx.fillStyle = 'rgba(255,255,255,0.82)';
          ctx.fillRect(0, y, w, stripH);

          // Gold top border line
          ctx.fillStyle = '#D4AF37';
          ctx.fillRect(0, y, w, 2);

          // Text
          ctx.font         = `italic bold ${fontSize}px Georgia, serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle    = '#1a1005';
          ctx.fillText('The Auction House', w / 2, y + stripH / 2);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.93);
          resolve(dataUrlToBlob(dataUrl));

        } catch (err) {
          console.warn('[WM] error:', err);
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = ev.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
