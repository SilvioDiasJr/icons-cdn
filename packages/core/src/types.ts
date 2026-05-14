// ─── Food Icon Names ─────────────────────────────────────────────────────────

export type FoodIconName =
  | 'apple'
  | 'avocado'
  | 'axe'
  | 'bbq-2'
  | 'bbq'
  | 'baby-bottle-2'
  | 'baby-pacifier'
  | 'banana'
  | 'beer-1'
  | 'beer-2'
  | 'bottle-1'
  | 'bottle-2'
  | 'bowl-steam'
  | 'broccoli'
  | 'burger'
  | 'cake-1'
  | 'cake-2'
  | 'cake-3'
  | 'cake-4'
  | 'candle'
  | 'candy'
  | 'carrot'
  | 'cheese-2'
  | 'cheese'
  | 'chefs-hat'
  | 'cherry'
  | 'chupa-chups'
  | 'cookie-1'
  | 'cookie'
  | 'croissant'
  | 'cup-1'
  | 'cup-2'
  | 'cup-3'
  | 'cup-of-tea-1'
  | 'cup-of-tea-2'
  | 'cup-of-tea-3'
  | 'cutlery-1'
  | 'cutlery-2'
  | 'cutlery-3'
  | 'cutlery-4'
  | 'cutlery-5'
  | 'dish-1'
  | 'dish-3'
  | 'donut'
  | 'eggplant'
  | 'eggs'
  | 'fast-food-1'
  | 'fast-food'
  | 'fire'
  | 'fish-1'
  | 'fish-2'
  | 'french-fries'
  | 'fridge'
  | 'fried-eggs'
  | 'grape'
  | 'hat-robe'
  | 'heart'
  | 'hot-dog'
  | 'ice-cream-1'
  | 'ice-cream-2'
  | 'ice-cream-3'
  | 'jar'
  | 'jelly'
  | 'juice-1'
  | 'juice-2'
  | 'lemon'
  | 'loaf-of-bread-3'
  | 'meat-1'
  | 'meat-2'
  | 'mixer'
  | 'mortar'
  | 'nuts'
  | 'olives'
  | 'onion'
  | 'orange'
  | 'pizza-1'
  | 'pizza-2'
  | 'popcorn'
  | 'push-pin'
  | 'rolling-pin'
  | 'salt'
  | 'scales'
  | 'shopping-basket'
  | 'shrimp'
  | 'skewer'
  | 'star'
  | 'strawberry'
  | 'sushi'
  | 'toast'
  | 'watermelon'
  | 'whisk'
  | 'wineglass-1'
  | 'wineglass-2'
  | 'wineglass-3';

// ─── Pack Map ────────────────────────────────────────────────────────────────

/**
 * Maps each pack name to its icon name union type.
 * Add new packs here as:  finance: FinanceIconName;
 */
export interface PackIconMap {
  food: FoodIconName;
  // finance: FinanceIconName;
}

export type PackName = keyof PackIconMap;

// ─── Shared Icon Props ───────────────────────────────────────────────────────

export type IconProps<P extends PackName> = {
  /** Which icon pack to use */
  pack: P;
  /** Icon name — strictly typed per pack */
  name: PackIconMap[P];
  /** Rendered size in px (default: 24) */
  size?: number;
  /** Icon color — any valid CSS color string (default: '#000000') */
  color?: string;
  /** Additional styles forwarded to the container */
  style?: object;
  /** Called when the icon fails to load */
  onError?: (pack: string, name: string) => void;
};
