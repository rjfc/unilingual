$("#log-in-button").click(function(){
    $(".log-in-popup-wrapper").show();
    $("#log-in-email-input").focus();
})

$(".dark-overlay, a[href='#close-log-in-popup']").click(function(){
    $(".log-in-popup-wrapper").hide();
})
