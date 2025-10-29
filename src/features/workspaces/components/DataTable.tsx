"use client";

import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface DataRecord {
  id: string;
  [key: string]: unknown;
}

export interface Column {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select';
  width?: string;
  options?: string[]; // For select type
}

interface DataTableProps {
  data: DataRecord[];
  columns: Column[];
  currentPage?: number;
  recordsPerPage?: number;
  onAdd?: () => void;
  onEdit?: (record: DataRecord) => void;
  onDelete?: (record: DataRecord) => void;
  onView?: (record: DataRecord) => void;
  onBulkDelete?: (recordIds: string[]) => void;
  onBulkCopy?: (recordIds: string[]) => void;
  onBulkExport?: (recordIds: string[]) => void;
  onSelectionChange?: (hasSelection: boolean, selectedIds: string[]) => void;
  loading?: boolean;
  showHeader?: boolean;
  highlightedRows?: Set<string>;
}

export function DataTable({ 
  data, 
  columns, 
  currentPage = 1,
  recordsPerPage,
  onAdd, 
  onEdit: _onEdit, 
  onDelete: _onDelete, 
  onView, 
  onBulkDelete: _onBulkDelete,
  onBulkCopy: _onBulkCopy,
  onBulkExport: _onBulkExport,
  onSelectionChange,
  loading, 
  showHeader = true,
  highlightedRows = new Set()
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.(false, []);
    } else {
      const newSelected = new Set(filteredData.map(record => record.id));
      setSelectedRows(newSelected);
      onSelectionChange?.(true, Array.from(newSelected));
    }
  };

  const handleSelectRow = (recordId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRows(newSelected);
    const selectedArray = Array.from(newSelected);
    onSelectionChange?.(newSelected.size > 0, selectedArray);
  };

  // Bulk handlers removed (not used by current UI)

  // Filter data based on search term
  const filteredData = data.filter(record =>
    Object.values(record).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate data if recordsPerPage is provided
  const paginatedData = recordsPerPage
    ? sortedData.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage)
    : sortedData;

  // Use paginated data for display, but use sortedData for "", select all
  const displayData = paginatedData;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const formatValue = (value: unknown, type: Column['type']) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'date':
        return new Date(String(value)).toLocaleDateString();
      case 'phone':
        return String(value).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      case 'email':
        return String(value);
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="bg-white">
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-full w-full flex flex-col overflow-hidden" style={{ paddingBottom: recordsPerPage ? '40px' : '0', margin: 0 }}>
      {/* Header - Conditionally rendered */}
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {data.length} record{data.length !== 1 ? 's' : ''}
            </h3>
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Record</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}


      {/* Table */}
      <div className="flex-1 overflow-auto scrollable-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                    column.width ? `w-${column.width}` : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortColumn === column.key && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((record) => {
              const isHighlighted = highlightedRows.has(record.id);
              const isSelected = selectedRows.has(record.id);
              
              return (
                <tr 
                  key={record.id} 
                  onClick={() => onView?.(record)}
                  className={`
                    hover:bg-gray-50 transition-colors duration-200 cursor-pointer
                    ${isSelected ? 'bg-blue-50' : ''}
                    ${isHighlighted ? 'bg-green-50 border-l-4 border-green-400 animate-pulse' : ''}
                  `}
                >
                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(record.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectRow(record.id);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                  >
                    {formatValue(record[column.key], column.type)}
                  </td>
                ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {displayData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first record'}
          </p>
          {onAdd && !searchTerm && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Record
            </button>
          )}
        </div>
      )}
    </div>
  );
}
