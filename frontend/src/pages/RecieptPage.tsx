import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Receipt,
  User,
  BadgeCheck,
  Download,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

type ReceiptState = { paymentId?: number };

type ReceiptData = {
  receipt_no: string;
  payment_id: number;
  booking_id: number;
  status: string;
  provider: string;
  currency: string;

  customer_name: string;
  customer_email: string;
  service_name: string;

  base_price: number;
  tax: number;
  total: number;

  paid_at: string;
  start_time: string;
  end_time: string;
};

const ReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const params = useParams();

  // ✅ Primary: URL param (/dashboard/receipt/:paymentId)
  // ✅ Fallback: location.state.paymentId (if you ever use it)
  const paymentId =
    (params.paymentId ? Number(params.paymentId) : null) ??
    ((state as ReceiptState | null)?.paymentId ?? null);

  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!paymentId || Number.isNaN(paymentId)) return;

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/payments/receipt`, {
          params: { payment_id: paymentId },
        });
        setData(res.data);
      } catch (e: any) {
        console.error("Receipt fetch failed:", e?.response?.data || e);
        alert("Could not load receipt.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [paymentId]);

  const prettyTime = useMemo(() => {
    if (!data?.start_time) return "";
    return new Date(data.start_time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [data?.start_time]);

  const prettyDate = useMemo(() => {
    if (!data?.start_time) return "";
    return new Date(data.start_time).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }, [data?.start_time]);

  const paidAt = useMemo(() => {
    if (!data?.paid_at) return "";
    return new Date(data.paid_at).toLocaleString();
  }, [data?.paid_at]);

  if (!paymentId || Number.isNaN(paymentId)) {
    return (
      <div className="min-h-screen p-10 bg-gradient-to-br from-beige-100 via-white to-beige-200">
        <div className="max-w-xl bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold">Receipt</h2>
          <p className="mt-2 text-gray-600">No payment found.</p>
          <button
            onClick={() => navigate("/dashboard/my-bookings")}
            className="mt-6 px-6 py-3 rounded-xl bg-black text-white font-semibold"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-beige-100 via-white to-beige-200">
      <div className="relative w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        {/* Left panel */}
        <div className="md:w-1/3 p-8 bg-black text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-90" />
          <div className="relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-xs font-semibold tracking-wider mb-4 border border-white/10">
              URBANCARE
            </span>

            <h1 className="text-4xl font-extrabold leading-tight">Receipt</h1>
            <p className="mt-4 text-gray-300 text-sm">
              Proof of payment. Save it. Screenshot it. Flex it.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-gray-300">
              <BadgeCheck className="w-4 h-4 text-green-300" />
              <span>Payment recorded</span>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="md:w-2/3 p-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl font-semibold bg-black text-white hover:bg-gray-800 transition inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Print / Save
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            </div>
          ) : !data ? (
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              Could not load receipt.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  <h2 className="font-bold text-gray-900">Payment Receipt</h2>
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {data.receipt_no}
                </span>
              </div>

              <div className="p-6 space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">{data.customer_name}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{data.customer_email}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-gray-600">Paid at</div>
                    <div className="font-semibold text-gray-900">{paidAt}</div>
                    <div className="mt-2 text-gray-600">
                      Status: <span className="font-semibold">{data.status}</span>
                    </div>
                    <div className="text-gray-600">
                      Provider: <span className="font-semibold">{data.provider}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <div className="font-semibold text-gray-900">{data.service_name}</div>
                  <div className="mt-2 flex items-center gap-2 text-gray-600">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      {prettyDate} • {prettyTime}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Booking ID: #{data.booking_id} • Payment ID: #{data.payment_id}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Base Price</span>
                    <span className="font-semibold">
                      {data.base_price} {data.currency}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-700">Tax</span>
                    <span className="font-semibold">
                      {data.tax} {data.currency}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-3" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold">
                      {data.total} {data.currency}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Note: This is generated from your database payment record.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;