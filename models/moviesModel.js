const mongoose = require('mongoose');
const { Schema } = mongoose;

const movieSchema = new Schema({
    title: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: String,
    releaseDate: {
        type: Date,
        required: true
    },
    moviePoster: {
        type: String,
        required: true,
        unique: true
    },
    movieStreamUrl: String,
    rating: [{
        star: {
            type: Number,
            min: 0,
            max: 5
        },
        comment: String,
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    Duration: Number,
    Language: String,
    actors: [String]
});

module.exports = mongoose.model('Movie', movieSchema);
