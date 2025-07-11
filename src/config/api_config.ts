// API Configuration Constants

// Base URLs for different environments
export const BASE_URL = "http://127.0.0.1:8000";

// API Endpoints
export const ENDPOINTS = {
    "carbon-intensity": "/carbon-intensity",
} as const;

// API Request timeouts (in seconds)
export const REQUEST_TIMEOUT = 30;

// API Headers
export const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
} as const; 