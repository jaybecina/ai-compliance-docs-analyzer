import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface QnAProps {
  docId?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function QnABox({ docId }: QnAProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources(null);
    try {
      const res = await fetch(`${API_URL}/qa/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, docId }),
      });
      if (!res.ok) throw new Error("Q&A failed");
      const data = await res.json();
      setAnswer(data.answer);
      if (typeof data.sources === "number") setSources(data.sources);
    } catch (err: any) {
      setError(err.message || "Q&A error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Ask a Question
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Your question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            fullWidth
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleAsk}
            disabled={loading || !question}
          >
            {loading ? <CircularProgress size={24} /> : "Ask"}
          </Button>
        </Box>
        {answer && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            <b>Answer:</b> {answer}
          </Typography>
        )}
        {answer && sources !== null && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Sources used: {sources}
          </Typography>
        )}
        <Snackbar
          open={!!error}
          autoHideDuration={3000}
          onClose={() => setError("")}
          message={error}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setError("")}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
      </CardContent>
    </Card>
  );
}
