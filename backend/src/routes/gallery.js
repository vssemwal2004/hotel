import express from 'express';
import Gallery from '../models/Gallery.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all gallery images (public)
router.get('/', async (req, res) => {
  try {
    const images = await Gallery.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ message: 'Error fetching gallery images', error: error.message });
  }
});

// Get single gallery image
router.get('/:id', async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.json(image);
  } catch (error) {
    console.error('Error fetching gallery image:', error);
    res.status(500).json({ message: 'Error fetching image', error: error.message });
  }
});

// Upload/Add gallery image (Admin only)
router.post('/', authRequired, adminRequired, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { title, description, order } = req.body;

    // Validate order
    const orderNum = parseInt(order);
    if (!orderNum || orderNum < 1 || orderNum > 8) {
      return res.status(400).json({ message: 'Order must be between 1 and 8' });
    }

    // Check if order already exists
    const existingImage = await Gallery.findOne({ order: orderNum });
    if (existingImage) {
      return res.status(400).json({ 
        message: `Position ${orderNum} is already occupied. Please choose a different position or update the existing image.` 
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname, 'gallery');

    // Create gallery entry
    const galleryImage = new Gallery({
      title: title || 'Gallery Image',
      description: description || '',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      order: orderNum,
      isActive: true
    });

    await galleryImage.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: galleryImage
    });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Update gallery image (Admin only)
router.put('/:id', authRequired, adminRequired, upload.single('image'), async (req, res) => {
  try {
    const { title, description, order, isActive } = req.body;
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Update text fields
    if (title) image.title = title;
    if (description !== undefined) image.description = description;
    if (isActive !== undefined) image.isActive = isActive === 'true' || isActive === true;

    // Update order if provided
    if (order) {
      const orderNum = parseInt(order);
      if (orderNum < 1 || orderNum > 8) {
        return res.status(400).json({ message: 'Order must be between 1 and 8' });
      }
      
      // Check if new order conflicts with another image
      if (orderNum !== image.order) {
        const conflictImage = await Gallery.findOne({ order: orderNum, _id: { $ne: image._id } });
        if (conflictImage) {
          return res.status(400).json({ 
            message: `Position ${orderNum} is already occupied. Please choose a different position.` 
          });
        }
        image.order = orderNum;
      }
    }

    // If new image file is provided, upload and replace
    if (req.file) {
      // Delete old image from Cloudinary
      if (image.publicId) {
        await deleteFromCloudinary(image.publicId);
      }

      // Upload new image
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname, 'gallery');
      image.imageUrl = uploadResult.secure_url;
      image.publicId = uploadResult.public_id;
    }

    await image.save();

    res.json({
      message: 'Image updated successfully',
      image
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ message: 'Error updating image', error: error.message });
  }
});

// Delete gallery image (Admin only)
router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }

    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

// Reorder gallery images (Admin only)
router.post('/reorder', authRequired, adminRequired, async (req, res) => {
  try {
    const { images } = req.body; // Array of { id, order }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Invalid images array' });
    }

    // Update all images with new order
    const updatePromises = images.map(({ id, order }) => 
      Gallery.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Gallery reordered successfully' });
  } catch (error) {
    console.error('Error reordering gallery:', error);
    res.status(500).json({ message: 'Error reordering gallery', error: error.message });
  }
});

export default router;
