"""
Test script for the exact MCQ comparison implementation
"""

import unittest
from exact_mcq_comparison import process_json_input


class TestExactMCQComparison(unittest.TestCase):
    """Test cases for the exact MCQ comparison implementation"""
    
    def test_basic_all_correct(self):
        """Test with all correct answers"""
        input_data = {
            "model_answers": "1A 2B 3C 4D",
            "student_answers": "1 a 2 b 3 c 4 d"
        }
        result = process_json_input(input_data)
        self.assertEqual(result['score'], 4)
        self.assertEqual(result['total'], 4)
    
    def test_adjacent_format(self):
        """Test with adjacent format (no spaces)"""
        input_data = {
            "model_answers": "1A2B3C4D",
            "student_answers": "1a2b3c4d"
        }
        result = process_json_input(input_data)
        self.assertEqual(result['score'], 4)
        self.assertEqual(result['total'], 4)
    
    def test_mixed_format(self):
        """Test with mixed formats"""
        input_data = {
            "model_answers": "1A 2B 3C 4D",
            "student_answers": "1a2b3c4d"
        }
        result = process_json_input(input_data)
        self.assertEqual(result['score'], 4)
        self.assertEqual(result['total'], 4)
    
    def test_partial_correct(self):
        """Test with partially correct answers"""
        input_data = {
            "model_answers": "1A 2B 3C 4D 5A",
            "student_answers": "1a 2b 3d 4c 5a"
        }
        result = process_json_input(input_data)
        self.assertEqual(result['score'], 3)
        self.assertEqual(result['total'], 5)
    
    def test_missing_answers(self):
        """Test with missing student answers"""
        input_data = {
            "model_answers": "1A 2B 3C 4D 5A",
            "student_answers": "1a 3c 5a"
        }
        result = process_json_input(input_data)
        self.assertEqual(result['score'], 3)
        self.assertEqual(result['total'], 5)


if __name__ == "__main__":
    unittest.main()
