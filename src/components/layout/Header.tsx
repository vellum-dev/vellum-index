import { Link, useLocation } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export function Header() {
  const { pathname } = useLocation();
  const onStatsPage = pathname.startsWith('/stats');

  return (
    <header className="border-b">
      <div className="w-full lg:max-w-[90%] mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold">
          <img src="/vellum-logo.svg" alt="Vellum" className="h-12 w-12" />
          Vellum Package Index
        </Link>
        <div className="flex items-center gap-2">
          {!onStatsPage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/stats" className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <BarChart3 className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Statistics</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
