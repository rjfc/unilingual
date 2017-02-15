var loginDiv = localStorage.getItem("loginDiv");

// Function to check for a valid email
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    return pattern.test(emailAddress);
};

// Open login popup and dark overlay on button click
$("#log-in-button").click(function(){
    localStorage.setItem("loginDiv", "opened");
    $(".log-in-popup-wrapper").show();
    $("#log-in-email-input").focus();
})

// Close login popup and dark overlay on dark overlay click or popup close click
$(".dark-overlay, a[href='#close-log-in-popup']").click(function(){
    localStorage.setItem("loginDiv", "closed");
    $(".log-in-popup-wrapper").hide();
})

// Show div on refresh
if(loginDiv == "opened"){
    $(".log-in-popup-wrapper").show();
    $("#log-in-email-input").focus();
}
else {
    $(".log-in-popup-wrapper").hide();
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
});
