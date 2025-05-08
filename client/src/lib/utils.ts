import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date function
export function formatDate(date: string | Date, formatStr: string = "dd MMM yyyy"): string {
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return format(parsedDate, formatStr, { locale: ru });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

// Format price function
export function formatPrice(price: number, currency: string = "₽"): string {
  return price.toLocaleString("ru-RU") + " " + currency;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Get user initials from full name
export function getUserInitials(fullName: string): string {
  if (!fullName) return "?";
  
  const names = fullName.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
}

// Generate random avatar color
export function getAvatarColor(id: number): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  
  return colors[id % colors.length];
}

// Get status color
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    canceled: "bg-red-100 text-red-800",
    sell: "bg-accent text-white",
    rent: "bg-secondary text-white",
    buy: "bg-primary text-white",
  };
  
  return statusColors[status] || "bg-gray-100 text-gray-800";
}

// Get category color
export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    repair: "bg-blue-100 text-blue-800",
    construction: "bg-yellow-100 text-yellow-800",
    design: "bg-purple-100 text-purple-800",
    finishing: "bg-pink-100 text-pink-800",
    equipment: "bg-orange-100 text-orange-800",
    tools: "bg-green-100 text-green-800",
    materials: "bg-teal-100 text-teal-800",
    services: "bg-indigo-100 text-indigo-800",
  };
  
  return categoryColors[category] || "bg-gray-100 text-gray-800";
}

// Generate placeholder image URL
export function getPlaceholderImage(category: string): string {
  const imageMapping: Record<string, string> = {
    equipment: "images/marketplace/tower-crane.svg",
    tools: "images/marketplace/scaffolding.svg",
    materials: "images/marketplace/bricks.svg",
    services: "images/tenders/finishing-works.svg",
  };
  
  return imageMapping[category] || "images/tenders/residential-project.svg";
}
