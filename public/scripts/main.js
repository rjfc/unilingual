var loginDiv = localStorage.getItem("loginDiv");
var addFriendDiv = localStorage.getItem("addFriendDiv");

// Function to check for a valid email
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    return pattern.test(emailAddress);
}

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

// Show error when log in form fields are empty
$("#log-in-form").submit(function(event) {

    if ($("#log-in-username-input").val().trim() == "") {
        $("#log-in-error").html("The username field is empty.");
        event.preventDefault();
    }
    else if ($("#log-in-password-input").val() == "") {
        $("#log-in-error").html("The password field is empty.");
        event.preventDefault();
    }
    localStorage.setItem("loginDiv", "closed");
});

// Show error when sign up form fields are empty
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
