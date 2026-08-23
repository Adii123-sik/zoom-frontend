const server = (
  import.meta.env.VITE_SERVER_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export default server;