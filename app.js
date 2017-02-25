var express          = require("express"),
    app              = express(),
    path             = require("path"),
    flash            = require("connect-flash"),
    mkdirp           = require("mkdirp"),
    multer           = require("multer"),
    mongoose         = require("mongoose"),
    passport         = require("passport"),
    bodyParser       = require("body-parser"),
    expressSession   = require("express-session"),
    LocalStrategy    = require("passport-local").Strategy,
    User             = require("./models/user");

// Port for server to listen on
var port = 8080;

mongoose.connect("mongodb://localhost/unilingual");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(flash());
app.use(express.static(__dirname + "/public"));

// PASSPORT CONFIGURATION
app.use(expressSession({secret: "MMM I love me some good garlic bread"}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user._id);
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
        //var code = JSON.parse(req.body.model).empCode;
        var dest = "public/images/profile-pictures";
        mkdirp(dest, function (err) {
            console.log(dest);
            if (err) cb(err, dest);
            else cb(null, dest);
        });
    },
    filename: function (req, file, cb) {
        if (req.user) {
            cb(null, req.user._id + path.extname(file.originalname));
        }
    }
});

var upload = multer({ storage: storage });

// Passport login LocalStrategy
passport.use("login", new LocalStrategy({
    passReqToCallback : true
}, function(req, username, password, done) {
    // check in mongo if a user with username exists or not
    User.findOne({"username" : username },
        function(error, user) {
            // In case of any error, return using the done method
            if (error)
                return done(error);
            // Username does not exist, log error & redirect back
            if (!user){
                console.log("USER_LOG_IN_ERROR: USERNAME '" + username + "' DOES NOT EXIST");
                return done(null, false,
                    req.flash("loginError", "A user could not be found with the username provided."));
            }
            /*// User exists but wrong password, log the error
            if (!user.validPassword(password)){
                console.log('Invalid Password');
                return done( null, false, req.flash('message', 'Invalid Password') );
            }
            // User and password both match, return user from
            // done method which will be treated like success
            return done(null, user);*/
            if (user && user.comparePassword(password)) {
                // user found, password is correct. do what you want to do
                return done(null, user);
            } else {
                // user not found or wrong password.
                console.log("USER_LOG_IN_ERROR: '" + username + "' ENTERED INVALID PASSWORD");
                return done( null, false, req.flash("loginError", "The password is invalid."));
            }
            // User and password both match, return user from
            // done method which will be treated like success
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
                    console.log("USER_SIGN_UP_ERROR: " + error);
                    return done(error);
                }
                // already exists
                if (user) {
                    console.log("USER_SIGN_UP_ERROR: USER '" + username + "' ALREADY EXISTS");
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
                            console.log("USER_SIGN_UP_ERROR: COULD NOT SAVE USER - " + err);
                            throw err;
                        }
                        console.log("USER_SIGN_UP_SUCCESS: NEW USER '" + username + "'");
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
    console.log("GLOBAL_USER_SEARCH: " + req.body.globalUserSearch);
    User.find({username: regex}, function(err, globalUserSearchQuery){
        res.render("talk", {globalUserSearchQuery : globalUserSearchQuery});
    });
});

// POST ROUTE: Upload profile picture
app.post("/uploadProfilePicture", upload.any(), function(req, res) {
    console.log(req.body);
    res.send(req.files);
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}


// Listen on set port
app.listen(port, function() {
    console.log("Server listening on port " + 8080);
});