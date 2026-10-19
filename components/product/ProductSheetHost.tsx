"use client";

import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import { usePlatform } from "@/store/PlatformContext";

/** The one item sheet for the whole app; open it with usePlatform().openProduct(product). */
export function ProductSheetHost() {
  const { viewingProduct, closeProduct, addToCart } = usePlatform();
  return (
    <ProductDetailsModal
      product={viewingProduct}
      isOpen={!!viewingProduct}
      onClose={closeProduct}
      onAddToCart={(product, qty, opts, note) => addToCart(product, qty, opts, note)}
    />
  );
}
