import { Calendar, MapPin, Activity, Check, X } from "lucide-react";
import type { DateProposal } from "@/api/types";

interface DateMessageBubbleProps {
  proposal: DateProposal;
  isMine: boolean;
  onAccept?: (proposalId: number) => void;
  onDecline?: (proposalId: number) => void;
  isResponding?: boolean;
}

export function DateMessageBubble({
  proposal,
  isMine,
  onAccept,
  onDecline,
  isResponding,
}: DateMessageBubbleProps) {
  const { id, date_time, location, activity, status, created_at } = proposal;

  // Format date and time
  const dateObj = new Date(date_time);
  const formattedDate = dateObj.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const createdTime = new Date(created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Status styling
  const getStatusStyle = () => {
    return "bg-white border-neutral-200";
  };

  const getStatusBadge = () => {
    switch (status) {
      case "accepted":
        return (
          <div className="flex items-center gap-1 text-matcha text-xs font-semibold">
            <Check className="w-4 h-4" />
            Accepted
          </div>
        );
      case "declined":
        return (
          <div className="flex items-center gap-1 text-neutral-600 text-xs font-semibold">
            <X className="w-4 h-4" />
            Declined
          </div>
        );
      default:
        return (
          <div className="text-neutral-600 text-xs font-semibold">
            Pending
          </div>
        );
    }
  };

  const showActions = !isMine && status === "pending";

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      <div className={`max-w-[70%] min-w-[280px]`}>
        <div
          className={`border rounded-2xl ${
            isMine ? "rounded-br-sm" : "rounded-bl-sm"
          } ${getStatusStyle()} shadow-sm p-4 space-y-3`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-matcha" />
              <span className="font-bold text-neutral-900">Date Proposal</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Date Details */}
          <div className="space-y-2 bg-white/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-neutral-900">{formattedDate}</div>
                <div className="text-sm text-neutral-600">{formattedTime}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-neutral-900">{location}</div>
            </div>

            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-neutral-900">{activity}</div>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onDecline?.(id)}
                disabled={isResponding}
                className="flex-1 h-9 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
              <button
                onClick={() => onAccept?.(id)}
                disabled={isResponding}
                className="flex-1 h-9 px-3 bg-matcha hover:bg-matcha/90 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`text-xs text-neutral-400 mt-1 block ${
            isMine ? "text-right mr-2" : "ml-2"
          }`}
        >
          {createdTime}
        </span>
      </div>
    </div>
  );
}
