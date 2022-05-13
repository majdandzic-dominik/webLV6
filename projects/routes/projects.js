var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

//Any requests to this controller must pass through this 'use' function
//Copy and pasted from method-override
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}))

//build the REST operations at the base for projects
//this will be accessible from http://127.0.0.1:3000/projects if the default route for / is left unchanged
router.route('/')
    //GET all projects
    .get(function (req, res, next) {
        //retrieve all projects from Monogo
        mongoose.model('Project').find({}, function (err, projects) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.format({
                    //HTML response will render the index.jade file in the views/projects folder. We are also setting "projects" to be an accessible variable in our jade view
                    html: function () {
                        res.render('projects/index', {
                            title: 'All my Projects',
                            "projects": projects
                        });
                    },
                    //JSON response will show all projects in JSON format
                    json: function () {
                        res.json(projects);
                    }
                });
            }
        });
    })
    //POST a new project
    .post(function (req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var description = req.body.description;
        var price = req.body.price;
        var finished_jobs = req.body.finished_jobs;
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;

        //call the create function for our database
        mongoose.model('Project').create({
            name: name,
            description: description,
            price: price,
            finished_jobs: finished_jobs,
            start_date: start_date,
            end_date: end_date,
            members: []
        }, function (err, project) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Project has been created
                console.log('POST creating new project: ' + project);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function () {
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("projects");
                        // And forward to success page
                        res.redirect("/projects");
                    },
                    //JSON response will show the newly created project
                    json: function () {
                        res.json(project);
                    }
                });
            }
        })
    });

/* GET New Project page. */
router.get('/new', function (req, res) {
    res.render('projects/new', { title: 'Add New Project' });
});

// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Project').findById(id, function (err, project) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function () {
                    next(err);
                },
                json: function () {
                    res.json({ message: err.status + ' ' + err });
                }
            });
            //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            console.log(project);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
        }
    });
});

router.route('/:id')
    .get(function (req, res) {
        mongoose.model('Project').findById(req.id, function (err, project) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                console.log('GET Retrieving ID: ' + project._id);
                var start_date = project.start_date.toISOString();
                var end_date = project.end_date.toISOString();
                start_date = start_date.substring(0, start_date.indexOf('T'))
                end_date = end_date.substring(0, end_date.indexOf('T'))

                res.format({
                    html: function () {
                        res.render('projects/show', {
                            "start_date": start_date,
                            "end_date": end_date,
                            "project": project
                        });
                    },
                    json: function () {
                        res.json(project);
                    }
                });
            }
        });
    });

router.route('/:id/edit')
    //GET the individual project by Mongo ID
    .get(function (req, res) {
        //search for the project within Mongo
        mongoose.model('Project').findById(req.id, function (err, project) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                //Return the project
                console.log('GET Retrieving ID: ' + project._id);
                var start_date = project.start_date.toISOString();
                var end_date = project.end_date.toISOString();
                start_date = start_date.substring(0, start_date.indexOf('T'))
                end_date = end_date.substring(0, end_date.indexOf('T'))
                res.format({
                    //HTML response will render the 'edit.jade' template
                    html: function () {
                        res.render('projects/edit', {
                            title: 'Project' + project._id,
                            "start_date": start_date,
                            "end_date": end_date,
                            "project": project
                        });
                    },
                    //JSON response will return the JSON output
                    json: function () {
                        res.json(project);
                    }
                });
            }
        });
    })
    //PUT to update a project by ID
    .put(function (req, res) {
        // Get our REST or form values. These rely on the "name" attributes
        var name = req.body.name;
        var description = req.body.description;
        var price = req.body.price;
        var finished_jobs = req.body.finished_jobs;
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;

        //find the document by ID
        mongoose.model('Project').findById(req.id, function (err, project) {
            //update it
            project.update({
                name: name,
                description: description,
                price: price,
                finished_jobs: finished_jobs,
                start_date: start_date,
                end_date: end_date
            }, function (err, projectID) {
                if (err) {
                    res.send("There was a problem updating the information to the database: " + err);
                }
                else {
                    //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                    res.format({
                        html: function () {
                            res.redirect("/projects/" + project._id);
                        },
                        //JSON responds showing the updated values
                        json: function () {
                            res.json(project);
                        }
                    });
                }
            })
        });
    })
    //DELETE a Project by ID
    .delete(function (req, res) {
        //find project by ID
        mongoose.model('Project').findById(req.id, function (err, project) {
            if (err) {
                return console.error(err);
            } else {
                //remove it from Mongo
                project.remove(function (err, project) {
                    if (err) {
                        return console.error(err);
                    } else {
                        //Returning success messages saying it was deleted
                        console.log('DELETE removing ID: ' + project._id);
                        res.format({
                            //HTML returns us back to the main page, or you can create a success page
                            html: function () {
                                res.redirect("/projects");
                            },
                            //JSON returns the item with the message that is has been deleted
                            json: function () {
                                res.json({
                                    message: 'deleted',
                                    item: project
                                });
                            }
                        });
                    }
                });
            }
        });
    });


router.route('/:id/member')
    //GET the individual project by Mongo ID
    .get(function (req, res) {
        //search for the project within Mongo
        mongoose.model('Project').findById(req.id, function (err, project) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                //Return the project
                console.log('GET Retrieving ID: ' + project._id);
                res.format({
                    //HTML response will render the 'add_member_to_project.jade' template
                    html: function () {
                        res.render('projects/add_member_to_project', {
                            title: 'Add member to project' + project._id,
                            "project": project
                        });
                    },
                    //JSON response will return the JSON output
                    json: function () {
                        res.json(project);
                    }
                });
            }
        });
    })
    //POST a new member
    .post(function (req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var surname = req.body.surname;

        //search for the project within Mongo
        mongoose.model('Project').findById(req.id, function (err, project) {

            //push new member to the member array in project
            var members = project.members;
            members.push({
                name: name,
                surname: surname
            });

            //update project
            project.update({
                members: members
            }, function (err, projectID) {
                if (err) {
                    res.send("There was a problem updating the information to the database: " + err);
                }
                else {
                    //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                    res.format({
                        html: function () {
                            res.redirect("/projects/" + project._id);
                        },
                        //JSON responds showing the updated values
                        json: function () {
                            res.json(project);
                        }
                    });
                }
            })
        });            
    });

module.exports = router;