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
  onOpenFolder?: () => void;
}

export function Sidebar({
  sidebarOpen,
  onToggleSidebar,
  nav,
  onSelectNav,
  activeTag,
  onSelectTag,
  topTags,
  onOpenFolder,
}: SidebarProps) {
  return (
    <nav
      style={{
        width: sidebarOpen ? 200 : 52,
        transition: "width 0.22s ease",
      }}
      className="h-full bg-[#faf9f7] border-r border-[#ece9e4] flex flex-col justify-between py-5 shrink-0 overflow-hidden select-none print:hidden"
    >
      <div className="px-3">
        {/* Toggle button: top of sidebar, chevron icon, rotates on expand/collapse */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center gap-2.5 mb-5 w-full text-left outline-none cursor-pointer group"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div className="w-7 h-7 rounded-lg relative flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-[#ece9e4]/80 bg-[#fdfcfb]">
            <img
              src={logoImg}
              alt="Second Diary logo"
              className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-0"
            />
            <div className="absolute inset-0 bg-[#1c1a18] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-hover:bg-[#3a3530]">
              <span className={`transform transition-transform duration-200 ${sidebarOpen ? "rotate-180" : ""}`}>
                <Ic.chevronR />
              </span>
            </div>
          </div>
          {sidebarOpen && (
            <span className="text-[13px] font-semibold text-[#1c1a18] tracking-tight whitespace-nowrap">
              Second Diary
            </span>
          )}
        </button>

        {/* Navigation Items: Journal, Notes, Second Brain */}
        <div className="space-y-1">
          {[
            { id: "journal" as const, label: "Journal", icon: <Ic.journal /> },
            { id: "notes" as const, label: "Notes", icon: <Ic.notes /> },
            { id: "brain" as const, label: "Second Brain", icon: <Ic.brain />, badge: "AI" },
          ].map((item) => {
            const isActive = nav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1c1a18] text-white font-medium shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-[#9c9690] hover:text-[#1c1a18] hover:bg-[#f0ece8]"
                }`}
                title={item.label}
              >
                <span
                  className="shrink-0 flex items-center justify-center w-4"
                  style={{ border: "none", borderWidth: 0, outline: "none" }}
                >
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span className="whitespace-nowrap flex-1 text-left">
                    {item.label}
                  </span>
                )}
                {sidebarOpen && item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-auto ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#e8f4f0] text-[#4a9e87]"
                    }`}
                  >
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
      <div className="border-t border-[#ece9e4] px-3 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
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
        {sidebarOpen && onOpenFolder && (
          <button
            type="button"
            onClick={onOpenFolder}
            className="text-[#8c867e] hover:text-[#1c1a18] p-1.5 rounded-md hover:bg-white/80 transition-colors cursor-pointer shrink-0"
            title="Open Markdown folder in Finder (~/Documents/Second Diary)"
            aria-label="Open Markdown folder in Finder"
          >
            <Ic.folder />
          </button>
        )}
      </div>
    </nav>
  );
}
