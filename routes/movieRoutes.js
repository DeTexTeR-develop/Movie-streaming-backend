const express = require('express');
const multer = require('multer');
const { authMiddleware, isAdmin } = require('../middlewares/authmiddleware');
const { createMovie, getMovie, getAllMovies, updateMovies, deleteMovie, uploadMovie } = require('../controllers/movieCtrl');
const router = express.Router();
const storage = require('../config/multerConfig');
const upload = multer({ storage: storage });


router.post("/create-movie", authMiddleware, isAdmin, createMovie);
router.post('/upload/:id', upload.single('video'), uploadMovie);
router.get("/:id", authMiddleware, getMovie);
router.get("/", authMiddleware, getAllMovies);
router.put("/:id", authMiddleware, isAdmin, updateMovies);
router.delete("/:id", authMiddleware, isAdmin, deleteMovie);


module.exports = router;