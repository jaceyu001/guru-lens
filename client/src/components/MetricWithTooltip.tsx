import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricWithTooltipProps {
  label: string;
  value: number | string;
  unit?: string;
  periodLabel?: string;
  tooltipContent?: string;
}

export function MetricWithTooltip({
  label,
  value,
  unit = "",
  periodLabel,
  tooltipContent,
}: MetricWithTooltipProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-sm text-slate-600">{label}</p>
        {tooltipContent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <p className="text-lg font-semibold text-slate-900">
        {typeof value === "number" ? value.toFixed(1) : value}
        {unit}
      </p>
      {periodLabel && (
        <p className="text-xs text-slate-500 italic">{periodLabel}</p>
      )}
    </div>
  );
}
