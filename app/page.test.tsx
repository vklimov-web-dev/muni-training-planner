import { render, screen } from "@testing-library/react";

import HomePage from "./page";

describe("HomePage", () => {
  it("shows the application purpose and snapshot date", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Přehled povinných školení" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1. 10. 2026")).toBeInTheDocument();
  });
});
