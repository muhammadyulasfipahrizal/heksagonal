
"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { isValidEmailAddressFormat } from "@/lib/utils";
import apiClient from "@/lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  
    const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
    ) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmailAddressFormat(normalizedEmail)) {
        toast.error("Please enter a valid email address.");
        return;
    }

    setLoading(true);

    try {

        const response = await fetch("/api/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail
          }),
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.message || "Unable to process your request."
        );
        }

        setSubmitted(true);
        toast.success(
        "If an account exists for that email, reset instructions will be sent."
        );
    } catch (error) {
        toast.error(
        error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."
        );
    } finally {
        setLoading(false);
    }
    };


  return (
    <div className="flex min-h-[70vh] flex-col justify-center bg-white px-6 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
          Forgot your password?
        </h1>

        <p className="mt-3 text-center text-sm text-gray-600">
          Enter the email address associated with your
          account and we&apos;ll send you instructions to
          reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="rounded-lg bg-white px-6 py-10 shadow ring-1 ring-gray-200 sm:px-12">
          {submitted ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                If an account exists for that email,
                you will receive instructions to reset
                your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-[#02054b] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#030866] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="font-semibold text-[#02054b] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
