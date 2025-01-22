import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface SubscriptionStatus {
    status: 'active' | 'inactive' | 'canceled';
    planType: string | null;
    currentPeriodEnd: string | null;
}

interface SubscriptionContextType {
    subscriptionStatus: SubscriptionStatus | null;
    isLoading: boolean;
    refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    const fetchSubscriptionStatus = async () => {
        if (!token) {
            setSubscriptionStatus(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get(`/api/subscription/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setSubscriptionStatus(response.data);
        } catch (error) {
            console.error('Error fetching subscription status:', error);
            setSubscriptionStatus(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [token]);

    const refreshStatus = async () => {
        setIsLoading(true);
        await fetchSubscriptionStatus();
    };

    return (
        <SubscriptionContext.Provider value={{ subscriptionStatus, isLoading, refreshStatus }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionContext; 