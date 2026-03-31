// LeetCode Test Integration System
// Handles fetching, matching, and managing LeetCode tests with test cards

import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkZ7l2tS9X8Y7w3v4x5y6z7a8b9c0d1e2",
  authDomain: "kopilot-test.firebaseapp.com",
  projectId: "kopilot-test",
  storageBucket: "kopilot-test.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class LeetCodeTestIntegration {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Search for test by problem name with fuzzy matching
  async findTestByProblemName(problemName) {
    // Add null check
    if (!problemName) {
      console.warn('findTestByProblemName called with null or empty problemName');
      return null;
    }
    
    const cacheKey = `search_${problemName.toLowerCase()}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Try exact match first
      const exactMatch = await this.searchExactMatch(problemName);
      if (exactMatch) {
        this.cache.set(cacheKey, { data: exactMatch, timestamp: Date.now() });
        return exactMatch;
      }

      // Try fuzzy matching
      const fuzzyMatch = await this.searchFuzzyMatch(problemName);
      if (fuzzyMatch) {
        this.cache.set(cacheKey, { data: fuzzyMatch, timestamp: Date.now() });
        return fuzzyMatch;
      }

      return null;
    } catch (error) {
      console.error('Error searching for test:', error);
      return null;
    }
  }

  async searchExactMatch(problemName) {
    const q = query(
      collection(db, "leet_tests"),
      where("problem_name", "==", problemName),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  async searchFuzzyMatch(problemName) {
    const searchTerms = this.generateSearchTerms(problemName);
    
    // Search using different terms
    for (const term of searchTerms) {
      const q = query(
        collection(db, "leet_tests"),
        where("search_terms", "array-contains", term),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Find best match among results
      let bestMatch = null;
      let bestScore = 0;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const score = this.calculateSimilarity(problemName, data.problem_name);
        
        if (score > bestScore && score > 0.7) { // 70% similarity threshold
          bestScore = score;
          bestMatch = { id: doc.id, ...data };
        }
      });
      
      if (bestMatch) {
        return bestMatch;
      }
    }
    
    return null;
  }

  generateSearchTerms(problemName) {
    const terms = [];
    const words = problemName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Add individual words
    terms.push(...words);
    
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
      'minimum': ['min', 'smallest', 'least']
    };
    
    words.forEach(word => {
      if (variations[word]) {
        terms.push(...variations[word]);
      }
    });
    
    return [...new Set(terms)];
  }

  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Word overlap similarity
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  // Get test by ID
  async getTestById(testId) {
    try {
      const docRef = doc(db, "leet_tests", testId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting test by ID:', error);
      return null;
    }
  }

  // Create test session
  async createTestSession(testId, userId) {
    const sessionId = `leet_${testId}_${userId}_${Date.now()}`;
    const sessionData = {
      test_id: testId,
      user_id: userId,
      session_id: sessionId,
      started_at: new Date().toISOString(),
      status: 'active',
      current_question: 0,
      answers: {},
      time_spent: 0,
      created_at: new Date().toISOString()
    };
    
    try {
      const sessionRef = doc(db, "leet_test_sessions", sessionId);
      await setDoc(sessionRef, sessionData);
      return sessionId;
    } catch (error) {
      console.error('Error creating test session:', error);
      throw error;
    }
  }

  // Save test answer
  async saveAnswer(sessionId, questionId, answer, timeSpent) {
    try {
      const sessionRef = doc(db, "leet_test_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        sessionData.answers[questionId] = {
          answer: answer,
          time_spent: timeSpent,
          answered_at: new Date().toISOString()
        };
        sessionData.updated_at = new Date().toISOString();
        
        await updateDoc(sessionRef, sessionData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving answer:', error);
      return false;
    }
  }

  // Complete test session
  async completeTestSession(sessionId) {
    try {
      const sessionRef = doc(db, "leet_test_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        sessionData.status = 'completed';
        sessionData.completed_at = new Date().toISOString();
        
        // Calculate results
        const results = await this.calculateTestResults(sessionData);
        sessionData.results = results;
        
        await updateDoc(sessionRef, sessionData);
        return results;
      }
      return null;
    } catch (error) {
      console.error('Error completing test session:', error);
      throw error;
    }
  }

  // Calculate test results
  async calculateTestResults(sessionData) {
    const test = await this.getTestById(sessionData.test_id);
    if (!test) return null;
    
    const results = {
      total_questions: test.questions.length,
      correct_answers: 0,
      incorrect_answers: 0,
      skipped: 0,
      score: 0,
      time_spent: sessionData.time_spent,
      question_breakdown: []
    };
    
    test.questions.forEach(question => {
      const userAnswer = sessionData.answers[question.id];
      
      let isCorrect = false;
      let userAnswerValue = null;
      
      if (userAnswer) {
        userAnswerValue = userAnswer.answer;
        
        switch (question.type) {
          case 'mcq':
            isCorrect = userAnswer.answer === question.correct_answer;
            break;
          case 'true_false':
            isCorrect = userAnswer.answer === question.correct_answer;
            break;
          case 'msq':
            const userAnswers = Array.isArray(userAnswer.answer) ? userAnswer.answer : [userAnswer.answer];
            const correctAnswers = Array.isArray(question.correct_answers) ? question.correct_answers : [question.correct_answers];
            isCorrect = userAnswers.length === correctAnswers.length && 
                      userAnswers.every(ans => correctAnswers.includes(ans));
            break;
          case 'nat':
            isCorrect = userAnswer.answer.toString() === question.correct_answer.toString();
            break;
          case 'fill_blank':
          case 'one_word':
            isCorrect = userAnswer.answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
            break;
          case 'assertion_reason':
            isCorrect = userAnswer.answer === question.correct_answer;
            break;
          case 'matching':
            // Complex matching logic
            isCorrect = this.checkMatchingAnswer(userAnswer.answer, question.correct_matches);
            break;
        }
      }
      
      if (userAnswer) {
        if (isCorrect) {
          results.correct_answers++;
        } else {
          results.incorrect_answers++;
        }
      } else {
        results.skipped++;
      }
      
      results.question_breakdown.push({
        question_id: question.id,
        type: question.type,
        correct: isCorrect,
        user_answer: userAnswerValue,
        correct_answer: question.correct_answer || question.correct_answers,
        time_spent: userAnswer?.time_spent || 0
      });
    });
    
    results.score = Math.round((results.correct_answers / results.total_questions) * 100);
    
    return results;
  }

  checkMatchingAnswer(userAnswer, correctMatches) {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctMatches)) {
      return false;
    }
    
    if (userAnswer.length !== correctMatches.length) {
      return false;
    }
    
    return userAnswer.every(match => {
      return correctMatches.some(correct => 
        correct.left === match.left && correct.right === match.right
      );
    });
  }

  // Get user's test history
  async getUserTestHistory(userId, limit = 10) {
    try {
      const q = query(
        collection(db, "leet_test_sessions"),
        where("user_id", "==", userId),
        orderBy("completed_at", "desc"),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });
      
      return history;
    } catch (error) {
      console.error('Error getting test history:', error);
      return [];
    }
  }

  // Resume test session
  async resumeTestSession(sessionId) {
    try {
      const sessionRef = doc(db, "leet_test_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        if (sessionData.status === 'active') {
          return { id: sessionSnap.id, ...sessionData };
        }
      }
      return null;
    } catch (error) {
      console.error('Error resuming test session:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const leetCodeTestIntegration = new LeetCodeTestIntegration();

// Export convenience functions
export async function findLeetCodeTest(problemName) {
  return await leetCodeTestIntegration.findTestByProblemName(problemName);
}

export async function startLeetCodeTest(testId, userId) {
  return await leetCodeTestIntegration.createTestSession(testId, userId);
}

export async function submitLeetCodeAnswer(sessionId, questionId, answer, timeSpent) {
  return await leetCodeTestIntegration.saveAnswer(sessionId, questionId, answer, timeSpent);
}

export async function finishLeetCodeTest(sessionId) {
  return await leetCodeTestIntegration.completeTestSession(sessionId);
}

export default LeetCodeTestIntegration;
