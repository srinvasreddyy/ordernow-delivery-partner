import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, MapPin, Navigation, Clock, CheckCircle, Package, Phone, DollarSign, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    const interval = setInterval(() => {
        if(isOnline) fetchActiveOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me'); 
      setProfile(data.data);
      setIsOnline(data.data.deliveryPartnerProfile?.isAvailable);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchActiveOrders = async () => {
    const { data } = await api.get('/delivery/orders/active');
    setActiveOrder(data.data[0] || null);
  };

  const toggleStatus = async () => {
    try {
      const newStatus = !isOnline;
      await api.patch('/delivery/status', { isAvailable: newStatus });
      setIsOnline(newStatus);
      toast.success(newStatus ? 'You are now Online' : 'You are now Offline');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
      try {
          await api.patch(`/delivery/orders/${orderId}/status`, { status });
          toast.success(`Order marked as ${status}`);
          fetchActiveOrders();
      } catch (err) {
          toast.error("Failed to update status");
      }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-light pb-24">
      {/* --- STATUS HEADER --- */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-dark text-white rounded-b-[2.5rem] shadow-2xl relative overflow-hidden z-20"
      >
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-50%] right-[-20%] w-80 h-80 bg-primary/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-60 h-60 bg-blue-500/10 rounded-full blur-[60px]" />

        <div className="p-6 pb-12 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold tracking-tight">
                {profile?.fullName?.split(' ')[0]}
                <span className="text-primary">.</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-green-400" : "bg-red-400")}></span>
                <p className="text-slate-400 text-sm font-medium">{isOnline ? 'Online & Searching' : 'Offline'}</p>
              </div>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleStatus}
              className={clsx(
                "w-16 h-16 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition-all duration-300 border-2",
                isOnline 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white shadow-green-500/30" 
                  : "bg-slate-800 border-slate-700 text-slate-500"
              )}
            >
              <Power className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              icon={<DollarSign className="w-5 h-5 text-white" />}
              label="Today's Pay"
              value="$42.50"
              color="bg-white/10"
              delay={0.3}
            />
            <StatCard 
              icon={<TrendingUp className="w-5 h-5 text-dark" />}
              label="Completed"
              value="5 Orders"
              color="bg-white text-dark"
              delay={0.4}
            />
          </div>
        </div>
      </motion.div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="px-6 -mt-8 relative z-30">
        <div className="flex items-center gap-2 mb-4 ml-1">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-dark text-lg">Current Mission</h3>
        </div>

        <AnimatePresence mode="wait">
          {!isOnline ? (
            <motion.div 
              key="offline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass bg-white/60 rounded-3xl border border-white/50 p-8 text-center backdrop-blur-md"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Power className="w-8 h-8" />
              </div>
              <p className="text-dark font-bold text-lg">You are Offline</p>
              <p className="text-secondary text-sm mt-1">Tap the power button to start earning.</p>
            </motion.div>
          ) : !activeOrder ? (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent w-full h-full animate-shine opacity-50" />
              
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
                <MapPin className="w-8 h-8 text-primary relative z-10" />
              </div>
              <p className="text-dark font-bold text-lg">Scanning Area...</p>
              <p className="text-secondary text-sm mt-1">Stay near hotspots for better matches.</p>
            </motion.div>
          ) : (
            <motion.div
              key="order"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100"
            >
              {/* Card Header */}
              <div className="p-6 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold bg-white border border-orange-200 text-primary px-3 py-1 rounded-full shadow-sm">
                        #{activeOrder.orderId}
                    </span>
                    <span className="text-xs font-bold text-secondary flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3"/> 12m
                    </span>
                </div>
                <h4 className="font-extrabold text-dark text-xl leading-tight">{activeOrder.restaurant.name}</h4>
                <p className="text-secondary text-sm flex items-start gap-1 mt-2">
                    <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    {activeOrder.restaurant.address}
                </p>
                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 w-full py-3 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-dark flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                >
                    <Navigation className="w-4 h-4"/> Navigate to Store
                </motion.button>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-dark rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg">
                        {activeOrder.customer.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-dark">{activeOrder.customer.name}</h4>
                        <p className="text-xs font-bold text-secondary uppercase tracking-wider">Customer</p>
                    </div>
                    <motion.a 
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        href={`tel:${activeOrder.customer.phone}`} 
                        className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30"
                    >
                        <Phone className="w-5 h-5"/>
                    </motion.a>
                </div>

                <div className="space-y-4">
                    {/* Dynamic Action Buttons */}
                    {activeOrder.status === 'ready_for_pickup' && (
                         <SwipeButton onClick={() => updateOrderStatus(activeOrder._id, 'out_for_delivery')}>
                            Slide to Pickup
                         </SwipeButton>
                    )}
                    
                    {activeOrder.status === 'out_for_delivery' && (
                         <div className="space-y-3">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-4 bg-green-50 border border-green-100 text-green-800 text-sm rounded-2xl flex justify-between items-center"
                            >
                                <span className="font-medium">Collect Cash</span>
                                <span className="font-bold text-lg">${activeOrder.totalAmount}</span>
                            </motion.div>
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => updateOrderStatus(activeOrder._id, 'delivered')}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-6 h-6"/>
                                Complete Delivery
                            </motion.button>
                         </div>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ icon, label, value, color, delay }) {
    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: "spring" }}
            className={clsx("rounded-2xl p-4 backdrop-blur-sm border border-white/10", color)}
        >
            <div className="mb-2 opacity-80">{icon}</div>
            <span className="text-xs opacity-70 block mb-0.5">{label}</span>
            <span className="text-xl font-bold block">{value}</span>
        </motion.div>
    );
}

function SwipeButton({ children, onClick }) {
    return (
        <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full py-4 bg-dark text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-colors relative overflow-hidden group"
        >
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}