import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import SplitType from "split-type";
gsap.registerPlugin(ScrambleTextPlugin);

function nav() {
    const toggleButton = document.querySelector(".burger"); // Open menu button
    const overlay = document.querySelector(".overlay"); // Menu overlay
    const subNav = document.querySelector(".sub-nav"); // Sub-navigation container
    const menuItems = document.querySelectorAll(".menu-item p"); // Individual menu items
    const activeItem = document.querySelector(".menu-item p#active"); // Active menu item
    const toggleButton1 = document.querySelector(".burger1"); // Close menu button

    // Initial states for menu items and sub-nav
    gsap.set(menuItems, { y: 225 });
    gsap.set(subNav, { opacity: 0 });

    // Timeline for menu open/close animations
    const timeline = gsap.timeline({ paused: true });
    timeline
        .to(overlay, {
            duration: 1.5,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", // Expand overlay
            ease: "power4.inOut",
        })
       

    // Open menu
    toggleButton.addEventListener("click", function () {
        timeline.play(); // Play open animation
        toggleButton.classList.add("active"); // Highlight open button
        toggleButton1.classList.remove("active"); // Remove highlight from close button
    });

    // Close menu
    toggleButton1.addEventListener("click", function () {
        timeline.reverse(); // Reverse the animation to close menu
        toggleButton1.classList.add("active"); // Highlight close button
        toggleButton.classList.remove("active"); // Remove highlight from open button
    });
}
nav();

let elements = document.querySelectorAll(".text");

elements.forEach((element) => {
  let originalText = element.dataset.textOriginal || element.innerText;
  let hoverText = element.dataset.textHover || element.innerText; // fallback to same

  element.innerHTML = "";

  let textContainer1 = document.createElement("div");
  textContainer1.classList.add("block");

  let textContainer2 = document.createElement("div");
  textContainer2.classList.add("block");
  // ✅ Use max length of both strings to avoid cutoff
  const maxLength = Math.max(originalText.length, hoverText.length);
  for (let i = 0; i < maxLength; i++) {
    let char1 = originalText[i] || " ";
    let char2 = hoverText[i] || " ";

    let span1 = document.createElement("span");
    let span2 = document.createElement("span");

    span1.innerText = char1.trim() === "" ? "\xa0" : char1;
    span2.innerText = char2.trim() === "" ? "\xa0" : char2;

    span1.classList.add("letter");
    span2.classList.add("letter");

    textContainer1.appendChild(span1);
    textContainer2.appendChild(span2);
  }

  element.appendChild(textContainer1);
  element.appendChild(textContainer2);
});


elements.forEach((element) => {
  element.addEventListener("mouseover", () => {
    element.classList.add("play");
  });

  element.addEventListener("mouseout", () => {
    element.classList.remove("play");
  });
});
