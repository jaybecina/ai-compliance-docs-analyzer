import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import axios from "axios";
import LoginPage from "./LoginPage";

vi.mock("axios");

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("logs in and stores token/user", async () => {
    const onLogin = vi.fn();
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        token: "mock-token",
        user: { username: "admin", name: "Admin User" },
      },
    });

    render(<LoginPage onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "admin123" },
    });

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBe("mock-token");
    expect(JSON.parse(localStorage.getItem("user") || "{}").username).toBe(
      "admin"
    );
  });

  it("registers and stores token/user", async () => {
    const onLogin = vi.fn();
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        token: "mock-token",
        user: { username: "newuser", name: "New User", role: "demo" },
      },
    });

    render(<LoginPage onLogin={onLogin} />);

    fireEvent.click(screen.getByText(/New here\? Create an account/i));

    fireEvent.change(screen.getByLabelText(/^Name$/i), {
      target: { value: "New User" },
    });
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());
    expect(axios.post).toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe("mock-token");
    expect(JSON.parse(localStorage.getItem("user") || "{}").username).toBe(
      "newuser"
    );
  });

  it("shows error on invalid credentials", async () => {
    const onLogin = vi.fn();
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { error: "Invalid" } },
    });

    render(<LoginPage onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() =>
      expect(screen.getByText("Invalid")).toBeInTheDocument()
    );

    // Close the MUI Alert (covers the Alert onClose handler)
    const errorAlert = screen.getByText("Invalid").closest('[role="alert"]');
    expect(errorAlert).toBeTruthy();
    const closeButton = within(errorAlert as HTMLElement).getByRole("button", {
      name: /close/i,
    });
    fireEvent.click(closeButton);

    await waitFor(() =>
      expect(screen.queryByText("Invalid")).not.toBeInTheDocument()
    );
  });

  it("falls back to default error message when server provides none", async () => {
    const onLogin = vi.fn();
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("nope")
    );

    render(<LoginPage onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() =>
      expect(
        screen.getByText("Invalid credentials. Please try again.")
      ).toBeInTheDocument()
    );
  });
});
