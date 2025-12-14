import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, MapPin, Navigation, Clock, CheckCircle, Package } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Poll for orders every 10 seconds if online
  useEffect(() => {
    fetchProfile();
    const interval = setInterval(() => {
        if(isOnline) fetchActiveOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const fetchProfile = async () => {
    try {
      // Assuming you have a /me endpoint or similar for delivery partners
      const { data } = await api.get('/auth/me'); 
      setProfile(data.data);
      setIsOnline(data.data.deliveryPartnerProfile?.isAvailable);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchActiveOrders = async () => {
    // Fetch orders assigned to this partner
    const { data } = await api.get('/delivery/orders/active');
    setActiveOrder(data.data[0] || null);
  };

  const toggleStatus = async () => {
    try {
      const newStatus = !isOnline;
      // Assuming an endpoint to toggle availability exists
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

  if (loading) return <div className="p-6 text-center text-secondary">Loading profile...</div>;

  return (
    <div className="pb-24">
      {/* Header / Status Bar */}
      <div className="bg-dark text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"/>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-2xl font-bold">Hello, {profile?.fullName?.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 text-sm mt-1">Ready to deliver?</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleStatus}
            className={clsx(
              "p-3 rounded-xl shadow-lg transition-all flex flex-col items-center gap-1 w-20",
              isOnline ? "bg-green-500 text-white" : "bg-slate-700 text-slate-400"
            )}
          >
            <Power className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{isOnline ? 'Online' : 'Offline'}</span>
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-8">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3">
                <span className="text-xs text-slate-300 block mb-1">Today's Earnings</span>
                <span className="text-xl font-bold text-primary">$42.50</span>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3">
                <span className="text-xs text-slate-300 block mb-1">Completed</span>
                <span className="text-xl font-bold text-white">5 Orders</span>
            </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-dark text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary"/>
            Current Mission
        </h3>

        <AnimatePresence mode="wait">
          {!isOnline ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Power className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-secondary font-medium">You are currently offline.</p>
              <p className="text-gray-400 text-sm mt-1">Go online to receive orders.</p>
            </motion.div>
          ) : !activeOrder ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <p className="text-dark font-medium">Scanning for orders...</p>
              <p className="text-secondary text-sm mt-1">Stay near hotspots for better chances.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Restaurant Info */}
              <div className="p-5 border-b border-gray-100 bg-orange-50/50">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold bg-white border border-orange-100 text-primary px-2 py-1 rounded">
                        #{activeOrder.orderId}
                    </span>
                    <span className="text-xs font-medium text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3"/> 15 mins ago
                    </span>
                </div>
                <h4 className="font-bold text-dark text-lg">{activeOrder.restaurant.name}</h4>
                <p className="text-secondary text-sm flex items-start gap-1 mt-1">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    {activeOrder.restaurant.address}
                </p>
                <button className="mt-3 w-full py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-dark flex items-center justify-center gap-2 hover:bg-gray-50">
                    <Navigation className="w-4 h-4"/> Navigate to Restaurant
                </button>
              </div>

              {/* Customer Info */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                        {activeOrder.customer.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-dark">{activeOrder.customer.name}</h4>
                        <p className="text-sm text-secondary">Customer</p>
                    </div>
                    <a href={`tel:${activeOrder.customer.phone}`} className="ml-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Phone className="w-5 h-5"/>
                    </a>
                </div>

                <div className="space-y-3">
                    {/* Action Buttons based on status */}
                    {activeOrder.status === 'ready_for_pickup' && (
                         <button 
                            onClick={() => updateOrderStatus(activeOrder._id, 'out_for_delivery')}
                            className="w-full py-3 bg-dark text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-colors"
                         >
                            Confirm Pickup
                         </button>
                    )}
                    
                    {activeOrder.status === 'out_for_delivery' && (
                         <div className="space-y-2">
                            <div className="p-3 bg-green-50 text-green-800 text-sm rounded-lg mb-2">
                                🔥 <strong>Cash to Collect:</strong> ${activeOrder.totalAmount}
                            </div>
                            <button 
                                onClick={() => updateOrderStatus(activeOrder._id, 'delivered')}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5"/>
                                Complete Delivery
                            </button>
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

// Helper Icon component since I used Phone above but forgot to import
import { Phone } from 'lucide-react';