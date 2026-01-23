const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const testApi = async () => {
  try {
    const res = await fetch(`${backendUrl}/api/test`);
    console.log("ressss",res)
    const data = await res.json();
    console.log("dataaaa",data)

    return data;
  } catch (err) {
    console.error("API Error:", err);
  }
};
