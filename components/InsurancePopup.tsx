"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

interface ClientData {
  id?: string;
  clientId: string;
  firmName: string;
  authorizedPersonName: string;
  firmType: string;
  companyAddress: string;
  contactNumber: string;
  panNumber: string;
  gstNumber: string;
  aadharNumber?: string;
  email?: string;
  landline?: string;
  alternateNumber?: string;
  panCardImage?: string;
  aadharCardImage?: string;
  documentUrls?: string[];
  createdAt?: string;
}

interface BankData {
  id: string;
  bankName: string;
  state: string;
  locations: {
    locationName: string;
    branchName: string;
    ifscCode: string;
  }[];
}

interface InsuranceData {
  insuranceTakenBy: string;
  insuranceCommodity: string;
  clientName: string;
  clientAddress: string;
  selectedBankName: string;
  firePolicyCompanyName: string;
  firePolicyNumber: string;
  firePolicyAmount: string;
  firePolicyStartDate: Date | null;
  firePolicyEndDate: Date | null;
  burglaryPolicyCompanyName: string;
  burglaryPolicyNumber: string;
  burglaryPolicyAmount: string;
  burglaryPolicyStartDate: Date | null;
  burglaryPolicyEndDate: Date | null;
}

interface InsurancePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (insuranceData: InsuranceData) => void;
  initialData?: Partial<InsuranceData>;
  action: 'activate' | 'close' | 'reactivate';
}

export default function InsurancePopup({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  action 
}: InsurancePopupProps) {
  const { toast } = useToast();

  const [insuranceData, setInsuranceData] = useState<InsuranceData>({
    insuranceTakenBy: '',
    insuranceCommodity: '',
    clientName: '',
    clientAddress: '',
    selectedBankName: '',
    firePolicyCompanyName: '',
    firePolicyNumber: '',
    firePolicyAmount: '',
    firePolicyStartDate: null,
    firePolicyEndDate: null,
    burglaryPolicyCompanyName: '',
    burglaryPolicyNumber: '',
    burglaryPolicyAmount: '',
    burglaryPolicyStartDate: null,
    burglaryPolicyEndDate: null,
  });

  const [clientsData, setClientsData] = useState<ClientData[]>([]);
  const [banksData, setBanksData] = useState<BankData[]>([]);
  const [insuranceBanks, setInsuranceBanks] = useState<{name: string, ifsc: string}[]>([]);

  // Load initial data when popup opens
  useEffect(() => {
    if (isOpen && initialData) {
      setInsuranceData(prev => ({
        ...prev,
        ...initialData,
        firePolicyStartDate: initialData.firePolicyStartDate || null,
        firePolicyEndDate: initialData.firePolicyEndDate || null,
        burglaryPolicyStartDate: initialData.burglaryPolicyStartDate || null,
        burglaryPolicyEndDate: initialData.burglaryPolicyEndDate || null,
      }));
    }
  }, [isOpen, initialData]);

  // Load clients and banks data
  useEffect(() => {
    if (isOpen) {
      loadClientsData();
      loadBanksData();
    }
  }, [isOpen]);

  const loadClientsData = async () => {
    try {
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientsArray = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClientData[];
      setClientsData(clientsArray);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadBanksData = async () => {
    try {
      const banksSnapshot = await getDocs(collection(db, 'banks'));
      const banksArray = banksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankData[];
      setBanksData(banksArray);

      // Create insurance banks list
      const allInsuranceBanks: {name: string, ifsc: string}[] = [];
      banksArray.forEach(bank => {
        bank.locations?.forEach(location => {
          allInsuranceBanks.push({
            name: location.locationName || bank.bankName,
            ifsc: location.ifscCode
          });
        });
      });
      setInsuranceBanks(allInsuranceBanks);
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const scrollToInsuranceField = (fieldName: string) => {
    // Create a mapping of field names to element IDs for insurance popup
    const fieldMap: { [key: string]: string } = {
      'insuranceTakenBy': 'insuranceTakenBy',
      'clientName': 'clientName',
      'clientAddress': 'clientAddress',
      'selectedBankName': 'selectedBankName',
      'firePolicyCompanyName': 'firePolicyCompanyName',
      'firePolicyNumber': 'firePolicyNumber',
      'firePolicyAmount': 'firePolicyAmount',
      'burglaryPolicyCompanyName': 'burglaryPolicyCompanyName',
      'burglaryPolicyNumber': 'burglaryPolicyNumber',
      'burglaryPolicyAmount': 'burglaryPolicyAmount',
    };

    const elementId = fieldMap[fieldName];
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the element if it's an input/select
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
          setTimeout(() => element.focus(), 500);
        }
      }
    }
  };

  const validateInsurance = () => {
    const missingFields: string[] = [];
    const missingFieldsRaw: string[] = [];

    // Insurance Taken By is required for activation/reactivation
    if (!insuranceData.insuranceTakenBy) {
      missingFieldsRaw.push('insuranceTakenBy');
      missingFields.push('Insurance Taken By');
    }

    // If insurance is taken by someone other than bank, validate policy details
    if (insuranceData.insuranceTakenBy && insuranceData.insuranceTakenBy !== 'bank') {
      // Fire policy validation
      if (!insuranceData.firePolicyCompanyName) {
        missingFieldsRaw.push('firePolicyCompanyName');
        missingFields.push('Fire Policy Company Name');
      }
      if (!insuranceData.firePolicyNumber) {
        missingFieldsRaw.push('firePolicyNumber');
        missingFields.push('Fire Policy Number');
      }
      if (!insuranceData.firePolicyAmount) {
        missingFieldsRaw.push('firePolicyAmount');
        missingFields.push('Fire Policy Amount');
      }
      if (!insuranceData.firePolicyStartDate) missingFields.push('Fire Policy Start Date');
      if (!insuranceData.firePolicyEndDate) missingFields.push('Fire Policy End Date');

      // Burglary policy validation
      if (!insuranceData.burglaryPolicyCompanyName) {
        missingFieldsRaw.push('burglaryPolicyCompanyName');
        missingFields.push('Burglary Policy Company Name');
      }
      if (!insuranceData.burglaryPolicyNumber) {
        missingFieldsRaw.push('burglaryPolicyNumber');
        missingFields.push('Burglary Policy Number');
      }
      if (!insuranceData.burglaryPolicyAmount) {
        missingFieldsRaw.push('burglaryPolicyAmount');
        missingFields.push('Burglary Policy Amount');
      }
      if (!insuranceData.burglaryPolicyStartDate) missingFields.push('Burglary Policy Start Date');
      if (!insuranceData.burglaryPolicyEndDate) missingFields.push('Burglary Policy End Date');

      // Client specific validation
      if (insuranceData.insuranceTakenBy === 'client') {
        if (!insuranceData.clientName) {
          missingFieldsRaw.push('clientName');
          missingFields.push('Client Name');
        }
        if (!insuranceData.clientAddress) {
          missingFieldsRaw.push('clientAddress');
          missingFields.push('Client Address');
        }
      }
    }

    // Bank specific validation
    if (insuranceData.insuranceTakenBy === 'bank' && !insuranceData.selectedBankName) {
      missingFieldsRaw.push('selectedBankName');
      missingFields.push('Bank Name');
    }

    // If there are missing fields, scroll to the first one
    if (missingFieldsRaw.length > 0) {
      scrollToInsuranceField(missingFieldsRaw[0]);
    }

    return missingFields;
  };

  const handleSave = () => {
    // Only validate for activation and reactivation actions
    if (action === 'activate' || action === 'reactivate') {
      const missingFields = validateInsurance();
      if (missingFields.length > 0) {
        toast({
          title: `Cannot ${action === 'activate' ? 'Activate' : 'Reactivate'} Warehouse`,
          description: `Please complete insurance details: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    onSave(insuranceData);
  };

  const handleCancel = () => {
    // For activation/reactivation, check if existing data is complete
    if (action === 'activate' || action === 'reactivate') {
      const missingFields = validateInsurance();
      if (missingFields.length > 0) {
        toast({
          title: `Insurance Required for ${action === 'activate' ? 'Activation' : 'Reactivation'}`,
          description: "Please complete all insurance details to proceed.",
          variant: "destructive",
        });
        return;
      }
    }
    onClose();
  };

  const getActionTitle = () => {
    switch (action) {
      case 'activate': return 'Complete Insurance Details for Activation';
      case 'reactivate': return 'Complete Insurance Details for Reactivation';
      case 'close': return 'Update Insurance Details';
      default: return 'Insurance Details';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-700 text-xl">{getActionTitle()}</DialogTitle>
          <DialogDescription>
            Provide insurance details for the warehouse before proceeding with the {action} action.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Insurance of Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceTakenBy">Insurance Taken By</Label>
                <Select 
                  value={insuranceData.insuranceTakenBy} 
                  onValueChange={(value) => setInsuranceData(prev => ({ 
                    ...prev, 
                    insuranceTakenBy: value, 
                    clientName: '', 
                    clientAddress: '', 
                    selectedBankName: '' 
                  }))}
                >
                  <SelectTrigger className="text-orange-600">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse owner">Warehouse Owner</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="agrogreen">Agrogreen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceCommodity">Commodity</Label>
                <Input
                  id="insuranceCommodity"
                  value={insuranceData.insuranceCommodity}
                  onChange={(e) => setInsuranceData(prev => ({ ...prev, insuranceCommodity: e.target.value }))}
                  className="text-orange-600"
                  placeholder="Enter commodity name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Name and Address dropdowns for Client selection */}
              {insuranceData.insuranceTakenBy === 'client' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Select 
                      value={insuranceData.clientName} 
                      onValueChange={(value) => {
                        const selectedClient = clientsData.find(client => client.firmName === value);
                        setInsuranceData(prev => ({ 
                          ...prev, 
                          clientName: value,
                          clientAddress: selectedClient?.companyAddress || ''
                        }));
                      }}
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsData.map(client => (
                          <SelectItem key={client.id} value={client.firmName}>
                            {client.firmName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientAddress">Client Address</Label>
                    <Select 
                      value={insuranceData.clientAddress} 
                      onValueChange={(value) => setInsuranceData(prev => ({ ...prev, clientAddress: value }))}
                    >
                      <SelectTrigger className="text-orange-600">
                        <SelectValue placeholder="Select Address" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsData
                          .filter(client => insuranceData.clientName ? client.firmName === insuranceData.clientName : true)
                          .map(client => (
                            <SelectItem key={client.id} value={client.companyAddress}>
                              {client.companyAddress}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Bank Name dropdown for Bank selection */}
              {insuranceData.insuranceTakenBy === 'bank' && (
                <div className="space-y-2">
                  <Label htmlFor="selectedBankName">Bank Name</Label>
                  <Select 
                    value={insuranceData.selectedBankName} 
                    onValueChange={(value) => setInsuranceData(prev => ({ ...prev, selectedBankName: value }))}
                  >
                    <SelectTrigger className="text-orange-600">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceBanks.map((bank, index) => (
                        <SelectItem key={index} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Fire Policy Section - Show for all except bank */}
            {insuranceData.insuranceTakenBy && insuranceData.insuranceTakenBy !== '' && insuranceData.insuranceTakenBy !== 'bank' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-lg font-medium text-green-700 mb-4">Fire Policy Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firePolicyCompanyName">Fire Policy Company Name</Label>
                      <Input
                        id="firePolicyCompanyName"
                        value={insuranceData.firePolicyCompanyName}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, firePolicyCompanyName: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firePolicyNumber">Fire Policy Number</Label>
                      <Input
                        id="firePolicyNumber"
                        value={insuranceData.firePolicyNumber}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, firePolicyNumber: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firePolicyAmount">Fire Policy Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="firePolicyAmount"
                          type="number"
                          className="pl-10 text-orange-600"
                          value={insuranceData.firePolicyAmount}
                          onChange={(e) => setInsuranceData(prev => ({ ...prev, firePolicyAmount: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fire Policy Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {insuranceData.firePolicyStartDate && insuranceData.firePolicyStartDate instanceof Date && !isNaN(insuranceData.firePolicyStartDate.getTime()) ? format(insuranceData.firePolicyStartDate, "PPP") : "Pick start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={insuranceData.firePolicyStartDate || undefined}
                            onSelect={(date) => setInsuranceData(prev => ({ ...prev, firePolicyStartDate: date || null }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fire Policy End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {insuranceData.firePolicyEndDate && insuranceData.firePolicyEndDate instanceof Date && !isNaN(insuranceData.firePolicyEndDate.getTime()) ? format(insuranceData.firePolicyEndDate, "PPP") : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={insuranceData.firePolicyEndDate || undefined}
                            onSelect={(date) => setInsuranceData(prev => ({ ...prev, firePolicyEndDate: date || null }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-lg font-medium text-green-700 mb-4">Burglary Policy Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="burglaryPolicyCompanyName">Burglary Policy Company Name</Label>
                      <Input
                        id="burglaryPolicyCompanyName"
                        value={insuranceData.burglaryPolicyCompanyName}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, burglaryPolicyCompanyName: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="burglaryPolicyNumber">Burglary Policy Number</Label>
                      <Input
                        id="burglaryPolicyNumber"
                        value={insuranceData.burglaryPolicyNumber}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, burglaryPolicyNumber: e.target.value }))}
                        className="text-orange-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="burglaryPolicyAmount">Burglary Policy Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="burglaryPolicyAmount"
                          type="number"
                          className="pl-10 text-orange-600"
                          value={insuranceData.burglaryPolicyAmount}
                          onChange={(e) => setInsuranceData(prev => ({ ...prev, burglaryPolicyAmount: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Burglary Policy Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {insuranceData.burglaryPolicyStartDate && insuranceData.burglaryPolicyStartDate instanceof Date && !isNaN(insuranceData.burglaryPolicyStartDate.getTime()) ? format(insuranceData.burglaryPolicyStartDate, "PPP") : "Pick start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={insuranceData.burglaryPolicyStartDate || undefined}
                            onSelect={(date) => setInsuranceData(prev => ({ ...prev, burglaryPolicyStartDate: date || null }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Burglary Policy End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {insuranceData.burglaryPolicyEndDate && insuranceData.burglaryPolicyEndDate instanceof Date && !isNaN(insuranceData.burglaryPolicyEndDate.getTime()) ? format(insuranceData.burglaryPolicyEndDate, "PPP") : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={insuranceData.burglaryPolicyEndDate || undefined}
                            onSelect={(date) => setInsuranceData(prev => ({ ...prev, burglaryPolicyEndDate: date || null }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 