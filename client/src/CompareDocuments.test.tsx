import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import axios from "axios";
import CompareDocuments from "./CompareDocuments";

vi.mock("axios");

describe("CompareDocuments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows info when fewer than 2 docs", () => {
    render(
      <CompareDocuments
        documents={[{ id: "1", filename: "a.pdf", summary: "s" }]}
      />
    );
    expect(
      screen.getByText(/Upload at least 2 documents/i)
    ).toBeInTheDocument();
  });

  it("compares two docs and renders analysis", async () => {
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        comparison: {
          documentA: { id: "1", filename: "a.pdf" },
          documentB: { id: "2", filename: "b.pdf" },
          analysis: "A vs B analysis",
        },
      },
    });

    render(
      <CompareDocuments
        documents={[
          { id: "1", filename: "a.pdf", summary: "s" },
          { id: "2", filename: "b.pdf", summary: "s" },
        ]}
      />
    );

    fireEvent.mouseDown(screen.getByText("Select first document"));
    {
      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("a.pdf"));
    }

    fireEvent.mouseDown(screen.getByText("Select second document"));
    {
      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("b.pdf"));
    }

    fireEvent.click(screen.getByText("Analyze Gap & Compare"));

    await waitFor(() =>
      expect(screen.getByText(/A vs B analysis/)).toBeInTheDocument()
    );
  });

  it("shows error when selecting the same document", async () => {
    render(
      <CompareDocuments
        documents={[
          { id: "1", filename: "a.pdf", summary: "s" },
          { id: "2", filename: "b.pdf", summary: "s" },
        ]}
      />
    );

    fireEvent.mouseDown(screen.getByText("Select first document"));
    {
      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("a.pdf"));
    }

    fireEvent.mouseDown(screen.getByText("Select second document"));
    {
      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("a.pdf"));
    }

    fireEvent.click(screen.getByText("Analyze Gap & Compare"));

    await waitFor(() =>
      expect(
        screen.getByText("Please select different documents")
      ).toBeInTheDocument()
    );
  });

  it("shows backend error message", async () => {
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { error: "Nope" } },
    });

    render(
      <CompareDocuments
        documents={[
          { id: "1", filename: "a.pdf", summary: "s" },
          { id: "2", filename: "b.pdf", summary: "s" },
        ]}
      />
    );

    fireEvent.mouseDown(screen.getByText("Select first document"));
    {
      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("a.pdf"));
    }

    fireEvent.mouseDown(screen.getByText("Select second document"));
    {
      const listbox = screen.getByRole("listbox");
      fireEvent.click(within(listbox).getByText("b.pdf"));
    }

    fireEvent.click(screen.getByText("Analyze Gap & Compare"));

    await waitFor(() => expect(screen.getByText("Nope")).toBeInTheDocument());
  });
});
