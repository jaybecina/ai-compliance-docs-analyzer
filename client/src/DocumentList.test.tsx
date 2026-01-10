import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DocumentList from "./DocumentList";

describe("DocumentList", () => {
  it("renders documents and calls onSelect", () => {
    const onSelect = vi.fn();
    render(
      <DocumentList
        documents={[
          { id: "1", filename: "a.pdf", size: 1024, summary: "sum a" },
          { id: "2", filename: "b.pdf", size: 2048, summary: "sum b" },
        ]}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("a.pdf"));
    expect(onSelect).toHaveBeenCalledWith({ id: "1", filename: "a.pdf" });
  });

  it("shows size when summary missing", () => {
    const onSelect = vi.fn();
    render(
      <DocumentList
        documents={[{ id: "1", filename: "a.pdf", size: 2048 }]}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("2 KB")).toBeInTheDocument();
  });
});
