var express          = require("express"),
    app              = express(),
    flash            = require("connect-flash"),
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
app.use(express.static(__dirname + "/public"))

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
app.use(function(req,res,next) {
    res.locals.loginError = req.flash("loginError");
    res.locals.registerError = req.flash("registerError");
    next();
});
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
            User.findOne({"username" : username},function(error, user) {
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
                    newUser.email = req.param("email");
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
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash : true
}));

// POST ROUTE: login user
app.post('/login', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash : true
}));

// GET ROUTE: talk page
app.get("/talk", function(req, res) {
    res.render("talk");
});


// Listen on set port
app.listen(port, function() {
    console.log("Server listening on port " + 8080);
});