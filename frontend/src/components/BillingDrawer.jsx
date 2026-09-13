import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { Crown } from "lucide-react";
import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";

export default function BillingDrawer({ open, onClose }) {
    const { userData } = useSelector((state) => state.user)
    const handleUpgrade = async (plan) => {
        try {
            if (!userData?._id) {
                alert("User not authenticated. Please log in.");
                return;
            }

            const response = await createOrder(plan);

            if (!response?.order) {
                throw new Error("No order data received from server");
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: response.order.amount,
                currency: response.order.currency,
                name: "CortexAI",
                description: `${response.plan.name} Plan`,
                order_id: response.order.id,
                handler: async (razorpayResponse) => {
                    try {
                        const data = await verifyPayment(razorpayResponse);
                        console.log(data);
                    } catch (error) {
                        console.log(error);
                    }
                },
                theme: {
                    color: "#4F46E5",
                },
            };

            if (!window.Razorpay) {
                alert("Razorpay not loaded. Please refresh the page.");
                return;
            }

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Upgrade error:", error);
            alert(`Error: ${error.response?.data?.message || error.message || "Failed to create order"}`);
        }
    };
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black"
                    />

                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="fixed right-0 top-0 z-50 flex h-screen w-96 flex-col border-l border-white/10 bg-[#0f1117] shadow-2xl"
                    >

                        <div className="flex items-center justify-between border-b border-white/10 p-5">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Billing</h2>
                                <p className="text-sm text-slate-400">Plans & Credits</p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close billing drawer"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
                            >
                                <X size={18} className="text-slate-300" />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">Current Plan</p>
                                        <h3 className="text-xl font-bold capitalize text-white">
                                            {userData?.plan || "free"}
                                        </h3>
                                    </div>
                                    <Crown className="text-yellow-400" />
                                </div>
                                <div className="mt-5">
                                    <div className="mb-2 flex justify-between text-xs text-slate-400">
                                        <span>Credits</span>
                                        <span>
                                            {userData?.credits || 0}/{userData?.totalCredits || 100}
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{
                                                width: `${((userData?.credits || 0) / (userData?.totalCredits || 1)) * 100
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </div>



                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-auto px-5">
                            <div className="rounded-xl border border-white/10 p-4">
                                <h3 className="font-semibold text-white">Starter Plan</h3>
                                <p className="mt-2 text-2xl font-bold text-indigo-400">₹199</p>
                                <p className="mt-1 text-sm text-slate-400">500 Credits</p>
                                <button className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-white transition-colors hover:bg-indigo-700"
                                    onClick={() => { handleUpgrade("starter") }}>
                                    Upgrade
                                </button>
                            </div>
                            <div className="rounded-xl border border-white/10 p-4">
                                <h3 className="font-semibold text-white">Pro Plan</h3>
                                <p className="mt-2 text-2xl font-bold text-indigo-400">₹499</p>
                                <p className="mt-1 text-sm text-slate-400">1000 Credits</p>
                                <button className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-white transition-colors hover:bg-indigo-700"
                                    onClick={() => { handleUpgrade("pro") }}>
                                    Upgrade
                                </button>
                            </div>
                        </div>
        
                            
                        
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}