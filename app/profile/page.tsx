
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
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700"
        >
          <FaArrowLeft />
          Kembali ke beranda
        </Link>

        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            Profil Saya
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Kelola informasi akun, keamanan, dan alamat pengiriman.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FaUser size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Informasi akun</h2>
              <p className="text-sm text-gray-500">
                Perbarui nama, email, dan nomor telepon.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nama lengkap</span>
              <input
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
                placeholder="Nama lengkap"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="nama@email.com"
              />
              <span className="text-xs text-gray-500">
                Pastikan kamu masih memiliki akses ke email baru.
                Perubahan email di sini belum melakukan verifikasi email.
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Nomor telepon</span>
              <input
                type="tel"
                maxLength={25}
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClass}
                placeholder="08xxxxxxxxxx"
              />
            </label>

            <div className="flex justify-end border-t pt-5">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-lg bg-[#02054b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FaLock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Keamanan akun</h2>
              <p className="text-sm text-gray-500">
                Perbarui password akun kamu.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Password lama</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                className={inputClass}
                placeholder="Kosongkan jika belum punya password lokal"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Password baru</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputClass}
                  placeholder="Minimal 8 karakter"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">
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
                  className={inputClass}
                  placeholder="Ulangi password baru"
                />
              </label>
            </div>

            <div className="flex justify-end border-t pt-5">
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-lg bg-[#02054b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword
                  ? "Memperbarui..."
                  : "Perbarui password"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FaMapMarkerAlt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Alamat pengiriman
              </h2>
              <p className="text-sm text-gray-500">
                Kelola alamat tersimpan, alamat utama, dan informasi
                penerima.
              </p>
            </div>
          </div>

          <AddressSelector
                selectedAddressId={selectedAddressId}
                onSelect={handleSelectAddress}
                onAddAddress={() => {
                // Hubungkan ke modal atau halaman tambah alamat.
                }}
            />
        </section>
      </div>
    </main>
  );
}
