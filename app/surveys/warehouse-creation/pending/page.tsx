"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Download,
  Eye,
  Search,
  Filter,
  X
} from "lucide-react";
import WarehouseInspectionForm from '../inspection-form';

// Wrapper component to handle async data loading
function WarehouseInspectionFormWrapper({ 
  inspection, 
  onClose, 
  onStatusChange 
}: {
  inspection: InspectionData;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const data = await convertInspectionToFormData(inspection);
        setFormData(data);
      } catch (error) {
        console.error('Error loading form data:', error);
        setFormData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [inspection]);

  const findAllInsuranceForWarehouse = async (warehouseCode: string, warehouseName: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inspections'));
      const allInsuranceEntries: any[] = [];
      let matchingInspections = 0;
      
      console.log(`🔍 Searching for insurance entries using warehouse code: ${warehouseCode}`);
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Check warehouse code from warehouseInspectionData (if available) or fallback to top-level
        const inspectionWarehouseCode = data.warehouseInspectionData?.warehouseCode || data.warehouseCode;
        
        // Match by warehouse code (primary) or warehouse name (fallback)
        if (inspectionWarehouseCode === warehouseCode || 
            data.warehouseInspectionData?.warehouseName === warehouseName ||
            data.warehouseName === warehouseName) {
          matchingInspections++;
          console.log(`📋 Found inspection ${data.inspectionCode} with matching warehouse code: ${inspectionWarehouseCode}`);
          console.log(`📊 Inspection data keys:`, Object.keys(data));
          
          // Check multiple possible locations for insurance data
          let insuranceData = null;
          
          // 1. Check top-level insuranceEntries
          if (data.insuranceEntries && Array.isArray(data.insuranceEntries)) {
            console.log(`✅ Found top-level insurance entries in inspection ${data.inspectionCode}:`, data.insuranceEntries.length);
            console.log(`📝 Top-level insurance data:`, data.insuranceEntries);
            insuranceData = data.insuranceEntries;
          }
          // 2. Check nested warehouseInspectionData.insuranceEntries
          else if (data.warehouseInspectionData && data.warehouseInspectionData.insuranceEntries && Array.isArray(data.warehouseInspectionData.insuranceEntries)) {
            console.log(`✅ Found nested insurance entries in inspection ${data.inspectionCode}:`, data.warehouseInspectionData.insuranceEntries.length);
            console.log(`📝 Nested insurance data:`, data.warehouseInspectionData.insuranceEntries);
            insuranceData = data.warehouseInspectionData.insuranceEntries;
          }
          // 3. Check if there's insurance data in the main form data (legacy format)
          else if (data.warehouseInspectionData && data.warehouseInspectionData.firePolicyNumber) {
            console.log(`✅ Found legacy insurance format in inspection ${data.inspectionCode}`);
            console.log(`📝 Legacy insurance data:`, {
              firePolicyNumber: data.warehouseInspectionData.firePolicyNumber,
              clientName: data.warehouseInspectionData.clientName
            });
            // Convert legacy format to new format
            insuranceData = [{
              id: `legacy_${Date.now()}`,
              insuranceTakenBy: data.warehouseInspectionData.insuranceTakenBy || '',
              insuranceCommodity: data.warehouseInspectionData.insuranceCommodity || '',
              clientName: data.warehouseInspectionData.clientName || '',
              clientAddress: data.warehouseInspectionData.clientAddress || '',
              selectedBankName: data.warehouseInspectionData.selectedBankName || '',
              firePolicyCompanyName: data.warehouseInspectionData.firePolicyCompanyName || '',
              firePolicyNumber: data.warehouseInspectionData.firePolicyNumber || '',
              firePolicyAmount: data.warehouseInspectionData.firePolicyAmount || '',
              firePolicyStartDate: data.warehouseInspectionData.firePolicyStartDate || null,
              firePolicyEndDate: data.warehouseInspectionData.firePolicyEndDate || null,
              burglaryPolicyCompanyName: data.warehouseInspectionData.burglaryPolicyCompanyName || '',
              burglaryPolicyNumber: data.warehouseInspectionData.burglaryPolicyNumber || '',
              burglaryPolicyAmount: data.warehouseInspectionData.burglaryPolicyAmount || '',
              burglaryPolicyStartDate: data.warehouseInspectionData.burglaryPolicyStartDate || null,
              burglaryPolicyEndDate: data.warehouseInspectionData.burglaryPolicyEndDate || null,
              createdAt: new Date(data.createdAt || Date.now())
            }];
          }
          else {
            console.log(`❌ No insurance data found in inspection ${data.inspectionCode}`);
          }
          
          // Add found insurance data
          if (insuranceData && insuranceData.length > 0) {
            allInsuranceEntries.push(...insuranceData);
          }
        }
      });
      
      // Remove duplicates based on policy numbers and client name
      const uniqueInsurance = allInsuranceEntries.filter((entry, index, self) => {
        return index === self.findIndex(e => {
          // Consider entries duplicate if they have same policy numbers OR same client name with similar policies
          const samePolicyNumbers = e.firePolicyNumber === entry.firePolicyNumber && 
                                   e.burglaryPolicyNumber === entry.burglaryPolicyNumber;
          const sameClient = e.clientName === entry.clientName && e.clientName !== '';
          
          return samePolicyNumbers || sameClient;
        });
              });
        
        console.log(`🏗️ Processed ${matchingInspections} inspections for warehouse ${warehouseName}`);
        console.log(`📦 Found ${allInsuranceEntries.length} total insurance entries, ${uniqueInsurance.length} unique entries for warehouse ${warehouseName}`);
        console.log(`📄 Unique insurance entries:`, uniqueInsurance);
        return uniqueInsurance;
    } catch (error) {
      console.error('Error finding insurance entries:', error);
      return [];
    }
  };

  const findExistingWarehouseFormData = async (warehouseCode: string, warehouseName: string) => {
    try {
      // Search for any filled warehouse inspection for the same warehouse code
      const querySnapshot = await getDocs(collection(db, 'inspections'));
      
      console.log(`🔍 Searching for existing warehouse form data using warehouse code: ${warehouseCode}`);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        // Check warehouse code from warehouseInspectionData (if available) or fallback to top-level
        const inspectionWarehouseCode = data.warehouseInspectionData?.warehouseCode || data.warehouseCode;
        
        // Check if this is the same warehouse (by code primary, name fallback) and has filled form data
        if ((inspectionWarehouseCode === warehouseCode || 
             data.warehouseInspectionData?.warehouseName === warehouseName ||
             data.warehouseName === warehouseName) &&
            data.warehouseInspectionData && 
            Object.keys(data.warehouseInspectionData).length > 5) {
          
          // Found existing filled data, return it excluding bank details
          const existingData = { ...data.warehouseInspectionData };
          
          // Remove bank-specific fields to keep only warehouse details
          delete existingData.bankState;
          delete existingData.bankBranch;
          delete existingData.bankName;
          delete existingData.ifscCode;
          
          // Also check for insurance entries from all inspections of this warehouse
          const allInsuranceEntries = await findAllInsuranceForWarehouse(warehouseCode, warehouseName);
          if (allInsuranceEntries.length > 0) {
            existingData.insuranceEntries = allInsuranceEntries;
          }
          
          console.log(`Found existing warehouse data for ${warehouseName}:`, existingData);
          return existingData;
        }
      }
      
      console.log(`No existing filled data found for warehouse: ${warehouseName}`);
      return {};
    } catch (error) {
      console.error('Error finding existing warehouse data:', error);
      return {};
    }
  };

  const convertInspectionToFormData = async (inspection: InspectionData) => {
    // Get the saved warehouse inspection data from the inspection record
    const warehouseData = inspection.warehouseInspectionData || {};
    
    // Check if this inspection has no filled form data and try to fetch from existing warehouse data
    let existingWarehouseData = {};
    if (!warehouseData.warehouseName || Object.keys(warehouseData).length <= 5) {
      // This appears to be a fresh inspection, try to find existing filled data for same warehouse
      existingWarehouseData = await findExistingWarehouseFormData(inspection.warehouseCode || '', inspection.warehouseName || '');
    }
    
    // Always fetch and merge insurance entries from all inspections of this warehouse
    const allInsuranceEntries = await findAllInsuranceForWarehouse(inspection.warehouseCode || '', inspection.warehouseName || '');
    
    // Merge existing warehouse data but prioritize bank details from current inspection
    const mergedData = { ...existingWarehouseData, ...warehouseData };
    
    // Ensure insurance entries include all warehouse insurance data
    if (allInsuranceEntries.length > 0) {
      mergedData.insuranceEntries = allInsuranceEntries;
    }
    
    // Return the saved form data with fallbacks to inspection data
    return {
      // Use merged warehouse inspection data if available, otherwise fallback to inspection data
      ...mergedData,
      
      // Override with inspection-specific data
      warehouseName: inspection.warehouseName || mergedData.warehouseName || '',
      warehouseCode: inspection.warehouseCode || mergedData.warehouseCode || '',
      status: 'pending', // Always pending for this page
      
      // Bank details from current inspection (these are the specific bank for this inspection)
      bankState: inspection.bankState || '',
      bankBranch: inspection.bankBranch || '',
      bankName: inspection.bankName || '',
      ifscCode: inspection.ifscCode || '',
      
      // Location details from current inspection
      state: inspection.state || mergedData.state || '',
      branch: inspection.branch || mergedData.branch || '',
      location: inspection.location || mergedData.location || '',
      businessType: inspection.businessType || mergedData.businessType || '',
      receiptType: inspection.receiptType || mergedData.receiptType || '',
      
      // Include creation info
      createdAt: inspection.createdAt || mergedData.createdAt || '',
      inspectionCode: inspection.inspectionCode || inspection.id || '',
      
      // Ensure arrays and objects have defaults
      nameOfBank: mergedData.nameOfBank || [],
      attachedFiles: mergedData.attachedFiles || [],
      insuranceEntries: mergedData.insuranceEntries || [],
      
      // Ensure boolean defaults
      warehouseFitCertification: mergedData.warehouseFitCertification || false,
      
      // Ensure date fields are properly handled - convert strings to Date objects with validation
      dateOfInspection: mergedData.dateOfInspection ? 
        (() => {
          const date = new Date(mergedData.dateOfInspection);
          return isNaN(date.getTime()) ? null : date;
        })() : null,
      validityOfInsurance: mergedData.validityOfInsurance ? 
        (() => {
          const date = new Date(mergedData.validityOfInsurance);
          return isNaN(date.getTime()) ? null : date;
        })() : null,
      expiryDate: mergedData.expiryDate ? 
        (() => {
          const date = new Date(mergedData.expiryDate);
          return isNaN(date.getTime()) ? null : date;
        })() : null,
      oeDate: mergedData.oeDate ? 
        (() => {
          const date = new Date(mergedData.oeDate);
          return isNaN(date.getTime()) ? null : date;
        })() : null
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading form data...</div>
      </div>
    );
  }

  return (
    <WarehouseInspectionForm 
      onClose={onClose}
      initialData={formData}
      mode="view"
      onStatusChange={onStatusChange}
    />
  );
}

// Interface for inspection data
interface InspectionData {
  id: string;
  inspectionCode: string;
  warehouseCode: string;
  state: string;
  branch: string;
  location: string;
  businessType: string;
  warehouseStatus: string;
  warehouseName?: string;
  bankState: string;
  bankBranch: string;
  bankName: string;
  ifscCode: string;
  receiptType: string;
  createdAt: string;
  warehouseInspectionData?: any; // The saved form data
}

export default function PendingWarehousePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionData | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterBusinessType, setFilterBusinessType] = useState('all');
  const [filterReceiptType, setFilterReceiptType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load inspections from Firebase
  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inspections'));
      const inspectionData: InspectionData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include inspections that don't have a status or have status 'pending'
        if (!data.status || data.status === 'pending') {
          inspectionData.push({
            id: doc.id,
            inspectionCode: data.inspectionCode || '',
            warehouseCode: data.warehouseCode || '',
            state: data.state || '',
            branch: data.branch || '',
            location: data.location || '',
            businessType: data.businessType || '',
            warehouseStatus: data.warehouseStatus || '',
            warehouseName: data.warehouseName || '',
            bankState: data.bankState || '',
            bankBranch: data.bankBranch || '',
            bankName: data.bankName || '',
            ifscCode: data.ifscCode || '',
            receiptType: data.receiptType || '',
            createdAt: data.createdAt || '',
            warehouseInspectionData: data.warehouseInspectionData || null
          });
        }
      });
      
      setInspections(inspectionData);
    } catch (error) {
      console.error('Error loading inspections:', error);
      toast({
        title: "Error",
        description: "Failed to load inspections",
        variant: "destructive",
      });
    }
  };

  // Get unique values for filter dropdowns
  const uniqueStates = useMemo(() => Array.from(new Set(inspections.map(i => i.state || '').filter(Boolean))), [inspections]);
  const uniqueBranches = useMemo(() => Array.from(new Set(inspections.map(i => i.branch || '').filter(Boolean))), [inspections]);
  const uniqueLocations = useMemo(() => Array.from(new Set(inspections.map(i => i.location || '').filter(Boolean))), [inspections]);
  const uniqueBusinessTypes = useMemo(() => Array.from(new Set(inspections.map(i => i.businessType || '').filter(Boolean))), [inspections]);
  const uniqueReceiptTypes = useMemo(() => Array.from(new Set(inspections.map(i => i.receiptType || '').filter(Boolean))), [inspections]);

  // Filter data based on search term and filters
  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(inspection => 
        inspection.inspectionCode?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.warehouseCode?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.warehouseName?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.state?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.branch?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.location?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.businessType?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.bankName?.toLowerCase().includes(lowerSearchTerm) ||
        inspection.receiptType?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply individual filters
    if (filterState) {
      filtered = filtered.filter(inspection => inspection.state === filterState);
    }
    if (filterBranch) {
      filtered = filtered.filter(inspection => inspection.branch === filterBranch);
    }
    if (filterLocation) {
      filtered = filtered.filter(inspection => inspection.location === filterLocation);
    }
    if (filterBusinessType) {
      filtered = filtered.filter(inspection => inspection.businessType === filterBusinessType);
    }
    if (filterReceiptType) {
      filtered = filtered.filter(inspection => inspection.receiptType === filterReceiptType);
    }

    return filtered;
  }, [inspections, searchTerm, filterState, filterBranch, filterLocation, filterBusinessType, filterReceiptType]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterState('');
    setFilterBranch('');
    setFilterLocation('');
    setFilterBusinessType('');
    setFilterReceiptType('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterState || filterBranch || filterLocation || filterBusinessType || filterReceiptType;

  const getWarehouseStatus = (warehouseCode: string): 'pending' | 'submitted' | 'activated' | 'rejected' | 'resubmitted' | 'closed' => {
    // Simple logic to determine status - you can modify this based on your business logic
    return 'pending'; // Default status for now - all inspections are pending
  };

  const exportToCSV = () => {
    // Use filtered data for CSV export
    const dataToExport = hasActiveFilters ? filteredInspections : inspections;
    
    const headers = [
      'Inspection Code', 'Warehouse Code', 'State', 'Branch', 'Location', 
      'Business Type', 'Warehouse Name', 'Bank State', 'Bank Branch', 
      'Bank Name', 'IFSC Code', 'Receipt Type', 'Created Date', 'Remarks'
    ];
    
    const csvContent = [
      headers.join(',') + '\n',
      ...dataToExport.map(inspection => [
        inspection.inspectionCode,
        inspection.warehouseCode,
        inspection.state,
        inspection.branch,
        inspection.location,
        inspection.businessType.toUpperCase(),
        inspection.warehouseName || '',
        inspection.bankState,
        inspection.bankBranch,
        inspection.bankName,
        inspection.ifscCode,
        inspection.receiptType,
        inspection.createdAt,
        inspection.warehouseInspectionData?.remarks || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-warehouse-inspections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    // This would typically delete from Firebase, but for now just show a message
    toast({
      title: "Delete",
      description: "Delete functionality would be implemented here",
    });
  };

  const handleViewDetails = async (inspection: InspectionData) => {
    setSelectedInspection(inspection);
    setShowInspectionForm(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Back Button and Centered Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="inline-block text-lg font-semibold tracking-tight bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              ← Warehouse Creation
            </button>
          </div>
          
          {/* Centered Title with Light Orange Background */}
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 inline-block border-b-4 border-green-500 pb-2 px-6 py-3 bg-orange-100 rounded-lg">
              <Clock className="inline mr-2 h-8 w-8 text-yellow-500" />
              Pending Warehouses
            </h1>
          </div>
          
          {/* Export Button */}
          <div className="flex space-x-2">
            {(hasActiveFilters ? filteredInspections.length > 0 : inspections.length > 0) && (
              <Button 
                onClick={exportToCSV}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV {hasActiveFilters && `(${filteredInspections.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Status Description */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="text-lg font-medium text-yellow-900">Pending Warehouses</h3>
              <p className="text-yellow-700 mt-1">
                Warehouses awaiting initial review and processing. These inspections are in the queue for approval.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-green-50 border border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Search & Filter Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Search className="text-gray-500" />
              <Label htmlFor="search-input" className="font-semibold text-gray-700">Search:</Label>
              <Input
                id="search-input"
                placeholder="Search by inspection code, warehouse code, warehouse name, state, branch, location, business type, bank name, or receipt type..."
                className="flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-green-200">
                <div>
                  <Label className="block font-medium mb-1 text-green-700">State</Label>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {uniqueStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block font-medium mb-1 text-green-700">Branch</Label>
                  <Select value={filterBranch} onValueChange={setFilterBranch}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Branches</SelectItem>
                      {uniqueBranches.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block font-medium mb-1 text-green-700">Location</Label>
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block font-medium mb-1 text-green-700">Business Type</Label>
                  <Select value={filterBusinessType} onValueChange={setFilterBusinessType}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All Business Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Business Types</SelectItem>
                      {uniqueBusinessTypes.map(type => (
                        <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block font-medium mb-1 text-green-700">Receipt Type</Label>
                  <Select value={filterReceiptType} onValueChange={setFilterReceiptType}>
                    <SelectTrigger className="border-green-300">
                      <SelectValue placeholder="All Receipt Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Receipt Types</SelectItem>
                      {uniqueReceiptTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                <span className="text-sm font-medium text-green-700">Active Filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {filterState && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    State: {filterState}
                  </Badge>
                )}
                {filterBranch && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Branch: {filterBranch}
                  </Badge>
                )}
                {filterLocation && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Location: {filterLocation}
                  </Badge>
                )}
                {filterBusinessType && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Business Type: {filterBusinessType.toUpperCase()}
                  </Badge>
                )}
                {filterReceiptType && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Receipt Type: {filterReceiptType}
                  </Badge>
                )}
                <span className="text-sm text-green-600">
                  ({filteredInspections.length} of {inspections.length} results)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspections Table */}
        {filteredInspections.length > 0 ? (
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700">
                Pending Warehouse Inspections
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-green-600 ml-2">
                    (Filtered: {filteredInspections.length} of {inspections.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-green-600">
                All pending warehouse inspection surveys with their details and actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                className="overflow-x-auto relative"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.03) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(249, 115, 22, 0.03) 0%, transparent 50%),
                    linear-gradient(135deg, rgba(34, 197, 94, 0.01) 0%, rgba(249, 115, 22, 0.01) 100%)
                  `,
                  backgroundSize: '400px 400px, 300px 300px, 100% 100%',
                  backgroundPosition: '0% 0%, 100% 100%, 0% 0%',
                  backgroundRepeat: 'no-repeat, no-repeat, no-repeat'
                }}
              >
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-orange-50 border-b-2 border-orange-200">
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Inspection Code</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Warehouse Code</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">State</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Branch</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Location</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Business Type</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Warehouse Name</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Bank State</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Bank Branch</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Bank Name</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">IFSC Code</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Receipt Type</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Created</TableHead>
                      <TableHead className="text-orange-700 font-semibold border-r border-orange-300 text-center p-2 whitespace-nowrap">Remarks</TableHead>
                      <TableHead className="text-orange-700 font-semibold text-center p-2 whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection) => (
                      <TableRow key={inspection.id} className="hover:bg-green-50 border-b border-gray-200">
                        <TableCell className="text-green-700 font-bold border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.inspectionCode}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.warehouseCode}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.state}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.branch}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.location}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.businessType.toUpperCase()}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.warehouseName}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.bankState}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.bankBranch}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.bankName}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.ifscCode}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.receiptType}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 whitespace-nowrap">{inspection.createdAt}</TableCell>
                        <TableCell className="text-green-700 border-r border-gray-300 text-center p-2 max-w-xs">
                          <div className="truncate" title={inspection.warehouseInspectionData?.remarks || ''}>
                            {inspection.warehouseInspectionData?.remarks || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center p-2">
                          <div className="flex space-x-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(inspection)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No Results Found' : 'No Pending Inspections'}
            </h3>
            <p className="text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or filters to find more results.'
                : 'There are currently no warehouse inspections pending review.'
              }
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4 border-green-300 text-green-700 hover:bg-green-50"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Warehouse Inspection Form Dialog */}
        <Dialog open={showInspectionForm} onOpenChange={setShowInspectionForm}>
          <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Warehouse Inspection Form</DialogTitle>
              <DialogDescription>
                Fill out the warehouse inspection details and submit for review.
              </DialogDescription>
            </DialogHeader>
            {selectedInspection && (
              <WarehouseInspectionFormWrapper 
                inspection={selectedInspection}
                onClose={() => {
                  setShowInspectionForm(false);
                  loadInspections(); // Reload data after closing form
                }}
                onStatusChange={() => {
                  loadInspections(); // Reload data when status changes
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 