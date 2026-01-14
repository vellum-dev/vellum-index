import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full lg:max-w-[90%] mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t py-6 flex justify-center items-center text-sm text-muted-foreground">
        <a
          href="https://github.com/vellum-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
