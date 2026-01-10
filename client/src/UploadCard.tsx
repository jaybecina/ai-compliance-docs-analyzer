import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Typography,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface UploadProps {
  onUploadSuccess: (doc: {
    id: string;
    filename: string;
    size: number;
    summary: string;
    keyPoints?: string[];
  }) => void;
}

export default function UploadCard({ onUploadSuccess }: UploadProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      // Backend returns { message, document }
      if (!data?.document?.id) throw new Error("Unexpected upload response");
      onUploadSuccess(data.document);
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setLoading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upload Compliance Document (PDF)
        </Typography>
        <input
          type="file"
          accept="application/pdf"
          ref={fileInput}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => fileInput.current?.click()}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Upload PDF"}
        </Button>
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
