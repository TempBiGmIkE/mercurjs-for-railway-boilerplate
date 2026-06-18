export type HeroCampaignData = {
  id: string
  heading: string
  paragraph: string
  image: string
  buttons: { label: string; path: string }[]
  campaignLabel?: string
}

const heroCampaigns: HeroCampaignData[] = [
  {
    id: "campaign-1",
    campaignLabel: "Flash sale",
    heading: "Drop everything for our hottest deals",
    paragraph:
      "Discover exclusive discounts on top brands today — fast shipping and rare finds for every style.",
    image: "/images/hero/Image.jpg",
    buttons: [
      { label: "Shop sale", path: "/categories" },
      { label: "Browse new", path: "/collections/new-arrivals" },
    ],
  },
  {
    id: "campaign-2",
    campaignLabel: "New arrivals",
    heading: "Fresh styles landed for your next look",
    paragraph:
      "Update your wardrobe with the latest drops curated for bold, modern outfits and instant street appeal.",
    image: "/images/hero/Image.jpg",
    buttons: [
      { label: "Shop new", path: "/categories" },
      { label: "Sell old", path: "/sell" },
    ],
  },
  {
    id: "campaign-3",
    campaignLabel: "Limited time",
    heading: "Style essentials that disappear quickly",
    paragraph:
      "Grab standout pieces before they’re gone — premium selection, limited runs, and fast checkout.",
    image: "/images/hero/Image.jpg",
    buttons: [
      { label: "Explore now", path: "/categories" },
      { label: "Become a seller", path: "/vendor" },
    ],
  },
  {
    id: "campaign-4",
    campaignLabel: "Curated edit",
    heading: "Find your signature outfit in every season",
    paragraph:
      "Shop expertly selected collections for effortless style, from daily staples to statement looks.",
    image: "/images/hero/Image.jpg",
    buttons: [
      { label: "Shop edit", path: "/categories" },
      { label: "See campaign", path: "/campaigns/highlights" },
    ],
  },
  {
    id: "campaign-5",
    campaignLabel: "Member favorite",
    heading: "Top-rated finds loved by our community",
    paragraph:
      "Join millions of shoppers discovering highly rated pieces and trending marketplace collections.",
    image: "/images/hero/Image.jpg",
    buttons: [
      { label: "Shop favorites", path: "/categories" },
      { label: "Join now", path: "/account/signup" },
    ],
  },
]

export function getHeroCampaignData(
  variant?: number | string
): HeroCampaignData {
  const index = typeof variant === "number"
    ? Math.abs(variant) % heroCampaigns.length
    : typeof variant === "string"
      ? Array.from(variant).reduce((sum, char) => sum + char.charCodeAt(0), 0) % heroCampaigns.length
      : Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % heroCampaigns.length

  return heroCampaigns[index]
}

export function getHeroCampaigns(): HeroCampaignData[] {
  return [...heroCampaigns]
}
