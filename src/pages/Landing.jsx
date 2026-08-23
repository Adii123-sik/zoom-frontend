import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ScreenShareRoundedIcon from "@mui/icons-material/ScreenShareRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

const sanitizeCode = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);

export default function LandingPage() {
  const navigate = useNavigate();
  const [guestCode, setGuestCode] = useState("");
  const [error, setError] = useState("");

  const joinGuest = (event) => {
    event.preventDefault();
    const code = sanitizeCode(guestCode.trim());
    if (!code) {
      setError("Enter a meeting code to join.");
      return;
    }
    navigate(`/meeting/${code}?guest=1`);
  };

  return (
    <main className="landing-page">
      <nav className="landing-nav shell">
        <Link to="/" className="brand">
          <span className="brand-mark"><VideoCallRoundedIcon /></span>
          <span>ApnaMeet</span>
        </Link>

        <div className="landing-nav-actions">
          <Link className="nav-link" to="/auth">Sign in</Link>
          <Link className="button button-primary button-small" to="/auth?mode=register">Get started</Link>
        </div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><BoltRoundedIcon /> Instant video meetings</div>
          <h1>One click closer to <span>everyone who matters.</span></h1>
          <p className="hero-subtitle">Create reliable video rooms, share your screen and keep the conversation moving with live chat—without a complicated setup.</p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/auth">
              Start a meeting <ArrowForwardRoundedIcon />
            </Link>
            <a className="button button-secondary" href="#guest-join">Join as guest</a>
          </div>

          <div className="hero-trust-row">
            <div className="avatar-stack"><span>A</span><span>R</span><span>M</span><span>+</span></div>
            <p><strong>Built for real conversations</strong><br />Fast rooms. Clean interface. Zero clutter.</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Video meeting preview">
          <div className="meeting-mockup">
            <div className="mockup-topbar">
              <span className="mockup-dot red" /><span className="mockup-dot yellow" /><span className="mockup-dot green" />
              <span className="mockup-room">team-sync-24</span>
              <span className="mockup-live">LIVE</span>
            </div>
            <div className="mockup-grid">
              <div className="mock-person mock-person-one"><span>AY</span><small>Aryan</small></div>
              <div className="mock-person mock-person-two"><span>NP</span><small>Neha</small></div>
              <div className="mock-person mock-person-three"><span>RS</span><small>Riya</small></div>
              <div className="mock-person mock-person-four"><span>VK</span><small>Vikram</small></div>
            </div>
            <div className="mockup-controls"><span>●</span><span>◉</span><span className="hangup">⌁</span><span>▣</span><span>•••</span></div>
          </div>
          <div className="floating-card floating-card-top"><SecurityRoundedIcon /><span><strong>Secure room</strong><small>Private meeting space</small></span></div>
          <div className="floating-card floating-card-bottom"><ChatBubbleRoundedIcon /><span><strong>Live chat</strong><small>Messages stay in sync</small></span></div>
        </div>
      </section>

      <section className="feature-strip shell">
        <article><span><VideoCallRoundedIcon /></span><div><strong>HD-ready calls</strong><small>Camera and microphone controls</small></div></article>
        <article><span><ScreenShareRoundedIcon /></span><div><strong>Screen sharing</strong><small>Present a tab or your entire screen</small></div></article>
        <article><span><ChatBubbleRoundedIcon /></span><div><strong>In-call chat</strong><small>Share quick notes while you talk</small></div></article>
      </section>

      <section id="guest-join" className="guest-section shell">
        <div>
          <span className="section-kicker">HAVE A CODE?</span>
          <h2>Jump straight into the room.</h2>
          <p>No account needed for guests. Enter the meeting code shared by the host.</p>
        </div>
        <form className="guest-form" onSubmit={joinGuest}>
          <div className="guest-input-wrap">
            <input value={guestCode} onChange={(e) => { setGuestCode(e.target.value); setError(""); }} placeholder="e.g. design-sync-24" aria-label="Meeting code" />
            <button type="submit">Join meeting <ArrowForwardRoundedIcon /></button>
          </div>
          {error && <p className="field-error">{error}</p>}
        </form>
      </section>
    </main>
  );
}
