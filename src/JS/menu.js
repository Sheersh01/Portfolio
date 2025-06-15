document.addEventListener('DOMContentLoaded', function(){
const toggleButton = document.querySelector('.toggle');
let isOpen = false;
const timeline = gsap.timeline({ paused: true });
timeline.to('.website-content',{
    duration:2,
    ease:"power4.inOut",
    clipPath:"polygon(50% 50% ,50% 50% ,50% 50% ,50% 50%",
    scale:0.5
});
timeline.to(".row",{
    duration:3,
    left:"0%",
    ease:"power4.inOut",
    stagger:0.1,
},"-=2.5");

toggleButton.addEventListener('click', function() {
    if (isOpen) {
        timeline.reverse();
    } else {
        timeline.play();
    }
    isOpen = !isOpen;
})
});
