"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Search, Filter, X, Star, Film, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PrimaryCard, PrimaryCardSkeleton } from "@/components/features/home/PrimaryCard";
import { searchAnime, type Anime } from "@/services/anime.service";

const GENRES = [
  "Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Drama",
  "Ecchi", "Fantasy", "Game", "Harem", "Hentai", "Historical", "Horror",
  "Josei", "Kids", "Magic", "Martial Arts", "Mecha", "Military", "Music",
  "Mystery", "Parody", "Police", "Psychological", "Romance", "Samurai",
  "School", "Sci-Fi", "Seinen", "Shoujo", "Shoujo Ai", "Shounen",
  "Shounen Ai", "Slice of Life", "Space", "Sports", "Super Power",
  "Supernatural", "Thriller", "Vampire", "Yaoi", "Yuri"
];

const YEARS = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());

const STATUS = ["Ongoing", "Completed", "Upcoming"];

const TYPES = ["TV", "Movie", "OVA", "Special", "ONA", "Music"];

const SORT = ["Most Popular", "Top Rated", "Airing", "Upcoming"];

const RATING = ["All", "9+", "8+", "7+", "6+"];

interface SearchFilters {
  genre?: string;
  year?: string;
  status?: string;
  type?: string;
  sort?: string;
  rating?: string;
}

export function SearchComponent() {
  const navigate = useNavigate();
  
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  const initialPage = parseInt(params.get("page") || "1");
  const initialGenre = params.get("genre") || "";
  const initialYear = params.get("year") || "";
  const initialStatus = params.get("status") || "";
  const initialType = params.get("type") || "";
  const initialSort = params.get("sort") || "";
  const initialRating = params.get("rating") || "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<SearchFilters>({
    genre: initialGenre,
    year: initialYear,
    status: initialStatus,
    type: initialType,
    sort: initialSort,
    rating: initialRating,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", debouncedQuery, page, filters],
    queryFn: () => searchAnime(debouncedQuery, page, {
      genre: filters.genre,
      year: filters.year ? parseInt(filters.year) : undefined,
      status: filters.status,
      type: filters.type,
      sort: filters.sort,
      min_score: filters.rating && filters.rating !== "All" ? parseInt(filters.rating) : undefined,
    }),
    staleTime: 5 * 60 * 1000,
  });

  const updateURL = useCallback((newQuery: string, newPage: number, newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (newQuery) params.set("q", newQuery);
    if (newPage > 1) params.set("page", newPage.toString());
    if (newFilters.genre) params.set("genre", newFilters.genre);
    if (newFilters.year) params.set("year", newFilters.year);
    if (newFilters.status) params.set("status", newFilters.status);
    if (newFilters.type) params.set("type", newFilters.type);
    if (newFilters.sort) params.set("sort", newFilters.sort);
    if (newFilters.rating && newFilters.rating !== "All") params.set("rating", newFilters.rating);
    
    navigate({ to: `/search?${params.toString()}`, replace: false });
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL(query, 1, filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const resolved = value === "__all__" ? "" : value;
    const newFilters = { ...filters, [key]: resolved };
    setFilters(newFilters);
    setPage(1);
    updateURL(debouncedQuery, 1, newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
    updateURL(debouncedQuery, 1, {});
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== "All");

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted/60 border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:bg-muted transition-all"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 rounded-lg border-border text-muted-foreground hover:text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 bg-custom text-black">
              {Object.values(filters).filter(v => v && v !== "All").length}
            </Badge>
          )}
        </Button>
      </form>

      {showFilters && (
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Genre</label>
              <Select
                value={filters.genre || "__all__"}
                onValueChange={(value) => handleFilterChange("genre", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Genres</SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <Select
                value={filters.year || "__all__"}
                onValueChange={(value) => handleFilterChange("year", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Years</SelectItem>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={filters.status || "__all__"}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  {STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select
                value={filters.type || ""}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  {TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Sort</label>
              <Select
                value={filters.sort || ""}
                onValueChange={(value) => handleFilterChange("sort", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Default</SelectItem>
                  {SORT.map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {sort}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Rating</label>
              <Select
                value={filters.rating || "All"}
                onValueChange={(value) => handleFilterChange("rating", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  {RATING.map((rating) => (
                    <SelectItem key={rating} value={rating}>
                      {rating === "All" ? "All Ratings" : `${rating}+ Rating`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Active:</span>
              {filters.genre && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-custom/10 text-custom border border-custom/20">
                  {filters.genre}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground"
                    onClick={() => handleFilterChange("genre", "")}
                  />
                </span>
              )}
              {filters.year && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-custom/10 text-custom border border-custom/20">
                  {filters.year}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground"
                    onClick={() => handleFilterChange("year", "")}
                  />
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-custom/10 text-custom border border-custom/20">
                  {filters.status}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground"
                    onClick={() => handleFilterChange("status", "")}
                  />
                </span>
              )}
              {filters.rating && filters.rating !== "All" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-custom/10 text-custom border border-custom/20">
                  {filters.rating}+
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground"
                    onClick={() => handleFilterChange("rating", "All")}
                  />
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <PrimaryCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Failed to load search results</p>
        </div>
      ) : data?.animes.length === 0 ? (
        <div className="text-center py-20">
          <Film className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground/70 mb-2">No results found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data?.animes.map((anime) => (
              <PrimaryCard key={anime.id} anime={anime} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  updateURL(debouncedQuery, newPage, filters);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-muted text-muted-foreground hover:text-foreground border border-border"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  updateURL(debouncedQuery, newPage, filters);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-muted text-muted-foreground hover:text-foreground border border-border"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}