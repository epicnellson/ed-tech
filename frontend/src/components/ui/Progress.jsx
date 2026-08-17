import { cn } from '../../lib/utils'

const Progress = ({ value = 0, className, ...props }) => (
  <div
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <div
      className="h-full bg-primary-600 transition-all duration-300 ease-in-out"
      style={{ width: `${value}%` }}
    />
  </div>
)

export { Progress }
