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

    //when the cursor moves, draw. it takes the funciton 'draw' as a callback.
    canvas.on("mousemove", draw);

    canvas.on("mouseup", () => {
        // console.log("canvas[0]", canvas[0]);
        isDrawing = false; //stops drawing on mouseup
        signatureString = canvas[0].toDataURL();
        hidden.val(signatureString);
        // console.log("signatureString:", signatureString); // shows long string value
        //targets hidden input field and assing signaturestring to be the value
        //toDataURL is a canvas method returning a data URL that has a representation of the image.
    });

    canvas.on("mouseout", () => (isDrawing = false));
})();

// EVENT HANDLER FOR HOMEPAGE TRANSITION
$(document).ready(() => {
    var info = $(".about-container");

    setTimeout(() => {
        info.fadeIn();
    }, 2000);
})();
