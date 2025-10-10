/*
		Designed by: Jarlan Perez
		Original image: https://www.artstation.com/artwork/VdBllN

*/


const h = document.querySelector("#h");
const b = document.body;

let base = (e) => {
    var x = e.pageX / window.innerWidth - 0.5;
    var y = e.pageY / window.innerHeight - 0.5;
    h.style.transform = `
        perspective(90vw)
        rotateX(${ y * 4  + 75}deg)
        rotateZ(${ -x * 12  + 45}deg)
        translateZ(-9vw)
    `;
}
/* Navigation link to make Tablet Clickable navigate to Tablet Menu*/
function navToTablet() {
    window.location.href = "file:///C:/Users/barbr/OneDrive/Desktop/coding%202022/BarbrickDesign/city-3d/3d-roompure-css/mobile-menu-css-only/dist/index.html#";
}

/* Navigation link to make door Clickable navigate to city */
function navToCity() {
    window.location.href = "file:///C:/Users/barbr/OneDrive/Desktop/coding%202022/BarbrickDesign/city-3d/dist/index.html";
}

b.addEventListener("pointermove", base);