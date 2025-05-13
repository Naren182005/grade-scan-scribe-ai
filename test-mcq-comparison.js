// Test script for MCQ answer comparison
// This script demonstrates how to compare model answers with student answers
// and calculate scores for multiple-choice questions

/**
 * Parses MCQ answers from a text string
 * The text can be in multiple formats:
 * 1. Each line contains a question number and answer: "1A", "2B", etc.
 * 2. Space-separated pairs: "1 A 2 B 3 C 4 D"
 *
 * @param {string} answerText The answer text to parse
 * @returns {Object} Dictionary mapping question numbers to answer options
 */
function parseAnswerText(answerText) {
  // Handle empty input
  if (!answerText) {
    return {};
  }

  const answers = {};

  // First, try to parse as newline-separated format (1A, 2B, etc.)
  if (answerText.includes('\n')) {
    const lines = answerText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();
      if (trimmed.length > 0) {
        // Extract question number and option
        // This handles formats like "1A", "1 A", etc.
        const match = trimmed.match(/^(\d+)\s*([A-D])$/);

        if (match) {
          const qNo = match[1];
          const option = match[2];
          answers[qNo] = option;
        } else {
          // Try to extract question number and option from the line
          const qNoMatch = trimmed.match(/(\d+)/);
          const optionMatch = trimmed.match(/([A-D])/);

          if (qNoMatch && optionMatch) {
            const qNo = qNoMatch[1];
            const option = optionMatch[1];
            answers[qNo] = option;
          }
        }
      }
    }
  }

  // If no answers were parsed from newlines, try space-separated format
  if (Object.keys(answers).length === 0) {
    // Replace newlines with spaces and trim whitespace
    const text = answerText.replace(/\n/g, ' ').trim().toUpperCase();

    // Split by whitespace
    const parts = text.split(/\s+/);

    // Process pairs of elements (question number and option)
    for (let i = 0; i < parts.length; i += 2) {
      // Make sure we have both question number and option
      if (i + 1 < parts.length) {
        const qNo = parts[i];
        const option = parts[i + 1];

        // Validate question number (should be a number)
        if (/^\d+$/.test(qNo)) {
          // Validate option (should be A, B, C, or D)
          if (/^[A-D]$/.test(option)) {
            answers[qNo] = option;
          }
        }
      }
    }
  }

  return answers;
}

/**
 * Evaluates MCQ answers by comparing model answers with student answers
 *
 * @param {string} modelAnswerText The model answer text
 * @param {string} studentAnswerText The student answer text
 * @returns {Object} Object containing score and total questions
 */
function evaluateMCQ(modelAnswerText, studentAnswerText) {
  // Parse the answers
  const modelAnswers = parseAnswerText(modelAnswerText);
  const studentAnswers = parseAnswerText(studentAnswerText);

  let score = 0;
  const total = Object.keys(modelAnswers).length;
  const results = {};

  // Compare answers for each question in the model answers
  for (const [qNo, correctOption] of Object.entries(modelAnswers)) {
    const studentOption = studentAnswers[qNo];

    // Check if student answered this question correctly
    if (studentOption === correctOption) {
      score += 1;
      results[qNo] = {
        correctOption,
        studentOption,
        isCorrect: true
      };
    } else {
      results[qNo] = {
        correctOption,
        studentOption: studentOption || null,
        isCorrect: false
      };
    }
  }

  return {
    score,
    total,
    results
  };
}

/**
 * Displays the evaluation results in a formatted way
 *
 * @param {Object} evaluationResult Result from evaluateMCQ function
 */
function displayResults(evaluationResult) {
  const { score, total, results } = evaluationResult;

  console.log('\n===========================================');
  console.log('MCQ Answer Evaluation Results');
  console.log('===========================================');

  // Display detailed results for each question
  console.log('\nDetailed Results:');
  console.log('-------------------------------------------');

  for (const [qNo, result] of Object.entries(results)) {
    const status = result.isCorrect ? '✓' : '✗';
    const studentAnswer = result.studentOption || 'No answer';

    console.log(`Question ${qNo}: ${status} | Model: ${result.correctOption} | Student: ${studentAnswer}`);
  }

  // Display final score
  console.log('\n===========================================');
  console.log(`Final Score: ${score}/${total}`);
  console.log('===========================================');
}

// Example usage with the provided data
const modelAnswerText = `1A
2B
3C
4D`;

const studentAnswerText = "1 a 2 b 3 c 4 d";

// Evaluate the answers
const evaluationResult = evaluateMCQ(modelAnswerText, studentAnswerText);

// Display the results
displayResults(evaluationResult);

// Export functions for potential reuse
export {
  parseAnswerText,
  evaluateMCQ,
  displayResults
};
