import { create } from 'zustand';
import { getPrincipal } from '../apis/generated/account-controller/account-controller';
import { getAccessToken } from '../apis/custom-instance';

export const usePrincipalStore = create((set) => ({
    principal: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    clearPrincipal: () =>
        set({
            principal: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        }),
    fetchPrincipal: async () => {
        const token = getAccessToken();
        if (!token) {
            set({
                principal: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            return null;
        }

        set({ isLoading: true, error: null });
        try {
            const response = await getPrincipal();
            const payload = response?.data;

            if (payload?.status === 'success' && payload?.data) {
                set({
                    principal: payload.data,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
                return payload.data;
            }

            set({
                principal: null,
                isAuthenticated: false,
                isLoading: false,
                error: payload?.message || '인증 사용자 조회에 실패했습니다.',
            });
            return null;
        } catch (error) {
            set({
                principal: null,
                isAuthenticated: false,
                isLoading: false,
                error: error?.message || '인증 사용자 조회 중 오류가 발생했습니다.',
            });
            return null;
        }
    },
}));
