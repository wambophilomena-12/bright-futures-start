import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFirestore, doc, getDoc, addDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { ArrowLeft, Loader2, Navigation, Heart, ChevronLeft, ChevronRight, Check, MapPin, Clock, DollarSign, Phone, Mail, Share2, Calendar, Users, Star, Car, User2, Wifi, Coffee, Tent, Utensils, Zap, ClipboardList, Package, UserPlus } from 'lucide-react';

// --- MANDATORY FIREBASE SETUP (Replacing Supabase) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db;
let auth;
let app;

// Ensure Firebase is initialized only once
if (Object.keys(firebaseConfig).length > 0) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}

// Helper for UUID (since user is anonymous or custom token)
const generateUserId = () => {
    return (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
};

// --- RESTYLED UI COMPONENTS (Square Corners) ---

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', disabled = false, type = 'button' }) => {
    let baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none font-semibold shadow-none border-2";
    let variantStyles = "";
    let sizeStyles = "";

    switch (variant) {
        case 'outline':
            variantStyles = "border-gray-900 bg-white text-gray-900 hover:bg-gray-200";
            break;
        case 'ghost':
            variantStyles = "border-transparent hover:bg-gray-200 text-gray-700";
            break;
        case 'destructive':
            variantStyles = "border-red-600 bg-red-600 text-white hover:bg-red-700";
            break;
        case 'link':
            variantStyles = "border-transparent text-indigo-600 underline-offset-4 hover:underline";
            break;
        default: // 'default' (Primary)
            variantStyles = "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700";
    }

    switch (size) {
        case 'lg':
            sizeStyles = "h-11 px-6 py-2";
            break;
        case 'sm':
            sizeStyles = "h-8 px-3 text-xs";
            break;
        case 'icon':
            sizeStyles = "h-10 w-10";
            break;
        default:
            sizeStyles = "h-10 py-2 px-4";
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

const Card = ({ children, className = '' }) => (
    <div className={`border-2 border-gray-900 bg-white text-gray-900 shadow-none p-6 ${className}`}>
        {children}
    </div>
);

const Input = ({ id, type = 'text', value, onChange, placeholder, className = '', required = false, min, max, maxLength, disabled = false, step }) => (
    <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        step={step}
        required={required}
        disabled={disabled}
        className={`flex h-10 w-full border-2 border-gray-900 bg-white px-4 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 transition-shadow ${className}`}
    />
);

const Label = ({ htmlFor, children, className = '' }) => (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none block mb-1 text-gray-700 ${className}`}>
        {children}
    </label>
);

const Checkbox = ({ id, checked, onCheckedChange, className = '' }) => (
    <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className={`h-5 w-5 border-2 border-indigo-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 ${className}`}
        style={{ appearance: 'none' }} // Tailwind doesn't easily allow removing default rounded corners on checkboxes, using inline style fallback
    />
);

const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-gray-900 shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100 relative">
                <div className="p-6">
                    {children}
                </div>
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-1 right-1 text-gray-900 hover:text-indigo-600 text-2xl p-1 transition-colors border-2 border-transparent hover:border-indigo-600"
                    aria-label="Close dialog"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

const DialogHeader = ({ children }) => <div className="space-y-1.5 mb-4 border-b-2 border-gray-900 pb-2">{children}</div>;
const DialogTitle = ({ children }) => <h2 className="text-xl font-bold leading-none tracking-tight">{children}</h2>;
const DialogContent = ({ children, className = '' }) => <div className={className}>{children}</div>;
const Badge = ({ children, className = '' }) => <span className={`inline-flex items-center border border-gray-900 px-3 py-1 text-xs font-bold transition-colors bg-indigo-500 text-white shadow-none ${className}`}>{children}</span>;


// Simple Toast Hook Mock
const useToast = () => {
    const toast = ({ title, description, variant = 'default' }) => {
        const style = variant === 'destructive' ? 'bg-red-600 text-white border-red-600' : 'bg-green-600 text-white border-green-600';
        console.log(`[Toast] ${title}: ${description}`);
        
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 shadow-xl z-[101] transition-opacity duration-300 border-2 ${style}`;
        notification.innerHTML = `<strong class="block">${title}</strong> <span class="text-sm">${description}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    };
    return { toast };
};

// Simple Router Hook Mock
const useNavigate = () => {
    return (path) => {
        if (typeof path === 'number' && path === -1) {
            console.log("Simulating browser back navigation.");
        } else {
            console.log(`Simulating navigation to: ${path}`);
        }
    };
};
const useParams = () => ({ id: 'attraction-123' }); // Mock a default ID

// Auth Context Mock using Firebase
const AuthContext = React.createContext({ user: null, isAuthReady: false, userId: null });

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(generateUserId()); // Start with a random UUID

    useEffect(() => {
        if (!auth) {
            console.log("Firebase Auth not initialized. Using mock user.");
            setIsAuthReady(true);
            return;
        }

        const setupAuth = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase auth failed:", error);
            }
        };

        const unsubscribe = auth.onAuthStateChanged(currentUser => {
            setUser(currentUser);
            setUserId(currentUser?.uid || generateUserId());
            setIsAuthReady(true);
            console.log("Auth state changed. User ID:", currentUser?.uid);
        });

        setupAuth();
        return () => unsubscribe();
    }, []);

    const userWithMockMetadata = useMemo(() => {
        if (user) {
            // Mock user metadata needed for guest details logic
            return {
                ...user,
                user_metadata: {
                    name: user.displayName || 'Authenticated User',
                    email: user.email || 'user@example.com',
                }
            };
        }
        return null;
    }, [user]);

    return (
        <AuthContext.Provider value={{ user: userWithMockMetadata, isAuthReady, userId }}>
            {children}
        </AuthContext.Provider>
    );
};
const useAuth = () => React.useContext(AuthContext);

// Simple Hook Mocks
const useSavedItems = () => {
    const [saved, setSaved] = useState(new Set(['attraction-456'])); // Mock some saved items

    const handleSave = (id) => {
        setSaved(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
                console.log(`Unsaved item: ${id}`);
            } else {
                newSet.add(id);
                console.log(`Saved item: ${id}`);
            }
            return newSet;
        });
    };
    return { savedItems: saved, handleSave };
};

// Simple Component Mocks
const Header = () => (
    <header className="p-4 border-b-2 border-gray-900 bg-white shadow-none sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl font-bold text-xl text-gray-900">TRAVEL BOOKING</div>
    </header>
);
const Footer = () => (
    <footer className="p-4 border-t-2 border-gray-900 text-center text-sm text-gray-500 bg-gray-50">
        © 2024 Attraction Booking. All rights reserved.
    </footer>
);
const MobileBottomBar = () => (
    <div className="fixed bottom-0 left-0 w-full p-3 bg-white border-t-2 border-gray-900 md:hidden shadow-none z-30">
        <Button size="lg" className="w-full">
            <Calendar className="mr-2 h-5 w-5" />
            BOOK NOW (MOBILE)
        </Button>
    </div>
);
const SimilarItems = ({ country }) => (
    <Card className="mt-8 bg-gray-50 border-gray-900">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">SIMILAR ATTRACTIONS IN {country || 'THE REGION'}</h2>
        <p className="text-gray-600">Discover other highly-rated spots nearby like national parks or historical sites.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <div className="h-20 bg-gray-300 border-2 border-gray-900 animate-pulse"></div>
            <div className="h-20 bg-gray-300 border-2 border-gray-900 animate-pulse"></div>
            <div className="h-20 bg-gray-300 border-2 border-gray-900 animate-pulse"></div>
        </div>
    </Card>
);
const ReviewSection = ({ itemId }) => (
    <Card className="mt-8 border-gray-900">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">USER REVIEWS (Attraction: {itemId})</h2>
        <div className="flex items-center gap-2 mb-4">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <span className="text-xl font-bold">4.7 / 5.0</span>
            <span className="text-gray-500">(1,245 reviews)</span>
        </div>
        <div className="space-y-4 max-h-60 overflow-y-auto">
            <div className="border-b pb-2 border-gray-200">
                <p className="font-semibold">Jane D. <Badge className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-600">Visitor</Badge></p>
                <p className="text-sm text-gray-600">Amazing views! The guided tour facility was definitely worth the price.</p>
            </div>
            <div className="border-b pb-2 border-gray-200">
                <p className="font-semibold">Ken M.</p>
                <p className="text-sm text-gray-600">Easy to book and stunning location. Highly recommend going at sunrise.</p>
            </div>
        </div>
        <Button variant="outline" className="mt-4">Write a Review</Button>
    </Card>
);

// Carousel Implementation (Updated for square aesthetic)
const Carousel = ({ children, className = '', opts, setApi }) => {
    const [current, setCurrent] = useState(0);
    const ContentChildren = React.Children.toArray(React.Children.toArray(children)[0].props.children);
    const totalItems = ContentChildren.length;
    
    // Simplified Autoplay/Loop logic
    useEffect(() => {
        if (!opts?.loop) return;
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % totalItems);
        }, 3000);
        return () => clearInterval(interval);
    }, [totalItems, opts?.loop]);

    const next = () => setCurrent(prev => (prev + 1) % totalItems);
    const prev = () => setCurrent(prev => (prev - 1 + totalItems) % totalItems);

    useEffect(() => {
        if (setApi) {
            setApi({ selectedScrollSnap: () => current, on: (event, callback) => {
                if (event === 'select') callback(); // Simple mock trigger
            }});
        }
    }, [current, setApi]);

    const Content = React.Children.toArray(children)[0];

    return (
        <div className={`relative ${className}`}>
            <div className="overflow-hidden">
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${current * 100}%)` }}
                >
                    {Content.props.children.map((child, index) => (
                        <div key={index} className="flex-shrink-0 w-full">
                            {child}
                        </div>
                    ))}
                </div>
            </div>
            {totalItems > 1 && (
                <>
                    <Button variant="ghost" size="icon" onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white z-10 border-none">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white z-10 border-none">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </>
            )}
            {totalItems > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {Array.from({ length: totalItems }).map((_, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 border-2 border-white transition-all duration-300 ${
                                index === current ? 'bg-white' : 'bg-transparent'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
const CarouselContent = ({ children }) => <div>{children}</div>;
const CarouselItem = ({ children }) => <div>{children}</div>;

// --- MOCK DATA STRUCTURE ---
const mockAttractionData = {
    id: 'attraction-123',
    location_name: "The Great Rift Valley Viewpoint",
    local_name: "Mai Mahiu Escarpment",
    country: "Kenya",
    description: "A breathtaking natural wonder offering panoramic views of the Great Rift Valley. A must-see stop for any traveler passing through the region. It is a perfect spot for photography and experiencing the vast beauty of Kenya's landscape. Please note that the entrance fee goes towards local conservation efforts.",
    email: "info@riftvalleyview.com",
    phone_number: "+254700123456",
    location_link: "https://maps.app.goo.gl/riftvalley",
    opening_hours: "07:00",
    closing_hours: "19:00",
    days_opened: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    entrance_type: "paid", // or 'free'
    price_child: 150,
    price_adult: 500,
    photo_urls: [
        "https://placehold.co/800x600/0f766e/ffffff?text=Rift+View+1",
        "https://placehold.co/800x600/10b981/ffffff?text=Rift+View+2",
    ],
    gallery_images: [
        "https://placehold.co/800x600/0f766e/ffffff?text=Rift+View+1",
        "https://placehold.co/800x600/10b981/ffffff?text=Rift+View+2",
        "https://placehold.co/800x600/22c38c/ffffff?text=Rift+View+3",
    ],
    facilities: [
        { name: "Guided Walk", price: 1000, capacity: 50 },
        { name: "Picnic Spot Rental", price: 500, capacity: 20 },
        { name: "Binoculars Rental", price: 150, capacity: 100 },
    ],
};
// --- END MOCK DATA ---


const FacilityIcon = ({ name }) => {
    switch (name.toLowerCase().split(' ')[0]) {
        case 'guided': return <Navigation className="h-5 w-5 text-indigo-500" />;
        case 'picnic': return <Utensils className="h-5 w-5 text-indigo-500" />;
        case 'binoculars': return <Users className="h-5 w-5 text-indigo-500" />;
        case 'parking': return <Car className="h-5 w-5 text-indigo-500" />;
        case 'restrooms': return <User2 className="h-5 w-5 text-indigo-500" />;
        case 'wifi': return <Wifi className="h-5 w-5 text-indigo-500" />;
        case 'cafe': return <Coffee className="h-5 w-5 text-indigo-500" />;
        case 'camping': return <Tent className="h-5 w-5 text-indigo-500" />;
        default: return <Check className="h-5 w-5 text-indigo-500" />;
    }
}

// --- MAIN APPLICATION COMPONENT ---
const AttractionDetailContent = () => {
    const { id: attractionId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isAuthReady, userId } = useAuth();
    const { savedItems, handleSave: handleSaveItem } = useSavedItems();

    const [attraction, setAttraction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
    
    // --- STEPPED BOOKING STATE ---
    const [currentStep, setCurrentStep] = useState(1);
    // --- END STEPPED BOOKING STATE ---

    const isSaved = savedItems.has(attractionId || "");
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    
    const [bookingData, setBookingData] = useState({
        visit_date: "",
        num_adults: 1,
        num_children: 0,
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        payment_method: "mpesa",
        payment_phone: "",
        card_number: "",
        card_expiry: "",
        card_cvv: "",
    });

    // --- FIREBASE/FIRESTORE DATA FETCHING ---
    const fetchAttraction = useCallback(async () => {
        if (!db) {
            setAttraction(mockAttractionData);
            setLoading(false);
            return;
        }
        const attractionRef = doc(db, `artifacts/${appId}/public/data/attractions`, attractionId);
        try {
            const docSnap = await getDoc(attractionRef);
            if (docSnap.exists()) {
                setAttraction(docSnap.data());
            } else {
                setAttraction(mockAttractionData); 
            }
        } catch (error) {
            console.error('Error fetching attraction from Firestore, falling back to mock:', error);
            setAttraction(mockAttractionData); 
        } finally {
            setLoading(false);
        }
    }, [attractionId]);

    useEffect(() => {
        if (isAuthReady || !auth) {
            fetchAttraction();
        }
    }, [isAuthReady, fetchAttraction]);
    // --- END DATA FETCHING ---

    const calculateTotal = useCallback(() => {
        if (!attraction) return 0;
        let entranceFee = 0;
        if (attraction.entrance_type !== 'free') {
            entranceFee = (bookingData.num_adults * attraction.price_adult) + (bookingData.num_children * attraction.price_child);
        }
        
        let facilityTotal = 0;
        selectedFacilities.forEach(f => {
            facilityTotal += f.price;
        });
        
        return entranceFee + facilityTotal;
    }, [attraction, bookingData.num_adults, bookingData.num_children, selectedFacilities]);

    const totalAmount = calculateTotal();
    const isPaidBooking = totalAmount > 0;
    const hasFacilities = attraction?.facilities?.length > 0;
    const isGuest = !user;

    // Dynamically calculate the maximum step for the current flow
    const maxSteps = useMemo(() => {
        let count = 2; // Date, Attendees (Mandatory)
        if (hasFacilities) count++; // Facilities
        if (isGuest) count++; // Guest Details
        if (isPaidBooking) count++; // Payment
        count++; // Review (Final)
        return count;
    }, [hasFacilities, isGuest, isPaidBooking]);
    
    const steps = useMemo(() => {
        const flow = [
            { id: 1, name: "Visit Date", icon: Calendar, visible: true },
            { id: 2, name: "Attendees", icon: Users, visible: true },
            { id: 3, name: "Facilities", icon: Package, visible: hasFacilities },
            { id: 4, name: "Guest Info", icon: UserPlus, visible: isGuest },
            { id: 5, name: "Payment", icon: DollarSign, visible: isPaidBooking },
            { id: 6, name: "Review", icon: ClipboardList, visible: true }
        ];
        // Filter out invisible steps and re-map to sequential step numbers
        return flow.filter(step => step.visible).map((step, index) => ({
            ...step,
            stepNumber: index + 1
        }));
    }, [hasFacilities, isGuest, isPaidBooking]);

    const getCurrentStepIndex = () => steps.findIndex(step => step.stepNumber === currentStep);
    const getNextStep = () => {
        const currentIndex = getCurrentStepIndex();
        if (currentIndex < steps.length - 1) {
            return steps[currentIndex + 1].stepNumber;
        }
        return currentStep; // Stay at review if already max
    };
    const getPrevStep = () => {
        const currentIndex = getCurrentStepIndex();
        if (currentIndex > 0) {
            return steps[currentIndex - 1].stepNumber;
        }
        return currentStep; // Stay at 1 if already min
    };
    
    const nextStep = () => {
        // Validation logic based on current step
        switch (currentStep) {
            case steps.find(s => s.name === "Visit Date")?.stepNumber:
                if (!bookingData.visit_date) {
                    toast({ title: "Validation Error", description: "Please select a visit date.", variant: "destructive" });
                    return;
                }
                break;
            case steps.find(s => s.name === "Attendees")?.stepNumber:
                if (bookingData.num_adults <= 0 && bookingData.num_children <= 0) {
                    toast({ title: "Validation Error", description: "At least one attendee (adult or child) is required.", variant: "destructive" });
                    return;
                }
                break;
            case steps.find(s => s.name === "Guest Info")?.stepNumber:
                if (isGuest && (!bookingData.guest_name || !bookingData.guest_email || !bookingData.guest_phone)) {
                    toast({ title: "Validation Error", description: "Please provide all required guest details.", variant: "destructive" });
                    return;
                }
                break;
            case steps.find(s => s.name === "Payment")?.stepNumber:
                if (isPaidBooking) {
                    if (!bookingData.payment_method) {
                        toast({ title: "Validation Error", description: "Please select a payment method.", variant: "destructive" });
                        return;
                    }
                    if (bookingData.payment_method === 'mpesa' && !bookingData.payment_phone) {
                        toast({ title: "Validation Error", description: "Please provide your M-Pesa phone number.", variant: "destructive" });
                        return;
                    }
                    if (bookingData.payment_method === 'card' && (!bookingData.card_number || !bookingData.card_expiry || !bookingData.card_cvv)) {
                        toast({ title: "Validation Error", description: "Please provide complete card details.", variant: "destructive" });
                        return;
                    }
                }
                break;
            default:
                break;
        }

        const next = getNextStep();
        if (next !== currentStep) {
            setCurrentStep(next);
        }
    };

    const prevStep = () => {
        setCurrentStep(getPrevStep());
    };
    
    // --- END STEPPED BOOKING STATE ---

    const toggleFacility = (facility, checked) => {
        if (checked) {
            setSelectedFacilities(prev => [...prev, facility]);
        } else {
            setSelectedFacilities(prev => prev.filter(f => f.name !== facility.name));
        }
    };

    const handleShare = () => {
        // ... (Share logic remains the same)
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = window.location.href;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            toast({ title: "Link copied", description: "Attraction link copied to clipboard" });
        } catch (err) {
            console.error('Failed to copy text: ', err);
            toast({ title: "Copy failed", description: "Could not copy link to clipboard.", variant: "destructive" });
        }
    };


    const handleBooking = async () => {
        // ... (Booking/Payment logic remains the same)
        if (!attraction || !userId || !db) {
            toast({ title: "System Error", description: "Application not ready for booking.", variant: "destructive" });
            return;
        }
        
        setBookingLoading(true);
        setIsProcessingPayment(true);

        // Simulate Payment
        await new Promise(resolve => setTimeout(resolve, isPaidBooking ? 2000 : 500)); 

        const bookingsColRef = collection(db, `artifacts/${appId}/users/${userId}/bookings`);

        const bookingPayload = {
            userId: user?.uid || userId,
            attractionId: attractionId,
            visitDate: bookingData.visit_date,
            totalAmount: totalAmount,
            bookingDetails: {
                numAdults: bookingData.num_adults,
                numChildren: bookingData.num_children,
                facilities: selectedFacilities.map(f => f.name),
            },
            isGuestBooking: isGuest,
            guestDetails: isGuest ? {
                name: bookingData.guest_name,
                email: bookingData.guest_email,
                phone: bookingData.guest_phone,
            } : null,
            paymentMethod: isPaidBooking ? bookingData.payment_method : 'free',
            paymentStatus: 'paid', // Assume success after simulation
            createdAt: new Date().toISOString(),
        };

        try {
            await addDoc(bookingsColRef, bookingPayload);
            setIsProcessingPayment(false);
            setIsPaymentCompleted(true);
            toast({ title: "Booking Confirmed!", description: "Your visit is successfully booked. Check your bookings dashboard." });
        } catch (error) {
            console.error("Firestore booking error:", error);
            toast({ title: "Booking Failed", description: "Could not complete the booking. Please try again.", variant: "destructive" });
            setIsProcessingPayment(false);
        } finally {
            setBookingLoading(false);
        }
    };

    // --- RENDER LOGIC ---

    if (loading) {
        // ... (Loading state remains mostly the same, ensuring square corners)
        return (
            <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
                <Header />
                <main className="container mx-auto px-4 py-6 max-w-6xl">
                    <div className="space-y-6">
                        <div className="w-full h-64 md:h-96 bg-gray-300 animate-pulse border-2 border-gray-900" />
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-300 animate-pulse border-2 border-gray-900 w-3/4" />
                                <div className="h-4 bg-gray-300 animate-pulse border-2 border-gray-900 w-1/3" />
                                <div className="h-20 bg-gray-300 animate-pulse border-2 border-gray-900" />
                            </div>
                            <div className="h-40 bg-gray-300 animate-pulse border-2 border-gray-900" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    
    const images = attraction.gallery_images?.length > 0 ? attraction.gallery_images : attraction.photo_urls;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
            <Header />
            
            <main className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-4 text-gray-900 hover:bg-gray-200 border-none"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    BACK
                </Button>
                
                {/* Two Column Layout on Large Screens */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left & Middle Column: Image Gallery and Main Details (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-full relative border-4 border-gray-900">
                            <Badge className="absolute top-4 left-4 z-20 text-xs font-bold px-3 py-1 bg-gray-900 text-white border-gray-900 shadow-lg">
                                ATTRACTION
                            </Badge>
                            <Carousel
                                opts={{ loop: true }}
                                className="w-full overflow-hidden shadow-none"
                            >
                                <CarouselContent>
                                    {images?.map((url, index) => (
                                        <CarouselItem key={index}>
                                            <img 
                                                src={url} 
                                                alt={`${attraction.location_name} ${index + 1}`} 
                                                className="w-full h-64 sm:h-80 md:h-96 object-cover" 
                                                onError={(e) => e.target.src = `https://placehold.co/800x600/6366f1/ffffff?text=Image+${index+1}`}
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        </div>

                        {/* Description & Hours Section */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Description - Left Column */}
                            {attraction.description && (
                                <Card className="p-6 border-gray-900">
                                    <h2 className="text-2xl font-bold mb-3 border-b-2 border-indigo-600 inline-block pb-1">ABOUT</h2>
                                    <p className="text-gray-600 whitespace-pre-wrap">{attraction.description}</p>
                                </Card>
                            )}

                            {/* Operating Hours & Location - Right Column */}
                            <Card className="p-6 border-gray-900">
                                <h2 className="text-2xl font-bold mb-3 border-b-2 border-indigo-600 inline-block pb-1">ESSENTIALS</h2>
                                <div className="space-y-3">
                                    {(attraction.opening_hours || attraction.closing_hours) && (
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-5 w-5 text-indigo-600" />
                                            <p className="font-medium">Hours: <span className="text-gray-600">{attraction.opening_hours} - {attraction.closing_hours}</span></p>
                                        </div>
                                    )}
                                    {attraction.days_opened?.length > 0 && (
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-indigo-600" />
                                            <p className="font-medium">Open: <span className="text-gray-600">{attraction.days_opened.join(', ')}</span></p>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-indigo-600 mt-1 flex-shrink-0" />
                                        <p className="font-medium">Location: 
                                            <a 
                                                href={attraction.location_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.location_name)}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="block text-indigo-600 hover:underline font-normal"
                                            >
                                                {attraction.location_name}, {attraction.country}
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        
                        {/* Facilities Section */}
                        {attraction.facilities && Array.isArray(attraction.facilities) && attraction.facilities.length > 0 && (
                            <Card className="p-6 border-gray-900">
                                <h2 className="text-2xl font-bold mb-3 border-b-2 border-indigo-600 inline-block pb-1">AVAILABLE FACILITIES</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {attraction.facilities.map((facility, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-indigo-50 border border-indigo-200">
                                            <FacilityIcon name={facility.name} />
                                            <div>
                                                <span className="font-semibold text-gray-800">{facility.name}</span>
                                                <p className="text-sm text-gray-500">KSh {facility.price} | Capacity: {facility.capacity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                        <ReviewSection itemId={attraction.id} itemType="attraction" />
                    </div>

                    {/* Right Column: Booking/Action Sidebar (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6 sticky top-20 h-fit">
                        <Card className="p-6 bg-white shadow-none border-gray-900">
                             <h1 className="text-2xl font-bold mb-1">{attraction.location_name}</h1>
                            {attraction.local_name && (
                                <p className="text-lg text-gray-500 mb-4">{attraction.local_name}</p>
                            )}
                            
                            {/* Entrance Fee */}
                            <div className="pb-4 mb-4 border-b-2 border-gray-200">
                                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    ENTRANCE FEE
                                </h2>
                                {attraction.entrance_type === 'free' ? (
                                    <p className="text-xl font-bold text-green-600">FREE ENTRY</p>
                                ) : (
                                    <div className="space-y-1 text-gray-700">
                                        <p>Adults: <span className="font-semibold">KSh {attraction.price_adult}</span></p>
                                        <p>Children: <span className="font-semibold">KSh {attraction.price_child}</span></p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Actions */}
                            <div className="space-y-3">
                                <Button size="lg" className="w-full" onClick={() => {
                                    if (!user) {
                                        toast({ title: "Login Required", description: "Please login or sign up to proceed with booking.", variant: "destructive" });
                                        return;
                                    }
                                    setBookingOpen(true);
                                }}>
                                    <Zap className="mr-2 h-5 w-5" />
                                    START BOOKING
                                </Button>
                                
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleShare}
                                        className="flex-1"
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        SHARE
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleSaveItem(attractionId)}
                                        className={`w-12 p-0 ${isSaved ? "bg-red-500 text-white hover:bg-red-600 border-red-600" : "text-gray-700 hover:bg-gray-100 border-gray-900"}`}
                                        title={isSaved ? "Remove from Saved" : "Save for Later"}
                                    >
                                        <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                        
                        {/* Contact Info Card */}
                        {(attraction.email || attraction.phone_number) && (
                            <Card className="p-6 bg-white border-gray-900">
                                <h2 className="text-xl font-bold mb-3 border-b-2 border-indigo-600 inline-block pb-1">GET IN TOUCH</h2>
                                <div className="space-y-2">
                                    {attraction.phone_number && (
                                        <p className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-indigo-600" />
                                            <a href={`tel:${attraction.phone_number}`} className="text-gray-700 hover:text-indigo-600 hover:underline font-medium">
                                                {attraction.phone_number}
                                            </a>
                                        </p>
                                    )}
                                    {attraction.email && (
                                        <p className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-indigo-600" />
                                            <a href={`mailto:${attraction.email}`} className="text-gray-700 hover:text-indigo-600 hover:underline font-medium">
                                                {attraction.email}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Similar Items Section */}
                {attraction && <SimilarItems currentItemId={attraction.id} itemType="attraction" country={attraction.country} />}
            </main>

            {/* Booking Dialog - STEPPED FLOW */}
            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>BOOKING: {attraction.location_name}</DialogTitle>
                    </DialogHeader>
                    
                    {/* Step Indicator */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                            {steps.map(step => (
                                <div 
                                    key={step.stepNumber} 
                                    className={`flex-1 text-center py-2 border-b-2 ${step.stepNumber <= currentStep ? 'border-indigo-600 text-indigo-600' : 'border-gray-300 text-gray-400'}`}
                                >
                                    <step.icon className="h-5 w-5 mx-auto mb-1" />
                                    STEP {step.stepNumber}: {step.name.toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {isPaymentCompleted ? (
                        <div className="text-center p-8 space-y-4">
                            <Check className="h-16 w-16 mx-auto text-green-500" />
                            <h3 className="text-2xl font-bold">BOOKING CONFIRMED!</h3>
                            <p className="text-gray-600">Your reservation has been confirmed. You will receive a confirmation email shortly.</p>
                            <Button onClick={() => setBookingOpen(false)}>CLOSE</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* --- STEP 1: VISIT DATE --- */}
                            {currentStep === steps.find(s => s.name === "Visit Date")?.stepNumber && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">1. WHEN WOULD YOU LIKE TO VISIT?</h3>
                                    <Label htmlFor="visit_date">Select Visit Date</Label>
                                    <Input
                                        id="visit_date"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingData.visit_date}
                                        onChange={(e) => setBookingData({...bookingData, visit_date: e.target.value})}
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-2">The attraction is open daily from {attraction.opening_hours} to {attraction.closing_hours}.</p>
                                </div>
                            )}

                            {/* --- STEP 2: ATTENDEES --- */}
                            {currentStep === steps.find(s => s.name === "Attendees")?.stepNumber && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">2. NUMBER OF PEOPLE</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="num_adults">Adults (KSh {attraction.price_adult})</Label>
                                            <Input
                                                id="num_adults"
                                                type="number"
                                                min="0"
                                                value={bookingData.num_adults}
                                                onChange={(e) => setBookingData({...bookingData, num_adults: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="num_children">Children (KSh {attraction.price_child})</Label>
                                            <Input
                                                id="num_children"
                                                type="number"
                                                min="0"
                                                value={bookingData.num_children}
                                                onChange={(e) => setBookingData({...bookingData, num_children: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 3: FACILITIES (Conditional) --- */}
                            {currentStep === steps.find(s => s.name === "Facilities")?.stepNumber && hasFacilities && (
                                <div className="space-y-3 p-4 border-2 border-gray-900 bg-gray-50">
                                    <h3 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">3. OPTIONAL FACILITIES</h3>
                                    {attraction.facilities.map((facility, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`facility-${idx}`}
                                                    checked={selectedFacilities.some(f => f.name === facility.name)}
                                                    onCheckedChange={(checked) => toggleFacility(facility, checked)}
                                                />
                                                <label htmlFor={`facility-${idx}`} className="flex items-center gap-2 cursor-pointer">
                                                    <FacilityIcon name={facility.name} />
                                                    <span className="font-medium text-gray-800">{facility.name}</span>
                                                </label>
                                            </div>
                                            <span className="font-bold text-indigo-600">KSh {facility.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* --- STEP 4: GUEST DETAILS (Conditional) --- */}
                            {currentStep === steps.find(s => s.name === "Guest Info")?.stepNumber && isGuest && (
                                <div className="space-y-3 p-4 border-2 border-gray-900">
                                    <h3 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">4. GUEST CONTACT INFORMATION</h3>
                                    <div>
                                        <Label htmlFor="guest_name">Your Full Name</Label>
                                        <Input
                                            id="guest_name"
                                            value={bookingData.guest_name}
                                            onChange={(e) => setBookingData({...bookingData, guest_name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="guest_email">Email for Confirmation</Label>
                                        <Input
                                            id="guest_email"
                                            type="email"
                                            value={bookingData.guest_email}
                                            onChange={(e) => setBookingData({...bookingData, guest_email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="guest_phone">Phone Number</Label>
                                        <Input
                                            id="guest_phone"
                                            type="tel"
                                            value={bookingData.guest_phone}
                                            onChange={(e) => setBookingData({...bookingData, guest_phone: e.target.value})}
                                            placeholder="+2547XXXXXXXX"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* --- STEP 5: PAYMENT (Conditional) --- */}
                            {currentStep === steps.find(s => s.name === "Payment")?.stepNumber && isPaidBooking && (
                                <div className="space-y-3 p-4 border-2 border-gray-900 bg-gray-50">
                                    <h3 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">5. COMPLETE PAYMENT</h3>
                                    <Label>Select Payment Method</Label>
                                    <select
                                        id="payment_method"
                                        className="w-full border-2 border-gray-900 p-2 h-10 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                        value={bookingData.payment_method}
                                        onChange={(e) => setBookingData({...bookingData, payment_method: e.target.value})}
                                    >
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="card">Credit/Debit Card (Mock)</option>
                                    </select>
                                
                                    {bookingData.payment_method === 'mpesa' && (
                                        <div className="mt-3">
                                            <Label htmlFor="payment_phone">M-Pesa Phone Number</Label>
                                            <Input
                                                id="payment_phone"
                                                type="tel"
                                                value={bookingData.payment_phone}
                                                onChange={(e) => setBookingData({...bookingData, payment_phone: e.target.value})}
                                                placeholder="+2547XXXXXXXX"
                                                required
                                            />
                                        </div>
                                    )}

                                    {bookingData.payment_method === 'card' && (
                                        <div className="space-y-3 mt-3">
                                            <Input
                                                id="card_number"
                                                value={bookingData.card_number}
                                                onChange={(e) => setBookingData({...bookingData, card_number: e.target.value})}
                                                placeholder="Card Number"
                                                maxLength={19}
                                                required
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    id="card_expiry"
                                                    value={bookingData.card_expiry}
                                                    onChange={(e) => setBookingData({...bookingData, card_expiry: e.target.value})}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    required
                                                />
                                                <Input
                                                    id="card_cvv"
                                                    type="password"
                                                    value={bookingData.card_cvv}
                                                    onChange={(e) => setBookingData({...bookingData, card_cvv: e.target.value})}
                                                    placeholder="CVV"
                                                    maxLength={4}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* --- STEP 6: REVIEW --- */}
                            {currentStep === steps.find(s => s.name === "Review")?.stepNumber && (
                                <div className="space-y-4 p-4 border-2 border-gray-900">
                                    <h3 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2">REVIEW & CONFIRM</h3>
                                    
                                    <div className="space-y-2 text-gray-700">
                                        <p className="flex justify-between font-semibold">Visit Date: <span className="font-normal text-gray-900">{bookingData.visit_date || 'N/A'}</span></p>
                                        <p className="flex justify-between font-semibold">Attendees: <span className="font-normal text-gray-900">{bookingData.num_adults} Adult(s), {bookingData.num_children} Child(ren)</span></p>
                                        {isGuest && <p className="flex justify-between font-semibold">Contact: <span className="font-normal text-gray-900">{bookingData.guest_email}</span></p>}
                                        
                                        {selectedFacilities.length > 0 && (
                                            <div className="pt-2 border-t border-gray-200">
                                                <p className="font-semibold mb-1">Selected Facilities:</p>
                                                <ul className="list-disc pl-5 text-sm">
                                                    {selectedFacilities.map(f => <li key={f.name}>{f.name} (KSh {f.price})</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 border-t-2 border-gray-900">
                                        <p className="text-xl font-bold flex justify-between items-center text-gray-800">
                                            <span>TOTAL AMOUNT:</span>
                                            <span className="text-indigo-600">KSh {totalAmount.toFixed(0)}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between gap-4 pt-4 border-t-2 border-gray-900">
                                <Button 
                                    onClick={prevStep} 
                                    variant="outline" 
                                    disabled={currentStep === steps[0].stepNumber || bookingLoading}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    PREVIOUS
                                </Button>
                                
                                {currentStep === steps[steps.length - 1].stepNumber ? (
                                    <Button onClick={handleBooking} className="flex-1" disabled={bookingLoading}>
                                        {bookingLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {isProcessingPayment ? "PROCESSING PAYMENT..." : "CONFIRMING..."}
                                            </>
                                        ) : (
                                            `CONFIRM & PAY KSH ${totalAmount.toFixed(0)}`
                                        )}
                                    </Button>
                                ) : (
                                    <Button onClick={nextStep}>
                                        NEXT
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            
            <MobileBottomBar />
            <Footer />
        </div>
    );
}


// --- Main App Wrapper and Export ---
export default function App() {
    return (
        <AuthProvider>
            <AttractionDetailContent />
        </AuthProvider>
    );
}