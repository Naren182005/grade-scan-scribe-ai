/**
 * API configuration
 *
 * This file contains the configuration for API endpoints.
 * It uses environment variables to determine the base URL.
 */

// Get the API base URL from environment variables
// In development, this will be set by Vite from .env file
// In production, this will be set during the build process
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// API endpoints
export const API_ENDPOINTS = {
  OCR: `${API_BASE_URL}/ocr`,
  MODEL: `${API_BASE_URL}/model`,
  CONNECTIVITY: `${API_BASE_URL}/connectivity`,
  EVALUATE_ANSWER: `${API_BASE_URL}/evaluate-answer`,
  LOCAL_LLM: 'http://localhost:8000/v1/completions', // Local vLLM server endpoint
  HF_INFERENCE: `${API_BASE_URL}/huggingface`, // Mock Hugging Face API endpoint (using our simple server)
  GEMINI: `${API_BASE_URL}/gemini` // Gemini API endpoint
};

// Local LLM configuration
export const USE_LOCAL_LLM_FALLBACK = true; // Whether to use the local LLM as a fallback
export const LOCAL_LLM_MODEL = "meta-llama/Llama-3.1-8B-Instruct"; // The model being served by vLLM

// Hugging Face API configuration
export const HUGGING_FACE_API_KEY = ""; // API key removed for security
export const USE_HF_API = false; // Disabled since API key is removed
export const DEFAULT_HF_MODEL = import.meta.env.VITE_DEFAULT_HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct"; // Default Hugging Face model

// OpenAI API configuration
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "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"; // OpenAI API key
export const DEFAULT_OPENAI_MODEL = "gpt-3.5-turbo"; // Default OpenAI model
export const OPENAI_MODELS = ["gpt-3.5-turbo", "gpt-4"]; // Available OpenAI models

// Default model to use for all operations
export const DEFAULT_MODEL = "local-llm"; // Using local LLM as the primary model since HF is disabled

// Fallback models in order of preference
export const FALLBACK_MODELS = [
  'local-llm'    // Local LLM as the primary option
];

// Enable fallbacks
export const USE_HF_FALLBACK = false; // Disabled since API key is removed
