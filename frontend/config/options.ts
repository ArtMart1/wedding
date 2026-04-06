import type { FoodCategoryKey } from "@/lib/types";

export interface DetailFloatingItem {
  key: string;
  section: "food" | "gifts";
  title: string;
  description?: string;
  iconSrc: string;
  category?: FoodCategoryKey;
}

export const DETAIL_FLOATING_ITEMS: DetailFloatingItem[] = [
  {
    key: "salad_greek",
    section: "food",
    category: "salad",
    title: "Греческий салат",
    description: "Свежие овощи, фета и оливки",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "salad_caesar",
    section: "food",
    category: "salad",
    title: "Цезарь",
    description: "Романо, соус, пармезан и хрустящий салат",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_fish",
    section: "food",
    category: "hot",
    title: "Рыба",
    description: "Нежная подача без лишней тяжести",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_beef",
    section: "food",
    category: "hot",
    title: "Говядина",
    description: "Более насыщенный и плотный вариант",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_non_alcohol",
    section: "food",
    category: "drinks",
    title: "Я без алкоголя",
    description: "Буду пить компот, чай, кофеек",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_spring_punch",
    section: "food",
    category: "drinks",
    title: "Spring Punch",
    description: "Джин, трипл сек, лимончелло, anchan, cordial mix",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_wine",
    section: "food",
    category: "drinks",
    title: "Вино",
    description: "Остановлюсь на классическом варианте",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "gift_cash",
    section: "gifts",
    title: "Конверт",
    description: "Самый удобный вариант для нас",
    iconSrc: "/gift-option-tag.png"
  },
  {
    key: "gift_certificate",
    section: "gifts",
    title: "Сертификат",
    description: "Если хочется выбрать что-то более личное",
    iconSrc: "/gift-option-tag.png"
  },
  {
    key: "gift_surprise",
    section: "gifts",
    title: "Сюрприз",
    description: "Доверимся вашему вкусу",
    iconSrc: "/gift-option-tag.png"
  }
];

export const FOOD_OPTIONS: Record<FoodCategoryKey, DetailFloatingItem[]> = {
  salad: DETAIL_FLOATING_ITEMS.filter(
    (item): item is DetailFloatingItem & { category: "salad" } =>
      item.section === "food" && item.category === "salad"
  ),
  hot: DETAIL_FLOATING_ITEMS.filter(
    (item): item is DetailFloatingItem & { category: "hot" } =>
      item.section === "food" && item.category === "hot"
  ),
  drinks: DETAIL_FLOATING_ITEMS.filter(
    (item): item is DetailFloatingItem & { category: "drinks" } =>
      item.section === "food" && item.category === "drinks"
  )
};

export const GIFT_OPTIONS: DetailFloatingItem[] = DETAIL_FLOATING_ITEMS.filter(
  (item): item is DetailFloatingItem => item.section === "gifts"
);
