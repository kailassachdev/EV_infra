import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API with validation
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
console.log(API_KEY)
if (!API_KEY) {
  console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
}
const genAI = new GoogleGenerativeAI(API_KEY || '');

interface EnergyMixData {
  name: string;
  value: number;
  color: string;
}

export async function getEnergyMixData(): Promise<EnergyMixData[]> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get current time in IST for logging
    const istTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    console.log('Current IST time:', istTime);

    const prompt = `Return ONLY this JSON array with predicted values based on current time (${istTime}):
[{"name":"Solar","value":0},{"name":"Wind","value":35},{"name":"Hydro","value":15},{"name":"Coal","value":50},{"name":"Geothermal","value":0}]

Rules:
1. Copy the exact format above
2. Only change the numbers
3. Numbers must sum to 100
4. Values can be 0 if source is not generating
5. Night (6 PM - 6 AM): Solar must be 0, Coal 40-60%, Wind 20-40%, Hydro 10-20%
6. Day (6 AM - 6 PM): Solar 20-35%, Coal 25-40%, Wind 15-30%, Hydro 10-20%
7. Geothermal always 0 in South India
8. No other text allowed`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw response:', text); // Debug log raw response
    
    try {
      // Clean and validate the response
      let cleanedText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/[\u201C\u201D]/g, '') // Replace smart quotes
        .replace(/[\r\n]/g, '') // Remove newlines
        .trim();
      
      // Try to extract JSON array if it's wrapped in other text
      const match = cleanedText.match(/\[.*?\]/);
      if (match) {
        cleanedText = match[0];
      }

      // If we don't have a valid JSON array structure, return default data
      if (!cleanedText.startsWith('[') || !cleanedText.endsWith(']')) {
        return getDefaultData();
      }

      // Parse and validate the data
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return getDefaultData();
      }

      // Validate array and required fields
      if (!Array.isArray(data) || 
          data.length !== 5 || 
          !data.every(item => 
            item && 
            typeof item === 'object' && 
            'name' in item && 
            'value' in item && 
            typeof item.name === 'string' && 
            typeof item.value === 'number'
          )) {
        console.error('Invalid data structure:', data);
        return getDefaultData();
      }

      // Add colors to the valid data
      return data.map((item: any) => ({
        ...item,
        color: getColorForSource(item.name)
      }));

    } catch (error) {
      console.error('Error in getEnergyMixData:', error);
      return getDefaultData();
    }
  } catch (error) {
    console.error('Error fetching energy mix data:', error);
    return getDefaultData();
  }
}

// Helper function to return default data
function getDefaultData() {
  return [
    { name: "Solar", value: 0, color: "hsl(var(--chart-1))" },
    { name: "Wind", value: 0, color: "hsl(var(--chart-2))" },
    { name: "Hydro", value: 0, color: "hsl(var(--chart-3))" },
    { name: "Coal", value: 0, color: "hsl(var(--chart-4))" },
    { name: "Geothermal", value: 0, color: "hsl(var(--chart-5))" }
  ];
}

function getColorForSource(source: string): string {
  const colors = {
    "Solar": "hsl(var(--chart-1))",
    "Wind": "hsl(var(--chart-2))",
    "Hydro": "hsl(var(--chart-3))",
    "Coal": "hsl(var(--chart-4))",
    "Geothermal": "hsl(var(--chart-5))"
  };
  return colors[source as keyof typeof colors] || "hsl(var(--chart-1))";
} 