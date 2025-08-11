import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5165';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/Report/list`);
            setReports(response.data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            // Mock data for development
            setReports([
                {
                    id: 1,
                    name: '№1',
                    createdAt: '2024-04-10T12:65:00',
                    createdByUserName: 'Прохорцев',
                    createdByUserSurname: 'Сергей'
                },
                {
                    id: 2,
                    name: '№2',
                    createdAt: '2024-04-10T12:65:00',
                    createdByUserName: 'Прохорцев',
                    createdByUserSurname: 'Сергей'
                },
                {
                    id: 3,
                    name: '№3',
                    createdAt: '2024-04-10T12:65:00',
                    createdByUserName: 'Прохорцев',
                    createdByUserSurname: 'Сергей'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (reportId) => {
        try {
            const response = await axios.get(`${API_URL}/api/Report/download/${reportId}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${reportId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Ошибка при скачивании отчета');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }) + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-[1515px] h-[865px] bg-white rounded-[10px] border border-neutral-400/20 mt-[30px] p-6">
            <div className="flex gap-6 h-full">
                {/* Left Panel - Filters */}
                <div className="w-80 bg-gray-50 rounded-lg p-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold mb-4">Группа объектов</h3>
                    
                    {/* Object Group Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Группа объектов:
                        </label>
                        <select className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Все объекты</option>
                            <option value="1">КВТ-Юг</option>
                            <option value="2">КВТ-Север</option>
                            <option value="3">КВТ-Запад</option>
                        </select>
                    </div>

                    {/* Period Type Filter */}
                    <div className="mb-4">
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="periodType"
                                    value="new"
                                    defaultChecked
                                    className="mr-2"
                                />
                                <span className="text-sm">Только новые</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="periodType"
                                    value="week"
                                    className="mr-2"
                                />
                                <span className="text-sm">За неделю</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="periodType"
                                    value="month"
                                    className="mr-2"
                                />
                                <span className="text-sm">За месяц</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="periodType"
                                    value="custom"
                                    className="mr-2"
                                />
                                <span className="text-sm">За период:</span>
                            </label>
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="mb-4 space-y-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                с:
                            </label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                defaultValue="2025-09-06"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                по:
                            </label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                defaultValue="2025-09-08"
                            />
                        </div>
                    </div>

                    {/* Apply Button */}
                    <button className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50">
                        Применить
                    </button>
                </div>

                {/* Right Panel - Reports Table */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Отчеты</h3>
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1">
                        <div className="overflow-x-auto overflow-y-auto h-full">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-64">Название файла</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-48">Дата и время создания отчета</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-64">Кто создал данный отчет</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reports.map((report, index) => (
                                        <tr key={report.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDownload(report.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Скачать отчет"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </button>
                                                    {report.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(report.createdAt)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.createdByUserName} {report.createdByUserSurname}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {reports.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500 flex-shrink-0">
                            Отчеты не найдены
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports; 