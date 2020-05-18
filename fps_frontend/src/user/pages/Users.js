import React, { useEffect, useState } from 'react';

import UsersList from '../components/UsersList';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';
import { useHttpClient } from '../../shared/hooks/http-hook';

const Users = () => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [ loadedUsers, setLoadedUsers ] = useState(); // or useState(undefined);

  // Dependencies array being empty means it only runs ONCE - never reruns. That
  // is just what we need, we just want it to run at the first loading phase.
  // Without the wrapper useEffect(), you'll find the fecth method will be called
  // at least TWICE.

  // The callback including the lambda as the argument of useEffect() shouldn't
  // use async as a qualifier, because we don't want it to reutrn a promise,
  // which is against what useEffect() expects here.
  useEffect(() => {
    // NO async() => {} here. But we can have a trick - use it inside
    const fetchUsers = async () => {
      try {
        const responseData = await sendRequest(`${process.env.REACT_APP_BACKEND_URL}/users`);
        setLoadedUsers(responseData.users);
      } catch (err) {}
    };

    fetchUsers();
  }, [sendRequest]);

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className='center'><LoadingSpinner asOverlay /></div>
      )}
      {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
    </React.Fragment>
  );
};

export default Users;
