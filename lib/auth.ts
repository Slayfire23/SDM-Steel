export type UserRole = "admin" | "sales" | "setup";

export type AppUser = {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  salesmanName?: string;
};

export const authCookieName = "coiltrack_user";

export const appUsers: AppUser[] = [
  {
    username: "admin",
    password: "admin123",
    name: "Admin",
    role: "admin",
  },
  {
    username: "saul",
    password: "sales123",
    name: "Saul Diaz",
    role: "sales",
    salesmanName: "Saul Diaz",
  },
  {
    username: "scheduler",
    password: "setup123",
    name: "Setup / Scheduler",
    role: "setup",
  },
];

export const dashboardLinks = [
  { href: "/sales", label: "Sales", roles: ["admin", "sales"] },
  { href: "/receiving", label: "Receiving", roles: ["admin"] },
  { href: "/setup", label: "Create Set-Up", roles: ["admin", "setup"] },
  { href: "/inventory", label: "Inventory", roles: ["admin", "sales", "setup"] },
  { href: "/schedule", label: "Slitting Schedule", roles: ["admin", "setup"] },
] satisfies {
  href: string;
  label: string;
  roles: UserRole[];
}[];

export function getUserByUsername(username?: string | null) {
  return appUsers.find((user) => user.username === username) ?? null;
}

export function canAccessPath(user: AppUser, path: string) {
  if (user.role === "admin") {
    return true;
  }

  if (path === "/") {
    return true;
  }

  if (user.role === "sales") {
    return path.startsWith("/inventory") || path.startsWith("/sales");
  }

  return (
    path.startsWith("/inventory") ||
    path.startsWith("/setup") ||
    path.startsWith("/schedule") ||
    path.startsWith("/api/scheduled-setups")
  );
}
