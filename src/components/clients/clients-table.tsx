"use client";

import { useState } from "react";
import { Search, Mail, Phone, Calendar, Filter, Trash2, MoreHorizontal, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";

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
  const t = useTranslations();
  const { formatDate, formatTime } = useDateFormatter();

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
        title={t('clients.empty.title')}
        description={t('clients.empty.description')}
        buttonText={t('clients.empty.buttonText')}
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
            placeholder={t('clients.search.placeholder')}
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
              title: t('clients.filter.title'),
              description: t('clients.filter.comingSoon'),
              variant: "default",
            });
          }}
        >
          <Filter className="h-4 w-4" />
          {t('clients.filter.button')}
        </Button>
      </div>

      {/* Show appropriate content based on filtered clients */}
      {filteredClients.length === 0 ? (
        <div className="rounded-md border border-indigo-100 overflow-hidden shadow-sm">
          <div className="h-24 flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 text-indigo-300" />
            <p>{t('clients.search.noResults')}</p>
            <p className="text-sm">{t('clients.search.adjustSearch')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View - Hidden on Mobile */}
          <div className="rounded-md border border-indigo-100 overflow-hidden shadow-sm hidden md:block">
            <Table>
              <TableHeader className="bg-indigo-50">
                <TableRow>
                  <TableHead className="text-indigo-700 font-semibold">{t('clients.table.client')}</TableHead>
                  <TableHead className="text-indigo-700 font-semibold">{t('clients.table.contact')}</TableHead>
                  <TableHead className="text-indigo-700 font-semibold">{t('clients.table.appointments')}</TableHead>
                  <TableHead className="text-indigo-700 font-semibold">{t('clients.table.lastAppointment')}</TableHead>
                  <TableHead className="text-indigo-700 font-semibold w-[80px]">{t('clients.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
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
                        {client.appointmentsCount} {client.appointmentsCount === 1
                          ? t('clients.appointmentCount.singular')
                          : t('clients.appointmentCount.plural')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.lastAppointment ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-indigo-700">{formatDate(new Date(client.lastAppointment), { shortDate: true })}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(new Date(client.lastAppointment))}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t('clients.noAppointments')}</span>
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
                          <DropdownMenuLabel className="text-indigo-700">{t('clients.actions.title')}</DropdownMenuLabel>
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
                            {t('clients.actions.bookAppointment')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                            onClick={() => {
                              setClientToEdit(client);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                            {t('clients.editClient')}
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
                            {t('clients.actions.remove')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - Visible only on Mobile */}
          <div className="space-y-3 md:hidden">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="border border-indigo-100 rounded-md p-3 shadow-sm hover:bg-indigo-50/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium truncate mr-2">{client.name}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-indigo-700">{t('clients.actions.title')}</DropdownMenuLabel>
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
                        {t('clients.actions.bookAppointment')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                        onClick={() => {
                          setClientToEdit(client);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                        {t('clients.editClient')}
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
                        {t('clients.actions.remove')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col space-y-1.5 mb-2">
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-3 w-3 text-indigo-500" />
                    <span className="text-sm truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="mr-2 h-3 w-3 text-indigo-500" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {client.appointmentsCount} {client.appointmentsCount === 1
                      ? t('clients.appointmentCount.singular')
                      : t('clients.appointmentCount.plural')}
                  </Badge>

                  {client.lastAppointment ? (
                    <div className="flex items-center text-xs">
                      <span className="text-muted-foreground mr-1">{t('clients.table.lastAppointment')}:</span>
                      <span className="font-medium text-indigo-700">{formatDate(new Date(client.lastAppointment), { shortDate: true })}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('clients.noAppointments')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
