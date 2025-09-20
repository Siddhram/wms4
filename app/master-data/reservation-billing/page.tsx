"use client";

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Plus, Pencil, Trash2, Calendar, AlertTriangle, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData, DocumentReference } from 'firebase/firestore';
import { parseISO, differenceInCalendarDays, format, isBefore, isAfter } from 'date-fns';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { CSVLink } from 'react-csv';
import BlinkingSirenIcon from '@/components/BlinkingSirenIcon';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

type Location = {
  locationId: string;
  locationName: string;
};

type Branch = {
  id: string;
  state: string;
  branch: string;
  locations: Location[];
  [key: string]: any;
};

const reservationFields = [
  'reservationId', 'state', 'branch', 'location', 'warehouse', 'client', 'clientId', 'billingStatus',
  'reservationRate', 'reservationQty', 'reservationStart', 'reservationEnd',
  'billingCycle', 'billingType', 'billingRate'
];

type Reservation = {
  id?: string;
  reservationId: string;
  state: string;
  branch: string;
  location: string;
  warehouse: string;
  client: string;
  clientId: string;
  billingStatus: 'processing' | 'unpaid' | 'complete';
  reservationRate: string;
  reservationQty: string;
  reservationStart: string;
  reservationEnd: string;
  billingCycle: string;
  billingType: string;
  billingRate: string;
  [key: string]: any;
};

export default function ReservationBillingPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [showCustomError, setShowCustomError] = useState(false);
  
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; row: Reservation | null }>({ open: false, row: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; row: Reservation | null }>({ open: false, row: null });
  const [addDialog, setAddDialog] = useState<{ open: boolean; row: Reservation | null }>({ open: false, row: null });
  const [alertModal, setAlertModal] = useState<{ open: boolean; type: 'alert' | 'update'; row: Reservation | null }>({ open: false, type: 'alert', row: null });
  
  // Form states
  const [newReservation, setNewReservation] = useState<Partial<Reservation>>({
    state: '', branch: '', location: '', warehouse: '', client: '', clientId: '', billingStatus: 'processing',
    reservationRate: '', reservationQty: '', reservationStart: '', reservationEnd: '',
    billingCycle: '-', billingType: '-', billingRate: '-'
  });
  const [editBillingForm, setEditBillingForm] = useState({ billingCycle: '', billingType: '', billingRate: '' });
  const [addBillingForm, setAddBillingForm] = useState({ billingCycle: '', billingType: '', billingRate: '' });

  // Fetch data function
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      const [reservationSnapshot, branchSnapshot, clientSnapshot, warehouseSnapshot] = await Promise.all([
        getDocs(collection(db, 'reservation')),
        getDocs(collection(db, 'branches')),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'warehouses'))
      ]);

      const fetchedReservations = reservationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reservation[];
      const fetchedBranches = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Branch[];
      const fetchedClients = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fetchedWarehouses = warehouseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setReservations(fetchedReservations);
      setBranches(fetchedBranches);
      setClients(fetchedClients);
      setWarehouses(fetchedWarehouses);
      
      // Cross-module reflection (requirement: reflect changes across modules)
      window.dispatchEvent(new CustomEvent('reservationDataUpdated', { detail: fetchedReservations }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data (requirement: ascending order by reservation code)
  const filteredReservations = useMemo(() => {
    const filtered = reservations.filter(r => 
      Object.values(r).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    // Sort by reservationId in ascending order
    return filtered.sort((a, b) => a.reservationId.localeCompare(b.reservationId));
  }, [reservations, searchTerm]);

  // CSV data preparation with Rs. formatting
  const csvData = useMemo(() => {
    return filteredReservations.map(reservation => ({
      ...reservation,
      reservationRate: `Rs. ${reservation.reservationRate}`,
      billingRate: reservation.billingRate !== '-' ? `Rs. ${reservation.billingRate}` : '-'
    }));
  }, [filteredReservations]);

  const csvHeaders = reservationFields.map(field => ({ label: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), key: field }));

  // Column definitions with Rs. formatting
  const reservationColumns: ColumnDef<Reservation>[] = [
    {
      accessorKey: "reservationId",
      header: "Reservation ID",
      cell: ({ row }) => <span className="font-medium">{row.original.reservationId}</span>
    },
    {
      accessorKey: "state",
      header: "State",
    },
    {
      accessorKey: "branch",
      header: "Branch",
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse",
    },
    {
      accessorKey: "client",
      header: "Client",
    },
    {
      accessorKey: "clientId",
      header: "Client ID",
    },
    {
      accessorKey: "billingStatus",
      header: "Billing Status",
      cell: ({ row }) => {
        const status = row.original.billingStatus;
        const colorMap = {
          'processing': 'bg-yellow-100 text-yellow-800 border-yellow-300',
          'unpaid': 'bg-red-100 text-red-800 border-red-300',
          'complete': 'bg-green-100 text-green-800 border-green-300'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full border ${colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: "reservationRate",
      header: "Reservation Rate",
      cell: ({ getValue }) => `Rs. ${getValue() as string}`
    },
    {
      accessorKey: "reservationQty",
      header: "Reservation Qty",
    },
    {
      accessorKey: "reservationStart",
      header: "Reservation Start",
      cell: ({ getValue }) => {
        const date = getValue() as string;
        try {
          return format(parseISO(date), 'dd/MM/yyyy');
        } catch {
          return date;
        }
      }
    },
    {
      accessorKey: "reservationEnd",
      header: "Reservation End",
      cell: ({ row }) => renderReservationEndCell(row.original)
    },
    {
      accessorKey: "billingCycle",
      header: "Billing Cycle",
    },
    {
      accessorKey: "billingType",
      header: "Billing Type",
    },
    {
      accessorKey: "billingRate",
      header: "Billing Rate",
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value !== '-' ? `Rs. ${value}` : '-';
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {canEditBilling(row.original) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditBillingForm({
                  billingCycle: row.original.billingCycle,
                  billingType: row.original.billingType,
                  billingRate: row.original.billingRate
                });
                setEditDialog({ open: true, row: row.original });
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {canAddBilling(row.original) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAddBillingForm({ billingCycle: '', billingType: '', billingRate: '' });
                setAddDialog({ open: true, row: row.original });
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-800"
            onClick={() => setDeleteDialog({ open: true, row: row.original })}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }
  ];

  // Helper functions for date validation and alerts
  function renderReservationEndCell(d: Reservation) {
    const today = new Date();
    const endDate = parseISO(d.reservationEnd);
    const daysRemaining = differenceInCalendarDays(endDate, today);

    // Red alert: less than 5 days remaining
    if (daysRemaining >= 0 && daysRemaining < 5) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-700">{String(d.reservationEnd)}</span>
          <button
            className="p-0 m-0 bg-transparent border-none focus:outline-none"
            title="Less than 5 days remaining"
            onClick={() => setAlertModal({ open: true, type: 'alert', row: d })}
            type="button"
          >
            <BlinkingSirenIcon color="red" size={24} />
          </button>
        </div>
      );
    } else if (daysRemaining < 0) {
      // Blue alert: expired dates
      if (d.billingCycle && d.billingCycle !== '-' && d.billingType && d.billingType !== '-' && d.billingRate && d.billingRate !== '-') {
        return (
          <div className="flex items-center gap-2">
            <span className="text-blue-700">{String(d.reservationEnd)}</span>
            <button
              className="p-0 m-0 bg-transparent border-none focus:outline-none"
              title="Expired with billing details"
              onClick={() => setAlertModal({ open: true, type: 'update', row: d })}
              type="button"
            >
              <BlinkingSirenIcon color="blue" size={24} />
            </button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <span className="text-green-700">{String(d.reservationEnd)}</span>
            <button
              className="p-0 m-0 bg-transparent border-none focus:outline-none"
              title="Update"
              onClick={() => setAlertModal({ open: true, type: 'update', row: d })}
              type="button"
            >
              <BlinkingSirenIcon color="blue" size={24} />
            </button>
          </div>
        );
      }
    }
    return <span className="text-green-700">{String(d.reservationEnd)}</span>;
  }

  function canEditBilling(row: Reservation) {
    return row.billingCycle && row.billingCycle !== '-' && row.billingType && row.billingType !== '-' && row.billingRate && row.billingRate !== '-';
  }

  function canAddBilling(row: Reservation) {
    return (!row.billingCycle || row.billingCycle === '-') && (!row.billingType || row.billingType === '-') && (!row.billingRate || row.billingRate === '-');
  }

  // Handler functions
  async function handleDeleteReservation(row: Reservation) {
    if (!row.id) {
      toast({ title: 'Delete Failed', description: 'No document ID found.', variant: 'destructive' });
      return;
    }
    try {
      await deleteDoc(doc(db, 'reservation', row.id));
      setReservations(prev => prev.filter(r => r.id !== row.id));
      toast({ title: 'Reservation deleted successfully!', variant: 'default' });
    } catch (err) {
      toast({ title: 'Delete Failed', description: String(err), variant: 'destructive' });
    }
    setDeleteDialog({ open: false, row: null });
  }

  async function handleEditBillingSubmit() {
    if (!editDialog.row?.id) return;
    try {
      await updateDoc(doc(db, 'reservation', editDialog.row.id), editBillingForm);
      setReservations(prev => prev.map(r => r.id === editDialog.row?.id ? { ...r, ...editBillingForm } : r));
      toast({ title: 'Billing details updated!', variant: 'default' });
      setEditDialog({ open: false, row: null });
    } catch (err) {
      toast({ title: 'Update Failed', description: String(err), variant: 'destructive' });
    }
  }

  async function handleAddBillingSubmit() {
    if (!addDialog.row?.id) return;
    
    // Validate that billing cycle and type are not the same as previous entry
    const hasDuplicate = reservations.some(r => 
      r.id !== addDialog.row?.id && 
      r.billingCycle === addBillingForm.billingCycle && 
      r.billingType === addBillingForm.billingType &&
      r.warehouse === addDialog.row?.warehouse &&
      r.client === addDialog.row?.client
    );
    
    if (hasDuplicate) {
      setShowCustomError(true);
      setTimeout(() => setShowCustomError(false), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, 'reservation', addDialog.row.id), addBillingForm);
      setReservations(prev => prev.map(r => r.id === addDialog.row?.id ? { ...r, ...addBillingForm } : r));
      toast({ title: 'Billing details added!', variant: 'default' });
      setAddDialog({ open: false, row: null });
    } catch (err) {
      toast({ title: 'Add Failed', description: String(err), variant: 'destructive' });
    }
  }

  // Date validation helper
  function validateDates(startDate: string, endDate: string) {
    if (!startDate || !endDate) return true;
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return isBefore(start, end);
    } catch {
      return true;
    }
  }

  // Get filtered branches, locations, warehouses based on selections
  const getFilteredBranches = () => branches.filter(b => b.state === newReservation.state);
  const getFilteredLocations = () => {
    const selectedBranch = branches.find(b => b.branch === newReservation.branch && b.state === newReservation.state);
    return selectedBranch?.locations || [];
  };
  const getFilteredWarehouses = () => warehouses.filter(w => 
    w.state === newReservation.state && 
    w.branch === newReservation.branch && 
    w.location === newReservation.location
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reservation & Billing Management</h1>
        </div>

        {/* Search and Controls */}
        <Card className="border-green-300">
          <CardHeader className="bg-orange-100">
            <CardTitle className="text-orange-600">Search & Filters</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <CSVLink data={csvData} headers={csvHeaders} filename={"reservation_billing_export.csv"} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2" target="_blank">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </CSVLink>
            </div>
            
            {/* Entry count display (requirement: count below search bar) */}
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                <strong>Total Entries: {filteredReservations.length}</strong> 
                {searchTerm && <span className="ml-2">(filtered from {reservations.length})</span>}
              </div>
              <div className="text-xs text-gray-500">
                {filteredReservations.length > 0 && "Showing entries in ascending order by reservation code"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex justify-end">
          <div className="border p-2 rounded-md bg-gray-50 text-sm max-w-xs">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 bg-red-500 rounded-full"></span>
              <span>- Expired and updated billing details</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="h-3 w-3 bg-blue-500 rounded-full"></span>
              <span>- Expired with billing details</span>
            </div>
          </div>
        </div>

        <CardContent>
          <DataTable
            columns={reservationColumns}
            data={filteredReservations}
            isLoading={loading}
            error={error || undefined}
            wrapperClassName="border-green-300"
            headClassName="bg-orange-100 text-orange-600 font-bold"
            stickyHeader={true} // requirement: freeze top row header
            stickyFirstColumn={true} // requirement: freeze first column  
            showGridLines={true} // requirement: grid lines in table
          />
        </CardContent>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={isOpen => setDeleteDialog({ open: isOpen, row: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reservation? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteReservation(deleteDialog.row!)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit billing details modal */}
        <Dialog open={editDialog.open} onOpenChange={isOpen => setEditDialog({ open: isOpen, row: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Billing</DialogTitle>
              <DialogDescription>Update billing details for this reservation.</DialogDescription>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); handleEditBillingSubmit(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select value={editBillingForm.billingCycle} onValueChange={v => setEditBillingForm(f => ({ ...f, billingCycle: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Billing Type</Label>
                  <Select value={editBillingForm.billingType} onValueChange={v => setEditBillingForm(f => ({ ...f, billingType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Big bag">Big bag</SelectItem>
                      <SelectItem value="Small bag">Small bag</SelectItem>
                      <SelectItem value="Qty">Qty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Billing Rate (Rs/MT)</Label>
                  <Input type="number" min="0" value={editBillingForm.billingRate} onChange={e => setEditBillingForm(f => ({ ...f, billingRate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 shadow-lg">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add billing modal */}
        <Dialog open={addDialog.open} onOpenChange={isOpen => setAddDialog({ open: isOpen, row: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Billing</DialogTitle>
              <DialogDescription>Add billing details for this reservation.</DialogDescription>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); handleAddBillingSubmit(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select value={addBillingForm.billingCycle} onValueChange={v => setAddBillingForm(f => ({ ...f, billingCycle: v }))} required>
                    <SelectTrigger><SelectValue placeholder="Select billing cycle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Billing Type</Label>
                  <Select value={addBillingForm.billingType} onValueChange={v => setAddBillingForm(f => ({ ...f, billingType: v }))} required>
                    <SelectTrigger><SelectValue placeholder="Select billing type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Big bag">Big bag</SelectItem>
                      <SelectItem value="Small bag">Small bag</SelectItem>
                      <SelectItem value="Qty">Qty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Billing Rate (Rs/MT)</Label>
                  <Input type="number" min="0" value={addBillingForm.billingRate} onChange={e => setAddBillingForm(f => ({ ...f, billingRate: e.target.value }))} required />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 shadow-lg">Add Row</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {showCustomError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg z-[9999]">
            <p className="text-red-600">Billing Cycle and Billing Type cannot be the same as the previous entry.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
