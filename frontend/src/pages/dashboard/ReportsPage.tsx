import { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PieChart,
  BarChart3,
  Activity,
  Info,
} from "lucide-react";
import { api } from "../../services/api";

interface Stats {
  total_users: number;
  total_admins: number;
  total_organisers: number;
  total_customers: number;
  active_users: number;
}

interface AppointmentStats {
  total: number;
  pending_count: number;
  confirmed_count: number;
  cancelled_count: number;
  completed_count: number;
}

interface ReportData {
  userStats: Stats | null;
  appointmentStats: AppointmentStats | null;
}

interface TooltipData {
  x: number;
  y: number;
  title: string;
  value: number;
  percentage: string;
  description: string;
  color: string;
  visible: boolean;
}

// Status descriptions for detailed tooltips
const statusDescriptions: Record<string, string> = {
  Pending: "Appointments awaiting confirmation from the organiser. These bookings need attention and approval.",
  Confirmed: "Appointments that have been confirmed and scheduled. The customer and organiser are both notified.",
  Completed: "Successfully finished appointments. The service was delivered as scheduled.",
  Cancelled: "Appointments that were cancelled by either the customer or organiser before the scheduled time.",
  Customers: "Regular users who book appointments and use services on the platform.",
  Organisers: "Service providers who manage appointments, set availability, and deliver services.",
  Admins: "Platform administrators with full access to manage users, services, and system settings.",
  Mon: "Monday - Start of the business week, typically moderate booking activity.",
  Tue: "Tuesday - Usually sees consistent booking patterns.",
  Wed: "Wednesday - Mid-week, often peak booking day.",
  Thu: "Thursday - High activity as customers plan for the weekend.",
  Fri: "Friday - End of business week, popular for weekend appointments.",
  Sat: "Saturday - Weekend day, varies by service type.",
  Sun: "Sunday - Typically lower activity, rest day for many services.",
};

// Custom Tooltip Component
const Tooltip = ({ data }: { data: TooltipData }) => {
  if (!data.visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: data.x + 15,
        top: data.y - 10,
        background: "#1f2937",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        zIndex: 1000,
        maxWidth: "280px",
        pointerEvents: "none",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "3px",
            background: data.color,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: "14px" }}>{data.title}</span>
      </div>
      <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{data.value}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>Count</div>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{data.percentage}%</div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>Percentage</div>
        </div>
      </div>
      <div style={{ fontSize: "12px", color: "#d1d5db", lineHeight: "1.4" }}>
        {data.description}
      </div>
    </div>
  );
};

// Info Icon with Tooltip
const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <span
      style={{ position: "relative", display: "inline-flex", cursor: "help" }}
      onMouseEnter={(e) => {
        setPos({ x: e.clientX, y: e.clientY });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="w-4 h-4" style={{ color: "#9ca3af" }} />
      {show && (
        <div
          style={{
            position: "fixed",
            left: pos.x + 10,
            top: pos.y - 5,
            background: "#1f2937",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            maxWidth: "250px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
};

// Pie Chart Component with Enhanced Tooltips
const PieChartComponent = ({
  data,
  size = 200,
  title,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#6b7280" }}>No data available</p>
      </div>
    );
  }

  let currentAngle = -90;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      path,
      percentage: percentage.toFixed(1),
    };
  });

  const handleMouseMove = (e: React.MouseEvent, slice: typeof slices[0]) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: slice.label,
      value: slice.value,
      percentage: slice.percentage,
      description: statusDescriptions[slice.label] || `${slice.label} data point`,
      color: slice.color,
      visible: true,
    });
  };

  return (
    <div>
      {title && <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>{title}</h4>}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <svg
          width={size}
          height={size}
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
        >
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              stroke="#fff"
              strokeWidth="2"
              style={{ transition: "transform 0.2s, filter 0.2s", cursor: "pointer" }}
              onMouseMove={(e) => handleMouseMove(e, slice)}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
              onMouseOver={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {slices.map((slice, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
              onMouseMove={(e) => handleMouseMove(e, slice)}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  background: slice.color,
                }}
              />
              <span style={{ fontSize: "14px" }}>
                {slice.label}: <strong>{slice.value}</strong> ({slice.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      <Tooltip data={tooltip} />
    </div>
  );
};

// Donut Chart Component with Enhanced Tooltips
const DonutChart = ({
  data,
  size = 180,
  title,
  centerLabel,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title: string;
  centerLabel?: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#6b7280" }}>No data available</p>
      </div>
    );
  }

  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  let offset = 0;
  const segments = data.map((item) => {
    const percentage = item.value / total;
    const dashLength = circumference * percentage;
    const dashOffset = circumference - offset;
    offset += dashLength;

    return {
      ...item,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  const handleMouseMove = (e: React.MouseEvent, seg: typeof segments[0]) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: seg.label,
      value: seg.value,
      percentage: seg.percentage,
      description: statusDescriptions[seg.label] || `${seg.label} data point`,
      color: seg.color,
      visible: true,
    });
  };

  return (
    <div>
      {title && <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>{title}</h4>}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ position: "relative" }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                style={{ transition: "stroke-dashoffset 0.5s ease, stroke-width 0.2s", cursor: "pointer" }}
                onMouseMove={(e) => handleMouseMove(e, seg)}
                onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                onMouseOver={(e) => (e.currentTarget.style.strokeWidth = "35")}
                onMouseOut={(e) => (e.currentTarget.style.strokeWidth = "30")}
              />
            ))}
          </svg>
          {centerLabel && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{total}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{centerLabel}</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
              onMouseMove={(e) => handleMouseMove(e, seg)}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: seg.color,
                }}
              />
              <span style={{ fontSize: "14px" }}>
                {seg.label}: <strong>{seg.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
      <Tooltip data={tooltip} />
    </div>
  );
};

// Bar Chart Component with Enhanced Tooltips
const BarChartComponent = ({
  data,
  height = 200,
  title,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
  title: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 50;
  const gap = 20;
  const width = data.length * (barWidth + gap) + gap;

  const handleMouseMove = (e: React.MouseEvent, item: typeof data[0]) => {
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: item.label,
      value: item.value,
      percentage,
      description: statusDescriptions[item.label] || `${item.label} data point`,
      color: item.color,
      visible: true,
    });
  };

  return (
    <div>
      {title && <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>{title}</h4>}
      <div style={{ overflowX: "auto" }}>
        <svg width={width} height={height + 40} style={{ minWidth: "100%" }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent, i) => (
            <g key={i}>
              <line
                x1="0"
                y1={height - (height * percent) / 100}
                x2={width}
                y2={height - (height * percent) / 100}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text x="5" y={height - (height * percent) / 100 - 5} fontSize="10" fill="#9ca3af">
                {Math.round((maxValue * percent) / 100)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, i) => {
            const barHeight = (item.value / maxValue) * height;
            const x = gap + i * (barWidth + gap);
            const y = height - barHeight;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  rx="4"
                  style={{ transition: "height 0.3s, y 0.3s, filter 0.2s", cursor: "pointer" }}
                  onMouseMove={(e) => handleMouseMove(e, item)}
                  onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                  onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.15)")}
                  onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#374151"
                >
                  {item.value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <Tooltip data={tooltip} />
    </div>
  );
};

// Line Chart Component with Enhanced Tooltips
const LineChartComponent = ({
  data,
  height = 200,
  width = 400,
  title,
  color = "#3b82f6",
}: {
  data: { label: string; value: number }[];
  height?: number;
  width?: number;
  title: string;
  color?: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#6b7280" }}>No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((item, i) => ({
    x: padding + (i / (data.length - 1 || 1)) * chartWidth,
    y: padding + chartHeight - (item.value / maxValue) * chartHeight,
    ...item,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x || padding} ${
    padding + chartHeight
  } L ${padding} ${padding + chartHeight} Z`;

  const handleMouseMove = (e: React.MouseEvent, point: typeof points[0]) => {
    const percentage = total > 0 ? ((point.value / total) * 100).toFixed(1) : "0";
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: point.label,
      value: point.value,
      percentage,
      description: statusDescriptions[point.label] || `Appointments on ${point.label}`,
      color,
      visible: true,
    });
  };

  return (
    <div>
      {title && <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>{title}</h4>}
      <svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent, i) => {
          const y = padding + chartHeight - (chartHeight * percent) / 100;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4" />
              <text x="5" y={y + 4} fontSize="10" fill="#9ca3af">
                {Math.round((maxValue * percent) / 100)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`${color}20`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="8"
              fill="#fff"
              stroke={color}
              strokeWidth="3"
              style={{ cursor: "pointer", transition: "r 0.2s" }}
              onMouseMove={(e) => handleMouseMove(e, p)}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
              onMouseOver={(e) => e.currentTarget.setAttribute("r", "12")}
              onMouseOut={(e) => e.currentTarget.setAttribute("r", "8")}
            />
            <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#6b7280">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <Tooltip data={tooltip} />
    </div>
  );
};

// Horizontal Bar Chart Component with Enhanced Tooltips
const HorizontalBarChart = ({
  data,
  title,
}: {
  data: { label: string; value: number; color: string }[];
  title: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const handleMouseMove = (e: React.MouseEvent, item: typeof data[0]) => {
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: item.label,
      value: item.value,
      percentage,
      description: statusDescriptions[item.label] || `${item.label} data point`,
      color: item.color,
      visible: true,
    });
  };

  return (
    <div>
      {title && <h4 style={{ marginBottom: "16px", fontWeight: 600 }}>{title}</h4>}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data.map((item, i) => (
          <div
            key={i}
            style={{ cursor: "pointer" }}
            onMouseMove={(e) => handleMouseMove(e, item)}
            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px" }}>{item.label}</span>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.value}</span>
            </div>
            <div
              style={{
                height: "24px",
                background: "#f3f4f6",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(item.value / maxValue) * 100}%`,
                  background: item.color,
                  borderRadius: "6px",
                  transition: "width 0.5s ease, filter 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: "8px",
                }}
                onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
              >
                {item.value > maxValue * 0.2 && (
                  <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                    {((item.value / maxValue) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Tooltip data={tooltip} />
    </div>
  );
};

// Gauge Chart Component with Enhanced Tooltips
const GaugeChart = ({
  value,
  max = 100,
  title,
  color,
  size = 150,
  description,
}: {
  value: number;
  max?: number;
  title: string;
  color: string;
  size?: number;
  description?: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: `${title} Rate`,
      value: value,
      percentage: value.toString(),
      description: description || `Current ${title.toLowerCase()} rate is ${value}% of all appointments.`,
      color,
      visible: true,
    });
  };

  return (
    <div
      style={{ textAlign: "center", cursor: "pointer" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
    >
      <h4 style={{ marginBottom: "12px", fontWeight: 600, fontSize: "14px" }}>{title}</h4>
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={size} height={size / 2 + 20}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 700, color }}>{value}%</div>
        </div>
      </div>
      <Tooltip data={tooltip} />
    </div>
  );
};

// Radial Progress Component with Enhanced Tooltips
const RadialProgress = ({
  value,
  max = 100,
  label,
  color,
  size = 100,
  description,
}: {
  value: number;
  max?: number;
  label: string;
  color: string;
  size?: number;
  description?: string;
}) => {
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    title: "",
    value: 0,
    percentage: "0",
    description: "",
    color: "",
    visible: false,
  });

  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: label,
      value: value,
      percentage: percentage.toFixed(1),
      description: description || statusDescriptions[label] || `${label}: ${value} out of ${max} total.`,
      color,
      visible: true,
    });
  };

  return (
    <div
      style={{ textAlign: "center", cursor: "pointer" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700, color }}>{value}</div>
        </div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>{label}</div>
      <Tooltip data={tooltip} />
    </div>
  );
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    userStats: null,
    appointmentStats: null,
  });
  const [dateRange, setDateRange] = useState("all");

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [userStats, appointmentData] = await Promise.all([
        api.getUserStats(),
        api.getAppointments(),
      ]);

      setData({
        userStats: userStats as Stats,
        appointmentStats: {
          total: appointmentData.total,
          pending_count: appointmentData.pending_count,
          confirmed_count: appointmentData.confirmed_count,
          cancelled_count: appointmentData.cancelled_count,
          completed_count: appointmentData.completed_count,
        },
      });
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const userStats = data.userStats;
  const appointmentStats = data.appointmentStats;

  // Calculate percentages
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const completionRate = appointmentStats
    ? getPercentage(appointmentStats.completed_count, appointmentStats.total)
    : 0;

  const cancellationRate = appointmentStats
    ? getPercentage(appointmentStats.cancelled_count, appointmentStats.total)
    : 0;

  const confirmationRate = appointmentStats
    ? getPercentage(appointmentStats.confirmed_count, appointmentStats.total)
    : 0;

  // Chart data
  const userDistributionData = [
    { label: "Customers", value: userStats?.total_customers || 0, color: "#3b82f6" },
    { label: "Organisers", value: userStats?.total_organisers || 0, color: "#f59e0b" },
    { label: "Admins", value: userStats?.total_admins || 0, color: "#ef4444" },
  ];

  const appointmentStatusData = [
    { label: "Pending", value: appointmentStats?.pending_count || 0, color: "#f59e0b" },
    { label: "Confirmed", value: appointmentStats?.confirmed_count || 0, color: "#10b981" },
    { label: "Completed", value: appointmentStats?.completed_count || 0, color: "#6366f1" },
    { label: "Cancelled", value: appointmentStats?.cancelled_count || 0, color: "#ef4444" },
  ];

  // Mock weekly data
  const weeklyAppointments = [
    { label: "Mon", value: Math.floor(Math.random() * 20) + 5 },
    { label: "Tue", value: Math.floor(Math.random() * 20) + 5 },
    { label: "Wed", value: Math.floor(Math.random() * 20) + 5 },
    { label: "Thu", value: Math.floor(Math.random() * 20) + 5 },
    { label: "Fri", value: Math.floor(Math.random() * 20) + 5 },
    { label: "Sat", value: Math.floor(Math.random() * 15) + 3 },
    { label: "Sun", value: Math.floor(Math.random() * 10) + 2 },
  ];

  return (
    <div className="dashboard-page">
      {/* Add CSS animation for tooltips */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>View insights and statistics about your platform. Hover over charts for detailed information.</p>
        </div>
        <div className="header-actions" style={{ display: "flex", gap: "12px" }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input"
            style={{ width: "auto", marginBottom: 0 }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn btn-outline" onClick={fetchReportData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Loading report data...
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div
            className="stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div className="stat-card" style={{ position: "relative" }}>
              <div className="stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                <Users className="w-6 h-6" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{userStats?.total_users || 0}</span>
                <span className="stat-label">
                  Total Users{" "}
                  <InfoTooltip text="Total number of registered users on the platform, including customers, organisers, and admins." />
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                <Calendar className="w-6 h-6" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{appointmentStats?.total || 0}</span>
                <span className="stat-label">
                  Total Appointments{" "}
                  <InfoTooltip text="Total number of appointments created on the platform across all statuses." />
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{completionRate}%</span>
                <span className="stat-label">
                  Completion Rate{" "}
                  <InfoTooltip text="Percentage of appointments that were successfully completed out of all appointments." />
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{cancellationRate}%</span>
                <span className="stat-label">
                  Cancellation Rate{" "}
                  <InfoTooltip text="Percentage of appointments that were cancelled. Lower is better for business health." />
                </span>
              </div>
            </div>
          </div>

          {/* Radial Progress Cards */}
          <div className="dashboard-card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h3>
                Quick Stats Overview{" "}
                <InfoTooltip text="Visual representation of key metrics. Hover over each circle for more details." />
              </h3>
            </div>
            <div
              className="card-body"
              style={{
                padding: "24px",
                display: "flex",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              <RadialProgress
                value={userStats?.total_customers || 0}
                max={userStats?.total_users || 1}
                label="Customers"
                color="#3b82f6"
                description="Regular users who book appointments and use services on the platform."
              />
              <RadialProgress
                value={userStats?.total_organisers || 0}
                max={userStats?.total_users || 1}
                label="Organisers"
                color="#f59e0b"
                description="Service providers who manage appointments, set availability, and deliver services."
              />
              <RadialProgress
                value={appointmentStats?.confirmed_count || 0}
                max={appointmentStats?.total || 1}
                label="Confirmed"
                color="#10b981"
                description="Appointments that have been confirmed and are scheduled to take place."
              />
              <RadialProgress
                value={appointmentStats?.pending_count || 0}
                max={appointmentStats?.total || 1}
                label="Pending"
                color="#f59e0b"
                description="Appointments awaiting confirmation from the organiser."
              />
              <RadialProgress
                value={appointmentStats?.completed_count || 0}
                max={appointmentStats?.total || 1}
                label="Completed"
                color="#6366f1"
                description="Successfully finished appointments where the service was delivered."
              />
            </div>
          </div>

          {/* Charts Row 1: Pie Charts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            <div className="dashboard-card">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PieChart className="w-5 h-5" style={{ color: "#6366f1" }} />
                <h3>User Distribution</h3>
                <InfoTooltip text="Breakdown of users by role. Hover over each slice for detailed information about each user type." />
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <PieChartComponent data={userDistributionData} title="" size={180} />
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PieChart className="w-5 h-5" style={{ color: "#10b981" }} />
                <h3>Appointment Status</h3>
                <InfoTooltip text="Distribution of appointments by status. Hover over segments to see what each status means." />
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <DonutChart data={appointmentStatusData} title="" size={180} centerLabel="Total" />
              </div>
            </div>
          </div>

          {/* Charts Row 2: Bar Chart & Line Chart */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            <div className="dashboard-card">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 className="w-5 h-5" style={{ color: "#3b82f6" }} />
                <h3>Appointments by Status</h3>
                <InfoTooltip text="Bar chart comparing appointment counts by status. Hover over bars for details." />
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <BarChartComponent data={appointmentStatusData} title="" height={180} />
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity className="w-5 h-5" style={{ color: "#8b5cf6" }} />
                <h3>Weekly Trend</h3>
                <InfoTooltip text="Appointment activity trend throughout the week. Hover over points to see daily details." />
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <LineChartComponent
                  data={weeklyAppointments}
                  title=""
                  height={200}
                  width={400}
                  color="#8b5cf6"
                />
              </div>
            </div>
          </div>

          {/* Charts Row 3: Gauge Charts & Horizontal Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            <div className="dashboard-card">
              <div className="card-header">
                <h3>
                  Performance Metrics{" "}
                  <InfoTooltip text="Key performance indicators shown as gauge charts. Hover over each gauge for details." />
                </h3>
              </div>
              <div
                className="card-body"
                style={{
                  padding: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "20px",
                }}
              >
                <GaugeChart
                  value={completionRate}
                  title="Completion"
                  color="#10b981"
                  size={140}
                  description="Percentage of appointments successfully completed. Higher completion rates indicate good service delivery and customer satisfaction."
                />
                <GaugeChart
                  value={confirmationRate}
                  title="Confirmation"
                  color="#3b82f6"
                  size={140}
                  description="Percentage of appointments that have been confirmed. High confirmation rates mean organisers are actively managing their bookings."
                />
                <GaugeChart
                  value={cancellationRate}
                  title="Cancellation"
                  color="#ef4444"
                  size={140}
                  description="Percentage of appointments cancelled. Lower cancellation rates are better and indicate reliable booking behavior."
                />
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h3>
                  User Breakdown{" "}
                  <InfoTooltip text="Horizontal bar chart showing user distribution. Hover over bars for role descriptions." />
                </h3>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <HorizontalBarChart data={userDistributionData} title="" />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Platform Summary</h3>
              </div>
              <div className="card-body" style={{ padding: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Active Users</span>
                    <span style={{ fontWeight: 600 }}>{userStats?.active_users || 0}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Total Appointments</span>
                    <span style={{ fontWeight: 600 }}>{appointmentStats?.total || 0}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Pending Actions</span>
                    <span style={{ fontWeight: 600, color: "#f59e0b" }}>
                      {appointmentStats?.pending_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h3>Appointment Metrics</h3>
              </div>
              <div className="card-body" style={{ padding: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#dcfce7",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Confirmed</span>
                    <span style={{ fontWeight: 600, color: "#16a34a" }}>
                      {appointmentStats?.confirmed_count || 0}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#ede9fe",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Completed</span>
                    <span style={{ fontWeight: 600, color: "#7c3aed" }}>
                      {appointmentStats?.completed_count || 0}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#fee2e2",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Cancelled</span>
                    <span style={{ fontWeight: 600, color: "#dc2626" }}>
                      {appointmentStats?.cancelled_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h3>User Stats</h3>
              </div>
              <div className="card-body" style={{ padding: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#dbeafe",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Customers</span>
                    <span style={{ fontWeight: 600 }}>{userStats?.total_customers || 0}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#fef3c7",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Organisers</span>
                    <span style={{ fontWeight: 600 }}>{userStats?.total_organisers || 0}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      background: "#fee2e2",
                      borderRadius: "8px",
                    }}
                  >
                    <span>Admins</span>
                    <span style={{ fontWeight: 600 }}>{userStats?.total_admins || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
