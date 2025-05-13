"""
Test script for MCQ answer evaluation

This script tests the functionality of the mcq_comparison module with various test cases.
"""

import unittest
from mcq_comparison import parse_answer_text, evaluate_mcq

class TestMCQComparison(unittest.TestCase):
    """Test cases for MCQ answer evaluation"""
    
    def test_parse_answer_text_newline_format(self):
        """Test parsing answers in newline format"""
        answer_text = """1A
2B
3C
4D"""
        expected = {'1': 'A', '2': 'B', '3': 'C', '4': 'D'}
        self.assertEqual(parse_answer_text(answer_text), expected)
    
    def test_parse_answer_text_space_format(self):
        """Test parsing answers in space-separated format"""
        answer_text = "1 A 2 B 3 C 4 D"
        expected = {'1': 'A', '2': 'B', '3': 'C', '4': 'D'}
        self.assertEqual(parse_answer_text(answer_text), expected)
    
    def test_parse_answer_text_mixed_format(self):
        """Test parsing answers in mixed format"""
        answer_text = """1 A
2B
3 C
4D"""
        expected = {'1': 'A', '2': 'B', '3': 'C', '4': 'D'}
        self.assertEqual(parse_answer_text(answer_text), expected)
    
    def test_parse_answer_text_case_insensitive(self):
        """Test case insensitivity in parsing"""
        answer_text = "1 a 2 b 3 c 4 d"
        expected = {'1': 'A', '2': 'B', '3': 'C', '4': 'D'}
        self.assertEqual(parse_answer_text(answer_text), expected)
    
    def test_evaluate_mcq_all_correct(self):
        """Test evaluation with all correct answers"""
        model_answer_text = """1A
2B
3C
4D"""
        student_answer_text = "1 A 2 B 3 C 4 D"
        score, total = evaluate_mcq(model_answer_text, student_answer_text)
        self.assertEqual(score, 4)
        self.assertEqual(total, 4)
    
    def test_evaluate_mcq_partial_correct(self):
        """Test evaluation with partially correct answers"""
        model_answer_text = """1A
2B
3C
4D
5A"""
        student_answer_text = "1 A 2 B 3 D 4 C 5 A"
        score, total = evaluate_mcq(model_answer_text, student_answer_text)
        self.assertEqual(score, 3)
        self.assertEqual(total, 5)
    
    def test_evaluate_mcq_missing_answers(self):
        """Test evaluation with missing student answers"""
        model_answer_text = """1A
2B
3C
4D
5A"""
        student_answer_text = "1 A 3 C 5 A"
        score, total = evaluate_mcq(model_answer_text, student_answer_text)
        self.assertEqual(score, 3)
        self.assertEqual(total, 5)
    
    def test_evaluate_mcq_case_insensitive(self):
        """Test case insensitivity in evaluation"""
        model_answer_text = """1A
2B
3C
4D"""
        student_answer_text = "1 a 2 b 3 c 4 d"
        score, total = evaluate_mcq(model_answer_text, student_answer_text)
        self.assertEqual(score, 4)
        self.assertEqual(total, 4)

if __name__ == "__main__":
    unittest.main()
