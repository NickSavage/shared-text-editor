import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SubscriptionSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/documents');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 48 48"
                        >
                            <circle
                                className="opacity-25"
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M16.707 22.293a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414L22 27.586l-5.293-5.293z"
                            />
                        </svg>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Subscription Successful!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Thank you for subscribing. You will be redirected to your documents in a few seconds.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionSuccess; 