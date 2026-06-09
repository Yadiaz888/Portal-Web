import { useState } from 'react';

export function useTable<T extends { id: string }>(data: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === data.length ? new Set() : new Set(data.map(d => d.id))
    );
  };

  return { selected, toggleRow, toggleAll, search, setSearch };
}
