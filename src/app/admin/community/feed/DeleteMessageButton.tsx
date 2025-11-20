'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@heroicons/react/24/outline';

export function DeleteMessageButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/community/feed/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete message');
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete message"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  );
}

