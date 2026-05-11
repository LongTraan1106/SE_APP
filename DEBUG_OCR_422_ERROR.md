# 🔧 Debugging Guide: OCR 422 Error

## ❌ Error: "OCR processing failed" (422 Unprocessable Entity)

### 📋 What's Happening?
Backend returned HTTP 422, which means the request validation failed. This typically happens when:
- File format is invalid
- File extension doesn't match MIME type
- File data is corrupted
- API endpoint validation issue

---

## 🔍 Debugging Steps

### **Step 1: Check Backend is Running**
```bash
curl -X GET http://localhost:8000/health
```
Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-05-11T..."
}
```

### **Step 2: Test OCR Endpoint Directly**
```bash
# Create a real image/PDF file
# Then test the endpoint:

curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/test.jpg" \
  "http://localhost:8000/api/ocr/process?center_tolerance=50"
```

### **Step 3: Check Frontend Logs**
When `handleSummarize()` is called, check console for:
```
[OCR] Uploading file: {filename}
[OCR] File path: {filepath}
[OCR] MIME type: {mime_type}
[OCR] File exists: true
[OCR] File read successfully, size: {bytes}
[OCR] Response received
[OCR] Response data length: {length}
```

### **Step 4: Verify Request Data**

The `documentService.ts` now logs:
- ✅ Filename (with proper extension)
- ✅ File path
- ✅ MIME type
- ✅ File existence
- ✅ File size (in bytes)

**If any of these is wrong, that's the issue:**

| Issue | Solution |
|-------|----------|
| File not found | Check file path returned from camera/document scanner |
| MIME type incorrect | Check extension: jpg/jpeg→image/jpeg, png→image/png, pdf→application/pdf |
| Filename missing extension | Code now auto-adds extension if missing |
| File size 0 | File read failed - check permissions |

---

## 🛠️ Common Issues & Solutions

### **Issue: "File not found at path: /path/to/file"**
```typescript
// Cause: File was deleted before upload
// Solution: Ensure file still exists when handleSummarize() is called
```

### **Issue: Response data starts with HTML**
```typescript
// This means backend sent an error page, not JSON
// Check if:
// - URL is correct (https://api.mealsretrieval.site)
// - Network is reachable
// - CORS is enabled
```

### **Issue: File extension missing**
```typescript
// The new code auto-adds extension:
// "document" + "image/jpeg" = "document.jpg"
```

---

## 📊 Testing Checklist

- [ ] Backend OCR endpoint is reachable
- [ ] File exists on device before upload
- [ ] File has valid extension (.jpg, .png, .pdf)
- [ ] Access token is valid (non-expired)
- [ ] Network connectivity is stable
- [ ] File size is reasonable (<100MB recommended)
- [ ] Check console logs for "File read successfully" message

---

## 🔧 If Still Failing

### Check Response Format
In `documentService.ts`, the service now catches JSON parse errors:
```
[OCR] Failed to parse response: [response content shown]
```

If you see this error, it means backend sent non-JSON response. Print full response:

```typescript
// Add to catch block in processOCR():
console.log('[OCR] Full response body:', response.data);
```

### Backend Validation Error
FastAPI returns 422 with detail:
```json
{
  "detail": [
    {
      "loc": ["body", "file"],
      "msg": "Field required",
      "type": "value_error.missing"
    }
  ]
}
```

If you see this, the `file` field wasn't recognized. Check:
- Form field name is exactly `file`
- MIME type is valid
- Data encoding is correct

---

## 🚀 Advanced Debugging

### Enable Full Network Logging (React Native)
In your app, add network logger:
```typescript
// In App.tsx or suitable place
XMLHttpRequest.prototype.open = ((open) => {
  return function(method, url, ...rest) {
    console.log(`[Network] ${method} ${url}`);
    return open.call(this, method, url, ...rest);
  };
})(XMLHttpRequest.prototype.open);
```

### Check RNFetchBlob File Reading
```typescript
// Test in console:
const path = '/path/to/file.jpg';
const exists = await RNFetchBlob.fs.exists(path);
console.log('File exists:', exists);

const content = await RNFetchBlob.fs.readFile(path, 'base64');
console.log('Read size:', content.length);
```

---

## 📝 When Reporting Issues

Include:
1. Console logs from `[OCR]` messages
2. Response data (first 500 chars)
3. File path being tested
4. Backend URL being used
5. Backend logs showing what it received

---

## ✅ Recent Fixes Applied

1. ✅ **Await file read**: Now properly awaits `RNFetchBlob.fs.readFile()`
2. ✅ **Auto-add extension**: Filename now always includes proper extension
3. ✅ **File validation**: Checks if file exists before upload
4. ✅ **Better error messages**: Detailed logs for debugging
5. ✅ **JSON parse handling**: Catches and logs invalid JSON responses

---

## 🔗 Related Issues

- **SummaryScreen component error**: Fixed - changed to named import
- **Token errors**: Ensure access token is valid and not expired
- **Network timeout**: May need to increase timeout if file is large

