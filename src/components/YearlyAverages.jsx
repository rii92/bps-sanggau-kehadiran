import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';

const YearlyAverages = ({ data, selectedTypes, typeColors, options, selectedEmployees }) => {
  // Calculate yearly averages
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

  // Convert to array and calculate averages
  const yearlyAverages = Object.values(yearlyData).map(yearData => {
    const averages = {};
    selectedTypes.forEach(type => {
      const monthsInYear = data.filter(r => r.TAHUN === yearData.year).length;
      averages[type] = yearData.counts[type] / (monthsInYear * selectedEmployees.length);
    });
    return {
      year: yearData.year,
      ...averages
    };
  });

  // Sort by year
  yearlyAverages.sort((a, b) => a.year - b.year);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-white border rounded-lg shadow-lg">
          <p className="mb-2 font-medium">{`Tahun ${label}`}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => {
              const typeLabel = options.types.find(t => t.value === entry.dataKey)?.label;
              return (
                <div key={index}>
                  <p style={{ color: entry.color }} className="text-sm font-medium">
                    {typeLabel}
                  </p>
                  <p className="ml-2 text-sm">
                    Rata-rata: {entry.value.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-gray-500" />
        <h2 className="font-medium">Rata-rata Kehadiran per Tahun</h2>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearlyAverages}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedTypes.map(type => (
              <Bar
                key={type}
                dataKey={type}
                fill={typeColors[type]}
                name={options.types.find(t => t.value === type)?.label}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>* Rata-rata dihitung berdasarkan jumlah pegawai aktif per bulan</p>
      </div>
    </div>
  );
};

export default YearlyAverages;