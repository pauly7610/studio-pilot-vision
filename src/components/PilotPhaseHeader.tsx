import { Calendar, Rocket, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PilotPhaseHeaderProps {
  region?: string;
  startDate?: string;
  phase?: "pre-launch" | "pilot" | "scaling";
}

export const PilotPhaseHeader = ({
  region = "APAC - Singapore",
  startDate = "February 3, 2025",
  phase = "pilot",
}: PilotPhaseHeaderProps) => {
  const phaseConfig = {
    "pre-launch": {
      label: "Pre-Launch",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
    pilot: {
      label: "Pilot Phase",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-chart-2/30",
    },
    scaling: {
      label: "Scaling",
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
  };

  const config = phaseConfig[phase];

  // Calculate days until/since start
  const startDateObj = new Date("2025-02-03");
  const today = new Date();
  const diffTime = startDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const getCountdownText = () => {
    if (diffDays > 0) {
      return `T-${diffDays} days to launch`;
    } else if (diffDays === 0) {
      return "🚀 Launch Day!";
    } else {
      return `Day ${Math.abs(diffDays)} of Pilot`;
    }
  };

  return (
    <div className={cn(
      "rounded-lg p-4 border mb-6",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Rocket className={cn("h-5 w-5", config.color)} />
            <span className={cn("font-semibold", config.color)}>
              {config.label}
            </span>
          </div>
          
          <Badge variant="outline" className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {region}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Start:</span>
            <span className="font-semibold">{startDate}</span>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1.5",
              diffDays <= 0 ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            )}
          >
            <Clock className="h-3 w-3" />
            {getCountdownText()}
          </Badge>
        </div>
      </div>

      {diffDays > 0 && diffDays <= 30 && (
        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          <span className="font-medium text-primary">Zero-Day Velocity Ready:</span>{" "}
          Key Partner Region data populated for February commencement
        </div>
      )}
    </div>
  );
};
