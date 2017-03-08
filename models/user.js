var bcrypt   = require("bcryptjs"),
    mongoose = require("mongoose");

// store this funciton in some helper file, instead of storing it in this User Model.
var hash_password = function(password) {
    var salt = bcrypt.genSaltSync(); // enter number of rounds, default: 10
    var hash = bcrypt.hashSync( password, salt );
    return hash;
},
UserSchema = new mongoose.Schema({
    username: String,
    email:  String,
    password: String,
    language: { type: String, default: "English" },
    profilePicture: { type: String, default: "/images/talk/blank-profile-picture.png" },
    pendingFriends: [this],
    friends: [this]
})

UserSchema.methods.comparePassword = function(password) {
    if (!this.password) { return false; }
    return bcrypt.compareSync( password, this.password );
};

UserSchema.pre('save', function(next) {
    // check if password is present and is modified.
    if ( this.password && this.isModified('password') ) {
        this.password = hash_password(this.password);
    }
    next();
});


module.exports = mongoose.model("User", UserSchema);