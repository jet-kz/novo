import type { CartItem, OptionGroup, Product, SelectedOption } from "@/types";

/** Groups the customer chooses from. The server already folds old protein/extras lists into groups. */
export function optionGroupsOf(product?: Product | null): OptionGroup[] {
  const groups = product?.optionGroups;
  return Array.isArray(groups) ? groups.filter((g) => g && Array.isArray(g.options) && g.options.length > 0) : [];
}

/** True when the item can't go in the cart without the customer picking something first. */
export const needsChoices = (product?: Product | null) => optionGroupsOf(product).some((g) => (g.min || 0) > 0);

export const optionQty = (o: SelectedOption) => Math.max(1, Number(o.quantity) || 1);

/** Extra cost of the picked options for one unit of the item. */
export const optionsUnitPrice = (opts: SelectedOption[] = []) =>
  opts.reduce((sum, o) => sum + (Number(o.price) || 0) * optionQty(o), 0);

/** "Beef, 2× Plantain" */
export const optionsLabel = (opts: SelectedOption[] = []) =>
  opts.map((o) => (optionQty(o) > 1 ? `${optionQty(o)}× ${o.name}` : o.name)).join(", ");

export const lineUnitPrice = (item: CartItem) => item.product.price + optionsUnitPrice(item.selectedOptions);

/** Identifies a cart line: the same item with different choices is a separate line. */
export const cartLineKey = (item: Pick<CartItem, "product" | "selectedOptions">) =>
  [item.product.id, ...(item.selectedOptions || []).map((o) => `${o.id}x${optionQty(o)}`).sort()].join("|");

/** How the group's rule reads to a customer. */
export function groupRule(g: OptionGroup): string {
  const min = g.min || 0;
  const max = g.max || g.options.length;
  if (min === 1 && max === 1) return "Required · pick 1";
  if (min > 0 && min === max) return `Required · pick ${min}`;
  if (min > 0) return `Required · pick ${min}–${max}`;
  if (max === 1) return "Optional · pick 1";
  return `Optional · up to ${max}`;
}
