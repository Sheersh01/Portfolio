import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Mobile detection and performance settings
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 window.innerWidth <= 768;
const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

// Mobile-optimized configuration
const mobileConfig = {
  // Reduced animation complexity for mobile
  scaleChange: isMobile ? 1.08 : 1.15,
  filterIntensity: isMobile ? "110%" : "120%",
  scrubSpeed: isMobile ? 2 : 1.2,
  textMovement: isMobile ? 10 : 15,
  // Disable heavy effects on low-end devices
  useFilters: !isLowEndDevice,
  useTransforms: true
};

// Function to initialize all scroll animations
function initializeScrollAnimations() {
  // Kill any existing ScrollTriggers to prevent conflicts
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  
  // Mobile-optimized ScrollTrigger configuration
  ScrollTrigger.config({
    invalidateOnRefresh: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    // Mobile-specific optimizations
    limitCallbacks: true,
    syncInterval: isMobile ? 17 : 8, // 60fps on mobile, 120fps on desktop
  });

  // Optimize GSAP for mobile performance
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });
  
  // Right-side image animation - MOBILE OPTIMIZED
  gsap.utils.toArray(".img-container.right img").forEach((img) => {
    // Enhanced mobile optimization
    gsap.set(img, { 
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform, clip-path" + (mobileConfig.useFilters ? ", filter" : ""),
      backfaceVisibility: "hidden", // Prevent flickering on mobile
    });
    
    const fromProps = {
      clipPath: "circle(0.3% at 100% 0)", 
      scale: mobileConfig.scaleChange,
    };
    
    const toProps = {
      scale: 1,
      clipPath: "circle(141.2% at 100% 0)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: img,
        start: "top 70%",
        end: "top 10%",
        scrub: mobileConfig.scrubSpeed,
        // Mobile performance optimizations
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        // Reduce calculations on mobile
        refreshPriority: isMobile ? -1 : 0,
      },
    };

    // Conditionally add filters based on device capability
    if (mobileConfig.useFilters) {
      fromProps.filter = `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`;
      toProps.filter = "contrast(100%) brightness(100%)";
    }
    
    gsap.fromTo(img, fromProps, toProps);
  });

  // Left-side image animation - MOBILE OPTIMIZED
  gsap.utils.toArray(".img-container.left img").forEach((img) => {
    // Enhanced mobile optimization
    gsap.set(img, { 
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform, clip-path" + (mobileConfig.useFilters ? ", filter" : ""),
      backfaceVisibility: "hidden", // Prevent flickering on mobile
    });
    
    const fromProps = {
      clipPath: "circle(0.8% at 0 0)",
      scale: mobileConfig.scaleChange,
    };
    
    const toProps = {
      scale: 1,
      clipPath: "circle(141.2% at 0 0)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: img,
        start: "top 70%",
        end: "top 10%",
        scrub: mobileConfig.scrubSpeed,
        // Mobile performance optimizations
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        refreshPriority: isMobile ? -1 : 0,
      },
    };

    // Conditionally add filters based on device capability
    if (mobileConfig.useFilters) {
      fromProps.filter = `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`;
      toProps.filter = "contrast(100%) brightness(100%)";
    }
    
    gsap.fromTo(img, fromProps, toProps);
  });

  // Text animations - MOBILE OPTIMIZED
  gsap.utils.toArray(".img-container p").forEach((p) => {
    gsap.set(p, {
      force3D: true,
      willChange: "transform, opacity",
    });

    gsap.fromTo(
      p,
      { 
        y: mobileConfig.textMovement,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: p,
          start: "top 90%",
          end: "top 70%",
          scrub: isMobile ? 1.5 : 0.8, // Smoother on mobile
          fastScrollEnd: true,
          toggleActions: "play none none reverse",
          refreshPriority: -1,
        },
      }
    );
  });

  // Mobile-optimized batch processing
  if (isMobile) {
    ScrollTrigger.batch(".img-container", {
      onEnter: (elements) => {
        // Reduce DOM queries on mobile
        elements.forEach(el => el.classList.add('in-view'));
      },
      onLeave: (elements) => {
        elements.forEach(el => el.classList.remove('in-view'));
      },
      refreshPriority: -2,
      interval: 0.1, // Batch more aggressively on mobile
    });
  }

  // Refresh with mobile considerations
  if (isMobile) {
    // Use requestIdleCallback for non-critical refresh on mobile
    if (window.requestIdleCallback) {
      requestIdleCallback(() => ScrollTrigger.refresh());
    } else {
      setTimeout(() => ScrollTrigger.refresh(), 100);
    }
  } else {
    ScrollTrigger.refresh();
  }
}

// Mobile-optimized event listeners
let preloaderCompleted = false;

window.addEventListener('preloaderComplete', () => {
  preloaderCompleted = true;
  
  if (isMobile) {
    // Use requestIdleCallback for mobile to avoid blocking main thread
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        initializeScrollAnimations();
      });
    } else {
      requestAnimationFrame(() => {
        setTimeout(initializeScrollAnimations, 100);
      });
    }
  } else {
    requestAnimationFrame(() => {
      setTimeout(initializeScrollAnimations, 250);
    });
  }
});

// Optimized resize handler with mobile considerations
let resizeTimer;
const handleResize = () => {
  clearTimeout(resizeTimer);
  const delay = isMobile ? 300 : 150; // Longer delay on mobile
  
  resizeTimer = setTimeout(() => {
    if (preloaderCompleted) {
      if (isMobile && window.requestIdleCallback) {
        requestIdleCallback(() => ScrollTrigger.refresh());
      } else {
        ScrollTrigger.refresh();
      }
    }
  }, delay);
};

window.addEventListener('resize', handleResize, { passive: true });

// Mobile-specific optimizations
if (isMobile) {
  // Reduce scroll event frequency on mobile
  let scrollTimeout;
  let scrollTicking = false;
  
  const handleScroll = () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        document.body.classList.add('scrolling');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          document.body.classList.remove('scrolling');
        }, 200); // Longer timeout on mobile
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Handle orientation change on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (preloaderCompleted) {
        ScrollTrigger.refresh();
      }
    }, 500); // Wait for orientation change to complete
  }, { passive: true });
  
  // Pause animations when page is not visible (mobile battery optimization)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ScrollTrigger.getAll().forEach(trigger => trigger.disable());
    } else {
      ScrollTrigger.getAll().forEach(trigger => trigger.enable());
    }
  });
} else {
  // Desktop scroll handling (original logic)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    document.body.classList.add('scrolling');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 150);
  }, { passive: true });
}