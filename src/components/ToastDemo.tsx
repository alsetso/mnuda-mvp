'use client';

import { useToast } from '@/hooks/useToast';

export function ToastDemo() {
  const { success, error, loading, info, apiToast, withApiToast } = useToast();

  const handleBasicToasts = () => {
    success('Success!', 'Operation completed successfully');
    error('Error!', 'Something went wrong');
    info('Info', 'Here is some information');
    
    const loadingId = loading('Loading...', 'Please wait');
    setTimeout(() => {
      // Simulate completion
    }, 2000);
  };

  const handleApiToasts = () => {
    const api = apiToast('User API', 'Fetching user data');
    const loadingId = api.loading();
    
    setTimeout(() => {
      api.success('User data loaded successfully');
    }, 2000);
  };

  const handleAsyncApi = async () => {
    try {
      await withApiToast(
        'Data Processing',
        async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { data: 'processed' };
        },
        {
          loadingMessage: 'Processing your data...',
          successMessage: 'Data processed successfully!',
          errorMessage: 'Failed to process data'
        }
      );
    } catch (error) {
      console.error('Async operation failed:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Toast Demo</h3>
      <div className="space-x-2">
        <button
          onClick={handleBasicToasts}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Basic Toasts
        </button>
        <button
          onClick={handleApiToasts}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          API Toasts
        </button>
        <button
          onClick={handleAsyncApi}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
        >
          Async API
        </button>
      </div>
    </div>
  );
}
