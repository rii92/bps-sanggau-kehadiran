import { useState, useEffect, useMemo } from 'react';
import { Table, Filter, TrendingUp, Loader, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MultiSelect = ({ label, options = [], selected = [], onChange = () => {}, colorMap = {} }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div 
        className="w-full min-h-[42px] p-2 border rounded-md shadow-sm cursor-pointer bg-white flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-gray-500">Pilih {label}</span>
          ) : (
            <span>{selected.length} dipilih</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg max-h-60">
          <div className="p-2 border-b">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.length === options.length}
                onChange={() => {
                  if (selected.length === options.length) {
                    onChange([]);
                  } else {
                    onChange(options.map(opt => opt.value));
                  }
                }}
                className="border-gray-300 rounded"
              />
              <span>Pilih Semua</span>
            </label>
          </div>
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => {
                  const newSelected = selected.includes(option.value)
                    ? selected.filter(item => item !== option.value)
                    : [...selected, option.value];
                  onChange(newSelected);
                }}
                className="border-gray-300 rounded"
              />
              <span 
                className="flex items-center gap-2"
                style={{ color: colorMap[option.value] }}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const AttendanceDashboard = () => {
  const [data, setData] = useState({ records: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://script.google.com/macros/s/AKfycbz_r_MqarHZj8tim_6yQWOgG375DblKWzj35vdXAXERbcRvq1TYzkG3pMz9L2OEgMNdqg/exec?action=read');
        const result = await response.json();
        setData(result);
        // Set default selections
        const years = [...new Set(result.records.map(r => r.TAHUN))];
        setSelectedYears([years[years.length - 1]]); // Select latest year by default
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare options for filters
  const options = useMemo(() => ({
    employees: [...new Set(data.records?.map(r => r.NAMA))]
      .map(name => ({ value: name, label: name })),
    years: [...new Set(data.records?.map(r => r.TAHUN))]
      .map(year => ({ value: year, label: year })),
    types: [
      { value: 'HD', label: 'Hadir', color: '#3b82f6' },
      { value: 'TK', label: 'Tanpa Kabar', color: '#ef4444' },
      { value: 'TL', label: 'Tugas Luar', color: '#f59e0b' },
      { value: 'PSW', label: 'Pulang Sebelum Waktu', color: '#10b981' },
      { value: 'HT', label: 'Hadir Terlambat', color: '#8b5cf6' },
      { value: 'DK', label: 'Diklat', color: '#ec4899' },
      { value: 'CS', label: 'Cuti Sakit', color: '#6366f1' },
      { value: 'CP', label: 'Cuti Penting', color: '#14b8a6' }
    ]
  }), [data.records]);

  // Color mapping for attendance types
  const typeColors = useMemo(() => 
    options.types.reduce((acc, type) => ({ ...acc, [type.value]: type.color }), {}),
    [options.types]
  );

  // Filter data
  const filteredData = useMemo(() => {
    return data.records?.filter(record => {
      const employeeMatch = selectedEmployees.length === 0 || selectedEmployees.includes(record.NAMA);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(record.TAHUN);
      return employeeMatch && yearMatch;
    }) || [];
  }, [data.records, selectedEmployees, selectedYears]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader className="w-6 h-6 animate-spin" />
          <span>Loading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 bg-gray-50">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto space-y-6 max-w-7xl">
        {/* Header */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 md:text-2xl">
            <Table className="w-6 h-6" />
            Data Kehadiran Pegawai
          </h1>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-medium">Filter Data</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MultiSelect
              label="Pegawai"
              options={options.employees}
              selected={selectedEmployees}
              onChange={setSelectedEmployees}
            />

            <MultiSelect
              label="Tahun"
              options={options.years}
              selected={selectedYears}
              onChange={setSelectedYears}
            />

            <MultiSelect
              label="Jenis Kehadiran"
              options={options.types}
              selected={selectedTypes}
              onChange={setSelectedTypes}
              colorMap={typeColors}
            />
          </div>
        </div>

        {/* Chart */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h2 className="font-medium">Tren Kehadiran</h2>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="BULAN" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedTypes.map(type => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={typeColors[type]}
                    name={options.types.find(t => t.value === type)?.label}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">NIP</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Bulan</th>
                  {selectedTypes.length === 0 ? (
                    <>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">HK</th>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">HD</th>
                    </>
                  ) : (
                    selectedTypes.map(type => (
                      <th 
                        key={type} 
                        className="px-4 py-3 text-xs font-medium tracking-wider text-left uppercase"
                        style={{ color: typeColors[type] }}
                      >
                        {type}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((record, idx) => (
                  <tr key={`${record.NIP}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.NIP}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.NAMA}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.BULAN}</td>
                    {selectedTypes.length === 0 ? (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-500">{record.HK}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{record.HD}</td>
                      </>
                    ) : (
                      selectedTypes.map(type => (
                        <td key={type} className="px-4 py-3 text-sm text-gray-500">
                          {record[type]}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;