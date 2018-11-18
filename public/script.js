// SIGNATURE / CANVAS DRAWING

(function canvas() {
    var canvas = $("#canvas");
    var c = document.querySelector("canvas").getContext("2d");
    var hidden = $("#hidden");
    var signatureString = "";

    c.lineJoin = "round";
    c.lineCap = "round";
    c.lineWidth = 2;
    c.strokeStyle = "#000000";

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function draw(e) {
        if (!isDrawing) return;

        c.beginPath();
        c.moveTo(lastX, lastY);
        c.lineTo(e.offsetX, e.offsetY);
        c.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    canvas.on("mousedown", e => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.on("mousemove", draw);

    canvas.on("mouseup", () => {
        isDrawing = false;
        signatureString = canvas[0].toDataURL();
        hidden.val(signatureString);
    });

    canvas.on("mouseout", () => (isDrawing = false));
})();



// EVENT HANDLERS

// make info container appear after dog translates
$(document).ready(function() {
    var info = $('.about-container');

    setTimeout(function(){
        info.fadeIn();
    }, 2000);
})();

// show password feature in LOGIN
// function myFunction() {
//     var x = document.getElementById("myInput");
//     if (x.type === "password") {
//         x.type = "text";
//     } else {
//         x.type = "password";
//     }
// }
