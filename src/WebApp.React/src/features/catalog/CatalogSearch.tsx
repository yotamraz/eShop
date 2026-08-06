import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBrands, getTypes } from '../../api/catalogApi';
import styles from './CatalogSearch.module.css';

interface CatalogSearchProps {
  brandId?: number;
  itemTypeId?: number;
}

interface FilterItem {
  id: number;
  label: string;
}

function FilterGroup({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  items: FilterItem[];
  selectedId: number | undefined;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div className={styles.catalogSearchGroup}>
      <h3>{title}</h3>
      <div className={styles.catalogSearchGroupTags}>
        <a
          href="#"
          className={`${styles.catalogSearchTag} ${selectedId == null ? styles.active : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(null);
          }}
        >
          All
        </a>
        {items.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`${styles.catalogSearchTag} ${selectedId === item.id ? styles.active : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onSelect(item.id);
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
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

  const handleFilterClick = (param: string, id: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    if (id === null) {
      newParams.delete(param);
    } else {
      newParams.set(param, String(id));
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
        <FilterGroup
          title="Brand"
          items={catalogBrands.map((b) => ({ id: b.id, label: b.brand }))}
          selectedId={brandId}
          onSelect={(id) => handleFilterClick('brand', id)}
        />
        <FilterGroup
          title="Type"
          items={catalogItemTypes.map((t) => ({ id: t.id, label: t.type }))}
          selectedId={itemTypeId}
          onSelect={(id) => handleFilterClick('type', id)}
        />
      </div>
    </div>
  );
}
