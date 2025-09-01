interface StatusBadgeProps {
  scope: 'Channel' | 'AllStyle';
}

export function StatusBadge({ scope }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  const scopeStyles = {
    Channel: "bg-blue-100 text-blue-800",
    AllStyle: "bg-purple-100 text-purple-800"
  };

  const scopeLabels = {
    Channel: "Channel Specific",
    AllStyle: "All Style"
  };

  return (
    <span className={`${baseClasses} ${scopeStyles[scope]}`}>
      {scopeLabels[scope]}
    </span>
  );
}