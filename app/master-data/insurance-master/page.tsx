"use client";

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Download, Plus, Edit, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { parseISO, format } from 'date-fns';

// Interfaces
interface InsuranceData {
  id?: string;
  insuranceCode: string;
  warehouseName: string;
  warehouseCode: string;
  state: string;
  branch: string;
  location: string;
  commodityName: string;
  varietyName: string;
  insuranceType: 'bank-funded' | 'client' | 'agrogreen';
  clientName?: string;
  clientCode?: string;
  clientAddress?: string;
  bankFundedBy?: string;
  firePolicyCompanyName: string;
  firePolicyNumber: string;
  firePolicyAmount: string;
  firePolicyStartDate: string;
  firePolicyEndDate: string;
  burglaryPolicyCompanyName: string;
  burglaryPolicyNumber: string;
  burglaryPolicyAmount: string;
  burglaryPolicyStartDate: string;
  burglaryPolicyEndDate: string;
  createdAt: string;
}

interface CommodityData {
  id: string;
  commodityId: string;
  commodityName: string;
  varieties: Array<{
    varietyId: string;
    varietyName: string;
    locationId: string;
    locationName: string;
    branchName: string;
  }>;
}

interface ClientData {
  id: string;
  clientId: string;
  firmName: string;
  companyAddress: string;
  warehouseName: string;
  warehouseCode: string;
  commodityName: string;
  varietyName: string;
}

interface WarehouseData {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  state: string;
  branch: string;
  location: string;
}

interface BankData {
  id: string;
  bankId: string;
  bankName: string;
  state: string;
  branch: string;
}

export default function InsuranceMasterPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [insuranceData, setInsuranceData] = useState<InsuranceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reference data
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [banks, setBanks] = useState<BankData[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceData | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; insurance: InsuranceData | null }>({ open: false, insurance: null });

  // Form state
  const [formData, setFormData] = useState<Partial<InsuranceData>>({
    state: '',
    branch: '',
    location: '',
    warehouseName: '',
    warehouseCode: '',
    commodityName: '',
    varietyName: '',
    insuranceType: 'bank-funded',
    clientName: '',
    clientCode: '',
    clientAddress: '',
    bankFundedBy: '',
    firePolicyCompanyName: '',
    firePolicyNumber: '',
    firePolicyAmount: '',
    firePolicyStartDate: '',
    firePolicyEndDate: '',
    burglaryPolicyCompanyName: '',
    burglaryPolicyNumber: '',
    burglaryPolicyAmount: '',
    burglaryPolicyStartDate: '',
    burglaryPolicyEndDate: '',
  });

  // Multiple commodity selection
  const [selectedCommodities, setSelectedCommodities] = useState<Array<{
    commodityName: string;
    varietyName: string;
  }>>([]);

  // Column definitions with insurance code
  const insuranceColumns: ColumnDef<InsuranceData>[] = [
    {
      accessorKey: "insuranceCode",
      header: "Insurance Code",
      cell: ({ row }) => <span className="font-bold text-orange-800">{row.getValue("insuranceCode")}</span>
    },
    {
      accessorKey: "warehouseName",
      header: "Warehouse Name",
      cell: ({ row }) => <span className="text-green-700 font-medium">{row.getValue("warehouseName")}</span>
    },
    {
      accessorKey: "warehouseCode",
      header: "Warehouse Code",
      cell: ({ row }) => <span className="text-blue-700">{row.getValue("warehouseCode")}</span>
    },
    {
      accessorKey: "commodityName",
      header: "Commodity",
      cell: ({ row }) => <span className="text-purple-700">{row.getValue("commodityName")}</span>
    },
    {
      accessorKey: "varietyName",
      header: "Variety",
      cell: ({ row }) => <span className="text-purple-600">{row.getValue("varietyName")}</span>
    },
    {
      accessorKey: "insuranceType",
      header: "Insurance Type",
      cell: ({ row }) => {
        const type = row.getValue("insuranceType") as 'bank-funded' | 'client' | 'agrogreen';
        const colorMap: Record<string, string> = {
          'bank-funded': 'bg-blue-100 text-blue-800 border-blue-300',
          'client': 'bg-green-100 text-green-800 border-green-300',
          'agrogreen': 'bg-orange-100 text-orange-800 border-orange-300'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full border ${colorMap[type] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
            {type === 'bank-funded' ? 'Bank Funded' : type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        );
      }
    },
    {
      accessorKey: "clientName",
      header: "Client Name",
      cell: ({ row }) => <span className="text-gray-700">{row.getValue("clientName") || '-'}</span>
    },
    {
      accessorKey: "bankFundedBy",
      header: "Bank Funded By",
      cell: ({ row }) => <span className="text-blue-700">{row.getValue("bankFundedBy") || '-'}</span>
    },
    {
      accessorKey: "firePolicyNumber",
      header: "Fire Policy No.",
      cell: ({ row }) => <span className="text-red-700">{row.getValue("firePolicyNumber")}</span>
    },
    {
      accessorKey: "firePolicyEndDate",
      header: "Fire Policy End",
      cell: ({ row }) => {
        const date = row.getValue("firePolicyEndDate") as string;
        try {
          return <span className="text-red-600">{format(parseISO(date), 'dd/MM/yyyy')}</span>;
        } catch {
          return <span className="text-red-600">{date}</span>;
        }
      }
    },
    {
      accessorKey: "burglaryPolicyNumber",
      header: "Burglary Policy No.",
      cell: ({ row }) => <span className="text-orange-700">{row.getValue("burglaryPolicyNumber")}</span>
    },
    {
      accessorKey: "burglaryPolicyEndDate",
      header: "Burglary Policy End",
      cell: ({ row }) => {
        const date = row.getValue("burglaryPolicyEndDate") as string;
        try {
          return <span className="text-orange-600">{format(parseISO(date), 'dd/MM/yyyy')}</span>;
        } catch {
          return <span className="text-orange-600">{date}</span>;
        }
      }
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        try {
          return <span className="text-gray-600">{format(parseISO(date), 'dd/MM/yyyy')}</span>;
        } catch {
          return <span className="text-gray-600">{date}</span>;
        }
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setDeleteDialog({ open: true, insurance: row.original })}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }
  ];

  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        insuranceSnapshot,
        commoditySnapshot,
        clientSnapshot,
        warehouseSnapshot,
        bankSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'insurance')),
        getDocs(collection(db, 'commodities')),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'warehouses')),
        getDocs(collection(db, 'banks'))
      ]);

      const fetchedInsurance = insuranceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InsuranceData[];
      const fetchedCommodities = commoditySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CommodityData[];
      const fetchedClients = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClientData[];
      const fetchedWarehouses = warehouseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WarehouseData[];
      const fetchedBanks = bankSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankData[];

      setInsuranceData(fetchedInsurance);
      setCommodities(fetchedCommodities);
      setClients(fetchedClients);
      setWarehouses(fetchedWarehouses);
      setBanks(fetchedBanks);

      // Cross-module reflection (requirement: reflect changes across modules)
      window.dispatchEvent(new CustomEvent('insuranceDataUpdated', { 
        detail: { 
          insurance: fetchedInsurance, 
          timestamp: new Date() 
        } 
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data (requirement: ascending order by insurance code)
  const filteredInsurance = useMemo(() => {
    const filtered = insuranceData.filter(insurance =>
      Object.values(insurance).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    // Sort by insuranceCode in ascending order
    return filtered.sort((a, b) => a.insuranceCode.localeCompare(b.insuranceCode));
  }, [insuranceData, searchTerm]);

  // CSV data preparation with proper headers
  const csvData = useMemo(() => {
    return filteredInsurance.map(insurance => ({
      'Insurance Code': insurance.insuranceCode,
      'Warehouse Name': insurance.warehouseName,
      'Warehouse Code': insurance.warehouseCode,
      'Commodity': insurance.commodityName,
      'Variety Name': insurance.varietyName,
      'Insurance Type': insurance.insuranceType === 'bank-funded' ? 'Bank Funded' : 
                      insurance.insuranceType.charAt(0).toUpperCase() + insurance.insuranceType.slice(1),
      'Client Name': insurance.clientName || '-',
      'Client Code': insurance.clientCode || '-',
      'Bank Funded By': insurance.bankFundedBy || '-', // Fixed header name
      'Fire Policy Company': insurance.firePolicyCompanyName,
      'Fire Policy Number': insurance.firePolicyNumber,
      'Fire Policy Amount': insurance.firePolicyAmount,
      'Fire Policy Start Date': insurance.firePolicyStartDate,
      'Fire Policy End Date': insurance.firePolicyEndDate,
      'Burglary Policy Company': insurance.burglaryPolicyCompanyName,
      'Burglary Policy Number': insurance.burglaryPolicyNumber,
      'Burglary Policy Amount': insurance.burglaryPolicyAmount,
      'Burglary Policy Start Date': insurance.burglaryPolicyStartDate,
      'Burglary Policy End Date': insurance.burglaryPolicyEndDate,
      'Created Date': format(parseISO(insurance.createdAt), 'dd/MM/yyyy') // Date only, not time
    }));
  }, [filteredInsurance]);

  const csvHeaders = [
    { label: 'Insurance Code', key: 'Insurance Code' },
    { label: 'Warehouse Name', key: 'Warehouse Name' },
    { label: 'Warehouse Code', key: 'Warehouse Code' },
    { label: 'Commodity', key: 'Commodity' },
    { label: 'Variety Name', key: 'Variety Name' },
    { label: 'Insurance Type', key: 'Insurance Type' },
    { label: 'Client Name', key: 'Client Name' },
    { label: 'Client Code', key: 'Client Code' },
    { label: 'Bank Funded By', key: 'Bank Funded By' },
    { label: 'Fire Policy Company', key: 'Fire Policy Company' },
    { label: 'Fire Policy Number', key: 'Fire Policy Number' },
    { label: 'Fire Policy Amount', key: 'Fire Policy Amount' },
    { label: 'Fire Policy Start Date', key: 'Fire Policy Start Date' },
    { label: 'Fire Policy End Date', key: 'Fire Policy End Date' },
    { label: 'Burglary Policy Company', key: 'Burglary Policy Company' },
    { label: 'Burglary Policy Number', key: 'Burglary Policy Number' },
    { label: 'Burglary Policy Amount', key: 'Burglary Policy Amount' },
    { label: 'Burglary Policy Start Date', key: 'Burglary Policy Start Date' },
    { label: 'Burglary Policy End Date', key: 'Burglary Policy End Date' },
    { label: 'Created Date', key: 'Created Date' }
  ];

  // Generate unique insurance code
  const generateInsuranceCode = () => {
    if (insuranceData.length === 0) {
      return 'INS-0001';
    }
    
    const existingNumbers = insuranceData
      .map(insurance => insurance.insuranceCode)
      .filter(code => code && code.startsWith('INS-'))
      .map(code => parseInt(code.split('-')[1]))
      .filter(num => !isNaN(num));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    return `INS-${nextNumber.toString().padStart(4, '0')}`;
  };

  // Get today's date for validation
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Handle form input changes
  const handleInputChange = (field: keyof InsuranceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-populate client details when client is selected
    if (field === 'clientName') {
      const selectedClient = clients.find(client => client.firmName === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientCode: selectedClient.clientId,
          clientAddress: selectedClient.companyAddress,
          warehouseName: selectedClient.warehouseName,
          warehouseCode: selectedClient.warehouseCode,
          commodityName: selectedClient.commodityName,
          varietyName: selectedClient.varietyName
        }));
      }
    }

    // Auto-populate warehouse details when warehouse is selected
    if (field === 'warehouseName') {
      const selectedWarehouse = warehouses.find(warehouse => warehouse.warehouseName === value);
      if (selectedWarehouse) {
        setFormData(prev => ({
          ...prev,
          warehouseCode: selectedWarehouse.warehouseCode,
          state: selectedWarehouse.state,
          branch: selectedWarehouse.branch,
          location: selectedWarehouse.location
        }));
      }
    }
  };

  // Handle commodity selection (multiple selection support)
  const handleCommoditySelection = (commodityName: string, varietyName: string) => {
    const newSelection = { commodityName, varietyName };
    setSelectedCommodities(prev => {
      const existing = prev.find(item => 
        item.commodityName === commodityName && item.varietyName === varietyName
      );
      
      if (existing) {
        // Remove if already selected
        return prev.filter(item => 
          !(item.commodityName === commodityName && item.varietyName === varietyName)
        );
      } else {
        // Add new selection
        return [...prev, newSelection];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate end dates are not in the past
    const today = getTodayDate();
    if (formData.firePolicyEndDate && formData.firePolicyEndDate < today) {
      toast({
        title: "❌ Invalid Date",
        description: "Fire policy end date cannot be in the past",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (formData.burglaryPolicyEndDate && formData.burglaryPolicyEndDate < today) {
      toast({
        title: "❌ Invalid Date", 
        description: "Burglary policy end date cannot be in the past",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const insuranceCode = editingInsurance ? editingInsurance.insuranceCode : generateInsuranceCode();
      
      const insuranceDataToSave = {
        ...formData,
        insuranceCode,
        createdAt: editingInsurance ? editingInsurance.createdAt : new Date().toISOString(),
        selectedCommodities // Save multiple commodity selections
      };

      if (editingInsurance) {
        await updateDoc(doc(db, 'insurance', editingInsurance.id!), insuranceDataToSave);
        toast({
          title: "✅ Insurance Updated",
          description: "Insurance policy has been updated successfully",
          className: "bg-green-100 border-green-500 text-green-700",
          duration: 3000,
        });
      } else {
        await addDoc(collection(db, 'insurance'), insuranceDataToSave);
        toast({
          title: "✅ Insurance Added",
          description: `New insurance policy created with code: ${insuranceCode}`,
          className: "bg-green-100 border-green-500 text-green-700",
          duration: 3000,
        });
      }

      // Reset form and close modal
      setFormData({});
      setSelectedCommodities([]);
      setEditingInsurance(null);
      setShowAddModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to save insurance policy. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Handle edit
  const handleEdit = (insurance: InsuranceData) => {
    setEditingInsurance(insurance);
    setFormData(insurance);
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = async (insurance: InsuranceData) => {
    try {
      await deleteDoc(doc(db, 'insurance', insurance.id!));
      toast({
        title: "✅ Insurance Deleted",
        description: "Insurance policy has been deleted successfully",
        className: "bg-green-100 border-green-500 text-green-700",
        duration: 3000,
      });
      setDeleteDialog({ open: false, insurance: null });
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to delete insurance policy. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Close modal and reset form
  const closeModal = () => {
    setShowAddModal(false);
    setEditingInsurance(null);
    setFormData({});
    setSelectedCommodities([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Insurance Master Module</h1>
          {/* Add Insurance button at top right corner */}
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Insurance
          </Button>
        </div>

        {/* Search and Export Controls */}
        <Card className="border-green-300">
          <CardHeader className="bg-orange-100">
            <CardTitle className="text-orange-600">Search & Export Options</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search insurance policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <CSVLink 
                data={csvData} 
                headers={csvHeaders} 
                filename={`insurance_master_${new Date().toISOString().split('T')[0]}.csv`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 h-10 px-4 py-2"
                target="_blank"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </CSVLink>
            </div>
            
            {/* Entry count display */}
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                <strong>Total Entries: {filteredInsurance.length}</strong>
                {searchTerm && <span className="ml-2">(filtered from {insuranceData.length})</span>}
              </div>
              <div className="text-xs text-gray-500">
                {filteredInsurance.length > 0 && "Showing entries in ascending order by insurance code"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Data Table */}
        <Card className="border-green-300">
          <CardHeader className="bg-orange-100">
            <CardTitle className="text-orange-600">Insurance Policies</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={insuranceColumns}
              data={filteredInsurance}
              isLoading={loading}
              error={error || undefined}
              wrapperClassName="border-green-300"
              headClassName="bg-orange-100 text-orange-600 font-bold"
              stickyHeader={true} // Freeze top row header
              stickyFirstColumn={true} // Freeze first column
              showGridLines={true} // Grid lines in table
            />
          </CardContent>
        </Card>

        {/* Add/Edit Insurance Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-orange-700 text-xl">
                {editingInsurance ? '🔄 Edit Insurance Policy' : '📋 Add New Insurance Policy'}
              </DialogTitle>
              <DialogDescription className="text-green-600">
                {editingInsurance ? 'Update insurance policy information' : 'Enter insurance policy details'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Insurance Type Selection */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-600 font-medium">Insurance Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.insuranceType || ''}
                    onValueChange={(value) => handleInputChange('insuranceType', value)}
                    required
                  >
                    <SelectTrigger className="border-orange-300 focus:border-orange-500">
                      <SelectValue placeholder="Select insurance type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-funded">Bank Funded</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="agrogreen">Agrogreen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-600 font-medium">Warehouse Name <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.warehouseName || ''}
                    onValueChange={(value) => handleInputChange('warehouseName', value)}
                    required
                  >
                    <SelectTrigger className="border-orange-300 focus:border-orange-500">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.warehouseName}>
                          {warehouse.warehouseName} ({warehouse.warehouseCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-green-600 font-medium">Warehouse Code</Label>
                  <Input
                    value={formData.warehouseCode || ''}
                    onChange={(e) => handleInputChange('warehouseCode', e.target.value)}
                    className="border-orange-300 focus:border-orange-500"
                    placeholder="Auto-filled from warehouse"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-green-600 font-medium">State</Label>
                  <Input
                    value={formData.state || ''}
                    className="border-orange-300 focus:border-orange-500"
                    placeholder="Auto-filled from warehouse"
                    readOnly
                  />
                </div>
              </div>

              {/* Commodity Selection (Multiple selection support) */}
              <div className="space-y-4">
                <Label className="text-green-600 font-medium text-lg">Commodity & Variety Selection (Multiple Selection Supported)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Commodity <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.commodityName || ''}
                      onValueChange={(value) => handleInputChange('commodityName', value)}
                      required
                    >
                      <SelectTrigger className="border-orange-300 focus:border-orange-500">
                        <SelectValue placeholder="Select commodity" />
                      </SelectTrigger>
                      <SelectContent>
                        {commodities.map(commodity => (
                          <SelectItem key={commodity.id} value={commodity.commodityName}>
                            {commodity.commodityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Variety <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.varietyName || ''}
                      onValueChange={(value) => {
                        handleInputChange('varietyName', value);
                        if (formData.commodityName) {
                          handleCommoditySelection(formData.commodityName, value);
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="border-orange-300 focus:border-orange-500">
                        <SelectValue placeholder="Select variety" />
                      </SelectTrigger>
                      <SelectContent>
                        {commodities
                          .find(c => c.commodityName === formData.commodityName)
                          ?.varieties?.map(variety => (
                            <SelectItem key={variety.varietyId} value={variety.varietyName}>
                              {variety.varietyName}
                            </SelectItem>
                          )) || []}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selected commodities display */}
                {selectedCommodities.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-blue-800 font-semibold mb-2">Selected Commodities & Varieties:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCommodities.map((item, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <span>{item.commodityName} - {item.varietyName}</span>
                          <button
                            type="button"
                            onClick={() => handleCommoditySelection(item.commodityName, item.varietyName)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Funded Specific Fields */}
              {formData.insuranceType === 'bank-funded' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Bank Funded By <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.bankFundedBy || ''}
                      onValueChange={(value) => handleInputChange('bankFundedBy', value)}
                      required
                    >
                      <SelectTrigger className="border-orange-300 focus:border-orange-500">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.bankName}>
                            {bank.bankName} ({bank.bankId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Client Specific Fields */}
              {formData.insuranceType === 'client' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Client Name <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.clientName || ''}
                      onValueChange={(value) => handleInputChange('clientName', value)}
                      required
                    >
                      <SelectTrigger className="border-orange-300 focus:border-orange-500">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.firmName}>
                            {client.firmName} ({client.clientId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Client Code</Label>
                    <Input
                      value={formData.clientCode || ''}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Auto-filled from client"
                      readOnly
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-green-600 font-medium">Client Address</Label>
                    <Input
                      value={formData.clientAddress || ''}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Auto-filled from client master"
                      readOnly
                    />
                  </div>
                </div>
              )}

              {/* Fire Policy Details */}
              <div className="space-y-4 border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="text-red-800 font-semibold text-lg">🔥 Fire Policy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.firePolicyCompanyName || ''}
                      onChange={(e) => handleInputChange('firePolicyCompanyName', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Fire insurance company name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Policy Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.firePolicyNumber || ''}
                      onChange={(e) => handleInputChange('firePolicyNumber', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Fire policy number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Policy Amount <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.firePolicyAmount || ''}
                      onChange={(e) => handleInputChange('firePolicyAmount', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Policy amount"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Start Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formData.firePolicyStartDate || ''}
                      onChange={(e) => handleInputChange('firePolicyStartDate', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">End Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formData.firePolicyEndDate || ''}
                      onChange={(e) => handleInputChange('firePolicyEndDate', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      min={getTodayDate()} // Cannot select past dates
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Burglary Policy Details */}
              <div className="space-y-4 border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="text-orange-800 font-semibold text-lg">🛡️ Burglary Policy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.burglaryPolicyCompanyName || ''}
                      onChange={(e) => handleInputChange('burglaryPolicyCompanyName', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Burglary insurance company name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Policy Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.burglaryPolicyNumber || ''}
                      onChange={(e) => handleInputChange('burglaryPolicyNumber', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Burglary policy number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Policy Amount <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.burglaryPolicyAmount || ''}
                      onChange={(e) => handleInputChange('burglaryPolicyAmount', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      placeholder="Policy amount"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Start Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formData.burglaryPolicyStartDate || ''}
                      onChange={(e) => handleInputChange('burglaryPolicyStartDate', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">End Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formData.burglaryPolicyEndDate || ''}
                      onChange={(e) => handleInputChange('burglaryPolicyEndDate', e.target.value)}
                      className="border-orange-300 focus:border-orange-500"
                      min={getTodayDate()} // Cannot select past dates
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 shadow-lg"
                >
                  {editingInsurance ? '🔄 Update Insurance' : '✅ Add Insurance'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, insurance: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this insurance policy? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDialog.insurance && handleDelete(deleteDialog.insurance)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
