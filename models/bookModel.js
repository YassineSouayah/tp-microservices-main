const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: String,
    description: String,
});

const tvShows = mongoose.model('book', bookSchema);

module.exports = tvShows;