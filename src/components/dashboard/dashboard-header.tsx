interface DashboardHeaderProps {
  heading: React.ReactNode;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-0 sm:px-2 mb-4 sm:mb-0">
      <div className="grid gap-1 mb-3 sm:mb-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide">{heading}</h1>
        {text && <p className="text-sm md:text-base text-muted-foreground">{text}</p>}
      </div>
      {children && (
        <div className="mt-2 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  );
}
