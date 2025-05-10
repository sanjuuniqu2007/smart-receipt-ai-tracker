
import { createWorker } from 'tesseract.js';

interface ExtractedReceipt {
  vendor: string;
  date: string;
  amount: string;
  dueDate?: string;
}

/**
 * Extract text from a receipt image using Tesseract OCR
 */
export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(imageFile);
    
    return text;
  } finally {
    await worker.terminate();
  }
};

/**
 * Parse extracted text to find receipt data
 * This is a simplified version - a more robust implementation would use
 * regex patterns and better heuristics for each field
 */
export const parseReceiptText = (text: string): ExtractedReceipt => {
  // Default values
  const result: ExtractedReceipt = {
    vendor: "",
    date: "",
    amount: "",
  };
  
  // Split text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  if (lines.length > 0) {
    // First line is often the vendor name
    result.vendor = lines[0];
    
    // Look for date patterns (simple approach)
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const dateLine = lines.find(line => dateRegex.test(line));
    if (dateLine) {
      const dateMatch = dateLine.match(dateRegex);
      if (dateMatch) {
        // Convert to YYYY-MM-DD format
        const [_, month, day, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        result.date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Look for total amount (simple approach)
    const totalRegex = /total[\s:]*[$]?(\d+\.\d{2})/i;
    const amountLine = lines.find(line => totalRegex.test(line));
    if (amountLine) {
      const amountMatch = amountLine.match(totalRegex);
      if (amountMatch && amountMatch[1]) {
        result.amount = amountMatch[1];
      }
    }
    
    // Look for due date if exists
    const dueDateRegex = /due[\s:]*(date)?[\s:]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i;
    const dueDateLine = lines.find(line => dueDateRegex.test(line));
    if (dueDateLine) {
      const dueDateMatch = dueDateLine.match(dueDateRegex);
      if (dueDateMatch) {
        // Convert to YYYY-MM-DD format
        const [_, __, month, day, year] = dueDateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        result.dueDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  return result;
};

/**
 * Process receipt image and extract data
 */
export const processReceiptImage = async (imageFile: File): Promise<ExtractedReceipt> => {
  try {
    // Extract text from image
    const extractedText = await extractTextFromImage(imageFile);
    console.log('Extracted Text:', extractedText);
    
    // Parse text to find receipt data
    const receiptData = parseReceiptText(extractedText);
    console.log('Parsed Receipt Data:', receiptData);
    
    return receiptData;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw new Error('Failed to process receipt image');
  }
};
