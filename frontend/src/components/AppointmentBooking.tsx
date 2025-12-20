import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../hooks/useAuth.tsx"; // ✅ Import useAuth

interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  current_bookings_count: number;
  is_available: boolean;
}

const AppointmentBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Get logged in user

  const serviceId = parseInt(searchParams.get("serviceId") || "1");
  const serviceName = searchParams.get("serviceName") || "General Consultation";

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // ✅ Pre-fill with user details if available
  const [customerName, setCustomerName] = useState<string>(user?.full_name || "");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");

  // ✅ Update state when user loads (in case auth loads after component)
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentStep === 2) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentStep]);

  const fetchSlots = async () => {
    setLoading(true);
    setSlots([]);
    try {
      const response = await axios.get<Slot[]>("http://localhost:8000/api/slots", {
        params: { date: selectedDate, appointment_type_id: serviceId },
      });
      setSlots(response.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
  };

  const handleBookNow = async () => {
    if (!selectedSlot || !customerName || !customerEmail) return;

    try {
      const res = await axios.post("http://localhost:8000/api/bookings", {
        appointment_type_id: serviceId,
        start_time: selectedSlot.start_time,
        customer_name: customerName,
        customer_email: customerEmail,
      });

      const bookingId = res.data?.id;
      if (!bookingId) {
        throw new Error("Booking ID not returned from backend");
      }

      // ✅ ONLY pass what booking page actually knows
      navigate("/dashboard/payment", {
        state: {
          bookingId,
          selectedDate,
          startTime: selectedSlot.start_time,
        },
      });
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. The slot may be full.");
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const canProceed = () => {
    if (currentStep === 1) return !!selectedDate;
    if (currentStep === 2) return !!selectedSlot;
    if (currentStep === 3) return !!customerName && !!customerEmail;
    return false;
  };

  if (bookingSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-beige-100 via-white to-beige-200">
        <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-2">{serviceName}</p>
          <p className="text-gray-600 mb-6">Your appointment has been successfully booked.</p>
          <p className="text-lg font-semibold text-black">
            {selectedSlot ? `${formatTime(selectedSlot.start_time)} on ${selectedDate}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-beige-100 via-white to-beige-200 text-gray-900 font-sans">
      <div className="relative w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col md:flex-row min-h-[550px]">
        {/* Left Sidebar */}
        <div className="md:w-1/3 p-8 bg-black text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black opacity-90 z-0"></div>

          <div className="relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-xs font-semibold tracking-wider mb-4 border border-white/10">
              URBANCARE
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Book<br />{serviceName}
            </h1>
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">
              Experience world-class service. Follow the steps to complete your booking.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            {[
              { num: 1, label: "Choose Date" },
              { num: 2, label: "Select Time" },
              { num: 3, label: "Confirm" },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border
                    ${currentStep >= step.num
                        ? "bg-beige-100 text-black border-beige-100"
                        : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                  >
                    {currentStep > step.num ? "✓" : step.num}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= step.num ? "text-white" : "text-gray-500"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && <div className="w-0.5 h-4 bg-gray-700 ml-4 mb-2"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="md:w-2/3 p-10 flex flex-col">
          {/* Step 1: Date */}
          {currentStep === 1 && (
            <div className="flex-grow">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Step 1: Select Date</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          )}

          {/* Step 2: Time */}
          {currentStep === 2 && (
            <div className="flex-grow">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Step 2: Select Time</h3>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : slots.length === 0 ? (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-400">No slots available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={!slot.is_available}
                      className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all border
                        ${!slot.is_available
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                          : selectedSlot?.id === slot.id
                            ? "bg-black text-white border-black shadow-lg scale-105"
                            : "bg-white text-gray-700 border-gray-200 hover:border-black"
                        }`}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 3 && (
            <div className="flex-grow">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Step 3: Your Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="mt-6 p-4 bg-beige-100 rounded-xl">
                  <p className="text-sm text-gray-600">Appointment Summary:</p>
                  <p className="text-lg font-bold text-black mt-1">
                    {selectedSlot && formatTime(selectedSlot.start_time)} on {selectedDate}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${canProceed() ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleBookNow}
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${canProceed() ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;