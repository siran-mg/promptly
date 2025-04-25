"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function NoMatchingAppointments() {
  const router = useRouter();

  const clearAllFilters = () => {
    router.push('/dashboard/appointments');
  };

  return (
    <div className="p-8 rounded-md text-center my-6 border-2 bg-amber-50 border-amber-300">
      <Search className="h-12 w-12 text-amber-500 mx-auto mb-3" />
      <h3 className="text-2xl font-medium text-amber-800 mb-2">No matching appointments</h3>
      <p className="text-amber-700 mb-6">Your search or filter criteria didn't match any appointments.</p>
      <div className="flex justify-center">
        <Button
          size="lg"
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-8 py-6 text-lg h-auto"
          onClick={clearAllFilters}
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
}
