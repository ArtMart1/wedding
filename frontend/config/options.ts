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
    key: "salad_burrata",
    section: "food",
    category: "salad",
    title: "Салат с буратой",
    description: "авокадо и томаты, рукола и соус песто",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "salad_nicoise",
    section: "food",
    category: "salad",
    title: "Нисуаз со спаржей",
    description: "картофелем и перепелиным яйцом",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "salad_olivier",
    section: "food",
    category: "salad",
    title: "Оливье с цыпленком",
    description: "Прикольно",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "salad_crab",
    section: "food",
    category: "salad",
    title: "Зеленый салат с крабом",
    description: "и авокадо",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "salad_salmon",
    section: "food",
    category: "salad",
    title: "Салат с лососем",
    description: "или креветками, кус-кусом, шпинатом и авокадо в соевом соусе",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_chicken",
    section: "food",
    category: "hot",
    title: "Маринованная курица",
    description: "в азиатском соусе с рисом и корейскими огурчиками, подается с кисло-сладким соусом",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_veal_cheeks",
    section: "food",
    category: "hot",
    title: "Телячие щечки",
    description: "с картофельным пюре",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_beef_steak",
    section: "food",
    category: "hot",
    title: "Стейк из говядины",
    description: "с горчичным соусом",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_salmon_steak",
    section: "food",
    category: "hot",
    title: "Стейк лосось",
    description: "с бейби картофелем, спаржей, лабне и травами",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_bacon_pasta",
    section: "food",
    category: "hot",
    title: "Паста с беконом",
    description: "вешенками и сливочным соусом с белым вином, подается с желтком",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_salmon_pasta",
    section: "food",
    category: "hot",
    title: "Паста с лососем",
    description: "шпинатом и красной икрой в сливочном соусе",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "hot_burrata_pasta",
    section: "food",
    category: "hot",
    title: "Паста с буратой",
    description: "томатами и пармезаном",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_non_alcohol",
    section: "food",
    category: "drinks",
    title: "Я без алкоголя",
    description: "Буду пить кампот, чай, кофеек",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_spring_punch",
    section: "food",
    category: "drinks",
    title: "Спринг Февер",
    description: "Джин, трипл сек, синий чай анчан, кордиал павлова, лимон Gin, triple sec, blue tea anchan, cordial pavlova, lemon",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_scarlet",
    section: "food",
    category: "drinks",
    title: "Скарлет",
    description: "Джин, красный вермут, лимончелло, черная смородина",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_bellagio",
    section: "food",
    category: "drinks",
    title: "Беладжио",
    description: "Лимончелло, джин, савиньон бланк, ваниль, лаймовый сорбет",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_la_avenue",
    section: "food",
    category: "drinks",
    title: "Ла Авеню",
    description: "Клубничный пунш, свежая клубника, Millky punch, strawberry",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_kiss_me",
    section: "food",
    category: "drinks",
    title: "Кисс ми",
    description: "Джин, лимон, малина, Gin, lemon, raspberry",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_peach_cloud",
    section: "food",
    category: "drinks",
    title: "Пич клауд",
    description: "Апероль, персик, сок лимона Gin, kiwi, apple, lemon juice",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_green_sour",
    section: "food",
    category: "drinks",
    title: "Грин саур",
    description: "Джин, киви, яблоко, сок лимона",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_red_wine",
    section: "food",
    category: "drinks",
    title: "Бокал красного Вина",
    description: "Итальянское заебумба",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "drink_white_wine",
    section: "food",
    category: "drinks",
    title: "Бокал белого Вина",
    description: "Итальянское класс ваще",
    iconSrc: "/food-option-heart.png"
  },
  {
    key: "gift_cash",
    section: "gifts",
    title: "Юани",
    description: "Подарю деняк молодым",
    iconSrc: "/assets/gifts/gift-cash.png"
  },
  {
    key: "gift_surprise",
    section: "gifts",
    title: "Свой вариант",
    description: "Описание",
    iconSrc: "/assets/gifts/gift-custom.png"
  },
  {
    key: "gift_certificate",
    section: "gifts",
    title: "Сертификат",
    description: "Куда-нибудь",
    iconSrc: "/assets/gifts/gift-certificate.png"
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
