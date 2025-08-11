import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash2, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Administration() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(true);
  
  // Форма добавления/редактирования
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    name: '',
    surname: '',
    patronymic: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/Admin/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data for development
      setUsers([
        {
          id: 1,
          login: 'serg1122',
          password: 'dsfyfdsf345345',
          email: 'sp@gmail.com',
          name: 'Сергей',
          surname: 'Прохорцев',
          patronymic: 'Сергеевич',
          phone: '+7 876 766 67 67'
        },
        {
          id: 2,
          login: 'serg1122',
          password: 'dsfyfdsf345345',
          email: 'sp@gmail.com',
          name: 'Сергей',
          surname: 'Прохорцев',
          patronymic: 'Сергеевич',
          phone: '+7 876 766 67 67'
        },
        {
          id: 3,
          login: 'serg1122',
          password: 'dsfyfdsf345345',
          email: 'sp@gmail.com',
          name: 'Сергей',
          surname: 'Прохорцев',
          patronymic: 'Сергеевич',
          phone: '+7 876 766 67 67'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      login: '',
      password: '',
      email: '',
      name: '',
      surname: '',
      patronymic: '',
      phone: ''
    });
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Обновление пользователя
        await axios.put(`${API_URL}/api/Admin/users/${editingUser.id}`, formData);
      } else {
        // Создание нового пользователя
        await axios.post(`${API_URL}/api/Admin/users`, formData);
      }
      
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Ошибка при сохранении пользователя');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      login: user.login,
      password: user.password,
      email: user.email,
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic,
      phone: user.phone
    });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/Admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  return (
    <div className="w-[1515px] h-[865px] bg-white rounded-[10px] border border-neutral-400/20 mt-[30px] p-6">
      <div className="flex gap-6 h-full">
        {/* Левая панель - Форма добавления */}
        <div className="w-80 bg-white/70 rounded-[10px] border border-neutral-400/20 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold font-open-sans text-gray-800">
              {editingUser ? 'Редактирование пользователя' : 'Добавление пользователей'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Имя
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Имя"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Фамилия
              </label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Фамилия"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Отчество
              </label>
              <input
                type="text"
                name="patronymic"
                value={formData.patronymic}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Отчество"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Телефон
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Телефон"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Логин
              </label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Логин"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-open-sans">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-open-sans"
                placeholder="Пароль"
                required={!editingUser}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-open-sans text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {editingUser ? 'Сохранить' : 'Добавить'}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-open-sans text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Правая панель - Таблица пользователей */}
        <div className="flex-1 bg-white/70 rounded-[10px] border border-neutral-400/20 p-4">
          <h2 className="text-lg font-semibold font-open-sans text-gray-800 mb-4">
            Все пользователи
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500 font-open-sans">Загрузка пользователей...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Действия
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Логин
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Пароль
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Имя
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Фамилия
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Отчество
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 font-open-sans border-b">
                      Телефон
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.login}</td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.password}</td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.email}</td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.name}</td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.surname}</td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.patronymic}</td>
                      <td className="px-4 py-3 text-sm font-open-sans">{user.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Administration; 