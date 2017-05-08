var express          = require("express"),
    app              = express(),
    http             = require("http").Server(app);
    io               = require("socket.io")(http);
    fs               = require("fs"),
    path             = require("path"),
    flash            = require("connect-flash"),
    mkdirp           = require("mkdirp"),
    multer           = require("multer"),
    mongoose         = require("mongoose")
    passport         = require("passport"),
    bodyParser       = require("body-parser"),
    expressSession   = require("express-session"),
    LocalStrategy    = require("passport-local").Strategy,
    User             = require("./models/user"),
    seedDB           = require("./seeds");

// Port for server to listen on
var port = 8080;

// Variable so database knows what file extension profile picture is
var profilePictureExtension;

// Current time in UTC
var currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

mongoose.connect("mongodb://localhost/unilingual");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(flash());
app.use(express.static(__dirname + "/public"));
// Seed DB
seedDB();

// PASSPORT CONFIGURATION
app.use(expressSession({
    secret: "MMM I love me some good garlic bread",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user._id.toString());
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.loginError = req.flash("loginError");
    res.locals.registerError = req.flash("registerError");
    res.locals.globalUserSearchQuery = req.globalUserSearchQuery;
    next();
});

// MULTER CONFIGURATION
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (req.user) {
            var dest = "public/users/" + req.user._id.toString();
        }
        mkdirp(dest, function (err) {
            if (err) cb(err, dest);
            else cb(null, dest);
        });
    },
    filename: function (req, file, cb) {
        if (req.user) {
            cb(null, "profile-picture" + path.extname(file.originalname));
            profilePictureExtension = path.extname(file.originalname);
        }
    },
});

var upload = multer({ storage: storage });

// Passport login LocalStrategy
passport.use("login", new LocalStrategy({
    passReqToCallback : true
}, function(req, username, password, done) {
    // Check in mongo if a user with username exists or not
    User.findOne({"username" : username },
        function(error, user) {
            // In case of any error, return using the done method
            if (error)
                return done(error);
            // User not found
            if (!user){
                console.log(currentTime + " - USER_LOG_IN_ERROR: USERNAME '" + username + "' DOES NOT EXIST");
                return done(null, false,
                    req.flash("loginError", "A user could not be found with the username provided."));
            }
            if (user && user.comparePassword(password)) {
                // User and password both match, login success
                console.log(currentTime + " - USER_LOG_IN_SUCCESS: '" + username + "' LOGGED IN");
                return done(null, user);
            } else {
                // Wrong password
                console.log(currentTime + " - USER_LOG_IN_ERROR: '" + username + "' ENTERED INVALID PASSWORD");
                return done( null, false,
                    req.flash("loginError", "The password is invalid."));
            }
            // User and password both match, login success
            return done(null, user);
        }
    );
}));

passport.use("register", new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        findOrCreateUser = function(){
            // find a user in Mongo with provided username
            User.findOne({"username" : new RegExp('^' + username + '$', "i")}, function(error, user) {
                // In case of any error return
                if (error){
                    console.log(currentTime + " - USER_SIGN_UP_ERROR: " + error);
                    return done(error);
                }
                // already exists
                if (user) {
                    console.log(currentTime + " - USER_SIGN_UP_ERROR: USER '" + username + "' ALREADY EXISTS");
                    return done(null, false,
                        req.flash("registerError", "A user with the username provided already exists."));
                } else {
                    // if there is no user with that email
                    // create the user
                    var newUser = new User();
                    // set the user's local credentials
                    newUser.username = username;
                    newUser.password = password;
                    newUser.email = req.params.email;
                    // save the user
                    newUser.save(function(err) {
                        if (err){
                            console.log(currentTime + " - USER_SIGN_UP_ERROR: COULD NOT SAVE USER - " + err);
                            throw err;
                        }
                        console.log(currentTime + " - USER_SIGN_UP_SUCCESS: NEW USER '" + username + "'");
                        return done(null, newUser);
                    });
                }
            });
        };
    // Delay the execution of findOrCreateUser and execute
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
}));

// GET ROUTE: landing page
app.get("/", function(req, res) {
    res.render("landing");
});

// POST ROUTE: register user
app.post('/register', passport.authenticate('register', {
    successRedirect: '/talk',
    failureRedirect: '/',
    failureFlash : true
}));

// POST ROUTE: login user
app.post('/login', passport.authenticate('login', {
    successRedirect: '/talk',
    failureRedirect: '/',
    failureFlash : true
}));

// POST ROUTE: logout user
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

// GET ROUTE: talk page
app.get("/talk", isLoggedIn, function(req, res) {
    res.render("talk");
});

// POST ROUTE: Search for users to add
app.post("/searchGlobalUsers", function(req, res) {
    var regex = new RegExp(req.body.globalUserSearch, 'i');
    console.log(currentTime + " - GLOBAL_USER_SEARCH: '" + req.user.username + "' SEARCHED FOR '" + req.body.globalUserSearch + "'");
    User.find({username: regex}, function(err, globalUserSearchQuery){
        res.render("talk", {globalUserSearchQuery : globalUserSearchQuery});
    });
});

// POST ROUTE: Upload profile picture
app.post("/uploadProfilePicture", upload.any(), function(req, res) {
    //"public/users/" + req.user._id.toString() + "/profile-picture.png"
    User.findByIdAndUpdate(req.user._id.toString(), { profilePicture: "/users/" + req.user._id.toString() + "/profile-picture" + profilePictureExtension}, { new: true }, function (err) {
        if (err) {
            console.log(err)
        }
        else {
            console.log(currentTime + " - PROFILE_PICTURE_CHANGED: '" + req.user.username + "' UPDATED PROFILE PICTURE");
        }
    });
    res.redirect("/talk");
});

// POST ROUTE: Send friend request
app.post("/addFriend", function(req, res) {
    var pendingIds, friendIds;
    if (req.user.pendingFriends.length > 0) {
        pendingIds = new Array(req.user.pendingFriends.length - 1);
        req.user.pendingFriends.forEach(function (pendingFriend) {
            pendingIds.push(pendingFriend._id);
        })
    }
    if (req.user.friends.length > 0) {
        friendIds = new Array(req.user.friends.length - 1);
        req.user.friends.forEach(function (friend) {
            friendIds.push(friend._id);
        })
    }
    var conditions = {
        $or: [
            {
                $and: [
                    {
                        _id: {
                            $nin: pendingIds
                        }
                    },
                    {
                        _id: {
                            $nin: friendIds
                        }
                    },
                    {
                        username: req.body.globalUserName
                    },
                    {
                        'pendingFriends._id.toString()': {
                            $ne: req.user._id.toString()
                        }
                    },
                    {
                        'friends._id.toString()': {
                            $ne: req.user._id.toString()
                        }
                    }
                ]
            }
        ]
    }
    var update = {
        $push: {
            pendingFriends: {
                _id: req.user._id.toString(),
                username: req.user.username,
                language: req.user.language,
                profilePicture: req.user.profilePicture,
                status: req.user.status
            }
        }
    }

    User.findOneAndUpdate(conditions, update, function(error, doc) {
        if(error) {
            console.log(currentTime + " - FRIEND_REQUEST_SEND_ERROR: '" + req.user.username + "' TRIED TO SEND A FRIEND REQUEST TO '" + req.body.globalUserName + "'");
        }
        else {
            console.log(currentTime + " - FRIEND_REQUEST_SENT: '" + req.user.username + "' SENT A FRIEND REQUEST TO '" + req.body.globalUserName + "'");
        }
        res.redirect("/talk");
    });
});

// POST ROUTE: Accept friend request
app.post("/acceptFriend", function(req, res) {
    var conditionsUserAccepted = {
        username: req.user.username,
        'pendingFriends.username': {$eq: req.body.globalUserName},
        'friends.username': {$ne: req.body.globalUserName}
    }
    var updateUserAccepted = {
        $pull: {
            pendingFriends: {
                _id: req.body.globalUserId.toString(),
                username: req.body.globalUserName,
                language: req.body.globalUserLanguage,
                profilePicture: req.body.globalUserProfilePicture,
                status: req.user.status
            }
        },
        $push: {
            friends: {
                $each:[
                    {
                        _id: req.body.globalUserId.toString(),
                        username: req.body.globalUserName,
                        language: req.body.globalUserLanguage,
                        profilePicture: req.body.globalUserProfilePicture,
                        status: req.user.status
                    }
                ],
                $sort: {
                    username: 1
                }
            }
        }
    }
    User.findOneAndUpdate(conditionsUserAccepted, updateUserAccepted, function(error, doc) {
        if(error) {
            console.log(currentTime + " - FRIEND_REQUEST_ACCEPT_ERROR: '" + req.user.username + "' TRIED TO ACCEPT A FRIEND REQUEST FROM '" + req.body.globalUserName + "'" + " - " + error);
        }
        else {
            console.log(currentTime + " - FRIEND_REQUEST_ACCEPT_SUCCESS: '" + req.user.username + "' ACCEPTED A FRIEND REQUEST FROM '" + req.body.globalUserName + "'");
        }
        var conditionsUserSent = {
            username: req.body.globalUserName
        }
        var updateUserSent = {
            $push: {
                friends: {
                    $each: [
                        {
                            _id: req.user._id.toString(),
                            username: req.user.username,
                            language: req.user.language,
                            profilePicture: req.user.profilePicture,
                            status: req.user.status
                        }
                    ],
                    $sort: {
                        username: 1
                    }
                }
            }
        }
        User.findOneAndUpdate(conditionsUserSent, updateUserSent, function(error, doc) {
            if(error) {
                console.log(currentTime + " - FRIEND_REQUEST_ACCEPT_RETURN_ERROR: '" + req.body.globalUserName + "' TRIED TO RECEIVE AN ACCEPTED FRIEND REQUEST FROM '" + req.user.username + "'"  + " - " + error);
            }
            else {
                console.log(currentTime + " - FRIEND_REQUEST_ACCEPT__RETURN_SUCCESS: '" + req.body.globalUserName + "' RECEIVED AN ACCEPTED FRIEND REQUEST FROM '" + req.user.username + "'");
            }
            res.redirect("/talk");
        });
    });
});

// POST ROUTE: Decline friend request
app.post("/declineFriend", function(req, res) {
    var conditions = {
        username: req.user.username
    }
    var update =  {
        $pull: {
            pendingFriends: {
                _id: req.body.globalUserId
            }
        }
    }
    User.findOneAndUpdate(conditions, update, function(error, doc) {
        if(error) {
            console.log(currentTime + " - FRIEND_REQUEST_DECLINE_ERROR: '" + req.user.username + "' TRIED TO DECLINE A FRIEND REQUEST FROM '" + req.body.globalUserName + "'");
            console.log(error);
        }
        else {
            console.log(currentTime + " - FRIEND_REQUEST_DECLINE_SUCCESS: '" + req.user.username + "' DECLINED A FRIEND REQUEST FROM '" + req.body.globalUserName + "'");
        }
        res.redirect("/talk");
    });
});

// POST ROUTE: Change language
app.post("/changeLanguage", function(req, res) {

});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}

// When socket io receives a connection
var users = {};
io.on('connection', function(socket){
    console.log("A user connected");
    socket.on("login", function(data){
        console.log("User " + data.userId + " connected");
        var conditions = {
            'friends.username': data.userId
        }
        var update = {
            $set: {
                'friends.$.status': 'Online'
            }
        }
        User.findOneAndUpdate(conditions, update, function (error, doc) {
            if(error) {
                console.log(currentTime + " - FRIEND_ONLINE_STATUS_ERROR: '" + data.userId + "' TRIED TO SET STATUS TO ONLINE");
                console.log(error);
            }
            else {
                console.log(currentTime + " - FRIEND_ONLINE_STATUS_SUCCESS: '" + data.userId + "' SET STATUS TO ONLINE");
            }
        });
        var conditions = {
            'username': data.userId
        }
        var update = {
            $set: {
                'status': 'Online'
            }
        }
        User.findOneAndUpdate(conditions, update, function (error, doc) {
            if(error) {
                console.log(currentTime + " - ONLINE_STATUS_ERROR: '" + data.userId + "' TRIED TO SET STATUS TO ONLINE");
                console.log(error);
            }
            else {
                console.log(currentTime + " - ONLINE_STATUS_SUCCESS: '" + data.userId + "' SET STATUS TO ONLINE");
            }
        });
        io.emit("online", data.userId);
        users[data.userId] = socket.id;
        socket.on('disconnect', function () {
            console.log("User " + data.userId + " disconnected");
            var conditions = {
                'friends.username': data.userId
            }
            var update = {
                $set: {
                    'friends.$.status': 'Offline'
                }
            }
            User.findOneAndUpdate(conditions, update, function (error, doc) {
                if(error) {
                    console.log(currentTime + " - FRIEND_OFFLINE_STATUS_ERROR: '" + data.userId + "' TRIED TO SET STATUS TO OFFLINE");
                    console.log(error);
                }
                else {
                    console.log(currentTime + " - FRIEND_OFFLINE_STATUS_SUCCESS: '" + data.userId + "' SET STATUS TO OFFLINE");
                }
            });
            var conditions = {
                'username': data.userId
            }
            var update = {
                $set: {
                    'status': 'Offline'
                }
            }
            User.findOneAndUpdate(conditions, update, function (error, doc) {
                if(error) {
                    console.log(currentTime + " - OFFLINE_STATUS_ERROR: '" + data.userId + "' TRIED TO SET STATUS TO OFFLINE");
                    console.log(error);
                }
                else {
                    console.log(currentTime + " - OFFLINE_STATUS_SUCCESS: '" + data.userId + "' SET STATUS TO OFFLINE");
                }
            });
            io.emit("offline", data.userId);
            delete users[data.userId];
        });
    });
    socket.on("logoff", function(data){
        console.log("User " + data.userId + " disconnected");
        if (data.userId != null) {
            var conditions = {
                'friends.username': data.userId
            }
            var update = {
                $set: {
                    'friends.$.status': 'Offline'
                }
            }
            User.findOneAndUpdate(conditions, update, function (error, doc) {
                if(error) {
                    console.log(currentTime + " - FRIEND_OFFLINE_STATUS_ERROR: '" + data.userId + "' TRIED TO SET STATUS TO OFFLINE");
                    console.log(error);
                }
                else {
                    console.log(currentTime + " - FRIEND_OFFLINE_STATUS_SUCCESS: '" + data.userId + "' SET STATUS TO OFFLINE");
                }
            });
            var conditions = {
                'username': data.userId
            }
            var update = {
                $set: {
                    'status': 'Offline'
                }
            }
            User.findOneAndUpdate(conditions, update, function (error, doc) {
                if(error) {
                    console.log(currentTime + " - OFFLINE_STATUS_ERROR: '" + data.userId + "' TRIED TO SET STATUS TO OFFLINE");
                    console.log(error);
                }
                else {
                    console.log(currentTime + " - OFFLINE_STATUS_SUCCESS: '" + data.userId + "' SET STATUS TO OFFLINE");
                }
            });
            delete users[data.userId];
            io.emit("offline", data.userId);
        }
    });
    socket.on("chat message", function(msg) {
        var roomname;
        if (msg.recipient > msg.sender) {
            roomname = msg.sender + "-" + msg.recipient;
        }
        else {
            roomname = msg.recipient + "-" + msg.sender;
        }

        if (!io.sockets.adapter.sids[users[msg.sender]][roomname]) {
            socket.join(roomname, function(){
                console.log("Joined " + roomname);
                io.in(roomname).emit("chat message", msg);
            });
        } else {
            //Already joined, just send message
            io.in(roomname).emit("chat message", msg);
        }
        var clients = io.sockets.adapter.rooms[roomname].sockets;
        console.log(clients);
    });
});

// Listen on set port
http.listen(port, function() {
    console.log("Server listening on port " + 8080);
});