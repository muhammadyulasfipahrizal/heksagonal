"use client";

import AddressSelector from "@/components/AddressSelector";
import type { CheckoutAddress } from "./types";

type Props = {
  selectedAddressId: string;
  onSelect: (address: CheckoutAddress) => void;
  onAddAddress: () => void;
};

export default function CheckoutAddressSection({
  selectedAddressId,
  onSelect,
  onAddAddress,
}: Props) {
  return (
    <div >
      <AddressSelector
        selectedAddressId={selectedAddressId}
        onSelect={onSelect}
        onAddAddress={onAddAddress}
      />
    </div>
  );
}