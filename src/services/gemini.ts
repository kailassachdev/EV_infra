import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API with validation
const API_KEY = "AIzaSyCc1p9_757_oWgF3BYpeDn2Vv9WDkzQEZY";
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
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
    
    const prompt = `Web scrape current renewable energy mix data for South India from a reliable and authoritative source such as the Ministry of Power (India), National Load Despatch Centre (https://posoco.in), or Southern Regional Load Despatch Centre (https://srldc.in). 

Extract the percentage contribution of the following renewable sources only:
- Solar
- Wind
- Hydro
- Geothermal

Return the result as a JSON array formatted like this:
[
  { "name": "Solar", "value": <percentage> },
  { "name": "Wind", "value": <percentage> },
  { "name": "Hydro", "value": <percentage> },
  { "name": "Geothermal", "value": <percentage> }
]

Ensure the total of all 'value' fields adds up to 100. If any source (e.g., Geothermal) has no data or contribution, include it with value: 0.

Only return the final JSON array.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Parse the JSON response and add colors
      const data = JSON.parse(text.replace(/```json\n|\n```/g, '').trim());
      return data.map((item: any) => ({
        ...item,
        color: getColorForSource(item.name)
      }));
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching energy mix data:', error);
    // Return default data if API fails
    return [
      { name: "Solar", value: 25, color: "hsl(var(--chart-1))" },
      { name: "Wind", value: 25, color: "hsl(var(--chart-2))" },
      { name: "Hydro", value: 25, color: "hsl(var(--chart-3))" },
      { name: "Geothermal", value: 25, color: "hsl(var(--chart-4))" }
    ];
  }
}

function getColorForSource(source: string): string {
  const colors = {
    "Solar": "hsl(var(--chart-1))",
    "Wind": "hsl(var(--chart-2))",
    "Hydro": "hsl(var(--chart-3))",
    "Geothermal": "hsl(var(--chart-4))"
  };
  return colors[source as keyof typeof colors] || "hsl(var(--chart-1))";
} 