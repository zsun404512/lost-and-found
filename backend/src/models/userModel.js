import mongoose from "mongoose";

// schema utilizes email and password
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;