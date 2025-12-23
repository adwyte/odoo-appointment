import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { API_BASE } from "../../config";

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
    const { paymentId } = useParams(); // ✅ URL PARAM
    const parsedPaymentId = paymentId ? Number(paymentId) : null;

    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!parsedPaymentId) return;

        const run = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE}/payments/receipt`, {
                    params: { payment_id: parsedPaymentId },
                });
                setData(res.data);
            } catch (err) {
                console.error("Receipt fetch failed:", err);
                alert("Could not load receipt.");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [parsedPaymentId]);

    const prettyDate = useMemo(() => {
        if (!data?.start_time) return "";
        return new Date(data.start_time).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    }, [data?.start_time]);

    const prettyTime = useMemo(() => {
        if (!data?.start_time) return "";
        return new Date(data.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }, [data?.start_time]);

    const paidAt = useMemo(() => {
        if (!data?.paid_at) return "";
        return new Date(data.paid_at).toLocaleString();
    }, [data?.paid_at]);

    if (!parsedPaymentId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>No payment found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-beige-100 via-white to-beige-200">
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                {/* LEFT */}
                <div className="md:w-1/3 p-8 bg-black text-white">
                    <span className="inline-block mb-4 px-3 py-1 text-xs bg-white/20 rounded-full">
                        URBANCARE
                    </span>

                    <h1 className="text-3xl font-extrabold">Receipt</h1>
                    <p className="mt-3 text-gray-300 text-sm">
                        Proof of payment. Keep it safe.
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-xs text-green-300">
                        <BadgeCheck className="w-4 h-4" />
                        Payment successful
                    </div>
                </div>

                {/* RIGHT */}
                <div className="md:w-2/3 p-8">
                    <div className="flex justify-between mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 border rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl"
                        >
                            <Download className="w-4 h-4" /> Print
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading receipt…</p>
                    ) : !data ? (
                        <p>Receipt not found.</p>
                    ) : (
                        <div className="space-y-5 text-sm">

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5" />
                                    <h2 className="font-bold">Payment Receipt</h2>
                                </div>
                                <span className="text-xs font-semibold">{data.receipt_no}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        {data.customer_name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="w-4 h-4" />
                                        {data.customer_email}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div>Paid at</div>
                                    <div className="font-semibold">{paidAt}</div>
                                    <div>Status: {data.status}</div>
                                    <div>Provider: {data.provider}</div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-xl">
                                <div className="font-semibold">{data.service_name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <CalendarDays className="w-4 h-4" />
                                    {prettyDate} • {prettyTime}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex justify-between">
                                    <span>Base Price</span>
                                    <span>{data.base_price} {data.currency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>{data.tax} {data.currency}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>{data.total} {data.currency}</span>
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
