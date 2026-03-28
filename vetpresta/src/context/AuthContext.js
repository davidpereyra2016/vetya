import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  const login = async (email, password) => {
    // En una implementación real, aquí se conectaría con la API
    // Por ahora simulamos un login exitoso
    setIsLoading(true);
    try {
      const userData = {
        id: '1',
        email,
        name: 'Usuario Ejemplo',
      };
      
      // Guardamos los datos del usuario y el token
      await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', 'dummy-auth-token');
      
      setUserInfo(userData);
      setUserToken('dummy-auth-token');
      
      // Verificamos si es la primera vez que el usuario inicia sesión
      const firstTime = await AsyncStorage.getItem('firstTimeLogin');
      if (!firstTime) {
        await AsyncStorage.setItem('firstTimeLogin', 'false');
        setIsFirstTime(true);
      } else {
        setIsFirstTime(false);
      }
    } catch (error) {
      console.log('Error en el inicio de sesión: ', error);
    }
    setIsLoading(false);
  };

  const register = async (name, email, password) => {
    // Simulación de registro
    setIsLoading(true);
    try {
      const userData = {
        id: '1',
        email,
        name,
      };
      
      await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', 'dummy-auth-token');
      await AsyncStorage.setItem('firstTimeLogin', 'false');
      
      setUserInfo(userData);
      setUserToken('dummy-auth-token');
      setIsFirstTime(true);
    } catch (error) {
      console.log('Error en el registro: ', error);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.log('Error en el cierre de sesión: ', error);
    }
    setUserInfo(null);
    setUserToken(null);
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userInfo = await AsyncStorage.getItem('userInfo');
      let userToken = await AsyncStorage.getItem('userToken');
      
      if (userInfo) {
        setUserInfo(JSON.parse(userInfo));
        setUserToken(userToken);
        
        // Verificamos si es la primera vez que el usuario inicia sesión
        const firstTime = await AsyncStorage.getItem('firstTimeLogin');
        if (firstTime === 'false') {
          setIsFirstTime(false);
        } else {
          setIsFirstTime(true);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.log('Error al verificar el estado de sesión: ', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        login, 
        logout, 
        register, 
        isLoading, 
        userToken, 
        userInfo, 
        isFirstTime, 
        setIsFirstTime 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
