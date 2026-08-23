import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { AuthContext } from "../contexts/AuthContext.jsx";

/* =========================================================
   API ERROR MESSAGE
========================================================= */

const getApiError = (error) =>
  error?.response?.data?.message ||
  (error?.code === "ECONNABORTED"
    ? "Server response timed out. Please check that the backend is running."
    : "Could not connect to the server. Please try again.");

/* =========================================================
   AUTHENTICATION COMPONENT
========================================================= */

export default function Authentication() {
  const { handleRegister, handleLogin } = useContext(AuthContext);

  const navigate = useNavigate();

  /* ===============================
     STATES
  =============================== */

  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);

    return params.get("mode") === "register"
      ? "register"
      : "login";
  });

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isRegister = mode === "register";

  /* ===============================
     PAGE CONTENT
  =============================== */

  const title = useMemo(
    () =>
      isRegister
        ? "Create your account"
        : "Welcome back",
    [isRegister]
  );

  const subtitle = isRegister
    ? "Create your ApnaMeet account and start connecting."
    : "Sign in to continue to ApnaMeet.";

  /* ===============================
     SWITCH LOGIN / REGISTER
  =============================== */

  const switchMode = (nextMode) => {
    setMode(nextMode);

    setError("");
    setSuccess("");
    setPassword("");

    const url =
      nextMode === "register"
        ? "/auth?mode=register"
        : "/auth";

    window.history.replaceState(
      {},
      "",
      url
    );
  };

  /* ===============================
     SUBMIT
  =============================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    /* REGISTER VALIDATION */

    if (
      isRegister &&
      name.trim().length < 2
    ) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    /* USERNAME VALIDATION */

    if (username.trim().length < 3) {
      setError(
        "Username must be at least 3 characters."
      );
      return;
    }

    /* PASSWORD VALIDATION */

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      /* REGISTER */

      if (isRegister) {
        const result =
          await handleRegister(
            name.trim(),
            username.trim(),
            password
          );

        setSuccess(
          result?.message ||
            "Account created successfully. Please sign in."
        );

        setMode("login");

        window.history.replaceState(
          {},
          "",
          "/auth"
        );

        setPassword("");
      }

      /* LOGIN */

      else {
        await handleLogin(
          username.trim(),
          password
        );
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        position: "relative",

        px: {
          xs: 2,
          sm: 3,
        },

        py: 4,

        boxSizing: "border-box",

        backgroundImage: `
          linear-gradient(
            rgba(248, 249, 255, 0.68),
            rgba(248, 249, 255, 0.68)
          ),
          url("/login-bg.png")
        `,

        backgroundSize: "cover",

        backgroundPosition: "center",

        backgroundRepeat: "no-repeat",
      }}
    >
      {/* =========================================
          BACK BUTTON
      ========================================= */}

      <IconButton
        onClick={() => navigate("/")}
        aria-label="Back to home"
        sx={{
          position: "absolute",

          top: {
            xs: 18,
            sm: 28,
          },

          left: {
            xs: 18,
            sm: 28,
          },

          width: 46,
          height: 46,

          backgroundColor:
            "rgba(255,255,255,0.92)",

          border:
            "1px solid rgba(15,23,42,0.08)",

          boxShadow:
            "0 8px 30px rgba(15,23,42,0.08)",

          backdropFilter: "blur(10px)",

          "&:hover": {
            backgroundColor: "#ffffff",
            transform: "translateX(-2px)",
          },

          transition: "0.25s ease",
        }}
      >
        <ArrowBackRoundedIcon />
      </IconButton>

      {/* =========================================
          AUTH CARD
      ========================================= */}

      <Box
        sx={{
          width: "100%",
          maxWidth: 470,

          backgroundColor:
            "rgba(255,255,255,0.94)",

          borderRadius: "26px",

          padding: {
            xs: "28px 22px",
            sm: "36px 38px 32px",
          },

          border:
            "1px solid rgba(255,255,255,0.85)",

          boxShadow:
            "0 30px 80px rgba(69,63,180,0.14)",

          backdropFilter: "blur(18px)",
        }}
      >
        {/* =====================================
            LOGO
        ===================================== */}

        <Box
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: 1.2,

            cursor: "pointer",

            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: "13px",

              color: "#ffffff",

              background:
                "linear-gradient(135deg, #5366ff 0%, #8b3cf6 100%)",

              boxShadow:
                "0 10px 25px rgba(99,78,246,0.28)",
            }}
          >
            <VideoCallRoundedIcon
              sx={{ fontSize: 25 }}
            />
          </Box>

          <Typography
            sx={{
              fontWeight: 800,

              fontSize: {
                xs: "23px",
                sm: "25px",
              },

              color: "#11182c",

              letterSpacing: "-0.5px",
            }}
          >
            ApnaMeet
          </Typography>
        </Box>

        {/* =====================================
            TABS
        ===================================== */}

        <Box
          sx={{
            display: "flex",

            padding: "5px",

            backgroundColor: "#f2f4f8",

            borderRadius: "14px",

            mb: 4,
          }}
        >
          {/* LOGIN TAB */}

          <Button
            type="button"
            onClick={() =>
              switchMode("login")
            }
            sx={{
              flex: 1,

              minHeight: 46,

              borderRadius: "11px",

              textTransform: "none",

              fontWeight: 700,

              fontSize: "14px",

              color:
                mode === "login"
                  ? "#563cff"
                  : "#697386",

              backgroundColor:
                mode === "login"
                  ? "#ffffff"
                  : "transparent",

              boxShadow:
                mode === "login"
                  ? "0 5px 18px rgba(15,23,42,0.07)"
                  : "none",

              "&:hover": {
                backgroundColor:
                  mode === "login"
                    ? "#ffffff"
                    : "rgba(255,255,255,0.45)",
              },
            }}
          >
            Sign in
          </Button>

          {/* REGISTER TAB */}

          <Button
            type="button"
            onClick={() =>
              switchMode("register")
            }
            sx={{
              flex: 1,

              minHeight: 46,

              borderRadius: "11px",

              textTransform: "none",

              fontWeight: 700,

              fontSize: "14px",

              color:
                mode === "register"
                  ? "#563cff"
                  : "#697386",

              backgroundColor:
                mode === "register"
                  ? "#ffffff"
                  : "transparent",

              boxShadow:
                mode === "register"
                  ? "0 5px 18px rgba(15,23,42,0.07)"
                  : "none",

              "&:hover": {
                backgroundColor:
                  mode === "register"
                    ? "#ffffff"
                    : "rgba(255,255,255,0.45)",
              },
            }}
          >
            Create account
          </Button>
        </Box>

        {/* =====================================
            HEADING
        ===================================== */}

        <Box
          sx={{
            mb: 3,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: {
                xs: "28px",
                sm: "32px",
              },

              fontWeight: 800,

              letterSpacing: "-1px",

              color: "#11182c",

              lineHeight: 1.15,

              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              fontSize: "14px",

              color: "#748096",

              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.2,

              borderRadius: "12px",

              fontSize: "13px",
            }}
          >
            {error}
          </Alert>
        )}

        {/* =====================================
            SUCCESS
        ===================================== */}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2.2,

              borderRadius: "12px",

              fontSize: "13px",
            }}
          >
            {success}
          </Alert>
        )}

        {/* =====================================
            FORM
        ===================================== */}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",

            gap: 2.2,
          }}
        >
          {/* FULL NAME */}

          {isRegister && (
            <TextField
              label="Full name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              fullWidth
              autoComplete="name"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineRoundedIcon
                      sx={{
                        color: "#8b94a7",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
          )}

          {/* USERNAME */}

          <TextField
            label="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            fullWidth
            autoComplete="username"
            autoFocus={!isRegister}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineRoundedIcon
                    sx={{
                      color: "#8b94a7",
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={inputStyles}
          />

          {/* PASSWORD */}

          <TextField
            label="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            type={
              showPassword
                ? "text"
                : "password"
            }
            fullWidth
            autoComplete={
              isRegister
                ? "new-password"
                : "current-password"
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon
                    sx={{
                      color: "#8b94a7",
                    }}
                  />
                </InputAdornment>
              ),

              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    edge="end"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={inputStyles}
          />

          {/* =================================
              SUBMIT BUTTON
          ================================= */}

          <Button
            variant="contained"
            type="submit"
            disabled={loading}
            disableElevation
            sx={{
              mt: 0.5,

              height: 52,

              borderRadius: "13px",

              textTransform: "none",

              fontSize: "15px",

              fontWeight: 700,

              color: "#ffffff",

              background:
                "linear-gradient(90deg, #5366ff 0%, #8e32ea 100%)",

              boxShadow:
                "0 14px 30px rgba(99,78,246,0.25)",

              transition:
                "0.25s ease",

              "&:hover": {
                background:
                  "linear-gradient(90deg, #485afa 0%, #8126df 100%)",

                transform:
                  "translateY(-1px)",

                boxShadow:
                  "0 17px 35px rgba(99,78,246,0.32)",
              },

              "&.Mui-disabled": {
                color:
                  "rgba(255,255,255,0.85)",

                background:
                  "linear-gradient(90deg, #8994ff, #ba84ed)",
              },
            }}
          >
            {loading ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </Button>
        </Box>

        {/* =====================================
            SWITCH ACCOUNT TYPE
        ===================================== */}

        <Typography
          component="div"
          sx={{
            mt: 3,

            textAlign: "center",

            color: "#8a94a7",

            fontSize: "13px",
          }}
        >
          {isRegister
            ? "Already have an account?"
            : "New to ApnaMeet?"}

          <Button
            type="button"
            onClick={() =>
              switchMode(
                isRegister
                  ? "login"
                  : "register"
              )
            }
            sx={{
              textTransform: "none",

              minWidth: "auto",

              padding: "0 0 0 5px",

              fontSize: "13px",

              fontWeight: 700,

              color: "#6247f5",

              "&:hover": {
                background:
                  "transparent",

                textDecoration:
                  "underline",
              },
            }}
          >
            {isRegister
              ? "Sign in"
              : "Create one"}
          </Button>
        </Typography>
      </Box>
    </Box>
  );
}

/* =========================================================
   INPUT STYLE
========================================================= */

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    minHeight: "56px",

    borderRadius: "13px",

    backgroundColor:
      "rgba(255,255,255,0.85)",

    transition: "0.2s ease",

    "& fieldset": {
      borderColor: "#dfe4ec",
    },

    "&:hover fieldset": {
      borderColor: "#a7afff",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#6655f7",
      borderWidth: "1.5px",
    },

    "&.Mui-focused": {
      boxShadow:
        "0 0 0 4px rgba(101,85,247,0.08)",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#687386",

    "&.Mui-focused": {
      color: "#6655f7",
    },
  },
};