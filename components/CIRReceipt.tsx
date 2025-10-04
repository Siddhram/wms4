import React from 'react';
import Image from 'next/image';

interface CIRReceiptProps {
  data: {
    inwardId?: string;
    state?: string;
    branch?: string;
    location?: string;
    warehouseName?: string;
    warehouseCode?: string;
    warehouseAddress?: string;
    businessType?: string;
    client?: string;
    clientCode?: string;
    clientAddress?: string;
    dateOfInward?: string;
    cadNumber?: string;
    bankReceipt?: string;
    commodity?: string;
    varietyName?: string;
    marketRate?: string;
    totalBags?: string;
    totalQuantity?: string;
    totalValue?: string;
    bankName?: string;
    bankBranch?: string;
    bankState?: string;
    ifscCode?: string;
    billingStatus?: string;
    reservationRate?: string;
    reservationQty?: string;
    reservationStart?: string;
    reservationEnd?: string;
    billingCycle?: string;
    billingType?: string;
    billingRate?: string;
    dateOfSampling?: string;
    dateOfTesting?: string;
    labResults?: any[];
    labParameterNames?: string[];
    attachmentUrl?: string;
    vehicleNumber?: string;
    getpassNumber?: string;
    weightBridge?: string;
    weightBridgeSlipNumber?: string;
    grossWeight?: string;
    tareWeight?: string;
    netWeight?: string;
    stacks?: any[];
    insuranceEntries?: any[];
    cirStatus?: string;
    remarks?: string;
    date?: string;
    place?: string;
  };
}

const borderColor = '#e67c1f';
const borderLight = '#f3c892';
const headerBg = '#fff7ed';
const labelStyle = { fontWeight: 700, color: borderColor, fontSize: 15, letterSpacing: 0.5 };
const valueStyle = { fontWeight: 500, color: '#222', fontSize: 15, letterSpacing: 0.2 };
const cellPad = 14;

const CIRReceipt: React.FC<CIRReceiptProps> = ({ data }) => {
  return (
    <div
      style={{
        width: 900,
        margin: '24px auto',
        background: '#f6fef9', // faint green
        borderRadius: 16,
        fontFamily: 'Arial, sans-serif',
        color: '#222',
        boxShadow: '0 4px 24px #e0f2e9',
        padding: 36,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Image src="/Group 86.png" alt="Agrogreen Logo" width={90} height={90} style={{ borderRadius: '50%', margin: '0 auto 8px' }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1aad4b', letterSpacing: 0.5, marginBottom: 2 }}>AGROGREEN WAREHOUSING PRIVATE LTD.</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#e67c1f', marginBottom: 8 }}>603, 6th Floor, Princess Business Skyline, Indore, Madhya Pradesh - 452010</div>
      </div>
      
      {/* Centered CIR FORM title with margin */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '36px auto 36px auto' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: borderColor, textAlign: 'center' }}>
          CIR (COMMODITY INWARD RECEIPT) STATUS FORM
        </span>
      </div>

      {/* Basic Info Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Inward ID</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.inwardId || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>CIR Status</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.cirStatus || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Date of Inward</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.dateOfInward || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>CAD Number</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.cadNumber || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Location Details */}
      <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
        LOCATION DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>State</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.state || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Branch</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.branch || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Location</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.location || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Warehouse Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.warehouseName || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Warehouse Code</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.warehouseCode || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Business Type</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.businessType || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Client Details */}
      <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
        CLIENT DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Client Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.client || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Client Code</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.clientCode || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Client Address</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }} colSpan={3}>{data.clientAddress || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Commodity Details */}
      <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
        COMMODITY DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Commodity</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.commodity || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Variety</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.varietyName || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Total Bags</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.totalBags || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Total Quantity (MT)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.totalQuantity || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Market Rate (Rs/MT)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.marketRate || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Total Value (Rs)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.totalValue || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Vehicle & Weight Details */}
      <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
        VEHICLE & WEIGHT DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Vehicle Number</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.vehicleNumber || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Gatepass Number</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.getpassNumber || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Weight Bridge</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.weightBridge || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Weight Bridge Slip No.</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.weightBridgeSlipNumber || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Gross Weight (MT)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.grossWeight || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Tare Weight (MT)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.tareWeight || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Net Weight (MT)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }} colSpan={3}>{data.netWeight || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Stack Information */}
      {data.stacks && data.stacks.length > 0 && (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
            STACK INFORMATION
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <thead>
              <tr>
                <th style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Stack Number</th>
                <th style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Number of Bags</th>
              </tr>
            </thead>
            <tbody>
              {data.stacks.map((stack: any, index: number) => (
                <tr key={index}>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad, textAlign: 'center' }}>{stack.stackNumber || '-'}</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad, textAlign: 'center' }}>{stack.numberOfBags || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Lab Parameters */}
      {data.labParameterNames && data.labParameterNames.length > 0 && (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
            QUALITY PARAMETERS
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <tbody>
              <tr>
                <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Sampling Date</td>
                <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.dateOfSampling || '-'}</td>
                <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Testing Date</td>
                <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.dateOfTesting || '-'}</td>
              </tr>
            </tbody>
          </table>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <thead>
              <tr>
                <th style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Parameter</th>
                <th style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Actual Value (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.labParameterNames.map((name: string, idx: number) => (
                <tr key={idx}>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{name}</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad, textAlign: 'center' }}>
                    {typeof data.labResults?.[idx] === 'object' && data.labResults[idx]?.value ? 
                      data.labResults[idx].value : 
                      (data.labResults?.[idx] || '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Bank Details */}
      <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
        BANK DETAILS
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Bank Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.bankName || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Bank Branch</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.bankBranch || '-'}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Bank State</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.bankState || '-'}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>IFSC Code</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{data.ifscCode || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Insurance Details */}
      {data.insuranceEntries && data.insuranceEntries.length > 0 && (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
            INSURANCE DETAILS
          </div>
          {data.insuranceEntries.map((insurance: any, index: number) => (
            <table key={index} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
              <tbody>
                <tr>
                  <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Insurance ID</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{insurance.insuranceId || '-'}</td>
                  <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Taken By</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{insurance.insuranceTakenBy || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Fire Policy No.</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{insurance.firePolicyNumber || '-'}</td>
                  <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Fire Policy Amount</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{insurance.firePolicyAmount || '-'}</td>
                </tr>
                <tr>
                  <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Burglary Policy No.</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{insurance.burglaryPolicyNumber || '-'}</td>
                  <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, padding: cellPad }}>Burglary Policy Amount</td>
                  <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad }}>{insurance.burglaryPolicyAmount || '-'}</td>
                </tr>
              </tbody>
            </table>
          ))}
        </>
      )}

      {/* Remarks Section */}
      <div style={{ fontSize: 16, fontWeight: 700, color: borderColor, marginBottom: 8, textAlign: 'center' }}>
        REMARKS / APPROVAL NOTE
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, padding: cellPad, minHeight: '60px', verticalAlign: 'top' }}>
              {data.remarks || 'No remarks provided'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: borderColor, marginBottom: 4 }}>Place: {data.place || 'Indore'}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: borderColor }}>Date: {data.date || new Date().toLocaleDateString('en-IN')}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: `2px solid ${borderColor}`, width: 200, paddingTop: 8, fontSize: 14, fontWeight: 600, color: borderColor }}>
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  );
};

export default CIRReceipt;