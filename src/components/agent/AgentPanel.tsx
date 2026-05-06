import { useState, useEffect } from 'react';
import { AgentMessage } from '../../types';
import { AgentBubble } from './AgentBubble';
import { AssistantAvatar } from '../common/AssistantAvatar';

interface AgentPanelProps {
  initialMessages?: AgentMessage[];
}

export function AgentPanel({ initialMessages = [] }: AgentPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: AgentMessage = {
        id: Date.now().toString(),
        type: 'agent',
        content: '你好！我是智能助手，很高兴为你服务。告诉我你的业务目标或你在找什么样的人群，我来帮你推荐合适的资产。',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 w-full overflow-hidden">
      {/* 欢迎区域 */}
      <div className="bg-white border-b p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <AssistantAvatar size="large" animated={true} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">智能助手</h2>
            <p className="text-sm text-gray-500">随时为你推荐合适的资产</p>
          </div>
        </div>
      </div>
      
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <AgentBubble key={msg.id} message={msg} />
        ))}
      </div>
      
      {/* 输入区域 */}
      <div className="p-4 bg-white border-t flex-shrink-0">
        <div className="flex gap-2 w-full max-w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入你的问题..."
            className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-market"
          />
          <button
            onClick={handleSend}
            className="px-6 py-2 bg-market text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
