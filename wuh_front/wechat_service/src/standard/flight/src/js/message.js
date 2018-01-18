$(function () {
    var token = sessionStorage.getItem('token');
    var getAllValidMsg = {
        url: '<%= apiBase %>msg/getAllValidMsg?token=' + token,
        data: {
            msgModule: "FLIGHT"
        },
        success: function (data) {
            console.log(data);
        }
    };
    ajaxBase(getAllValidMsg, false);
});