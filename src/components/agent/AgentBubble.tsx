import { AgentMessage } from '../../types';
import { CardRenderer } from './CardRenderer';
import { AssistantAvatar } from '../common/AssistantAvatar';

interface AgentBubbleProps {
  message: AgentMessage;
}

export function AgentBubble({ message }: AgentBubbleProps) {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} flex gap-3`}>
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-market flex items-center justify-center text-sm font-medium text-white">
            U
          </div>
        ) : (
          <AssistantAvatar size="medium" />
        )}
        <div className={`p-3 rounded-lg ${isUser ? 'bg-market text-white' : 'bg-white border border-gray-200'}`}>
          <p className="text-sm">{message.content}</p>
          {message.cards && message.cards.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.cards.map((card, i) => (
                <CardRenderer key={i} card={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
