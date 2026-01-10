import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  Snackbar,
  TextField,
  Typography,
  Alert,
  Divider,
  Chip,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"demo" | "analyst" | "admin">("demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "register" ? "register" : "login";
      const payload =
        mode === "register"
          ? { username, password, name: name || undefined, role }
          : { username, password };

      const response = await axios.post(`${API_URL}/auth/${endpoint}`, payload);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        onLogin();
      }
    } catch (err: unknown) {
      const maybeAxiosErr = err as { response?: { data?: { error?: string } } };
      setError(
        maybeAxiosErr.response?.data?.error ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100%",
          px: 2,
          py: 3,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 450,
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 600,
                mb: 1,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              AI Compliance Analyzer
            </Typography>
            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Analyze documents with AI-powered insights
            </Typography>

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <>
                  <TextField
                    label="Name"
                    fullWidth
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    select
                    label="Role"
                    fullWidth
                    margin="normal"
                    value={role}
                    onChange={(e) =>
                      setRole(
                        (e.target.value as "demo" | "analyst" | "admin") ??
                          "demo"
                      )
                    }
                    disabled={loading}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="demo">Demo</MenuItem>
                    <MenuItem value="analyst">Analyst</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </TextField>
                </>
              )}

              <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {mode === "register"
                  ? loading
                    ? "Creating account..."
                    : "Create Account"
                  : loading
                  ? "Logging in..."
                  : "Login"}
              </Button>
            </form>

            <Button
              variant="text"
              size="small"
              disabled={loading}
              onClick={() => {
                setError("");
                setMode((m) => (m === "login" ? "register" : "login"));
              }}
              sx={{ mt: 1, textTransform: "none" }}
            >
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Back to login"}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Chip label="Demo Accounts" size="small" />
            </Divider>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Test Credentials:
              </Typography>
              <Typography variant="caption" component="div">
                • <strong>admin</strong> / admin123
              </Typography>
              <Typography variant="caption" component="div">
                • <strong>analyst</strong> / analyst123
              </Typography>
              <Typography variant="caption" component="div">
                • <strong>demo</strong> / demo123
              </Typography>
            </Alert>

            <Typography
              variant="caption"
              align="center"
              display="block"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              Note: This is a demo application with mock authentication
            </Typography>
          </CardContent>
        </Card>

        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setError("")}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}
