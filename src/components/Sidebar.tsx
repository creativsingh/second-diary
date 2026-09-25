import { Ic } from "@/components/Icons";
import logoImg from "@/assets/logo.png";
import type { NavItem } from "@/types";

interface SidebarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  nav: NavItem;
  onSelectNav: (item: NavItem) => void;
  activeTag: string | null;
  onSelectTag: (tag: string) => void;
  topTags: string[];
  onNewEntry?: () => void;
}

export function Sidebar({
  sidebarOpen,
  onToggleSidebar,
  nav,
  onSelectNav,
  activeTag,
  onSelectTag,
  topTags,
  onNewEntry,
}: SidebarProps) {
  return (
    <nav
      style={{
        width: sidebarOpen ? 200 : 52,
        transition: "width 0.22s ease",
      }}
      className="h-full bg-[#f7f5f2] border-r border-[#ece9e4] flex flex-col justify-between py-5 shrink-0 overflow-hidden select-none"
    >
      <div className="px-3">
        {/* Logo / collapse toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center gap-2.5 mb-5 w-full text-left outline-none cursor-pointer group"
          title={sidebarOpen ? "Close drawer" : "Open drawer"}
          aria-label={sidebarOpen ? "Close drawer" : "Open drawer"}
        >
          <div className="w-7 h-7 rounded-lg relative flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-[#ece9e4]/80 bg-[#fdfcfb]">
            <img
              src={logoImg}
              alt="Second Diary logo"
              className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-0"
            />
            <div className="absolute inset-0 bg-[#1c1a18] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-hover:bg-[#3a3530]">
              {sidebarOpen ? <Ic.sidebarClose /> : <Ic.sidebarOpen />}
            </div>
          </div>
          {sidebarOpen && (
            <span className="text-[13px] font-semibold text-[#1c1a18] tracking-tight whitespace-nowrap">
              Second Diary
            </span>
          )}
        </button>

        {/* Main CTA: New Entry */}
        {onNewEntry && (
          <button
            type="button"
            onClick={onNewEntry}
            className={`w-full mb-4 flex items-center gap-2 rounded-lg bg-[#1c1a18] text-white hover:bg-[#3a3530] transition-all cursor-pointer shadow-xs ${
              sidebarOpen
                ? "px-3 py-2 text-[12px] font-medium justify-start"
                : "p-2 justify-center"
            }`}
            title="New Entry (⌘N)"
          >
            <span className="shrink-0 flex items-center justify-center">
              <Ic.plus />
            </span>
            {sidebarOpen && <span className="whitespace-nowrap">New Entry</span>}
          </button>
        )}

        {/* Navigation Items */}
        <div className="space-y-1">
          {[
            { id: "journal" as const, label: "Journal", icon: <Ic.journal /> },
            {
              id: "ai" as const,
              label: "Ask Diary",
              icon: <Ic.ai />,
              badge: "AI",
            },
          ].map((item) => {
            const isActive = nav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-[#1c1a18] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[#8c867e] hover:text-[#1c1a18] hover:bg-white/60"
                }`}
              >
                <span
                  className="shrink-0 flex items-center justify-center w-4"
                  style={{ border: "none", outline: "none" }}
                >
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span className="whitespace-nowrap flex-1 text-left">
                    {item.label}
                  </span>
                )}
                {sidebarOpen && item.badge && (
                  <span className="text-[9px] bg-[#e8f4f0] text-[#4a9e87] px-1.5 py-0.5 rounded-full font-medium ml-auto">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tags Section (Expanded sidebar only) */}
        {sidebarOpen && topTags.length > 0 && (
          <div className="border-t border-[#ece9e4] pt-3 mt-4">
            <div className="text-[9px] font-semibold text-[#b5afa7] tracking-widest uppercase px-2 mb-2">
              Tags
            </div>
            <div className="space-y-0.5">
              {topTags.map((tag) => {
                const isTagActive = activeTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTag(tag)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer text-left ${
                      isTagActive
                        ? "bg-white text-[#7c6f5b] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        : "text-[#9c9690] hover:text-[#4a4540] hover:bg-white/40"
                    }`}
                  >
                    <span className="shrink-0">
                      <Ic.tag />
                    </span>
                    <span className="truncate">#{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User profile block */}
      <div className="border-t border-[#ece9e4] px-3 pt-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#d4c8b8] to-[#a89880] flex items-center justify-center text-white text-[11px] font-medium shrink-0 shadow-xs">
          Y
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden leading-tight text-left">
            <div className="text-[11px] font-medium text-[#4a4540] truncate">
              You
            </div>
            <div className="text-[10px] text-[#b5afa7] truncate">
              Private · Local
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
