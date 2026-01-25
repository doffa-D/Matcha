import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Filter, Search, ChevronUp, X } from "lucide-react";
import { FilterState, FILTER_DEFAULTS } from "@/types";
import { INITIAL_FILTERS } from "@/lib/constants";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { useDebounce } from "@/hooks/useDebounce";
import { Slider } from "./ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { getTags } from "@/api/tags";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "@/api/types";

interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const ExpandableBox = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Collapsed state */}
      <div
        className="w-full h-[90px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden group"
        onClick={() => setOpen(!open)}
      >
        <img
          src="https://media.istockphoto.com/id/664767884/vector/doodle-style-world-map-look-like-children-craft-painting.jpg?s=612x612&w=is&k=20&c=UVfhwnmf6moWcD5mXIyGUDTx_sE8vejAckgaW0dbqA4="
          alt="World map preview"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <span className="text-white text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
            {open ? "Hide Map" : "Click to view map"}
          </span>
        </div>
      </div>

      {/* Expanded state via Portal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30"
                  style={{ zIndex: 99998 }}
                  onClick={() => setOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 200 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 200 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                  style={{ zIndex: 99999 }}
                >
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-white hover:bg-neutral-100 rounded-full transition-colors shadow-md z-10"
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </button>

                  <div className="w-full h-full overflow-hidden">
                    <img
                      src="https://media.istockphoto.com/id/664767884/vector/doodle-style-world-map-look-like-children-craft-painting.jpg?s=612x612&w=is&k=20&c=UVfhwnmf6moWcD5mXIyGUDTx_sE8vejAckgaW0dbqA4="
                      alt="Doodle-style world map"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
export const FilterSidebar = ({ filters, setFilters }: FilterSidebarProps) => {
  const [tagSearch, setTagSearch] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  // Fetch tags from API
  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await getTags();
      return response.data;
    },
  });

  const allTags = tagsData?.tags ?? [];

  // Local state for immediate UI updates (before debounce)
  const [localAgeRange, setLocalAgeRange] = useState<[number, number]>(
    filters.ageRange ?? FILTER_DEFAULTS.ageRange,
  );
  const [localDistance, setLocalDistance] = useState<number>(
    filters.distance ?? FILTER_DEFAULTS.distance,
  );
  const [localFameRange, setLocalFameRange] = useState<[number, number]>(
    filters.fameRange ?? FILTER_DEFAULTS.fameRange,
  );

  // Debounce the values before applying to filters
  const debouncedAgeRange = useDebounce(localAgeRange, 500);
  const debouncedDistance = useDebounce(localDistance, 500);
  const debouncedFameRange = useDebounce(localFameRange, 500);

  // Update filters when debounced values change
  useEffect(() => {
    setFilters((prev) => ({ ...prev, ageRange: debouncedAgeRange }));
  }, [debouncedAgeRange, setFilters]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, distance: debouncedDistance }));
  }, [debouncedDistance, setFilters]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, fameRange: debouncedFameRange }));
  }, [debouncedFameRange, setFilters]);

  // Get display values (use defaults if filter not applied)
  const displayAgeRange = filters.ageRange ?? FILTER_DEFAULTS.ageRange;
  const displayDistance = filters.distance ?? FILTER_DEFAULTS.distance;
  const displayFameRange = filters.fameRange ?? FILTER_DEFAULTS.fameRange;

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return allTags;
    const search = tagSearch.toLowerCase();
    return allTags.filter((tag) => tag.tag_name.toLowerCase().includes(search));
  }, [tagSearch, allTags]);

  // Display limited or all tags
  const displayedTags = showAllTags ? filteredTags : filteredTags.slice(0, 10);

  // Check if a tag is selected (by ID)
  const isTagSelected = (tagId: number) => filters.tags.includes(tagId);

  // Toggle tag selection (by ID)
  const toggleTag = (tagId: number) => {
    const newTags = isTagSelected(tagId)
      ? filters.tags.filter((id) => id !== tagId)
      : [...filters.tags, tagId];
    setFilters({ ...filters, tags: newTags });
  };

  return (
    <div className="w-[320px] shrink-0 hidden lg:flex sticky top-[6.5rem] h-[calc(100vh-130px)] bg-white rounded-xl shadow-nav border border-neutral-200 overflow-hidden flex-col self-start">
      <div className="flex-1 overflow-y-auto p-6 pb-[114px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filters
          </h2>
          <button
            onClick={() => {
              setFilters(INITIAL_FILTERS);
              setLocalAgeRange(FILTER_DEFAULTS.ageRange);
              setLocalDistance(FILTER_DEFAULTS.distance);
              setLocalFameRange(FILTER_DEFAULTS.fameRange);
              setTagSearch("");
              setShowAllTags(false);
            }}
            className="text-sm text-matcha font-medium hover:underline"
          >
            Reset
          </button>
        </div>

        {/* Age Range */}
        <div className="mb-8">
          <div className="flex justify-between mb-6">
            <label className="text-sm font-semibold text-neutral-900">
              Age
            </label>
            {/* <span className="text-sm text-neutral-700">
            {filters.ageRange
              ? `${localAgeRange[0]} - ${localAgeRange[1]}`
              : "Any"}
          </span> */}
          </div>
          {/* <DualRangeSlider
          min={18}
          max={60}
          step={1}
          value={localAgeRange}
          onValueChange={setLocalAgeRange}
          label={(value) => value}
        /> */}
          <DualRangeSlider
            label={(value) => value}
            value={localAgeRange}
            onValueChange={(values) =>
              setLocalAgeRange([values[0], values[1]] as [number, number])
            }
            min={18}
            max={60}
            step={1}
          />
        </div>

        {/* Distance */}
        <div className="mb-8">
          <div className="flex justify-between mb-6">
            <label className="text-sm font-semibold text-neutral-900">
              Distance
            </label>
            <span className="text-sm text-neutral-700">
              {filters.distance ? `${localDistance} km` : "Any"}
            </span>
          </div>
          <Slider
            value={[localDistance]}
            onValueChange={(values) => setLocalDistance(values[0])}
            min={1}
            max={10000}
            step={1}
          />
        </div>

        {/* Fame Rating */}
        <div className="mb-8">
          <div className="flex justify-between mb-6">
            <label className="text-sm font-semibold text-neutral-900">
              Fame Rating
            </label>
            {/* <span className="text-sm text-neutral-700">
            {filters.fameRange
              ? `${localFameRange[0]} - ${localFameRange[1]}`
              : "Any"}
          </span> */}
          </div>
          <DualRangeSlider
            label={(value) => value}
            value={localFameRange}
            onValueChange={(values) =>
              setLocalFameRange([values[0], values[1]] as [number, number])
            }
            min={0}
            max={100}
            step={1}
          />
        </div>

        {/* Tags */}
        <div className="mb-8">
          <label className="text-sm font-semibold text-neutral-900 mb-3 block">
            Interests
          </label>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          </div>

          <div className="flex flex-wrap gap-2">
            {isLoadingTags ? (
              <span className="text-sm text-neutral-400">Loading tags...</span>
            ) : displayedTags.length > 0 ? (
              displayedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-[13px] transition-colors ${
                    isTagSelected(tag.id)
                      ? "bg-matcha-light text-matcha border border-matcha"
                      : "bg-neutral-50 text-neutral-700 border border-transparent hover:bg-neutral-100"
                  }`}
                >
                  {tag.tag_name}
                </button>
              ))
            ) : null}
          </div>

          {filteredTags.length > 10 && !showAllTags && (
            <button
              onClick={() => setShowAllTags(true)}
              className="text-sm text-matcha font-medium mt-3 hover:underline"
            >
              View all ({filteredTags.length - 10} more)
            </button>
          )}

          {showAllTags && filteredTags.length > 10 && (
            <button
              onClick={() => setShowAllTags(false)}
              className="text-sm text-matcha font-medium mt-3 hover:underline"
            >
              Show less
            </button>
          )}

          {filteredTags.length === 0 && tagSearch && (
            <p className="text-sm text-neutral-400 py-2">
              No tags found for "{tagSearch}"
            </p>
          )}

          {/* Show selected tags count */}
          {filters.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-500">
                {filters.tags.length} tag{filters.tags.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section - full width, 90px height */}
      <div className="absolute bottom-0 left-0 w-full h-[90px]  border-neutral-200 flex items-center justify-center  bg-white">
        <ExpandableBox />
      </div>
    </div>
  );
};
