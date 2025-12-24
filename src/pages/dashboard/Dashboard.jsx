import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Power, MapPin, Navigation, Clock, CheckCircle, Package, Phone, 
  TrendingUp, ChevronRight, Store, User, LogOut, RefreshCw, Star, Bike 
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    let interval;
    if (isOnline) {
      fetchOrders();
      interval = setInterval(fetchOrders, 10000);
    }
    return () => clearInterval(interval);
  }, [isOnline]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/delivery-partner/me'); 
      setProfile(data.data);
      setIsOnline(data.data.deliveryPartnerProfile?.isAvailable);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      // Fetch Assigned Orders
      const assignedRes = await api.get('/delivery/orders?status=out_for_delivery');
      setAssignedOrders(assignedRes.data.data || []);

      // Fetch Completed Orders
      const completedRes = await api.get('/delivery/orders?status=delivered&limit=10');
      setCompletedOrders(completedRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = !isOnline;
      await api.patch('/delivery/status', { isAvailable: newStatus });
      setIsOnline(newStatus);
      toast.success(newStatus ? 'You are now Online' : 'You are now Offline');
      if (newStatus) fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
      try {
          await api.patch(`/delivery/orders/${orderId}/update-status`, { status });
          toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
          fetchOrders();
      } catch (err) {
          toast.error(err.response?.data?.message || "Failed to update status");
      }
  };

  const handleLogout = async () => {
    if(!window.confirm("Are you sure you want to log out?")) return;
    try {
        await api.post('/auth/logout');
    } catch(e) { console.error(e); }
    
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
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
    <div className="min-h-screen bg-light pb-24 overflow-hidden relative">
      
      {/* --- PROFILE DRAWER --- */}
      <AnimatePresence>
        {showProfile && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowProfile(false)}
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl flex flex-col"
                >
                    <div className="p-6 bg-dark text-white">
                        <h2 className="text-xl font-bold">My Profile</h2>
                        <p className="text-sm text-gray-400">Manage your account</p>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        {/* User Info */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary">
                                {profile?.fullName?.charAt(0)}
                            </div>
                            <h3 className="font-bold text-lg text-dark">{profile?.fullName}</h3>
                            <p className="text-sm text-secondary">@{profile?.username}</p>
                            <p className="text-sm text-secondary mt-1">{profile?.phoneNumber}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1 fill-yellow-400" />
                                <div className="font-bold text-dark">{profile?.deliveryPartnerProfile?.rating || '4.9'}</div>
                                <div className="text-xs text-secondary">Rating</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <div className="font-bold text-dark">{completedOrders.length}</div>
                                <div className="text-xs text-secondary">Delivered</div>
                            </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-secondary uppercase mb-3 flex items-center gap-2">
                                <Bike className="w-4 h-4"/> Vehicle Details
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Type</span>
                                    <span className="font-medium text-dark capitalize">{profile?.deliveryPartnerProfile?.vehicleType || 'Bike'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Number</span>
                                    <span className="font-medium text-dark uppercase">{profile?.deliveryPartnerProfile?.vehicleNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100">
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-5 h-5" /> Logout
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* --- STATUS HEADER --- */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-dark text-white rounded-b-[2.5rem] shadow-2xl relative overflow-hidden z-20"
      >
        <div className="absolute top-[-50%] right-[-20%] w-80 h-80 bg-primary/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-60 h-60 bg-blue-500/10 rounded-full blur-[60px]" />

        <div className="p-6 pb-12 relative z-10">
          {/* Header Top Row */}
          <div className="flex justify-between items-start mb-6">
             {/* Profile Icon */}
             <button 
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
             >
                <User className="w-5 h-5 text-white" />
             </button>

             {/* Restaurant Info Badge */}
             {profile?.restaurantId && (
                <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 mt-1">
                    <Store className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold tracking-wide text-white/90">
                        {profile.restaurantId.restaurantName}
                    </span>
                </div>
             )}
             
             {/* Spacer for alignment */}
             <div className="w-10" />
          </div>

          <div className="flex justify-between items-center mb-4">
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

          <div className="grid grid-cols-1 gap-4">
             <StatCard 
              icon={<TrendingUp className="w-5 h-5 text-dark" />}
              label="Total Completed Orders"
              value={`${completedOrders.length}`}
              color="bg-white text-dark"
              delay={0.4}
            />
          </div>
        </div>
      </motion.div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="px-6 -mt-8 relative z-30 space-y-8">
        
        {/* SECTION: OFFLINE STATE */}
        {!isOnline && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass bg-white/60 rounded-3xl border border-white/50 p-8 text-center backdrop-blur-md"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Power className="w-8 h-8" />
              </div>
              <p className="text-dark font-bold text-lg">You are Offline</p>
              <p className="text-secondary text-sm mt-1">Tap the power button to start delivering.</p>
            </motion.div>
        )}

        {/* SECTION: SCANNING (Online but no assigned orders) */}
        {isOnline && assignedOrders.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent w-full h-full animate-shine opacity-50" />
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
                <MapPin className="w-8 h-8 text-primary relative z-10" />
              </div>
              <p className="text-dark font-bold text-lg">Waiting for Orders...</p>
              <p className="text-secondary text-sm mt-1">Assignments from {profile?.restaurantId?.restaurantName || 'your restaurant'} will appear here.</p>
              <button 
                onClick={fetchOrders}
                disabled={isRefreshing}
                className="mt-4 text-xs font-bold text-primary flex items-center justify-center gap-1 mx-auto hover:underline"
              >
                <RefreshCw className={clsx("w-3 h-3", isRefreshing && "animate-spin")} /> Refresh status
              </button>
            </motion.div>
        )}

        {/* SECTION: ASSIGNED ORDERS LIST */}
        {isOnline && assignedOrders.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 ml-1">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-dark text-lg">Assigned Orders ({assignedOrders.length})</h3>
                    </div>
                    <button onClick={fetchOrders} className="p-1.5 text-secondary hover:bg-gray-100 rounded-lg">
                        <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
                    </button>
                </div>
                
                <AnimatePresence>
                    {assignedOrders.map((order, i) => (
                        <OrderCard 
                            key={order._id} 
                            order={order} 
                            index={i} 
                            onUpdateStatus={updateOrderStatus} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        )}

        {/* SECTION: COMPLETED ORDERS LIST */}
        {completedOrders.length > 0 && (
             <div className="space-y-4 pt-4 border-t border-gray-200/50">
                <div className="flex items-center gap-2 mb-2 ml-1 opacity-70">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-dark text-lg">Recent History</h3>
                </div>
                
                <div className="space-y-3">
                    {completedOrders.map((order) => (
                        <div key={order._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center opacity-75 grayscale-[0.3]">
                            <div>
                                <div className="text-xs font-bold text-gray-400">#{order.orderNumber.slice(-6)}</div>
                                <div className="font-bold text-dark text-sm">{order.customerDetails?.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Delivered</div>
                                <div className="text-[10px] text-gray-400 mt-1">{new Date(order.deliveryDate || order.updatedAt).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function OrderCard({ order, index, onUpdateStatus }) {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100"
        >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold bg-white border border-orange-200 text-primary px-3 py-1 rounded-full shadow-sm">
                        #{order.orderNumber.slice(-6)}
                    </span>
                    <span className="text-xs font-bold text-secondary flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full uppercase">
                        {order.status.replace(/_/g, ' ')}
                    </span>
                </div>
                <h4 className="font-extrabold text-dark text-xl leading-tight">{order.restaurantId.restaurantName}</h4>
                <p className="text-secondary text-sm flex items-start gap-1 mt-2">
                    <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    {order.restaurantId.address?.city}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${order.restaurantId.address?.coordinates?.coordinates[1]},${order.restaurantId.address?.coordinates?.coordinates[0]}`}
                        target="_blank" rel="noreferrer"
                        className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-dark flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <Navigation className="w-3 h-3"/> To Store
                    </a>
                    <a 
                         href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress?.coordinates?.coordinates[1]},${order.deliveryAddress?.coordinates?.coordinates[0]}`}
                         target="_blank" rel="noreferrer"
                        className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-dark flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <Navigation className="w-3 h-3"/> To Customer
                    </a>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-dark rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg">
                        {order.customerDetails?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-dark">{order.customerDetails?.name}</h4>
                        <p className="text-xs font-bold text-secondary uppercase tracking-wider">Customer</p>
                    </div>
                    <a href={`tel:${order.customerDetails?.phoneNumber}`} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                        <Phone className="w-5 h-5"/>
                    </a>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    {order.status === 'out_for_delivery' && (
                        <>
                            {order.paymentType === 'cash' && order.paymentStatus === 'pending' && (
                                <div className="p-4 bg-green-50 border border-green-100 text-green-800 text-sm rounded-2xl flex justify-between items-center">
                                    <span className="font-medium">Collect Cash</span>
                                    <span className="font-bold text-lg">£{order.pricing.totalAmount}</span>
                                </div>
                            )}
                            <SwipeButton onClick={() => onUpdateStatus(order._id, 'delivered')}>
                                <CheckCircle className="w-5 h-5 inline mr-2"/>
                                Complete Delivery
                            </SwipeButton>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

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
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center relative overflow-hidden group"
        >
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}