import type { FoodCategoryKey } from "@/lib/types";

export interface OptionItem {
  key: string;
  label: string;
}

export const FOOD_OPTIONS: Record<FoodCategoryKey, OptionItem[]> = {
  salad: [
    { key: "salad_greek", label: "Греческий салат" },
    { key: "salad_caesar", label: "Цезарь" }
  ],
  appetizer: [
    { key: "appetizer_cheese", label: "Сырная тарелка" },
    { key: "appetizer_bruschetta", label: "Брускетты" }
  ],
  hot: [
    { key: "hot_fish", label: "Рыба" },
    { key: "hot_beef", label: "Говядина" }
  ],
  drinks: [
    { key: "drink_wine", label: "Вино" },
    { key: "drink_non_alcohol", label: "Безалкогольные" }
  ]
};

export const GIFT_OPTIONS: OptionItem[] = [
  { key: "gift_cash", label: "Конверт" },
  { key: "gift_certificate", label: "Сертификат" },
  { key: "gift_surprise", label: "Сюрприз" }
];
