import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppointmentStatusBadgeProps {
  status: string;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        getStatusColor(status)
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
