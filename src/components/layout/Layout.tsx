
import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth/');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
