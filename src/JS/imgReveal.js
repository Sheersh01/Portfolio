import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Function to initialize all scroll animations
function initializeScrollAnimations() {
  // Kill any existing ScrollTriggers to prevent conflicts
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  
  // Performance optimization: Use invalidateOnRefresh for better caching
  ScrollTrigger.config({
    invalidateOnRefresh: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
  });
  
  // Right-side image animation - OPTIMIZED
  gsap.utils.toArray(".img-container.right img").forEach((img) => {
    // Pre-optimize the element
    gsap.set(img, { 
      force3D: true,
      transformOrigin: "center center"
    });
    
    gsap.fromTo(
      img,
      {    
        // Reduced filter intensity for better performance
        filter: "contrast(120%) brightness(120%)", 
        clipPath: "circle(0.3% at 100% 0)", 
        scale: 1.15, // Reduced scale change
      },
      {
        filter: "contrast(100%) brightness(100%)", 
        scale: 1,
        clipPath: "circle(141.2% at 100% 0)",
        ease: "power2.out",
        scrollTrigger: {
          trigger: img,
          start: "top 70%",
          end: "top 10%",
          scrub: 1.2, // Slightly less aggressive scrubbing
          // Performance optimization
          fastScrollEnd: true,
          preventOverlaps: true,
        },
      }
    );
  });

  // Left-side image animation - OPTIMIZED
  gsap.utils.toArray(".img-container.left img").forEach((img) => {
    // Pre-optimize the element
    gsap.set(img, { 
      force3D: true,
      transformOrigin: "center center"
    });
    
    gsap.fromTo(
      img,
      { 
        filter: "contrast(120%) brightness(120%)", // Reduced intensity
        clipPath: "circle(0.8% at 0 0)",
        scale: 1.15, // Reduced scale change
      },
      {
        filter: "contrast(100%) brightness(100%)",
        scale: 1,
        clipPath: "circle(141.2% at 0 0)",
        ease: "power2.out",
        scrollTrigger: {
          trigger: img,
          start: "top 70%",
          end: "top 10%",
          scrub: 1.2, // Slightly less aggressive scrubbing
          // Performance optimization
          fastScrollEnd: true,
          preventOverlaps: true,
        },
      }
    );
  });

  // Text animations - SIMPLIFIED for better performance
  gsap.utils.toArray(".img-container p").forEach((p) => {
    gsap.fromTo(
      p,
      { 
        y: 15, // Reduced movement
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: p,
          start: "top 90%", // Adjusted trigger points
          end: "top 70%",
          scrub: 0.8, // Lighter scrubbing
          fastScrollEnd: true,
          // Only animate on the way down to reduce reverse scroll lag
          toggleActions: "play none none reverse",
        },
      }
    );
  });

  // Batch refresh for better performance
  ScrollTrigger.batch(".img-container", {
    onEnter: (elements) => {
      // Optional: Add entrance animations here if needed
    },
    onLeave: (elements) => {
      // Optional: Add exit animations here if needed
    },
    refreshPriority: -1, // Lower priority for batch operations
  });

  // Refresh ScrollTrigger to recalculate all positions
  ScrollTrigger.refresh();
}

// Performance-optimized event listeners
let preloaderCompleted = false;

window.addEventListener('preloaderComplete', () => {
  preloaderCompleted = true;
  // Reduced delay for faster initialization
  requestAnimationFrame(() => {
    setTimeout(() => {
      initializeScrollAnimations();
    }, 250); // Reduced from 500ms
  });
});

// Debounced resize handler with better performance
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (preloaderCompleted) {
      ScrollTrigger.refresh();
    }
  }, 150); // Reduced debounce time
});

// Optional: Add scroll performance monitoring
let scrollTimeout;
window.addEventListener('scroll', () => {
  document.body.classList.add('scrolling');
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove('scrolling');
  }, 150);
}, { passive: true });