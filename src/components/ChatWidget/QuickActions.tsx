import React from 'react';

interface QuickActionsProps {
  onQuickAction: (message: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onQuickAction }) => {
  const quickActions = [
    {
      text: 'Photo Pricing',
      message: 'How much does photo scanning cost?'
    },
    {
      text: 'Order Status',
      message: 'Check my order status'
    },
    {
      text: 'Video Transfer',
      message: 'Video transfer options'
    },
    {
      text: 'Turnaround Time',
      message: 'How long does digitization take?'
    }
  ];

  return (
    <div className="quick-actions">
      {quickActions.map((action, index) => (
        <button
          key={index}
          className="quick-action"
          onClick={() => onQuickAction(action.message)}
        >
          {action.text}
        </button>
      ))}
    </div>
  );
};
