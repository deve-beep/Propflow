import clsx from 'clsx';

export const Button = ({ variant = 'primary', className, children, ...props }) => {
  const base =
    variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
  return (
    <button className={clsx(base, className, props.disabled && 'opacity-50 cursor-not-allowed')} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, tone = 'default' }) => {
  const tones = {
    default: 'bg-stone-100 text-charcoal-700',
    success: 'bg-olive-400/15 text-olive-600',
    warning: 'bg-sand-300/40 text-bronze-500',
    danger: 'bg-terracotta-400/15 text-terracotta-700',
    dark: 'bg-charcoal-900 text-ivory-50',
  };
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
};

export const Spinner = ({ className }) => (
  <div className={clsx('w-6 h-6 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin', className)} />
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {Icon && <Icon className="w-10 h-10 text-charcoal-300 mb-4" strokeWidth={1.25} />}
    <h3 className="text-lg font-serif text-charcoal-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-charcoal-500 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

export const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner />
  </div>
);
