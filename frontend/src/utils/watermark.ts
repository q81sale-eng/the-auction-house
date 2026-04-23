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
          const fontSize = Math.round(Math.min(w, h) * 0.045);
          const padding  = Math.round(Math.min(w, h) * 0.03);

          ctx.font         = `italic bold ${fontSize}px Georgia, serif`;
          ctx.textAlign    = 'right';
          ctx.textBaseline = 'bottom';

          // Dark shadow for readability on light backgrounds
          ctx.shadowColor   = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur    = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          // Gold text — bottom-right corner
          ctx.fillStyle = 'rgba(212,175,55,0.80)';
          ctx.fillText('The Auction House', w - padding, h - padding);

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
