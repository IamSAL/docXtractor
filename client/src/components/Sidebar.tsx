import { Link } from "@tanstack/react-router";
import { useAuth, useLogout } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/extractors", icon: "fork_right", label: "Extractors" },
  { to: "/runs", icon: "list_alt", label: "Runs" },
  {
    to: "/autoruns",
    icon: "auto_mode",
    label: "AutoRuns",
    sub: "Scheduled & triggered",
  },
] as const;

export function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "bg-white border-r-3 border-black flex flex-col h-screen fixed left-0 top-0 z-50 w-64",
          "transition-[transform,width] duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-18" : "lg:w-64",
        ].join(" ")}
        data-collapsed={isCollapsed || undefined}
      >
        {/* Logo */}
        <div className="border-b-3 border-black bg-white flex items-center min-h-[73px] px-3 relative">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 no-underline text-black overflow-hidden flex-1"
            onClick={onClose}
          >
            <div className="size-10 shrink-0 bg-black text-white flex items-center justify-center rounded border-2 border-black shadow-hard-sm">
              <span className="material-symbols-outlined text-[24px]">
                description
              </span>
            </div>
            <h1
              className={[
                "sidebar-label text-xl font-extrabold tracking-tight",
                "transition-[opacity,max-width] duration-300 overflow-hidden whitespace-nowrap opacity-100 max-w-xs",
              ].join(" ")}
            >
              DocXTractor
            </h1>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden text-black shrink-0 ml-2"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Desktop collapse toggle — floats on right edge */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 size-7 bg-white border-2 border-black rounded-full items-center justify-center hover:bg-yellow-50 transition-colors shadow-hard-sm"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span
              className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            >
              chevron_left
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ to, icon, label, sub }) => (
            <Link
              key={to}
              to={to}
              className="sidebar-nav-item  rounded-md neobrutal-sidebar-item flex items-center gap-3 px-3 py-3 rounded-lg text-black no-underline"
              activeProps={{ className: "active" }}
              onClick={onClose}
              title={label}
            >
              <span className="material-symbols-outlined shrink-0">{icon}</span>
              <div
                className={[
                  "flex flex-col label",
                  "transition-[opacity,max-width] duration-300 opacity-100 max-w-xs",
                ].join(" ")}
              >
                <span className="font-bold whitespace-nowrap">{label}</span>
                {sub && (
                  <span className="text-[10px] font-medium text-gray-500 leading-none mt-0.5 whitespace-nowrap">
                    {sub}
                  </span>
                )}
              </div>
            </Link>
          ))}

          <div className="my-2 border-t-2 border-black border-dashed" />

          <Link
            to="/settings"
            className="sidebar-nav-item neobrutal-sidebar-item flex items-center gap-3 px-3 py-3 rounded-lg text-black no-underline"
            activeProps={{ className: "active" }}
            onClick={onClose}
            title={"Settings"}
          >
            <span className="material-symbols-outlined shrink-0">settings</span>
            <span
              className={[
                "sidebar-label font-bold whitespace-nowrap",
                "transition-[opacity,max-width] duration-300 overflow-hidden opacity-100 max-w-xs",
              ].join(" ")}
            >
              Settings
            </span>
          </Link>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t-3 border-black bg-yellow-50">
          <div
            className={[
              "sidebar-user-row flex items-center p-1 rounded-lg border-2 border-black bg-white shadow-hard-sm overflow-hidden",
              "gap-2",
            ].join(" ")}
          >
            <div className="size-8 rounded-full user-avatar bg-gray-200 border-2 border-black overflow-hidden flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-black text-lg">
                person
              </span>
            </div>
            <div
              className={[
                "sidebar-label flex-1 min-w-0",
                "transition-[opacity,max-width] duration-300 overflow-hidden",
                "opacity-100 max-w-xs label",
              ].join(" ")}
            >
              <p className="text-sm font-bold truncate whitespace-nowrap">
                {user?.email}
              </p>
              <p className="text-xs text-gray-600 truncate capitalize whitespace-nowrap">
                {user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className={[
                "sidebar-label p-1 hover:bg-red-100 rounded shrink-0",
                "transition-[opacity,max-width] duration-300 overflow-hidden",
                "opacity-100",
              ].join(" ")}
              title="Logout"
            >
              <span className="material-symbols-outlined text-sm text-red-600">
                logout
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
