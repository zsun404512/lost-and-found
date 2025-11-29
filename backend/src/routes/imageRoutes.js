import express from 'express';
import Image from '../models/imageModel.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).end();
    }

    res.set('Content-Type', image.contentType);
    return res.send(image.data);
  } catch (err) {
    // Avoid leaking details; just report generic failure
    return res.status(500).end();
  }
});

export default router;
