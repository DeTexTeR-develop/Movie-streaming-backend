const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/S3config');
const expressAsyncHandler = require('express-async-handler');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const getMovieUrl = expressAsyncHandler(async (key) => {
    const command = new GetObjectCommand({
        Bucket: 'movie-private-streaming',
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command);
    return url;
});
const uploadMovieUrl = expressAsyncHandler(async (filename, contentType) => {
    const command = new PutObjectCommand({
        Bucket: 'movie-private-streaming',
        Key: `/uploads/user-uploads/${filename}`,
        ContentType: contentType
    })
    const url = await getSignedUrl(s3Client, command, { expiresIn: 120 });
    return url;
});

module.exports = { uploadMovieUrl, getMovieUrl };
