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

          // Draw original image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Watermark strip at bottom
          const stripH = Math.max(Math.round(canvas.height * 0.07), 36);
          const fontSize = Math.round(stripH * 0.50);
          const y = canvas.height - stripH;

          // White semi-transparent background
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.fillRect(0, y, canvas.width, stripH);

          // Gold top line
          ctx.fillStyle = '#D4AF37';
          ctx.fillRect(0, y, canvas.width, 2);

          // Text
          ctx.font         = `italic ${fontSize}px Georgia, serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle    = '#1a1005';
          ctx.fillText('The Auction House', canvas.width / 2, y + stripH / 2);

          // Use toDataURL (works in all browsers including Safari)
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
