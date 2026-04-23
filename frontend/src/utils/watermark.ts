export const applyWatermark = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.onload = () => {
        const wmH     = Math.max(Math.min(img.height * 0.10, 110), 50);
        const ratio   = logo.width / logo.height;
        const wmW     = wmH * ratio;
        const pad     = wmH * 0.35;
        const stripH  = wmH + pad * 2;
        const x       = (img.width - wmW) / 2;
        const y       = img.height - wmH - pad;

        // dark semi-transparent strip at the bottom
        ctx.fillStyle = 'rgba(10, 10, 10, 0.45)';
        ctx.fillRect(0, img.height - stripH, img.width, stripH);

        // logo centered in strip
        ctx.globalAlpha = 0.92;
        ctx.drawImage(logo, x, y, wmW, wmH);
        ctx.globalAlpha = 1;

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          b => b ? resolve(b) : reject(new Error('toBlob failed')),
          mime, 0.92,
        );
      };

      logo.onerror = () => {
        // logo missing — upload without watermark
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          b => b ? resolve(b) : reject(new Error('toBlob failed')),
          mime, 0.92,
        );
      };

      logo.src = '/watermark-logo.png.jpeg';
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
