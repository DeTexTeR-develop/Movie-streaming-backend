const Movie = require('../models/moviesModel');
const validateMongoId = require('../utils/validateMongoDbid');
const expressAsyncHandler = require('express-async-handler');
const slugify = require('slugify');
const { MongoClient, GridFSBucket } = require('mongodb');
const url = process.env.MONGO_URL;
const fs = require('fs');
const uuid = require('uuid')
const { hasSubscribers } = require('diagnostics_channel');
const path = require('path');
const { exec } = require('child_process');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.sS3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
});

const s3 = new AWS.S3();

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
    const { id } = req.params;
    const chapterId = id; // Generate a unique chapter ID
    const videoPath = req.file.path;
    const outputDir = `public/videos/${chapterId}`;
    const outputFileName = 'output.m3u8';
    const outputPath = path.join(outputDir, outputFileName);

    // Check if output directory exists, create if not
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Command to convert video to HLS format using ffmpeg
    const command = `ffmpeg -i ${videoPath} \
        -map 0:v -c:v libx264 -crf 23 -preset medium -g 48 \
        -map 0:v -c:v libx264 -crf 28 -preset fast -g 48 \
        -map 0:v -c:v libx264 -crf 32 -preset fast -g 48 \
        -map 0:a -c:a aac -b:a 128k \
        -hls_time 10 -hls_playlist_type vod \
        -hls_flags independent_segments -report \
        -f hls ${outputPath}`

    // Execute ffmpeg command
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`ffmpeg exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to convert video to HLS format' });
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        try {
            const files = fs.readdirSync(outputDir);
            for (const file of files) {
                const filePath = path.join(outputDir, file);
                const fileContent = fs.readFileSync(filePath);

                const params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: `${chapterId}/${file}`, // File path in the S3 bucket
                    Body: fileContent,
                    ContentType: 'application/vnd.apple.mpegurl' // Content type for .m3u8 files
                };
                await s3.upload(params).promise();
            }
            const videoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${chapterId}/${outputFileName}`;
            const movie = await Movie.findByIdAndUpdate(id, { movieStreamUrl: videoUrl });
            res.json({ success: true, message: 'Video uploaded and converted to HLS.', movie });
        } catch (uploadError) {
            console.error(`S3 upload error: ${uploadError}`);
            res.status(500).json({ error: 'Failed to upload video to S3' });
        }
    });
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