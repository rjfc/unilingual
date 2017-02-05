var express  = require("express"),
        app  = express();

// Port for server to listen on
var port = 8080;

// Use ejs
app.set("view engine", "ejs");
// Serve assets location
app.use(express.static(__dirname + "/public"))

// ROUTE: landing page
app.get("/", function(req, res) {
    res.render("landing");
});

// Listen on set port
app.listen(port, function() {
    console.log("Server listening on port " + 8080);
});