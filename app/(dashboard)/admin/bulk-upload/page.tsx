// *********************
// Role of the component: Bulk upload products page for admin dashboard
// Name of the component: BulkUpload.tsx
// Developer: Aleksandar Kuzmanovic (modified)
// Version: 1.0
// Component call: <BulkUpload />
// Input parameters: no input parameters
// Output: bulk upload page for admin dashboard
// *********************

"use client";
import { DashboardSidebar } from "@/components";
import BulkUploadHistory from "@/components/BulkUploadHistory";
import apiClient from "@/lib/api";
import React, { useState, useRef, useEffect } from "react";

import toast from "react-hot-toast";
import {
  FaFileUpload,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";


interface UploadResult {
  success: boolean;
  message: string;
  details?: {
    processed: number;
    successful: number;
    failed: number;
    errors?: string[];
  };
}

interface Merchant {
  id: string;
  name: string;
}

const BulkUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoadingMerchants(true);

      try {
        const response = await apiClient.get("/api/merchants");

        if (!response.ok) {
          throw new Error("Failed to fetch merchants.");
        }

        const data: Merchant[] = await response.json();

        setMerchants(data);

        setSelectedMerchantId((currentId) => {
          if (currentId && data.some((merchant) => merchant.id === currentId)) {
            return currentId;
          }

          return data[0]?.id ?? "";
        });

        if (data.length === 0) {
          toast.error("Please create a merchant first.");
        }
      } catch (error) {
        console.error("Error fetching merchants:", error);
        toast.error("Failed to load merchants.");
      } finally {
        setLoadingMerchants(false);
      }
    };

    fetchMerchants();
  }, []);

  const isSupportedFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    return extension === "xlsx";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      if (!isSupportedFile(droppedFile)) {
        toast.error("Please upload a XLSX file.");
        return;
      }

      setFile(droppedFile);
      setUploadResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!isSupportedFile(selectedFile)) {
      toast.error("Please upload a XLSX file.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedMerchantId) {
      toast.error("Please select a merchant first.");
      return;
    }

    if (merchants.length === 0) {
      toast.error("No merchants available. Please create a merchant first.");
      return;
    }

    if (!file) {
      toast.error("Please select a CSV or XLSX file first.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximum file size is 5MB.");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("merchantId", selectedMerchantId);
      

      const response = await fetch(`${process.env.API_URL}/api/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: data.message || "Products uploaded successfully!",
          details: data.details,
        });

        toast.success("Bulk upload completed!");
        setFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Upload failed",
          details: data.details,
        });

        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);

      setUploadResult({
        success: false,
        message: "Network error occurred during upload",
      });

      toast.error("Network error occurred");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,price,manufacturer,inStock,mainImage,description,slug,categoryId
Sample Product,99.99,Sample Manufacturer,10,https://example.com/image.jpg,Sample description,sample-product,category-uuid
Another Product,149.99,Another Manufacturer,5,https://example.com/image2.jpg,Another description,another-product,category-uuid`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto h-full max-xl:flex-col max-xl:h-fit">
      <DashboardSidebar />
      <div className="w-full xl:p-14 p-4">
        <h1 className="text-4xl font-bold mb-8">Bulk Upload Produk</h1>

        {/* Instructions */}
        <div className="bg-[#E6E7EF] border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-[#01032F]">
            📋 Instruksi
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-[#01043D]">
            <li>Download the CSV template below</li>
            <li>
              Fill in your product data (title, price, manufacturer, stock,
              image URL, description, slug, categoryId, weight, code)
            </li>
            <li>Upload the completed CSV file</li>
            <li>Maximum file size: 5MB</li>
          </ul>
        </div>

        {/* Download Template Button */}
        {/* <div className="mb-6">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <FaDownload /> Download CSV Template
          </button>
        </div> */}
        
        {/* Merchant Selection */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <label
            htmlFor="merchant"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Pilih Merchant <span className="text-red-500">*</span>
          </label>

          <select
            id="merchant"
            value={selectedMerchantId}
            onChange={(e) => setSelectedMerchantId(e.target.value)}
            disabled={loadingMerchants || merchants.length === 0 || uploading}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            required
          >
            {loadingMerchants ? (
              <option value="">Loading merchants...</option>
            ) : merchants.length === 0 ? (
              <option value="">No merchants available</option>
            ) : (
              <>
                <option value="">-- Select a merchant --</option>
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.name}
                  </option>
                ))}
              </>
            )}
          </select>

          <p className="mt-2 text-sm text-gray-500">
            Semua produk baru dari file ini akan dikaitkan dengan merchant yang dipilih.
          </p>
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-[#E6E7EF]"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FaFileUpload className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">
              {file ? (
                <span className="font-semibold text-[#02054b]">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
              ) : (
                "Drag and drop CSV file here, or click to select"
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block bg-[#02054b] hover:bg-[#01043D] text-white font-bold py-2 px-6 rounded cursor-pointer transition-colors"
            >
              Select CSV File
            </label>
          </div>
        </div>

        {/* Upload Button */}
        {file && (
          <div className="mb-6">
            <button
              onClick={handleUpload}
              disabled={
                uploading ||
                loadingMerchants ||
                merchants.length === 0 ||
                !selectedMerchantId ||
                !file
              }
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-colors ${
                uploading ||
                loadingMerchants ||
                merchants.length === 0 ||
                !selectedMerchantId ||
                !file
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#02054b] hover:bg-[#01043D]"
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload Products"
              )}
            </button>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div
            className={`border-l-4 p-6 rounded-lg ${
              uploadResult.success
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500"
            }`}
          >
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <FaCheckCircle className="text-3xl text-green-500 flex-shrink-0 mt-1" />
              ) : (
                <FaTimesCircle className="text-3xl text-red-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    uploadResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {uploadResult.success
                    ? "✅ Upload Successful!"
                    : "❌ Upload Failed"}
                </h3>
                <p
                  className={`mb-3 ${
                    uploadResult.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {uploadResult.message}
                </p>

                {uploadResult.details && (
                  <div className="bg-white rounded p-4 space-y-2">
                    <p className="font-semibold">Upload Statistics:</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#02054b]">
                          {uploadResult.details.processed}
                        </p>
                        <p className="text-sm text-gray-600">Processed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {uploadResult.details.successful}
                        </p>
                        <p className="text-sm text-gray-600">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {uploadResult.details.failed}
                        </p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    </div>

                    {uploadResult.details.errors &&
                      uploadResult.details.errors.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold text-red-700 mb-2">
                            Errors:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-600 max-h-40 overflow-y-auto">
                            {uploadResult.details.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Format Guide */}
        <div className="mt-8 rounded-lg bg-gray-50 p-6">
  <h2 className="mb-4 text-2xl font-bold">
    📝 Excel Format Guide
  </h2>

  <p className="mb-4 text-sm text-gray-600">
    Upload produk menggunakan file Excel (.xlsx) dengan worksheet bernama{" "}
    <code className="rounded bg-gray-200 px-1 py-0.5">Template</code>.
    Gunakan template yang disediakan agar posisi kolom sesuai dengan
    format yang dibaca sistem.
  </p>

  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-300 bg-white text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 px-4 py-2 text-left">
            Column
          </th>
          <th className="border border-gray-300 px-4 py-2 text-left">
            Field
          </th>
          <th className="border border-gray-300 px-4 py-2 text-left">
            Required
          </th>
          <th className="border border-gray-300 px-4 py-2 text-left">
            Type
          </th>
          <th className="border border-gray-300 px-4 py-2 text-left">
            Description
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">A</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            ID PRODUK
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">String</td>
          <td className="border border-gray-300 px-4 py-2">
            Product code or identifier.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">B</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Kategori
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">String</td>
          <td className="border border-gray-300 px-4 py-2">
            Category name. The system uses the category name to identify the
            category.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">C</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Nama produk
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">String</td>
          <td className="border border-gray-300 px-4 py-2">
            Product name. Maximum 254 characters.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">F</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Nilai Variasi
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">String</td>
          <td className="border border-gray-300 px-4 py-2">
            Variant name or variation value for the product.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">G</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Deskripsi produk
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">String / HTML</td>
          <td className="border border-gray-300 px-4 py-2">
            Product description. HTML markup is converted to plain text.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">I</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Harga
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">Integer</td>
          <td className="border border-gray-300 px-4 py-2">
            Variant price. Must be a non-negative whole number, for example{" "}
            <code>150000</code>.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">M</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Berat paket
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">Integer</td>
          <td className="border border-gray-300 px-4 py-2">
            Package weight. Must be a non-negative whole number. Use the
            weight unit expected by the provided template.
          </td>
        </tr>

        <tr>
          <td className="border border-gray-300 px-4 py-2 font-mono">R</td>
          <td className="border border-gray-300 px-4 py-2 font-mono">
            Gambar Utama
          </td>
          <td className="border border-gray-300 px-4 py-2">✅ Yes</td>
          <td className="border border-gray-300 px-4 py-2">URL</td>
          <td className="border border-gray-300 px-4 py-2">
            Main product image URL. Must start with HTTP:// or HTTPS://.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
    <p className="mb-2 font-semibold">Important notes</p>
    <ul className="list-inside list-disc space-y-1">
      <li>
        Upload only Excel files with the <code>.xlsx</code> extension.
      </li>
      <li>
        The worksheet must be named <code>Template</code>.
      </li>
      <li>
        Product data starts from Excel row 6; keep the template header and
        layout unchanged.
      </li>
      <li>
        Do not move the required fields to different columns, even if the
        column headers appear similar.
      </li>
      <li>
        Price and weight must be non-negative whole numbers.
      </li>
      <li>
        The merchant is selected separately in the upload form, not from an
        Excel column.
      </li>
    </ul>
  </div>
</div>

        {/* Upload History */}
        <div className="mt-8">
          <BulkUploadHistory />
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPage;
