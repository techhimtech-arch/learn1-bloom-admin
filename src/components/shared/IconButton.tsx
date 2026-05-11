/**
 * IconButton — A reusable icon-only button with a built-in tooltip.
 * 
 * Usage:
 *   <IconButton tooltip="Edit Subject" onClick={handleEdit} variant="ghost">
 *     <Pencil className="h-4 w-4" />
 *   </IconButton>
 */
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ButtonProps } from '@/components/ui/button';

interface IconButtonProps extends ButtonProps {
  tooltip: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

export function IconButton({
  tooltip,
  tooltipSide = 'top',
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
