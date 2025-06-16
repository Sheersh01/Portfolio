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

  // Batch processing
  if (isMobile) {
    ScrollTrigger.batch(".img-container", {
      onEnter: (elements) => elements.forEach(el => el.classList.add('in-view')),
      onLeave: (elements) => elements.forEach(el => el.classList.remove('in-view')),
      refreshPriority: -2,
      interval: 0.1,
    });
  }

  if (isMobile) {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => ScrollTrigger.refresh());
    } else {
      setTimeout(() => ScrollTrigger.refresh(), 100);
    }
  } else {
    ScrollTrigger.refresh();
  }
}

// Preloader listener
let preloaderCompleted = false;

window.addEventListener('preloaderComplete', () => {
  preloaderCompleted = true;

  if (isMobile && window.requestIdleCallback) {
    requestIdleCallback(initializeScrollAnimations);
  } else {
    requestAnimationFrame(() => setTimeout(initializeScrollAnimations, 250));
  }
});

// Resize handler
let resizeTimer;
const handleResize = () => {
  clearTimeout(resizeTimer);
  const delay = isMobile ? 300 : 150;

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

// Scroll detection
if (isMobile) {
  let scrollTimeout;
  let scrollTicking = false;

  const handleScroll = () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        document.body.classList.add('scrolling');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          document.body.classList.remove('scrolling');
        }, 200);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (preloaderCompleted) ScrollTrigger.refresh();
    }, 500);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ScrollTrigger.getAll().forEach(trigger => trigger.disable());
    } else {
      ScrollTrigger.getAll().forEach(trigger => trigger.enable());
    }
  });

} else {
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    document.body.classList.add('scrolling');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 150);
  }, { passive: true });
}
