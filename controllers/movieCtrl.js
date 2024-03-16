const Movie = require('../models/moviesModel');
const validateMongoId = require('../utils/validateMongoDbid');
const expressAsyncHandler = require('express-async-handler');
const slugify = require('slugify');


const createMovie = expressAsyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        };
        const movie = await Movie.create(req.body);
        res.json(movie);
    } catch (err) {
        throw new Error(err);
    }
});

module.exports = { createMovie };