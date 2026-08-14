export function compressImageBlob(image: Blob, maxWidth = 600, maxHeight = 600, quality = 0.6) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo preparar la imagen.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Imagen invalida.'));
      }
    };

    reader.readAsDataURL(image);
  });
}

export function compressImageFile(file: File, maxWidth = 600, maxHeight = 600, quality = 0.6) {
  return compressImageBlob(file, maxWidth, maxHeight, quality);
}
