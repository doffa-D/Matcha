import { useState } from "react";
import { Calendar, MapPin, Activity, X } from "lucide-react";
import Button from "./ui/button";

interface DateProposalFormProps {
  onSubmit: (data: { date_time: string; location: string; activity: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ACTIVITY_OPTIONS = [
  "Coffee",
  "Dinner",
  "Drinks",
  "Movie",
  "Walk",
  "Museum",
  "Concert",
  "Other"
];

export function DateProposalForm({ onSubmit, onCancel, isSubmitting }: DateProposalFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [activity, setActivity] = useState("Coffee");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !location || !activity) {
      alert("Please fill in all fields");
      return;
    }

    // Combine date and time into ISO format
    const dateTime = `${date}T${time}:00`;
    
    onSubmit({
      date_time: dateTime,
      location: location.trim(),
      activity: activity.trim(),
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-neutral-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-matcha" />
          Propose a Date
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
          type="button"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            required
            className="w-full h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha"
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha"
          />
        </div>

        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Cafe Matcha, Downtown"
            maxLength={255}
            required
            className="w-full h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha"
          />
        </div>

        {/* Activity Dropdown */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Activity
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
            className="w-full h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha"
          >
            {ACTIVITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-10 px-4 bg-matcha hover:bg-matcha/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Send Proposal"}
          </button>
        </div>
      </form>
    </div>
  );
}
