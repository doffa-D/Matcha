import { FilterSidebar } from "@/components/filter-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ProfileCard } from "@/components/profile-card";
import { ProtectedRoute } from "@/components/protected-route";
import Button from "@/components/ui/button";
import { INITIAL_FILTERS } from "@/lib/constants";
import { FilterState, User } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { getSuggestionsPaginated } from "@/api/users";
import { BrowsingUser, BrowsingFilters } from "@/api/types";
import { Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/discover/")({
  component: () => (
    <ProtectedRoute>
      <App />
    </ProtectedRoute>
  ),
});

function App() {
  const activeTab = "discover";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-matcha/20 selection:text-matcha-dark">
      <Navbar activeTab={activeTab} />
      <main className="top-20">
        <DiscoverPage />
      </main>
      <Footer />
      <MobileNav activeTab={activeTab} />
    </div>
  );
}

// Transform BrowsingUser from API to local User type for ProfileCard
const transformToUser = (browsingUser: BrowsingUser): User => ({
  id: String(browsingUser.id),
  name: `${browsingUser.first_name} ${browsingUser.last_name}`,
  username: browsingUser.username,
  age: browsingUser.age ?? 0,
  location: "", // API doesn't return location name, just distance
  distance: Math.round(browsingUser.distance_km),
  bio: browsingUser.bio ?? "",
  tags: browsingUser.tags,
  // Convert API fame_rating (0-5) to frontend scale (0-100)
  fameRating: Math.round(browsingUser.fame_rating * 20),
  photos: browsingUser.profile_image ? [browsingUser.profile_image] : [],
  isOnline: browsingUser.is_online,
  lastSeen: browsingUser.last_online ?? undefined,
  verified: false, // API doesn't include verification status in browsing
});

// Map FilterState to BrowsingFilters for API
// Only includes params that are explicitly set (non-null)
const mapFiltersToApiParams = (
  filters: FilterState,
): Omit<BrowsingFilters, "page" | "limit"> => {
  const sortMap: Record<FilterState["sortBy"], BrowsingFilters["sort"]> = {
    distance: "distance",
    age: "age",
    fame: "fame_rating",
    tags: "common_tags",
  };

  // Determine sort order based on sort field
  const orderMap: Record<FilterState["sortBy"], "asc" | "desc"> = {
    distance: "asc",
    age: "asc",
    fame: "desc",
    tags: "desc",
  };

  const params: Omit<BrowsingFilters, "page" | "limit"> = {
    sort: sortMap[filters.sortBy],
    order: orderMap[filters.sortBy],
  };

  // Only add age filters if explicitly set
  if (filters.ageRange !== null) {
    params.min_age = filters.ageRange[0];
    params.max_age = filters.ageRange[1];
  }

  // Only add distance filter if explicitly set
  if (filters.distance !== null) {
    params.max_distance = filters.distance;
  }

  // Only add fame filters if explicitly set (convert 0-100 to 0-5)
  if (filters.fameRange !== null) {
    params.min_fame = filters.fameRange[0] / 20;
    params.max_fame = filters.fameRange[1] / 20;
  }

  // Only add tags if any selected
  if (filters.tags.length > 0) {
    params.tags = filters.tags.join(",");
  }

  return params;
};

const ITEMS_PER_PAGE = 12;

function DiscoverPage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["suggestions", filters],
    queryFn: async ({ pageParam }) => {
      const apiFilters = mapFiltersToApiParams(filters);
      const response = await getSuggestionsPaginated(
        pageParam,
        ITEMS_PER_PAGE,
        apiFilters,
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });

  // Flatten all pages into a single array of users
  const users =
    data?.pages.flatMap((page) => page.users.map(transformToUser)) ?? [];

  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <FilterSidebar filters={filters} setFilters={setFilters} />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              Suggested Matches
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Sort by:</span>
              <select
                className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as FilterState["sortBy"],
                  }))
                }
              >
                <option value="distance">Distance</option>
                <option value="fame">Fame Rating</option>
                <option value="age">Age</option>
                <option value="tags">Common Tags</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-matcha" />
              <span className="ml-3 text-neutral-500">Finding matches...</span>
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">
                {error instanceof Error
                  ? error.message
                  : "Failed to load profiles"}
              </p>
              <Button variant="secondary" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && users.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-500 mb-2">No matches found</p>
              <p className="text-sm text-neutral-400">
                Try adjusting your filters
              </p>
            </div>
          )}

          {/* Users Grid */}
          {!isLoading && !isError && users.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
                {users.map((user) => (
                  <ProfileCard key={user.id} user={user} />
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="mt-12 text-center">
                  <Button
                    variant="secondary"
                    className="w-full md:w-auto"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      `Load More (${totalCount - users.length} remaining)`
                    )}
                  </Button>
                </div>
              )}

              {/* Results count */}
              {totalCount > 0 && (
                <div className="mt-4 text-center text-sm text-neutral-400">
                  Showing {users.length} of {totalCount} profiles
                  {isFetching && !isFetchingNextPage && (
                    <Loader2 className="w-3 h-3 animate-spin inline ml-2" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
