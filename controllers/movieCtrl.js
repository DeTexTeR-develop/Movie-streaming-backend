const Movie = require('../models/moviesModel');
const validateMongoId = require('../utils/validateMongoDbid');
const expressAsyncHandler = require('express-async-handler');
const slugify = require('slugify');
const { uploadMovieUrl, getMovieUrl } = require('../utils/s3Movie');


const createMovie = expressAsyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        };
        const movie = await Movie.create(req.body);
        const urlToUpload = await uploadMovieUrl(movie.id, req.body.fileType);
        res.json({ movie, url: urlToUpload });
    } catch (err) {
        throw new Error(err);
    }
});

const getMovie = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    try {
        const streamingUrl = await getMovieUrl(`/uploads/user-uploads/${id}`);
        const linkMovie = await Movie.findByIdAndUpdate(id, { movieStreamUrl: streamingUrl }, { new: true });
        const movie = await Movie.findById(id);
        res.json(movie);
    } catch (err) {
        throw new Error(err);
    }
});




const getAllMovies = expressAsyncHandler(async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies)
    } catch (err) {
        throw new Error(err);
    }
});

const updateMovies = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    try {
        const movie = await Movie.findByIdAndUpdate(id, req.body, {
            new: true
        })
        res.json({ message: "movie updated", movie });
    } catch (err) {
        throw new Error(err);
    }
});

const deleteMovie = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    try {
        const movie = await Movie.findByIdAndDelete(id);
        res.json({ message: "movie deleted successfully", movie });
    } catch (err) {
        throw new Error(err);
    }
})

module.exports = { createMovie, getMovie, getAllMovies, updateMovies, deleteMovie };