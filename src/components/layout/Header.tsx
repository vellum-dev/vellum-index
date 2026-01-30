import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export function Header() {
  const location = useLocation();
  const isTesting = location.pathname.startsWith('/testing');

  return (
    <header className="border-b">
      <div className="w-full lg:max-w-[90%] mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={isTesting ? '/testing' : '/'} className="flex items-center gap-3 text-2xl font-bold">
          <img src="/vellum-logo.svg" alt="Vellum" className="h-12 w-12" />
          Vellum Package Index{isTesting && ' - Testing'}
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
