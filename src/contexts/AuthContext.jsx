import axios from "axios";
import { createContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
  timeout: 15000,
});

const readStoredUser = () => {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(readStoredUser);
  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    const { data } = await client.post("/register", { name, username, password });
    return data;
  };

  const handleLogin = async (username, password) => {
    const { data } = await client.post("/login", { username, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUserData(data.user);
    navigate("/home", { replace: true });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserData(null);
    navigate("/auth", { replace: true });
  };

  const getHistoryOfUser = async () => {
    const { data } = await client.get("/get_all_activity", {
      params: { token: localStorage.getItem("token") },
    });
    return data;
  };

  const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const { data } = await client.post("/add_to_activity", {
      token,
      meeting_code: meetingCode,
    });
    return data;
  };

  const value = useMemo(
    () => ({
      userData,
      setUserData,
      handleRegister,
      handleLogin,
      logout,
      getHistoryOfUser,
      addToUserHistory,
    }),
    [userData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
