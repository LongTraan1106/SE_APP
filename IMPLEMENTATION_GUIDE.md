# 📋 Implementation Guide: OCR + Summary Feature

## 🎯 Overview

Chức năng Summary cho phép người dùng:
1. Scan/Upload tài liệu PDF hoặc ảnh
2. Trích xuất text bằng OCR API
3. Tóm tắt nội dung bằng LLM API (Qwen2.5)
4. Hiển thị kết quả summary dưới dạng layout đẹp

---

## 📁 Files Created/Modified

### **1. New Files**

#### `services/documentService.ts`
Service xử lý tất cả OCR + Summary operations
- `processOCR(filePath, centerTolerance?)` - Upload file và trích xuất text
- `processSummary(textContent, llmEndpoint?, modelName?)` - Tóm tắt text
- `processOCRAndSummary(filePath)` - Flow hoàn chỉnh (OCR → Summary)

```typescript
// Cách sử dụng
const summaryData = await documentService.processOCRAndSummary(filePath);
// Returns: { pages, full_summary, processing_time, num_pages }
```

#### `screens/SummaryScreen.tsx`
Screen hiển thị kết quả summary
- Hiển thị từng trang tóm tắt
- Hiển thị thông tin xử lý (thời gian, số trang)
- Button Back, Flashcard, Save Document

### **2. Modified Files**

#### `screens/DocumentScanResultScreen.tsx`
- Import `documentService`
- Implement `handleSummarize()` với logic thực:
  - Xử lý cả PDF và multiple images
  - Gộp kết quả từ nhiều ảnh
  - Show loading state trong quá trình xử lý
  - Navigate tới SummaryScreen với kết quả

#### `navigation/RootNavigator.tsx`
- Import `SummaryScreen`
- Thêm Stack.Screen cho "Summary" route

---

## 🔄 Flow Diagram

```
DocumentScanResultScreen (user click "Summarize")
        ↓
handleSummarize() starts
        ↓
[PDF] → processOCRAndSummary(pdfPath)
        ↓
[Images] → Loop through each image:
           - processOCRAndSummary(imagePath)
           - Combine pages & summaries
        ↓
SummaryScreen
        ↓
Display results with:
  - Summary content
  - Processing time
  - Page count
```

---

## 🔌 API Endpoints Used

### **1. OCR API**
```
POST /api/ocr/process
Headers:
  - Authorization: Bearer {accessToken}

Query Params:
  - center_tolerance: 50 (default)

Form Data:
  - file: {PDF or Image file}

Response:
  {
    "success": true,
    "data": {
      "extracted_text": "...",
      "file_name": "...",
      "processing_time": "2.34s",
      "text_length": 1234
    }
  }
```

### **2. Summary API**
```
POST /api/summary/process
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {accessToken}

Body:
  {
    "text_content": "...",
    "llm_endpoint": "http://localhost:5001/v1/chat/completions" (optional),
    "model_name": "Qwen2.5/Qwen2.5-7B-Instruct/" (optional)
  }

Response:
  {
    "success": true,
    "data": {
      "pages": {
        "page_1": "summary content",
        "page_2": "summary content"
      },
      "full_summary": "combined summary",
      "processing_time": "5.67s",
      "num_pages": 2
    }
  }
```

---

## 🛠️ Implementation Details

### **DocumentService Methods**

#### `processOCR(filePath, centerTolerance?)`
```typescript
try {
  1. Lấy access token từ storage
  2. Xác định MIME type từ file extension
  3. Gửi file lên API OCR bằng RNFetchBlob multipart upload
  4. Parse response và return extracted_text
} catch (error) {
  Throw error với message chi tiết
}
```

#### `processSummary(textContent, llmEndpoint?, modelName?)`
```typescript
try {
  1. Validate text content không rỗng
  2. Gửi POST request tới API Summary
  3. Return summary data (pages + full_summary)
} catch (error) {
  Throw error
}
```

#### `processOCRAndSummary(filePath)`
```typescript
try {
  1. Call processOCR() → nhận extracted_text
  2. Call processSummary(extracted_text) → nhận summary data
  3. Return final summary data
} catch (error) {
  Throw error
}
```

### **DocumentScanResultScreen - handleSummarize()**

#### Logic Flow:
```javascript
1. Validate: có file không?

2. Show loading alert

3. Process files:
   - Nếu PDF: gửi 1 file PDF
   - Nếu Images: loop qua từng ảnh
     - Gọi processOCRAndSummary()
     - Gộp kết quả (rename page keys, combine summaries)
     - Handle error từng ảnh (skip + continue)

4. Compile final summary data:
   - pages: gộp từ tất cả ảnh
   - full_summary: gộp với separator
   - num_pages: đếm tổng pages
   - processing_time: cộng dồn

5. Navigate tới SummaryScreen với data
```

---

## 📱 UI Components

### **SummaryScreen Layout**

```
┌─────────────────────────────┐
│ ‹ BACK    SUMMARY           │  (Header)
├─────────────────────────────┤
│                             │
│  📄 PAGE_1                  │
│  [Summary content...]       │
│                             │
│  ───────────────────────    │
│                             │
│  📄 PAGE_2                  │  (Content Area)
│  [Summary content...]       │
│                             │
│  ┌──────────────────────┐   │
│  │ ⏱️  Thời gian: 5.67s │   │ (Info Box)
│  │ 📊 Số trang: 2      │   │
│  └──────────────────────┘   │
│                             │
├─────────────────────────────┤
│          🔖                 │  (Bookmark)
├─────────────────────────────┤
│  ‹ BACK      FLASHCARD ›    │  (Action Buttons)
├─────────────────────────────┤
│      💾 Save Document       │  (Secondary Action)
└─────────────────────────────┘
```

---

## 🚀 Key Features

### **1. Multiple Image Support**
- Xử lý từng ảnh riêng lẻ
- Gộp kết quả thành 1 summary
- Xử lý error từng ảnh mà không dừng flow

### **2. Loading State**
- Hiển thị loading alert trong quá trình xử lý
- User không thể click lại khi đang xử lý

### **3. Error Handling**
- Try-catch blocks ở mỗi step
- Hiển thị error message chi tiết
- Kiểm tra access token trước xử lý

### **4. File Path Handling**
- Support cả `file://` scheme và path thường
- Tự động strip `file://` prefix

---

## 🔐 Security & Token Management

- Tất cả API calls cần `access_token` từ `storageService`
- Token được gửi trong header: `Authorization: Bearer {token}`
- Nếu token không tồn tại, throw error "Unauthorized"

---

## 📊 Data Structure

### **SummaryData Object**
```typescript
{
  pages: {
    "page_1": "summary content...",
    "page_2": "summary content...",
    // Khi multiple images:
    "page_1_page_1": "...",
    "page_2_page_1": "...",
  },
  full_summary: "===== PAGE_1 ====\n...\n\n===== PAGE_2 ====\n...",
  processing_time: "8.91s",
  num_pages: 4
}
```

---

## ⚠️ Error Scenarios

| Scenario | Handling |
|----------|----------|
| No file selected | Alert: "Không có tài liệu nào để tóm tắt" |
| Network error | Alert: "Kiểm tra kết nối mạng" |
| OCR fails | Skip file + continue (multiple images) |
| LLM timeout | Show API error message |
| Invalid token | Show "Unauthorized" error |

---

## 🔧 Configuration

### **Backend URLs**
```typescript
const API_URL = 'https://api.mealsretrieval.site';

// OCR endpoint
POST ${API_URL}/api/ocr/process

// Summary endpoint
POST ${API_URL}/api/summary/process
```

### **LLM Defaults** (Qwen2.5)
```python
llm_endpoint = "http://localhost:5001/v1/chat/completions"
model_name = "Qwen2.5/Qwen2.5-7B-Instruct/"
```

---

## 📝 Usage Example

```typescript
// User clicks "Summarize" button
→ DocumentScanResultScreen: handleSummarize()
  ├─ Check file exists
  ├─ Show loading alert
  ├─ For each file:
  │   └─ documentService.processOCRAndSummary(filePath)
  │       ├─ OCR: Extract text
  │       └─ Summary: Summarize text
  ├─ Combine results
  └─ Navigate to SummaryScreen with data

// SummaryScreen receives and displays:
→ Page-by-page summaries
→ Processing metadata
→ Navigation options (Back, Flashcard, Save)
```

---

## 🎨 Styling

- **Color Scheme**: Green (#6B9071) theme
- **Font Sizes**:
  - Header: 18pt bold
  - Page title: 14pt bold
  - Content: 13pt normal
  - Info text: 12pt
- **Border Radius**: 10-12px consistent throughout

---

## ✅ Testing Checklist

- [ ] Single image summarization
- [ ] Multiple images summarization
- [ ] PDF summarization
- [ ] Network error handling
- [ ] Token expiration handling
- [ ] Loading state UI
- [ ] Page navigation in SummaryScreen
- [ ] Back button functionality
- [ ] Save document functionality
- [ ] Flashcard button functionality

---

## 🚫 Limitations & TODOs

1. **OCR Upload Size**: Backend có thể có giới hạn file size
2. **LLM Model**: Hiện dùng Qwen2.5, có thể đổi model
3. **Processing Time**: Tuỳ thuộc vào kích thước file và LLM response time
4. **Flashcard Integration**: Chưa implement logic lưu flashcard (to be done)
5. **Summary Customization**: Chưa support custom summary format/length

