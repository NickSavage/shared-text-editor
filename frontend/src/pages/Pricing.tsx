import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Pricing: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

    const handleSubscribe = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/subscription/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    priceType: billingInterval,
                }),
            });

            const { url } = await response.json();
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-4 text-xl text-gray-600">
                        Choose the plan that best fits your needs
                    </p>
                    <div className="mt-6">
                        <div className="relative self-center rounded-lg bg-gray-200 p-0.5 flex sm:mt-8">
                            <button
                                type="button"
                                className={`relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none ${
                                    billingInterval === 'monthly'
                                        ? 'bg-white border-gray-200 shadow-sm text-gray-900'
                                        : 'border border-transparent text-gray-700'
                                }`}
                                onClick={() => setBillingInterval('monthly')}
                            >
                                Monthly billing
                            </button>
                            <button
                                type="button"
                                className={`relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none ${
                                    billingInterval === 'annual'
                                        ? 'bg-white border-gray-200 shadow-sm text-gray-900'
                                        : 'border border-transparent text-gray-700'
                                }`}
                                onClick={() => setBillingInterval('annual')}
                            >
                                Annual billing
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
                    {/* Free Tier */}
                    <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">Free</h3>
                            <p className="mt-4 text-sm text-gray-500">Perfect for getting started with basic features</p>
                            <p className="mt-8">
                                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                                <span className="text-base font-medium text-gray-500">/month</span>
                            </p>
                            <button
                                className="mt-8 block w-full bg-gray-800 text-white rounded-md py-2 text-sm font-semibold hover:bg-gray-900"
                                onClick={() => navigate('/documents')}
                            >
                                Get Started
                            </button>
                        </div>
                        <div className="px-6 pt-6 pb-8">
                            <h4 className="text-sm font-medium text-gray-900 tracking-wide">What's included:</h4>
                            <ul className="mt-6 space-y-4">
                                <li className="flex space-x-3">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Basic document editing</span>
                                </li>
                                <li className="flex space-x-3">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Up to 3 documents</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900">Pro</h3>
                            <p className="mt-4 text-sm text-gray-500">For power users who need advanced features</p>
                            <p className="mt-8">
                                <span className="text-4xl font-extrabold text-gray-900">
                                    ${billingInterval === 'monthly' ? '10' : '100'}
                                </span>
                                <span className="text-base font-medium text-gray-500">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
                                {billingInterval === 'annual' && (
                                    <span className="ml-2 text-sm text-green-500">Save 17%</span>
                                )}
                            </p>
                            <button
                                className="mt-8 block w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700"
                                onClick={handleSubscribe}
                            >
                                Subscribe
                            </button>
                        </div>
                        <div className="px-6 pt-6 pb-8">
                            <h4 className="text-sm font-medium text-gray-900 tracking-wide">What's included:</h4>
                            <ul className="mt-6 space-y-4">
                                <li className="flex space-x-3">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Everything in Free</span>
                                </li>
                                <li className="flex space-x-3">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Unlimited documents</span>
                                </li>
                                <li className="flex space-x-3">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Advanced collaboration features</span>
                                </li>
                                <li className="flex space-x-3">
                                    <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Priority support</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing; 