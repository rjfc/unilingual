var express       = require("express"),
    app           = express(),
    mongoose      = require("mongoose"),
    passport      = require("passport"),
    bodyParser    = require("body-parser"),
    LocalStrategy = require("passport-local"),
    User          = require("./models/user");

// Port for server to listen on
var port = 8080;

mongoose.connect("mongodb://localhost/unilingual");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"))

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "I love garlic bread it is so tasty I wish I could eat it for breakfast lunch and dinner",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GET ROUTE: landing page
app.get("/", function(req, res) {
    res.render("landing");
});

// POST ROUTE: register user
app.post("/register", function(req, res) {
    var newUser = new User({username : req.body.username, email: req.body.email});
    User.register(newUser, req.body.password, function(error, user) {
       if (error) {
           console.log(error);
           res.render("landing");
       }
       passport.authenticate("local")(req, res, function() {
          res.redirect("/");
       });
    });
});

// POST ROUTE: login user
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/talk",
        failureRedirect: "/"
    }), function(req, res) {
});

// GET ROUTE: talk page
app.get("/talk", function(req, res) {
    res.render("talk");
});


// Listen on set port
app.listen(port, function() {
    console.log("Server listening on port " + 8080);
});