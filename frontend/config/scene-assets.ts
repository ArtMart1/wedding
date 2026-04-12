import type { SectionKey } from "@/lib/types";

export const AUTH_LOGO_URL = "/assets/logo/logo-script-ru.svg";
export const AUTH_LOGO_MOBILE_URL = "/assets/logo/logo-script-ru-mobile.svg";
export const HERO_LOGO_URL = "/assets/logo/logo-script-ru.svg";
export const HERO_LOGO_MOBILE_URL = "/assets/logo/logo-script-ru-mobile.svg";
export const ENTRY_SPLASH_URL = "/assets/mobile/preloader.png";

const SECTION_IMAGES: Record<SectionKey, string> = {
  dresscode: "/assets/scene/dresscode-cat.png",
  food: "/assets/scene/food-pepper.png",
  gifts: "/assets/scene/gifts-dog.png",
  plan: "/assets/scene/dresscode-couple.png"
};

export function getSectionImage(section: SectionKey): string {
  return SECTION_IMAGES[section];
}

export interface StageImageSlot {
  src: string;
  section: SectionKey;
}

export interface StageImages {
  left: StageImageSlot;
  center: StageImageSlot;
  right: StageImageSlot;
}

export function getStageImages(section: SectionKey, order: SectionKey[]): StageImages {
  const index = order.indexOf(section);
  const leftSection = order[(index - 1 + order.length) % order.length];
  const rightSection = order[(index + 1) % order.length];

  return {
    left: { src: SECTION_IMAGES[leftSection], section: leftSection },
    center: { src: SECTION_IMAGES[section], section },
    right: { src: SECTION_IMAGES[rightSection], section: rightSection }
  };
}
