# Demo Test Integration Instructions

## 🎯 Overview
The demo test with 25 custom questions has been integrated into your quiz system. The first LeetCode test card will now include custom questions about "Valid Subarrays With Exactly One Peak".

## 📋 What's Been Done

### 1. Demo Questions Created
- **File**: `/demo-test-questions.json`
- **Questions**: 25 objective questions
- **Topic**: Array manipulation and peak finding algorithms
- **Companies**: Google, Microsoft, Bloomberg focus
- **Duration**: 50 minutes, 50 marks total

### 2. Test Card Generator Updated
- **Feature**: First test card (index 1) includes demo questions
- **Indicator**: Demo tests marked with `isDemo: true`
- **Theme**: Custom themes applied to demo test

### 3. Quiz Interface Updated
- **Modified**: `/testseries/series.js`
- **Feature**: Demo questions loaded instead of Firebase questions
- **UI**: Demo tests show 🎯 indicator
- **Toast**: Special message for demo test loading

## 🚀 How to Upload & Test

### ⚠️ IMPORTANT: Upload First!
You **must** upload the test cards to Firebase **before** trying to start a test.

### Step 1: Upload the Demo Test
1. Upload the demo test card using your admin/data seeding workflow
2. Verify in Firestore that the demo test card exists

### Step 2: Refresh the Test Page
1. Go to `/testseries/series.html?series=leetcode`
2. **Refresh the page** (Ctrl+R or Cmd+R)
3. Wait for cards to load from Firebase
4. Check browser console for: `Loaded X test cards from Firebase`

### Step 3: Test the Quiz
1. Find the first test card (should show 🎯 indicator)
2. Click "🚀 Start" to begin the demo test
3. Verify all 25 questions load correctly
4. Test start/step/stop functionality

## 🎮 Features to Test

### Start Button
- Opens quiz with demo questions
- Shows "🎯 Loading Demo Test with custom questions..." toast

### Step Button  
- Opens quiz in step-by-step mode
- Navigate through questions one by one

### Stop Button
- Stops current quiz session
- Saves progress properly

### Theme System
- Test different themes (Game, Neon, RGB, etc.)
- Verify colors apply correctly to demo test

## 🐛 Troubleshooting

### If Demo Questions Don't Load
1. Check browser console for errors
2. Verify `/demo-test-questions.json` is accessible
3. Ensure Firebase upload completed successfully

### If Upload Fails
1. Use "⏭️ Step Mode" for slower upload
2. Check Firebase quota limits
3. Verify network connection

### If Quiz Doesn't Start
1. Check if test card uploaded to Firebase
2. Verify test card shows 🎯 indicator
3. Check browser console for errors

## 📊 Expected Results

### Successful Upload
- Log shows: `✨ Demo test uploaded with 25 custom questions!`
- First test card has 🎯 indicator
- Test card includes `isDemo: true` and `demoQuestions` fields

### Successful Quiz
- Toast shows: "🎯 Loading Demo Test with custom questions..."
- All 25 questions load with proper formatting
- Timer shows 50 minutes
- Start/step/stop buttons work correctly

## 🎨 Customization Options

### Change Demo Questions
1. Edit `/demo-test-questions.json`
2. Re-upload test cards
3. Test with new questions

### Apply Different Themes
1. Open the in-app settings panel
2. Select theme preset / accent

### Modify Test Settings
1. Change duration, marks, etc. in demo file
2. Update generator settings if needed
3. Re-upload and test

## 📝 Notes

- Only the **first** test card includes demo questions
- Other test cards use normal Firebase questions
- Demo questions are embedded in the test card data
- No additional Firebase setup required

---

**Ready to test!** 🚀 Upload the demo and enjoy the custom quiz experience!
