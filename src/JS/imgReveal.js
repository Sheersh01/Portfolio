import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Function to initialize all scroll animations
function initializeScrollAnimations() {
  // Kill any existing ScrollTriggers to prevent conflicts
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  
  // Right-side image animation
  gsap.utils.toArray(".img-container.right img").forEach((img) => {
    gsap.fromTo(
      img,
      {
        clipPath: "circle(0.3% at 100% 0)", 
      },
      {
        clipPath: "circle(141.2% at 100% 0)",
        ease: "power2.out",
        scrollTrigger: {
          trigger: img,
          start: "top 70%",
          end: "top 10%",
          scrub: true,
          // markers: true,
        },
      }
    );
  });

  // Left-side image animation
  gsap.utils.toArray(".img-container.left img").forEach((img) => {
    gsap.fromTo(
      img,
      { 
        clipPath: "circle(0.8% at 0 0)"
      },
      {
        clipPath: "circle(141.2% at 0 0)",
        ease: "power2.out",
        scrollTrigger: {
          trigger: img,
          start: "top 70%",
          end: "top 10%",
          toggleActions: "play none none none",
          scrub: true,
          // markers: true,   
        },
      }
    );
  });

  // Text animations
  gsap.utils.toArray(".img-container p").forEach((p) => {
    gsap.fromTo(
      p,
      { 
        y: 20,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: p,
          start: "top 100%",
          end: "top 60%",
          toggleActions: "play none none none",
          scrub: true,
          // markers: true,   
        },
      }
    );
  });

  // Refresh ScrollTrigger to recalculate all positions
  ScrollTrigger.refresh();
}

// Wait for preloader to complete before initializing scroll animations
window.addEventListener('preloaderComplete', () => {
  // Add a delay to ensure content is fully rendered and visible
  setTimeout(() => {
    initializeScrollAnimations();
  }, 500); // 500ms delay after content becomes visible
});

// Handle window resize - refresh ScrollTrigger calculations
window.addEventListener('resize', () => {
  // Debounce resize events
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
});