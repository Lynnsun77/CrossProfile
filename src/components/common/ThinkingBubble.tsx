import React from 'react';
import { AssistantAvatar } from './AssistantAvatar';

export const ThinkingBubble: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-purple-50 rounded-full px-3 py-1.5 border border-purple-200">
      <div className="w-5 h-5">
        <AssistantAvatar size="small" animated />
      </div>
      
      <div className="flex items-center gap-0.5">
        <span className="text-sm text-gray-600">思考中</span>
        <div className="flex gap-0.5 ml-1">
          <span className="text-gray-600 text-sm">•</span>
          <span className="text-gray-600 text-sm">•</span>
          <span className="text-gray-600 text-sm">•</span>
        </div>
      </div>
    </div>
  );
};
