import gsap from "gsap";
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
        .to(menuItems, {
            duration: 1.5,
            y: 0, // Slide menu items into view
            ease: "power4.inOut",
            stagger: 0.2, // Stagger animation for each item
        }, "-=1") // Start at the same time as the overlay animation
        .to(activeItem, {
            "--after-width": "100%", // Highlight active item
            ease: "power4.inOut",
            duration: 1,
        }, "<") // Sync with menu item animation
        .to(subNav, {
            duration: 1,
            opacity: 1, // Fade in sub-nav
            bottom: "10%",
            y: 0,
            ease: "power4.inOut",
        }, "<");

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