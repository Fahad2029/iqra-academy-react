const env = import.meta.env || {};
const backendUrl = env.VITE_API_URL || env.VITE_BACKEND_URL || "";

export const testApi = async () => {
  try {
    if (!backendUrl) {
      throw new Error("Missing VITE_API_URL or VITE_BACKEND_URL in environment");
    }
    const res = await fetch(`${backendUrl}/api/test`);
    console.log("ressss", res);
    const data = await res.json();
    console.log("dataaaa", data);

    return data;
  } catch (err) {
    console.error("API Error:", err);
  }
};
