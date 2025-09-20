"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Calendar, Filter, X, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where, getDoc, doc, Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FIELD_NAMES, SEARCH_PATTERNS, FIELD_EXTRACTION, DEFAULTS } from '@/lib/field-config';

interface DeliveryOrderReportData {
  id: string;
  state: string;
  branch: string;
  location: string;
  typeOfBusiness: string;
  warehouseType: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseAddress: string;
  clientCode: string;
  clientName: string;
  commodityName: string;
  varietyName: string;
  inwardBag: string;
  inwardQty: string;
  doNumber: string;
  doDate: string;
  doBags: string;
  doQty: string;
  doCode: string;
  balanceBag: string;
  balanceQty: string;
  [key: string]: any;
}

export default function DeliveryOrderReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [doData, setDoData] = useState<DeliveryOrderReportData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'state', 'branch', 'location', 'typeOfBusiness', 'warehouseType', 'warehouseCode', 'warehouseName',
    'warehouseAddress', 'clientCode', 'clientName', 'commodity', 'variety', 'inwardBag', 'inwardQty',
    'doNumber', 'doDate', 'doBags', 'doQty', 'doCode', 'balanceBag', 'balanceQty'
  ]);

  // Column definitions for 21 columns matching the image parameters
  const allColumns = [
    { key: 'state', label: 'State', width: 'w-20' },
    { key: 'branch', label: 'Branch', width: 'w-20' },
    { key: 'location', label: 'Location', width: 'w-24' },
    { key: 'typeOfBusiness', label: 'Type of Business', width: 'w-28' },
    { key: 'warehouseType', label: 'Warehouse Type', width: 'w-28' },
    { key: 'warehouseCode', label: 'Warehouse Code', width: 'w-24' },
    { key: 'warehouseName', label: 'Warehouse Name', width: 'w-32' },
    { key: 'warehouseAddress', label: 'Warehouse Address', width: 'w-32' },
    { key: 'clientCode', label: 'Client Code', width: 'w-24' },
    { key: 'clientName', label: 'Client Name', width: 'w-28' },
    { key: 'commodity', label: 'Commodity', width: 'w-24' },
    { key: 'variety', label: 'Variety', width: 'w-24' },
    { key: 'inwardBag', label: 'Inward Bag', width: 'w-20' },
    { key: 'inwardQty', label: 'Inward Qty', width: 'w-20' },
    { key: 'doNumber', label: 'DO Number', width: 'w-24' },
    { key: 'doDate', label: 'DO Date', width: 'w-24' },
    { key: 'doBags', label: 'DO Bags', width: 'w-20' },
    { key: 'doQty', label: 'DO Qty (MT)', width: 'w-24' },
    { key: 'doCode', label: 'DO Code', width: 'w-20' },
    { key: 'balanceBag', label: 'Balance Bag', width: 'w-20' },
    { key: 'balanceQty', label: 'Balance QT', width: 'w-20' }
  ];

  // Fetch delivery order data
  useEffect(() => {
    fetchDOData();
  }, []);

  // Set default date range (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const fetchDOData = async () => {
    setLoading(true);
    try {
      const doCollection = collection(db, 'deliveryOrders');
      
      // Build query with date filters
      let q = query(doCollection, orderBy('createdAt', 'desc'), limit(1000));
      
      // Apply date filters if dates are set
      if (startDate && endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
        
        q = query(
          doCollection,
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp),
          orderBy('createdAt', 'desc'),
          limit(1000)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      console.log('DO collection query result:', querySnapshot.size, 'documents');
      
      const data = await Promise.all(querySnapshot.docs.map(async (doc, index) => {
        const docData = doc.data();
        
        // Debug: Log available fields in DO data
        console.log('=== DO DOCUMENT DEBUG ===');
        console.log('DO document fields for warehouse:', docData.warehouseName, Object.keys(docData));
        console.log('DO document data:', docData);
        console.log('DO commodity fields:', {
          commodityId: docData.commodityId,
          varietyId: docData.varietyId,
          commodityName: docData.commodityName,
          varietyName: docData.varietyName,
          commodity: docData.commodity,
          variety: docData.variety
        });
        console.log('All DO fields with values:', Object.entries(docData).filter(([key, value]) => value !== undefined && value !== null && value !== ''));
        console.log('=== END DO DOCUMENT DEBUG ===');
        
        // Fetch warehouse type from inspections collection (same logic as release order report)
        let warehouseType = '';
        let warehouseCode = '';
        let warehouseAddress = '';
        let businessType = '';
        
        if (docData.warehouseName) {
          console.log('Looking for warehouse type for warehouse name:', docData.warehouseName);
          try {
            // Fetch warehouse type from inspections collection where typeOfWarehouse field is present
            try {
              console.log(`Fetching warehouse type from inspections collection for warehouse: ${docData.warehouseName}`);
              
              // Query inspections collection with database location filter if available
              let inspectionsQuery;
              if (docData.databaseLocation) {
                inspectionsQuery = query(
                  collection(db, SEARCH_PATTERNS.COLLECTIONS.INSPECTIONS),
                  where('warehouseName', '==', docData.warehouseName),
                  where('databaseLocation', '==', docData.databaseLocation)
                );
              } else {
                inspectionsQuery = query(
                  collection(db, SEARCH_PATTERNS.COLLECTIONS.INSPECTIONS),
                  where('warehouseName', '==', docData.warehouseName)
                );
              }
              
              const inspectionsSnapshot = await getDocs(inspectionsQuery);
              console.log('Inspections query result:', inspectionsSnapshot.size, 'documents');
              
              if (!inspectionsSnapshot.empty) {
                const inspectionData = inspectionsSnapshot.docs[0].data();
                console.log('Inspections data found:', inspectionData);
                console.log('Available fields in inspections:', Object.keys(inspectionData));
                
                // Get warehouse type from typeOfWarehouse field (correct field name)
                warehouseType = inspectionData.typeOfWarehouse || 
                              inspectionData.typeofwarehouse || 
                              inspectionData.warehouseType || 
                              inspectionData.warehouseInspectionData?.typeOfWarehouse ||
                              inspectionData.warehouseInspectionData?.warehouseType || '';
                
                // Get other warehouse details from inspections
                warehouseCode = inspectionData.warehouseCode || 
                              inspectionData.warehouseInspectionData?.warehouseCode || '';
                warehouseAddress = inspectionData.warehouseAddress || 
                                inspectionData.warehouseInspectionData?.warehouseAddress || '';
                businessType = inspectionData.businessType || 
                             inspectionData.warehouseInspectionData?.businessType || '';
                
                console.log('Extracted warehouse type from inspections:', warehouseType);
                console.log('Warehouse code from inspections:', warehouseCode);
              } else {
                console.log('No inspections data found for warehouse:', docData.warehouseName);
              }
            } catch (error) {
              console.log('Error fetching from inspections collection:', error);
            }
            
            console.log('Final extracted warehouse type:', warehouseType);
            console.log('Warehouse type will be displayed as:', warehouseType || '-');
          } catch (error) {
            console.log('Error fetching warehouse type from warehouse creation:', error);
          }
        }
        
        // Fetch commodity and variety - prioritize inward data based on eye number and warehouse details
        let commodity = '';
        let variety = '';
        
        console.log('=== COMMODITY/VARIETY FETCHING DEBUG (INWARD DATA PRIORITY) ===');
        console.log('DO data commodity fields:', {
          commodityId: docData.commodityId,
          varietyId: docData.varietyId,
          commodityName: docData.commodityName,
          varietyName: docData.varietyName,
          commodity: docData.commodity,
          variety: docData.variety,
          eyeNumber: docData.eyeNumber,
          srwrNo: docData.srwrNo
        });
        console.log('All DO data fields:', Object.keys(docData));
        console.log('DO data values:', docData);
        
        // Step 1: Check if commodityName and varietyName are directly available in DO data
        if (docData.commodityName) {
          commodity = docData.commodityName;
          console.log('✅ Using commodityName directly from DO data:', commodity);
        }
        if (docData.varietyName) {
          variety = docData.varietyName;
          console.log('✅ Using varietyName directly from DO data:', variety);
        }
        
        // Step 2: If we don't have commodity/variety names, fetch from inward data based on eye number and warehouse details
        if ((!commodity || !variety) && docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME]) {
          try {
            console.log('🔍 Fetching commodity/variety from inward data for warehouse:', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME]);
            const inwardCollection = collection(db, SEARCH_PATTERNS.COLLECTIONS.INWARD);
            
            // Build query to find inward data based on warehouse details
            let inwardQuery;
            let inwardSnapshot;
            
            // Try multiple search strategies based on the actual inward data structure
            if (docData[FIELD_NAMES.DELIVERY_ORDER.EYE_NUMBER]) {
              // Strategy 1: Search by eye number and warehouse name
              inwardQuery = query(
                inwardCollection,
                where(FIELD_NAMES.INWARD.EYE_NUMBER, '==', docData[FIELD_NAMES.DELIVERY_ORDER.EYE_NUMBER]),
                where(FIELD_NAMES.INWARD.WAREHOUSE_NAME, '==', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME])
              );
              console.log('🔍 Strategy 1: Searching inward data by eye number:', docData[FIELD_NAMES.DELIVERY_ORDER.EYE_NUMBER]);
              inwardSnapshot = await getDocs(inwardQuery);
            }
            
            if ((!inwardSnapshot || inwardSnapshot.empty) && docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_CODE]) {
              // Strategy 2: Search by warehouse code (most reliable based on the data structure)
              inwardQuery = query(
                inwardCollection,
                where(FIELD_NAMES.INWARD.WAREHOUSE_CODE, '==', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_CODE])
              );
              console.log('🔍 Strategy 2: Searching inward data by warehouse code:', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_CODE]);
              inwardSnapshot = await getDocs(inwardQuery);
            }
            
            if ((!inwardSnapshot || inwardSnapshot.empty) && docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME]) {
              // Strategy 3: Search by warehouse name
              inwardQuery = query(
                inwardCollection,
                where(FIELD_NAMES.INWARD.WAREHOUSE_NAME, '==', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME])
              );
              console.log('🔍 Strategy 3: Searching inward data by warehouse name:', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME]);
              inwardSnapshot = await getDocs(inwardQuery);
            }
            
            if ((!inwardSnapshot || inwardSnapshot.empty) && docData[FIELD_NAMES.DELIVERY_ORDER.SRWR_NO]) {
              // Strategy 4: Try to match by inwardId pattern (INW-XXX format)
              const inwardIdPattern = docData[FIELD_NAMES.DELIVERY_ORDER.SRWR_NO].includes(SEARCH_PATTERNS.INWARD_ID_PREFIX) ? docData[FIELD_NAMES.DELIVERY_ORDER.SRWR_NO] : null;
              if (inwardIdPattern) {
                inwardQuery = query(
                  inwardCollection,
                  where(FIELD_NAMES.INWARD.INWARD_ID, '==', inwardIdPattern)
                );
                console.log('🔍 Strategy 4: Searching inward data by inwardId:', inwardIdPattern);
                inwardSnapshot = await getDocs(inwardQuery);
              }
            }
            
            if ((!inwardSnapshot || inwardSnapshot.empty) && docData[FIELD_NAMES.DELIVERY_ORDER.CLIENT_CODE]) {
              // Strategy 5: Search by client code and warehouse
              inwardQuery = query(
                inwardCollection,
                where(FIELD_NAMES.INWARD.CLIENT_CODE, '==', docData[FIELD_NAMES.DELIVERY_ORDER.CLIENT_CODE]),
                where(FIELD_NAMES.INWARD.WAREHOUSE_NAME, '==', docData[FIELD_NAMES.DELIVERY_ORDER.WAREHOUSE_NAME])
              );
              console.log('🔍 Strategy 5: Searching inward data by client code:', docData[FIELD_NAMES.DELIVERY_ORDER.CLIENT_CODE]);
              inwardSnapshot = await getDocs(inwardQuery);
            }
            
            console.log('Inward query result:', inwardSnapshot?.size || 0, 'documents');
            
            if (inwardSnapshot && !inwardSnapshot.empty) {
              // Get the first matching inward entry
              const inwardData = inwardSnapshot.docs[0].data();
              console.log('Found inward data:', inwardData);
              
              // Extract commodity and variety from inward data using configuration
              // Check root level fields first
              if (!commodity) {
                for (const field of FIELD_EXTRACTION.COMMODITY_FIELDS) {
                  if (inwardData[field]) {
                    commodity = inwardData[field];
                    console.log(`✅ Commodity fetched from inward data (root level ${field}):`, commodity);
                    break;
                  }
                }
              }
              
              if (!variety) {
                for (const field of FIELD_EXTRACTION.VARIETY_FIELDS) {
                  if (inwardData[field]) {
                    variety = inwardData[field];
                    console.log(`✅ Variety fetched from inward data (root level ${field}):`, variety);
                    break;
                  }
                }
              }
              
              // Check inwardEntries array for commodity and variety
              if ((!commodity || !variety) && inwardData[FIELD_NAMES.INWARD.INWARD_ENTRIES] && Array.isArray(inwardData[FIELD_NAMES.INWARD.INWARD_ENTRIES])) {
                console.log('🔍 Checking inwardEntries array for commodity/variety data');
                console.log('Number of inward entries:', inwardData[FIELD_NAMES.INWARD.INWARD_ENTRIES].length);
                
                // Get the entry from inwardEntries array using configured index
                const entryIndex = FIELD_EXTRACTION.INWARD_ENTRIES_INDEX;
                const targetEntry = inwardData[FIELD_NAMES.INWARD.INWARD_ENTRIES][entryIndex];
                if (targetEntry) {
                  console.log(`Inward entry [${entryIndex}]:`, targetEntry);
                  
                  if (!commodity) {
                    for (const field of FIELD_EXTRACTION.COMMODITY_FIELDS) {
                      if (targetEntry[field]) {
                        commodity = targetEntry[field];
                        console.log(`✅ Commodity fetched from inwardEntries[${entryIndex}].${field}:`, commodity);
                        break;
                      }
                    }
                  }
                  
                  if (!variety) {
                    for (const field of FIELD_EXTRACTION.VARIETY_FIELDS) {
                      if (targetEntry[field]) {
                        variety = targetEntry[field];
                        console.log(`✅ Variety fetched from inwardEntries[${entryIndex}].${field}:`, variety);
                        break;
                      }
                    }
                  }
                }
              }
              
              // Log all available fields in inward data for debugging
              console.log('Available fields in inward data:', Object.keys(inwardData));
              console.log('Commodity-related fields:', {
                [FIELD_NAMES.INWARD.COMMODITY]: inwardData[FIELD_NAMES.INWARD.COMMODITY],
                [FIELD_NAMES.INWARD.COMMODITY_NAME]: inwardData[FIELD_NAMES.INWARD.COMMODITY_NAME],
                commodityId: inwardData.commodityId
              });
              console.log('Variety-related fields:', {
                [FIELD_NAMES.INWARD.VARIETY]: inwardData[FIELD_NAMES.INWARD.VARIETY],
                [FIELD_NAMES.INWARD.VARIETY_NAME]: inwardData[FIELD_NAMES.INWARD.VARIETY_NAME],
                varietyId: inwardData.varietyId
              });
              console.log('InwardEntries structure:', inwardData[FIELD_NAMES.INWARD.INWARD_ENTRIES] ? inwardData[FIELD_NAMES.INWARD.INWARD_ENTRIES].map((entry: any, index: number) => ({
                index,
                [FIELD_NAMES.INWARD.COMMODITY]: entry[FIELD_NAMES.INWARD.COMMODITY],
                [FIELD_NAMES.INWARD.VARIETY_NAME]: entry[FIELD_NAMES.INWARD.VARIETY_NAME],
                entryNumber: entry.entryNumber
              })) : 'No inwardEntries array');
            } else {
              console.log('❌ No inward data found for warehouse:', docData.warehouseName);
            }
          } catch (error) {
            console.log('❌ Error fetching from inward collection:', error);
          }
        }
        
        // Step 3: Fallback to commodities collection if still no commodity/variety found
        if (!commodity && docData.commodityId) {
          try {
            console.log('🔍 Fallback: Fetching commodity from commodities collection for commodityId:', docData.commodityId);
            const commoditiesCollection = collection(db, SEARCH_PATTERNS.COLLECTIONS.COMMODITIES);
            const commodityQuery = query(
              commoditiesCollection,
              where('commodityId', '==', docData.commodityId)
            );
            const commoditySnapshot = await getDocs(commodityQuery);
            
            if (!commoditySnapshot.empty) {
              const commodityData = commoditySnapshot.docs[0].data();
              commodity = commodityData.commodityName || '';
              console.log('✅ Commodity fetched from commodities collection (fallback):', commodity);
            } else {
              console.log('❌ No commodity found for commodityId:', docData.commodityId);
            }
          } catch (error) {
            console.log('❌ Error fetching commodity from commodities collection:', error);
          }
        }
        
        if (!variety && docData.varietyId) {
          try {
            console.log('🔍 Fallback: Fetching variety from commodities collection for varietyId:', docData.varietyId);
            const commoditiesCollection = collection(db, 'commodities');
            
            // First try to find variety in the same commodity if we have commodityId
            if (docData.commodityId) {
              const commodityQuery = query(
                commoditiesCollection,
                where('commodityId', '==', docData.commodityId)
              );
              const commoditySnapshot = await getDocs(commodityQuery);
              
              if (!commoditySnapshot.empty) {
                const commodityData = commoditySnapshot.docs[0].data();
                if (commodityData.varieties) {
                  const varietyData = commodityData.varieties.find((v: any) => v.varietyId === docData.varietyId);
                  if (varietyData) {
                    variety = varietyData.varietyName || '';
                    console.log('✅ Variety found in same commodity (fallback):', variety);
                  }
                }
              }
            }
            
            // If still no variety, search across all commodities
            if (!variety) {
              console.log('🔍 Fallback: Searching for variety across all commodities...');
              const allCommoditiesSnapshot = await getDocs(commoditiesCollection);
              
              for (const commodityDoc of allCommoditiesSnapshot.docs) {
                const commodityData = commodityDoc.data();
                if (commodityData.varieties) {
                  const varietyData = commodityData.varieties.find((v: any) => v.varietyId === docData.varietyId);
                  if (varietyData) {
                    variety = varietyData.varietyName || '';
                    console.log('✅ Variety found in commodity (fallback):', commodityData.commodityName, 'variety:', variety);
                    break;
                  }
                }
              }
            }
            
            if (!variety) {
              console.log('❌ No variety found for varietyId:', docData.varietyId);
            }
          } catch (error) {
            console.log('❌ Error fetching variety from commodities collection:', error);
          }
        }
        
        console.log('=== FINAL COMMODITY/VARIETY RESULT (INWARD DATA PRIORITY) ===');
        console.log('🎯 Final commodity for report:', commodity || DEFAULTS.NOT_FOUND);
        console.log('🎯 Final variety for report:', variety || DEFAULTS.NOT_FOUND);
        console.log('=== END COMMODITY/VARIETY FETCHING DEBUG ===');
        
        // Additional debugging for data assignment
        console.log('=== DATA ASSIGNMENT DEBUG ===');
        console.log('About to assign commodity:', commodity);
        console.log('About to assign variety:', variety);
        console.log('=== END DATA ASSIGNMENT DEBUG ===');
        
        // Calculate balance values if not present
        const calculatedBalanceBags = docData.balanceBags || (docData.totalBags && docData.doBags ? (docData.totalBags - docData.doBags).toString() : '');
        const calculatedBalanceQty = docData.balanceQuantity || (docData.totalQuantity && docData.doQuantity ? (docData.totalQuantity - docData.doQuantity).toString() : '');
        
        console.log('Balance calculation for warehouse:', docData.warehouseName, {
          totalBags: docData.totalBags,
          doBags: docData.doBags,
          calculatedBalanceBags,
          totalQuantity: docData.totalQuantity,
          doQuantity: docData.doQuantity,
          calculatedBalanceQty
        });
        
        return {
          id: doc.id,
          state: docData.state || '',
          branch: docData.branch || '',
          location: docData.location || '',
          typeOfBusiness: businessType || docData.businessType || docData.typeOfBusiness || '',
          warehouseType: warehouseType,
          warehouseCode: warehouseCode || docData.warehouseCode || '',
          warehouseName: docData.warehouseName || '',
          warehouseAddress: warehouseAddress || docData.warehouseAddress || '',
          clientCode: docData.clientCode || '',
          clientName: docData.client || '',
          commodityName: commodity,
          varietyName: variety,
          inwardBag: docData.totalBags || '',
          inwardQty: docData.totalQuantity || '',
          doNumber: docData.doCode || docData.doNumber || '',
          doDate: docData.createdAt || docData.dateOfDelivery || '',
          doBags: docData.doBags || docData.bags || '',
          doQty: docData.doQuantity || docData.quantity || '',
          doCode: docData.doCode || docData.doNumber || '',
          balanceBag: calculatedBalanceBags,
          balanceQty: calculatedBalanceQty,
          ...docData
        };
      }));
      
      console.log('Processed DO data:', data.length, 'records');
      setDoData(data);
    } catch (error) {
      console.error('Error fetching DO data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(doData.map(item => item.state).filter(Boolean)));
  }, [doData]);

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(doData.map(item => item.branch).filter(Boolean)));
  }, [doData]);

  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(doData.map(item => item.warehouseName).filter(Boolean)));
  }, [doData]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(doData.map(item => item.clientName).filter(Boolean)));
  }, [doData]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(doData.map(item => item.status).filter(Boolean)));
  }, [doData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = doData;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    

      const today = new Date();
      const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      




    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply warehouse filter
    if (warehouseFilter && warehouseFilter !== 'all') {
      filtered = filtered.filter(item => item.warehouseName === warehouseFilter);
    }

    // Apply state filter
    if (stateFilter && stateFilter !== 'all') {
      filtered = filtered.filter(item => item.state === stateFilter);
    }

    // Apply client filter
    if (clientFilter && clientFilter !== 'all') {
      filtered = filtered.filter(item => item.clientName === clientFilter);
    }
    
    return filtered;
  }, [doData, searchTerm, statusFilter, warehouseFilter, stateFilter, clientFilter]);

  // Export filtered data to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = [
      'State', 'Branch', 'Location', 'Type of Business', 'Warehouse Type', 'Warehouse Code', 'Warehouse Name',
      'Warehouse Address', 'Client Code', 'Client Name', 'Commodity', 'Variety', 'Inward Bag', 'Inward Qty',
      'DO Number', 'DO Date', 'DO Bags', 'DO Qty (MT)', 'DO Code', 'Balance Bag', 'Balance QT'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.state || '',
        row.branch || '',
        row.location || '',
        row.typeOfBusiness || '',
        row.warehouseType || '',
        row.warehouseCode || '',
        row.warehouseName || '',
        row.warehouseAddress || '',
        row.clientCode || '',
        row.clientName || '',
        row.commodityName || '',
        row.varietyName || '',
        row.inwardBag || '',
        row.inwardQty || '',
        row.doNumber || '',
        row.doDate || '',
        row.doBags || '',
        row.doQty || '',
        row.doCode || '',
        row.balanceBag || '',
        row.balanceQty || ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery_order_report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setWarehouseFilter('all');
    setStateFilter('all');
    setClientFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || warehouseFilter !== 'all' || stateFilter !== 'all' || clientFilter !== 'all';

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('approved') || normalizedStatus.includes('active') || normalizedStatus.includes('completed')) {
      return 'bg-green-100 text-green-800';
    } else if (normalizedStatus.includes('pending')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalizedStatus.includes('rejected') || normalizedStatus.includes('expired') || normalizedStatus.includes('cancelled')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Handle date change with validation
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartDate(value);
      // Ensure end date is not more than 6 months after start date
      if (value && endDate) {
        const start = new Date(value);
        const end = new Date(endDate);
        const sixMonthsLater = new Date(start);
        sixMonthsLater.setMonth(start.getMonth() + 6);
        
        if (end > sixMonthsLater) {
          setEndDate(sixMonthsLater.toISOString().split('T')[0]);
        }
      }
    } else {
      setEndDate(value);
      // Ensure start date is not more than 6 months before end date
      if (value && startDate) {
        const start = new Date(startDate);
        const end = new Date(value);
        const sixMonthsBefore = new Date(end);
        sixMonthsBefore.setMonth(end.getMonth() - 6);
        
        if (start < sixMonthsBefore) {
          setStartDate(sixMonthsBefore.toISOString().split('T')[0]);
        }
      }
    }
  };

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Get visible columns data
  const visibleColumnsData = allColumns.filter(col => visibleColumns.includes(col.key));







  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-lg font-semibold tracking-tight bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <Button 
              onClick={fetchDOData}
              variant="outline"
              className="inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
          
          <div className="text-center flex flex-col items-center">
            {/* Logo */}
            <div className="w-36 h-10 relative mb-3 bg-white rounded-lg px-2 py-1">
              {/* <Image 
                src="/AGlogo.webp" 
                alt="AgroGreen Logo" 
                fill
                className="object-contain"
                priority
              /> */}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 inline-block border-b-4 border-green-500 pb-2 px-6 py-3 bg-orange-100 rounded-lg">
              Delivery Order Reports
            </h1>
            <p className="text-muted-foreground">Generate and view delivery order transaction reports</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} disabled={filteredData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search & Filter Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search across all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
                  {/* Date Range Filter */}
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      max={endDate}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      min={startDate}
                      max={(() => {
                        if (startDate) {
                          const maxDate = new Date(startDate);
                          maxDate.setMonth(maxDate.getMonth() + 6);
                          return maxDate.toISOString().split('T')[0];
                        }
                        return '';
                      })()}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 6 months range</p>
                  </div>

                  <div>
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="warehouseFilter">Warehouse</Label>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Warehouses</SelectItem>
                        {uniqueWarehouses.map(warehouse => (
                          <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="clientFilter">Client</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {uniqueClients.map(client => (
                          <SelectItem key={client} value={client}>{client}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Additional Filters Row */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="stateFilter">State</Label>
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {uniqueStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Column Visibility
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allColumns.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.key}
                            checked={visibleColumns.includes(column.key)}
                            onCheckedChange={() => toggleColumn(column.key)}
                          >
                            {column.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Search: {searchTerm}
                        <button onClick={() => setSearchTerm('')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {warehouseFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Warehouse: {warehouseFilter}
                        <button onClick={() => setWarehouseFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {stateFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">
                        State: {stateFilter}
                        <button onClick={() => setStateFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Status: {statusFilter}
                        <button onClick={() => setStatusFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {clientFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Client: {clientFilter}
                        <button onClick={() => setClientFilter('all')} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                  </div>
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length} of {doData.length} records
            {hasActiveFilters && ` (filtered)`}
            {startDate && endDate && ` | Date Range: ${startDate} to ${endDate}`}
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-orange-100">
                  <tr>
                    {visibleColumns.includes('state') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">State</th>}
                    {visibleColumns.includes('branch') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Branch</th>}
                    {visibleColumns.includes('location') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Location</th>}
                    {visibleColumns.includes('typeOfBusiness') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Type of Business</th>}
                    {visibleColumns.includes('warehouseType') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Type</th>}
                    {visibleColumns.includes('warehouseCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Code</th>}
                    {visibleColumns.includes('warehouseName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Name</th>}
                    {visibleColumns.includes('warehouseAddress') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Warehouse Address</th>}
                    {visibleColumns.includes('clientCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client Code</th>}
                    {visibleColumns.includes('clientName') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Client Name</th>}
                    {visibleColumns.includes('commodity') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Commodity</th>}
                    {visibleColumns.includes('variety') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Variety</th>}
                    {visibleColumns.includes('inwardBag') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Inward Bag</th>}
                    {visibleColumns.includes('inwardQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Inward Qty</th>}
                    {visibleColumns.includes('doNumber') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">DO Number</th>}
                    {visibleColumns.includes('doDate') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">DO Date</th>}
                    {visibleColumns.includes('doBags') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">DO Bags</th>}
                    {visibleColumns.includes('doQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">DO Qty (MT)</th>}
                    {visibleColumns.includes('doCode') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">DO Code</th>}
                    {visibleColumns.includes('balanceBag') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Balance Bag</th>}
                    {visibleColumns.includes('balanceQty') && <th className="border border-orange-300 px-4 py-2 text-left text-orange-800 font-semibold">Balance QT</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('state') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.state || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('branch') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.branch || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('location') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.location || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('typeOfBusiness') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.typeOfBusiness || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseType') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseType || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.warehouseCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('warehouseAddress') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.warehouseAddress || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('clientCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.clientCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('clientName') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.clientName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('commodity') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.commodityName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('variety') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {item.varietyName || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('inwardBag') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.inwardBag || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('inwardQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.inwardQty || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('doNumber') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.doNumber || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('doDate') && (
                        <td className="border border-gray-200 px-4 py-2">
                          {formatDate(item.doDate)}
                        </td>
                      )}
                      {visibleColumns.includes('doBags') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.doBags || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('doQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.doQty || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('doCode') && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {item.doCode || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('balanceBag') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.balanceBag || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('balanceQty') && (
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {item.balanceQty || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading data...' : 'No delivery order data found matching the current filters'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
