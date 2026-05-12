interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#1a1d27] dark:bg-[#1a1d27] light:bg-white border border-[#2a2d3a] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  )
}
