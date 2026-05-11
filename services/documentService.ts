/**
 * Document Service
 * Xử lý OCR và Summary operations
 */

import { storageService } from '../utils/storageService';
import RNFetchBlob from 'react-native-blob-util';

const API_URL = 'https://api.mealsretrieval.site';

export interface OCRResponse {
  success: boolean;
  message: string;
  data: {
    extracted_text: string;
    file_name: string;
    processing_time: string;
    text_length: number;
  };
}

export interface SummaryResponse {
  success: boolean;
  message: string;
  data: {
    pages: { [key: string]: string };
    full_summary: string;
    processing_time: string;
    num_pages: number;
  };
}

export interface DocumentResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: number;
    title: string;
    summary_data: {
      pages: { [key: string]: string };
      full_summary: string;
      processing_time: string;
      num_pages: number;
    };
    tags?: string[];
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface DocumentListItem {
  id: number;
  title: string;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
}

export interface DocumentListResponse {
  success: boolean;
  message: string;
  data: DocumentListItem[];
}

class DocumentService {
  /**
   * Process OCR - Upload file (ảnh/PDF) và trích xuất text
   * @param filePath - đường dẫn đến file cần xử lý
   * @param centerTolerance - ngưỡng gom nhóm layout (default 50)
   * @returns extracted text từ file
   */
  async processOCR(
    filePath: string,
    centerTolerance: number = 50
  ): Promise<string> {
    try {
      const accessToken = await storageService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      // Lấy tên file từ path và đảm bảo có extension
      let fileName = filePath.split('/').pop() || 'document';
      const mimeType = this.getMimeType(filePath);
      const ext = filePath.split('.').pop()?.toLowerCase() || '';

      console.log(`[OCR] Original filename: ${fileName}`);
      
      // Ensure filename has proper extension
      if (!fileName.includes('.')) {
        // Add extension based on MIME type
        const extMap: { [key: string]: string } = {
          'application/pdf': 'pdf',
          'image/png': 'png',
          'image/jpeg': 'jpg',
        };
        const fileExt = extMap[mimeType] || ext;
        fileName = `${fileName}.${fileExt}`;
      }

      console.log(`[OCR] Final filename: ${fileName}`);
      console.log(`[OCR] File path: ${filePath}`);
      console.log(`[OCR] MIME type: ${mimeType}`);

      // Check if file exists
      const exists = await RNFetchBlob.fs.exists(filePath);
      if (!exists) {
        throw new Error(`File not found at path: ${filePath}`);
      }
      console.log(`[OCR] File exists: true`);

      // Read file
      const fileContent = await RNFetchBlob.fs.readFile(filePath, 'base64');
      console.log(`[OCR] File read successfully, size: ${fileContent.length} bytes`);

      // Build request - use correct format for multipart
      // RNFetchBlob expects the file data as base64 string when type is set
      const response = await RNFetchBlob.fetch(
        'POST',
        `${API_URL}/api/ocr/process?center_tolerance=${centerTolerance}`,
        {
          'Authorization': `Bearer ${accessToken}`,
        },
        [
          {
            name: 'file',
            filename: fileName,
            type: mimeType,
            data: fileContent,  // This is base64 string
          },
        ]
      );

      console.log(`[OCR] Response received`);
      console.log(`[OCR] Response data length: ${response.data.length}`);
      
      let ocrData: OCRResponse;
      try {
        ocrData = JSON.parse(response.data);
      } catch (parseError) {
        console.error('[OCR] Failed to parse response:', response.data.substring(0, 500));
        throw new Error(`Invalid response format from OCR API: ${response.data.substring(0, 200)}`);
      }

      if (!ocrData.success) {
        throw new Error(ocrData.message || 'OCR processing failed');
      }

      console.log(`[OCR] Success! Extracted text length: ${ocrData.data.text_length}`);
      
      return ocrData.data.extracted_text;
    } catch (error) {
      console.error('[OCR Error]:', error);
      throw error;
    }
  }

  /**
   * Process Summary - Tóm tắt nội dung text
   * @param textContent - text được trích xuất từ OCR
   * @param llmEndpoint - URL của LLM API (optional)
   * @param modelName - tên model LLM (optional)
   * @returns summary data (pages + full_summary)
   */
  async processSummary(
    textContent: string,
    llmEndpoint?: string,
    modelName?: string
  ): Promise<SummaryResponse['data']> {
    try {
      const accessToken = await storageService.getAccessToken();

      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Text content cannot be empty');
      }

      console.log('[Summary] Processing text...');

      const payload: any = {
        text_content: textContent,
      };

      if (llmEndpoint) {
        payload.llm_endpoint = llmEndpoint;
      }

      if (modelName) {
        payload.model_name = modelName;
      }

      const response = await fetch(`${API_URL}/api/summary/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const summaryData: SummaryResponse = await response.json();

      if (!response.ok) {
        throw new Error(summaryData.message || 'Summary processing failed');
      }

      console.log(`[Summary] Success! Created ${summaryData.data.num_pages} summaries`);

      return summaryData.data;
    } catch (error) {
      console.error('[Summary Error]:', error);
      throw error;
    }
  }

  /**
   * Complete flow: OCR + Summary
   * @param filePath - đường dẫn file để xử lý
   * @returns summary data
   */
  async processOCRAndSummary(filePath: string): Promise<SummaryResponse['data']> {
    try {
      console.log('[Document Processing] Starting OCR + Summary flow...');

      // Step 1: OCR
      const extractedText = await this.processOCR(filePath);

      // Step 2: Summary
      const summaryData = await this.processSummary(extractedText);

      console.log('[Document Processing] Complete!');

      return summaryData;
    } catch (error) {
      console.error('[Document Processing Error]:', error);
      throw error;
    }
  }

  /**
   * Xác định MIME type từ file extension
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Save Document - Lưu tài liệu đã tóm tắt vào database
   * @param title - Tên tài liệu
   * @param summaryData - Dữ liệu tóm tắt từ OCR + Summary
   * @param tags - Tags cho document (optional)
   * @returns saved document data
   */
  async saveDocument(
    title: string,
    summaryData: SummaryResponse['data'],
    tags?: string[]
  ): Promise<DocumentResponse['data']> {
    try {
      const accessToken = await storageService.getAccessToken();

      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      if (!title || title.trim().length === 0) {
        throw new Error('Document title cannot be empty');
      }

      console.log('[Document Save] Saving document...');

      const payload = {
        title: title.trim(),
        summary_data: summaryData,
        tags: tags || [],
      };

      const response = await fetch(`${API_URL}/api/documents/save?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const saveResponse: DocumentResponse = await response.json();

      if (!response.ok) {
        throw new Error(saveResponse.message || 'Failed to save document');
      }

      console.log(`[Document Save] Document saved successfully with ID: ${saveResponse.data.id}`);

      return saveResponse.data;
    } catch (error) {
      console.error('[Document Save Error]:', error);
      throw error;
    }
  }

  /**
   * Get Documents List - Lấy danh sách documents của user
   * @returns array of documents
   */
  async getDocuments(): Promise<DocumentListItem[]> {
    try {
      const accessToken = await storageService.getAccessToken();

      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      console.log('[Documents List] Fetching documents...');

      const response = await fetch(`${API_URL}/api/documents/list?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const listResponse: DocumentListResponse = await response.json();

      if (!response.ok) {
        throw new Error(listResponse.message || 'Failed to fetch documents');
      }

      console.log(`[Documents List] Fetched ${listResponse.data.length} documents`);

      return listResponse.data;
    } catch (error) {
      console.error('[Documents List Error]:', error);
      throw error;
    }
  }

  /**
   * Get Document Detail - Lấy chi tiết một document
   * @param documentId - ID của document
   * @returns document details
   */
  async getDocumentDetail(documentId: number): Promise<DocumentResponse['data']> {
    try {
      const accessToken = await storageService.getAccessToken();

      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      console.log(`[Document Detail] Fetching document ${documentId}...`);

      const response = await fetch(`${API_URL}/api/documents/${documentId}?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const detailResponse: DocumentResponse = await response.json();

      if (!response.ok) {
        throw new Error(detailResponse.message || 'Failed to fetch document');
      }

      console.log(`[Document Detail] Fetched document: ${detailResponse.data.title}`);

      return detailResponse.data;
    } catch (error) {
      console.error('[Document Detail Error]:', error);
      throw error;
    }
  }

  /**
   * Delete Document - Xóa một document
   * @param documentId - ID của document
   */
  async deleteDocument(documentId: number): Promise<void> {
    try {
      const accessToken = await storageService.getAccessToken();

      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      console.log(`[Document Delete] Deleting document ${documentId}...`);

      const response = await fetch(`${API_URL}/api/documents/${documentId}?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const deleteResponse = await response.json();

      if (!response.ok) {
        throw new Error(deleteResponse.message || 'Failed to delete document');
      }

      console.log(`[Document Delete] Document deleted successfully`);
    } catch (error) {
      console.error('[Document Delete Error]:', error);
      throw error;
    }
  }

  /**
   * Toggle Favorite - Cập nhật trạng thái yêu thích
   * @param documentId - ID của document
   * @param isFavorite - Trạng thái yêu thích
   */
  async toggleFavorite(documentId: number, isFavorite: boolean): Promise<void> {
    try {
      const accessToken = await storageService.getAccessToken();

      if (!accessToken) {
        throw new Error('Unauthorized: No access token found');
      }

      console.log(`[Favorite Toggle] Updating document ${documentId} favorite status...`);

      const payload = {
        is_favorite: isFavorite,
      };

      const response = await fetch(`${API_URL}/api/documents/${documentId}/favorite?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const toggleResponse = await response.json();

      if (!response.ok) {
        throw new Error(toggleResponse.message || 'Failed to update favorite status');
      }

      console.log(`[Favorite Toggle] Updated successfully`);
    } catch (error) {
      console.error('[Favorite Toggle Error]:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
