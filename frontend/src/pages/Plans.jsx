import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
        <div className="bg-[#f8fcf9] text-[#0d1b12] min-h-screen flex flex-col font-sans antialiased selection:bg-[#13ec5b]/30">
            <Navbar />
            
            <main className="flex-1 flex flex-col items-center py-16 px-4">
                <div className="text-center max-w-2xl mb-16">
                    <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
                        Choose Your <span className="text-[#13ec5b]">Pro</span> Plan
                    </h1>
                    <p className="text-[#4c9a66] text-lg">
                        Unlock premium features, get more tokens for our AI assistant, and accelerate your coding preparation.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-12 h-12 border-4 border-[#e7f3eb] border-t-[#13ec5b] rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                        {plans.map((plan, index) => {
                            const isPopular = index === 1; 
                            
                            return (
                                <div 
                                    key={plan._id} 
                                    className={`relative flex flex-col p-8 rounded-3xl border ${isPopular ? 'border-[#13ec5b] shadow-xl shadow-[#13ec5b]/10 bg-white scale-105 z-10' : 'border-[#e7f3eb] bg-white shadow-sm hover:shadow-md'} transition-all duration-300`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#13ec5b] text-[#0d1b12] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                            Most Popular
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-black">₹{plan.price}</span>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-4 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <span className="text-slate-600 font-medium">{plan.tokens} Base Tokens</span>
                                        </div>
                                        {plan.bonusTokens > 0 && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[14px]">star</span>
                                                </div>
                                                <span className="text-slate-600 font-medium">+{plan.bonusTokens} Bonus Tokens</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <span className="text-slate-600 font-medium">Access to premium content</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                            <span className="text-slate-600 font-medium">Priority AI Assistance</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleSubscribe(plan._id)}
                                        disabled={processingPlanId === plan._id}
                                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                                            isPopular 
                                                ? 'bg-[#13ec5b] text-[#0d1b12] hover:bg-[#0fdc52]' 
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
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

            <Footer />
        </div>
    );
};

export default Plans;