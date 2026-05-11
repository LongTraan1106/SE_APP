# 🔧 Empty Text Content Error Handling

## 📌 Overview

Khi OCR trích xuất text từ file nhưng kết quả rỗng (tài liệu quá mờ, không có nội dung), app giờ đây sẽ:
1. **Detect** lỗi "Text content cannot be empty"
2. **Hiển thị** thông báo rõ ràng cho user
3. **Cung cấp** options để rescan hoặc tiếp tục

---

## 🎯 Improvements Made

### **1. Single Image/PDF - Empty Content Handling**
```typescript
// Before:
// ❌ Generic error: "Text content cannot be empty"

// After:
// ✅ Specific alert:
// Title: "⚠️ Tài liệu không rõ ràng"
// Message: "Không thể trích xuất nội dung từ tài liệu"
// Options:
//   - [Quét lại] → rescan
//   - [Hủy] → cancel
```

### **2. Multiple Images - Partial Success Handling**
```
Processing 3 images:
├─ Image 1: ✅ Success
├─ Image 2: ⚠️ Empty content (skipped)
└─ Image 3: ✅ Success

Result:
├─ Count: 2/3 succeeded
├─ Metadata: "✅ Thành công: 2 ảnh, ⚠️ Quá mờ/Trống: 1 ảnh"
└─ Show Warning: "2/3 ảnh được xử lý thành công"
   Options:
   - [Xem Kết Quả] → navigate to SummaryScreen
   - [Quét Lại] → rescan
```

### **3. All Images Failed - Full Error Handling**
```
Processing 2 images:
├─ Image 1: ❌ Empty content
└─ Image 2: ❌ Empty content

Result:
└─ Show Alert: "Không thể trích xuất nội dung từ bất kỳ ảnh nào"
   Options:
   - [Quét lại] → rescan
   - [Hủy] → cancel
```

---

## 📝 Error Detection Logic

### **Empty Content Detection**
```typescript
if (errorMsg.includes('Text content cannot be empty') || 
    errorMsg.includes('empty')) {
  // Treat as empty content error
  emptyContentCount++;
}
```

### **Error Categories**
| Type | Count | Result |
|------|-------|--------|
| Success | > 0 | Proceed or show partial warning |
| Empty content | Track separately | Show as ⚠️ in result |
| Other errors | Track separately | Show as ❌ in result |
| All failed | successCount = 0 | Throw error, show rescan option |

---

## 🎨 UI/UX Changes

### **Alert Variations**

#### 1️⃣ **Empty Content Alert (Single image/PDF)**
```
Title: ⚠️ Tài liệu không rõ ràng
Message:
  🔍 Không thể trích xuất nội dung từ tài liệu.
  
  Tài liệu có thể quá mờ, không có nội dung, 
  hoặc định dạng không hỗ trợ.
  
  Vui lòng:
  • Quét lại tài liệu với chất lượng tốt hơn
  • Đảm bảo tài liệu có nội dung rõ ràng

Buttons: [Quét lại] [Hủy]
```

#### 2️⃣ **Partial Success Alert (Multiple images)**
```
Title: ⚠️ Xử lý Không Hoàn Toàn
Message:
  Chỉ 2/3 ảnh được xử lý thành công.
  
  1 ảnh không thể trích xuất nội dung 
  (quá mờ hoặc không có nội dung).
  
  Bạn có thể:
  • Xem kết quả hiện tại
  • Quét lại để cải thiện chất lượng

Buttons: [Xem Kết Quả] [Quét Lại]
```

#### 3️⃣ **All Failed Alert**
```
Title: ❌ Lỗi Xử Lý
Message:
  Không thể trích xuất nội dung từ bất kỳ ảnh nào.
  Vui lòng quét lại với chất lượng tốt hơn.

Buttons: [Quét lại] [Hủy]
```

#### 4️⃣ **Generic Error Alert**
```
Title: ❌ Lỗi Xử Lý
Message:
  [Error message]
  
  Vui lòng:
  • Kiểm tra kết nối mạng
  • Thử lại quá trình
  • Quét lại tài liệu nếu vấn đề vẫn tiếp diễn

Buttons: [Quét lại] [Hủy]
```

---

## 📊 Summary Result Metadata

Khi có lỗi partial, kết quả summary sẽ include metadata:

```
--- ẢNH 1 ---
[Summary content...]

--- ẢNH 2 ---
❌ Ảnh này không thể trích xuất nội dung (quá mờ hoặc không có nội dung)

--- ẢNH 3 ---
[Summary content...]

📊 Kết quả xử lý:
✅ Thành công: 2 ảnh
⚠️ Quá mờ/Trống: 1 ảnh
```

---

## 🔄 Flow Diagram

```
User clicks "Summarize"
    ↓
Show loading alert
    ↓
[PDF] → processOCRAndSummary()
        ↓
        Success? ✅ → Navigate to Summary
        Empty?   ⚠️  → Throw "empty" error
        Error?   ❌  → Rethrow with context

[Multiple Images] → Loop through each:
                    ├─ Success ✅ → Add to results
                    ├─ Empty ⚠️  → Count & skip
                    └─ Error ❌  → Count & skip
                    ↓
                    All failed? → Show "Rescan" alert
                    Partial? → Show "Partial" warning
                    All succeeded? → Navigate directly
```

---

## 💾 Implementation Details

### **Key Variables Tracked**
```typescript
let successCount = 0;      // Images processed successfully
let emptyContentCount = 0; // Images with empty content
let errorCount = 0;        // Images with other errors
```

### **Metadata Building**
```typescript
let metadataMsg = '\n\n📊 Kết quả xử lý:\n';
if (successCount > 0) metadataMsg += `✅ Thành công: ${successCount} ảnh\n`;
if (emptyContentCount > 0) metadataMsg += `⚠️ Quá mờ/Trống: ${emptyContentCount} ảnh\n`;
if (errorCount > 0) metadataMsg += `❌ Lỗi khác: ${errorCount} ảnh\n`;
```

---

## ✅ Test Cases

### **Test 1: Single Image - Empty Content**
```
Setup: Scan blurry image with no readable text
Expected:
  ✅ Show "⚠️ Tài liệu không rõ ràng" alert
  ✅ [Quét lại] button works
  ✅ [Hủy] button works
```

### **Test 2: Multiple Images - One Empty**
```
Setup: Scan 3 images, 1 is blurry (empty content)
Expected:
  ✅ Count: 2 succeeded, 1 empty
  ✅ Show "⚠️ Xử lý Không Hoàn Toàn" warning
  ✅ Metadata shows: "✅ Thành công: 2 ảnh, ⚠️ Quá mờ/Trống: 1 ảnh"
  ✅ Can still view partial results
```

### **Test 3: Multiple Images - All Empty**
```
Setup: Scan 3 blurry images (all empty)
Expected:
  ✅ Show error: "Không thể trích xuất nội dung từ bất kỳ ảnh nào"
  ✅ [Quét lại] button works
  ✅ Cannot navigate to Summary
```

### **Test 4: PDF - Empty Content**
```
Setup: PDF with no readable text
Expected:
  ✅ Show "⚠️ Tài liệu không rõ ràng" alert
  ✅ Message mentions PDF
  ✅ Rescan option available
```

---

## 🚀 User Experience Flow

### **Scenario: User scans blurry document**
```
1. User clicks "Summarize"
2. Show loading alert
3. OCR extracts: "" (empty)
4. processSummary() throws: "Text content cannot be empty"
5. catch block detects "empty"
6. Show alert: "⚠️ Tài liệu không rõ ràng"
7. User clicks [Quét lại]
8. handleRescan() opens camera
9. User scans again with better quality
10. ✅ Success
```

### **Scenario: User scans 3 images, 1 is blurry**
```
1. User clicks "Summarize"
2. Loop: Image 1 ✅ Image 2 ⚠️ Image 3 ✅
3. Show warning: "2/3 ảnh được xử lý"
4. User chooses:
   - [Xem Kết Quả] → See partial summary
   - [Quét Lại] → Rescan
```

---

## 📋 Code Changes Summary

### **DocumentScanResultScreen.tsx**

1. **PDF Error Handling** - Added try-catch for PDF processing
2. **Multiple Images Loop** - Added success/empty/error counters
3. **Empty Content Detection** - Check if error message contains "empty"
4. **All Failed Check** - Throw error if all images failed
5. **Partial Success Warning** - Show alert if some images failed
6. **Catch Block** - Enhanced with specific empty content handling
7. **Rescan Option** - All error alerts now have "Quét lại" button

---

## 🎯 Benefits

✅ **Better UX**: Users know exactly what went wrong  
✅ **Clear Actions**: Show what to do (rescan, rescan quality, etc.)  
✅ **Partial Results**: Don't lose progress - can still view partial summaries  
✅ **Error Context**: Different messages for different error types  
✅ **Metadata Tracking**: Users see what succeeded/failed in results  

