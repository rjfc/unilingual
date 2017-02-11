var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    email:  String,
    password: String,
    friends: [this]
});
UserSchema.methods.validPassword = function (pwd) {
    return (this.password === pwd);
}

module.exports = mongoose.model("User", UserSchema);