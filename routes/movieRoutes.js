const express = require('express');
const { authMiddleware, isAdmin } = require('../middlewares/authmiddleware');
const { createMovie, getMovie, getAllMovies, updateMovies, deleteMovie } = require('../controllers/movieCtrl');
const router = express.Router();

router.post("/create-movie", createMovie);
router.get("/:id", authMiddleware, getMovie);
router.get("/", authMiddleware, getAllMovies);
router.put("/:id", authMiddleware, isAdmin, updateMovies);
router.delete("/:id", authMiddleware, isAdmin, deleteMovie);


module.exports = router;