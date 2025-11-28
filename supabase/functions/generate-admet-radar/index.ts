import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompoundData {
  compound_name: string;
  Absorption: number;
  Distribution: number;
  Metabolism: number;
  Excretion: number;
  Toxicity: number;
}

interface NormalizedCompound {
  name: string;
  absorption: number;
  distribution: number;
  metabolism: number;
  excretion: number;
  safety: number; // Inverted toxicity (100 - toxicity)
}

// Parse CSV string into array of objects
function parseCSV(csvString: string): CompoundData[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const requiredHeaders = ['compound_name', 'Absorption', 'Distribution', 'Metabolism', 'Excretion', 'Toxicity'];
  
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const data: CompoundData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      if (header === 'compound_name') {
        row[header] = values[index];
      } else {
        row[header] = parseFloat(values[index]) || 0;
      }
    });
    data.push(row as CompoundData);
  }

  return data;
}

// Normalize values to 0-100 range
function normalizeData(data: CompoundData[]): NormalizedCompound[] {
  if (data.length === 0) return [];

  // Find min/max for each property
  const properties = ['Absorption', 'Distribution', 'Metabolism', 'Excretion', 'Toxicity'] as const;
  const minMax: Record<string, { min: number; max: number }> = {};

  for (const prop of properties) {
    const values = data.map(d => d[prop]);
    minMax[prop] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  // Normalize each compound
  return data.map(compound => {
    const normalize = (value: number, prop: string): number => {
      const { min, max } = minMax[prop];
      if (max === min) return 50; // If all values are the same, return 50
      return ((value - min) / (max - min)) * 100;
    };

    return {
      name: compound.compound_name,
      absorption: normalize(compound.Absorption, 'Absorption'),
      distribution: normalize(compound.Distribution, 'Distribution'),
      metabolism: normalize(compound.Metabolism, 'Metabolism'),
      excretion: normalize(compound.Excretion, 'Excretion'),
      safety: 100 - normalize(compound.Toxicity, 'Toxicity'), // Invert toxicity to safety
    };
  });
}

// Generate colors for each compound
function generateColors(count: number): { bg: string; border: string }[] {
  const baseColors = [
    { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
    { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
    { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
    { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
    { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' },
    { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' },
    { bg: 'rgba(199, 199, 199, 0.2)', border: 'rgba(199, 199, 199, 1)' },
    { bg: 'rgba(83, 102, 255, 0.2)', border: 'rgba(83, 102, 255, 1)' },
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

// Generate radar chart using QuickChart API
async function generateRadarChart(compounds: NormalizedCompound[]): Promise<string> {
  const labels = ['Absorption', 'Distribution', 'Metabolism', 'Excretion', 'Safety'];
  const colors = generateColors(compounds.length);

  const datasets = compounds.map((compound, index) => ({
    label: compound.name,
    data: [
      compound.absorption,
      compound.distribution,
      compound.metabolism,
      compound.excretion,
      compound.safety,
    ],
    backgroundColor: colors[index].bg,
    borderColor: colors[index].border,
    borderWidth: 2,
    pointBackgroundColor: colors[index].border,
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: colors[index].border,
  }));

  const chartConfig = {
    type: 'radar',
    data: {
      labels,
      datasets,
    },
    options: {
      scale: {
        ticks: {
          beginAtZero: true,
          max: 100,
          stepSize: 20,
        },
      },
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'ADMET Profile Comparison',
        fontSize: 16,
      },
    },
  };

  // Use QuickChart API to generate PNG
  const response = await fetch('https://quickchart.io/chart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chart: chartConfig,
      width: 600,
      height: 600,
      backgroundColor: 'white',
      format: 'png',
    }),
  });

  if (!response.ok) {
    throw new Error(`QuickChart API error: ${response.statusText}`);
  }

  // Convert to base64
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:image/png;base64,${base64}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csv_data, compound_names } = await req.json();

    if (!csv_data) {
      throw new Error('csv_data is required');
    }

    console.log('Parsing CSV data...');
    const parsedData = parseCSV(csv_data);
    console.log(`Parsed ${parsedData.length} compounds from CSV`);

    // Filter by compound names if provided
    let filteredData = parsedData;
    if (compound_names && Array.isArray(compound_names) && compound_names.length > 0) {
      filteredData = parsedData.filter(d => 
        compound_names.includes(d.compound_name)
      );
      console.log(`Filtered to ${filteredData.length} compounds`);
    }

    if (filteredData.length === 0) {
      throw new Error('No matching compounds found');
    }

    console.log('Normalizing ADMET data...');
    const normalizedData = normalizeData(filteredData);

    console.log('Generating radar chart...');
    const chartBase64 = await generateRadarChart(normalizedData);

    return new Response(
      JSON.stringify({
        success: true,
        normalized_data: normalizedData,
        chart_image: chartBase64,
        compound_count: normalizedData.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-admet-radar function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
