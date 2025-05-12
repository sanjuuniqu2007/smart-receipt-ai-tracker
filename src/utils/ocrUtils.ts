
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
        const month = dateMatch[1];
        const day = dateMatch[2];
        const year = dateMatch[3];
        const fullYear = year.length === 2 ? `20${year}` : year;
        result.date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Look for amount patterns (enhanced approach)
    const amountRegexPatterns = [
      /total[\s:]*[$]?(\d+\.\d{2})/i,
      /amount[\s:]*[$]?(\d+\.\d{2})/i,
      /subtotal[\s:]*[$]?(\d+\.\d{2})/i,
      /[$](\d+\.\d{2})/,
      /(\d+\.\d{2})/
    ];
    
    for (const regex of amountRegexPatterns) {
      const amountLine = lines.find(line => regex.test(line));
      if (amountLine) {
        const amountMatch = amountLine.match(regex);
        if (amountMatch && amountMatch[1]) {
          result.amount = amountMatch[1];
          break;
        }
      }
    }
    
    // Look for due date or warranty expiry if exists
    const dueDateRegexPatterns = [
      /due[\s:]*(date)?[\s:]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /expir[ey][\s:]*(date)?[\s:]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /warranty[\s\w]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i
    ];
    
    for (const regex of dueDateRegexPatterns) {
      const dueDateLine = lines.find(line => regex.test(line));
      if (dueDateLine) {
        const dueDateMatch = dueDateLine.match(regex);
        if (dueDateMatch) {
          // Extract month, day, year based on pattern matched
          let month, day, year;
          
          // Check which pattern matched and extract accordingly
          if (regex.source.includes('due')) {
            // For patterns like "due date: MM/DD/YYYY"
            month = dueDateMatch[2];
            day = dueDateMatch[3];
            year = dueDateMatch[4];
          } else if (regex.source.includes('expir')) {
            // For patterns like "expiry date: MM/DD/YYYY"
            month = dueDateMatch[2];
            day = dueDateMatch[3];
            year = dueDateMatch[4];
          } else if (regex.source.includes('warranty')) {
            // For patterns like "warranty until MM/DD/YYYY"
            month = dueDateMatch[1];
            day = dueDateMatch[2];
            year = dueDateMatch[3];
          }
          
          if (month && day && year) {
            const fullYear = year.length === 2 ? `20${year}` : year;
            result.dueDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            break;
          }
        }
      }
    }
  }
  
  console.log('Parsed Receipt Data:', result);
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
    
    return receiptData;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw new Error('Failed to process receipt image');
  }
};
