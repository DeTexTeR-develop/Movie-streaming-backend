const Movie = require('../models/moviesModel');
const validateMongoId = require('../utils/validateMongoDbid');
const expressAsyncHandler = require('express-async-handler');
const slugify = require('slugify');
const { MongoClient, GridFSBucket } = require('mongodb');
const url = process.env.MONGO_URL;
const fs = require('fs');
const { hasSubscribers } = require('diagnostics_channel');
// const { uploadMovieUrl, getMovieUrl } = require('../utils/s3Movie');


const createMovie = expressAsyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        };
        const movie = await Movie.create(req.body);
        res.json({ movie });
    } catch (err) {
        throw new Error(err);
    }
});
const uploadMovie = expressAsyncHandler(async (req, res) => {
    let client = null;
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const filePath = req.file.path;
        const fileStream = fs.createReadStream(filePath);
        req.file.stream = fileStream;

        client = await MongoClient.connect(url);
        console.log('Connected to MongoDB');

        const db = client.db('videos');
        const bucket = new GridFSBucket(db);

        const filename = req.file.originalname;
        const contentType = req.file.mimetype;

        const uploadStream = bucket.openUploadStream(filename, { contentType });

        console.log(uploadStream);
        uploadStream.on('error', (error) => {
            console.error('Error uploading video:', error);
            res.status(500).send('Internal server error');
        });

        uploadStream.on('finish', () => {
            console.log('Video uploaded successfully!');
            res.status(201).send('Video uploaded');
        });

        req.file.stream.pipe(uploadStream);
    } catch (error) {
        console.error('Error connecting or uploading:', error);
        if (!responseSent) {
            res.status(500).send('Internal server error');
        }
    } finally {
        // Close the MongoDB client
        if (client) {
            await client.close();
        }
    }
});



const getMovie = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoId(id);
    try {
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

module.exports = { createMovie, getMovie, getAllMovies, updateMovies, deleteMovie, uploadMovie };