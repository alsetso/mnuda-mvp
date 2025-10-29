"use client";

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DataTableFooterProps {
  totalRecords: number;
  currentPage: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
}

export function DataTableFooter({
  totalRecords,
  currentPage,
  recordsPerPage,
  onPageChange,
}: DataTableFooterProps) {
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalRecords === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-white border-t border-gray-200 flex items-center justify-between px-4 z-10">
        <span className="text-xs text-gray-600">0 records</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-white border-t border-gray-200 flex items-center justify-between px-4 z-10">
      {/* Record count */}
      <div className="text-xs text-gray-600">
        Showing {startRecord} to {endRecord} of {totalRecords} records
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`flex items-center px-2 py-1 text-xs rounded ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        
        <span className="text-xs text-gray-600 min-w-[60px] text-center">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`flex items-center px-2 py-1 text-xs rounded ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

