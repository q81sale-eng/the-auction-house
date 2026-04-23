export const applyWatermark = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark dimensions
      const stripH = Math.max(img.height * 0.07, 40);
      const fontSize = Math.round(stripH * 0.45);

      // White semi-transparent strip at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.fillRect(0, img.height - stripH, img.width, stripH);

      // Gold separator line at top of strip
      ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
      ctx.fillRect(0, img.height - stripH, img.width, 2);

      // Text: "The Auction House"
      ctx.font = `${fontSize}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(30, 20, 5, 0.85)';
      ctx.fillText('The Auction House', img.width / 2, img.height - stripH / 2);

      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('toBlob failed')),
        mime, 0.92,
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
