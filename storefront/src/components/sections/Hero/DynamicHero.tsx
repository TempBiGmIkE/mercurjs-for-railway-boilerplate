import { Hero } from "./Hero"
import { getHeroCampaignData } from "@/lib/data/hero"

type DynamicHeroProps = {
  variant?: number | string
}

export const DynamicHero = ({ variant }: DynamicHeroProps) => {
  const { image, heading, paragraph, buttons, campaignLabel } =
    getHeroCampaignData(variant)

  return (
    <Hero
      image={image}
      heading={heading}
      paragraph={paragraph}
      buttons={buttons}
      campaignLabel={campaignLabel}
    />
  )
}
