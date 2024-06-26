const { S3Client } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.sS3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
});


module.exports = { s3Client };