// Test Integration Helper - Ensures proper matching between test cards and Firebase data
// This file helps debug and verify the test integration

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTXNdFPIkgRAMSN8FYvSgaiyQ0ylz-6Ko",
    authDomain: "coding-quiz-contest-platform.firebaseapp.com",
    projectId: "coding-quiz-contest-platform",
    storageBucket: "coding-quiz-contest-platform.firebasestorage.app",
    messagingSenderId: "823102752389",
    appId: "1:823102752389:web:4e3db47f8b6234ae1c8bec",
    measurementId: "G-3YHZX8QDB9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Test Integration Helper Class
class TestIntegrationHelper {
    constructor() {
        this.testData = new Map();
        this.problemIndex = new Map();
    }

    // Build problem index for fast lookup
    async buildProblemIndex() {
        console.log('🔍 Building problem index...');
        
        try {
            const snapshot = await db.collection('super_leet_problems_lakh').get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.testData.set(doc.id, data);
                
                // Create multiple search keys for fuzzy matching
                const problemName = data.problem_name || '';
                const searchKeys = this.generateSearchKeys(problemName);
                
                searchKeys.forEach(key => {
                    if (!this.problemIndex.has(key)) {
                        this.problemIndex.set(key, []);
                    }
                    this.problemIndex.get(key).push({
                        id: doc.id,
                        data: data,
                        score: this.calculateMatchScore(problemName, key)
                    });
                });
            });
            
            console.log(`✅ Indexed ${this.testData.size} tests with ${this.problemIndex.size} search keys`);
            return true;
        } catch (error) {
            console.error('❌ Failed to build problem index:', error);
            return false;
        }
    }

    // Generate search keys for a problem name
    generateSearchKeys(problemName) {
        const keys = new Set();
        const normalized = problemName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        const words = normalized.split(/\s+/).filter(w => w.length > 2);
        
        // Add full name
        keys.add(normalized.trim());
        
        // Add individual words
        words.forEach(word => {
            keys.add(word);
            
            // Add partial words (first 3+ chars)
            for (let i = 3; i <= word.length; i++) {
                keys.add(word.substring(0, i));
            }
        });
        
        // Add common variations
        const variations = {
            'sum': ['addition', 'total', 'add'],
            'search': ['find', 'locate', 'lookup'],
            'sort': ['order', 'arrange', 'organize'],
            'tree': ['binary', 'bst', 'node'],
            'string': ['text', 'character', 'substring'],
            'array': ['list', 'sequence', 'collection'],
            'graph': ['network', 'path', 'cycle'],
            'dynamic': ['dp', 'programming', 'memoization'],
            'binary': ['bit', 'two', 'dual'],
            'maximum': ['max', 'largest', 'greatest'],
            'minimum': ['min', 'smallest', 'least'],
            'subarray': ['sub array', 'subarr', 'sub'],
            'substring': ['sub string', 'substr'],
            'valid': ['correct', 'proper', 'right']
        };
        
        words.forEach(word => {
            if (variations[word]) {
                variations[word].forEach(v => keys.add(v));
            }
        });
        
        return Array.from(keys);
    }

    // Calculate match score for sorting
    calculateMatchScore(original, searchKey) {
        if (original.toLowerCase() === searchKey.toLowerCase()) return 100;
        if (original.toLowerCase().includes(searchKey.toLowerCase())) return 80;
        if (searchKey.toLowerCase().includes(original.toLowerCase())) return 60;
        return 40;
    }

    // Find test by problem name with improved matching
    async findTestByProblemName(problemName) {
        if (!problemName) {
            console.warn('⚠️ findTestByProblemName called with empty problemName');
            return null;
        }

        console.log(`🔍 Searching for: "${problemName}"`);
        
        // Try exact match first
        const exactKey = problemName.toLowerCase().trim();
        if (this.problemIndex.has(exactKey)) {
            const matches = this.problemIndex.get(exactKey);
            const bestMatch = matches.sort((a, b) => b.score - a.score)[0];
            console.log(`✅ Exact match found: ${bestMatch.data.problem_name}`);
            return bestMatch.data;
        }

        // Try fuzzy matching
        const searchKeys = this.generateSearchKeys(problemName);
        let bestMatch = null;
        let bestScore = 0;

        for (const key of searchKeys) {
            if (this.problemIndex.has(key)) {
                const matches = this.problemIndex.get(key);
                for (const match of matches) {
                    if (match.score > bestScore) {
                        bestScore = match.score;
                        bestMatch = match.data;
                    }
                }
            }
        }

        if (bestMatch && bestScore >= 60) {
            console.log(`✅ Fuzzy match found (${bestScore}%): ${bestMatch.problem_name}`);
            return bestMatch;
        }

        console.log(`❌ No match found for: "${problemName}"`);
        return null;
    }

    // Validate test data structure
    validateTestData(testData) {
        const required = ['problem_name', 'questions'];
        const missing = required.filter(field => !testData[field]);
        
        if (missing.length > 0) {
            console.error(`❌ Missing required fields: ${missing.join(', ')}`);
            return false;
        }

        if (!Array.isArray(testData.questions) || testData.questions.length === 0) {
            console.error('❌ Questions array is empty or invalid');
            return false;
        }

        // Validate question structure
        const validTypes = ['mcq', 'msq', 'nat', 'fill_blank', 'one_word', 'true_false', 'assertion_reason', 'matching'];
        
        for (let i = 0; i < testData.questions.length; i++) {
            const q = testData.questions[i];
            
            if (!q.type || !validTypes.includes(q.type)) {
                console.error(`❌ Question ${i + 1}: Invalid type "${q.type}"`);
                return false;
            }
            
            if (!q.question || typeof q.question !== 'string') {
                console.error(`❌ Question ${i + 1}: Invalid question text`);
                return false;
            }
            
            // Type-specific validation
            switch (q.type) {
                case 'mcq':
                case 'msq':
                    if (!Array.isArray(q.options) || q.options.length === 0) {
                        console.error(`❌ Question ${i + 1}: Missing options for ${q.type}`);
                        return false;
                    }
                    break;
                case 'true_false':
                    if (typeof q.correct_answer !== 'boolean') {
                        console.error(`❌ Question ${i + 1}: Invalid correct_answer for true_false`);
                        return false;
                    }
                    break;
                case 'nat':
                    if (typeof q.correct_answer !== 'number') {
                        console.error(`❌ Question ${i + 1}: Invalid correct_answer for NAT`);
                        return false;
                    }
                    break;
            }
        }

        console.log('✅ Test data structure validation passed');
        return true;
    }

    // Get test statistics
    getTestStatistics() {
        const stats = {
            totalTests: this.testData.size,
            questionTypes: {},
            averageQuestions: 0
        };

        let totalQuestions = 0;
        
        this.testData.forEach(test => {
            if (test.questions && Array.isArray(test.questions)) {
                totalQuestions += test.questions.length;
                
                test.questions.forEach(q => {
                    if (q.type) {
                        stats.questionTypes[q.type] = (stats.questionTypes[q.type] || 0) + 1;
                    }
                });
            }
        });

        stats.averageQuestions = this.testData.size > 0 ? Math.round(totalQuestions / this.testData.size) : 0;
        
        return stats;
    }

    // Debug specific problem
    async debugProblem(problemName) {
        console.log(`🐛 Debugging problem: "${problemName}"`);
        
        const test = await this.findTestByProblemName(problemName);
        if (!test) {
            console.log('❌ Test not found');
            return;
        }

        console.log('📋 Test Details:');
        console.log(`  ID: ${test.id || 'Unknown'}`);
        console.log(`  Name: ${test.problem_name}`);
        console.log(`  Questions: ${test.questions ? test.questions.length : 0}`);
        
        if (test.questions) {
            const typeCount = {};
            test.questions.forEach(q => {
                typeCount[q.type] = (typeCount[q.type] || 0) + 1;
            });
            console.log('  Question Types:', typeCount);
        }

        const isValid = this.validateTestData(test);
        console.log(`  Valid: ${isValid ? '✅' : '❌'}`);
    }
}

// Create global instance
window.testIntegrationHelper = new TestIntegrationHelper();

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Test Integration Helper...');
    const success = await window.testIntegrationHelper.buildProblemIndex();
    
    if (success) {
        console.log('🎉 Test Integration Helper ready!');
        
        // Make debug function available globally
        window.debugTestProblem = (problemName) => {
            return window.testIntegrationHelper.debugProblem(problemName);
        };
        
        window.getTestStats = () => {
            return window.testIntegrationHelper.getTestStatistics();
        };
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestIntegrationHelper;
}
