import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import App from "./App";

vi.mock("axios");

describe("App", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn> | null = null;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();

    // Keep test output clean; assertions should validate behavior.
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Default health-check stub to avoid console noise
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { timestamp: new Date().toISOString() },
    });
  });

  afterEach(() => {
    consoleLogSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
    consoleLogSpy = null;
    consoleErrorSpy = null;
  });

  it("renders login when not authenticated", () => {
    render(<App />);
    expect(screen.getByText("AI Compliance Analyzer")).toBeInTheDocument();
  });

  it("logs in via LoginPage and transitions to dashboard", async () => {
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        token: "t",
        user: { username: "admin", name: "Admin User" },
      },
    });

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => {
        if (url.endsWith("/health")) {
          return { data: { timestamp: new Date().toISOString() } };
        }
        if (url.endsWith("/documents")) {
          return { data: { documents: [] } };
        }
        return { data: {} };
      }
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "admin123" },
    });
    fireEvent.click(screen.getByText("Login"));

    await waitFor(() =>
      expect(screen.getByText("Uploaded Documents")).toBeInTheDocument()
    );
  });

  it("renders dashboard when authenticated and loads documents", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem(
      "user",
      JSON.stringify({ username: "admin", name: "Admin User" })
    );

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => {
        if (url.endsWith("/health")) {
          return { data: { timestamp: new Date().toISOString() } };
        }
        if (url.endsWith("/documents")) {
          return {
            data: {
              documents: [
                {
                  id: "1",
                  filename: "a.pdf",
                  size: 1024,
                  summary: "sum",
                  keyPoints: ["kp"],
                },
              ],
            },
          };
        }
        return { data: {} };
      }
    );

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("Uploaded Documents")).toBeInTheDocument()
    );
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
  });

  it("loads document details when selecting a document and allows logout", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem(
      "user",
      JSON.stringify({ username: "admin", name: "Admin User" })
    );

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => {
        if (url.endsWith("/health")) {
          return { data: { timestamp: new Date().toISOString() } };
        }
        if (url.endsWith("/documents")) {
          return {
            data: {
              documents: [
                {
                  id: "1",
                  filename: "a.pdf",
                  size: 1024,
                  summary: "sum",
                  keyPoints: ["kp"],
                },
              ],
            },
          };
        }
        if (url.endsWith("/documents/1")) {
          return {
            data: {
              document: {
                id: "1",
                filename: "a.pdf",
                size: 1024,
                summary: "sum",
                keyPoints: ["kp1", "kp2"],
                fullText: "FULL TEXT HERE",
              },
            },
          };
        }
        return { data: {} };
      }
    );

    render(<App />);

    await waitFor(() => expect(screen.getByText("a.pdf")).toBeInTheDocument());
    fireEvent.click(screen.getByText("a.pdf"));

    await waitFor(() =>
      expect(screen.getByText("Key Points")).toBeInTheDocument()
    );
    expect(screen.getByText("kp1")).toBeInTheDocument();

    // Expand full text accordion
    fireEvent.click(screen.getByText("Full Text"));
    await waitFor(() =>
      expect(screen.getByText("FULL TEXT HERE")).toBeInTheDocument()
    );

    // Logout
    fireEvent.click(screen.getByTitle("Logout"));
    await waitFor(() =>
      expect(screen.getByText("AI Compliance Analyzer")).toBeInTheDocument()
    );
  });

  it("handles document detail load failure gracefully", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem(
      "user",
      JSON.stringify({ username: "admin", name: "Admin User" })
    );

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => {
        if (url.endsWith("/health")) {
          return { data: { timestamp: new Date().toISOString() } };
        }
        if (url.endsWith("/documents")) {
          return {
            data: {
              documents: [
                {
                  id: "1",
                  filename: "a.pdf",
                  size: 1024,
                  summary: "sum",
                  keyPoints: ["kp"],
                },
              ],
            },
          };
        }
        if (url.endsWith("/documents/1")) {
          throw new Error("boom");
        }
        return { data: {} };
      }
    );

    render(<App />);

    await waitFor(() => expect(screen.getByText("a.pdf")).toBeInTheDocument());
    fireEvent.click(screen.getByText("a.pdf"));

    // Should not crash; still shows dashboard shell
    await waitFor(() =>
      expect(screen.getByText("Uploaded Documents")).toBeInTheDocument()
    );
  });

  it("adds a document to the list after successful upload", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem(
      "user",
      JSON.stringify({ username: "admin", name: "Admin User" })
    );

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => {
        if (url.endsWith("/health")) {
          return { data: { timestamp: new Date().toISOString() } };
        }
        if (url.endsWith("/documents")) {
          return { data: { documents: [] } };
        }
        return { data: {} };
      }
    );

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        message: "ok",
        document: {
          id: "new-1",
          filename: "new.pdf",
          size: 10,
          summary: "sum",
          keyPoints: [],
        },
      }),
    }));
    // @ts-expect-error test mock
    global.fetch = fetchMock;

    render(<App />);

    // Trigger UploadCard file change
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "new.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("new.pdf")).toBeInTheDocument()
    );
  });
});
