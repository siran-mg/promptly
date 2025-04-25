import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStatusFormatter } from "@/hooks/use-status-formatter";

interface AppointmentStatusBadgeProps {
  status: string;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const { translateStatus, getStatusVariant } = useStatusFormatter();

  // Map status variant to custom colors
  const getStatusColor = (variant: string) => {
    switch (variant) {
      case "default":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "success":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "destructive":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  const variant = getStatusVariant(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        getStatusColor(variant)
      )}
    >
      {translateStatus(status)}
    </Badge>
  );
}
