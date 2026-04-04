import type { SectionKey } from "@/lib/types";

export const AUTH_LOGO_URL = "/assets/logo/logo-small.png";
export const HERO_LOGO_URL = "/assets/logo/logo-big.png";

const SECTION_IMAGES: Record<SectionKey, string> = {
  dresscode: "/assets/scene/dresscode.png",
  food: "/assets/scene/food.png",
  gifts: "/assets/scene/gifts.png",
  plan: "/assets/scene/plan.png"
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
