import { useEffect, useLayoutEffect, useRef, type WheelEvent as ReactWheelEvent } from "react";

interface UseCenteredSnapGalleryOptions {
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  syncKey: string | number;
  syncIndex?: number;
  syncTargetSelector?: string;
}

export function useCenteredSnapGallery({
  activeIndex,
  onActiveIndexChange,
  syncKey,
  syncIndex,
  syncTargetSelector
}: UseCenteredSnapGalleryOptions) {
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);
  const hasUserIntentRef = useRef(false);
  const syncResetTimeoutRef = useRef<number | null>(null);
  const wheelSnapResetTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    let frameId = 0;
    let settleTimeoutId = 0;
    let releaseTimeoutId = 0;
    let resizeObserver: ResizeObserver | null = null;

    function getTargetSlide(currentGallery: HTMLDivElement) {
      const targetIndex = syncIndex ?? activeIndex;

      if (syncTargetSelector) {
        const anchoredTarget = currentGallery.querySelector<HTMLElement>(
          `${syncTargetSelector}[data-slide-index="${targetIndex}"]`
        );

        if (anchoredTarget) {
          return anchoredTarget;
        }
      }

      return (
        currentGallery.querySelector<HTMLElement>(`[data-slide-index="${targetIndex}"]`) ??
        currentGallery.querySelector<HTMLElement>(`[data-slide-index="${activeIndex}"]`)
      );
    }

    function getSlideStartInGallery(currentGallery: HTMLDivElement, slide: HTMLElement) {
      const galleryRect = currentGallery.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();

      return slideRect.left - galleryRect.left + currentGallery.scrollLeft;
    }

    function centerActiveSlide() {
      const currentGallery = galleryRef.current;
      const slide = currentGallery ? getTargetSlide(currentGallery) : null;

      if (!currentGallery || !slide) {
        return;
      }

      const slideRect = slide.getBoundingClientRect();
      const slideLeftInGallery = getSlideStartInGallery(currentGallery, slide);
      const nextScrollLeft = slideLeftInGallery - (currentGallery.clientWidth - slideRect.width) / 2;
      currentGallery.dataset.syncing = "true";
      currentGallery.scrollLeft = nextScrollLeft;
    }

    isSyncingRef.current = true;
    hasUserIntentRef.current = false;
    if (syncResetTimeoutRef.current !== null) {
      window.clearTimeout(syncResetTimeoutRef.current);
    }

    centerActiveSlide();
    frameId = window.requestAnimationFrame(centerActiveSlide);
    settleTimeoutId = window.setTimeout(centerActiveSlide, 90);
    if (galleryRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        centerActiveSlide();
      });
      resizeObserver.observe(galleryRef.current);
      const targetSlide = getTargetSlide(galleryRef.current);
      if (targetSlide) {
        resizeObserver.observe(targetSlide);
      }
    }
    syncResetTimeoutRef.current = window.setTimeout(() => {
      isSyncingRef.current = false;
      syncResetTimeoutRef.current = null;
    }, 220);
    releaseTimeoutId = window.setTimeout(() => {
      if (galleryRef.current) {
        delete galleryRef.current.dataset.syncing;
      }
    }, 220);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      if (settleTimeoutId) {
        window.clearTimeout(settleTimeoutId);
      }
      if (releaseTimeoutId) {
        window.clearTimeout(releaseTimeoutId);
      }
      if (syncResetTimeoutRef.current !== null) {
        window.clearTimeout(syncResetTimeoutRef.current);
        syncResetTimeoutRef.current = null;
      }
      resizeObserver?.disconnect();
      if (galleryRef.current) {
        delete galleryRef.current.dataset.syncing;
      }
      isSyncingRef.current = false;
    };
  }, [syncKey, syncIndex]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
      if (syncResetTimeoutRef.current !== null) {
        window.clearTimeout(syncResetTimeoutRef.current);
      }
      if (wheelSnapResetTimeoutRef.current !== null) {
        window.clearTimeout(wheelSnapResetTimeoutRef.current);
      }
    };
  }, []);

  function syncActiveSlideFromScroll() {
    const gallery = galleryRef.current;

    if (!gallery) {
      return;
    }

    const slides = Array.from(gallery.querySelectorAll<HTMLElement>("[data-slide-index]"));

    if (slides.length === 0) {
      return;
    }

    const galleryCenter = gallery.scrollLeft + gallery.clientWidth / 2;
    const galleryRect = gallery.getBoundingClientRect();
    let nearestIndex = activeIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide) => {
      const slideIndex = Number(slide.dataset.slideIndex);
      const slideRect = slide.getBoundingClientRect();
      const slideLeftInGallery = slideRect.left - galleryRect.left + gallery.scrollLeft;
      const slideCenter = slideLeftInGallery + slideRect.width / 2;
      const distance = Math.abs(slideCenter - galleryCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = slideIndex;
      }
    });

    if (nearestIndex !== activeIndex) {
      onActiveIndexChange(nearestIndex);
    }
  }

  function handleGalleryScroll() {
    if (isSyncingRef.current || !hasUserIntentRef.current) {
      return;
    }

    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      syncActiveSlideFromScroll();
    });
  }

  function handleGalleryWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const gallery = galleryRef.current;

    if (!gallery) {
      return;
    }

    hasUserIntentRef.current = true;

    const deltaUnit =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientWidth : 1;
    const deltaX = event.deltaX * deltaUnit;
    const deltaY = event.deltaY * deltaUnit;

    if (window.innerWidth <= 680 || Math.abs(deltaY) < Math.abs(deltaX) || deltaY === 0) {
      return;
    }

    if (gallery.scrollWidth <= gallery.clientWidth + 1) {
      return;
    }

    event.preventDefault();
    gallery.dataset.wheelScrolling = "true";
    gallery.scrollLeft += deltaY * 1.2;

    if (wheelSnapResetTimeoutRef.current !== null) {
      window.clearTimeout(wheelSnapResetTimeoutRef.current);
    }

    wheelSnapResetTimeoutRef.current = window.setTimeout(() => {
      if (galleryRef.current) {
        delete galleryRef.current.dataset.wheelScrolling;
      }
      wheelSnapResetTimeoutRef.current = null;
    }, 140);
  }

  return {
    galleryRef,
    handleGalleryScroll,
    handleGalleryWheel,
    markUserIntent() {
      hasUserIntentRef.current = true;
    }
  };
}
