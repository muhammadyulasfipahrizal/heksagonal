
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaLock,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";
import AddressSelector from "@/components/AddressSelector";

import { CheckoutFormData  } from "@/components/ContactForm";

type Profile = {
  id: string;
  name: string | null;
  email: string;
  phone: string;
};

type CheckoutAddress = {
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

export default function ProfilePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
      if (session?.user?.email) {
        setCheckoutForm((current) => ({
          ...current,
          email: session?.user?.email ?? current.email,
        }));
      }
    }, [session?.user?.email]);
  
    const [checkoutForm, setCheckoutForm] =
      useState<CheckoutFormData>({
        name: "",
        phone: "",
        email: "",
        district: "",
        adress: "",
        province: "",
        city: "",
        postalCode: "",
        orderNotice: "",
      });

  const [selectedAddressId, setSelectedAddressId] =
      useState("");

    const [selectedAddress, setSelectedAddress] =
        useState<CheckoutAddress | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Gagal memuat profil.");
        }

        if (cancelled) return;

        setProfile(data.user);
        setName(data.user.name ?? "");
        setEmail(data.user.email ?? "");
        setPhone(data.user.phone ?? "");
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat profil."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui profil.");
      }

      setProfile(data.user);
      setName(data.user.name ?? "");
      setEmail(data.user.email ?? "");
      setPhone(data.user.phone ?? "");

      // Meminta NextAuth memperbarui data sesi pada sisi client.
      // Keberhasilan penyimpanan profil tidak bergantung pada ini.
      try {
        await update({
          name: data.user.name,
          email: data.user.email,
        });
      } catch {
        // Data profil tetap tersimpan di database.
      }

      toast.success(data.message || "Profil berhasil diperbarui.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui profil."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  const handleSelectAddress = useCallback(
      (address: CheckoutAddress) => {
        setSelectedAddress(address);
        setSelectedAddressId(address.id);
  
        console.log("Selected address:", session?.user?.email );
  
        setCheckoutForm((current) => ({
          ...current,
          name: address.recipientName,
          phone: address.phone,
          email: session?.user?.email ?? current.email,
          adress: address.adress,
          postalCode: address.postalCode,
          city: address.city,
          province: address.province,
          district: address.district,
        }));
      },
      [session?.user?.email]
    );

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(data.message || "Password berhasil diperbarui.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12">
        <p className="text-sm text-gray-500">Memuat profil...</p>
      </main>
    );
  }

  if (status !== "authenticated" || !profile) {
    return null;
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-5 text-gray-900 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-gray-600 transition-colors hover:text-[#02054b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
        >
          <FaArrowLeft className="shrink-0" />
          <span>Kembali ke beranda</span>
        </Link>

        {/* Page heading */}
        <header className="pb-1 sm:pb-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 sm:text-sm">
            Account settings
          </p>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Profil Saya
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Kelola informasi akun, keamanan, dan alamat pengiriman.
          </p>
        </header>

        {/* Account information */}
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
              <FaUser size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold sm:text-lg">
                Informasi akun
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Perbarui nama, email, dan nomor telepon.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="space-y-5 sm:space-y-6"
          >
            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Nama lengkap
              </span>
              <input
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={`${inputClass} w-full min-w-0`}
                placeholder="Nama lengkap"
              />
            </label>

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Email
              </span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`${inputClass} w-full min-w-0`}
                placeholder="nama@email.com"
              />
              <span className="block text-xs leading-5 text-gray-500">
                Pastikan kamu masih memiliki akses ke email baru.
                Perubahan email di sini belum melakukan verifikasi email.
              </span>
            </label>

            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Nomor telepon
              </span>
              <input
                type="tel"
                maxLength={25}
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={`${inputClass} w-full min-w-0`}
                placeholder="08xxxxxxxxxx"
              />
            </label>

            <div className="border-t border-gray-100 pt-4 sm:pt-5">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#02054b] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:min-w-48"
              >
                {savingProfile ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </div>
          </form>
        </section>

        {/* Account security */}
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
              <FaLock size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold sm:text-lg">
                Keamanan akun
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Perbarui password akun kamu.
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-5 sm:space-y-6"
          >
            <label className="block min-w-0 space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Password lama
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                className={`${inputClass} w-full min-w-0`}
                placeholder="Kosongkan jika belum punya password lokal"
              />
            </label>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:gap-6">
              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-semibold text-gray-700">
                  Password baru
                </span>
                <input
                  required
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={`${inputClass} w-full min-w-0`}
                  placeholder="Minimal 8 karakter"
                />
              </label>

              <label className="block min-w-0 space-y-2">
                <span className="block text-sm font-semibold text-gray-700">
                  Konfirmasi password
                </span>
                <input
                  required
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className={`${inputClass} w-full min-w-0`}
                  placeholder="Ulangi password baru"
                />
              </label>
            </div>

            <div className="border-t border-gray-100 pt-4 sm:pt-5">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#02054b] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:min-w-48"
              >
                {savingPassword
                  ? "Memperbarui..."
                  : "Perbarui password"}
              </button>
            </div>
          </form>
        </section>

        {/* Shipping addresses */}
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
              <FaMapMarkerAlt size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold sm:text-lg">
                Alamat pengiriman
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Kelola alamat tersimpan, alamat utama, dan informasi
                penerima.
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onSelect={handleSelectAddress}
              onAddAddress={() => {
                // Hubungkan ke modal atau halaman tambah alamat.
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
