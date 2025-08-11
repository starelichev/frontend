import React, { useState, useEffect } from "react";
import logo from "./icons/logo.svg";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Проверяем, авторизован ли пользователь
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && userData.id) {
          navigate('/dashboard');
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/Auth/login`, { login, password });
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      
      // Создаем запись о входе в систему
      try {
        await axios.post(`${API_URL}/api/UserActions/create`, {
          UserId: user.id,
          ActionId: 3, // ID действия "Вход в систему"
          Description: `Пользователь ${user.name} ${user.surname} вошел в систему`
        });
      } catch (logError) {
        console.error("Ошибка при логировании входа:", logError);
        // Не прерываем процесс входа, если логирование не удалось
      }
      
      navigate("/dashboard");
      alert("Успешная авторизация!");
      // window.location = "/";
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Ошибка соединения с сервером");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="relative w-full max-w-[400px]">
        {/* Main card */}
        <div className="bg-white rounded-[10px] border border-[#e3e3e3] shadow-[0_2px_3.1px_0_rgba(2,2,2,0.10)] px-6 py-8 relative">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="logo" className="w-32" />
          </div>

          {/* Title */}
          <h1 className="text-center text-[18px] font-semibold text-black mb-8">
            Авторизация
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Login field */}
            <div className="mb-6">
              <label className="block text-[16px] text-black opacity-50 mb-2">
                Логин
              </label>
              <div className="relative">
            <input
                  type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
                  placeholder="Введите логин"
                  className="w-full h-[60px] px-6 rounded-full border border-[#eaeaea] bg-white/5 text-[16px] text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/10"
              autoComplete="username"
            />
          </div>
            </div>

            {/* Password field */}
            <div className="mb-10">
              <label className="block text-[16px] text-black opacity-50 mb-2">
                Пароль
              </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
                  className="w-full h-[50px] px-6 pr-12 rounded-full border border-[#eaeaea] bg-white/5 text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              autoComplete="current-password"
            />
                {/* Password dots or text */}
                {!showPassword && password && (
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex gap-1">
                    {Array.from({ length: Math.min(password.length, 8) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full bg-black opacity-50"
                      />
                    ))}
                  </div>
                )}
                {/* Eye toggle button */}
            <button
              type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black"
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
              {showPassword ? (
                      <path 
                        d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" 
                        stroke="black" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    ) : (
                      <>
                        <path 
                          d="M10.73 5.073C11.1516 5.02419 11.5756 4.99982 12 5C16.664 5 20.4 7.903 22 12C21.6126 12.9966 21.0893 13.9348 20.445 14.788M6.52 6.519C4.48 7.764 2.9 9.693 2 12C3.6 16.097 7.336 19 12 19C13.9321 19.0102 15.8292 18.484 17.48 17.48M9.88 9.88C9.6014 10.1586 9.3804 10.4893 9.22963 10.8534C9.07885 11.2174 9.00125 11.6075 9.00125 12.0015C9.00125 12.3955 9.07885 12.7856 9.22963 13.1496C9.3804 13.5137 9.6014 13.8444 9.88 14.123C10.1586 14.4016 10.4893 14.6226 10.8534 14.7734C11.2174 14.9242 11.6075 15.0018 12.0015 15.0018C12.3955 15.0018 12.7856 14.9242 13.1496 14.7734C13.5137 14.6226 13.8444 14.4016 14.123 14.123" 
                          stroke="black" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M4 4L20 20" 
                          stroke="black" 
                          strokeWidth="1.5" 
                          strokeLinecap="round"
                        />
                      </>
                    )}
                    {showPassword && (
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="3" 
                        stroke="black" 
                        strokeWidth="1.5"
                      />
                    )}
                  </svg>
            </button>
          </div>
            </div>

            {/* Login button */}
          <button
            type="submit"
              className="w-full h-[41px] bg-[#070707] text-white text-[14px] font-semibold rounded-full mb-4 hover:bg-black/90 transition-colors"
          >
            Войти
          </button>
        </form>

          {/* Register link */}
          <div className="text-center">
            <button className="text-[16px] font-medium text-black opacity-50 underline hover:opacity-70 transition-opacity">
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 