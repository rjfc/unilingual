var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var messageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: SchemaTypes.ObjectId,
        ref: "User"
    },
},
{
    timestamps: true
});

module.exports = mongoose.model("Message", MessageSchema);