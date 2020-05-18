import { useState, useCallback, useEffect } from 'react';
import Constants from '../util/Constants';

let logoutTimer; // should not be rerendered with any component, not a state of
                 // any component, instead it's a global variable

export const useAuth = () => {
    const [token, setToken] = useState();
    const [tokenExpirationDate, setTokenExpirationDate] = useState();
    const [userId, setUserId] = useState();
  
    const login = useCallback((uid, token, expirationDate) => {
      setToken(token);
      setUserId(uid);
  
      // It's a constant rather than the state variable tokenExpirationDate defined above,
      // scope, shadowed.
      const tokenExpirationDate = expirationDate || new Date(
        new Date().getTime() + Constants.HOUR_MILLISECONDS * Constants.EXPIRATION
      );
      setTokenExpirationDate(tokenExpirationDate);
  
      localStorage.setItem(
        Constants.USERDATA,
        JSON.stringify({
          userId: uid,
          token: token,
          expiration: tokenExpirationDate.toISOString()
        })
      );
    }, []);
  
    useEffect(() => { // auto log in
      const storedData = JSON.parse(localStorage.getItem(Constants.USERDATA));
      if (storedData && storedData.token && new Date(storedData.expiration) > new Date()) {
        login(storedData.userId, storedData.token, new Date(storedData.expiration));
      }
    }, [login]); // it only runs once because login is wrapped by useCallback
  
    const logout = useCallback(() => {
      setToken(null);
      setUserId(null);
      setTokenExpirationDate(null);
      localStorage.removeItem(Constants.USERDATA);
    }, []);
  
    useEffect(() => { // auto log out
      // token changes, either log in or out, but if out then it skips this if statement
      // because token will be set to null, but enter the else block.
      if (token && tokenExpirationDate) {
        const remainingTime = tokenExpirationDate.getTime() - new Date().getTime();
        logoutTimer = setTimeout(logout, remainingTime);
      } else {
        clearTimeout(logoutTimer); // prevent resource leak
      }
    }, [token, logout, tokenExpirationDate]); // logout only runs once due to using useCallback

    return { token, userId, login, logout };
};
