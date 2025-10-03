'use client';

import { useState } from 'react';
import { AdminSiteMgmtService } from '@/features/shared/services/adminSiteMgmtService';
import { useSiteConfig } from '@/features/shared/services/adminSiteMgmtService';

/**
 * Admin panel for managing site-wide configuration
 * This component allows toggling various site features
 */
export function AdminPanel() {
  const { config, loading } = useSiteConfig();
  const [isUpdating, setIsUpdating] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleToggle = async (updateFn: () => Promise<unknown>) => {
    setIsUpdating(true);
    try {
      await updateFn();
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    await handleToggle(() => 
      AdminSiteMgmtService.toggleSiteWideNotification(enabled, notificationMessage)
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-red-600">Failed to load admin configuration</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Site Administration</h2>
      
      <div className="space-y-6">
        {/* API Error Banner */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">API Error Banner</h3>
            <p className="text-sm text-gray-600">Show banner when API services are down</p>
          </div>
          <button
            onClick={() => handleToggle(() => 
              AdminSiteMgmtService.toggleApiErrorBanner(!config.api_error_banner_enabled)
            )}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.api_error_banner_enabled ? 'bg-red-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.api_error_banner_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Maintenance Mode</h3>
            <p className="text-sm text-gray-600">Enable maintenance mode for site updates</p>
          </div>
          <button
            onClick={() => handleToggle(() => 
              AdminSiteMgmtService.toggleMaintenanceMode(!config.maintenance_mode_enabled)
            )}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.maintenance_mode_enabled ? 'bg-yellow-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.maintenance_mode_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* New User Registration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">New User Registration</h3>
            <p className="text-sm text-gray-600">Allow new users to sign up</p>
          </div>
          <button
            onClick={() => handleToggle(() => 
              AdminSiteMgmtService.toggleNewUserRegistration(!config.new_user_registration_enabled)
            )}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.new_user_registration_enabled ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.new_user_registration_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Premium Features */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Premium Features</h3>
            <p className="text-sm text-gray-600">Enable premium functionality</p>
          </div>
          <button
            onClick={() => handleToggle(() => 
              AdminSiteMgmtService.togglePremiumFeatures(!config.premium_features_enabled)
            )}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.premium_features_enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.premium_features_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Site-wide Notification */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Site-wide Notification</h3>
              <p className="text-sm text-gray-600">Show a custom message to all users</p>
            </div>
            <button
              onClick={() => handleNotificationToggle(!config.site_wide_notification_enabled)}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.site_wide_notification_enabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.site_wide_notification_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {config.site_wide_notification_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Message
              </label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter your notification message..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={() => handleNotificationToggle(true)}
                disabled={isUpdating || !notificationMessage.trim()}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Message
              </button>
            </div>
          )}
        </div>
      </div>

      {isUpdating && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">Updating settings...</p>
        </div>
      )}
    </div>
  );
}
