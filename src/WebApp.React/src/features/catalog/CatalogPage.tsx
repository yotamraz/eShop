import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCatalogItems } from '../../api/catalogApi';
import { CatalogListItem } from './CatalogListItem';
import { CatalogSearch } from './CatalogSearch';
import styles from './CatalogPage.module.css';
import { usePageHeader } from '../../hooks/usePageHeader';

const PAGE_SIZE = 9;

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const brandId = searchParams.get('brand') ? Number(searchParams.get('brand')) : undefined;
  const typeId = searchParams.get('type') ? Number(searchParams.get('type')) : undefined;

  const { data: catalogResult, isLoading, isError } = useQuery({
    queryKey: ['catalogItems', page, brandId, typeId],
    queryFn: () => getCatalogItems(page - 1, brandId, typeId, PAGE_SIZE),
  });

  usePageHeader('Ready for a new adventure?', 'Start the season with the latest in clothing and equipment.');

  const totalPages = catalogResult
    ? Math.ceil(catalogResult.count / PAGE_SIZE)
    : 0;

  const visiblePageIndexes = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handlePageClick = (pageIndex: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (pageIndex === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', String(pageIndex));
    }
    setSearchParams(newParams);
  };

  return (
    <div className={styles.catalog}>
      <CatalogSearch brandId={brandId} itemTypeId={typeId} />

      {isLoading ? (
        <p>Loading...</p>
      ) : isError ? (
        <p>There was a problem loading the catalog. Please try again later.</p>
      ) : catalogResult ? (
        <div>
          <div className={styles.catalogItems}>
            {catalogResult.data.map((item) => (
              <CatalogListItem key={item.id} item={item} />
            ))}
          </div>

          <div className={styles.pageLinks}>
            {visiblePageIndexes.map((pageIndex) => (
              <a
                key={pageIndex}
                href="#"
                className={`${styles.pageLink} ${pageIndex === page ? styles.activePage : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageClick(pageIndex);
                }}
              >
                {pageIndex}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
