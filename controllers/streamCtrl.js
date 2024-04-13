// const express = require("express");
// const app = express();
// const fs = require("fs");
// const mongodb = require('mongodb');

// Sorry about this monstrosity

app.get("/mongo-video", function (req, res) {
    mongodb.MongoClient.connect(url, function (error, client) {
        if (error) {
            res.status(500).json(error);
            return;
        }

        const range = req.headers.range;
        if (!range) {
            res.status(400).send("Requires Range header");
        }

        const db = client.db('videos');
        // GridFS Collection
        db.collection('fs.files').findOne({}, (err, video) => {
            if (!video) {
                res.status(404).send("No video uploaded!");
                return;
            }

            // Create response headers
            const videoSize = video.length;
            const start = Number(range.replace(/\D/g, ""));
            const end = videoSize - 1;

            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };

            // HTTP Status 206 for Partial Content
            res.writeHead(206, headers);

            const bucket = new mongodb.GridFSBucket(db);
            const downloadStream = bucket.openDownloadStreamByName('bigbuck', {
                start
            });

            // Finally pipe video to response
            downloadStream.pipe(res);
        });
    });
});

app.listen(8000, function () {
    console.log("Listening on port 8000!");
});









const multer = require('multer');
const path = require('path');

// Define storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // Specify the destination directory for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Rename the uploaded file if needed
    }
});

// Initialize multer with disk storage
const upload = multer({ storage: storage }).single('video');

app.post('/upload-video', function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            res.status(400).json({ error: "Multer error occurred." });
        } else if (err) {
            // An unknown error occurred when uploading.
            res.status(500).json({ error: "An error occurred while uploading." });
        } else {
            // Everything went fine, get the file path and upload it to MongoDB
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded." });
                return;
            }

            mongodb.MongoClient.connect(url, function (error, client) {
                if (error) {
                    res.status(500).json({ error: "Failed to connect to MongoDB." });
                    return;
                }
                const db = client.db('videos');
                const bucket = new mongodb.GridFSBucket(db);
                const videoUploadStream = bucket.openUploadStream('uploaded_video', {
                    contentType: req.file.mimetype // Specify the content type of the file
                });

                // Pipe the file stream to MongoDB
                const fileStream = fs.createReadStream(req.file.path);
                fileStream.pipe(videoUploadStream);

                videoUploadStream.on('error', function (error) {
                    res.status(500).json({ error: "Failed to upload video to MongoDB." });
                });

                videoUploadStream.on('finish', function () {
                    res.status(200).json({ message: "Video uploaded successfully." });
                });
            });
        }
    });
});
