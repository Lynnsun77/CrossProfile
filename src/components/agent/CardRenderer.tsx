import { useNavigate } from 'react-router-dom';
import type { AgentCard, Asset } from '../../types';
import { AssetCard } from '../common/AssetCard';
import { useRoleStore } from '../../store/roleStore';

interface CardRendererProps {
  card: AgentCard;
}

export function CardRenderer({ card }: CardRendererProps) {
  const navigate = useNavigate();
  const { role } = useRoleStore();

  switch (card.type) {
    case 'asset':
      return (
        <AssetCard
          asset={card.data as Asset}
          role={role}
          onPrimaryAction={(asset) => navigate(`/marketplace/crowd/${asset.id}`)}
          onSecondaryAction={(asset) => navigate(`/marketplace/crowd/${asset.id}`)}
        />
      );
    case 'chart':
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">图表组件</p>
        </div>
      );
    case 'list':
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <ul className="space-y-2">
            {card.data.map((item: any, i: number) => (
              <li key={i} className="text-sm text-gray-700">• {item}</li>
            ))}
          </ul>
        </div>
      );
    case 'action':
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => (card.data?.to ? navigate(card.data.to) : undefined)}
            className="px-4 py-2 bg-market text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {card.data?.label ?? '查看'}
          </button>
        </div>
      );
    default:
      return null;
  }
}
