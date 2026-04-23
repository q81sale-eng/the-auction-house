export const applyWatermark = (file: File): Promise<Blob> =>
  new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth  || img.width;
        const h2 = img.naturalHeight || img.height;
        if (!w || !h2) { console.warn('[WM] image has no dimensions'); resolve(file); return; }
        canvas.width  = w;
        canvas.height = h2;
        const ctx = canvas.getContext('2d');
        if (!ctx) { console.warn('[WM] no canvas context'); resolve(file); return; }

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
          blob => {
            if (!blob) { console.warn('[WM] toBlob returned null'); resolve(file); return; }
            console.log('[WM] watermark applied, blob size:', blob.size);
            resolve(blob);
          },
          'image/jpeg',
          0.93,
        );
      } catch (err) {
        console.warn('[WM] error:', err);
        resolve(file);
      }
    };

    img.onerror = (e) => { console.warn('[WM] img load error', e); resolve(file); };

    const reader = new FileReader();
    reader.onload = e => { img.src = e.target?.result as string; };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
