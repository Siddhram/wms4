import React from 'react';

interface InsuranceDetail {
  policyNo: string;
  company: string;
  validFrom: string;
  validTo: string;
  sumInsured: string;
}

interface StorageReceiptProps {
  data: {
    srNo: string;
    inwardId?: string;
    srGenerationDate?: string;
    dateOfIssue: string;
    baseReceiptNo: string;
    cadNo?: string;
    cadNumber?: string;
    dateOfDeposit: string;
    branch: string;
    warehouseName: string;
    warehouseAddress: string;
    client: string;
    clientAddress: string;
    commodity: string;
    totalBags: string;
    netWeight: string;
    grade: string;
    remarks: string;
    marketRate: string;
    valueOfCommodity: string;
    hologramNumber: string;
    insuranceDetails: InsuranceDetail[];
    bankName: string;
    date: string;
    place: string;
    stockInwardDate?: string;
    receiptType?: string; // 'SR' or 'WR'
    varietyName?: string;
    dateOfSampling?: string;
    dateOfTesting?: string;
  };
}

const borderColor = '#e67c1f';
const borderLight = '#f3c892';
const headerBg = '#fff7ed';
const labelStyle = { fontWeight: 700, color: borderColor, fontSize: 15, letterSpacing: 0.5 };
const valueStyle = { fontWeight: 500, color: '#222', fontSize: 15, letterSpacing: 0.2 };
const cellPad = 14;

const StorageReceipt: React.FC<StorageReceiptProps> = ({ data }) => {
  // Fallbacks for SR/WR No and CAD No
  const srNo = data.srNo || data.inwardId || '-';
  const cadNo = data.cadNo || data.cadNumber || '-';
  const srGenerationDate = data.srGenerationDate || '-';
  const insurance = (Array.isArray(data.insuranceDetails) && data.insuranceDetails[0]) ? data.insuranceDetails[0] : null;
  const receiptType = (data.receiptType || 'SR').toUpperCase();
  const isWR = receiptType === 'WR';

  // Dynamic labels
  const receiptTitle = isWR ? 'WAREHOUSE RECEIPT (WR)' : 'STORAGE RECEIPT (SR)';
  const noLabel = isWR ? 'WR No.' : 'SR No.';
  const genDateLabel = isWR ? 'WR Generation Date' : 'SR Generation Date';

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
        <img src="/Group 86.png" alt="Agrogreen Logo" style={{ width: 90, height: 90, borderRadius: '50%', margin: '0 auto 8px' }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1aad4b', letterSpacing: 0.5, marginBottom: 2 }}>AGROGREEN WAREHOUSING PRIVATE LTD.</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#e67c1f', marginBottom: 8 }}>603, 6th Floor, Princess Business Skyline, Indore, Madhya Pradesh - 452010</div>
      </div>
      {/* Centered STORAGE RECEIPT/WAREHOUSE RECEIPT title with margin */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '36px auto 36px auto' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: borderColor, textAlign: 'center' }}>
          {receiptTitle}
        </span>
      </div>
      {/* Info Table - two column, bordered, orange style */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>{noLabel}</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{srNo}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Generation Date</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{srGenerationDate}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Client Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.client}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Client Address</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.clientAddress}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Commodity</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.commodity}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Variety Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.varietyName}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Warehouse Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.warehouseName}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Warehouse Address</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.warehouseAddress}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Total Bags</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.totalBags}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Net Weight</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.netWeight}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Total Value (Rs/MT)</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.valueOfCommodity}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Date of Issue</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.dateOfIssue}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Date of Deposit</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.dateOfDeposit}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Branch Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.branch}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Base Receipt/Licenses No.</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.baseReceiptNo}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Market Rate</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.marketRate}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Hologram Number</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.hologramNumber}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Bank Name</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.bankName}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Place</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.place}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Date of Deposit</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.dateOfDeposit}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Receipt Type</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.receiptType}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>CAD No</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{cadNo}</td>
          </tr>
          <tr>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Date of Sampling</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.dateOfSampling}</td>
            <td style={{ ...labelStyle, border: `2px solid ${borderColor}`, background: headerBg, textAlign: 'center', padding: 10 }}>Date of Testing</td>
            <td style={{ ...valueStyle, border: `2px solid ${borderColor}`, textAlign: 'center', padding: 10 }}>{data.dateOfTesting}</td>
          </tr>
        </tbody>
      </table>
      {/* Insurance block (defensive) */}
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: borderColor, marginBottom: 6 }}>Insurance Details</div>
        {insurance ? (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ ...valueStyle }}>Policy No: {insurance.policyNo || '-'}</div>
            <div style={{ ...valueStyle }}>Company: {insurance.company || '-'}</div>
            <div style={{ ...valueStyle }}>Valid From: {insurance.validFrom || '-'}</div>
            <div style={{ ...valueStyle }}>Valid To: {insurance.validTo || '-'}</div>
            <div style={{ ...valueStyle }}>Sum Insured: {insurance.sumInsured || '-'}</div>
          </div>
        ) : (
          <div style={{ ...valueStyle }}>No insurance details available.</div>
        )}
      </div>
      {/* Footer Section - matches uploaded image, with sticker/stamp box in bottom left */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 44, marginBottom: 0, position: 'relative' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: borderColor, textAlign: 'left', position: 'relative' }}>
                   <div style={{ width: 190, height: 100, border: '2.5px dashed #fff', marginTop: 8, marginBottom: 4 }} />

          Signature &amp; stamp of authorized signatory
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1aad4b', marginBottom: 4 }}>AGROGREEN WAREHOUSING PRIVATE LIMITED</div>
          <div style={{ width: 190, height: 100, border: '2.5px dashed #fff', marginTop: 8, marginBottom: 4 }} />

          <div style={{ fontSize: 15, fontWeight: 700, color: '#1aad4b', marginTop: 4 }}>AUTHORIZED SIGNATORY</div>
        </div>
      </div>
      <div style={{ borderTop: `1.5px solid ${borderColor}`, margin: '18px 0 0 0' }} />
      {/* Footer/Disclaimer */}
      <div style={{ marginTop: 10, fontSize: 12, color: '#888', textAlign: 'center' }}>
        This certificate is computer generated and does not require a physical signature. Please verify all details. For any discrepancy, contact Agrogreen Warehousing Pvt. Ltd. within 48 hours.
      </div>
    </div>
  );
};

export default StorageReceipt;