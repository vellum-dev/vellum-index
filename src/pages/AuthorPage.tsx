import { useParams, Link } from 'react-router-dom';
import { usePackages, type RepoType } from '@/hooks/usePackages';
import { PackageTable } from '@/components/packages/PackageTable';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function AuthorPage({ repo = 'stable' }: { repo?: RepoType }) {
  const { authorName } = useParams<{ authorName: string }>();
  const { packages, loading, error } = usePackages(repo);

  const decodedAuthor = decodeURIComponent(authorName ?? '');
  const basePath = repo === 'testing' ? '/testing' : '';

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">Error: {error}</div>;
  }

  const authorPackages = packages.filter(
    (pkg) =>
      pkg.upstream_author === decodedAuthor &&
      pkg.version === pkg.latestVersion
  );

  return (
    <div>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={basePath || '/'}>Packages</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{decodedAuthor}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-2">{decodedAuthor}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {authorPackages.length} package{authorPackages.length !== 1 ? 's' : ''}
      </p>

      <PackageTable packages={authorPackages} basePath={basePath} />
    </div>
  );
}
