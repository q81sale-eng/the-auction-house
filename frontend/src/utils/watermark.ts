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

          // Diagonal watermark across the center — always visible regardless of crop
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(-Math.PI / 6); // -30 degrees

          const fontSize = Math.round(Math.min(w, h) * 0.09);
          ctx.font = `italic bold ${fontSize}px Georgia, serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';

          // Shadow for readability on any background
          ctx.shadowColor   = 'rgba(0,0,0,0.55)';
          ctx.shadowBlur    = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.fillStyle = 'rgba(212,175,55,0.45)';
          ctx.fillText('The Auction House', 0, 0);

          ctx.restore();

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
