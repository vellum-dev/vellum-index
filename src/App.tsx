import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/layout/Layout';
import { PackageListPage } from '@/pages/PackageListPage';
import { PackageDetailPage } from '@/pages/PackageDetailPage';
import { AuthorPage } from '@/pages/AuthorPage';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<PackageListPage />} />
            <Route path="/package/:name" element={<PackageDetailPage />} />
            <Route path="/author/:authorName" element={<AuthorPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
}
