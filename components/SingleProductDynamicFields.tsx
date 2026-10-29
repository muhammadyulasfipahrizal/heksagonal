
"use client";

import { useState } from "react";
import QuantityInput from "./QuantityInput";
import AddToCartSingleProductBtn from "./AddToCartSingleProductBtn";
import BuyNowSingleProductBtn from "./BuyNowSingleProductBtn";

type SelectedVariant = {
  id: string;
  title: string | null;
  price: number;
  image: string | null;
};

const SingleProductDynamicFields = ({
  product,
  selectedVariant,
}: {
  product: Product;
  selectedVariant: SelectedVariant | null;
}) => {
  const [quantityCount, setQuantityCount] = useState(1);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <QuantityInput
        quantityCount={quantityCount}
        setQuantityCount={setQuantityCount}
      />

      {Boolean(product.inStock) && (
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <AddToCartSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedVariant={selectedVariant}
          />

          <BuyNowSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedVariant={selectedVariant}
          />
        </div>
      )}
    </div>
  );
};

export default SingleProductDynamicFields;
