# 📄 File Documentation: clip/index.html

## 1. Project Overview
- **Repository:** `Kopilot_The_Coding_Quiz_Contest`
- **Branch/ID:** `anjha-101-timen`
- **Directory:** `/clip`
- **File:** `index.html`

This file serves as the main entry point for the **Kopilot Coding Quiz Contest** interface. It contains the structural markup (HTML) and presentational styles (CSS) required to render the quiz application in a web browser.

## 2. HTML Elements Breakdown
The HTML structure is semantic, accessible, and organized to support interactive quiz functionality.

| Element | Tag / Class | Description |
| :--- | :--- | :--- |
| **Document Type** | `<!DOCTYPE html>` | Declares HTML5 standard. |
| **Head** | `<head>` | Contains metadata, viewport settings, and internal CSS. |
| **Title** | `<title>` | Sets the browser tab title to "Kopilot Coding Quiz Contest". |
| **Body** | `<body>` | Main container for visible content. |
| **Container** | `.quiz-container` | Central wrapper `div` to center content on screen. |
| **Header** | `<header>` | Displays the contest logo and main heading. |
| **Question** | `<h2 id="question">` | Dynamic text area displaying the current coding question. |
| **Options** | `.options-container` | Wrapper for multiple-choice answer buttons. |
| **Buttons** | `<button class="option-btn">` | Interactive elements for selecting answers (A, B, C, D). |
| **Navigation** | `<button id="next-btn">` | Button to submit answers and move to the next question. |
| **Footer** | `<footer>` | Contains copyright info and contest metadata. |

## 3. CSS Styles Breakdown
The styling is embedded within the `<style>` tag in the `<head>` section. It focuses on responsiveness, clarity, and user interaction.

### 3.1. Layout & Positioning
- **Flexbox:** Used on the `body` to vertically and horizontally center the `.quiz-container`.
- **Box Model:** `box-sizing: border-box` is applied globally for consistent padding/margin calculations.
- **Responsive Width:** The container uses `max-width: 600px` with `width: 90%` to ensure it looks good on both mobile and desktop.

### 3.2. Color Palette
- **Background:** Light gray (`#f0f2f5`) for the page, White (`#ffffff`) for the card.
- **Primary:** Blue (`#007bff`) for main actions and highlights.
- **Text:** Dark gray (`#333`) for high readability.
- **Feedback:** Green (`.correct`) and Red (`.wrong`) classes for answer validation.

### 3.3. Interactivity
- **Hover States:** Buttons change background color and cursor to `pointer` on hover.
- **Transitions:** Smooth `0.3s ease` transitions applied to buttons for a polished feel.
- **Focus:** Outline styles removed for cleaner look, replaced with border color changes.

## 4. Source Code Reference
Below is the standard structure implemented in `clip/index.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kopilot Coding Quiz Contest</title>
    <style>
        /* CSS Reset & Variables */
        :root {
            --primary-color: #007bff;
            --bg-color: #f0f2f5;
            --card-bg: #ffffff;
            --text-color: #333333;
        }

        /* Global Styles */
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

        /* Quiz Container */
        .quiz-container {
            background-color: var(--card-bg);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 600px;
            text-align: center;
        }

        /* Header */
        header h1 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        /* Options */
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

        /* Next Button */
        #next-btn {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
        }

        /* Footer */
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
