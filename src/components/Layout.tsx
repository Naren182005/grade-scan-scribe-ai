
import React from 'react';
import { ScanText } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <header className="border-b px-4 py-3 bg-white shadow-sm sticky top-0 z-10">
        <div className="container flex items-center gap-2">
          <div className="bg-app-teal-50 p-1.5 rounded-md">
            <ScanText size={24} className="text-app-teal-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-xl text-app-blue-900">GradeScan</h1>
            <span className="text-xs bg-app-teal-100 text-app-teal-800 px-2 py-0.5 rounded-full inline-block">
              AI Powered
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">
        {children}
      </main>
      <footer className="border-t py-4 bg-white">
        <div className="container text-center text-sm text-muted-foreground">
          GradeScan - AI-Powered Exam Evaluation Tool
        </div>
      </footer>
    </div>
  );
};

export default Layout;
