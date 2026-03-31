# Firebase Database Structure for LeetCode Tests

## 📊 **Database Collections Overview**

### 1. **`leet_test_batches`** Collection
Stores metadata for each batch of uploaded tests.

**Document Structure:**
```
leet_test_batches/
├── batch_1/
│   ├── batch_number: 1
│   ├── total_problems: 500
│   ├── questions_per_test: 25
│   ├── total_questions: 12500
│   ├── question_types: ["mcq", "true_false", "msq", "fill_blank", "assertion_reason", "nat", "one_word", "matching"]
│   ├── uploaded_at: "2026-03-22T09:14:00.000Z"
│   └── status: "uploaded"
├── batch_2/
│   └── (same structure as batch_1)
└── batch_8/
    └── (same structure, but total_problems: 374)
```

---

### 2. **`leet_tests`** Collection ⭐ **MAIN QUESTION STORAGE**
This is where all individual test questions are stored.

**Document Structure:**
```
leet_tests/
├── 1_1/                    // Format: {batch_number}_{problem_id}
│   ├── problem_id: 1
│   ├── problem_name: "Valid Subarrays With Exactly One Peak"
│   ├── batch_number: 1
│   ├── chunk_index: 0
│   ├── created_at: "2026-03-22T09:14:00.000Z"
│   ├── search_terms: ["valid", "subarray", "peak", "subarr", "suba", "sub", "vali", "valid", "vali"...]
│   └── questions: [
│       ├── {
│       │   ├── id: 1
│       │   ├── type: "mcq"
│       │   ├── question: "What is the defining characteristic of a 'peak' element in an array?"
│       │   ├── options: ["An element greater than all its neighbors", "An element equal to its neighbors", ...]
│       │   ├── correct_answer: 0
│       │   └── explanation: "A peak element is defined as an element that is strictly greater than its immediate neighbors."
│       ├── },
│       ├── {
│       │   ├── id: 2
│       │   ├── type: "true_false"
│       │   ├── question: "In a valid subarray with exactly one peak, the peak can be at any position within the subarray."
│       │   ├── correct_answer: true
│       │   └── explanation: "The peak can be at any position except the boundaries of the subarray..."
│       ├── },
│       ├── ... (23 more questions)
│   ]
├── 1_2/                    // Problem ID 2 from Batch 1
│   ├── problem_id: 2
│   ├── problem_name: "Reverse K Subarrays"
│   └── questions: [...]    // 25 questions for this problem
└── 8_374/                  // Last problem from Batch 8
    ├── problem_id: 374
    ├── problem_name: "Two Sum"
    └── questions: [...]
```

---

### 3. **`leet_test_sessions`** Collection
Stores active and completed test sessions for users.

**Document Structure:**
```
leet_test_sessions/
├── leet_1_12345_1711105800000/    // Format: leet_{test_id}_{user_id}_{timestamp}
│   ├── test_id: "1_1"
│   ├── user_id: "device12345"
│   ├── session_id: "leet_1_12345_1711105800000"
│   ├── started_at: "2026-03-22T10:30:00.000Z"
│   ├── status: "completed"         // or "active"
│   ├── current_question: 25
│   ├── time_spent: 1800000         // milliseconds
│   ├── updated_at: "2026-03-22T11:00:00.000Z"
│   ├── completed_at: "2026-03-22T11:00:00.000Z"
│   ├── answers: {
│       │   ├── "1": {
│       │   │   ├── answer: 0
│       │   │   ├── time_spent: 30000
│       │   │   └── answered_at: "2026-03-22T10:30:30.000Z"
│       │   ├── "2": {
│       │   │   ├── answer: true
│       │   │   ├── time_spent: 15000
│       │   │   └── answered_at: "2026-03-22T10:30:45.000Z"
│       │   └── ... (23 more answers)
│   ├── }
│   └── results: {
│       │   ├── total_questions: 25
│       │   ├── correct_answers: 20
│       │   ├── incorrect_answers: 3
│       │   ├── skipped: 2
│       │   ├── score: 80
│       │   ├── time_spent: 1800000
│       │   └── question_breakdown: [
│       │   │   ├── {
│       │   │   │   ├── question_id: 1
│       │   │   │   ├── type: "mcq"
│       │   │   │   ├── correct: true
│       │   │   │   ├── user_answer: 0
│       │   │   │   ├── correct_answer: 0
│       │   │   │   └── time_spent: 30000
│       │   │   └── ... (24 more breakdowns)
│       │   └── ]
│   }
```

---

### 4. **`test_locks`** Collection
Stores lock/unlock credentials for tests.

**Document Structure:**
```
test_locks/
├── leet-problem-1/
│   ├── isLocked: false
│   ├── username: "anjha"
│   ├── password: "320"
│   ├── code: "Kopilot_230"
│   ├── createdAt: "2026-03-22T09:00:00.000Z"
│   └── updatedAt: "2026-03-22T09:00:00.000Z"
├── leet-problem-2/
│   └── (same structure)
└── ...
```

---

### 5. **`user_bookmarks`** Collection
Stores user's bookmarked tests.

**Document Structure:**
```
user_bookmarks/
├── device12345/
│   ├── bookmarkedTests: ["leet-problem-1", "leet-problem-5", "leet-problem-10"]
│   ├── updated_at: "2026-03-22T10:00:00.000Z"
│   └── created_at: "2026-03-22T09:00:00.000Z"
└── device67890/
    └── (same structure for different user)
```

---

## 🔍 **How Questions Are Retrieved**

### 1. **By Problem Name Matching**
```javascript
// In leet_test_integration.js
async function findTestByProblemName(problemName) {
  // 1. Try exact match first
  const exactMatch = await searchExactMatch(problemName);
  
  // 2. Try fuzzy matching using search_terms
  const fuzzyMatch = await searchFuzzyMatch(problemName);
  
  return exactMatch || fuzzyMatch;
}
```

### 2. **By Test ID**
```javascript
// Direct lookup by document ID
const testDoc = await getDoc(doc(db, "leet_tests", "1_1"));
```

### 3. **Search Terms for Fuzzy Matching**
Each test document includes `search_terms` array for efficient fuzzy matching:
- Individual words from problem name
- Partial matches (first 3+ characters)
- Common variations (sum→addition, search→find, etc.)

---

## 📊 **Database Size Estimates**

### **Total Storage:**
- **Documents**: 3,874 test documents + 8 batch documents + session documents
- **Questions**: 96,850 total questions (25 per test)
- **Estimated Size**: ~50-100MB depending on question length

### **Per Test Document:**
- **Size**: ~10-15KB per test (25 questions with explanations)
- **Fields**: 6 main fields (problem_id, problem_name, questions, etc.)
- **Questions Array**: 25 objects with 5-6 fields each

---

## 🚀 **Upload Process**

### **Chunked Upload Strategy:**
```javascript
// Upload in chunks of 50 tests to avoid timeouts
const CHUNK_SIZE = 50;
const BATCH_DELAY = 2000; // 2 seconds between chunks

for (let i = 0; i < tests.length; i += CHUNK_SIZE) {
  const chunk = tests.slice(i, i + CHUNK_SIZE);
  await uploadChunk(batchNumber, i, chunk);
  await delay(BATCH_DELAY); // Rate limiting
}
```

---

## 🔐 **Security Rules Needed**

```javascript
// Firebase Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // LeetCode tests - readable by all, writable by admin
    match /leet_tests/{testId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Test sessions - user can read/write their own sessions
    match /leet_test_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.token.device_id;
    }
    
    // User bookmarks - user can manage their own bookmarks
    match /user_bookmarks/{userId} {
      allow read, write: if request.auth != null && 
        userId == request.auth.token.device_id;
    }
  }
}
```

---

## 📱 **Access Patterns**

### **Most Common Queries:**
1. **Get test by problem name** → `leet_tests` collection with search_terms
2. **Get test by ID** → Direct document lookup in `leet_tests`
3. **Save session** → Create/update in `leet_test_sessions`
4. **Get user sessions** → Query `leet_test_sessions` by user_id
5. **Check lock status** → Lookup in `test_locks`

### **Index Requirements:**
```javascript
// Recommended Firestore indexes
leet_tests → [search_terms (array), batch_number]
leet_test_sessions → [user_id, status, completed_at]
user_bookmarks → [device_id]
test_locks → [test_id]
```

---

## 🎯 **Summary**

**Main Question Storage**: `leet_tests` collection
- **3,874 documents** (one per LeetCode problem)
- **96,850 questions** total (25 per problem)
- **8 question types** with varied distributions
- **Smart search terms** for fuzzy matching
- **Chunked upload** for reliability

All questions are stored in the `leet_tests` collection, with each document containing 25 questions for a specific LeetCode problem.
