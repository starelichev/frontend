import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DataVisualization() {
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' or 'table'
  const [period, setPeriod] = useState('last2days');
  const [dateFrom, setDateFrom] = useState('06.09.25');
  const [dateTo, setDateTo] = useState('08.09.25');
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState([]);
  const [selectedMeters, setSelectedMeters] = useState(null); // Изменено с [] на null для единичного выбора
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [data, setData] = useState([]);
  const [objects, setObjects] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [filteredMeters, setFilteredMeters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxPoints, setMaxPoints] = useState(100);

  useEffect(() => {
    fetchObjects();
    fetchDeviceTypes();
  }, []);

  useEffect(() => {
    if (selectedMeters) {
      fetchParameters();
    }
  }, [selectedMeters, filteredMeters]);

  useEffect(() => {
    // Фильтруем счетчики на основе выбранных объектов и типов устройств
    const filtered = objects
      .filter(obj => selectedObjects.length === 0 || selectedObjects.includes(obj.id))
      .flatMap(obj => obj.devices)
      .filter(device => selectedDeviceTypes.length === 0 || selectedDeviceTypes.includes(device.type));
    
    setFilteredMeters(filtered);
    setSelectedMeters(null); // Сбрасываем выбранный счетчик при изменении фильтров
  }, [selectedObjects, selectedDeviceTypes, objects]);

  // Убираем автоматическую загрузку - теперь данные загружаются только по кнопке "Применить"

  const fetchObjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/Visualization/objects`);
      setObjects(response.data);
    } catch (error) {
      console.error('Error fetching objects:', error);
    }
  };

  const fetchDeviceTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/Visualization/device-types`);
      setDeviceTypes(response.data);
    } catch (error) {
      console.error('Error fetching device types:', error);
    }
  };

  const fetchParameters = async () => {
    try {
      // Определяем тип устройства по выбранному счетчику
      let deviceType = 'electrical'; // по умолчанию
      
      if (selectedMeters) {
        const selectedDevice = filteredMeters.find(d => d.id === selectedMeters);
        if (selectedDevice && selectedDevice.type) {
          deviceType = selectedDevice.type;
        }
      }
      
      const response = await axios.get(`${API_URL}/api/Visualization/parameters/${deviceType}`);
      setParameters(response.data);
    } catch (error) {
      console.error('Error fetching parameters:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Определяем тип устройства по выбранному счетчику
      let meterType = 'electrical'; // по умолчанию
      
      if (selectedMeters) {
        const selectedDevice = filteredMeters.find(d => d.id === selectedMeters);
        if (selectedDevice && selectedDevice.type) {
          meterType = selectedDevice.type;
        }
      }
      
      const params = new URLSearchParams({
        period,
        dateFrom: period === 'custom' ? dateFrom : '',
        dateTo: period === 'custom' ? dateTo : '',
        meterType,
        meterIds: selectedMeters ? [selectedMeters] : [], // Изменено для работы с единичным выбором
        parameters: selectedParameters
      });

      const response = await axios.get(`${API_URL}/api/Visualization/data?${params}`);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleObjectToggle = (objectId) => {
    setSelectedObjects(prev => 
      prev.includes(objectId) 
        ? prev.filter(id => id !== objectId)
        : [...prev, objectId]
    );
  };

  const handleDeviceTypeToggle = (deviceType) => {
    setSelectedDeviceTypes(prev => 
      prev.includes(deviceType) 
        ? prev.filter(type => type !== deviceType)
        : [...prev, deviceType]
    );
  };

  const handleMeterToggle = (meterId) => {
    setSelectedMeters(prev => prev === meterId ? null : meterId); // Изменено для единичного выбора
  };

  const handleParameterToggle = (paramId) => {
    setSelectedParameters(prev => 
      prev.includes(paramId) 
        ? prev.filter(id => id !== paramId)
        : [...prev, paramId]
    );
  };

  const handleCreateReport = async () => {
    if (!data.length) {
      alert('Нет данных для создания отчета');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      
      // Подготавливаем данные для отчета
      const reportData = data.map(item => ({
        timestamp: new Date(item.timestamp),
        values: item.values
      }));

      const requestData = {
        type: "data_visualization",
        name: `Отчет по данным ${new Date().toLocaleDateString('ru-RU')}`,
        createdByUserId: userData?.id || null,
        parameters: selectedParameters,
        data: reportData
      };

      const response = await axios.post(`${API_URL}/api/Report/create-visualization`, requestData);
      
      if (response.data) {
        alert('Отчет успешно создан!');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Ошибка при создании отчета');
    }
  };

  const downsampleData = (rawData, maxPoints) => {
    if (rawData.length <= maxPoints) {
      return rawData;
    }

    // Sort data by timestamp to ensure proper time-based segmentation
    const sortedData = [...rawData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const segmentSize = Math.ceil(sortedData.length / maxPoints);
    const downsampledData = [];

    for (let i = 0; i < maxPoints; i++) {
      const startIndex = i * segmentSize;
      const endIndex = Math.min(startIndex + segmentSize, sortedData.length);
      const segment = sortedData.slice(startIndex, endIndex);

      if (segment.length > 0) {
        // Calculate average values for this segment
        const avgValues = {};
        const segmentKeys = Object.keys(segment[0].values || {});
        
        segmentKeys.forEach(key => {
          const values = segment.map(item => item.values[key]).filter(val => val !== null && val !== undefined);
          if (values.length > 0) {
            avgValues[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
          }
        });

        // Use the middle timestamp of the segment
        const middleIndex = Math.floor((startIndex + endIndex - 1) / 2);
        const timestamp = sortedData[middleIndex].timestamp;

        downsampledData.push({
          timestamp,
          values: avgValues
        });
      }
    }

    return downsampledData;
  };

  const formatChartData = () => {
    const downsampledData = downsampleData(data, maxPoints);
    return downsampledData.map(item => ({
      time: new Date(item.timestamp).toLocaleString('ru-RU', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: item.timestamp,
      ...item.values
    }));
  };

  const getParameterDisplayName = (paramKey) => {
    const param = parameters.find(p => p.parameters.includes(paramKey));
    return param ? param.name : paramKey;
  };

  // Группируем параметры по типам для отображения на одном графике
  const groupParametersByType = () => {
    const groups = {};
    
    selectedParameters.forEach(paramKey => {
      const param = parameters.find(p => p.parameters.includes(paramKey));
      if (param) {
        const groupKey = param.name.split(' ')[0]; // Берем первое слово как группу (например, "Напряжение", "Ток")
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push({
          key: paramKey,
          name: param.name,
          displayName: getParameterDisplayName(paramKey)
        });
      }
    });
    
    return groups;
  };

  // Функция для получения цвета для каждого типа параметра
  const getColorForType = (type, index) => {
    const colors = ['#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    return colors[index % colors.length];
  };

  const renderGraphs = () => {
    const chartData = formatChartData();
    
    if (chartData.length === 0) {
      return <div>Нет данных для отображения</div>;
    }
    
    const parameterGroups = groupParametersByType();
    if (Object.keys(parameterGroups).length === 0) {
      return <div>Нет параметров для отображения</div>;
    }
    
    return (
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <span>Максимум точек на графике:</span>
            <input
              type="number"
              min="10"
              max="1000"
              value={maxPoints}
              onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
              className="border rounded px-2 py-1 w-20"
            />
          </label>
        </div>
        
        {Object.entries(parameterGroups).map(([type, params]) => (
          <div key={type} className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{type}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.ceil(chartData.length / 20)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const item = chartData.find(item => item.time === value);
                    return item ? new Date(item.timestamp).toLocaleString('ru-RU') : value;
                  }}
                />
                <Legend />
                {params.map((param, index) => (
                  <Line
                    key={`${type}-${param.key}`}
                    type="monotone"
                    dataKey={param.key}
                    stroke={getColorForType(type, index)}
                    name={param.key}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (!data.length) return <div className="text-gray-500 text-center py-4">Нет данных</div>;

    // Создаем колонки только для выбранных параметров
    const columns = [
      { key: 'timestamp', name: 'Дата и время' },
      ...selectedParameters.map(paramKey => ({
        key: paramKey,
        name: paramKey // Изменено с getParameterDisplayName(paramKey) на paramKey для отображения конкретных параметров
      }))
    ];

    return (
      <div className="bg-white rounded border overflow-auto max-h-full">
        <table className="w-full text-sm font-open-sans">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="border p-2 text-left">{col.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="border p-2">
                    {col.key === 'timestamp' 
                      ? new Date(row.timestamp).toLocaleString()
                      : row.values[col.key]?.toFixed(3) || '0.000'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-[1515px] h-[865px] mt-[30px]">
      <div className="flex gap-6 h-full">
        {/* Left Control Panel */}
        <div className="w-72 bg-white/70 rounded-[10px] border border-neutral-400/20 p-4 flex flex-col gap-4">
          {/* Period Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3 font-open-sans text-gray-800">Период</h3>
            <div className="space-y-2">
              <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input 
                  type="radio" 
                  name="period" 
                  value="today" 
                  checked={period === 'today'}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-open-sans text-gray-700">Сегодня</span>
              </label>
              <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input 
                  type="radio" 
                  name="period" 
                  value="last2days" 
                  checked={period === 'last2days'}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-open-sans text-gray-700">Последние 2 дня</span>
              </label>
              <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input 
                  type="radio" 
                  name="period" 
                  value="last2weeks" 
                  checked={period === 'last2weeks'}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-open-sans text-gray-700">За две недели</span>
              </label>
              <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input 
                  type="radio" 
                  name="period" 
                  value="lastMonth" 
                  checked={period === 'lastMonth'}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-open-sans text-gray-700">За прошлый месяц</span>
              </label>
              <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input 
                  type="radio" 
                  name="period" 
                  value="thisMonth" 
                  checked={period === 'thisMonth'}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-open-sans text-gray-700">С начала месяца</span>
              </label>
              <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                <input 
                  type="radio" 
                  name="period" 
                  value="custom" 
                  checked={period === 'custom'}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-open-sans text-gray-700">За период:</span>
              </label>
            </div>
            
            {period === 'custom' && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="От"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="До"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Objects Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3 font-open-sans text-gray-800">Список объектов</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {objects.map((obj) => (
                <label key={obj.id} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedObjects.includes(obj.id)}
                    onChange={() => handleObjectToggle(obj.id)}
                    className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm font-open-sans text-gray-700">{obj.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Device Types Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3 font-open-sans text-gray-800">Тип устройства</h3>
            <div className="space-y-2">
              {deviceTypes.map((deviceType) => (
                <label key={deviceType.id} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDeviceTypes.includes(deviceType.type)}
                    onChange={() => handleDeviceTypeToggle(deviceType.type)}
                    className="mr-2 w-4 h-4 text-red-700 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm font-open-sans text-gray-700">
                    {deviceType.type === 'electrical' ? 'Электрические' : 
                     deviceType.type === 'gas' ? 'Газовые' : 
                     deviceType.type === 'water' ? 'Водяные' : deviceType.type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Meters Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3 font-open-sans text-gray-800">Счетчики</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filteredMeters.map((meter) => (
                <div 
                  key={meter.id} 
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedMeters === meter.id 
                      ? 'bg-red-100 border border-red-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMeterToggle(meter.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-open-sans text-gray-700 font-medium">{meter.name}</span>
                    <span className="text-xs text-gray-500">
                      {meter.type === 'electrical' ? '⚡ Электрический' : 
                       meter.type === 'gas' ? '🔥 Газовый' : 
                       meter.type === 'water' ? '💧 Водяной' : meter.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Загрузка...' : 'Применить'}
          </button>
        </div>

        {/* Central Data Display */}
        <div className="w-[865px] h-[865px] bg-white/70 rounded-[10px] border border-neutral-400/20 p-4 flex flex-col">
          {/* Tabs */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex">
              <button 
                className={`px-6 py-3 rounded-t-lg font-open-sans text-sm font-medium transition-colors ${
                  activeTab === 'graph' 
                    ? 'bg-red-700 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('graph')}
              >
                График данных
              </button>
              <button 
                className={`px-6 py-3 rounded-t-lg font-open-sans text-sm font-medium transition-colors ${
                  activeTab === 'table' 
                    ? 'bg-red-700 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('table')}
              >
                Таблица данных
              </button>
            </div>
            
            {activeTab === 'table' && data.length > 0 && (
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md font-open-sans text-sm font-medium hover:bg-green-700 transition-colors"
                onClick={handleCreateReport}
              >
                Создать отчет
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto">
            {activeTab === 'graph' ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 font-open-sans">Загрузка графиков...</div>
                  </div>
                ) : selectedParameters.length > 0 ? (
                  renderGraphs()
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 font-open-sans">Выберите параметры для отображения</div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 font-open-sans">Загрузка таблицы...</div>
                  </div>
                ) : (
                  renderTable()
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Parameters Panel */}
        <div className="w-[362px] bg-white/70 rounded-[10px] border border-neutral-400/20 p-4 flex flex-col">
          <h3 className="font-semibold text-sm mb-3 font-open-sans text-gray-800">Параметры</h3>
          
          <div className="space-y-2 flex-1 overflow-y-auto pr-2">
            {parameters.map((paramGroup) => (
              <div key={paramGroup.key} className="border-b border-gray-200 pb-3 mb-3">
                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <span className="text-sm font-open-sans font-medium text-gray-700">{paramGroup.name}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </label>
                <div className="ml-4 mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {paramGroup.parameters.map((param) => (
                    <label key={param} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedParameters.includes(param)}
                        onChange={() => handleParameterToggle(param)}
                        className="mr-2 w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="text-sm font-open-sans text-gray-600">{param}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            className="w-full bg-black text-white py-3 rounded-lg font-open-sans text-sm font-medium mt-auto hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataVisualization; 