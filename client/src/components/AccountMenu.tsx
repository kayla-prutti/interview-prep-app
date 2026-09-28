import { useEffect, useRef, useState } from "react";

type AccountMenuProps = {
  email: string;
  onLogOut: () => Promise<void>;
};

export function AccountMenu({ email, onLogOut }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = email.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    if (!isOpen) return;

    function closeMenu(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  async function logOut() {
    setIsLoggingOut(true);
    try {
      await onLogOut();
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className="grid h-10 w-10 place-items-center rounded-full border border-[#BDBDB8] bg-white text-sm font-bold text-[#202020] shadow-sm transition hover:border-[#F5822A] hover:bg-[#FFF7F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5822A] focus-visible:ring-offset-2"
        title="Account"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-[#D6D6D2] bg-white shadow-[0_18px_44px_rgba(32,32,32,0.18)]" role="menu">
          <div className="border-b border-[#E4E4E0] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C95712]">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#303030]" title={email}>{email}</p>
          </div>
          <button
            className="w-full px-4 py-3 text-left text-sm font-bold text-[#303030] transition hover:bg-[#FFF3E9] hover:text-[#9A3D00] disabled:opacity-60"
            disabled={isLoggingOut}
            role="menuitem"
            type="button"
            onClick={() => void logOut()}
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
