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
    iconSrc: "/assets/food/salad/salad-burrata.png"
  },
  {
    key: "salad_nicoise",
    section: "food",
    category: "salad",
    title: "Нисуаз со спаржей",
    description: "картофелем и перепелиным яйцом",
    iconSrc: "/assets/food/salad/salad-nicoise.png"
  },
  {
    key: "salad_olivier",
    section: "food",
    category: "salad",
    title: "Оливье с цыпленком",
    description: "Прикольно",
    iconSrc: "/assets/food/salad/salad-olivier.png"
  },
  {
    key: "salad_crab",
    section: "food",
    category: "salad",
    title: "Зеленый салат с крабом",
    description: "и авокадо",
    iconSrc: "/assets/food/salad/salad-crab.png"
  },
  {
    key: "salad_salmon",
    section: "food",
    category: "salad",
    title: "Салат с лососем",
    description: "с кус-кусом, шпинатом и авокадо в соевом соусе",
    iconSrc: "/assets/food/salad/salad-salmon.png"
  },
  {
    key: "hot_chicken",
    section: "food",
    category: "hot",
    title: "Маринованная курица",
    description: "в азиатском соусе с рисом и корейскими огурчиками",
    iconSrc: "/assets/food/hot/hot-chicken.png"
  },
  {
    key: "hot_veal_cheeks",
    section: "food",
    category: "hot",
    title: "Телячие щечки",
    description: "с картофельным пюре",
    iconSrc: "/assets/food/hot/hot-veal-cheeks.png"
  },
  {
    key: "hot_beef_steak",
    section: "food",
    category: "hot",
    title: "Стейк из говядины",
    description: "с горчичным соусом",
    iconSrc: "/assets/food/hot/hot-beef-steak.png"
  },
  {
    key: "hot_salmon_steak",
    section: "food",
    category: "hot",
    title: "Стейк лосось",
    description: "с бейби картофелем, спаржей, лабне и травами",
    iconSrc: "/assets/food/hot/hot-salmon-steak.png"
  },
  {
    key: "hot_bacon_pasta",
    section: "food",
    category: "hot",
    title: "Паста с беконом",
    description: "вешенками и сливочным соусом с белым вином",
    iconSrc: "/assets/food/hot/hot-bacon-pasta.png"
  },
  {
    key: "hot_salmon_pasta",
    section: "food",
    category: "hot",
    title: "Паста с лососем",
    description: "шпинатом и красной икрой в сливочном соусе",
    iconSrc: "/assets/food/hot/hot-salmon-pasta.png"
  },
  {
    key: "hot_burrata_pasta",
    section: "food",
    category: "hot",
    title: "Паста с буратой",
    description: "томатами и пармезаном",
    iconSrc: "/assets/food/hot/hot-burrata-pasta.png"
  },
  {
    key: "drink_non_alcohol",
    section: "food",
    category: "drinks",
    title: "Я без алкоголя",
    description: "Буду пить кампот, чай, кофеек",
    iconSrc: "/assets/food/drinks/drink-non-alcohol.png"
  },
  {
    key: "drink_mocktail_serena",
    section: "food",
    category: "drinks",
    title: "Серена ван дер Вудсен",
    description: "Б/а игристое, сорбет лайм, персик",
    iconSrc: "/assets/food/drinks/drink-mocktail-serena.png"
  },
  {
    key: "drink_mocktail_orange_vanilla",
    section: "food",
    category: "drinks",
    title: "Ориндж Ванилла",
    description: "Б/а игристое, пюре маракуйя, апельсиновый фреш, ваниль",
    iconSrc: "/assets/food/drinks/drink-mocktail-orange-vanilla.png"
  },
  {
    key: "drink_mocktail_blair",
    section: "food",
    category: "drinks",
    title: "Блэр Уолдорф",
    description: "Б/а игристое, сорбет малина, апельсин, ананас, клубника",
    iconSrc: "/assets/food/drinks/drink-mocktail-blair.png"
  },
  {
    key: "drink_spring_punch",
    section: "food",
    category: "drinks",
    title: "Спринг Февер",
    description: "Джин, трипл сек, синий чай анчан, кордиал павлова, лимон",
    iconSrc: "/assets/food/drinks/drink-spring-fever.png"
  },
  {
    key: "drink_scarlet",
    section: "food",
    category: "drinks",
    title: "Скарлет",
    description: "Джин, красный вермут, лимончелло, черная смородина",
    iconSrc: "/assets/food/drinks/drink-scarlet.png"
  },
  {
    key: "drink_bellagio",
    section: "food",
    category: "drinks",
    title: "Беладжио",
    description: "Лимончелло, джин, савиньон бланк, ваниль, лаймовый сорбет",
    iconSrc: "/assets/food/drinks/drink-bellagio.png"
  },
  {
    key: "drink_la_avenue",
    section: "food",
    category: "drinks",
    title: "Ла Авеню",
    description: "Клубничный пунш, свежая клубника",
    iconSrc: "/assets/food/drinks/drink-la-avenue.png"
  },
  {
    key: "drink_kiss_me",
    section: "food",
    category: "drinks",
    title: "Кисс ми",
    description: "Джин, лимон, малина",
    iconSrc: "/assets/food/drinks/drink-kiss-me.png"
  },
  {
    key: "drink_peach_cloud",
    section: "food",
    category: "drinks",
    title: "Пич клауд",
    description: "Апероль, персик, сок лимона",
    iconSrc: "/assets/food/drinks/drink-peach-cloud.png"
  },
  {
    key: "drink_green_sour",
    section: "food",
    category: "drinks",
    title: "Грин саур",
    description: "Джин, киви, яблоко, сок лимона",
    iconSrc: "/assets/food/drinks/drink-green-sour.png"
  },
  {
    key: "drink_white_wine_italy",
    section: "food",
    category: "drinks",
    title: "Бокал белого",
    description: "Италия, Сицилия, полусухое",
    iconSrc: "/assets/food/drinks/drink-white-wine.png"
  },
  {
    key: "drink_white_wine_argentina",
    section: "food",
    category: "drinks",
    title: "Бокал белого",
    description: "Аргентина, Мендоса, сухое",
    iconSrc: "/assets/food/drinks/drink-white-wine.png"
  },
  {
    key: "drink_red_wine_chile",
    section: "food",
    category: "drinks",
    title: "Бокал красного",
    description: "Чили, Долина Мауле, сухое",
    iconSrc: "/assets/food/drinks/drink-red-wine.png"
  },
  {
    key: "drink_red_wine_argentina",
    section: "food",
    category: "drinks",
    title: "Бокал красного",
    description: "Аргентина, Мендоса, сухое",
    iconSrc: "/assets/food/drinks/drink-red-wine.png"
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
    description: "мы вам доверяем",
    iconSrc: "/assets/gifts/gift-custom.png"
  },
  {
    key: "gift_certificate",
    section: "gifts",
    title: "Сертификат на\u00A0цветы",
    description: "не дарите, пожалуйста, живые цветы",
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
