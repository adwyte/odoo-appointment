import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CreditCard,
  Landmark,
  QrCode,
  Wallet,
  ShieldCheck,
  CalendarDays,
  Mail,
  Receipt,
  ArrowLeft,
  Lock,
  User as UserIcon,
} from "lucide-react";

type Method = "credit" | "debit" | "upi" | "paypal";

type PaymentState = {
  bookingId?: number | null;
  selectedDate?: string;
  startTime?: string;
};

type CheckoutData = {
  booking_id: number;
  customer_name: string;
  customer_email: string;
  service_name: string;
  price: number;
  tax: number;
  total: number;
  currency: string;
};

const API_BASE = "http://localhost:8000/api";

const PaymentPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const data = (state || null) as PaymentState | null;
  const bookingId = data?.bookingId ?? null;

  const [method, setMethod] = useState<Method>("credit");
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");

  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!bookingId) return;
      try {
        setLoadingCheckout(true);
        const res = await axios.get(`${API_BASE}/payments/checkout`, {
          params: { booking_id: bookingId },
        });
        setCheckout(res.data);
      } catch (e: any) {
        console.error("Checkout fetch failed:", e?.response?.data || e);
        alert("Could not load payment details. Try again.");
        setCheckout(null);
      } finally {
        setLoadingCheckout(false);
      }
    };
    run();
  }, [bookingId]);

  const prettyTime = useMemo(() => {
    const t = data?.startTime;
    if (!t) return "";
    return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [data?.startTime]);

  const prettyDate = useMemo(() => {
    const d = data?.selectedDate;
    if (!d) return "";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }, [data?.selectedDate]);

  const maskCard = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return (digits.match(/.{1,4}/g) || []).join(" ");
  };

  const canPay =
    !!checkout &&
    (method === "upi" ||
      method === "paypal" ||
      (nameOnCard.trim().length > 0 &&
        cardNumber.replace(/\s/g, "").length >= 12 &&
        exp.trim().length >= 4 &&
        cvv.trim().length >= 3));

  const handlePayNow = async () => {
    if (!checkout?.booking_id) {
      alert("Missing checkout details. Please reload.");
      return;
    }

    try {
      setPaying(true);

      // 1) init payment in DB
      const initRes = await axios.post(`${API_BASE}/payments/init`, {
        booking_id: checkout.booking_id,
        amount: checkout.total,
        currency: checkout.currency,
        provider: "mock",
      });

      // backend may return id OR paymentId — handle both safely
      const paymentId =
        initRes.data?.id ?? initRes.data?.payment_id ?? initRes.data?.paymentId;

      if (!paymentId) {
        console.error("Init payment response:", initRes.data);
        throw new Error("Payment init succeeded but payment id missing from response");
      }

      // 2) mark payment success (should update payments table + booking status)
      await axios.post(`${API_BASE}/payments/success`, {
        payment_id: paymentId,
      });

      alert("Payment successful ");
      navigate(`/dashboard/payment/receipt/${paymentId}`);
    } catch (err: any) {
      console.error("Payment failed:", err?.response?.data || err);
      alert("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen p-10 bg-gradient-to-br from-beige-100 via-white to-beige-200">
        <div className="max-w-xl bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
          <p className="mt-2 text-gray-600">No booking info found. Book an appointment first.</p>
          <button
            onClick={() => navigate("/dashboard/book-now")}
            className="mt-6 px-6 py-3 rounded-xl bg-black text-white font-semibold"
          >
            Go to Book Now
          </button>
        </div>
      </div>
    );
  }

  const methods: Array<{ key: Method; label: string; Icon: React.ElementType }> = [
    { key: "credit", label: "Credit Card", Icon: CreditCard },
    { key: "debit", label: "Debit Card", Icon: Landmark },
    { key: "upi", label: "UPI Pay", Icon: QrCode },
    { key: "paypal", label: "Paypal", Icon: Wallet },
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-beige-100 via-white to-beige-200 text-gray-900 font-sans">
      <div className="relative w-full max-w-6xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* LEFT */}
        <div className="md:w-1/3 p-8 bg-black text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black opacity-90 z-0" />

          <div className="relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-xs font-semibold tracking-wider mb-4 border border-white/10">
              URBANCARE
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">Payment</h1>

            <p className="mt-4 text-gray-300 text-sm leading-relaxed">
              Complete payment to confirm your booking.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-gray-300">
              <ShieldCheck className="w-4 h-4 text-green-300" />
              <span>Secure checkout</span>
              <span className="opacity-50">•</span>
              <Lock className="w-4 h-4 text-beige-100" />
              <span>Encrypted</span>
            </div>
          </div>

          <div className="relative z-10 mt-10">
            {[
              { num: 1, label: "Choose Date" },
              { num: 2, label: "Select Time" },
              { num: 3, label: "Confirm" },
              { num: 4, label: "Pay" },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border bg-beige-100 text-black border-beige-100">
                    {step.num < 4 ? "✓" : step.num}
                  </div>
                  <span className="text-sm font-medium text-white">{step.label}</span>
                </div>
                {idx < 3 && <div className="w-0.5 h-4 bg-gray-700 ml-4 mb-2" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="md:w-2/3 p-10 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Step 4: Payment Details
              </h3>
              <p className="text-sm text-gray-600">
                {checkout ? (
                  <>
                    Paying for{" "}
                    <span className="font-semibold text-gray-900">
                      {checkout.service_name}
                    </span>
                  </>
                ) : (
                  "Loading service..."
                )}
              </p>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-all inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {loadingCheckout ? (
            <div className="flex items-center justify-center flex-grow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            </div>
          ) : !checkout ? (
            <div className="mt-8 p-6 rounded-2xl border border-gray-200 bg-white">
              <p className="text-gray-700">Could not load checkout details.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-5 py-3 rounded-xl bg-black text-white font-semibold"
              >
                Reload
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
              {/* METHODS + FORM */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-bold">Choose a payment method</h4>
                </div>

                <div className="space-y-3 mb-6">
                  {methods.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMethod(key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                        ${method === key
                          ? "border-black bg-black text-white shadow-lg"
                          : "border-gray-200 bg-white hover:border-black"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${method === key ? "text-white" : "text-gray-700"}`} />
                        <span className="font-semibold">{label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === key ? "border-white" : "border-gray-300"
                          }`}
                      >
                        {method === key && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {(method === "credit" || method === "debit") ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                      <input
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        placeholder={checkout.customer_name}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(maskCard(e.target.value))}
                        placeholder="•••• •••• •••• ••••"
                        inputMode="numeric"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                        <input
                          value={exp}
                          onChange={(e) => setExp(e.target.value.slice(0, 5))}
                          placeholder="MM/YY"
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Security Code</label>
                        <input
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="CVV"
                          inputMode="numeric"
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                      <Lock className="w-4 h-4" />
                      Demo card inputs • Payment is recorded via mock provider
                    </p>
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                    <p className="font-semibold text-gray-900">
                      {method === "upi" ? "UPI payment selected" : "Paypal payment selected"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Demo method – we still record payment success in DB via mock provider.
                    </p>
                  </div>
                )}
              </div>

              {/* SUMMARY */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900">Order Summary</h4>
                  </div>

                  <div className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{checkout.service_name}</span>
                      <span className="font-semibold">
                        {checkout.price} {checkout.currency}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Taxes</span>
                      <span>
                        {checkout.tax} {checkout.currency}
                      </span>
                    </div>

                    <div className="h-px bg-gray-200 my-2" />

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-extrabold text-lg text-gray-900">
                        {checkout.total} {checkout.currency}
                      </span>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span>
                          Customer: <span className="font-semibold">{checkout.customer_name}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>
                          Email: <span className="font-semibold">{checkout.customer_email}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <span>
                          When: <span className="font-semibold">{prettyTime}</span> on{" "}
                          <span className="font-semibold">{prettyDate}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-500" />
                        <span>
                          Booking: <span className="font-semibold">#{checkout.booking_id}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handlePayNow}
                      disabled={!canPay || paying}
                      className={`mt-4 w-full py-3 rounded-xl font-bold transition-all
                        ${!canPay || paying
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-800"
                        }`}
                    >
                      {paying ? "Processing..." : "Pay Now"}
                    </button>

                    <button
                      onClick={() => navigate(-1)}
                      className="mt-3 w-full py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100" />
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;