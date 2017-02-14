var express        = require("express"),
    app            = express(),
    flash          = require("connect-flash"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    bodyParser     = require("body-parser"),
    expressSession = require("express-session"),
    LocalStrategy  = require("passport-local").Strategy,
    User           = require("./models/user");
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
    res.locals.error = req.flash("error");
    next();
});
// Passport login LocalStrategy
passport.use("login", new LocalStrategy({
    passReqToCallback : true
}, function(req, username, password, done) {
    // check in mongo if a user with username exists or not
    User.findOne({"username" : username },
        function(err, user) {
            // In case of any error, return using the done method
            if (err)
                return done(err);
            // Username does not exist, log error & redirect back
            if (!user){
                console.log("User Not Found with username " + username);
                return done(null, false,
                    req.flash("error", "User Not found."));
            }
            /*// User exists but wrong password, log the error
            if (!user.validPassword(password)){
                console.log('Invalid Password');
                return done( null, false, req.flash('message', 'Invalid Password') );
            }
            // User and password both match, return user from
            // done method which will be treated like success
            return done(null, user);*/
            if ( user && user.comparePassword( password ) ) {
                // user found, password is correct. do what you want to do
                return done(null, user);
            } else {
                // user not found or wrong password.
                console.log("Invalid Password");
                return done( null, false, req.flash("error", "Invalid Password"));
            }
            // User and password both match, return user from
            // done method which will be treated like success
            return done(null, user);
        }
    );
}));

passport.use("signup", new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        findOrCreateUser = function(){
            // find a user in Mongo with provided username
            User.findOne({"username" : username},function(err, user) {
                // In case of any error return
                if (err){
                    console.log("Error in SignUp: " + err);
                    return done(err);
                }
                // already exists
                if (user) {
                    console.log("User already exists");
                    return done(null, false,
                        req.flash("error", "User Already Exists"));
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
                            console.log("Error in Saving user: " + err);
                            throw err;
                        }
                        console.log("User registration successful");
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
app.post('/register', passport.authenticate('signup', {
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