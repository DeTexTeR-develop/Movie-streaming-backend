const express = require('express');
const { authMiddleware, isAdmin } = require('../middlewares/authmiddleware');
const { createMovie } = require('../controllers/movieCtrl');
const router = express.Router();

router.post("/create-movie", authMiddleware, isAdmin, createMovie);


module.exports = router;