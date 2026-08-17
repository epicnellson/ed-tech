import { cn } from '../../lib/utils';

export default function PageShell({ 
  children, 
  className,
  title,
  subtitle,
  actions,
  maxWidth = 'max-w-7xl'
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={maxWidth}>
        {children}
      </div>
    </div>
  );
}

export function Section({ 
  children, 
  className,
  title,
  description,
  actions,
  noPadding = false
}) {
  return (
    <div className={cn("card", !noPadding && "p-6", className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageGrid({ children, className, cols = 3 }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols--cols-42 lg:grid',
  };
  
  return (
    <div className={cn("grid gap-6", gridCols[cols], className)}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = {
    primary: "bg-primary-100 text-primary-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="card">
      <div className="flex items-center gap-4 p-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold truncate">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel,
  onAction 
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
