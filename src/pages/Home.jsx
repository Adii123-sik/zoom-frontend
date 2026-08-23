import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import withAuth from "../utils/WithAuth.jsx";
import { AuthContext } from "../contexts/AuthContext.jsx";

const sanitizeCode = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
const randomCode = () => {
  const suffix = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `meet-${suffix}`;
};

function HomeComponent() {
  const navigate = useNavigate();
  const { userData, logout, addToUserHistory } = useContext(AuthContext);
  const [meetingCode, setMeetingCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const firstName = useMemo(() => userData?.name?.split(" ")?.[0] || "there", [userData]);

  const enterMeeting = async (code) => {
    const cleanCode = sanitizeCode(code.trim());
    if (!cleanCode) {
      setError("Please enter a valid meeting code.");
      return;
    }

    try {
      await addToUserHistory(cleanCode);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        return;
      }
    }

    navigate(`/meeting/${cleanCode}`);
  };

  const createMeeting = async () => {
    const code = randomCode();
    setMeetingCode(code);
    await enterMeeting(code);
  };

  const copyCode = async () => {
    if (!meetingCode) return;
    await navigator.clipboard.writeText(meetingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-nav shell">
        <div className="brand"><span className="brand-mark"><VideoCallRoundedIcon /></span><span>ApnaMeet</span></div>
        <div className="dashboard-nav-right">
          <button className="icon-text-button" onClick={() => navigate("/history")}><HistoryRoundedIcon /> History</button>
          <div className="user-pill"><span>{(userData?.name || "U").charAt(0).toUpperCase()}</span><div><strong>{userData?.name || "User"}</strong><small>@{userData?.username || "member"}</small></div></div>
          <button className="round-button" onClick={logout} aria-label="Logout"><LogoutRoundedIcon /></button>
        </div>
      </header>

      <section className="dashboard-content shell">
        <div className="welcome-block">
          <span className="section-kicker">YOUR MEETING SPACE</span>
          <h1>Good to see you, {firstName}.</h1>
          <p>Start a fresh room or join a conversation using a meeting code.</p>
        </div>

        <div className="dashboard-grid">
          <article className="quick-card primary-quick-card">
            <div className="quick-card-icon"><VideoCallRoundedIcon /></div>
            <div>
              <span className="card-kicker">HOST</span>
              <h2>Start a new meeting</h2>
              <p>Generate a private room instantly and invite anyone with the code.</p>
            </div>
            <button className="button button-white" onClick={createMeeting}><AddRoundedIcon /> New meeting</button>
          </article>

          <article className="quick-card join-card">
            <div className="quick-card-icon soft"><ArrowForwardRoundedIcon /></div>
            <div>
              <span className="card-kicker">JOIN</span>
              <h2>Enter a meeting code</h2>
              <p>Paste the code sent by your host to join the same room.</p>
            </div>
            <div className="join-row">
              <input value={meetingCode} onChange={(e) => { setMeetingCode(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && enterMeeting(meetingCode)} placeholder="meeting-code" />
              {meetingCode && <button className="copy-mini" onClick={copyCode} aria-label="Copy code"><ContentCopyRoundedIcon /></button>}
              <button onClick={() => enterMeeting(meetingCode)}>Join</button>
            </div>
            {error && <p className="field-error">{error}</p>}
            {copied && <small className="copied-note">Code copied</small>}
          </article>
        </div>

        <div className="dashboard-lower-grid">
          <article className="info-card">
            <span className="info-icon"><CalendarMonthRoundedIcon /></span>
            <div><strong>Meeting history</strong><p>Rejoin recent room codes from your activity list.</p></div>
            <button onClick={() => navigate("/history")}>Open history <ArrowForwardRoundedIcon /></button>
          </article>
          <article className="info-card">
            <span className="info-icon"><GroupsRoundedIcon /></span>
            <div><strong>Guest-friendly rooms</strong><p>People you invite can join without creating an account.</p></div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default withAuth(HomeComponent);
