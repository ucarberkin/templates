"use client";

import AuthGuard from "@/components/AuthGuard";
import UserProfile from "@/components/UserProfile";
import WalletInfo from "@/components/WalletInfo";
import LogoutButton from "@/components/LogoutButton";

export default function Dashboard() {
  return (
    <AuthGuard>
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <LogoutButton />
          </div>

          <div className="space-y-6">
            <UserProfile />
            <WalletInfo />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
