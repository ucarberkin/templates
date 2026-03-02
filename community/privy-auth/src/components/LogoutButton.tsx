"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const { logout } = usePrivy();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--color-card)]"
    >
      Sign Out
    </button>
  );
}
