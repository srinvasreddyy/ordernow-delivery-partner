import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Power, MapPin, Navigation, Clock, CheckCircle, Package, Phone, 
  TrendingUp, ChevronRight, Store, User, LogOut, RefreshCw, Star, Bike,
  ShoppingBag, ArrowRight, DollarSign, Wallet
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// --- UTILS ---
const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return '0.0';
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

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
      interval = setInterval(fetchOrders, 15000);
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
      const assignedRes = await api.get('/delivery/orders?status=ready_for_pickup,out_for_delivery');
      setAssignedOrders(assignedRes.data.data || []);

      const completedRes = await api.get('/delivery/orders?status=delivered&limit=5');
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
          setAssignedOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
          await api.patch(`/delivery/orders/${orderId}/update-status`, { status });
          
          if (status === 'delivered') {
              toast.success("Great job! Delivery completed.");
              fetchOrders(); 
          } else {
              toast.success(`Status updated: ${status.replace(/_/g, ' ')}`);
          }
      } catch (err) {
          toast.error(err.response?.data?.message || "Failed to update status");
          fetchOrders(); 
      }
  };

  const handleLogout = async () => {
    if(!window.confirm("Are you sure you want to log out?")) return;
    try { await api.post('/auth/logout'); } catch(e) {}
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
    <div className="min-h-screen bg-[#f4f7fa] pb-24 overflow-hidden relative font-sans">
      
      {/* --- PROFILE DRAWER --- */}
      <AnimatePresence>
        {showProfile && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowProfile(false)}
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl flex flex-col"
                >
                    <div className="p-6 bg-dark text-white">
                        <h2 className="text-xl font-bold">My Profile</h2>
                        <p className="text-sm text-gray-400">Driver Account</p>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary border-4 border-white shadow-lg">
                                {profile?.fullName?.charAt(0)}
                            </div>
                            <h3 className="font-bold text-lg text-dark">{profile?.fullName}</h3>
                            <p className="text-sm text-secondary">{profile?.phoneNumber}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1 fill-yellow-400" />
                                <div className="font-bold text-dark text-lg">{profile?.deliveryPartnerProfile?.rating || '5.0'}</div>
                                <div className="text-xs text-secondary font-bold uppercase">Rating</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <div className="font-bold text-dark text-lg">{completedOrders.length}</div>
                                <div className="text-xs text-secondary font-bold uppercase">Delivered</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-secondary uppercase mb-3 flex items-center gap-2">
                                <Bike className="w-4 h-4"/> Vehicle Info
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-secondary">Type</span>
                                    <span className="font-bold text-dark capitalize">{profile?.deliveryPartnerProfile?.vehicleType || 'Bike'}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-secondary">Plate No.</span>
                                    <span className="font-bold text-dark uppercase">{profile?.deliveryPartnerProfile?.vehicleNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                            <LogOut className="w-5 h-5" /> Logout
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="bg-dark text-white rounded-b-[30px] shadow-2xl relative overflow-hidden z-20">
        <div className="p-6 pb-10 relative z-10">
          <div className="flex justify-between items-start mb-6">
             <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                <User className="w-5 h-5 text-white" />
             </button>
             <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <span className={clsx("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-green-400" : "bg-red-400")}></span>
                <span className="text-xs font-bold tracking-wide text-white">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
             </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Hello, Driver</p>
              <h1 className="text-3xl font-bold tracking-tight text-white">{profile?.fullName?.split(' ')[0]}</h1>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleStatus}
              className={clsx(
                "w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 border-2",
                isOnline ? "bg-green-500 border-green-400 text-white" : "bg-slate-700 border-slate-600 text-slate-400"
              )}
            >
              <Power className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* --- CONTENT --- */}
      <div className="px-5 -mt-6 relative z-30 space-y-6">
        
        {/* Waiting State */}
        {isOnline && assignedOrders.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping"></div>
                <Navigation className="w-8 h-8 text-blue-500 relative z-10" />
              </div>
              <h3 className="text-dark font-bold text-lg">Looking for Orders...</h3>
              <p className="text-secondary text-sm mt-1">Stay active. New assignments will pop up here instantly.</p>
              <button onClick={fetchOrders} disabled={isRefreshing} className="mt-6 py-2 px-4 rounded-full bg-gray-50 text-gray-600 text-xs font-bold flex items-center justify-center gap-2 mx-auto hover:bg-gray-100">
                <RefreshCw className={clsx("w-3 h-3", isRefreshing && "animate-spin")} /> Check Now
              </button>
            </motion.div>
        )}

        {/* Active Orders */}
        <AnimatePresence>
            {assignedOrders.map((order, i) => (
                <OrderCard key={order._id} order={order} index={i} onUpdateStatus={updateOrderStatus} />
            ))}
        </AnimatePresence>

        {/* History Preview */}
        {completedOrders.length > 0 && assignedOrders.length === 0 && (
             <div className="pt-4">
                <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider mb-3 ml-1">Recent Deliveries</h3>
                <div className="space-y-3">
                    {completedOrders.map((order) => (
                        <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center opacity-80">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-dark text-sm">#{order.orderNumber.slice(-6)}</div>
                                    <div className="text-xs text-gray-500">{order.restaurantId?.restaurantName}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-dark">£{order.pricing.totalAmount.toFixed(2)}</span>
                                <div className="text-[10px] text-gray-400 mt-0.5">{new Date(order.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
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

// --- ORDER CARD COMPONENT ---

function OrderCard({ order, index, onUpdateStatus }) {
    const isCod = order.paymentType === 'cash';
    const isPaid = order.paymentStatus === 'paid';
    
    // Calculate distance
    const restaurantCoords = order.restaurantId?.address?.coordinates?.coordinates;
    const deliveryCoords = order.deliveryAddress?.coordinates?.coordinates;
    const distance = calculateDistance(restaurantCoords, deliveryCoords);

    // Get Actions based on Status
    const isReadyForPickup = order.status === 'ready_for_pickup' || order.status === 'preparing' || order.status === 'placed';
    const isOutForDelivery = order.status === 'out_for_delivery';

    // --- AGGRESSIVE ADDRESS FALLBACK ---
    // Try fullAddress -> addressLine1 -> City/Landmark -> Generic
    const addressDisplay = order.deliveryAddress?.fullAddress || 
                           order.deliveryAddress?.addressLine1 || 
                           [order.deliveryAddress?.city, order.deliveryAddress?.landmark].filter(Boolean).join(', ') ||
                           "Address available via Map";

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 overflow-hidden border border-gray-100"
        >
            {/* 1. Header: Restaurant & Stats */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                        #{order.orderNumber.slice(-6)}
                    </div>
                    <div className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase", 
                        isOutForDelivery ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                        {isOutForDelivery ? <Bike className="w-3.5 h-3.5"/> : <Package className="w-3.5 h-3.5"/>}
                        {order.status.replace(/_/g, ' ')}
                    </div>
                </div>
                
                <h3 className="text-xl font-extrabold text-dark leading-tight mb-1">{order.restaurantId.restaurantName}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {order.restaurantId.address?.city}, {order.restaurantId.address?.area || 'UK'}
                </p>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Est. Dist</span>
                        <span className="block text-sm font-bold text-dark">{distance} mi</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Items</span>
                        <span className="block text-sm font-bold text-dark">{order.orderedItems.length}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Earn</span>
                        <span className="block text-sm font-bold text-green-600">£4.50</span> {/* Static or from backend */}
                    </div>
                </div>
            </div>

            {/* 2. Body: Customer & Items */}
            <div className="p-6 space-y-6">
                
                {/* Customer Address */}
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                        <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-dark text-sm">Deliver To:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed mt-0.5">
                            {addressDisplay}
                        </p>
                        <div className="flex gap-3 mt-3">
                            <a href={`tel:${order.customerDetails?.phoneNumber}`} className="bg-gray-100 hover:bg-gray-200 text-dark px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${deliveryCoords ? `${deliveryCoords[1]},${deliveryCoords[0]}` : ''}`}
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                                <Navigation className="w-3.5 h-3.5" /> Navigate
                            </a>
                        </div>
                    </div>
                </div>

                {/* Order Items List */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <ShoppingBag className="w-3.5 h-3.5" /> Order Summary
                    </div>
                    <ul className="space-y-3">
                        {order.orderedItems.map((item, idx) => (
                            <li key={idx} className="text-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-gray-800"><span className="text-primary mr-1">{item.quantity}x</span> {item.itemName}</span>
                                </div>
                                {/* Variants */}
                                {(item.selectedVariants?.length > 0 || item.selectedAddons?.length > 0) && (
                                    <div className="text-xs text-gray-500 mt-1 pl-5 border-l-2 border-gray-200">
                                        {item.selectedVariants?.map(v => v.details?.variantName).join(', ')}
                                        {item.selectedAddons?.length > 0 && `, +${item.selectedAddons.length} extras`}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Cash To Collect (If COD) */}
                {isCod && !isPaid && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-800 uppercase">Collect Cash</p>
                                <p className="text-xs text-green-600">From Customer</p>
                            </div>
                        </div>
                        <span className="text-xl font-bold text-green-700">£{order.pricing.totalAmount.toFixed(2)}</span>
                    </div>
                )}
                
                {(!isCod || isPaid) && (
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 p-3 rounded-lg justify-center">
                        <Wallet className="w-4 h-4" /> Order Paid Online (No Cash Needed)
                     </div>
                )}

                {/* 3. Action Buttons */}
                <div className="pt-2">
                    {/* Scenario A: Driver hasn't started delivery yet */}
                    {isReadyForPickup && (
                        <SwipeButton 
                            onClick={() => onUpdateStatus(order._id, 'out_for_delivery')} 
                            color="bg-dark hover:bg-black"
                            icon={<Bike className="w-5 h-5" />}
                        >
                            Pickup & Start Delivery
                        </SwipeButton>
                    )}

                    {/* Scenario B: Driver is on the way */}
                    {isOutForDelivery && (
                        <SwipeButton 
                            onClick={() => onUpdateStatus(order._id, 'delivered')} 
                            color="bg-primary hover:bg-orange-600"
                            icon={<CheckCircle className="w-5 h-5" />}
                        >
                            Complete Delivery
                        </SwipeButton>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function SwipeButton({ children, onClick, color, icon }) {
    return (
        <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={clsx(
                "w-full py-4 text-white rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group",
                color
            )}
        >
            {icon}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}