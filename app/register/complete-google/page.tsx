"use client";

import RegisterAddressForm, {
  RegisterAddressData,
} from "@/components/RegisterAddressForm";
import addressApi from "@/lib/addressApi";
import apiClient from "@/lib/api";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const emptyAddress: RegisterAddressData = {
  phone: "",
  adress: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
};

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
};

const CompleteGoogleRegistrationPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [address, setAddress] = useState<RegisterAddressData>(emptyAddress);
  const [recipientName, setRecipientName] = useState(user?.name ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/register");
      return;
    }

    if (status !== "authenticated") return;

    setRecipientName(user?.name ?? "");

    let cancelled = false;

    const checkExistingAddress = async () => {
      try {
        // The API client is expected to have the backend API base URL configured.
        const response = await apiClient.get("/addresses");
        if (!response.ok) {
          throw new Error("Failed to fetch addresses");
        }

        const payload = await response.json();

        const addresses = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.addresses)
            ? payload.addresses
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        if (!cancelled && addresses.length > 0) {
          router.replace("/");
          return;
        }
      } catch {
        // If checking fails, let the user complete the form; submission will show
        // a clear error if the address endpoint is unavailable.
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    void checkExistingAddress();

    return () => {
      cancelled = true;
    };
  }, [status, user?.name, router]);

  
    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
        ) => {
        event.preventDefault();
        setError("");

        if (!user?.id) {
            const message =
            "Your account session is missing its user ID. Please sign in again.";
            setError(message);
            toast.error(message);
            return;
        }

        if (!recipientName.trim()) {
            const message = "Please enter the recipient name.";
            setError(message);
            toast.error(message);
            return;
        }

        if (
            !address.phone.trim() ||
            !address.adress.trim() ||
            !address.province ||
            !address.city ||
            !address.district ||
            !address.postalCode.trim()
        ) {
            const message = "Please complete all phone and address details.";
            setError(message);
            toast.error(message);
            return;
        }

        setIsSubmitting(true);

        try {
            const phone = address.phone.trim();

            // 1. Update phone number in the User table.
            const userResponse = await apiClient.put(`/api/users/${user.id}`, {
                phone: address.phone.trim(),
            });

            const responseText = await userResponse.text();

            let responseData: any;

            try {
            responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
            responseData = responseText;
            }

            if (!userResponse.ok) {
            console.error("Update user gagal:", {
                status: userResponse.status,
                statusText: userResponse.statusText,
                data: responseData,
                userId: user.id,
            });

            throw new Error(
                responseData?.message ||
                responseData?.error ||
                `Gagal memperbarui nomor telepon (HTTP ${userResponse.status}).`
            );
            }

            // 2. Save the default delivery address.
            const response = await addressApi.post({
                userId: user.id,
                recipientName: recipientName.trim(),
                phone,
                label: "Rumah",
                adress: address.adress.trim(),
                postalCode: address.postalCode.trim(),
                city: address.city,
                province: address.province,
                district: address.district,
                isDefault: true,
            });

            toast.success(
            response?.data?.message ??
                "Your profile and address are complete."
            );

            router.replace("/");
        } catch (err: unknown) {
            const apiError = err as {
            message?: string;
            response?: {
                data?: {
                message?: string;
                error?: string;
                };
            };
            };

            const message =
            apiError.response?.data?.message ??
            apiError.response?.data?.error ??
            apiError.message ??
            "Unable to save your profile and address. Please try again.";

            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };


  if (status === "loading" || isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#02054b]" />
          <p className="mt-4 text-sm text-gray-500">
            Preparing your profile...
          </p>
        </div>
      </main>
    );
  }

  if (status !== "authenticated") return null;

  return (
     <main className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5">

        {/* Registration form */}
        <section className="w-full px-5 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">

            <form onSubmit={handleSubmit} className="space-y-7 px-6 py-7 sm:px-10 sm:py-9">
                <div>
                    <label
                    htmlFor="recipientName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                    Recipient name
                    </label>
                    <input
                    id="recipientName"
                    name="recipientName"
                    type="text"
                    autoComplete="name"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="Name of the person receiving the order"
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#02054b] focus:bg-white focus:ring-4 focus:ring-[#02054b]/10 disabled:opacity-60"
                    />
                </div>

                <div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-6">
                        <RegisterAddressForm
                            value={address}
                            onChange={setAddress}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {error && (
                    <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                    {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#02054b] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#02054b]/15 transition hover:bg-[#080d68] focus:outline-none focus:ring-4 focus:ring-[#02054b]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Saving your profile...
                    </>
                    ) : (
                    "Save and continue"
                    )}
                </button>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                    className="w-full text-sm font-medium text-gray-500 transition hover:text-gray-800 disabled:opacity-60"
                >
                    Sign out
                </button>
            </form>
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-gray-400">
            © {new Date().getFullYear()} HEKSAGONAL. All rights reserved.
        </p>

      </div>
    </main>
  );
};

export default CompleteGoogleRegistrationPage;
