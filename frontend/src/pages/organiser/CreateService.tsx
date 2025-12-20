import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import axios from "axios";

export default function CreateService() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        duration_minutes: 30,
        price: "",
        is_published: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post("http://localhost:8000/api/services", {
                name: formData.name,
                description: formData.description || null,
                duration_minutes: parseInt(formData.duration_minutes.toString()),
                is_published: formData.is_published
            });

            navigate("/organiser");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate("/organiser")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div>
                        <h2>Create New Service</h2>
                        <p>Add a new service for customers to book</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-card" style={{ maxWidth: "600px" }}>
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="error-banner mb-4">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Hair Styling, Consultation"
                            className="input"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your service..."
                            className="input"
                            rows={3}
                            style={{ resize: "vertical" }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration (minutes) *
                            </label>
                            <select
                                name="duration_minutes"
                                value={formData.duration_minutes}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price (optional)
                            </label>
                            <input
                                type="text"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="e.g., $50"
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleChange}
                                className="w-5 h-5"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Publish immediately (visible to customers)
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="btn btn-outline flex-1"
                            onClick={() => navigate("/organiser")}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={loading || !formData.name}
                        >
                            {loading ? (
                                "Creating..."
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Service
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
