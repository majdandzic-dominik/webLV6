var mongoose = require('mongoose');

var projectSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    finished_jobs: String,
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, default: Date.now },
    members: [{
        name: String,
        surname: String
    }]
});

mongoose.model('Project', projectSchema);