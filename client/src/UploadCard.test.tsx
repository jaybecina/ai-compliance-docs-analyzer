import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadCard from "./UploadCard";

describe("UploadCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads a PDF and calls onUploadSuccess", async () => {
    const onUploadSuccess = vi.fn();

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        message: "Document processed successfully",
        document: {
          id: "doc1",
          filename: "test.pdf",
          size: 1024,
          summary: "sum",
          keyPoints: ["kp"],
        },
      }),
    }));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadCard onUploadSuccess={onUploadSuccess} />);

    // hidden input exists
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(["%PDF-1.4"], "test.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalled();
  });

  it("shows error on failed upload", async () => {
    const onUploadSuccess = vi.fn();

    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "nope" }),
    }));

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadCard onUploadSuccess={onUploadSuccess} />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "test.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      // Snackbar message is rendered in DOM
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() =>
      expect(screen.queryByText("Upload failed")).not.toBeInTheDocument()
    );
  });

  it("clicking the upload button triggers the hidden file input", () => {
    const onUploadSuccess = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});

    render(<UploadCard onUploadSuccess={onUploadSuccess} />);

    fireEvent.click(screen.getByText("Upload PDF"));
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
  });

  it("does nothing when no file selected", async () => {
    const onUploadSuccess = vi.fn();
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadCard onUploadSuccess={onUploadSuccess} />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it("shows error when upload response is unexpected", async () => {
    const onUploadSuccess = vi.fn();

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ message: "ok" }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadCard onUploadSuccess={onUploadSuccess} />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["%PDF-1.4"], "test.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Unexpected upload response")
      ).toBeInTheDocument();
    });
  });
});
