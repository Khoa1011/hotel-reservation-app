import React from 'react';

const MenuItem = ({ item, isActive, onClick, badge = 0 }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-3 text-left transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <item.icon className="h-5 w-5" />
        <span className="font-medium">{item.label}</span>
      </div>
      
      {/* Badge thông báo */}
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

export default MenuItem;