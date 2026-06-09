import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';

const xmlData = fs.readFileSync('test.xml', 'utf-8');
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
});

let parsed = parser.parse(xmlData);
console.log('Top level keys:', Object.keys(parsed));

if (parsed.AttachedDocument && parsed.AttachedDocument.Attachment && parsed.AttachedDocument.Attachment.ExternalReference && parsed.AttachedDocument.Attachment.ExternalReference.Description) {
    console.log('Found AttachedDocument');
    const innerXml = parsed.AttachedDocument.Attachment.ExternalReference.Description;
    parsed = parser.parse(innerXml);
    console.log('Inner top level keys:', Object.keys(parsed));
}

const document = parsed.Invoice || parsed.CreditNote;
if (!document) {
    console.log('No Invoice or CreditNote found');
} else {
    console.log('Document ID:', document.ID);
    console.log('IssueDate:', document.IssueDate);
    
    const supplierParty = document.AccountingSupplierParty?.Party;
    const razonSocial = supplierParty?.PartyTaxScheme?.RegistrationName || supplierParty?.PartyName?.Name;
    const nitProveedor = supplierParty?.PartyTaxScheme?.CompanyID?.['#text'] || supplierParty?.PartyTaxScheme?.CompanyID || supplierParty?.PartyLegalEntity?.CompanyID?.['#text'] || supplierParty?.PartyLegalEntity?.CompanyID;
    
    console.log('Proveedor:', razonSocial);
    console.log('NIT:', nitProveedor);
    
    const totals = document.LegalMonetaryTotal;
    const subtotal = totals?.LineExtensionAmount?.['#text'] || totals?.LineExtensionAmount || 0;
    const amount = totals?.PayableAmount?.['#text'] || totals?.PayableAmount || totals?.TaxInclusiveAmount?.['#text'] || totals?.TaxInclusiveAmount || 0;
    
    console.log('Subtotal:', subtotal);
    console.log('Total:', amount);
}
