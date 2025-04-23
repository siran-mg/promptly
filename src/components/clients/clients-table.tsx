"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Search, Mail, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <Card>
        <CardHeader className="text-center">
          <CardTitle>No clients yet</CardTitle>
          <CardDescription>
            When you book appointments, your clients will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Users className="h-16 w-16 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Appointments</TableHead>
              <TableHead>Last Appointment</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Phone className="mr-2 h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {client.appointmentsCount} {client.appointmentsCount === 1 ? 'appointment' : 'appointments'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.lastAppointment ? (
                      format(new Date(client.lastAppointment), "PPP")
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => 
                          toast({
                            title: "View client details",
                            description: "This feature is coming soon.",
                          })
                        }>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => 
                          toast({
                            title: "Book appointment",
                            description: "This feature is coming soon.",
                          })
                        }>
                          Book appointment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => 
                          toast({
                            title: "Send message",
                            description: "This feature is coming soon.",
                          })
                        }>
                          Send message
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
    </div>
  );
}

// Import the Users icon for the empty state
import { Users } from "lucide-react";
