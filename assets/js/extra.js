
$(document).ready(function () {

    var url = document.location.toString();
    if (url.match('#')) {
        $('.nav-tabs a[href="#' + url.split('#')[1] + '"]').tab('show');
    }

    // Change hash for page-reload
    $('.nav-tabs a').on('shown.bs.tab', function (e) {
        history.pushState(null,null,e.target.hash);
        if(e.target.hash === '#discussion'){
            var ifr = document.getElementById('discourse-embed-frame');
            ifr.src = ifr.src;
        }
    })
});
