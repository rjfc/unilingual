var loginDiv = localStorage.getItem("loginDiv");
var addFriendDiv = localStorage.getItem("addFriendDiv");

// Function to check for a valid email
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    return pattern.test(emailAddress);
}

// Submit profile picture form on image choose
$("#profile-picture-upload-image-input").change(function() {
    $("#form-upload-profile-picture").submit();
});

// Open user profile popup and dark overlay on button click
$("#current-user-profile-picture").click(function(){
    $(".profile-picture-popup-wrapper").show();
});

// Open login popup and dark overlay on button click
$("#log-in-button").click(function(){
    localStorage.setItem("loginDiv", "opened");
    $(".log-in-popup-wrapper").show();
    $("#log-in-email-input").focus();
});

// Open add friend popup and dark overlay on button click
$("#add-friend-button").click(function(){
    localStorage.setItem("addFriendDiv", "opened");
    $(".add-friend-popup-wrapper").show();
    $("#add-friend-search-input").focus();
});

// Close login popup and dark overlay on dark overlay click or popup close click
$(".dark-overlay, a[href='#close-log-in-popup']").click(function(){
    localStorage.setItem("loginDiv", "closed");
    $(".log-in-popup-wrapper").hide();
});

// Close add friend popup and dark overlay on dark overlay click or popup close click
$(".dark-overlay, a[href='#close-add-friend-popup']").click(function(){
    localStorage.setItem("addFriendDiv", "closed");
    $(".add-friend-popup-wrapper").hide();
});

// Close add friend popup and dark overlay on dark overlay click or popup close click
$(".dark-overlay, a[href='#close-profile-picture-popup']").click(function(){
    $(".profile-picture-popup-wrapper").hide();
});

// Show login div on refresh
if(loginDiv == "opened"){
    $(".log-in-popup-wrapper").show();
    $("#log-in-email-input").focus();
}
else {
    $(".log-in-popup-wrapper").hide();
}

// Show add friend div on refresh
if(addFriendDiv == "opened"){
    $(".add-friend-popup-wrapper").show();
    $("#add-friend-search-input").focus();
}
else {
    $(".add-friend-popup-wrapper").hide();
}

// Show error when log in form fields have error
$("#log-in-form").submit(function(event) {
    if ($("#log-in-username-input").val().trim() == "") {
        $("#log-in-error").html("The username field is empty.");
        event.preventDefault();
        localStorage.setItem("loginDiv", "closed");
    }
    else if ($("#log-in-password-input").val() == "") {
        $("#log-in-error").html("The password field is empty.");
        event.preventDefault();
        localStorage.setItem("loginDiv", "closed");
    }
});

// Show error when sign up form fields have error
$("#sign-up-form").submit(function( event ) {
    if ($("#sign-up-username-input").val().trim() == "") {
        $("#sign-up-error").html("The username field is empty.");
        event.preventDefault();
    }
    else if ($("#sign-up-email-input").val().trim() == "") {
        $("#sign-up-error").html("The email field is empty.");
        event.preventDefault();
    }
    else if ($("#sign-up-password-input").val() == "") {
        $("#sign-up-error").html("The password field is empty.");
        event.preventDefault();
    }
    else if (!isValidEmailAddress($("#sign-up-email-input").val())) {
        $("#sign-up-error").html("The email provided is invalid.");
        event.preventDefault();
    }
    else if (!$('#checkbox-agree-tos-pp').prop("checked")) {
        $("#sign-up-error").html("You must agree to the Terms of Service and Privacy Policy.");
        event.preventDefault();
    }
});

// Make new line on ctrl + enter or shift + enter, but submit form when enter pressed
$(".chat-message-input").keypress(function(event) {
    if (event.keyCode == 13 && !event.shiftKey) {
        $("#form-send-message").submit(); //Submit your form here
        return false;
    }
});

// Allows user to open individual chats
$(".friend").click(function() {
    $(this).find(".friend-backboard").css("background-color", "#cce5d2");
    var currentChatId = localStorage.getItem("currentChatId");
    $(".friend[data-userid='" + currentChatId + "'] > .friend-backboard").css("background-color", "");
    $(".chat-div[data-userid='" + currentChatId + "']").hide();
    var friendId = $(this).attr("data-userid");
    $(".chat-div[data-userid='" + friendId + "']").show();
    localStorage.setItem("currentChatId", friendId);
});

//---SOCKET.IO---//
$(function() {
    var socket = io();
    $("#form-send-message").submit(function() {
        socket.emit("chat message", $(".chat-message-input").val());
        $(".chat-message-input").val("");
        return false;
    });
    socket.on("chat message", function(message) {
        $(".chat-history-div").append($("<li>").text(message));
    });
});