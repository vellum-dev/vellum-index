import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/layout/Layout';
import { PackageListPage } from '@/pages/PackageListPage';
import { PackageDetailPage } from '@/pages/PackageDetailPage';
import { AuthorPage } from '@/pages/AuthorPage';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<PackageListPage />} />
            <Route path="/package/:name" element={<PackageDetailPage />} />
            <Route path="/author/:authorName" element={<AuthorPage />} />
            <Route path="/testing" element={<PackageListPage repo="testing" />} />
            <Route path="/testing/package/:name" element={<PackageDetailPage repo="testing" />} />
            <Route path="/testing/author/:authorName" element={<AuthorPage repo="testing" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
