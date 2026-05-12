interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'blue' | 'amber' | 'red' | 'gray'
  size?: 'sm' | 'md'
}

const variantClasses = {
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center border rounded-full font-medium
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
