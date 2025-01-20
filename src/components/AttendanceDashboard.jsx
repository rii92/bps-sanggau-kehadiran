import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Filter,
  TrendingUp,
  Loader,
  ChevronDown,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Briefcase,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import YearlyAverages from "./YearlyAverages";

// Komponen Badge untuk menampilkan nama pegawai terpilih
const EmployeeBadge = ({ name, onRemove }) => (
  <div className="flex items-center gap-2 px-3 py-1 text-sm text-blue-700 rounded-full bg-blue-50">
    <span>{name}</span>
    <button
      onClick={onRemove}
      className="text-blue-500 hover:text-blue-700 focus:outline-none"
    >
      ×
    </button>
  </div>
);

// Komponen MultiSelect dengan penambahan fitur
const MultiSelect = ({
  label,
  options = [],
  selected = [],
  onChange = () => {},
  colorMap = {},
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
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
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg max-h-60">
          <div className="sticky top-0 p-2 bg-white border-b">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.length === options.length}
                onChange={() => {
                  if (selected.length === options.length) {
                    onChange([]);
                  } else {
                    onChange(options.map((opt) => opt.value));
                  }
                }}
                className="border-gray-300 rounded"
              />
              <span>Pilih Semua</span>
            </label>
          </div>
          <div className="p-1">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => {
                    const newSelected = selected.includes(option.value)
                      ? selected.filter((item) => item !== option.value)
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
        </div>
      )}
    </div>
  );
};

// Fungsi untuk memproses data
const processData = (records, selectedEmployees, selectedYears) => {
  if (selectedEmployees.length === 0) return [];

  const yearFiltered = records.filter(
    (record) =>
      selectedYears.length === 0 || selectedYears.includes(record.TAHUN)
  );

  const groupedData = yearFiltered.reduce((acc, record) => {
    const key = record.formattedDate;
    if (!acc[key]) {
      acc[key] = {
        formattedDate: record.formattedDate,
        sortKey: record.sortKey,
        BULAN: record.BULAN,
        TAHUN: record.TAHUN,
        employees: [],
      };
      Object.keys(record).forEach((field) => {
        if (
          !["NAMA", "BULAN", "TAHUN", "formattedDate", "sortKey"].includes(
            field
          )
        ) {
          acc[key][field] = 0;
        }
      });
    }

    if (selectedEmployees.includes(record.NAMA)) {
      acc[key].employees.push(record.NAMA);
      Object.keys(record).forEach((field) => {
        if (
          ![
            "NAMA",
            "BULAN",
            "TAHUN",
            "formattedDate",
            "sortKey",
            "employees",
          ].includes(field)
        ) {
          acc[key][field] += Number(record[field] || 0);
        }
      });
    }

    return acc;
  }, {});

  return Object.values(groupedData)
    .filter((group) => group.employees.length > 0)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

// Komponen utama
const AttendanceDashboard = () => {
  const [data, setData] = useState({ records: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(["HD", "HK"]);

  // Mapping bulan untuk konversi dan pengurutan
  const monthMapping = {
    Januari: "01",
    Februari: "02",
    Maret: "03",
    April: "04",
    Mei: "05",
    Juni: "06",
    Juli: "07",
    Agustus: "08",
    September: "09",
    Oktober: "10",
    November: "11",
    Desember: "12",
  };

  // Attendance type groups
  const attendanceGroups = {
    "Kehadiran Dasar": ["HK", "HD"],
    Ketidakhadiran: ["TK", "TL", "TB", "PD", "DK", "KN"],
    "Pulang Sebelum Waktu": ["PSW", "PSW1", "PSW2", "PSW3", "PSW4"],
    Keterlambatan: ["HT", "TL1", "TL2", "TL3", "TL4"],
    Cuti: [
      "CB",
      "CL",
      "CM",
      "CP",
      "CS",
      "CT 10",
      "CT 11",
      "CT 12",
      "CST1",
      "CST2",
    ],
    "Kekurangan Jam Kerja": ["KJK HT", "KJK PSW", "KJK", "KJK Hari"],
  };

  // Effect untuk fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbz_r_MqarHZj8tim_6yQWOgG375DblKWzj35vdXAXERbcRvq1TYzkG3pMz9L2OEgMNdqg/exec?action=read"
        );
        const result = await response.json();

        const transformedRecords = result.records.map((record) => ({
          ...record,
          formattedDate: `${monthMapping[record.BULAN]}-${String(
            record.TAHUN
          ).slice(-2)}`,
          sortKey: `${record.TAHUN}${monthMapping[record.BULAN]}`,
        }));

        const sortedRecords = transformedRecords.sort((a, b) =>
          a.sortKey.localeCompare(b.sortKey)
        );

        setData({ records: sortedRecords });

        const years = [...new Set(sortedRecords.map((r) => r.TAHUN))];
        setSelectedYears([years[years.length - 1]]);
      } catch (err) {
        setError("Gagal memuat data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare options for filters
  const options = useMemo(
    () => ({
      employees: [...new Set(data.records?.map((r) => r.NAMA))]
        .sort()
        .map((name) => ({
          value: name,
          label: name,
        })),
      years: [...new Set(data.records?.map((r) => r.TAHUN))]
        .sort((a, b) => b - a)
        .map((year) => ({
          value: year,
          label: String(year),
        })),
      types: [
        // Base attendance
        {
          value: "HK",
          label: "Hari Kerja dalam 1 bulan",
          color: "#4ade80",
          group: "Kehadiran Dasar",
        },
        {
          value: "HD",
          label: "Hadir dalam 1 bulan",
          color: "#3b82f6",
          group: "Kehadiran Dasar",
        },

        // Absence types
        {
          value: "TK",
          label: "Tanpa Kabar",
          color: "#ef4444",
          group: "Ketidakhadiran",
        },
        {
          value: "TL",
          label: "Tugas Luar",
          color: "#f59e0b",
          group: "Ketidakhadiran",
        },
        {
          value: "TB",
          label: "Tugas Belajar",
          color: "#a855f7",
          group: "Ketidakhadiran",
        },
        {
          value: "PD",
          label: "Perjalanan Dinas",
          color: "#f97316",
          group: "Ketidakhadiran",
        },
        {
          value: "DK",
          label: "Diklat/Pelatihan",
          color: "#ec4899",
          group: "Ketidakhadiran",
        },
        {
          value: "KN",
          label: "Konsinyasi",
          color: "#10b981",
          group: "Ketidakhadiran",
        },

        // Early leave
        {
          value: "PSW",
          label: "Pulang Sebelum Waktu",
          color: "#10b981",
          group: "Pulang Sebelum Waktu",
        },
        {
          value: "PSW1",
          label: "PSW <= 30 menit",
          color: "#22c55e",
          group: "Pulang Sebelum Waktu",
        },
        {
          value: "PSW2",
          label: "PSW 30 - 60 menit",
          color: "#16a34a",
          group: "Pulang Sebelum Waktu",
        },
        {
          value: "PSW3",
          label: "PSW 60 - 90 menit",
          color: "#15803d",
          group: "Pulang Sebelum Waktu",
        },
        {
          value: "PSW4",
          label: "PSW > 90 menit",
          color: "#166534",
          group: "Pulang Sebelum Waktu",
        },

        // Late arrival
        {
          value: "HT",
          label: "Hadir Terlambat",
          color: "#8b5cf6",
          group: "Keterlambatan",
        },
        {
          value: "TL1",
          label: "Terlambat <= 30 menit",
          color: "#fcd34d",
          group: "Keterlambatan",
        },
        {
          value: "TL2",
          label: "Terlambat 30-60 menit",
          color: "#fbbf24",
          group: "Keterlambatan",
        },
        {
          value: "TL3",
          label: "Terlambat 60-90 menit",
          color: "#f59e0b",
          group: "Keterlambatan",
        },
        {
          value: "TL4",
          label: "Terlambat > 90 menit",
          color: "#d97706",
          group: "Keterlambatan",
        },

        // Leave types
        { value: "CB", label: "Cuti Besar", color: "#3b82f6", group: "Cuti" },
        { value: "CL", label: "Cuti LTN", color: "#e879f9", group: "Cuti" },
        {
          value: "CM",
          label: "Cuti Melahirkan",
          color: "#f472b6",
          group: "Cuti",
        },
        { value: "CP", label: "Cuti Penting", color: "#14b8a6", group: "Cuti" },
        { value: "CS", label: "Cuti Sakit", color: "#6366f1", group: "Cuti" },
        {
          value: "CT 10",
          label: "Cuti 2 Tahun Lalu",
          color: "#16a34a",
          group: "Cuti",
        },
        {
          value: "CT 11",
          label: "Cuti Tahun Sekarang",
          color: "#0284c7",
          group: "Cuti",
        },
        {
          value: "CT 12",
          label: "Cuti Tahun Lalu",
          color: "#7c3aed",
          group: "Cuti",
        },
        {
          value: "CST1",
          label: "Cuti Sakit 1",
          color: "#dc2626",
          group: "Cuti",
        },
        {
          value: "CST2",
          label: "Cuti Sakit 2",
          color: "#ea580c",
          group: "Cuti",
        },

        // Work hours shortage
        {
          value: "KJK HT",
          label: "KJK Hadir Terlambat",
          color: "#0ea5e9",
          group: "Kekurangan Jam Kerja",
        },
        {
          value: "KJK PSW",
          label: "KJK Pulang Awal",
          color: "#a21caf",
          group: "Kekurangan Jam Kerja",
        },
        {
          value: "KJK",
          label: "Total KJK",
          color: "#d946ef",
          group: "Kekurangan Jam Kerja",
        },
        {
          value: "KJK Hari",
          label: "KJK (Hari)",
          color: "#9333ea",
          group: "Kekurangan Jam Kerja",
        },
      ].sort((a, b) => {
        if (a.group !== b.group) return a.group.localeCompare(b.group);
        return a.label.localeCompare(b.label);
      }),
    }),
    [data.records]
  );

  // Color mapping
  const typeColors = useMemo(
    () =>
      options.types.reduce(
        (acc, type) => ({ ...acc, [type.value]: type.color }),
        {}
      ),
    [options.types]
  );

  // Filter data dengan processData
  const filteredData = useMemo(() => {
    return processData(data.records || [], selectedEmployees, selectedYears);
  }, [data.records, selectedEmployees, selectedYears]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-gray-600">Memuat data kehadiran...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2 p-4 text-red-500 bg-white rounded-lg shadow-lg">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan logo */}
      <div className="bg-white border-b">
        <div className="container px-4 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="items-center hidden gap-2 md:flex">
                <img
                  src="images/otw@2x.png"
                  alt="Logo"
                  className="h-8 md:h-10"
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              Dashboard Kehadiran Pegawai
            </h1>
            <div className="items-center hidden gap-2 md:flex">
              {/* <img src="images/bps.png" alt="Logo" className="h-8 md:h-10" /> */}
              <img
                src="images/bpssanggau.png"
                alt="Logo"
                className="h-8 md:h-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container p-4 mx-auto space-y-6 max-w-7xl">
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
              icon={Users}
            />

            <MultiSelect
              label="Tahun"
              options={options.years}
              selected={selectedYears}
              onChange={setSelectedYears}
              icon={Calendar}
            />

            <MultiSelect
              label="Jenis Kehadiran"
              options={options.types}
              selected={selectedTypes}
              onChange={setSelectedTypes}
              colorMap={typeColors}
              icon={Clock}
            />
          </div>

          {/* Selected Employees Display */}
          {selectedEmployees.length > 0 && (
            <div className="p-3 mt-4 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Pegawai Terpilih ({selectedEmployees.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEmployees.map((employee) => (
                  <EmployeeBadge
                    key={employee}
                    name={employee}
                    onRemove={() => {
                      setSelectedEmployees(
                        selectedEmployees.filter((e) => e !== employee)
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <h2 className="font-medium">Tren Kehadiran</h2>
            </div>
            {selectedEmployees.length > 0 && (
              <div className="px-3 py-1 text-sm text-blue-600 rounded-full bg-blue-50">
                {`Data Kumulatif ${selectedEmployees.length} Pegawai`}
              </div>
            )}
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis
                  dataKey="formattedDate"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                    fontSize: "12px",
                  }}
                />
                {selectedTypes.map((type) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={typeColors[type]}
                    name={`${type} - ${
                      options.types.find((t) => t.value === type)?.label
                    }`}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <YearlyAverages
          data={filteredData}
          selectedTypes={selectedTypes}
          typeColors={typeColors}
          options={options}
          selectedEmployees={selectedEmployees}
        />

        {/* Legend and Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h2 className="font-medium">Keterangan Kehadiran</h2>
            </div>
            <div className="text-sm text-gray-600">
              {Object.entries(attendanceGroups).map(([group, items]) => (
                <div key={group} className="mb-4">
                  <h4 className="mb-2 font-medium text-gray-700">{group}</h4>
                  <div className="grid grid-cols-1 gap-2 ml-4 lg:grid-cols-2">
                    {items.map((item) => {
                      const type = options.types.find((t) => t.value === item);
                      return type ? (
                        <div key={item} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-sm">{type.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-gray-500" />
              <h2 className="font-medium">Informasi Tambahan</h2>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="mb-2 font-medium text-gray-700">
                  Perhitungan Kumulatif
                </h4>
                <ul className="ml-4 space-y-2 list-disc">
                  <li>
                    Data yang ditampilkan merupakan total dari seluruh pegawai
                    yang dipilih
                  </li>
                  <li>
                    Rata-rata per pegawai dapat dilihat pada tooltip saat hover
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-gray-700">
                  Keterangan Waktu
                </h4>
                <ul className="ml-4 space-y-2 list-disc">
                  <li>Format tanggal menggunakan MM-YY (Bulan-Tahun)</li>
                  <li>Data waktu dalam format 24 jam</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 mt-8 text-sm text-center text-gray-500 bg-white rounded-lg shadow-sm">
          <p>Dashboard Kehadiran Pegawai © {new Date().getFullYear()}</p>
          <p className="mt-1">Sistem Informasi Kepegawaian</p>
        </footer>
      </div>

      {/* Floating Info Button */}
      <button
        className="fixed p-2 text-white bg-blue-500 rounded-full shadow-lg bottom-4 right-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => {
          // Implementasi info modal jika diperlukan
        }}
      >
        <AlertCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

// CustomTooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const [mm, yy] = label.split("-");
    const monthMapping = {
      "01": "Januari",
      "02": "Februari",
      "03": "Maret",
      "04": "April",
      "05": "Mei",
      "06": "Juni",
      "07": "Juli",
      "08": "Agustus",
      "09": "September",
      10: "Oktober",
      11: "November",
      12: "Desember",
    };
    const monthName = monthMapping[mm];

    const employeeCount = payload[0]?.payload?.employees?.length || 0;
    const employeeNames = payload[0]?.payload?.employees || [];

    return (
      <div className="min-w-[300px] bg-white p-4 border rounded-lg shadow-lg">
        <div className="pb-2 mb-3 border-b">
          <p className="font-medium">{`${monthName} 20${yy}`}</p>
          <p className="mt-1 text-sm text-gray-600">
            {`${employeeCount} Pegawai Aktif`}
          </p>
        </div>

        <div className="mb-3">
          <p className="mb-1 text-sm font-medium text-gray-700">Pegawai:</p>
          <div className="overflow-y-auto max-h-24">
            {employeeNames.map((name, idx) => (
              <p key={idx} className="ml-2 text-sm text-gray-600">
                • {name}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {payload.map((entry, index) => {
            const value = entry.value;
            const average =
              employeeCount > 0 ? (value / employeeCount).toFixed(1) : 0;

            return (
              <div key={index} className="text-sm">
                <p style={{ color: entry.color }} className="font-medium">
                  {entry.name.split(" - ")[1]}
                </p>
                <div className="mt-1 ml-2">
                  <p>{`Total: ${value}`}</p>
                  <p>{`Rata-rata: ${average}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default AttendanceDashboard;
