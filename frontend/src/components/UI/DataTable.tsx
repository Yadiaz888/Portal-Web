import { useState, ReactNode, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onRowAction?: (action: string, row: T) => void;
  actionItems?: string[];
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowAction,
  actionItems = ['Ver detalle', 'Editar', 'Eliminar'],
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const toggleRow = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(prev => (prev.size === data.length ? new Set() : new Set(data.map(d => d.id))));

  return (
    <div className="overflow-x-auto pb-20 -mb-20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left w-10">
              <input
                type="checkbox"
                checked={selected.size === data.length && data.length > 0}
                onChange={toggleAll}
                className="rounded border-gray-300 text-[#E8450A] focus:ring-[#E8450A]"
              />
            </th>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const isNearBottom = data.length > 1 && idx >= data.length - 2;
            return (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="rounded border-gray-300 text-[#E8450A] focus:ring-[#E8450A]"
                  />
                </td>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                <td className="px-4 py-3 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>
                  {openMenu === row.id && (
                    <div 
                      ref={menuRef}
                      className={`absolute right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[140px] ${
                        isNearBottom ? 'bottom-8' : 'top-8'
                      }`}
                    >
                      {actionItems.map(item => (
                        <button
                          key={item}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setOpenMenu(null);
                            onRowAction?.(item, row);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">Sin registros</div>
      )}
    </div>
  );
}
