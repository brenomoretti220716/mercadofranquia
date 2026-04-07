import { MulterFile } from 'src/modules/upload/dto/multer';

export const validateImageFile = (file: unknown): file is MulterFile => {
  if (!file || typeof file !== 'object') return false;

  const multerFile = file as MulterFile;

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const maxSize = 5 * 1024 * 1024;

  return (
    typeof multerFile.mimetype === 'string' &&
    typeof multerFile.size === 'number' &&
    allowedTypes.includes(multerFile.mimetype) &&
    multerFile.size <= maxSize
  );
};
