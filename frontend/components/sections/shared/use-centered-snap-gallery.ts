import { useEffect, useRef } from "react";

interface UseCenteredSnapGalleryOptions {
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  syncKey: string | number;
}

export function useCenteredSnapGallery({
  activeIndex,
  onActiveIndexChange,
  syncKey
}: UseCenteredSnapGalleryOptions) {
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    const slide = gallery?.querySelector<HTMLElement>(`[data-slide-index="${activeIndex}"]`);

    if (!gallery || !slide) {
      return;
    }

    const nextScrollLeft = slide.offsetLeft - (gallery.clientWidth - slide.clientWidth) / 2;
    gallery.scrollTo({ left: nextScrollLeft, behavior: "auto" });
  }, [syncKey]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
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
    let nearestIndex = activeIndex;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide) => {
      const slideIndex = Number(slide.dataset.slideIndex);
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
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
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      syncActiveSlideFromScroll();
    });
  }

  return {
    galleryRef,
    handleGalleryScroll
  };
}
