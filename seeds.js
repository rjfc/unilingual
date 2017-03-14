var mongoose = require("mongoose"),
    User     = require("./models/user");
var data = [
    {
        username: "r1",
        email:  "123@gmail.com",
        password: "123"
    },
    {
        username: "r2",
        email:  "123123@gmail.com",
        password: "123"
    },
    {
        username: "r3",
        email:  "123123123@gmail.com",
        password: "123"
    }
]
function seedDB(){
    // Remove all users
    User.remove({}, function(error) {
        if (error) {
            console.log(error);
        }
        else {
            data.forEach(function(seed) {
                User.create(seed, function(error, user) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log("User created");
                    }
                });
            });
        }
    });
}

module.exports = seedDB;