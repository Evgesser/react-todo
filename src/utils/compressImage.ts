// Compresses an image file in the browser by resizing it to a maximum width.
// Returns a base64-encoded JPEG string.

export async function compressImage(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve(reader.result as string);
                URL.revokeObjectURL(url);
              };
              reader.onerror = (err) => {
                reject(err);
                URL.revokeObjectURL(url);
              };
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Image compression failed')); 
              URL.revokeObjectURL(url);
            }
          },
          'image/jpeg',
          0.8
        );
      } else {
        reject(new Error('Canvas not supported'));
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = (err) => {
      reject(err);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
}
