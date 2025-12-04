import multer from 'multer';
import path from 'path';

// Configure storage for multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Files will be saved in the 'uploads/' directory at the root of your project
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // Create a unique filename to prevent overwriting files with the same name
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Create the multer upload instance with the storage configuration
const upload = multer({
  storage,
  // Optional: You can add file filter validation here if needed
});

export default upload;

