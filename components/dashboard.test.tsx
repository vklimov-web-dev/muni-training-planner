import { fireEvent, render, screen, within } from "@testing-library/react";

import { Dashboard, type DashboardViewModel } from "./dashboard";

const data: DashboardViewModel = {
  asOf: "2026-10-01T00:00:00.000Z",
  summary: {
    employees: 2,
    employeesRequiringAction: 1,
    requirements: 2,
    byStatus: { MISSING: 1, EXPIRED: 0, EXPIRING: 0, VALID: 1 },
  },
  items: [
    {
      employeeId: "E1",
      firstName: "Jana",
      lastName: "Nová",
      unit: "Knihovna",
      position: "Knihovnice",
      trainingCode: "KYBER",
      trainingName: "Kybernetická bezpečnost",
      status: "MISSING",
      completedAt: null,
      validUntil: null,
      daysUntilExpiry: null,
    },
    {
      employeeId: "E2",
      firstName: "Petr",
      lastName: "Malý",
      unit: "IT oddělení",
      position: "Vývojář",
      trainingCode: "KYBER",
      trainingName: "Kybernetická bezpečnost",
      status: "VALID",
      completedAt: "2026-01-10T00:00:00.000Z",
      validUntil: "2027-01-10T00:00:00.000Z",
      daysUntilExpiry: 101,
    },
  ],
  sessions: [
    {
      id: "T1",
      trainingCode: "KYBER",
      trainingName: "Kybernetická bezpečnost",
      date: "2026-10-14T00:00:00.000Z",
      timeRange: "09:00-12:00",
      location: "Aula A",
      capacity: 25,
      occupied: 22,
      availableSeats: 3,
      recommendations: [
        {
          employeeId: "E1",
          firstName: "Jana",
          lastName: "Nová",
          unit: "Knihovna",
          position: "Knihovnice",
          status: "MISSING",
          validUntil: null,
          expiresBeforeSession: false,
        },
      ],
    },
  ],
  unscheduled: [],
};

describe("Dashboard", () => {
  it("shows the snapshot summary and actionable records by default", () => {
    render(<Dashboard data={data} />);

    expect(
      screen.getByRole("heading", { name: "Přehled povinných školení" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1. 10. 2026")).toBeInTheDocument();
    expect(screen.getAllByText("Vyžaduje řešení")).toHaveLength(2);

    const table = screen.getByRole("table");
    expect(within(table).getByText("Jana Nová")).toBeInTheDocument();
    expect(within(table).queryByText("Petr Malý")).not.toBeInTheDocument();
  });

  it("filters the compliance table by status", () => {
    render(<Dashboard data={data} />);

    fireEvent.change(screen.getByLabelText("Stav"), {
      target: { value: "VALID" },
    });

    const table = screen.getByRole("table");
    expect(within(table).getByText("Petr Malý")).toBeInTheDocument();
    expect(within(table).queryByText("Jana Nová")).not.toBeInTheDocument();
  });

  it("shows capacity and explainable session recommendations", () => {
    render(<Dashboard data={data} />);

    expect(screen.getByText("3 volná")).toBeInTheDocument();
    expect(
      screen.getByText("Zobrazit doporučené osoby"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Jana Nová")).toHaveLength(2);
  });

  it("groups unit spelling variants into one filter option", () => {
    render(
      <Dashboard
        data={{
          ...data,
          items: [
            ...data.items,
            {
              ...data.items[0],
              employeeId: "E3",
              unit: "KNIHOVNA",
            },
          ],
        }}
      />,
    );

    const labels = within(screen.getByLabelText("Útvar"))
      .getAllByRole("option")
      .map((option) => option.textContent?.toLocaleLowerCase("cs-CZ"));

    expect(labels.filter((label) => label === "knihovna")).toHaveLength(1);
  });

  it("calls out an over-capacity session", () => {
    render(
      <Dashboard
        data={{
          ...data,
          sessions: [
            {
              ...data.sessions[0],
              occupied: 26,
              availableSeats: 0,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Překročeno o 1")).toBeInTheDocument();
  });

  it("filters sessions independently by training, state, and search", () => {
    render(
      <Dashboard
        data={{
          ...data,
          sessions: [
            ...data.sessions,
            {
              id: "T2",
              trainingCode: "POZ-OCH",
              trainingName: "Požární ochrana",
              date: "2026-10-20T00:00:00.000Z",
              timeRange: "10:00-12:00",
              location: "Učebna 1",
              capacity: 30,
              occupied: 30,
              availableSeats: 0,
              recommendations: [],
            },
          ],
        }}
      />,
    );

    const sessions = screen.getByRole("region", {
      name: "Doporučení na termíny",
    });

    fireEvent.change(screen.getByLabelText("Školení termínu"), {
      target: { value: "POZ-OCH" },
    });
    expect(
      within(sessions).getByRole("heading", {
        name: "Požární ochrana",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      within(sessions).queryByRole("heading", {
        name: "Kybernetická bezpečnost",
        level: 3,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zrušit filtry termínů" }));
    fireEvent.change(screen.getByLabelText("Stav termínu"), {
      target: { value: "RECOMMENDED" },
    });
    expect(screen.getByText("Zobrazeno 1 z 2 termínů.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Hledat termín"), {
      target: { value: "Učebna" },
    });
    expect(
      within(sessions).queryByRole("heading", {
        name: "Požární ochrana",
        level: 3,
      }),
    ).not.toBeInTheDocument();
  });

  it("includes over-capacity sessions among sessions without free seats", () => {
    render(
      <Dashboard
        data={{
          ...data,
          sessions: [
            data.sessions[0],
            {
              ...data.sessions[0],
              id: "T2",
              trainingCode: "POZ-OCH",
              trainingName: "Požární ochrana",
              capacity: 30,
              occupied: 30,
              availableSeats: 0,
            },
            {
              ...data.sessions[0],
              id: "T3",
              trainingCode: "BOZP-Z",
              trainingName: "BOZP – základní školení",
              capacity: 30,
              occupied: 31,
              availableSeats: 0,
            },
          ],
        }}
      />,
    );

    const sessions = screen.getByRole("region", {
      name: "Doporučení na termíny",
    });

    fireEvent.change(screen.getByLabelText("Stav termínu"), {
      target: { value: "FULL" },
    });
    expect(within(sessions).getByText("30/30")).toBeInTheDocument();
    expect(within(sessions).getByText("31/30")).toBeInTheDocument();
    expect(within(sessions).queryByText("22/25")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Stav termínu"), {
      target: { value: "OVER_CAPACITY" },
    });
    expect(within(sessions).getByText("31/30")).toBeInTheDocument();
    expect(within(sessions).queryByText("30/30")).not.toBeInTheDocument();
  });
});
