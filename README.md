# 🚀 Kopilot Coding Quiz Contest - Documentation

## 📂 Repository Information
- **Repository:** `Kopilot_The_Coding_Quiz_Contest`
- **Branch/ID:** `anjha-101-timen`
- **Target File:** `clip/index.html`

---

## 🔗 Quick Access
Click the link below to open the quiz interface file directly:

### **[👉 Open Quiz Interface (clip/index.html)](clip/index.html)**

> **Note:** If you are viewing this on GitHub, clicking the link above will show the source code. To play the quiz interactively, please download the file or enable **GitHub Pages** for this repository.

---

## 1. Overview
This documentation covers the `index.html` file located in the `clip` folder. It serves as the main entry point for the **Kopilot Coding Quiz Contest**, providing a responsive user interface for participants to answer coding questions.

## 2. HTML Elements Breakdown
The HTML structure is semantic and organized for accessibility.

| Element | Tag / Class | Purpose |
| :--- | :--- | :--- |
| **Document Root** | `<!DOCTYPE html>` | Defines HTML5 standard. |
| **Head** | `<head>` | Contains metadata, viewport settings, and internal CSS. |
| **Main Container** | `.quiz-container` | Central wrapper `div` that centers content on the screen. |
| **Header** | `<header>` | Displays the contest title and branding. |
| **Question Area** | `<h2 id="question">` | Displays the current coding problem text. |
| **Options Grid** | `.options-container` | Holds the multiple-choice answer buttons. |
| **Answer Buttons** | `<button class="option-btn">` | Interactive buttons for selecting answers (A, B, C, D). |
| **Navigation** | `<button id="next-btn">` | Button to submit answers and proceed to the next question. |
| **Footer** | `<footer>` | Contains copyright information and contest metadata. |

## 3. CSS Styles Breakdown
The styling is embedded within the `<style>` tag in the `<head>` section.

### 3.1. Layout & Positioning
- **Flexbox:** Used on the `body` to vertically and horizontally center the `.quiz-container`.
- **Responsive Width:** The container uses `max-width: 600px` with `width: 90%` to ensure compatibility across mobile and desktop devices.
- **Box Model:** `box-sizing: border-box` is applied globally for consistent padding calculations.

### 3.2. Color Palette
- **Background:** Light gray (`#f0f2f5`) for the page body.
- **Card Background:** White (`#ffffff`) for the main quiz container.
- **Primary Action:** Blue (`#007bff`) for buttons and highlights.
- **Text:** Dark gray (`#333`) for optimal readability.

### 3.3. Interactivity
- **Hover Effects:** Buttons change background color and cursor to `pointer` on hover.
- **Transitions:** Smooth `0.3s ease` transitions applied to interactive elements.
- **Feedback:** Classes for `.correct` (green) and `.wrong` (red) are defined for answer validation.

## 4. Source Code Reference
Below is the complete code structure found in `clip/index.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kopilot Coding Quiz Contest</title>
    <style>
        :root {
            --primary-color: #007bff;
            --bg-color: #f0f2f5;
            --card-bg: #ffffff;
            --text-color: #333333;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: var(--text-color);
        }

        .quiz-container {
            background-color: var(--card-bg);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 600px;
            text-align: center;
        }

        header h1 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .options-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 20px 0;
        }

        .option-btn {
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .option-btn:hover {
            border-color: var(--primary-color);
            background-color: #f0f8ff;
        }

        #next-btn {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
        }

        footer {
            margin-top: 20px;
            font-size: 0.8rem;
            color: #777;
        }
    </style>
</head>
<body>

    <div class="quiz-container">
        <header>
            <h1>Kopilot Coding Quiz</h1>
            <p>Contest ID: anjha-101-timen</p>
        </header>

        <main>
            <h2 id="question">Question loads here...</h2>
            
            <div class="options-container">
                <button class="option-btn">Option A</button>
                <button class="option-btn">Option B</button>
                <button class="option-btn">Option C</button>
                <button class="option-btn">Option D</button>
            </div>

            <button id="next-btn">Next Question</button>
        </main>

        <footer>
            &copy; 2023 Kopilot The Coding Quiz Contest.
        </footer>
    </div>

</body>
</html>
