import mongoose from 'mongoose';

// This is the new, updated schema
const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], default: 'lost' },
  title: String,
  description: String,
  location: String,
  date: String,
  user: {
    type: mongoose.Schema.Types.ObjectId, // This links to a User's ID
    required: true,
    ref: 'User' // This tells Mongoose the 'user' field refers to the 'User' model
  }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

export default Item;