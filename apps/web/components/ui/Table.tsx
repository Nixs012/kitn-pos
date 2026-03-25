import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
}

const Table = ({ headers, children, loading = false }: TableProps) => {
  return (
    <div className="w-full bg-white rounded-2xl border-[0.5px] border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {headers.map((header, i) => (
                <th 
                  key={i} 
                  className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {headers.map((_, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className="h-4 bg-gray-100 rounded-full w-24"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
