import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QnABox from "./QnABox";

describe("QnABox", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("asks a question and renders answer + sources", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ answer: "Use PPE.", sources: 2 }),
    }));

    // @ts-expect-error test mock
    global.fetch = fetchMock;

    render(<QnABox docId="doc1" />);

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "What PPE?" },
    });

    fireEvent.click(screen.getByText("Ask"));

    await waitFor(() =>
      expect(screen.getByText(/Answer:/)).toBeInTheDocument()
    );
    expect(screen.getByText("Sources used: 2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("shows an error on failed request", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false }));
    // @ts-expect-error test mock
    global.fetch = fetchMock;

    render(<QnABox docId="doc1" />);

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "?" },
    });
    fireEvent.click(screen.getByText("Ask"));

    await waitFor(() =>
      expect(screen.getByText("Q&A failed")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() =>
      expect(screen.queryByText("Q&A failed")).not.toBeInTheDocument()
    );
  });

  it("does not render sources when sources is not a number", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ answer: "Ok", sources: "two" }),
    }));

    // @ts-expect-error test mock
    global.fetch = fetchMock;

    render(<QnABox docId="doc1" />);

    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "?" },
    });

    fireEvent.click(screen.getByText("Ask"));

    await waitFor(() =>
      expect(screen.getByText(/Answer:/)).toBeInTheDocument()
    );
    expect(screen.queryByText(/Sources used:/)).not.toBeInTheDocument();
  });

  it("does not call fetch when question is empty", () => {
    const fetchMock = vi.fn();
    // @ts-expect-error test mock
    global.fetch = fetchMock;

    render(<QnABox docId="doc1" />);
    const askButton = screen.getByText("Ask") as HTMLButtonElement;
    expect(askButton).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
