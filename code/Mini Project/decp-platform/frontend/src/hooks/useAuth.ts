import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '@store';
import { setCredentials, logout, setLoading, updateToken } from '@features/authSlice';
import { useGetMeQuery, useRefreshTokenMutation, useLogoutMutation } from '@services/authApi';
import { addToast } from '@features/uiSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, token, refreshToken } = useSelector(
    (state: RootState) => state.auth
  );

  const { data, error, isLoading: isFetching, refetch } = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const [refreshTokenMutation] = useRefreshTokenMutation();
  const [logoutMutation] = useLogoutMutation();

  const normalizeUser = useCallback((rawUser: any) => {
    const userId = rawUser?._id || rawUser?.id || '';

    return {
      ...rawUser,
      _id: userId,
      id: userId,
      role: rawUser?.role || 'student',
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Call logout API if we have a refresh token
      if (refreshToken) {
        await logoutMutation({ refreshToken }).unwrap();
      }
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      // Always clear local state
      dispatch(logout());
      dispatch(addToast({ message: 'Logged out successfully', type: 'info' }));
      navigate('/login');
    }
  }, [dispatch, navigate, refreshToken, logoutMutation]);

  const handleRefreshToken = useCallback(async () => {
    if (!refreshToken) {
      handleLogout();
      return;
    }
    
    try {
      const response = await refreshTokenMutation({ refreshToken }).unwrap();
      if (response.data?.accessToken) {
        dispatch(updateToken(response.data.accessToken));
        // Also update refresh token if provided
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        refetch();
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      handleLogout();
    }
  }, [refreshToken, refreshTokenMutation, dispatch, refetch, handleLogout]);

  useEffect(() => {
    if (data?.data?.user) {
      dispatch(
        setCredentials({
          user: normalizeUser(data.data.user),
          token: token as string,
          refreshToken: refreshToken || undefined,
        })
      );
    } else if (error) {
      const errorStatus = (error as any)?.status;
      if (errorStatus === 401 && refreshToken) {
        handleRefreshToken();
      } else {
        dispatch(setLoading(false));
      }
    } else if (!token) {
      dispatch(setLoading(false));
    }
  }, [data, error, token, refreshToken, dispatch, normalizeUser, handleRefreshToken]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isFetching,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
  };
};

export default useAuth;
