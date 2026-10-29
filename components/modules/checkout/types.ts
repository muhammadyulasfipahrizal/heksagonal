import type { CheckoutFormData } from "@/components/ContactForm";

export type DeliveryMethod = "pickup" | "shipping";

export type CheckoutAddress = {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  label: string | null;
  adress: string;
  postalCode: string;
  city: string;
  province: string;
  district: string;
  isDefault: boolean;
};

export type SavedAddress = Omit<CheckoutAddress, "userId" | "label"> & {
  label: string;
};

export type { CheckoutFormData };