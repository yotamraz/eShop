import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBrands, getTypes } from '../../api/catalogApi';
import styles from './CatalogSearch.module.css';

interface CatalogSearchProps {
  brandId?: number;
  itemTypeId?: number;
}

export function CatalogSearch({ brandId, itemTypeId }: CatalogSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: catalogBrands } = useQuery({
    queryKey: ['catalogBrands'],
    queryFn: getBrands,
  });

  const { data: catalogItemTypes } = useQuery({
    queryKey: ['catalogItemTypes'],
    queryFn: getTypes,
  });

  if (!catalogBrands || !catalogItemTypes) {
    return null;
  }

  const handleBrandClick = (id: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    if (id === null) {
      newParams.delete('brand');
    } else {
      newParams.set('brand', String(id));
    }
    setSearchParams(newParams);
  };

  const handleTypeClick = (id: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    if (id === null) {
      newParams.delete('type');
    } else {
      newParams.set('type', String(id));
    }
    setSearchParams(newParams);
  };

  return (
    <div className={styles.catalogSearch}>
      <div className={styles.catalogSearchHeader}>
        <img role="presentation" src="/icons/filters.svg" />
        Filters
      </div>
      <div className={styles.catalogSearchTypes}>
        <div className={styles.catalogSearchGroup}>
          <h3>Brand</h3>
          <div className={styles.catalogSearchGroupTags}>
            <a
              href="#"
              className={`${styles.catalogSearchTag} ${brandId == null ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleBrandClick(null);
              }}
            >
              All
            </a>
            {catalogBrands.map((brand) => (
              <a
                key={brand.id}
                href="#"
                className={`${styles.catalogSearchTag} ${brandId === brand.id ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleBrandClick(brand.id);
                }}
              >
                {brand.brand}
              </a>
            ))}
          </div>
        </div>
        <div className={styles.catalogSearchGroup}>
          <h3>Type</h3>
          <div className={styles.catalogSearchGroupTags}>
            <a
              href="#"
              className={`${styles.catalogSearchTag} ${itemTypeId == null ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleTypeClick(null);
              }}
            >
              All
            </a>
            {catalogItemTypes.map((itemType) => (
              <a
                key={itemType.id}
                href="#"
                className={`${styles.catalogSearchTag} ${itemTypeId === itemType.id ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTypeClick(itemType.id);
                }}
              >
                {itemType.type}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
