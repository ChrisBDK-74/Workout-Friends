import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { listCategories } from '../lib/api';
import type { Category } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import { ErrorMessage, Loading } from './Status';

interface CategoriesState {
  muscleGroups: Category[];
  equipment: Category[];
  muscleGroupName: (slug: string) => string;
  equipmentName: (slug: string) => string;
  /** Call after adding, renaming or deleting a category (or changing exercises, for the counts) */
  reload: () => void;
}

const CategoriesContext = createContext<CategoriesState | null>(null);

/** Loads muscle groups and equipment once for the whole app. */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { data, error, reload } = useAsync(listCategories, []);

  const value = useMemo<CategoriesState | null>(() => {
    if (!data) return null;
    const muscleNames = new Map(data.muscle.map((c) => [c.slug, c.name]));
    const equipmentNames = new Map(data.equipment.map((c) => [c.slug, c.name]));
    return {
      muscleGroups: data.muscle,
      equipment: data.equipment,
      muscleGroupName: (slug) => muscleNames.get(slug) ?? slug,
      equipmentName: (slug) => equipmentNames.get(slug) ?? slug,
      reload,
    };
  }, [data, reload]);

  if (error && !data) {
    return (
      <section className="page">
        <ErrorMessage error={error} onRetry={reload} />
      </section>
    );
  }
  if (!value) return <Loading />;
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesState {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used inside <CategoriesProvider>');
  return ctx;
}

/** Joins muscle-group names for display, e.g. "Chest, Triceps". */
export function useMuscleList() {
  const { muscleGroupName } = useCategories();
  return useCallback((slugs: string[]) => slugs.map(muscleGroupName).join(', '), [muscleGroupName]);
}
