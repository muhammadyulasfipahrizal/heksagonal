async function getAddresses() {
  setLoading(true);
  setMessage("");

  try {
    const response = await addressApi.get("/");

    const addressList = response?.addresses;

    if (!Array.isArray(addressList)) {
      setAddresses([]);
      setMessage("Respons API tidak valid.");
      return;
    }

    setAddresses(addressList);
    setMessage(
      `GET berhasil: ${addressList.length} alamat ditemukan.`
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    setMessage(`GET gagal: ${message}`);
  } finally {
    setLoading(false);
  }
}