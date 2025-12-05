import mongoose from 'mongoose';

// schema requires data, content type, and owner
const imageSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true },
);

const Image = mongoose.model('Image', imageSchema);

export default Image;
