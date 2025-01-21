import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';

const YearlyAverages = ({ data, selectedTypes, typeColors, options, selectedEmployees }) => {
  // Calculate yearly totals and averages
  const yearlyData = data.reduce((acc, record) => {
    const year = record.TAHUN;
    if (!acc[year]) {
      acc[year] = {
        year,
        employeeCount: record.employees.length,
        counts: {},
        total: 0
      };
    }
    
    selectedTypes.forEach(type => {
      if (!acc[year].counts[type]) {
        acc[year].counts[type] = 0;
      }
      acc[year].counts[type] += record[type] || 0;
    });
    
    return acc;
  }, {});

  // Convert to array and prepare data for chart
  const chartData = Object.values(yearlyData).map(yearData => {
    const monthsInYear = data.filter(r => r.TAHUN === yearData.year).length;
    const result = {
      year: yearData.year,
    };

    selectedTypes.forEach(type => {
      // Store both total and average
      result[`total_${type}`] = yearData.counts[type];
      result[type] = yearData.counts[type] / (monthsInYear * selectedEmployees.length); // for display
    });

    return result;
  }).sort((a, b) => a.year - b.year);

  // Find maximum average for Y-axis scaling
  const maxAverage = Math.max(
    ...chartData.flatMap(item => 
      selectedTypes.map(type => item[type] || 0)
    )
  );

  // Add 10% padding to Y-axis max
  const yAxisDomain = [0, maxAverage + (maxAverage * 0.1)];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="min-w-[250px] bg-white p-4 border rounded-lg shadow-lg">
          <p className="pb-2 mb-3 font-medium border-b">{`Tahun ${label}`}</p>
          <div className="space-y-4">
            {/* Total Section */}
            <div>
              <p className="mb-2 text-sm font-medium">Total:</p>
              {payload.map((entry) => {
                const typeKey = entry.dataKey;
                const totalKey = `total_${typeKey}`;
                const typeLabel = options.types.find(t => t.value === typeKey)?.label;
                const totalValue = entry.payload[totalKey];
                
                return (
                  <div key={typeKey} className="mb-1 ml-2 text-sm">
                    <span style={{ color: entry.color }} className="font-medium">
                      {typeLabel}: 
                    </span>
                    <span className="ml-2">{totalValue.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>

            {/* Average Section */}
            <div>
              <p className="mb-2 text-sm font-medium">Rata-rata per Pegawai:</p>
              {payload.map((entry) => {
                const typeKey = entry.dataKey;
                const typeLabel = options.types.find(t => t.value === typeKey)?.label;
                return (
                  <div key={typeKey} className="mb-1 ml-2 text-sm">
                    <span style={{ color: entry.color }} className="font-medium">
                      {typeLabel}: 
                    </span>
                    <span className="ml-2">{entry.value.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-500" />
          <h2 className="font-medium">Rata-rata Kehadiran per Tahun</h2>
        </div>
        {selectedEmployees.length > 0 && (
          <div className="px-3 py-1 text-sm text-blue-600 rounded-full bg-blue-50">
            {`Data per Pegawai`}
          </div>
        )}
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              domain={yAxisDomain}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(1)}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedTypes.map(type => (
              <Bar
                key={type}
                dataKey={type}
                fill={typeColors[type]}
                name={options.types.find(t => t.value === type)?.label}
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>* Rata-rata dihitung per pegawai per bulan</p>
        <p className="mt-1">* Hover pada grafik untuk melihat total kejadian</p>
      </div>
    </div>
  );
};

export default YearlyAverages;