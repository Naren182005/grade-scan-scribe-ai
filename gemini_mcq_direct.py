#!/usr/bin/env python
"""
Direct Gemini MCQ Answer Generator

This script uses the Google Gemini API to generate answers for multiple-choice questions.
It takes MCQ questions as input and outputs only the option letters (a/b/c/d) for each question.

Usage:
    python gemini_mcq_direct.py
"""

import google.generativeai as genai

# Configure the Gemini API with your API key
API_KEY = ""  # API key removed for security
genai.configure(api_key=API_KEY)

# Sample MCQ questions
questions = """
Question 1. Which lens has virtual focus? a. Convex lens b. Concave lens c. Both convex and concave lens d. None

Question 2. A small electric lamp placed at the focal point of convex lens produces- a. Converging beam of light b. Parallel beam of light c. Diverging beam of light d. Diffused beam of light

Question 3. In a circuit- a. Ammeter is always connected in parallel and voltmeter in series b. Both are connected in series c. Both are connected in parallel d. Ammeter is always connected in series and voltmeter is parallel with resistor

Question 4. A convex lens of focal length forms an image of an object equal in size of the object when the object is placed at a distance- a. Greater than 2f b. Less than f c. Equal to 2f d. None
"""

# Prompt template for MCQ answer generation
prompt = f"""
You are a model answer generator for CLASS-X SCIENCE PRACTICAL SKILLS AND TECHNOLOGY MCQ papers.

Instructions:
- Read the following MCQ questions carefully.
- Choose the correct option for each question.
- Output ONLY the option letter (a/b/c/d) for each question in order, numbered accordingly.
- Do NOT provide explanations, extra text, or formatting boxes.
- Do NOT write sentences or paragraphs.
- ONLY output the question number and letter answer.
- Example output:
1 b
2 c
3 a
4 d

Here are the questions:

{questions}

Generate the answers.
"""

def main():
    try:
        # Create a GenerativeModel instance with the Gemini model
        model = genai.GenerativeModel("gemini-1.5-pro")

        # Generate content with the prompt
        response = model.generate_content(prompt)

        # Print the generated answers
        print("\nGenerated Answers:")
        print("==================")
        print(response.text.strip())
        print("==================")
    except Exception as e:
        print(f"Error generating answers: {e}")
        # Fallback to hardcoded answers for testing
        print("\nFallback to hardcoded answers due to API error:")
        print("==================")
        print("1 b\n2 b\n3 d\n4 c")
        print("==================")

if __name__ == "__main__":
    main()
