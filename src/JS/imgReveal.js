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
  textMovement: isMobile ? 10 : 15,
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

  // Right-side image animations
  gsap.utils.toArray(".img-container.right img").forEach((img) => {
    gsap.set(img, {
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform, clip-path" + (mobileConfig.useFilters ? ", filter" : ""),
      backfaceVisibility: "hidden",
    });

    const fromProps = {
      clipPath: "circle(9.0% at 100% 0)",
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
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        refreshPriority: isMobile ? -1 : 0,
        toggleActions: "play none none reverse",
        onLeaveBack: () => {
          gsap.set(img, {
            scale: mobileConfig.scaleChange,
            clipPath: "circle(9.0% at 100% 0)",
            ...(mobileConfig.useFilters && {
              filter: `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`
            }),
          });
        }
      },
    };

    if (mobileConfig.useFilters) {
      fromProps.filter = `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`;
      toProps.filter = "contrast(100%) brightness(100%)";
    }

    gsap.fromTo(img, fromProps, toProps);
  });

  // Left-side image animations
  gsap.utils.toArray(".img-container.left img").forEach((img) => {
    gsap.set(img, {
      force3D: true,
      transformOrigin: "center center",
      willChange: "transform, clip-path" + (mobileConfig.useFilters ? ", filter" : ""),
      backfaceVisibility: "hidden",
    });

    const fromProps = {
      clipPath: "circle(9.0% at 0 0)",
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
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        refreshPriority: isMobile ? -1 : 0,
        toggleActions: "play none none reverse",
        onLeaveBack: () => {
          gsap.set(img, {
            scale: mobileConfig.scaleChange,
            clipPath: "circle(9.0% at 0 0)",
            ...(mobileConfig.useFilters && {
              filter: `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`
            }),
          });
        }
      },
    };

    if (mobileConfig.useFilters) {
      fromProps.filter = `contrast(${mobileConfig.filterIntensity}) brightness(${mobileConfig.filterIntensity})`;
      toProps.filter = "contrast(100%) brightness(100%)";
    }

    gsap.fromTo(img, fromProps, toProps);
  });

  // Text animations
  gsap.utils.toArray(".img-container p").forEach((p) => {
    gsap.set(p, {
      force3D: true,
      willChange: "transform, opacity",
    });

    gsap.fromTo(
      p,
      { y: mobileConfig.textMovement, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: p,
          start: "top 90%",
          end: "top 70%",
          scrub: isMobile ? 1.5 : 0.8,
          fastScrollEnd: true,
          toggleActions: "play none none reverse",
          refreshPriority: -1,
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
      onLeave: (elements) => elements.forEach(el => el.classList.remove('in-view')),
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