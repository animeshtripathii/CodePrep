import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { checkAuthStatus } from '../app/features/auth/authSlice';
import { toast } from 'react-hot-toast';

const Plans = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPlanId, setProcessingPlanId] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axiosClient.get('/plan/all');
                setPlans(response.data);
            } catch (err) {
                console.error("Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSubscribe = async (planId) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        toast("Coming soon!", {
            icon: '🚀',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
        return;

        /*
        try {
            setProcessingPlanId(planId);
            
            const orderRes = await axiosClient.post('/payment/create-order', { planId });
            const { razorpayOrderId, amount, currency } = orderRes.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
                amount: amount, // Backend now correctly sends this as paise
                currency: currency,
                name: 'CodePrep',
                description: 'Subscription Plan Upgrade',
                order_id: razorpayOrderId,
                handler: async function (response) {
                    try {
                        await axiosClient.post('/payment/verify-user-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        toast.success("Payment successful! Your tokens have been updated.");
                        dispatch(checkAuthStatus());
                        navigate('/dashboard');
                    } catch (err) {
                        console.error("Verification failed:", err);
                        toast.success("Payment succeeded but we couldn't verify it instantly. Your tokens will be updated shortly.");
                        navigate('/dashboard');
                    }
                },
                prefill: {
                    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '',
                    email: user?.email || '',
                    contact: "9999999999" 
                },
                theme: {
                    color: '#13ec5b' 
                },
                modal: {
                    ondismiss: function() {
                        setProcessingPlanId(null);
                    }
                }
            };
console.log("RAZORPAY OPTIONS:", options);
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                toast.error("Payment failed. Please try again.");
                setProcessingPlanId(null);
            });
            rzp.open();

        } catch (err) {
            console.error("Payment initiation failed:", err);
            toast.error("Failed to initiate payment. Please try again later.");
            setProcessingPlanId(null);
        }
        */
    };

    return (
        <div className="text-slate-200 min-h-[calc(100vh-61px)] flex flex-col font-sans antialiased selection:bg-indigo-500/30 relative overflow-hidden bg-[#050914]">
            <div className="absolute top-[-15%] left-[-10%] w-[42rem] h-[42rem] bg-[#0EA5E9]/10 rounded-full blur-[130px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[38rem] h-[38rem] bg-[#6366F1]/14 rounded-full blur-[130px] -z-10 pointer-events-none"></div>

            <main className="flex-1 flex flex-col items-center py-16 px-4 relative z-10">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                <div className="text-center max-w-2xl mb-16">
                    <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4 text-white drop-shadow-md">
                        Choose Your <span className="text-indigo-300 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">Pro</span> Plan
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Unlock premium features, get more tokens for our AI assistant, and accelerate your coding preparation.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-400 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                        {plans.map((plan, index) => {
                            const isPopular = index === 1; 
                            
                            return (
                                <div 
                                    key={plan._id} 
                                    className={`relative flex flex-col p-8 rounded-3xl border glass-card transition-all duration-300 ${isPopular ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-indigo-500/10 scale-105 z-10' : 'border-white/10 bg-[#0a0f1d]/45 hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]'}`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-400 text-[#0a0f1d] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                            Most Popular
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6 text-white">
                                        <span className="text-4xl font-black">₹{plan.price}</span>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-4 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <span className="text-slate-300 font-medium">{plan.tokens} Base Tokens</span>
                                        </div>
                                        {plan.bonusTokens > 0 && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[14px]">star</span>
                                                </div>
                                                <span className="text-slate-300 font-medium">+{plan.bonusTokens} Bonus Tokens</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <span className="text-slate-300 font-medium">Access to premium content</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <span className="text-slate-300 font-medium">Priority AI Assistance</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleSubscribe(plan._id)}
                                        disabled={processingPlanId === plan._id}
                                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                            isPopular 
                                                ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                                                : 'bg-white/8 text-white hover:bg-white/14 border border-white/10'
                                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                                    >
                                        {processingPlanId === plan._id ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                                Processing...
                                            </>
                                        ) : 'Get Started'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Plans;