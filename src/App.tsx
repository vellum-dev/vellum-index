import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/layout/Layout';
import { PackageListPage } from '@/pages/PackageListPage';
import { PackageDetailPage } from '@/pages/PackageDetailPage';
import { AuthorPage } from '@/pages/AuthorPage';
import { StatsOverviewPage } from '@/pages/StatsOverviewPage';
import { PackageStatsPage } from '@/pages/PackageStatsPage';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<PackageListPage />} />
            <Route path="/package/:name" element={<PackageDetailPage />} />
            <Route path="/author/:authorName" element={<AuthorPage />} />
            <Route path="/stats" element={<StatsOverviewPage />} />
            <Route path="/stats/:name" element={<PackageStatsPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
}
