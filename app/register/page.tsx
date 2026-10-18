"use client";

import RegisterAddressForm, {
  RegisterAddressData,
} from "@/components/RegisterAddressForm";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import addressApi from "@/lib/addressApi";

const RegisterPage = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [address, setAddress] = useState<RegisterAddressData>({
    phone: "",
    adress: "",
    province: "",
    city: "",
    district: "",
    postalCode: "",
  });

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/");
    }
  }, [sessionStatus, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, checked, type } = e.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const handleGoogleRegister = async () => {
    setError("");

    try {
      setIsSubmitting(true);
      await signIn("google", {
        callbackUrl: "/register/complete-google",
      });
    } catch {
      setIsSubmitting(false);
      const message = "Unable to start Google registration.";
      setError(message);
      toast.error(message);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    if (!form.name.trim()) {
      const message = "Please enter your full name.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!emailRegex.test(form.email)) {
      const message = "Please enter a valid email address.";
      setError(message);
      toast.error(message);
      return;
    }

    if (form.password.length < 8) {
      const message = "Password must be at least 8 characters.";
      setError(message);
      toast.error(message);
      return;
    }

    if (form.password !== form.confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!form.acceptTerms) {
      const message = "Please accept the terms and privacy policy.";
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
      const message = "Please complete your contact and address details.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      // STEP 1: Register user
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: address.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        const message = Array.isArray(registerData.details)
          ? registerData.details
              .map((item: { message?: string }) => item.message)
              .filter(Boolean)
              .join(", ")
          : registerData.error || "Registration failed.";

        throw new Error(message);
      }

      // Extract the ID returned by the registration API.
      // Adjust this path to match the actual response from /api/register.
      const userId =
        registerData.user?.id ??
        registerData.userId ??
        registerData.id;

      if (!userId) {
        throw new Error(
          "Account was created, but the user ID was not returned. Please contact support before retrying."
        );
      }

      // STEP 2: Create the user's address using the existing address API.
      const addressResponse = await addressApi.post({
        userId,
        recipientName: `${form.name.trim()} ${form.lastname.trim()}`,
        phone: address.phone.trim(),
        label: "Rumah",
        adress: address.adress.trim(),
        postalCode: address.postalCode.trim(),
        city: address.city,
        province: address.province,
        district: address.district,
        isDefault: true,
      });

      toast.success(
        addressResponse?.message ??
          "Account and address created successfully!"
      );

      router.push("/login");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#02054b]" />
          <p className="mt-4 text-sm text-gray-500">
            Preparing your registration...
          </p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "authenticated") {
    return null;
  }

  const inputClass =
    "block w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#02054b] focus:bg-white focus:ring-4 focus:ring-[#02054b]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5">

        {/* Registration form */}
        <section className="w-full px-5 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <div className="w-full">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#02054b]/60">
                Create an account
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Sign up
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Fill in your details below to get started.
              </p>
              
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-[#02054b]/10"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                      transform="translate(0 3)"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.46-4.12 7.13-10.2 7.13-17.58Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"
                      transform="translate(0 3)"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.64-5.93c-2.12 1.42-4.84 2.27-8.27 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                      transform="translate(0 -3)"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="mx-4 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-400">
                    Or register with email
                  </span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>
              </div>

            </div>

            <form
              className="mt-8 space-y-8"
              onSubmit={handleSubmit}
            >
              {/* Personal information */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02054b]/[0.07] text-sm font-bold text-[#02054b]">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Personal information
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Your basic account details.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email" className={labelClass}>
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Account security */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02054b]/[0.07] text-sm font-bold text-[#02054b]">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Account security
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Choose a secure password.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={handleChange}
                      className={inputClass}
                      minLength={8}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className={labelClass}
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={inputClass}
                      minLength={8}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact and address */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02054b]/[0.07] text-sm font-bold text-[#02054b]">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Contact & address
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Add your phone number and delivery address.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-6">
                  <RegisterAddressForm
                    value={address}
                    onChange={setAddress}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#02054b] focus:ring-[#02054b]"
                  />
                  <span className="text-sm leading-6 text-gray-600">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-semibold text-[#02054b] underline decoration-[#02054b]/30 underline-offset-4 hover:decoration-[#02054b]"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-[#02054b] underline decoration-[#02054b]/30 underline-offset-4 hover:decoration-[#02054b]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      d="M12 8v4m0 4h.01"
                    />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#02054b] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#02054b]/15 transition hover:bg-[#080d68] focus:outline-none focus:ring-4 focus:ring-[#02054b]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating your account...
                    </>
                  ) : (
                    <>
                      Create account
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14m-6-6 6 6-6 6"
                        />
                      </svg>
                    </>
                  )}
                </button>

                <p className="mt-5 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#02054b] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>

      <p className="mx-auto mt-6 max-w-6xl text-center text-xs leading-5 text-gray-400">
        © {new Date().getFullYear()} HEKSAGONAL. All rights reserved.
      </p>
    </main>
  );
};

export default RegisterPage;