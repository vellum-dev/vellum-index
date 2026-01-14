import { useParams, Link } from 'react-router-dom';
import { usePackages } from '@/hooks/usePackages';
import { PackageTable } from '@/components/packages/PackageTable';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function AuthorPage() {
  const { authorName } = useParams<{ authorName: string }>();
  const { packages } = usePackages();

  const decodedAuthor = decodeURIComponent(authorName ?? '');

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
              <Link to="/">Packages</Link>
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

      <PackageTable packages={authorPackages} />
    </div>
  );
}
