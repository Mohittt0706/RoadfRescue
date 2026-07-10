import multer from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = join(process.cwd(), 'uploads', 'profile');

// Ensure upload directory exists
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4().substring(0, 8)}`;
    cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isMatch = allowedTypes.test(file.mimetype) || allowedTypes.test(extname(file.originalname).toLowerCase());

  if (isMatch) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, jpeg, png, gif, webp) are allowed!'), false);
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
