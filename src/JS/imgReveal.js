import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                 window.innerWidth <= 768;
const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

const mobileConfig = {
  scaleChange: isMobile ? 1.08 : 1.15,
  filterIntensity: isMobile ? "110%" : "120%",
  scrubSpeed: isMobile ? 2 : 1.2,
  textMovement: isMobile ? 15 : 25,
  useFilters: !isLowEndDevice,
  useTransforms: true,
};

function initializeScrollAnimations() {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());

  // Configure ScrollTrigger to work with Lenis
  ScrollTrigger.config({
    invalidateOnRefresh: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    limitCallbacks: true,
    syncInterval: isMobile ? 17 : 8,
  });

  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });

  // Right-side image animations - ONE WAY ONLY
  gsap.utils.toArray(".img-container.right img").forEach((img) => {
    // Set initial hidden state immediately
    const initialProps = {
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform, clip-path" + (mobileConfig.useFilters ? ", filter" : ""),
      backfaceVisibility: "hidden",
      clipPath: "circle(5.0% at 100% 0)",
      scale: mobileConfig.scaleChange,
    };

    if (mobileConfig.useFilters) {
      initialProps.filter = `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`;
    }

    gsap.set(img, initialProps);

    const toProps = {
      scale: 1,
      clipPath: "circle(141.2% at 100% 0)",
      ease: "power2.out",
      duration: 1.2,
      scrollTrigger: {
        trigger: img,
        start: "top 70%",
        toggleActions: "play none none none",
        once: true, // Only trigger once
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        refreshPriority: isMobile ? -1 : 0,
        onEnter: () => {
          // Mark as revealed when animation starts
          img.setAttribute('data-revealed', 'true');
        }
      },
    };

    if (mobileConfig.useFilters) {
      toProps.filter = "contrast(100%) brightness(100%)";
    }

    gsap.to(img, toProps);
  });

  // Left-side image animations - ONE WAY ONLY
  gsap.utils.toArray(".img-container.left img").forEach((img) => {
    // Set initial hidden state immediately
    const initialProps = {
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform, clip-path" + (mobileConfig.useFilters ? ", filter" : ""),
      backfaceVisibility: "hidden",
      clipPath: "circle(5.0% at 0 0)",
      scale: mobileConfig.scaleChange,
    };

    if (mobileConfig.useFilters) {
      initialProps.filter = `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`;
    }

    gsap.set(img, initialProps);

    const toProps = {
      scale: 1,
      clipPath: "circle(141.2% at 0 0)",
      ease: "power2.out",
      duration: 1.2,
      scrollTrigger: {
        trigger: img,
        start: "top 70%",
        toggleActions: "play none none none",
        once: true, // Only trigger once
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        refreshPriority: isMobile ? -1 : 0,
        onEnter: () => {
          // Mark as revealed when animation starts
          img.setAttribute('data-revealed', 'true');
        }
      },
    };

    if (mobileConfig.useFilters) {
      toProps.filter = "contrast(100%) brightness(100%)";
    }

    gsap.to(img, toProps);
  });

  // Text animations - ONE WAY ONLY
  gsap.utils.toArray(".col p").forEach((p) => {
    // Set initial hidden state immediately
    gsap.set(p, {
      force3D: true,
      willChange: "transform, opacity",
      y: mobileConfig.textMovement,
      opacity: 0,
    });

    gsap.to(
      p,
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        duration: 0.8,
        scrollTrigger: {
          trigger: p,
          start: "top 90%",
          toggleActions: "play none none none",
          once: true, // Only trigger once
          fastScrollEnd: true,
          refreshPriority: -1,
          onEnter: () => {
            // Mark as revealed when animation starts
            p.setAttribute('data-revealed', 'true');
          }
        },
      }
    );
  });

  // Background parallax using ScrollTrigger
  const projectsSection = document.querySelector('.projects');
  if (projectsSection) {
    // Add CSS custom property support for the background transform
    if (!document.querySelector('#parallax-style')) {
      const style = document.createElement('style');
      style.id = 'parallax-style';
      style.textContent = `
        .projects::before {
          transform: translateY(var(--bg-translate, 0px));
          will-change: transform;
        }
      `;
      document.head.appendChild(style);
    }

    // Create parallax effect with proper calculations
    ScrollTrigger.create({
      trigger: projectsSection,
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        // Calculate parallax movement based on section position
        const sectionRect = projectsSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const sectionHeight = projectsSection.offsetHeight;
        
        // Calculate how much the section has scrolled through the viewport
        const scrollProgress = (windowHeight - sectionRect.top) / (windowHeight + sectionHeight);
        
        // Apply parallax with slower movement (0.3 = 30% of scroll speed)
        const translateY = scrollProgress * sectionHeight * -0.3;
        
        projectsSection.style.setProperty('--bg-translate', `${translateY}px`);
      },
      refreshPriority: -1,
    });
  }

  // Batch processing for mobile
  if (isMobile) {
    ScrollTrigger.batch(".img-container", {
      onEnter: (elements) => elements.forEach(el => el.classList.add('in-view')),
      // Removed onLeave to prevent reverting
      refreshPriority: -2,
      interval: 0.1,
    });
  }

  // Single refresh call
  ScrollTrigger.refresh();
}

// Preloader listener
let preloaderCompleted = false;

window.addEventListener('preloaderComplete', () => {
  preloaderCompleted = true;
  
  // Delay initialization to allow Lenis to settle
  setTimeout(initializeScrollAnimations, 100);
});

// Resize handler - simplified to avoid conflicts
let resizeTimer;
const handleResize = () => {
  clearTimeout(resizeTimer);
  const delay = isMobile ? 300 : 150;

  resizeTimer = setTimeout(() => {
    if (preloaderCompleted) {
      ScrollTrigger.refresh();
    }
  }, delay);
};

window.addEventListener('resize', handleResize, { passive: true });

// Orientation change handler for mobile
if (isMobile) {
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (preloaderCompleted) ScrollTrigger.refresh();
    }, 500);
  }, { passive: true });

  // Visibility change handler
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ScrollTrigger.getAll().forEach(trigger => trigger.disable());
    } else {
      ScrollTrigger.getAll().forEach(trigger => trigger.enable());
    }
  });
}