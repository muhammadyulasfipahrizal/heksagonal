
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
    <div className="flex flex-col gap-5">
      <QuantityInput
        quantityCount={quantityCount}
        setQuantityCount={setQuantityCount}
      />

      {Boolean(product.inStock) && (
        <div className="flex gap-x-5 max-[500px]:flex-col max-[500px]:items-center max-[500px]:gap-y-1">
          <AddToCartSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedVariant={selectedVariant}
          />

          <BuyNowSingleProductBtn
            quantityCount={quantityCount}
            product={product}
          />
        </div>
      )}
    </div>
  );
};

export default SingleProductDynamicFields;
