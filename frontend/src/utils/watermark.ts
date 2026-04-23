export const applyWatermark = (file: File): Promise<Blob> =>
  new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth  || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }

        ctx.drawImage(img, 0, 0);

        const h      = Math.max(canvas.height * 0.07, 36);
        const fs     = Math.round(h * 0.48);
        const y      = canvas.height - h;

        // white strip
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(0, y, canvas.width, h);

        // gold top border
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(0, y, canvas.width, 2);

        // text
        ctx.font         = `italic ${fs}px Georgia, "Times New Roman", serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#1a1005';
        ctx.fillText('The Auction House', canvas.width / 2, y + h / 2);

        canvas.toBlob(
          blob => resolve(blob ?? file),
          'image/jpeg',
          0.93,
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);

    const reader = new FileReader();
    reader.onload = e => { img.src = e.target?.result as string; };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
