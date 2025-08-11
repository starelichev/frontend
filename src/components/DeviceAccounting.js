import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5165';

// Функция для преобразования названий параметров в читаемый вид
const getParameterDisplayName = (paramName) => {
  const displayNames = {
    'UL1N': 'U L1-N',
    'UL2N': 'U L2-N', 
    'UL3N': 'U L3-N',
    'UL1L2': 'U L1-L2',
    'UL2L3': 'U L2-L3',
    'UL3L1': 'U L3-L1',
    'IL1': 'I L1',
    'IL2': 'I L2',
    'IL3': 'I L3',
    'PL1': 'P L1',
    'PL2': 'P L2',
    'PL3': 'P L3',
    'PSum': 'P Sum',
    'QL1': 'Q L1',
    'QL2': 'Q L2',
    'QL3': 'Q L3',
    'QSum': 'Q Sum',
    'AllEnergy': 'All Energy',
    'ReactiveEnergySum': 'Reactive Energy Sum',
    'Freq': 'Frequency',
    'Aq1': 'Aq L1',
    'Aq2': 'Aq L2',
    'Aq3': 'Aq L3',
    'FundPfCf1': 'Fund PF Cf L1',
    'FundPfCf2': 'Fund PF Cf L2',
    'FundPfCf3': 'Fund PF Cf L3',
    'RotationField': 'Rotation Field',
    'RqcL1': 'Rqc L1',
    'RqcL2': 'Rqc L2',
    'RqcL3': 'Rqc L3',
    'RqdL1': 'Rqd L1',
    'RqdL2': 'Rqd L2',
    'RqdL3': 'Rqd L3',
    'ReactQIL1': 'React QI L1',
    'ReactQIL2': 'React QI L2',
    'ReactQIL3': 'React QI L3',
    'ReactQCL1': 'React QC L1',
    'ReactQCL2': 'React QC L2',
    'ReactQCL3': 'React QC L3',
    'HUL1': 'H U L1',
    'HUL2': 'H U L2',
    'HUL3': 'H U L3',
    'HIL1': 'H I L1',
    'HIL2': 'H I L2',
    'HIL3': 'H I L3',
    'Angle1': 'Angle 1',
    'Angle2': 'Angle 2',
    'Angle3': 'Angle 3',
    'AllEnergyK': 'All Energy K'
  };
  
  return displayNames[paramName] || paramName;
};

// Функция для получения единиц измерения параметров
const getParameterUnit = (paramName) => {
  const units = {
    'UL1N': 'V',
    'UL2N': 'V',
    'UL3N': 'V',
    'UL1L2': 'V',
    'UL2L3': 'V',
    'UL3L1': 'V',
    'IL1': 'A',
    'IL2': 'A',
    'IL3': 'A',
    'PL1': 'W',
    'PL2': 'W',
    'PL3': 'W',
    'PSum': 'W',
    'QL1': 'var',
    'QL2': 'var',
    'QL3': 'var',
    'QSum': 'var',
    'AllEnergy': 'kWh',
    'ReactiveEnergySum': 'kvarh',
    'Freq': 'Hz',
    'Aq1': 'VA',
    'Aq2': 'VA',
    'Aq3': 'VA',
    'FundPfCf1': '',
    'FundPfCf2': '',
    'FundPfCf3': '',
    'RotationField': '',
    'RqcL1': 'kWh',
    'RqcL2': 'kWh',
    'RqcL3': 'kWh',
    'RqdL1': 'kWh',
    'RqdL2': 'kWh',
    'RqdL3': 'kWh',
    'ReactQIL1': 'kvarh',
    'ReactQIL2': 'kvarh',
    'ReactQIL3': 'kvarh',
    'ReactQCL1': 'kvarh',
    'ReactQCL2': 'kvarh',
    'ReactQCL3': 'kvarh',
    'HUL1': '%',
    'HUL2': '%',
    'HUL3': '%',
    'HIL1': '%',
    'HIL2': '%',
    'HIL3': '%',
    'Angle1': '°',
    'Angle2': '°',
    'Angle3': '°',
    'AllEnergyK': 'kWh'
  };
  
  return units[paramName] || '';
};

function DeviceAccounting() {
  const [devices, setDevices] = useState([]);
  const [objects, setObjects] = useState([]);
  const [tab, setTab] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(false);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  // SignalR подключение
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/notificationHub`)
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('SignalR Connected');
          connection.invoke('JoinNotificationGroup');
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      // Обработчик обновлений данных устройств
      connection.on('DeviceDataUpdate', (deviceData) => {
        console.log(`Received device data update at ${new Date().toLocaleTimeString()}:`, deviceData);
        updateDeviceData(deviceData);
      });

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  const updateDeviceData = (deviceData) => {
    setDevices(prevDevices => {
      return prevDevices.map(device => {
        const updatedDevice = deviceData.find(d => d.deviceId === device.id);
        if (updatedDevice) {
          // Преобразуем все параметры в правильный формат
          const formattedParams = Object.entries(updatedDevice.averageValues).map(([key, value]) => ({
            name: getParameterDisplayName(key),
            shortName: key,
            fullName: getParameterDisplayName(key),
            value: value.toString(),
            unit: getParameterUnit(key)
          }));

          return {
            ...device,
            statusColor: updatedDevice.statusColor,
            params: formattedParams
          };
        }
        return device;
      });
    });

    // Также обновляем данные в модальном окне, если оно открыто
    if (selectedDevice && showModal) {
      const updatedDevice = deviceData.find(d => d.deviceId === selectedDevice.deviceId);
      if (updatedDevice) {
        const formattedParameters = Object.entries(updatedDevice.averageValues).map(([key, value]) => ({
          name: getParameterDisplayName(key),
          shortName: key,
          fullName: getParameterDisplayName(key),
          value: value.toString(),
          unit: getParameterUnit(key)
        }));

        setSelectedDevice(prev => ({
          ...prev,
          isActive: updatedDevice.statusColor === 'green',
          lastReading: updatedDevice.lastUpdate,
          parameters: formattedParameters
        }));
      }
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/Device/dashboard`);
      // Сохраняем объекты
      setObjects(response.data.objects || []);
      // Извлекаем устройства из структуры ответа
      const allDevices = response.data.objects?.flatMap(obj => 
        obj.devices?.map(dev => ({ ...dev, object: obj.name })) || []
      ) || [];
      setDevices(allDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      // Mock data for development
      const mockObjects = [
        { id: 1, name: 'Объект 1' },
        { id: 2, name: 'Объект 2' },
        { id: 3, name: 'Объект 3' }
      ];
      setObjects(mockObjects);
      setDevices([
        {
          id: 1,
          name: 'Прибор 1',
          object: 'Объект 1',
          params: [
            { name: 'Ур. воды', value: '2' },
            { name: 'T° улицы', value: '-5.232' },
            { name: 'T° под. сети', value: '23.222' },
            { name: 'T° под. конт.', value: '33.545' },
            { name: 'T° котла №1', value: '45.656' },
            { name: 'T° котла №2', value: '54.655' },
            { name: 'Насос котлов', value: '3' }
          ]
        },
        {
          id: 2,
          name: 'Прибор 2',
          object: 'Объект 2',
          params: []
        },
        {
          id: 3,
          name: 'Прибор 3',
          object: 'Объект 1',
          params: []
        }
      ]);
    }
  };

  const handleDeviceClick = async (deviceId) => {
    setLoadingDevice(true);
    try {
      const response = await axios.get(`${API_URL}/api/Device/device/${deviceId}/details`);
      setSelectedDevice(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching device details:', error);
      // Показываем базовую информацию об устройстве, если детали не загрузились
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        setSelectedDevice({
          deviceId: device.id,
          deviceName: device.deviceName || device.name,
          objectName: device.object,
          isActive: device.statusColor === 'green',
          lastReading: null,
          parameters: device.params || []
        });
        setShowModal(true);
      }
    } finally {
      setLoadingDevice(false);
    }
  };

  return (
    <div className="w-[1515px] h-[865px] bg-white rounded-[10px] border border-neutral-400/20 mt-[30px] p-6">
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
          className={`w-32 h-8 px-4 py-1 rounded-[100px] inline-flex justify-start items-center gap-2.5 ${tab === 0 ? 'bg-red-700' : 'bg-white border border-gray-300'}`} 
          onClick={() => setTab(0)}
        >
          <div className={`text-center justify-start text-sm font-semibold font-open-sans ${tab === 0 ? 'text-white' : 'text-black'}`}>
            Все приборы
          </div>
        </button>
        {objects.map((obj, idx) => (
          <button 
            key={obj.id} 
            className={`w-32 h-8 px-4 py-1 rounded-[100px] inline-flex justify-start items-center gap-2.5 ${tab === idx + 1 ? 'bg-red-700' : 'bg-white border border-gray-300'}`}
            onClick={() => setTab(idx + 1)}
          >
            <div className={`text-center justify-start text-sm font-semibold font-open-sans ${tab === idx + 1 ? 'text-white' : 'text-black'}`}>
              {obj.name}
            </div>
          </button>
        ))}
      </div>

      {/* Divider Line */}
      <div className="w-[845px] h-0 outline outline-1 outline-offset-[-0.50px] outline-black/10 mb-8"></div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-5 gap-4 overflow-y-auto max-h-[700px]">
        {devices && devices.length > 0 ? (tab === 0 ? devices : devices.filter(dev => dev.object === objects[tab - 1]?.name)).map((dev, idx) => (
          <div 
            key={dev.id} 
            className="w-64 h-80 bg-white rounded-[10px] border border-neutral-400/50 cursor-pointer hover:shadow-md p-4 flex flex-col"
            onClick={() => handleDeviceClick(dev.id)}
          >
            {/* Card Header with adaptive white pill */}
            <div className={`w-full h-8 ${dev.statusColor === 'green' ? 'bg-green-700' : 'bg-red-700'} rounded-[10px] flex items-center px-2 mb-3`}>
              <div className="h-6 bg-white rounded-lg flex items-center justify-center px-2 min-w-fit">
                <div className="opacity-70 justify-start text-black text-sm font-semibold font-open-sans whitespace-nowrap">
                  {dev.object || `Объект ${Math.floor(idx / 3) + 1}`}
                </div>
              </div>
            </div>
            
            {/* Device Title */}
            <h3 className="font-bold mb-3 text-sm text-black font-open-sans truncate">{dev.deviceName || dev.name || `Прибор ${idx + 1}`}</h3>
            
            {/* Divider Line */}
            <div className="w-full h-0 outline outline-1 outline-offset-[-0.50px] outline-black/10 mb-3"></div>
            
            {/* Parameters */}
            <div className="space-y-1 flex-1">
              {dev.params && dev.params.length > 0 ? (
                dev.params.slice(0, 6).map((param, paramIdx) => (
                  <div key={paramIdx} className="flex justify-between items-center">
                    <div className="opacity-50 justify-start text-black text-xs font-normal font-open-sans">
                      {param.name}:
                    </div>
                    <span className="text-black font-medium text-xs font-open-sans">
                      {param.value}{param.unit && ` ${param.unit}`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4 font-open-sans text-sm">
                  Данных нет
                </div>
              )}
              {dev.params && dev.params.length > 6 && (
                <div className="text-gray-400 text-center text-xs font-open-sans">
                  +{dev.params.length - 6} параметров
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-5 flex items-center justify-center text-gray-500 font-open-sans">
            Загрузка устройств...
          </div>
        )}
      </div>

      {/* Device Details Modal */}
      {showModal && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedDevice.deviceName || 'Устройство'}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingDevice ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Загрузка данных устройства...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Основная информация</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{selectedDevice.deviceId || 'Не указан'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Название:</span>
                        <span className="font-medium">{selectedDevice.deviceName || 'Не указано'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Объект:</span>
                        <span className="font-medium">{selectedDevice.objectName || 'Не указан'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Статус</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Статус:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedDevice.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedDevice.isActive ? 'Онлайн' : 'Офлайн'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Последнее обновление:</span>
                        <span className="font-medium">
                          {selectedDevice.lastReading 
                            ? new Date(selectedDevice.lastReading).toLocaleString('ru-RU')
                            : 'Неизвестно'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Параметры устройства</h3>
                  {selectedDevice.parameters && selectedDevice.parameters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedDevice.parameters.map((param, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{param.fullName || param.shortName}</span>
                            <span className="text-xs text-gray-500">{param.shortName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-lg">{param.value}</span>
                            {param.unit && <span className="text-xs text-gray-500 ml-1">{param.unit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">Параметры не найдены</p>
                      <p className="text-sm">Данные для этого устройства отсутствуют</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceAccounting; 