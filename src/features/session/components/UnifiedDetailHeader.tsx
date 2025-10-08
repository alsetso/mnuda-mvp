'use client';


interface UnifiedDetailHeaderProps {
  title: string;
  subtitle: string;
  type: 'node' | 'entity';
  status: 'active' | 'completed' | 'error';
  entityType?: string;
  onBack: () => void;
  showBackButton?: boolean;
}

export default function UnifiedDetailHeader({
  title,
  subtitle,
  type,
  status,
  entityType,
  onBack,
  showBackButton = true
}: UnifiedDetailHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getTypeIcon = (type: string, entityType?: string) => {
    if (type === 'node') {
      return '📊';
    }
    
    switch (entityType) {
      case 'person': return '👤';
      case 'address': return '🏠';
      case 'property': return '🏘️';
      case 'phone': return '📞';
      case 'email': return '📧';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-1.5 text-gray-500 hover:text-[#014463] hover:bg-gray-50 rounded-lg transition-colors group"
            title="Back to results (Esc)"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Type Icon */}
          <div className="w-8 h-8 rounded-full bg-[#014463]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">{getTypeIcon(type, entityType)}</span>
          </div>
          
          {/* Title and Subtitle */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500 truncate">{subtitle}</p>
              <span className="text-xs text-gray-300">•</span>
              <p className="text-xs text-gray-500">Press Esc to go back</p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
            <span className="text-xs font-medium text-gray-700">
              {getStatusLabel(status)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
