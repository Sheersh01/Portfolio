import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import SplitType from "split-type";
gsap.registerPlugin(ScrambleTextPlugin);


document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector("#trigger-button");
  const message = document.getElementById("funny-message");

  const messages = [
    "Look at this idiot, still clicking a button",
    "Wow, again?",
    "You're really committed huh?",
    "It still does nothing...",
    "Okay now I'm impressed 😑",
    "Button addiction is real",
    "You're not giving up, are you?",
    "Seriously... stop.",
    "Nothing will happen. Ever.",
    "Bro. Chill."
  ];

  let clickCount = 0;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();

    // Get message based on click count, looping back to 0 after end
    const msg = messages[clickCount % messages.length];
    message.textContent = msg;
    message.classList.remove("hidden");

    setTimeout(() => {
      message.classList.add("hidden");
    }, 3000);

    clickCount++;
  });
});

function nav() {
    const toggleButton = document.querySelector(".burger"); // Open menu button
    const overlay = document.querySelector(".overlay"); // Menu overlay
    const subNav = document.querySelector(".sub-nav"); // Sub-navigation container
    const menuItems = document.querySelectorAll(".menu-item p"); // Individual menu items
    const activeItem = document.querySelector(".menu-item p#active"); // Active menu item
    const toggleButton1 = document.querySelector(".burger1"); // Close menu button
    
    // Get overlay content elements for fade-in animation
    const overlayContent = document.querySelector(".overlay-menu");
    const leftLinks = document.querySelectorAll(".overlay-menu .text");
    const rightDescription = document.querySelector(".overlay-menu .w-full.lg\\:w-\\[50\\%\\]");
    const cardImage = document.querySelector(".overlay-menu img");

    // Set initial states for fade-in elements
    gsap.set([overlayContent, leftLinks, rightDescription, cardImage], {
        opacity: 0,
        y: 30
    });

    // Timeline for menu open/close animations
    const timeline = gsap.timeline({ paused: true });
    timeline
        .to(overlay, {
            duration: 1.5,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", // Expand overlay
            ease: "power4.inOut",
        })
        // Fade in the main container
        .to(overlayContent, {
            duration: 0.8,
            opacity: 1,
            y: 0,
            ease: "power2.out"
        }, "-=0.8") // Start 0.8s before the previous animation ends
        // Stagger fade-in for left navigation links
        .to(leftLinks, {
            duration: 0.6,
            opacity: 1,
            y: 0,
            stagger: 0.1, // 0.1s delay between each link
            ease: "power2.out"
        }, "-=0.6")
        // Fade in right description
        .to(rightDescription, {
            duration: 0.8,
            opacity: 1,
            y: 0,
            ease: "power2.out"
        }, "-=0.4")
        // Fade in and rotate the card image
        .to(cardImage, {
            duration: 1,
            opacity: 1,
            y: 0,
            rotation: -40, // Restore the rotation
            ease: "back.out(1.7)"
        }, "-=0.6");

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

// Your existing text animation code
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