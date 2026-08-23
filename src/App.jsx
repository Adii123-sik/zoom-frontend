import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Authentication from "./pages/Authentication.jsx";
import History from "./pages/History.jsx";
import VideoMeet from "./pages/VedioMeet.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/home" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/meeting/:meetingCode" element={<VideoMeet />} />
        <Route path="/:meetingCode" element={<VideoMeet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
