import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import withAuth from "../utils/WithAuth.jsx";
import { AuthContext } from "../contexts/AuthContext.jsx";

function History() {
  const { getHistoryOfUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const history = await getHistoryOfUser();
        if (active) setMeetings(Array.isArray(history) ? history : []);
      } catch (err) {
        if (err?.response?.status === 401) {
          logout();
          return;
        }
        if (active) setError("Could not load your meeting history.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => {
    const seen = new Set();
    return meetings.filter((meeting) => {
      const key = `${meeting.meetingCode}-${new Date(meeting.date).toDateString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [meetings]);

  const formatDate = (dateString) => new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));

  return (
    <main className="history-page">
      <header className="dashboard-nav shell">
        <button className="back-text-button" onClick={() => navigate("/home")}><ArrowBackRoundedIcon /> Dashboard</button>
        <div className="brand"><span className="brand-mark"><VideoCallRoundedIcon /></span><span>ApnaMeet</span></div>
        <div className="history-spacer" />
      </header>

      <section className="history-content shell">
        <div className="history-heading">
          <span className="section-kicker">ACTIVITY</span>
          <h1>Meeting history</h1>
          <p>Your latest room codes, ready whenever you want to jump back in.</p>
        </div>

        {loading && <div className="empty-state"><div className="loading-ring" /><p>Loading your meetings…</p></div>}
        {!loading && error && <div className="empty-state error-state"><p>{error}</p></div>}
        {!loading && !error && grouped.length === 0 && (
          <div className="empty-state"><HistoryRoundedIcon /><h2>No meetings yet</h2><p>Your joined rooms will appear here.</p><button className="button button-primary" onClick={() => navigate("/home")}>Start a meeting</button></div>
        )}

        {!loading && !error && grouped.length > 0 && (
          <div className="history-list">
            {grouped.map((meeting) => (
              <article className="history-item" key={meeting._id || `${meeting.meetingCode}-${meeting.date}`}>
                <span className="history-icon"><VideoCallRoundedIcon /></span>
                <div className="history-main"><strong>{meeting.meetingCode}</strong><small>{formatDate(meeting.date)}</small></div>
                <button onClick={() => navigate(`/meeting/${meeting.meetingCode}`)}>Rejoin <ArrowForwardRoundedIcon /></button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default withAuth(History);
