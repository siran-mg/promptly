"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Mail, Phone, Calendar, Filter, Trash2, MoreHorizontal, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyClientsState } from "./empty-clients-state";
import { DeleteClientDialog } from "./delete-client-dialog";
import { EditClientDialog } from "./edit-client-dialog";

// Define a client type based on appointments
type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentsCount: number;
  lastAppointment: string | null;
};

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter clients based on search query
  const filteredClients = clients.filter((client) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.phone.toLowerCase().includes(searchLower)
    );
  });

  // If no clients, show empty state
  if (clients.length === 0) {
    return (
      <EmptyClientsState
        title="No Clients Yet"
        description="Your client list will grow as you book appointments"
        buttonText="Create Your First Appointment"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
          <Input
            type="search"
            placeholder="Search by name, email, or phone..."
            className="pl-10 h-10 border-indigo-200 focus-visible:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          className="gap-2 h-10 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          onClick={() => {
            toast({
              title: "Filter Clients",
              description: "Advanced filtering options coming soon.",
              variant: "default",
            });
          }}
        >
          <Filter className="h-4 w-4" />
          Filter Clients
        </Button>
      </div>

      <div className="rounded-md border border-indigo-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-indigo-50">
            <TableRow>
              <TableHead className="text-indigo-700 font-semibold">Client</TableHead>
              <TableHead className="text-indigo-700 font-semibold">Contact</TableHead>
              <TableHead className="text-indigo-700 font-semibold">Appointments</TableHead>
              <TableHead className="text-indigo-700 font-semibold">Last Appointment</TableHead>
              <TableHead className="text-indigo-700 font-semibold w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 text-indigo-300" />
                    <p>No clients match your search criteria.</p>
                    <p className="text-sm">Try adjusting your search terms.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-indigo-50/30 transition-colors">
                  <TableCell className="font-medium">
                    {client.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-3 w-3 text-indigo-500" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Phone className="mr-2 h-3 w-3 text-indigo-500" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                      {client.appointmentsCount} {client.appointmentsCount === 1 ? 'appointment' : 'appointments'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.lastAppointment ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-indigo-700">{format(new Date(client.lastAppointment), "MMM d, yyyy")}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(client.lastAppointment), "h:mm a")}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-indigo-700">Client Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                          onClick={() => {
                            // Create URL with client info as query parameters
                            const params = new URLSearchParams({
                              clientName: client.name,
                              clientEmail: client.email,
                              clientPhone: client.phone
                            });

                            // Redirect to new appointment page with client info
                            window.location.href = `/dashboard/appointments/new?${params.toString()}`;
                          }}
                        >
                          <Calendar className="mr-2 h-4 w-4 text-green-600" />
                          Book New Appointment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                          onClick={() => {
                            setClientToEdit(client);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="hover:bg-indigo-50 hover:text-red-700 cursor-pointer"
                          onClick={() => {
                            setClientToDelete(client);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Remove Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        client={clientToDelete}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleteSuccess={() => {
          // Reload the page to refresh the client list
          window.location.reload();
        }}
      />

      {/* Edit Client Dialog */}
      <EditClientDialog
        client={clientToEdit}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateSuccess={() => {
          // Reload the page to refresh the client list
          window.location.reload();
        }}
      />
    </div>
  );
}
